-- Mx Chimie : table des demandes envoyées par le formulaire.
-- À exécuter une fois dans Supabase : SQL Editor > New query > Run.

create table if not exists public.demandes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nom         text not null check (char_length(nom) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  structure   text not null check (structure in ('École', 'Entreprise', 'Institution', 'Autre')),
  demandes    text[] not null check (
                cardinality(demandes) between 1 and 4
                and demandes <@ array['Démo live', 'Cadre de test dans mon établissement', 'Partenariat / collaboration', 'Autre']
              ),
  message     text check (message is null or char_length(message) <= 2000)
);

-- Sécurité : le formulaire public peut uniquement AJOUTER une demande.
-- Personne ne peut lire, modifier ou supprimer les demandes avec la clé publique (anon).
alter table public.demandes enable row level security;

drop policy if exists "Formulaire public : insertion seule" on public.demandes;
create policy "Formulaire public : insertion seule"
  on public.demandes
  for insert
  to anon
  with check (true);

grant insert on public.demandes to anon;

-- Les demandes se consultent dans le tableau de bord Supabase (Table Editor > demandes).
