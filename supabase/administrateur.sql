-- Mx Chimie : mesure d'audience + espace administrateur.
-- À exécuter une fois dans Supabase (SQL Editor). Déjà appliqué sur le projet mx-chimie.
--
-- Sécurité :
--  * les comptes et sessions administrateur vivent dans le schéma privé "mx_admin",
--    que l'API publique ne voit pas ;
--  * les mots de passe sont hachés en bcrypt (pgcrypto), jamais stockés en clair ;
--  * le tableau de bord ne lit les données qu'à travers des fonctions qui exigent
--    un jeton de session valide (12 h) ;
--  * 5 échecs de connexion bloquent le compte 15 minutes.
--
-- Les fonctions de suppression (déconnexion, suppression d'une demande ou d'un compte)
-- sont dans administrateur-suppression.sql.
--
-- Premier compte (à faire une seule fois, puis changer ou supprimer ce compte) :
--   insert into mx_admin.administrateurs (identifiant, mot_de_passe)
--   values ('admin', extensions.crypt('VOTRE_MOT_DE_PASSE', extensions.gen_salt('bf', 10)));

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Mesure d'audience (anonyme : identifiant aléatoire, pas d'IP, pas de cookie tiers)
-- ---------------------------------------------------------------------------
create table if not exists public.evenements (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visiteur   uuid not null,
  session    uuid not null,
  type       text not null check (type in (
               'page_vue', 'clic_cta', 'contact_envoye',
               'formulaire_ouvert', 'formulaire_commence', 'formulaire_etape', 'formulaire_envoye')),
  page       text check (char_length(page) <= 300),
  source     text check (char_length(source) <= 200),
  appareil   text check (appareil in ('mobile', 'tablette', 'ordinateur')),
  detail     text check (char_length(detail) <= 120),
  etape      smallint check (etape between 0 and 20)
);
create index if not exists evenements_date_idx on public.evenements (created_at desc);
create index if not exists evenements_type_date_idx on public.evenements (type, created_at desc);

alter table public.evenements enable row level security;
create policy "Mesure d'audience : insertion seule" on public.evenements
  for insert to anon, authenticated with check (true);

