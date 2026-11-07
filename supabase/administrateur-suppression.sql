-- Mx Chimie : fonctions de suppression du tableau de bord administrateur.
-- À coller une fois dans Supabase > SQL Editor > Run (après administrateur.sql).
-- Elles ne suppriment rien à l'installation : elles permettent seulement, depuis le
-- tableau de bord et avec un jeton de session valide, de se déconnecter, de supprimer
-- une demande ou un compte administrateur.

create or replace function public.admin_deconnexion(p_jeton text)
returns void language sql security definer set search_path = '' as $$
  delete from mx_admin.sessions
   where jeton_hash = extensions.digest(coalesce(p_jeton, ''), 'sha256') or expire_le < now();
$$;

create or replace function public.admin_supprimer_demande(p_jeton text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform mx_admin.verifier(p_jeton);
  delete from public.demandes where id = p_id;
end $$;

create or replace function public.admin_supprimer_compte(p_jeton text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_moi uuid := mx_admin.verifier(p_jeton);
begin
  if p_id = v_moi then
    raise exception 'Vous ne pouvez pas supprimer le compte avec lequel vous êtes connecté.';
  end if;
  if (select count(*) from mx_admin.administrateurs) <= 1 then
    raise exception 'Il doit rester au moins un compte administrateur.';
  end if;
  delete from mx_admin.administrateurs where id = p_id;
end $$;

revoke all on function public.admin_deconnexion(text) from public;
revoke all on function public.admin_supprimer_demande(text, uuid) from public;
revoke all on function public.admin_supprimer_compte(text, uuid) from public;
grant execute on function public.admin_deconnexion(text) to anon, authenticated;
grant execute on function public.admin_supprimer_demande(text, uuid) to anon, authenticated;
grant execute on function public.admin_supprimer_compte(text, uuid) to anon, authenticated;
