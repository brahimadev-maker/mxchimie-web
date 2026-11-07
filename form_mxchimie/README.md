# Formulaire Mx Chimie

Formulaire de contact autonome (HTML, CSS, JS) qui enregistre les demandes dans Supabase.

Champs : nom et prénom, e-mail, structure, demande (cases à cocher), message.

## Mise en route

1. **Créer la table** : dans Supabase, ouvre *SQL Editor*, colle le contenu de `supabase.sql` et clique sur *Run*.
2. **Relier le formulaire** : dans *Project Settings > API*, copie l'URL du projet et la clé `anon` (publique), puis colle-les dans `config.js`.
   N'utilise jamais la clé `service_role` dans ce dossier.
3. **Tester** : ouvre `index.html` dans le navigateur, envoie une demande, puis vérifie qu'elle apparaît dans *Table Editor > demandes*.

## Sécurité

- La règle RLS n'autorise que l'**ajout** de demandes avec la clé publique : personne ne peut lire, modifier ou supprimer les données depuis le site.
- La base vérifie aussi les valeurs (structure et demandes limitées aux choix proposés, longueurs maximales).
- Un champ piège invisible écarte les robots de spam simples.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La page du formulaire |
| `style.css` | Le style, aux couleurs de Mx Chimie |
| `script.js` | Validation, envoi vers Supabase, messages d'erreur et de confirmation |
| `config.js` | URL et clé publique Supabase (à remplir) |
| `supabase.sql` | Création de la table `demandes` et de sa règle de sécurité |
| `logo.png` | Logo |