-- Le visiteur ne peut écrire que ces colonnes (ni la date, ni l'id), et ne peut rien lire.
revoke all on public.evenements from anon, authenticated;
grant insert (visiteur, session, type, page, source, appareil, detail, etape)
  on public.evenements to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Comptes administrateur (schéma privé)
-- ---------------------------------------------------------------------------
create schema if not exists mx_admin;
revoke all on schema mx_admin from public, anon, authenticated;

create table if not exists mx_admin.administrateurs (
  id                 uuid primary key default gen_random_uuid(),
  identifiant        text not null unique check (identifiant ~ '^[a-z0-9._-]{3,40}$'),
  mot_de_passe       text not null, -- hash bcrypt
  created_at         timestamptz not null default now(),
  derniere_connexion timestamptz,
  echecs             int not null default 0,
  bloque_jusqu       timestamptz
);

create table if not exists mx_admin.sessions (
  jeton_hash bytea primary key, -- sha256 du jeton, le jeton lui-même n'est jamais stocké
  admin_id   uuid not null references mx_admin.administrateurs (id) on delete cascade,
  created_at timestamptz not null default now(),
  expire_le  timestamptz not null
);

alter table mx_admin.administrateurs enable row level security;
alter table mx_admin.sessions enable row level security;

-- Vérifie un jeton et renvoie l'id de l'administrateur (sinon erreur 28000).
create or replace function mx_admin.verifier(p_jeton text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select s.admin_id into v_id from mx_admin.sessions s
   where s.jeton_hash = extensions.digest(coalesce(p_jeton, ''), 'sha256')
     and s.expire_le > now();
  if v_id is null then
    raise exception 'Session expirée, reconnectez-vous.' using errcode = '28000';
  end if;
  return v_id;
end $$;
revoke all on function mx_admin.verifier(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Fonctions appelées par le tableau de bord
-- ---------------------------------------------------------------------------

-- Connexion : renvoie un jeton de session. Pas d'exception sur un échec,
-- pour que le compteur d'échecs soit bien enregistré.
create or replace function public.admin_connexion(p_identifiant text, p_mot_de_passe text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  a mx_admin.administrateurs;
  v_jeton text;
  v_expire timestamptz := now() + interval '12 hours';
begin
  select * into a from mx_admin.administrateurs
   where identifiant = lower(trim(coalesce(p_identifiant, '')));

  if a.id is null then
    perform extensions.crypt('x', extensions.gen_salt('bf', 10)); -- même durée qu'un vrai essai
    return json_build_object('ok', false, 'erreur', 'Identifiant ou mot de passe incorrect.');
  end if;

  if a.bloque_jusqu is not null and a.bloque_jusqu > now() then
    return json_build_object('ok', false, 'erreur',
      'Trop de tentatives. Réessayez dans ' || ceil(extract(epoch from a.bloque_jusqu - now()) / 60) || ' min.');
  end if;

  if extensions.crypt(coalesce(p_mot_de_passe, ''), a.mot_de_passe) <> a.mot_de_passe then
    update mx_admin.administrateurs
       set echecs = case when echecs + 1 >= 5 then 0 else echecs + 1 end,
           bloque_jusqu = case when echecs + 1 >= 5 then now() + interval '15 minutes' else null end
     where id = a.id;
    return json_build_object('ok', false, 'erreur', 'Identifiant ou mot de passe incorrect.');
  end if;

  update mx_admin.administrateurs
     set echecs = 0, bloque_jusqu = null, derniere_connexion = now()
   where id = a.id;

  v_jeton := encode(extensions.gen_random_bytes(32), 'hex');
  insert into mx_admin.sessions (jeton_hash, admin_id, expire_le)
  values (extensions.digest(v_jeton, 'sha256'), a.id, v_expire);

  return json_build_object(
    'ok', true,
    'jeton', v_jeton,
    'identifiant', a.identifiant,
    'expire_le', v_expire,
    'mot_de_passe_defaut', extensions.crypt('admin', a.mot_de_passe) = a.mot_de_passe
  );
end $$;

-- Toutes les statistiques en un appel. p_jours = null : depuis le début.
create or replace function public.admin_tableau(p_jeton text, p_jours int default 30)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_debut date;
  v_depuis timestamptz;
  r json;
begin
  perform mx_admin.verifier(p_jeton);

  if p_jours is null then
    v_debut := coalesce(least(
      (select min(created_at) from public.evenements),
      (select min(created_at) from public.demandes))::date, current_date);
  else
    v_debut := current_date - (greatest(p_jours, 1) - 1);
  end if;
  v_depuis := v_debut::timestamptz;

  with ev as (select * from public.evenements where created_at >= v_depuis),
       vues as (select * from ev where type = 'page_vue'),
       dem as (select * from public.demandes where created_at >= v_depuis)
  select json_build_object(
    'debut', v_debut,
    'en_ligne', (select count(distinct visiteur) from public.evenements
                  where created_at > now() - interval '5 minutes'),
    'totaux', (select json_build_object(
        'visiteurs',           count(distinct visiteur) filter (where type = 'page_vue'),
        'sessions',            count(distinct session)  filter (where type = 'page_vue'),
        'pages_vues',          count(*)                 filter (where type = 'page_vue'),
        'clics_cta',           count(*)                 filter (where type = 'clic_cta'),
        'visiteurs_cta',       count(distinct visiteur) filter (where type = 'clic_cta'),
        'contacts',            count(*)                 filter (where type = 'contact_envoye'),
        'formulaire_ouvert',   count(distinct visiteur) filter (where type = 'formulaire_ouvert'),
        'formulaire_commence', count(distinct visiteur) filter (where type = 'formulaire_commence'),
        'demandes',            (select count(*) from dem)
      ) from ev),
    'par_jour', (select coalesce(json_agg(j order by j.jour), '[]'::json) from (
        select d::date as jour,
               (select count(distinct v.visiteur) from vues v where v.created_at::date = d::date) as visiteurs,
               (select count(*) from vues v where v.created_at::date = d::date) as pages_vues,
               (select count(*) from dem x where x.created_at::date = d::date) as demandes
          from generate_series(v_debut, current_date, interval '1 day') d) j),
    'entonnoir', (select coalesce(json_agg(e order by e.etape), '[]'::json) from (
        select s.etape,
               (select count(distinct x.visiteur) from ev x
                 where (s.etape = 0 and x.type = 'formulaire_ouvert')
                    or (s.etape between 1 and 5 and x.type = 'formulaire_etape' and x.etape >= s.etape)
                    or (s.etape = 6 and x.type = 'formulaire_envoye')) as visiteurs
          from generate_series(0, 6) as s(etape)) e),
    'sources', (select coalesce(json_agg(s), '[]'::json) from (
        select coalesce(nullif(source, ''), 'Accès direct') as nom, count(distinct visiteur) as visiteurs
          from vues group by 1 order by 2 desc, 1 limit 8) s),
    'pages', (select coalesce(json_agg(p), '[]'::json) from (
        select coalesce(page, '/') as nom, count(*) as vues, count(distinct visiteur) as visiteurs
          from vues group by 1 order by 2 desc, 1 limit 8) p),
    'appareils', (select coalesce(json_agg(a), '[]'::json) from (
        select coalesce(appareil, 'inconnu') as nom, count(distinct visiteur) as visiteurs
          from vues group by 1 order by 2 desc) a),
    'cta', (select coalesce(json_agg(c), '[]'::json) from (
        select coalesce(detail, 'Autre') as nom, count(*) as clics
          from ev where type = 'clic_cta' group by 1 order by 2 desc, 1 limit 8) c),
    'structures', (select coalesce(json_agg(s), '[]'::json) from (
        select structure as nom, count(*) as demandes from dem group by 1 order by 2 desc, 1) s),
    'types_demande', (select coalesce(json_agg(t), '[]'::json) from (
        select u as nom, count(*) as demandes from dem, unnest(dem.demandes) u
         group by 1 order by 2 desc, 1) t),
    'dernieres_vues', (select coalesce(json_agg(v), '[]'::json) from (
        select created_at, page, source, appareil, left(visiteur::text, 8) as visiteur
          from vues order by created_at desc limit 50) v),
    -- La liste complète des demandes, sans filtre de période.
    'liste_demandes', (select coalesce(json_agg(d order by d.created_at desc), '[]'::json) from (
        select id, created_at, nom, email, structure, demandes, message from public.demandes) d)
  ) into r;

  return r;
end $$;

create or replace function public.admin_comptes(p_jeton text)
returns json language plpgsql security definer set search_path = '' as $$
declare v_moi uuid := mx_admin.verifier(p_jeton);
begin
  return (select coalesce(json_agg(c order by c.created_at), '[]'::json) from (
    select id, identifiant, created_at, derniere_connexion, id = v_moi as moi
      from mx_admin.administrateurs) c);
end $$;

create or replace function public.admin_creer_compte(p_jeton text, p_identifiant text, p_mot_de_passe text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id text := lower(trim(coalesce(p_identifiant, '')));
begin
  perform mx_admin.verifier(p_jeton);
  if v_id !~ '^[a-z0-9._-]{3,40}$' then
    raise exception 'Identifiant : 3 à 40 caractères (lettres, chiffres, . _ -).';
  end if;
  if char_length(coalesce(p_mot_de_passe, '')) < 8 then
    raise exception 'Le mot de passe doit faire au moins 8 caractères.';
  end if;
  if exists (select 1 from mx_admin.administrateurs where identifiant = v_id) then
    raise exception 'Cet identifiant existe déjà.';
  end if;
  insert into mx_admin.administrateurs (identifiant, mot_de_passe)
  values (v_id, extensions.crypt(p_mot_de_passe, extensions.gen_salt('bf', 10)));
end $$;

create or replace function public.admin_changer_mot_de_passe(p_jeton text, p_ancien text, p_nouveau text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_moi uuid := mx_admin.verifier(p_jeton);
  v_hash text;
begin
  select mot_de_passe into v_hash from mx_admin.administrateurs where id = v_moi;
  if extensions.crypt(coalesce(p_ancien, ''), v_hash) <> v_hash then
    raise exception 'Mot de passe actuel incorrect.';
  end if;
  if char_length(coalesce(p_nouveau, '')) < 8 then
    raise exception 'Le nouveau mot de passe doit faire au moins 8 caractères.';
  end if;
  update mx_admin.administrateurs
     set mot_de_passe = extensions.crypt(p_nouveau, extensions.gen_salt('bf', 10))
   where id = v_moi;
end $$;

-- Seules ces fonctions sont accessibles depuis le site (clé publique).
revoke all on function public.admin_connexion(text, text) from public;
revoke all on function public.admin_tableau(text, int) from public;
revoke all on function public.admin_comptes(text) from public;
revoke all on function public.admin_creer_compte(text, text, text) from public;
revoke all on function public.admin_changer_mot_de_passe(text, text, text) from public;

grant execute on function public.admin_connexion(text, text) to anon, authenticated;
grant execute on function public.admin_tableau(text, int) to anon, authenticated;
grant execute on function public.admin_comptes(text) to anon, authenticated;
grant execute on function public.admin_creer_compte(text, text, text) to anon, authenticated;
grant execute on function public.admin_changer_mot_de_passe(text, text, text) to anon, authenticated;
