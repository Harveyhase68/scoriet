<?php

/*
 * Contenu de la page d’accueil publique (resources/views/public/home.blade.php).
 * Garder les cinq langues structurellement identiques (mêmes clés, mêmes longueurs de listes).
 */

return [
    'hero_eyebrow' => 'Open source · RAD basé sur des templates · Conçu pour l’ère de l’IA',
    'hero_points' => [
        'C#, Java, Laravel, PHP, Rust, Flutter et plus',
        'Connexion avec 2FA / MFA incluse',
        'Gratuit et open source sur GitHub',
    ],
    'pipeline' => ['Schéma de base de données', 'Template', 'Application complète', 'L’IA construit dessus'],

    'problem_kicker' => 'Le problème',
    'problem_title' => 'Chaque nouvelle application commence par les mêmes semaines de travail de base',
    'problem_text' => 'Connexion, gestion des utilisateurs, tables, formulaires, listes, fenêtres de recherche, rapports – avant d’écrire la première ligne de logique métier, des jours ou des semaines se sont écoulés. Les assistants de codage IA partent eux aussi de zéro : ils réinventent les mêmes bases à chaque session, consomment des tokens et de l’argent et livrent à chaque fois une structure différente.',
    'problem_items' => [
        'Des semaines passées sur les données de base avant le vrai travail',
        'L’IA repart de zéro à chaque fois – coûteux et incohérent',
        'Chaque projet est construit différemment, la maintenance devient difficile',
    ],

    'solution_kicker' => 'La solution',
    'solution_title' => 'Scoriet pose les fondations. L’IA construit dessus.',
    'solution_text' => 'Scoriet est un générateur d’applications basé sur des templates (RAD). À partir de votre schéma de base de données, il génère une application complète et fonctionnelle – avec connexion, administration de la base, tables, formulaires, rapports et fenêtres de recherche. Votre assistant IA poursuit ensuite sur une base de code propre et cohérente au lieu d’un dossier vide. Vous économisez du temps, des tokens et de l’argent : un seul développeur termine une application complète en quelques jours au lieu de plusieurs semaines.',

    'compare_title' => 'L’IA partant de zéro vs. l’IA sur une base Scoriet',
    'compare_bad_title' => 'L’IA part d’un dossier vide',
    'compare_bad' => [
        'Génère à nouveau connexion, tables et formulaires – token par token',
        'La structure change d’une session à l’autre',
        'Des jours, voire des semaines, avant que les bases fonctionnent',
        'Des coûts en tokens élevés avant toute logique métier',
    ],
    'compare_good_title' => 'L’IA construit sur une application Scoriet',
    'compare_good' => [
        'Connexion avec 2FA, tables, formulaires et rapports existent déjà',
        'Une architecture cohérente issue de templates éprouvés',
        'La logique métier dès le premier jour',
        'Les tokens sont dépensés là où ils créent de la valeur',
    ],

    'steps_kicker' => 'Comment ça marche',
    'steps_title' => 'Du schéma de base de données à l’application terminée en quatre étapes',
    'steps' => [
        ['title' => 'Concevez ou importez votre base de données', 'text' => 'Importez un schéma MySQL existant ou modélisez tables et champs dans le concepteur de base de données intégré. Les libellés des champs et le schéma lui-même peuvent être traduits.'],
        ['title' => 'Choisissez un template', 'text' => 'Choisissez un template pour C#, Java / Spring Boot, Laravel, PHP, Rust, Flutter et plus – ou écrivez le vôtre. Les templates définissent précisément le code généré.'],
        ['title' => 'Générez l’application complète', 'text' => 'Scoriet génère une application complète : connexion avec 2FA / OTP / MFA et administration de la base avec tables, formulaires, rapports et fenêtres de recherche – multilingue si vous le souhaitez.'],
        ['title' => 'Continuez avec l’IA – ou à la main', 'text' => 'Confiez le projet généré à votre assistant IA ou à votre équipe et concentrez-vous sur ce qui rend votre application unique.'],
    ],

    'generated_kicker' => 'Inclus dans chaque application générée',
    'generated_title' => 'Ce que votre application contient déjà après la génération',
    'generated_items' => [
        'Connexion et gestion des utilisateurs avec 2FA / OTP / MFA',
        'Administration de la base pour toutes les tables',
        'Formulaires de saisie avec validation',
        'Listes et tables avec tri et pagination',
        'Fenêtres de recherche et filtres',
        'Rapports',
        'Interface utilisateur multilingue',
        'Un code source propre et lisible qui vous appartient',
    ],

    'tech_kicker' => 'Un schéma, de nombreuses plateformes',
    'tech_title' => 'Générez pour le langage et le framework dont vous avez besoin',
    'tech_text' => 'Le même schéma de base de données devient une application web, desktop ou mobile. Comme Scoriet repose entièrement sur des templates, tout autre langage ou framework peut être ajouté avec vos propres templates.',
    'tech_more' => 'et vos propres templates',

    'lifecycle_kicker' => 'Après la génération',
    'lifecycle_title' => 'Pas seulement générer une fois – maintenir et faire évoluer',
    'lifecycle_text' => 'Les vrais projets évoluent. Scoriet accompagne tout le flux de travail après la première génération.',
    'lifecycle' => [
        ['title' => 'Déploiement via FTP et CLI', 'text' => 'Envoyez les projets générés directement sur votre serveur ou intégrez-les à votre build avec le service CLI.'],
        ['title' => 'Comparer les modifications', 'text' => 'Voyez quels fichiers générés ont été modifiés à la main et comparez-les fichier par fichier.'],
        ['title' => 'Rétro-ingénierie', 'text' => 'Les modifications manuelles sont réintégrées dans la génération et survivent ainsi à la prochaine exécution.'],
        ['title' => 'Migrations de base de données', 'text' => 'Scoriet génère le script SQL qui met à jour votre base de la version 1 à la version 2 du schéma.'],
    ],

    'features_kicker' => 'Tout dans un seul studio',
    'features_title' => 'Tous les outils dont vous avez besoin, dans votre navigateur',
    'features' => [
        ['title' => 'Concepteur de base de données', 'text' => 'Modélisez visuellement tables, champs et relations ou importez du SQL existant.'],
        ['title' => 'Éditeur visuel de formulaires', 'text' => 'Disposez les formulaires par glisser-déposer – la mise en page est utilisée pour la génération.'],
        ['title' => 'Éditeur de rapports', 'text' => 'Concevez des rapports visuellement et générez-les avec l’application.'],
        ['title' => 'Éditeur de fenêtres', 'text' => 'Concevez des fenêtres basées sur une seule table – la base de la migration d’applications WinDev vers Scoriet.'],
        ['title' => 'Équipes', 'text' => 'Travaillez à plusieurs sur les projets, avec rôles et invitations.'],
        ['title' => 'Gestion de projet Kanban', 'text' => 'Planifiez et suivez le travail sur votre projet juste à côté du code.'],
        ['title' => 'Messagerie interne', 'text' => 'Échangez avec votre équipe sans quitter le studio.'],
        ['title' => 'Traductions intégrées', 'text' => 'Scoriet parle cinq langues et génère des applications multilingues, schéma traduit compris.'],
        ['title' => 'Import et export de templates', 'text' => 'Partagez des templates entre projets, équipes et installations.'],
        ['title' => 'Store de templates', 'text' => 'Achetez et vendez des templates – vérifiés contre le code malveillant avant publication.'],
    ],

    'trust_kicker' => 'Open source',
    'trust_title' => 'Open source et sûr par conception',
    'trust_text' => 'Scoriet est open source et librement disponible sur GitHub. Les templates peuvent être importés, exportés et même vendus dans le store de templates Scoriet. Chaque template et chaque modification sont analysés automatiquement à la recherche de code malveillant et examinés par la communauté avant publication – personne ne peut ainsi détourner votre application ou votre environnement de développement.',
    'trust_github' => 'Voir sur GitHub',

    'faq_title' => 'Questions fréquentes',
    'faq' => [
        ['q' => 'Qu’est-ce que Scoriet ?', 'a' => 'Scoriet est un générateur d’applications et de code open source basé sur des templates (outil RAD). Il transforme un schéma de base de données en une application complète avec connexion, administration de la base, formulaires, rapports et fenêtres de recherche.'],
        ['q' => 'Pour quels langages et frameworks Scoriet peut-il générer du code ?', 'a' => 'Des templates existent pour C#, Java / Spring Boot, Laravel / PHP, Rust, Flutter, React et plus. La génération reposant entièrement sur des templates, tout langage ou framework peut être ajouté avec vos propres templates.'],
        ['q' => 'Comment Scoriet fonctionne-t-il avec les assistants de codage IA ?', 'a' => 'Scoriet génère les fondations – connexion, modèle de données, formulaires, listes et rapports. Votre assistant IA construit ensuite la logique métier dessus au lieu de partir d’un dossier vide. Cela économise des tokens, du temps et de l’argent et garde une architecture cohérente.'],
        ['q' => 'Puis-je modifier le code généré ?', 'a' => 'Oui, le code vous appartient. Scoriet montre quels fichiers vous avez modifiés, permet de les comparer et peut réintégrer vos modifications dans la prochaine génération par rétro-ingénierie.'],
        ['q' => 'Scoriet est-il gratuit ?', 'a' => 'Scoriet est open source et peut être téléchargé sur GitHub. La version hébergée sur scoriet.dev propose une offre gratuite pour commencer.'],
        ['q' => 'Les templates du store sont-ils sûrs ?', 'a' => 'Les templates du store sont vérifiés automatiquement contre le code malveillant et examinés par la communauté. Chaque modification doit être approuvée avant publication.'],
    ],
];
