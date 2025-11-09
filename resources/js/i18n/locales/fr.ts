import type { Translations } from '../types';

export const fr: Translations = {

  // app\Console\Commands\DebugSchemas.php
  debugschemas22: 'Déboguer tous les schémas et leurs tables',
  debugschemas29: '🔍 Débogage de tous les schémas et tables',
  debugschemas38: 'Trouvé ',
  debugschemas49: 'Dernières versions selon le schéma :',
  debugschemas56: 'ID de schéma : {$schemaId}',
  debugschemas70: 'schémas avec {$totalTables} tables totales',

  // app\Console\Commands\DemoReset.php
  demoreset16: 'démo : reset {--backup : créer une sauvegarde avant la réinitialisation}',
  demoreset23: 'Réinitialiser la base de données de démonstration à l\'état initial avec de nouvelles données de démonstration',
  demoreset31: 'La réinitialisation de démonstration ne peut être exécutée que dans un environnement local ou de démonstration !',
  demoreset35: '🚀 Démarrage de la réinitialisation de la base de données de démonstration...',
  demoreset45: '✅ La base de données de démonstration a été réinitialisée avec succès !',
  demoreset46: '📊 Utilisateurs de démonstration disponibles : demo-admin',
  demoreset53: '📦 Création d\'une sauvegarde de la base de données...',
  demoreset60: 'Y-m-d_H-i-s',
  demoreset65: '✅ Sauvegarde créée : {$filename}',
  demoreset70: '🗄️ Suppression de toutes les tables...',
  demoreset89: '🔄 Exécution des migrations...',
  demoreset92: '🌱 Données de démonstration d\'amorçage...',

  // app\Console\Commands\FixTemplateFilePaths.php
  fixtemplatefilepaths23: 'Corriger les valeurs vides de file_path dans la table template_files',
  fixtemplatefilepaths30: 'Vérification des fichiers de modèle avec un chemin de fichier vide...',
  fixtemplatefilepaths43: '{$emptyCount} fichiers trouvés avec un chemin d\'accès vide sur un total de {$totalFiles} fichiers',
  fixtemplatefilepaths46: 'Tous les fichiers modèles ont déjà des valeurs file_path !',
  fixtemplatefilepaths50: 'Correction des valeurs de chemin de fichier vides...',
  fixtemplatefilepaths70: 'ID de fichier fixe {$file->id} : {$file->file_name} -> {$path}',
  fixtemplatefilepaths74: 'Chemins de fichiers de modèle {$fixedCount} corrigés avec succès !',

  // app\Console\Commands\TestObservers.php
  testobservers28: 'Tester la fonctionnalité d\'observateur en déclenchant divers événements de modèle',
  testobservers37: '🧪 Tester la fonctionnalité Observer',
  testobservers42: 'Tâches en file d\'attente avant le test : {$jobsBefore}',
  testobservers68: 'Tâches en file d\'attente après le test : {$jobsAfter}',
  testobservers69: 'Nouveaux travaux envoyés : {$newJobs}',
  testobservers71: '✅ Test d\'observateur terminé !',
  testobservers72: 'Consultez les journaux pour connaître l’activité détaillée des observateurs.',
  testobservers77: '📋 Modèle de test Observer...',
  testobservers83: 'Modèle de test pour la fonctionnalité d\'observateur',
  testobservers92: '✅ Modèle créé : {$template->id}',
  testobservers98: 'Bonjour le monde',
  testobservers103: '✅ Fichier ajouté au modèle',
  testobservers106: 'Description mise à jour',
  testobservers107: '✅ Modèle mis à jour',
  testobservers111: '✅ Modèle supprimé',
  testobservers114: '❌ Échec du test de l\'observateur de modèle :',
  testobservers120: '📄 Test du fichier modèle Observer...',
  testobservers126: 'Modèle de test pour l\'observateur de fichiers',
  testobservers139: 'Fichier de test',
  testobservers144: '✅ Fichier modèle créé : {$file->id}',
  testobservers147: 'Contenu mis à jour',
  testobservers148: '✅ Fichier modèle mis à jour',
  testobservers152: '✅ Fichier modèle supprimé',
  testobservers158: '❌ Le test de l\'observateur TemplateFile a échoué :',
  testobservers164: '🗄️ Test de l\'observateur SchemaVersion...',
  testobservers174: '⚠️ Aucune version de schéma trouvée pour le projet {$projectId}',
  testobservers183: 'Version de test pour l\'observateur',
  testobservers187: '✅ Version du schéma créée : {$newVersion->id}',
  testobservers191: '✅ Version de schéma supprimée',
  testobservers194: '❌ Échec du test d\'observation SchemaVersion :',
  testobservers200: '📋 Test de l\'observateur SchemaTable...',
  testobservers210: '⚠️ Aucune version de schéma trouvée pour le projet {$projectId}',
  testobservers218: 'Table de test pour observateur',
  testobservers224: '✅ Table de schéma créée : {$table->id}',
  testobservers227: 'Commentaire mis à jour',
  testobservers228: '✅ Table de schéma mise à jour',
  testobservers232: '✅ Table de schéma supprimée',
  testobservers235: '❌ Échec du test de l\'observateur SchemaTable :',
  testobservers241: '🔗 Test de ProjectTemplateUsage Observer...',
  testobservers247: '⚠️ Aucun modèle trouvé',
  testobservers260: '✅ Utilisation du modèle de projet créé : {$usage->id}',
  testobservers264: '✅ Utilisation du modèle de projet mis à jour',
  testobservers268: '✅ Utilisation du modèle de projet désactivée',
  testobservers272: '✅ Utilisation du modèle de projet supprimé',
  testobservers275: '❌ Échec du test d\'observation ProjectTemplateUsage :',

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas23: 'Tester les connexions de schéma pour un projet',
  testprojectschemas32: '🔍 Test des connexions de schéma pour le projet {$projectId}',
  testprojectschemas37: 'Tous les schémas disponibles :',
  testprojectschemas47: 'Schémas de projet pour le projet {$projectId} :',
  testprojectschemas50: 'Inconnu',
  testprojectschemas54: 'Tables des schémas connectés :',
  testprojectschemas59: 'Inconnu',
  testprojectschemas73: 'Schéma',
  testprojectschemas79: ': Aucune version trouvée',
  testprojectschemas83: 'Nombre total de tables de tous les schémas connectés : {$totalTables}',

  // app\Console\Commands\TestTreeGenerator.php
  testtreegenerator25: 'Tester la fonctionnalité ProjectFileTreeGenerator',
  testtreegenerator34: '🌳 Test du ProjectFileTreeGenerator',
  testtreegenerator40: 'Projet {$projectId} introuvable',
  testtreegenerator44: 'Projet : {$project->name} (ID : {$project->id})',
  testtreegenerator52: 'Utilisations actives du modèle :',
  testtreegenerator62: 'Nœuds d\'arbre générés :',
  testtreegenerator71: 'Fichiers de modèle {$usage->template_id} ({$template->name}) :',
  testtreegenerator81: '    Enfants: ',
  testtreegenerator95: 'Pas d\'enfants !',
  testtreegenerator101: 'ID de l\'arbre de génération enregistré : {$generationTree->id}',
  testtreegenerator102: 'Éléments de données de l\'arbre :',
  testtreegenerator103: 'Non',

  // app\Console\Commands\TestTreeUpdate.php
  testtreeupdate23: 'Mise à jour de l\'arbre de test pour un projet',
  testtreeupdate32: '🌳 Mise à jour de l\'arborescence de test pour le projet {$projectId}',
  testtreeupdate37: 'Projet {$projectId} introuvable',
  testtreeupdate44: 'Arbre enregistré avec l\'ID : {$tree->id}',
  testtreeupdate45: 'L\'arbre a',
  testtreeupdate48: 'Modèle : {$templateGroup[',
  testtreeupdate50: 'Fichiers : {$fileCount}',

  // app\Http\Controllers\Admin\PageController.php
  pagecontroller50: 'Une page avec ce slug existe déjà pour la langue sélectionnée.',
  pagecontroller89: 'Page supprimée avec succès.',

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller36: 'Projet non trouvé',
  autotranslatecontroller41: 'Non autorisé',
  autotranslatecontroller49: 'La clé API Google Traduction n\'est pas configurée pour ce projet. Veuillez l\'ajouter dans Paramètres du projet → Paramètres de localisation.',
  autotranslatecontroller57: 'Demande de traduction automatique',
  autotranslatecontroller74: 'Réponse de l\'API Google Translate',
  autotranslatecontroller83: 'La traduction a échoué',
  autotranslatecontroller91: 'Texte traduit',
  autotranslatecontroller94: 'Texte traduit',
  autotranslatecontroller99: 'Aucune traduction n\'a été renvoyée',
  autotranslatecontroller114: 'La traduction a échoué pour toutes les langues',

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: 'Non autorisé. Accès administrateur système requis.',
  languagecontroller102: 'Langue supprimée avec succès.',

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller155: 'Les projets privés ne sont disponibles que pour les utilisateurs premium',
  projectcontroller187: 'd.m.Y',
  projectcontroller188: 'Son',
  projectcontroller190: 'Europe/Vienne',
  projectcontroller230: 'Non autorisé',
  projectcontroller246: 'Non autorisé',
  projectcontroller294: 'Seul le propriétaire du projet peut transférer la propriété',
  projectcontroller300: 'Le nouveau propriétaire doit être membre du projet',
  projectcontroller361: 'Non autorisé',
  projectcontroller367: 'Projet supprimé avec succès',
  projectcontroller377: 'Non autorisé',
  projectcontroller382: 'Projet définitivement supprimé',
  projectcontroller392: 'Non autorisé',
  projectcontroller397: 'Projet restauré avec succès',
  projectcontroller407: 'Non autorisé',
  projectcontroller429: 'Non autorisé',
  projectcontroller451: 'Non autorisé',
  projectcontroller523: 'Non autorisé',
  projectcontroller540: 'Certaines équipes ne vous appartiennent pas',
  projectcontroller556: 'Équipes affectées avec succès',
  projectcontroller566: 'Non autorisé',
  projectcontroller571: 'L\'équipe ne vous appartient pas',
  projectcontroller576: 'L\'équipe n\'est pas affectée à ce projet',
  projectcontroller582: 'L\'équipe a été retirée du projet avec succès',
  projectcontroller592: 'Non autorisé',
  projectcontroller605: 'Schéma non trouvé',
  projectcontroller610: 'Le schéma est déjà associé à ce projet',
  projectcontroller616: 'Schéma associé avec succès',
  projectcontroller626: 'Non autorisé',
  projectcontroller631: 'Le schéma n\'est pas associé à ce projet',
  projectcontroller637: 'Association de schéma supprimée avec succès',
  projectcontroller649: 'Projet non trouvé',
  projectcontroller675: 'Projet non trouvé',
  projectcontroller724: 'Projet non trouvé',
  projectcontroller778: 'Autorisations insuffisantes',
  projectcontroller788: 'L\'utilisateur n\'est pas membre de ce projet',
  projectcontroller793: 'Impossible de supprimer le propriétaire du projet',
  projectcontroller798: 'Seul le propriétaire du projet peut supprimer les administrateurs',
  projectcontroller814: 'Le membre a été supprimé avec succès du projet et de toutes les équipes associées',
  projectcontroller828: 'Seul le propriétaire du projet peut modifier les rôles des membres',
  projectcontroller839: 'L\'utilisateur n\'est pas membre de ce projet',
  projectcontroller844: 'Impossible de changer le rôle du propriétaire',
  projectcontroller849: 'Le rôle du membre a été mis à jour avec succès',
  projectcontroller861: 'Non autorisé',
  projectcontroller876: 'Les paramètres du projet ont été mis à jour avec succès',
  projectcontroller890: 'Non autorisé',
  projectcontroller907: 'Non autorisé',
  projectcontroller1000: 'Non autorisé',
  projectcontroller1026: 'Non autorisé',
  projectcontroller1033: 'L\'arbre des générations a été régénéré avec succès',

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php
  projectgenerationtreecontroller23: 'Aucun arbre de génération trouvé pour ce projet',
  projectgenerationtreecontroller52: 'Manquant ',
  projectgenerationtreecontroller61: 'Aucun arbre de génération trouvé pour ce projet',

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller118: 'Schéma non trouvé',
  schemacontroller139: 'Non autorisé à modifier ce schéma',
  schemacontroller173: '🚨 DEMANDE DE SUPPRESSION REÇUE',
  schemacontroller191: 'Non autorisé à supprimer ce schéma',
  schemacontroller206: 'Le schéma est utilisé par {$projectsCount} projet(s). Utilisez la suppression forcée pour continuer.',
  schemacontroller215: '🗑️ Démarrage de la suppression du schéma',
  schemacontroller226: '🔥 Suppression préventive de l\'association de projet',
  schemacontroller228: '✅ Associations de projet {$deletedProjectAssociations} pré-supprimées',
  schemacontroller233: '✅ Détachement éloquent terminé',
  schemacontroller235: '⚠️ Échec du détachement éloquent :',
  schemacontroller240: '🔥 Démarrage de la transaction de suppression principale pour le schéma {$schema->id}',
  schemacontroller248: '🔍 Portée de suppression',
  schemacontroller259: '✅ Suppression des colonnes de référence de clé étrangère {$deletedReferenceColumns}',
  schemacontroller264: '✅ Suppression des références de clé étrangère {$deletedReferences}',
  schemacontroller269: '✅ Suppression des colonnes de contrainte {$deletedConstraintColumns}',
  schemacontroller274: '✅ Suppression des contraintes {$deletedConstraints}',
  schemacontroller279: '✅ Champs de schéma {$deletedFields} supprimés',
  schemacontroller284: '✅ Suppression des mises en page du concepteur de schéma {$deletedLayouts}',
  schemacontroller288: '✅ Tables de schéma {$deletedTables} supprimées',
  schemacontroller293: '✅ Versions de schéma {$deletedVersions} supprimées',
  schemacontroller298: '🔍 Associations de projets restantes : {$remainingAssociations}',
  schemacontroller302: '✅ Associations de projets restantes supprimées de force',
  schemacontroller307: '✅ Schéma lui-même supprimé',
  schemacontroller310: '🎉 Suppression du schéma terminée avec succès',
  schemacontroller316: 'Le schéma et toutes les données associées ont été supprimés avec succès',
  schemacontroller323: '❌ Échec de la suppression du schéma',
  schemacontroller330: 'Échec de la suppression du schéma',
  schemacontroller345: 'Projet non trouvé',
  schemacontroller372: 'Schéma non trouvé',
  schemacontroller393: 'Version du schéma non trouvée',
  schemacontroller431: 'Non autorisé à modifier ce schéma',
  schemacontroller450: 'Mise en page enregistrée avec succès',
  schemacontroller452: 'Erreur d\'enregistrement de la mise en page :',
  schemacontroller453: 'Trace de pile :',
  schemacontroller455: 'Échec de l\'enregistrement de la mise en page',
  schemacontroller470: 'Schéma non trouvé',
  schemacontroller489: 'Non autorisé à modifier ce schéma',
  schemacontroller514: 'Données de la demande CreateTable :',
  schemacontroller617: 'Table créée avec succès',
  schemacontroller622: 'Exception CreateTable :',
  schemacontroller651: 'Non autorisé à modifier ce schéma',
  schemacontroller657: 'La table n\'appartient pas à cette version de schéma',
  schemacontroller684: 'Données de la demande de mise à jour de la table :',
  schemacontroller804: 'Tableau mis à jour avec succès',
  schemacontroller810: 'Échec de la mise à jour du tableau',
  schemacontroller827: 'Non autorisé à modifier ce schéma',
  schemacontroller833: 'La table n\'appartient pas à cette version de schéma',
  schemacontroller840: 'Table supprimée avec succès',
  schemacontroller854: '🚨 DÉBOGAGE DE LA LIAISON DU MODÈLE DE ROUTE : Entrée de méthode',
  schemacontroller880: 'Cette action nécessite un schéma flottant',
  schemacontroller885: 'Non autorisé à modifier ce schéma',
  schemacontroller890: 'La table n\'appartient pas à cette version de schéma',
  schemacontroller894: '🔍 API APPELÉE : deleteTableWithVersionCopy',
  schemacontroller911: '🔍 VÉRIFICATION CRITIQUE : Vérification de la propriété de la table',
  schemacontroller924: '🔍 DOUBLE VÉRIFICATION : Recherche de table par ID dans la version',
  schemacontroller935: 'Suppression de table : {$table->table_name}',
  schemacontroller938: '✅ Nouvelle version créée',
  schemacontroller944: '🔍 AVANT : Recherche d\'un tableau à supprimer dans la nouvelle version',
  schemacontroller953: '🔍 APRÈS : Résultat de la recherche dans la table dans la nouvelle version',
  schemacontroller966: '❌ Tableau non trouvé dans la nouvelle version',
  schemacontroller970: 'introuvable dans la nouvelle version {$newVersion->version_number}',
  schemacontroller974: '🗑️ SUR LE POINT DE SUPPRIMER : Confirmation finale avant suppression',
  schemacontroller990: '🗑️ Relations entre les tables avant suppression',
  schemacontroller999: '✅ Suppression de la table terminée',
  schemacontroller1006: '✅ Tableau supprimé avec succès de la nouvelle version',
  schemacontroller1010: 'Nouvelle version créée et table supprimée',
  schemacontroller1030: 'Non autorisé à modifier ce schéma',
  schemacontroller1048: 'Non autorisé à modifier ce schéma',
  schemacontroller1087: 'Non autorisé à modifier ce schéma',
  schemacontroller1110: 'Nouvelle table : {$request->table_name}',
  schemacontroller1116: 'Nouvelle table : {$request->table_name}',
  schemacontroller1125: 'Une table portant ce nom existe déjà dans cette version de schéma',
  schemacontroller1126: 'existe déjà',
  schemacontroller1158: 'Nouvelle version créée avec le tableau avec succès',
  schemacontroller1165: 'Échec de la création de la version et de la table',
  schemacontroller1182: 'Version du schéma non trouvée',
  schemacontroller1249: 'Cette action nécessite un schéma flottant',
  schemacontroller1256: 'Non autorisé à modifier ce schéma',
  schemacontroller1261: 'Seules les contraintes de clé étrangère peuvent être supprimées avec ce point de terminaison',
  schemacontroller1278: 'Supprimer FK : {$constraint->constraint_name}',
  schemacontroller1284: 'Impossible de trouver la table dans la nouvelle version',
  schemacontroller1293: 'Impossible de trouver la contrainte dans la nouvelle version',
  schemacontroller1301: 'Nouvelle version créée et clé étrangère supprimée',
  schemacontroller1314: 'Clé étrangère supprimée avec succès',
  schemacontroller1320: 'Contrainte non trouvée',
  schemacontroller1322: 'Supprimer l\'erreur FK :',
  schemacontroller1328: 'Échec de la suppression de la clé étrangère',
  schemacontroller1358: 'Cette action nécessite un schéma flottant',
  schemacontroller1365: 'Non autorisé à modifier ce schéma',
  schemacontroller1370: 'Seules les contraintes de clé étrangère peuvent être mises à jour avec ce point de terminaison',
  schemacontroller1381: 'Mise à jour FK : {$constraint->constraint_name}',
  schemacontroller1387: 'Impossible de trouver la table dans la nouvelle version',
  schemacontroller1396: 'Impossible de trouver la contrainte dans la nouvelle version',
  schemacontroller1404: 'Nouvelle version créée et clé étrangère mise à jour',
  schemacontroller1416: 'Clé étrangère mise à jour avec succès',
  schemacontroller1422: 'La validation a échoué',
  schemacontroller1426: 'Contrainte non trouvée',
  schemacontroller1428: 'Erreur de mise à jour FK :',
  schemacontroller1434: 'Échec de la mise à jour de la clé étrangère',
  schemacontroller1461: 'Cette action nécessite un schéma flottant',
  schemacontroller1468: 'Non autorisé à modifier ce schéma',
  schemacontroller1479: 'Créer FK sur {$table->table_name}',
  schemacontroller1485: 'Impossible de trouver la table dans la nouvelle version',
  schemacontroller1493: 'Nouvelle version créée et clé étrangère créée',
  schemacontroller1505: 'Clé étrangère créée avec succès',
  schemacontroller1511: 'La validation a échoué',
  schemacontroller1515: 'Table non trouvée',
  schemacontroller1517: 'Créer une erreur FK :',
  schemacontroller1523: 'Échec de la création de la clé étrangère',

  // app\Http\Controllers\Api\SchemaTranslationController.php
  schematranslationcontroller71: 'Une traduction existe déjà pour cet article et cette langue.',
  schematranslationcontroller102: 'Une traduction existe déjà pour cet article et cette langue.',
  schematranslationcontroller115: 'Traduction supprimée avec succès.',
  schematranslationcontroller144: 'Projet non trouvé ou accès refusé',
  schematranslationcontroller188: 'Inconnu',
  schematranslationcontroller263: 'Traductions mises à jour avec succès.',

  // app\Http\Controllers\Api\SettingsController.php
  settingscontroller16: 'Non autorisé. Accès administrateur système requis.',
  settingscontroller49: 'Paramètres mis à jour avec succès',

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller29: 'Non autorisé',
  templatecontroller92: 'Accès non autorisé à ce projet',
  templatecontroller96: 'Impossible d\'utiliser ce modèle',
  templatecontroller101: 'Le modèle est déjà utilisé par ce projet',
  templatecontroller108: 'Modèle lié avec succès',
  templatecontroller129: 'Le nom du modèle doit être en minuscules',
  templatecontroller141: 'Accès non autorisé à ce projet',
  templatecontroller145: 'Impossible de cloner ce modèle',
  templatecontroller156: 'Modèle cloné avec succès',
  templatecontroller170: 'Non autorisé',
  templatecontroller245: 'Accès non autorisé à ce projet',
  templatecontroller268: '{$assignedCount} modèle(s) ont été attribués avec succès au projet',
  templatecontroller288: 'Projet non trouvé',
  templatecontroller292: 'Modèle non trouvé',
  templatecontroller297: 'Accès non autorisé à ce projet',
  templatecontroller307: 'Le modèle n\'est pas attribué à ce projet',
  templatecontroller314: 'Le modèle a été supprimé du projet avec succès',
  templatecontroller333: 'Non autorisé',
  templatecontroller338: 'L\'utilisation du modèle a été supprimée avec succès',
  templatecontroller422: 'Non autorisé',
  templatecontroller437: 'Non autorisé',
  templatecontroller522: 'Les modèles système ne peuvent pas être supprimés',
  templatecontroller524: 'Les modèles publics d\'autres utilisateurs ne peuvent pas être supprimés',
  templatecontroller526: 'Vous n\'avez aucune autorisation',
  templatecontroller537: 'Modèle supprimé avec succès',
  templatecontroller550: 'Les modèles système ne peuvent pas être supprimés définitivement',
  templatecontroller552: 'Les modèles publics d’autres utilisateurs ne peuvent pas être supprimés définitivement',
  templatecontroller554: 'Vous n\'avez aucune autorisation',
  templatecontroller567: 'Modèle supprimé définitivement',
  templatecontroller580: 'Les modèles système ne peuvent pas être activés/désactivés',
  templatecontroller582: 'Les modèles publics des autres utilisateurs ne peuvent pas être modifiés',
  templatecontroller584: 'Vous n\'avez aucune autorisation',
  templatecontroller591: 'Modèle désactivé avec succès',
  templatecontroller620: 'Vous n\'avez aucune autorisation',
  templatecontroller649: 'Modèle cloné avec succès',
  templatecontroller682: 'Vous n\'avez aucune autorisation',
  templatecontroller717: 'Échec du chargement des dépendances du modèle',
  templatecontroller731: 'Vous n\'avez aucune autorisation',
  templatecontroller741: 'Échec de la validation pour l\'ajout d\'une dépendance au schéma de base de données',
  templatecontroller749: 'La validation a échoué',
  templatecontroller763: 'Cette dépendance existe déjà',
  templatecontroller777: 'Dépendance du schéma de base de données ajoutée avec succès',
  templatecontroller781: 'Échec de l\'ajout de la dépendance au schéma de base de données :',
  templatecontroller789: 'Échec de l\'ajout de la dépendance :',
  templatecontroller803: 'Vous n\'avez aucune autorisation',
  templatecontroller814: 'Dépendance non trouvée',
  templatecontroller822: 'Dépendance du schéma de base de données supprimée avec succès',
  templatecontroller827: 'Échec de la suppression de la dépendance',
  templatecontroller841: 'Non autorisé',
  templatecontroller856: 'Non autorisé',
  templatecontroller892: 'Non autorisé',
  templatecontroller927: 'Non autorisé',
  templatecontroller936: 'Fichier supprimé avec succès',
  templatecontroller944: '🧪 [API-TEMPLATE-QUEUE] Démarrage de la répartition des tâches pour le modèle {$template->id} ({$template->name})',
  templatecontroller954: '🧪 [API-TEMPLATE-QUEUE] ID de projet trouvés :',
  templatecontroller957: '🧪 [API-TEMPLATE-QUEUE] Modèle {$template->id} : aucun projet n\'utilise ce modèle pour le moment',
  templatecontroller961: '🧪 [API-TEMPLATE-QUEUE] Modèle {$template->id} : Envoi de la régénération pour',
  templatecontroller965: '🧪 [API-TEMPLATE-QUEUE] Tâches en file d\'attente avant expédition : {$jobsBefore}',
  templatecontroller970: '🧪 [API-TEMPLATE-QUEUE] Envoi de la tâche RegenerateProjectGenerationTree pour le projet {$projectId}',
  templatecontroller975: '🧪 [API-TEMPLATE-QUEUE] Tâche envoyée avec succès pour le projet {$projectId}',
  templatecontroller977: '🧪 [API-TEMPLATE-QUEUE] Échec de l\'envoi du travail pour le projet {$projectId} :',
  templatecontroller983: '🧪 [API-TEMPLATE-QUEUE] Tâches en file d\'attente après envoi : {$jobsAfter}',
  templatecontroller984: '🧪 [API-TEMPLATE-QUEUE] Nombre total de tâches expédiées : {$dispatchedJobs}',
  templatecontroller985: '🧪 [API-TEMPLATE-QUEUE] Envoi de tâches terminé pour le modèle {$template->id}',

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller30: 'ID de projet requis',
  translationexportcontroller34: 'Au moins une langue requise',
  translationexportcontroller48: 'Traductions',
  translationexportcontroller51: 'Champ',
  translationexportcontroller78: 'Tableau',
  translationexportcontroller103: 'Champ',
  translationexportcontroller131: 'Y-m-d_H-i-s',
  translationexportcontroller175: 'Importer les en-têtes :',
  translationexportcontroller197: 'Colonnes de langue à importer :',
  translationexportcontroller223: 'Tables existantes :',
  translationexportcontroller224: 'Champs existants :',
  translationexportcontroller273: 'Sauter l\'élément',
  translationexportcontroller278: 'Traitement de la ligne {$row} : type={$type}',
  translationexportcontroller312: 'Importation réussie ! {$imported} nouvelles traductions importées',
  translationexportcontroller331: 'Erreur d\'importation de traduction :',
  translationexportcontroller339: 'Échec de l\'importation :',

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller42: 'Modèle non trouvé',
  ultimatetemplatecontroller55: '🚀 Processus principalModèle : templateId=$templateId',
  ultimatetemplatecontroller102: 'Échec du traitement du modèle ultime',
  ultimatetemplatecontroller151: 'contraintes.constraintColumns.field',
  ultimatetemplatecontroller165: 'contraintes.constraintColumns.field',
  ultimatetemplatecontroller174: 'Schéma de démonstration',
  ultimatetemplatecontroller177: 'Schéma de base de données de démonstration',
  ultimatetemplatecontroller196: '🌍 Débogage des langues : trouvé',
  ultimatetemplatecontroller216: 'Projet de démonstration',
  ultimatetemplatecontroller241: 'Moteur de modèles Scoriet ultime',
  ultimatetemplatecontroller270: 'Y-m-d H:i:s',
  ultimatetemplatecontroller271: 'Y-m-d H:i:s',
  ultimatetemplatecontroller272: 'Utilisateur de démonstration',
  ultimatetemplatecontroller274: 'Projet de partition de démonstration',
  ultimatetemplatecontroller295: 'Général',
  ultimatetemplatecontroller300: 'Y-m-d H:i:s',
  ultimatetemplatecontroller301: 'Système',
  ultimatetemplatecontroller308: 'd.m.Y',
  ultimatetemplatecontroller309: 'Son',
  ultimatetemplatecontroller311: 'Europe/Vienne',
  ultimatetemplatecontroller359: 'PK non trouvé dans les contraintes pour {$tableName}',
  ultimatetemplatecontroller535: 'PK non trouvé dans les contraintes pour {$tableName}',
  ultimatetemplatecontroller563: '🐛 Champs de contrainte extraits pour {$tableName}',
  ultimatetemplatecontroller770: 'A-m-j',
  ultimatetemplatecontroller771: 'Son',
  ultimatetemplatecontroller772: 'Y-m-d_H-i-s',
  ultimatetemplatecontroller804: '🔧 Débogage du backend : paramètre tableName reçu :',
  ultimatetemplatecontroller815: '🔧 Débogage du backend : nombre d\'arbres :',
  ultimatetemplatecontroller825: '🔧 Débogage du backend : table trouvée à l\'index $index :',
  ultimatetemplatecontroller833: '🔧 Débogage du backend : aucun paramètre tableName fourni',
  ultimatetemplatecontroller879: '// Fichiers générés',
  ultimatetemplatecontroller881: '// Fichier : {$file[',

  // app\Http\Controllers\AuthController.php
  authcontroller42: 'Cette adresse e-mail est déjà enregistrée. Souhaitez-vous vous connecter ?',
  authcontroller44: 'S\'il vous plaît, mettez une adresse email valide.',
  authcontroller48: 'Ce nom d\'utilisateur est déjà utilisé. Veuillez en choisir un autre.',
  authcontroller50: 'Le nom d\'utilisateur doit contenir uniquement des lettres minuscules',
  authcontroller54: 'Les mots de passe ne correspondent pas.',
  authcontroller56: 'Le mot de passe doit comporter au moins 8 caractères.',
  authcontroller59: 'Veuillez entrer votre nom.',
  authcontroller61: 'Veuillez vérifier vos entrées.',
  authcontroller83: 'Inscription avec jeton d\'invitation',
  authcontroller100: 'Invitation en attente trouvée pour l\'inscription',
  authcontroller124: 'Échec de l\'envoi de la notification d\'administrateur :',
  authcontroller128: 'Utilisateur enregistré avec succès. Veuillez consulter votre boîte mail pour obtenir le lien de confirmation.',
  authcontroller147: 'Erreur de validation',
  authcontroller156: 'La connexion a échoué',
  authcontroller165: 'L\'adresse e-mail doit être confirmée avant de vous connecter',
  authcontroller183: 'Jeton d\'accès personnel',
  authcontroller190: 'Connexion réussie',
  authcontroller209: 'Adresse e-mail introuvable',
  authcontroller220: 'Le lien de réinitialisation a été envoyé',
  authcontroller225: 'Erreur lors de l\'envoi du lien de réinitialisation',
  authcontroller242: 'Erreur de validation',
  authcontroller260: 'Mot de passe réinitialisé avec succès',
  authcontroller265: 'Erreur lors de la réinitialisation du mot de passe',
  authcontroller292: 'Erreur de validation',
  authcontroller310: 'Profil mis à jour avec succès',
  authcontroller329: 'Erreur de validation',
  authcontroller337: 'Le mot de passe actuel est incorrect',
  authcontroller346: 'Mot de passe modifié avec succès',
  authcontroller359: 'Lien de confirmation non valide. L\'utilisateur n\'existe pas ou a été supprimé.',
  authcontroller367: 'Lien de confirmation non valide. Le lien a expiré ou a été compromis.',
  authcontroller374: 'Jeton d\'accès personnel',
  authcontroller378: 'Adresse e-mail déjà confirmée',
  authcontroller389: 'Jeton d\'accès personnel',
  authcontroller401: 'Acceptation automatique de l\'invitation après vérification par e-mail',
  authcontroller412: 'Invitation acceptée automatiquement avec succès',
  authcontroller418: 'Adresse e-mail confirmée avec succès',
  authcontroller429: 'Erreur de confirmation de l\'e-mail',
  authcontroller442: 'Adresse e-mail déjà confirmée',
  authcontroller449: 'Un e-mail de confirmation a été envoyé à nouveau',
  authcontroller466: 'Erreur de validation',
  authcontroller474: 'Le mot de passe saisi est incorrect',
  authcontroller488: 'Votre compte a été supprimé avec succès',
  authcontroller492: 'Erreur lors de la suppression du compte',
  authcontroller506: 'Déconnexion réussie',
  authcontroller521: 'Sélection de langue invalide',
  authcontroller532: 'Préférence de langue mise à jour avec succès',
  authcontroller537: 'Échec de la mise à jour de la préférence de langue',

  // app\Http\Controllers\Auth\PasswordResetLinkController.php
  passwordresetlinkcontroller39: 'Un lien de réinitialisation sera envoyé si le compte existe.',

  // app\Http\Controllers\CustomTokenController.php
  customtokencontroller51: 'Les informations d\'identification fournies sont incorrectes.',
  customtokencontroller58: 'L\'adresse e-mail doit être confirmée avant de vous connecter',
  customtokencontroller71: 'Les informations d\'identification fournies sont incorrectes.',
  customtokencontroller98: 'Erreur de jeton OAuth :',
  customtokencontroller101: 'Une erreur s\'est produite lors du traitement de votre demande.',

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller59: 'dernière version',
  dbschemacontroller66: 'Accès refusé à ce schéma',
  dbschemacontroller77: 'Schéma non trouvé',
  dbschemacontroller95: 'Accès refusé à ce schéma',
  dbschemacontroller111: 'Schéma non trouvé',
  dbschemacontroller129: 'Accès refusé à ce schéma',
  dbschemacontroller145: 'Vous ne pouvez pas modifier ce modèle',
  dbschemacontroller157: 'Le modèle est déjà lié à ce schéma de base de données',
  dbschemacontroller171: 'Modèle lié avec succès au schéma de base de données',
  dbschemacontroller195: 'Vous ne pouvez pas modifier ce modèle',
  dbschemacontroller207: 'Le modèle a été dissocié du schéma de base de données avec succès',
  dbschemacontroller212: 'Dépendance non trouvée',
  dbschemacontroller223: 'dernière version',
  dbschemacontroller256: 'Vous ne pouvez copier que vos propres schémas',
  dbschemacontroller264: 'Impossible de copier un schéma vide. Le schéma source doit avoir au moins une version avec tables.',
  dbschemacontroller281: 'Vous possédez déjà un schéma portant ce nom. Veuillez en choisir un autre.',
  dbschemacontroller288: '(Copie)',
  dbschemacontroller305: 'Le schéma source n\'a aucune version valide à copier',
  dbschemacontroller310: 'tables.contraintes.foreignKeyReference.referenceColumns',
  dbschemacontroller317: 'Copié à partir de',
  dbschemacontroller332: 'Le nouvel ID de schéma n\'est pas défini',
  dbschemacontroller335: 'Le nouvel ID de version n\'est pas défini',
  dbschemacontroller460: 'Schéma de base de données copié avec succès',
  dbschemacontroller472: 'Échec de la copie du schéma :',

  // app\Http\Controllers\PageController.php
  pagecontroller43: 'Page d\'aide introuvable pour les paramètres régionaux : {$locale}',
  pagecontroller46: 'Page CMS',
  pagecontroller67: 'Page d\'impressum introuvable pour la langue : {$locale}',
  pagecontroller70: 'Page CMS',

  // app\Http\Controllers\ProjectApplicationController.php
  projectapplicationcontroller24: 'Erreur de validation',
  projectapplicationcontroller36: 'Code d\'inscription non valide ou applications non autorisées',
  projectapplicationcontroller49: 'Vous avez déjà soumis une candidature pour ce projet',
  projectapplicationcontroller64: 'Candidature soumise avec succès',
  projectapplicationcontroller85: 'Aucune autorisation',
  projectapplicationcontroller106: '=== Méthode ReviewApplication appelée ===',
  projectapplicationcontroller118: 'ReviewApplication : validation échouée',
  projectapplicationcontroller120: 'Erreur de validation',
  projectapplicationcontroller130: 'identifiant d\'application',
  projectapplicationcontroller131: 'Application non trouvée',
  projectapplicationcontroller137: 'Examen du débogage de l\'application',
  projectapplicationcontroller153: 'Demande d\'examen : autorisation refusée',
  projectapplicationcontroller158: 'Aucune autorisation - Vous n\'êtes pas le propriétaire du projet',
  projectapplicationcontroller164: 'Demande d\'évaluation : déjà évaluée',
  projectapplicationcontroller166: 'Cette demande a déjà été traitée',
  projectapplicationcontroller173: 'La candidature a été acceptée',
  projectapplicationcontroller176: 'La demande a été rejetée',
  projectapplicationcontroller179: 'Révision de la demande : réussite',
  projectapplicationcontroller210: 'ProjectApplicationController : getProjectByJoinCode appelé',
  projectapplicationcontroller211: 'joinCode',
  projectapplicationcontroller220: 'ProjectApplicationController : résultat de la recherche de projet',
  projectapplicationcontroller221: 'joinCode',
  projectapplicationcontroller231: 'Code d\'inscription invalide. Veuillez le vérifier.',
  projectapplicationcontroller237: 'Ce projet n\'est plus actif.',
  projectapplicationcontroller243: 'Ce projet n\'accepte actuellement pas de demandes d\'adhésion.',

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller26: 'Non autorisé',
  projectinvitationcontroller37: 'La validation a échoué',
  projectinvitationcontroller50: 'L\'utilisateur est déjà membre de ce projet',
  projectinvitationcontroller61: 'Une invitation a déjà été envoyée à cette adresse e-mail',
  projectinvitationcontroller80: 'Échec de l\'envoi de l\'e-mail d\'invitation au projet',
  projectinvitationcontroller88: 'Invitation envoyée avec succès',
  projectinvitationcontroller89: 'utilisateur invité',
  projectinvitationcontroller103: 'Jeton d\'invitation non valide',
  projectinvitationcontroller107: 'Cette invitation a expiré',
  projectinvitationcontroller112: 'Cette invitation a déjà été acceptée',
  projectinvitationcontroller113: 'Cette invitation a déjà été refusée',
  projectinvitationcontroller114: 'Cette invitation a expiré',
  projectinvitationcontroller115: 'Cette invitation n\'est plus valable',
  projectinvitationcontroller138: 'Jeton d\'invitation non valide',
  projectinvitationcontroller143: 'L\'invitation n\'est plus valide',
  projectinvitationcontroller150: 'Impossible d\'accepter l\'invitation',
  projectinvitationcontroller154: 'Invitation acceptée avec succès',
  projectinvitationcontroller167: 'Jeton d\'invitation non valide',
  projectinvitationcontroller172: 'L\'invitation n\'est plus valide',
  projectinvitationcontroller179: 'Impossible de refuser l\'invitation',
  projectinvitationcontroller187: 'Échec de l\'envoi de l\'e-mail de notification de refus',
  projectinvitationcontroller194: 'Invitation refusée avec succès',
  projectinvitationcontroller206: 'Non autorisé',
  projectinvitationcontroller210: 'utilisateur invité',
  projectinvitationcontroller240: '=== Annuler la demande d\'invitation ===',
  projectinvitationcontroller250: 'Annuler l\'invitation : Non autorisé',
  projectinvitationcontroller254: 'Non autorisé',
  projectinvitationcontroller258: 'Annuler l\'invitation : Mauvais projet',
  projectinvitationcontroller262: 'L\'invitation n\'appartient pas à ce projet',
  projectinvitationcontroller266: 'Annuler l\'invitation : Non en attente',
  projectinvitationcontroller269: 'Ne peut annuler que les invitations en attente',
  projectinvitationcontroller273: 'Invitation annulée avec succès',
  projectinvitationcontroller275: 'Invitation annulée avec succès',
  projectinvitationcontroller286: 'Aucune invitation en attente',
  projectinvitationcontroller296: 'Aucune invitation en attente',
  projectinvitationcontroller310: 'Aucune invitation en attente',
  projectinvitationcontroller316: 'Aucune invitation en attente',
  projectinvitationcontroller323: 'Impossible d\'accepter l\'invitation',
  projectinvitationcontroller330: 'Invitation acceptée avec succès',
  projectinvitationcontroller343: 'Aucune invitation en attente',
  projectinvitationcontroller349: 'Aucune invitation en attente',
  projectinvitationcontroller358: 'Invitation refusée',

  // app\Http\Controllers\QueueTestController.php
  queuetestcontroller61: '🧪 [TEST] Démarrage du test de répartition des tâches',
  queuetestcontroller65: 'Aucun projet trouvé',
  queuetestcontroller69: '🧪 [TEST] Tâches avant expédition : {$jobsBefore}',
  queuetestcontroller77: '🧪 [TEST] Tâches après envoi : {$jobsAfter}',
  queuetestcontroller86: 'Échec de l\'envoi du travail',
  queuetestcontroller89: '🧪 [TEST] Échec de l\'envoi du travail :',
  queuetestcontroller102: '🧪 [TEST] Démarrage du test de création de version de schéma',
  queuetestcontroller106: 'Aucun schéma trouvé',
  queuetestcontroller116: 'Le schéma n\'est connecté à aucun projet',
  queuetestcontroller117: 'Connectez d\'abord le schéma à un projet à l\'aide de la table project_schemas',
  queuetestcontroller122: '🧪 [TEST] Tâches avant la création de la version du schéma : {$jobsBefore}',
  queuetestcontroller126: 'Version de test pour les tests de file d\'attente',
  queuetestcontroller127: '🧪 [TEST] Version du schéma créée : {$version->id}',
  queuetestcontroller130: '🧪 [TEST] Tâches après la création de la version du schéma : {$jobsAfter}',
  queuetestcontroller142: 'Aucun travail expédié',
  queuetestcontroller145: '🧪 [TEST] Échec de la création de la version du schéma :',
  queuetestcontroller162: 'Projet non trouvé',
  queuetestcontroller173: '🧪 [MANUEL] Tâche envoyée manuellement pour le projet {$projectId}',
  queuetestcontroller181: 'Tâche expédiée manuellement avec succès',
  queuetestcontroller201: 'Fichier journal non trouvé',
  queuetestcontroller211: '🧪 [TEST DE FILE D\'ATTENTE]',
  queuetestcontroller212: '🧪 [TEST]',
  queuetestcontroller213: '🧪 [MANUEL]',

  // app\Http\Controllers\SchemaController.php
  schemacontroller21: 'templateDependencies.template',
  schemacontroller64: 'templateDependencies.template',
  schemacontroller71: 'Accès refusé à ce schéma',
  schemacontroller82: 'Schéma non trouvé',
  schemacontroller105: 'Vous avez besoin d\'un compte premium pour créer des schémas privés',
  schemacontroller117: 'Vous avez déjà un schéma avec ce nom',
  schemacontroller132: 'Schéma créé avec succès',
  schemacontroller155: 'Vous ne pouvez modifier que vos propres schémas',
  schemacontroller169: 'Vous avez besoin d\'un compte premium pour rendre les schémas privés',
  schemacontroller183: 'Vous avez déjà un schéma avec ce nom',
  schemacontroller193: 'Schéma mis à jour avec succès',
  schemacontroller216: 'Vous ne pouvez supprimer que vos propres schémas',
  schemacontroller225: 'Impossible de supprimer le schéma. Il est utilisé par {$dependentTemplates} modèles.',
  schemacontroller234: 'Schéma supprimé avec succès',
  schemacontroller256: 'Accès refusé à ce schéma',
  schemacontroller272: 'Schéma non trouvé',
  schemacontroller290: 'Accès refusé à ce schéma',
  schemacontroller306: 'Vous ne pouvez pas modifier ce modèle',
  schemacontroller318: 'Le modèle est déjà lié à ce schéma',
  schemacontroller332: 'Le modèle a été lié au schéma avec succès',
  schemacontroller356: 'Vous ne pouvez pas modifier ce modèle',
  schemacontroller368: 'Le modèle a été dissocié du schéma avec succès',
  schemacontroller373: 'Dépendance non trouvée',
  schemacontroller384: 'templateDependencies.template',

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller31: 'Accès refusé à ce schéma',
  schemaexportcontroller56: 'Aucune version trouvée pour ce schéma',
  schemaexportcontroller66: 'contraintes.constraintColumns.field',
  schemaexportcontroller67: 'contraintes.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller125: 'L\'exportation a échoué :',
  schemaexportcontroller144: 'Accès refusé à ce schéma',
  schemaexportcontroller169: 'Aucune version trouvée pour ce schéma',
  schemaexportcontroller178: 'contraintes.constraintColumns.field',
  schemaexportcontroller179: 'contraintes.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller193: 'Aucune table trouvée dans ce schéma',
  schemaexportcontroller213: 'Échec de l\'exportation MySQL :',
  schemaexportcontroller224: '-- Exportation de base de données MySQL',
  schemaexportcontroller225: '-- Schéma :',
  schemaexportcontroller226: 'Aucune description',
  schemaexportcontroller227: '-- Version: ',
  schemaexportcontroller228: '-- Généré :',
  schemaexportcontroller229: '-- Nombre de tables :',
  schemaexportcontroller237: '-- Tableau: ',
  schemaexportcontroller239: '-- Commentaire: ',
  schemaexportcontroller272: ' COMMENTAIRE',
  schemaexportcontroller283: 'Contraintes de traitement pour la table : {$table->table_name}',
  schemaexportcontroller284: 'Nombre de contraintes :',
  schemaexportcontroller286: 'Contrainte : {$constraint->constraint_name} (type : {$constraint->constraint_type})',
  schemaexportcontroller287: 'Nombre de colonnes de contrainte :',
  schemaexportcontroller293: 'PRIMAIRE',
  schemaexportcontroller339: 'SUR SUPPRESSION',
  schemaexportcontroller358: ' COMMENTAIRE',
  schemaexportcontroller367: '-- Exportation terminée avec succès',
  schemaexportcontroller368: '-- Nombre total de tables exportées :',
  schemaexportcontroller386: 'Accès refusé à ce schéma',
  schemaexportcontroller402: 'Échec de l\'obtention du nombre de tables :',
  schemaexportcontroller418: 'Schéma non trouvé',
  schemaexportcontroller437: 'Aucune version trouvée pour ce schéma',
  schemaexportcontroller447: 'contraintes.constraintColumns.field',
  schemaexportcontroller448: 'contraintes.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller471: 'Enquête sur les relations de schéma - DEEP DIVE',
  schemaexportcontroller483: 'Schéma → schema_versions → schema_tables (via schema_version_id)',
  schemaexportcontroller484: 'NULL (non utilisé dans ce système)',
  schemaexportcontroller489: 'Échec du débogage :',

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: 'Un script SQL est requis',
  sqlparsercontroller72: 'Un script SQL est requis',
  sqlparsercontroller79: 'L\'ID de schéma est requis',
  sqlparsercontroller89: 'Schéma non trouvé',
  sqlparsercontroller98: 'Vous n\'avez pas l\'autorisation de modifier ce schéma',
  sqlparsercontroller151: 'Échec de l\'importation SQL',
  sqlparsercontroller165: 'Erreur de syntaxe',
  sqlparsercontroller166: 'Veuillez vérifier votre syntaxe SQL pour les points-virgules manquants',
  sqlparsercontroller171: 'Fonctionnalité non prise en charge',
  sqlparsercontroller172: 'Cette fonctionnalité SQL n\'est pas encore prise en charge par notre analyseur. Veuillez essayer de simplifier votre SQL.',
  sqlparsercontroller177: 'Erreur de table/colonne',
  sqlparsercontroller178: 'Veuillez vérifier les définitions de table et de colonne pour une syntaxe correcte.',
  sqlparsercontroller182: 'Erreur d\'analyse',
  sqlparsercontroller183: 'Veuillez vérifier votre SQL pour les problèmes courants tels que les points-virgules manquants',
  sqlparsercontroller236: '🐛 Débogage des changements de rupture',
  sqlparsercontroller262: '🐛 Après le filtrage de la table système',
  sqlparsercontroller277: '🐛 Débogage des messages d\'erreur',
  sqlparsercontroller278: 'tables commerciales existantes',
  sqlparsercontroller279: 'Nouvelles tables d\'affaires',
  sqlparsercontroller280: 'nombre d\'entreprises existantes',
  sqlparsercontroller281: 'newBusinessCount',
  sqlparsercontroller282: 'type de tables existantes d\'entreprise',
  sqlparsercontroller283: 'businessNewTables_type',
  sqlparsercontroller294: '🛡️ CHANGEMENT DE RUPTURE DÉTECTÉ : cette importation SQL créerait une structure de base de données complètement nouvelle sans chevauchement de table.',
  sqlparsercontroller295: 'La version actuelle contient {$existingBusinessCount} tables métier : {$existingTablesList}',
  sqlparsercontroller296: 'La nouvelle importation contient {$newBusinessCount} tables métier : {$newTablesList}',
  sqlparsercontroller297: '🚨 Pour la sécurité des données',
  sqlparsercontroller298: '✅ Solution : créez une nouvelle base de données/un nouveau schéma pour cette structure au lieu de versionner la base existante.',
  sqlparsercontroller299: '✅ Alternative : assurez-vous qu’au moins un nom de table d’entreprise correspond entre les versions.',
  sqlparsercontroller303: '✅ Validation des changements de rupture réussie',
  sqlparsercontroller320: 'Version du schéma non trouvée',
  sqlparsercontroller361: 'Version du schéma non trouvée',
  sqlparsercontroller395: 'Un script SQL est requis',
  sqlparsercontroller405: 'SQL analysé avec succès',
  sqlparsercontroller430: '🧪 [QUEUE-TEST] Démarrage de la répartition des tâches pour le schéma {$schema->id} ({$schema->name})',
  sqlparsercontroller439: '🧪 [QUEUE-TEST] ID de projet trouvés :',
  sqlparsercontroller442: '🧪 [QUEUE-TEST] Schéma {$schema->id} : aucun projet affecté à la régénération de la file d\'attente',
  sqlparsercontroller446: '🧪 [QUEUE-TEST] Schéma {$schema->id} : Envoi de la régénération pour',
  sqlparsercontroller450: '🧪 [QUEUE-TEST] Tâches en file d\'attente avant expédition : {$jobsBefore}',
  sqlparsercontroller455: '🧪 [QUEUE-TEST] Envoi de la tâche RegenerateProjectGenerationTree pour le projet {$projectId}',
  sqlparsercontroller460: '🧪 [QUEUE-TEST] Tâche envoyée avec succès pour le projet {$projectId}',
  sqlparsercontroller462: '🧪 [QUEUE-TEST] Échec de l\'envoi du travail pour le projet {$projectId} :',
  sqlparsercontroller468: '🧪 [QUEUE-TEST] Tâches en file d\'attente après envoi : {$jobsAfter}',
  sqlparsercontroller469: '🧪 [QUEUE-TEST] Nombre total de tâches expédiées : {$dispatchedJobs}',
  sqlparsercontroller470: '🧪 [QUEUE-TEST] Répartition des tâches terminée pour le schéma {$schema->id}',

  // app\Http\Controllers\TeamController.php
  teamcontroller88: 'La validation a échoué',
  teamcontroller117: 'Équipe créée avec succès',
  teamcontroller131: 'Non autorisé',
  teamcontroller149: 'Autorisations insuffisantes',
  teamcontroller169: 'La validation a échoué',
  teamcontroller191: 'L\'équipe a été mise à jour avec succès',
  teamcontroller205: 'Seul le propriétaire de l\'équipe peut supprimer l\'équipe',
  teamcontroller210: 'L\'équipe a été supprimée avec succès',
  teamcontroller223: 'Autorisations insuffisantes',
  teamcontroller231: 'Membre non trouvé',
  teamcontroller236: 'Impossible de supprimer le propriétaire de l\'équipe',
  teamcontroller241: 'Membre supprimé avec succès',
  teamcontroller254: 'Autorisations insuffisantes',
  teamcontroller263: 'La validation a échoué',
  teamcontroller273: 'Membre non trouvé',
  teamcontroller278: 'Impossible de changer le rôle du propriétaire',
  teamcontroller284: 'Le rôle du membre a été mis à jour avec succès',
  teamcontroller298: 'Non autorisé',
  teamcontroller308: 'La validation a échoué',
  teamcontroller317: 'L\'utilisateur est déjà membre de cette équipe',
  teamcontroller330: 'Membre ajouté à l\'équipe avec succès',
  teamcontroller344: 'Non autorisé',

  // app\Http\Controllers\TeamInvitationController.php
  teaminvitationcontroller26: 'Autorisations insuffisantes',
  teaminvitationcontroller38: 'La validation a échoué',
  teaminvitationcontroller46: 'L\'utilisateur est déjà membre de l\'équipe',
  teaminvitationcontroller56: 'L\'utilisateur a déjà une invitation en attente',
  teaminvitationcontroller70: 'Invitation envoyée avec succès',
  teaminvitationcontroller106: 'Autorisations insuffisantes',
  teaminvitationcontroller124: 'Jeton d\'invitation non valide',
  teaminvitationcontroller132: 'Cette invitation n\'est pas pour vous',
  teaminvitationcontroller137: 'L\'invitation a expiré',
  teaminvitationcontroller139: 'Impossible d\'accepter l\'invitation',
  teaminvitationcontroller143: 'Invitation acceptée avec succès',
  teaminvitationcontroller156: 'Jeton d\'invitation non valide',
  teaminvitationcontroller164: 'Cette invitation n\'est pas pour vous',
  teaminvitationcontroller168: 'Impossible de refuser l\'invitation',
  teaminvitationcontroller171: 'Invitation refusée',
  teaminvitationcontroller184: 'Autorisations insuffisantes',
  teaminvitationcontroller188: 'Ne peut annuler que les invitations en attente',
  teaminvitationcontroller193: 'Invitation annulée',
  teaminvitationcontroller206: 'Autorisations insuffisantes',
  teaminvitationcontroller210: 'Ne peut renvoyer que les invitations en attente ou expirées',
  teaminvitationcontroller222: 'L\'invitation a été renvoyée avec succès',

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: 'Tous',
  templatecontroller98: 'Modèle non trouvé',
  templatecontroller140: 'modèles/{$template->id}/{$fileData[',
  templatecontroller154: 'Modèle créé avec succès',
  templatecontroller222: 'Modèle mis à jour avec succès',
  templatecontroller243: 'Modèle supprimé avec succès',
  templatecontroller306: 'L\'attribution du modèle est actuellement simulée – intégration de la base de données en attente',
  templatecontroller328: 'Suppression du modèle simulée avec succès',
  templatecontroller329: 'La suppression du modèle est actuellement simulée – intégration de la base de données en attente',
  templatecontroller334: 'La suppression simulée a échoué',
  templatecontroller369: 'Gestionnaire de modèles Scoriet',
  templatecontroller382: 'Modèle non trouvé',
  templatecontroller420: 'Un modèle portant ce nom existe déjà. Définissez overwrite_existing sur true pour le remplacer.',
  templatecontroller445: 'modèles/{$template->id}/{$fileData[',
  templatecontroller455: 'Modèle importé avec succès',
  templatecontroller481: 'Modèle non trouvé',
  templatecontroller493: 'Demande d\'ajout de dépendance de schéma de base de données',
  templatecontroller509: 'Vous ne pouvez pas ajouter de dépendances à ce modèle',
  templatecontroller523: 'Validation réussie',
  templatecontroller525: 'La validation a échoué',
  templatecontroller533: 'Schéma trouvé',
  templatecontroller538: 'Accès au schéma refusé',
  templatecontroller544: 'Accès refusé à ce schéma de base de données',
  templatecontroller553: 'Vérification des dépendances',
  templatecontroller558: 'La dépendance existe déjà',
  templatecontroller561: 'Le modèle dépend déjà de ce schéma de base de données',
  templatecontroller565: 'Créer une dépendance',
  templatecontroller579: 'Dépendance créée avec succès',
  templatecontroller585: 'Dépendance du schéma de base de données ajoutée avec succès',
  templatecontroller587: 'Exception dans addDbSchemaDependency',
  templatecontroller616: 'Vous ne pouvez pas supprimer les dépendances de ce modèle',
  templatecontroller628: 'Dépendance du schéma de base de données supprimée avec succès',
  templatecontroller633: 'Dépendance non trouvée',
  templatecontroller654: 'Vous ne pouvez pas mettre à jour les dépendances pour ce modèle',
  templatecontroller672: 'Dépendance du schéma de base de données mise à jour avec succès',
  templatecontroller677: 'Dépendance non trouvée',
  templatecontroller695: 'Accès refusé à ce schéma de base de données',
  templatecontroller713: 'Schéma de base de données introuvable',
  templatecontroller723: '🧪 [TEMPLATE-QUEUE] Démarrage de la répartition des tâches pour le modèle {$template->id} ({$template->name})',
  templatecontroller733: '🧪 [TEMPLATE-QUEUE] ID de projet trouvés :',
  templatecontroller736: '🧪 [TEMPLATE-QUEUE] Modèle {$template->id} : aucun projet n\'utilise ce modèle pour le moment',
  templatecontroller740: '🧪 [TEMPLATE-QUEUE] Modèle {$template->id} : Envoi de la régénération pour',
  templatecontroller744: '🧪 [TEMPLATE-QUEUE] Tâches en file d\'attente avant expédition : {$jobsBefore}',
  templatecontroller750: '🧪 [TEMPLATE-QUEUE] Envoi de la tâche RegenerateProjectGenerationTree pour le projet {$projectId}',
  templatecontroller754: '🧪 [TEMPLATE-QUEUE] Tâche envoyée avec succès pour le projet {$projectId}',
  templatecontroller756: '🧪 [TEMPLATE-QUEUE] Échec de l\'envoi du travail pour le projet {$projectId} :',
  templatecontroller762: '🧪 [TEMPLATE-QUEUE] Tâches en file d\'attente après envoi : {$jobsAfter}',
  templatecontroller764: '🧪 [TEMPLATE-QUEUE] Nombre total de tâches expédiées : {$dispatchedJobs}',
  templatecontroller765: '🧪 [TEMPLATE-QUEUE] Envoi du travail terminé pour le modèle {$template->id}',

  // app\Http\Controllers\UserController.php
  usercontroller25: 'Utilisateur non authentifié.',
  usercontroller36: 'L\'horodatage de connexion a été mis à jour avec succès.',

  // app\Http\Middleware\CheckSystemUser.php
  checksystemuser25: 'Accès refusé. Privilèges système ou administrateur requis.',

  // app\Http\Middleware\EnsureUserIsAdmin.php
  ensureuserisadmin32: 'Vérification du middleware d\'administration',
  ensureuserisadmin42: 'Accès administrateur refusé : utilisateur non authentifié',
  ensureuserisadmin47: 'Non authentifié. Veuillez d\'abord vous connecter.',
  ensureuserisadmin52: 'Veuillez vous connecter',
  ensureuserisadmin58: 'Résultat de la vérification de l\'administrateur',
  ensureuserisadmin64: 'Accès administrateur refusé : l\'utilisateur n\'est pas administrateur/système',
  ensureuserisadmin72: 'Interdit. Accès administrateur requis.',
  ensureuserisadmin77: 'Accès refusé. Seuls les administrateurs système ont accès à cette zone.',
  ensureuserisadmin80: 'Accès administrateur accordé',

  // app\JobsegenerateProjectGenerationTree.php
  jobsegenerateprojectgenerationtree36: 'Projet {$this->projectId} introuvable pour la régénération de l\'arbre de génération',
  jobsegenerateprojectgenerationtree40: 'Régénération de l\'arbre de génération pour le projet : {$project->name} (ID : {$project->id})',
  jobsegenerateprojectgenerationtree45: 'Arbre de génération régénéré avec succès pour le projet {$project->id}. Nombre total d\'éléments :',
  jobsegenerateprojectgenerationtree48: 'Échec de la régénération de l\'arbre de génération pour le projet {$this->projectId} :',

  // app\Jobs\RegenerateProjectGenerationTree.php
  regenerateprojectgenerationtree36: 'Projet {$this->projectId} introuvable pour la régénération de l\'arbre de génération',
  regenerateprojectgenerationtree40: 'Régénération de l\'arbre de génération pour le projet : {$project->name} (ID : {$project->id})',
  regenerateprojectgenerationtree45: 'Arbre de génération régénéré avec succès pour le projet {$project->id}. Nombre total d\'éléments :',
  regenerateprojectgenerationtree48: 'Échec de la régénération de l\'arbre de génération pour le projet {$this->projectId} :',

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: 'Toi',

  // app\Models\FloatingSchema.php
  floatingschema180: '(Clone)',

  // app\Models\ProjectApplication.php
  projectapplication96: 'Ajouté via l\'approbation de l\'application',

  // app\Models\Project.php
  project430: 'Aucun utilisateur authentifié pour envoyer une invitation',

  // app\Models\SchemaVersion.php
  schemaversion50: 'Version {$nextVersion}',
  schemaversion81: '🔍 createNewVersionWithCopy démarrer',
  schemaversion93: '✅ Nouvelle version vide créée',
  schemaversion101: '❌ Version source non trouvée',
  schemaversion102: 'Version source {$fromVersionNumber} introuvable',
  schemaversion105: '✅ Version source trouvée',
  schemaversion111: '🚀 Phase 1 : Copie des tables',
  schemaversion115: '📋 Copie du tableau',
  schemaversion127: '✅ Tableau créé',
  schemaversion134: '📝 Copie des champs',
  schemaversion138: '🔤 Champ de copie',
  schemaversion156: '✅ Champ copié avec succès',
  schemaversion158: '❌ Échec de la copie du champ',
  schemaversion168: '🔗 Phase 1 : Copie des contraintes non FK',
  schemaversion172: '🔒 Contrainte de copie',
  schemaversion182: '✅ Contrainte créée',
  schemaversion210: '🚨 Clé étrangère SAUTÉE - Table référencée introuvable',
  schemaversion238: '❌ Échec de la copie de la contrainte',
  schemaversion248: '🚀 Phase 2 : Traitement des contraintes de clé étrangère',
  schemaversion254: '🔑 Traitement des contraintes FK pour la table',
  schemaversion261: '🔒 Phase 2 : Création d\'une contrainte FK',
  schemaversion273: '✅ Contrainte FK créée',
  schemaversion310: '✅ Référence FK créée avec succès',
  schemaversion312: '❌ Phase 2 : Table référencée toujours introuvable',
  schemaversion319: '❌ Échec de la copie de la contrainte FK en phase 2',
  schemaversion330: '📐 Copie des données de mise en page',
  schemaversion338: '📐 Mise en page trouvée à copier',
  schemaversion351: '📐 Mise en page copiée avec succès',
  schemaversion353: '📐 Aucune mise en page trouvée pour copier à partir de la version',
  schemaversion356: '❌ Échec de la copie de la mise en page',
  schemaversion365: '🎉 createNewVersionWithCopy terminé avec succès',
  schemaversion381: 'j.n.Y',

  // app\Notifications\NewUserRegistered.php
  newuserregistered40: 'd.m.Y H:i:s',
  newuserregistered43: '?? Nouvelle inscription sur Scoriet',
  newuserregistered44: 'Bonjour Administrateur !',
  newuserregistered45: 'Un nouvel utilisateur s\'est inscrit sur Scoriet :',
  newuserregistered47: '**Informations utilisateur :**',
  newuserregistered48: '• **Nom:** ',
  newuserregistered49: '• **Nom d\'utilisateur:** ',
  newuserregistered50: '• **E-mail:**',
  newuserregistered51: '• **ID de l\'utilisateur:** ',
  newuserregistered52: '• **Enregistré le :**',
  newuserregistered54: '**Statut de l\'e-mail :**',
  newuserregistered56: 'Afficher les utilisateurs dans le panneau d\'administration',
  newuserregistered57: 'Cet email a été généré automatiquement.',
  newuserregistered58: 'Meilleures salutations du système Scoriet',

  // app\Observers\ProjectGenerationTreeObserver.php
  projectgenerationtreeobserver17: '🌳 [GENERATION-TREE-OBSERVER] tree_data mis à jour pour le projet {$generationTree->project_id}',
  projectgenerationtreeobserver30: '🌳 [GENERATION-TREE-OBSERVER] événement enregistré pour le projet {$generationTree->project_id}',
  projectgenerationtreeobserver44: '🌳 [GENERATION-TREE-OBSERVER] Mise à jour de diffusion pour le projet {$generationTree->project_id}',
  projectgenerationtreeobserver60: '🌳 [GENERATION-TREE-OBSERVER] Échec de la diffusion de la mise à jour de l\'arbre :',

  // app\Observers\ProjectObserver.php
  projectobserver18: 'Mise à jour des langues du projet {$project->id} : Régénération en cours',

  // app\Observers\ProjectSchemaObserver.php
  projectschemaobserver23: '🔔 [PROJECT-SCHEMA-OBSERVER] Schéma attribué au projet',
  projectschemaobserver33: '✅ [PROJECT-SCHEMA-OBSERVER] Tâche d\'arbre de génération envoyée',
  projectschemaobserver37: '❌ [PROJECT-SCHEMA-OBSERVER] Échec de l\'envoi du travail',
  projectschemaobserver51: '🔔 [PROJECT-SCHEMA-OBSERVER] Schéma supprimé du projet',
  projectschemaobserver61: '✅ [PROJECT-SCHEMA-OBSERVER] Tâche d\'arbre de génération envoyée',
  projectschemaobserver65: '❌ [PROJECT-SCHEMA-OBSERVER] Échec de l\'envoi du travail',

  // app\Observers\ProjectTemplateUsageObserver.php
  projecttemplateusageobserver16: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] a créé un événement déclenché pour l\'utilisation {$projectTemplateUsage->id} (projet : {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver27: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] is_active a été modifié pour l\'utilisation {$projectTemplateUsage->id} (projet : {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver37: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] événement supprimé déclenché pour l\'utilisation {$projectTemplateUsage->id} (projet : {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver48: 'ProjectTemplateUsage {$projectTemplateUsage->id} ({$action}) : Régénération du projet {$projectId}',
  projecttemplateusageobserver52: 'Tâche de régénération envoyée avec succès pour le projet {$projectId}',
  projecttemplateusageobserver54: 'Échec de l\'envoi de la tâche de régénération pour le projet {$projectId} :',

  // app\Observers\SchemaTableObserver.php
  schematableobserver17: '📋 [SCHEMA-TABLE-OBSERVER] a créé un événement déclenché pour la table {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver26: '📋 [SCHEMA-TABLE-OBSERVER] événement mis à jour déclenché pour la table {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver35: '📋 [SCHEMA-TABLE-OBSERVER] événement supprimé déclenché pour la table {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver52: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}) : aucun projet actif trouvé',
  schematableobserver56: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}) : Régénération pour TOUS',
  schematableobserver66: '📋 [SCHEMA-TABLE-OBSERVER] Exécution synchrone d\'une tâche de régénération pour le projet {$projectId}',
  schematableobserver72: 'Tâche de régénération envoyée avec succès pour le projet {$projectId}',
  schematableobserver75: 'Échec de l\'envoi/exécution de la tâche de régénération pour le projet {$projectId} :',

  // app\Observers\SchemaVersionObserver.php
  schemaversionobserver17: 'SchemaVersionObserver : événement créé déclenché pour la version de schéma {$schemaVersion->id}',
  schemaversionobserver50: 'SchemaVersion {$schemaVersion->id} ({$action}) : aucun projet actif trouvé',
  schemaversionobserver54: 'SchemaVersion {$schemaVersion->id} ({$action}) : Envoi de la régénération pour TOUS',
  schemaversionobserver64: 'SchemaVersion {$schemaVersion->id} ({$action}) : exécution synchrone d\'une tâche de régénération pour le projet {$projectId}',
  schemaversionobserver70: 'Tâche de régénération envoyée avec succès pour le projet {$projectId}',
  schemaversionobserver73: 'Échec de l\'envoi/exécution de la tâche de régénération pour le projet {$projectId} :',

  // app\Observers\TemplateFileObserver.php
  templatefileobserver17: '📄 [TEMPLATE-FILE-OBSERVER] a créé un événement déclenché pour le fichier {$templateFile->id} (modèle : {$templateFile->template_id})',
  templatefileobserver26: '📄 [TEMPLATE-FILE-OBSERVER] événement mis à jour déclenché pour le fichier {$templateFile->id} (modèle : {$templateFile->template_id})',
  templatefileobserver35: '📄 [TEMPLATE-FILE-OBSERVER] événement supprimé déclenché pour le fichier {$templateFile->id} (modèle : {$templateFile->template_id})',
  templatefileobserver53: 'TemplateFile {$templateFile->id} ({$action}) : aucun projet affecté',
  templatefileobserver57: 'TemplateFile {$templateFile->id} ({$action}) : Envoi de la régénération pour',
  templatefileobserver63: 'Tâche de régénération envoyée avec succès pour le projet {$projectId}',
  templatefileobserver65: 'Échec de l\'envoi de la tâche de régénération pour le projet {$projectId} :',

  // app\Observers\TemplateObserver.php
  templateobserver17: '🧪 [TEMPLATE-OBSERVER] a créé un événement déclenché pour le modèle {$template->id} ({$template->name})',
  templateobserver53: 'Le modèle {$template->id} a été supprimé de force',
  templateobserver70: 'Modèle {$template->id} ({$action}) : Aucun projet affecté',
  templateobserver74: 'Modèle {$template->id} ({$action}) : Envoi de la régénération pour',

  // appotificationsewUserRegistered.php
  appotificationsewuserregistered40: 'd.m.Y H:i:s',
  appotificationsewuserregistered43: '🎉 Nouvelle inscription sur Scoriet',
  appotificationsewuserregistered44: 'Bonjour Administrateur !',
  appotificationsewuserregistered45: 'Un nouvel utilisateur s\'est inscrit sur Scoriet :',
  appotificationsewuserregistered47: '**Informations utilisateur :**',
  appotificationsewuserregistered48: '• **Nom:** ',
  appotificationsewuserregistered49: 'Non spécifié',
  appotificationsewuserregistered50: '• **E-mail:**',
  appotificationsewuserregistered51: '• **ID de l\'utilisateur:** ',
  appotificationsewuserregistered52: '• **Enregistré le :**',
  appotificationsewuserregistered54: '⏳ Pas encore confirmé',
  appotificationsewuserregistered56: 'Afficher les utilisateurs dans le panneau d\'administration',
  appotificationsewuserregistered57: 'Cet email a été généré automatiquement.',
  appotificationsewuserregistered58: 'Meilleures salutations du système Scoriet',

  // app\Services\MySQLParser.php
  mysqlparser18: 'Erreur d\'analyse :',

  // app\Services\ProjectFileTreeGenerator.php
  projectfiletreegenerator120: '🧪 [TREE-GEN] Tables chargées à partir de TOUS les schémas :',
  projectfiletreegenerator193: 'A-m-j',
  projectfiletreegenerator194: 'Son',
  projectfiletreegenerator195: 'Y-m-d_H-i-s',
  projectfiletreegenerator226: '🧪 [TREE-GEN] Le chemin résolu est vide pour l\'ID TemplateFile {$templateFile->id}',
  projectfiletreegenerator263: 'A-m-j',
  projectfiletreegenerator264: 'Son',
  projectfiletreegenerator265: 'Y-m-d_H-i-s',
  projectfiletreegenerator296: '🧪 [TREE-GEN] Le chemin résolu est vide pour l\'ID TemplateFile {$templateFile->id}',
  projectfiletreegenerator331: 'A-m-j',
  projectfiletreegenerator332: 'Son',
  projectfiletreegenerator333: 'Y-m-d_H-i-s',
  projectfiletreegenerator364: '🧪 [TREE-GEN] Le chemin résolu est vide pour l\'ID TemplateFile {$templateFile->id}',
  projectfiletreegenerator498: 'de_DE',
  projectfiletreegenerator500: 'fr_FR',
  projectfiletreegenerator502: 'il_IT',
  projectfiletreegenerator504: 'nl_NL',
  projectfiletreegenerator505: 'pl_PL',
  projectfiletreegenerator506: 'ru_RU',
  projectfiletreegenerator507: 'ja_JP',
  projectfiletreegenerator508: 'zh_CN',

  // app\Services\SchemaStorageService.php
  schemastorageservice226: 'Tableau référencé',
  schemastorageservice394: '🔧 Clé de fichier migrée',
  schemastorageservice413: '🔧 Nom du fichier renommé migré',
  schemastorageservice427: '🔧 Nom de fichier court migré',
  schemastorageservice436: '🔧 Nom de fichier court généré automatiquement',

  // app\Services\SimpleFixedTemplateEngine.php
  simplefixedtemplateengine661: '✅ {filename} est correctement remplacé par accounting_log',
  simplefixedtemplateengine662: '✅ Plus de fantômes dans JavaScript',
  simplefixedtemplateengine663: '✅ Les modèles sont construits sur leurs propres lignes',
  simplefixedtemplateengine664: '✅ Structures en boucle propres',
  simplefixedtemplateengine665: '✅ Pas d\'expression régulière - uniquement des opérations sur les chaînes',

  // app\Services\SimpleTemplateEngine.php
  simpletemplateengine128: 'Inconnu',
  simpletemplateengine129: 'Inconnu',
  simpletemplateengine130: 'Inconnu',
  simpletemplateengine153: 'Inconnu',
  simpletemplateengine154: 'Inconnu',

  // app\Services\SQLParser.php
  sqlparser71: 'Erreur de syntaxe SQL : jeton attendu',
  sqlparser75: 'Erreur de syntaxe SQL : attendue',
  sqlparser83: 'Erreur de syntaxe SQL : Fin inattendue du script SQL {$context}. Point-virgule manquant ou instruction incomplète ?',
  sqlparser96: 'à la fin de SQL',
  sqlparser130: '(Ligne SQL : {$currentLine}',
  sqlparser152: 'Nom de table attendu',
  sqlparser237: 'Nom de champ attendu',
  sqlparser466: 'Nom de table attendu',

  // app\Services\StepByStepTemplateEngine.php
  stepbysteptemplateengine392: 'Les constructions de modèles sont divisées en lignes individuelles',
  stepbysteptemplateengine394: '{for} et {if} sont traités comme des blocs séparés',
  stepbysteptemplateengine395: 'plus en JavaScript',
  stepbysteptemplateengine396: 'Nettoyeur',

  // app\Services\UltimateTemplateEngine.php
  ultimatetemplateengine195: 'Profondeur de boucle maximale dépassée',
  ultimatetemplateengine656: '// Format de boucle en ligne inconnu : {$matchText}',
  ultimatetemplateengine968: '// Fonctions de modèle intégrées',

  // resources/js\app.tsx
  app48: 'EUR',
  app59: 'EUR',

  // resources/js\Components\AuthModals\AuthModalManager.tsx
  authmodalmanager3: './RegisterModal',
  authmodalmanager5: './ProfileModal',
  authmodalmanager7: './PlanModal',

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: 'Les mots de passe ne correspondent pas',
  authmodalsegistermodal84: 'Inscription échouée. Veuillez réessayer.',
  authmodalsegistermodal94: 'Inscription réussie ! Veuillez consulter votre boîte mail pour obtenir un lien de vérification avant de vous connecter.',
  authmodalsegistermodal109: 'Une erreur s\'est produite',
  authmodalsegistermodal203: 'Registre',
  authmodalsegistermodal239: 'Votre nom complet',
  authmodalsegistermodal293: 'Votre mot de passe',
  authmodalsegistermodal312: 'Répéter le mot de passe',
  authmodalsegistermodal335: 'Sélectionner la langue',
  authmodalsegistermodal351: 'Sélectionner la langue',
  authmodalsegistermodal366: 'Sélectionner la langue',
  authmodalsegistermodal379: 'Registre',
  authmodalsegistermodal388: 'Vous avez déjà un compte ? Se connecter',

  // resources/js\Components\AuthModalsesetPasswordModal.tsx
  authmodalsesetpasswordmodal73: 'Ce lien de réinitialisation est invalide ou a expiré.',
  authmodalsesetpasswordmodal79: 'Erreur lors de la validation du lien de réinitialisation.',
  authmodalsesetpasswordmodal122: 'Erreur de mot de passe:',
  authmodalsesetpasswordmodal124: 'Erreur de jeton :',
  authmodalsesetpasswordmodal127: 'Une erreur inconnue s\'est produite. Veuillez réessayer.',
  authmodalsesetpasswordmodal131: 'Erreur réseau - veuillez réessayer plus tard.',
  authmodalsesetpasswordmodal162: 'Fermer',
  authmodalsesetpasswordmodal265: 'Entrez un nouveau mot de passe',
  authmodalsesetpasswordmodal287: 'Répéter le mot de passe',
  authmodalsesetpasswordmodal319: 'Réinitialiser le mot de passe',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: 'Erreur lors de l\'envoi de l\'e-mail',
  forgotpasswordmodal46: 'Un lien de réinitialisation de mot de passe a été envoyé à votre adresse e-mail.',
  forgotpasswordmodal50: 'Une erreur s\'est produite',
  forgotpasswordmodal73: 'Mot de passe oublié',

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal83: 'Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
  forgotpasswordmodal105: 'E-mail',
  forgotpasswordmodal113: 'votre.email@exemple.com',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: 'Réinitialiser le lien Envoyer',
  forgotpasswordmodal131: 'Retour à la connexion',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginPasswordHint: 'Votre mot de passe',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal46: 'langue modifiée',
  loginmodal49: 'langue modifiée',
  loginmodal88: 'L\'adresse e-mail doit être confirmée. Veuillez consulter vos e-mails.',
  loginmodal93: 'La connexion a échoué',
  loginmodal136: 'Une erreur s\'est produite',
  loginmodal139: 'La connexion a échoué',
  loginmodal140: 'L\'e-mail/nom d\'utilisateur ou le mot de passe est incorrect.',
  loginmodal142: 'L\'adresse e-mail doit être confirmée.',
  loginmodal184: 'Un e-mail de confirmation a été envoyé à nouveau !',
  loginmodal189: 'Erreur lors de l\'envoi de l\'e-mail. Veuillez réessayer ultérieurement.',
  loginmodal212: 'Se connecter',

  // resources/js/Components/AuthModals/LoginModal.tsx
  loginmodal241: 'Votre adresse email n\'a pas encore été confirmée.',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal246: 'Renvoyer l\'e-mail de confirmation',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginDemoTextHeader: 'Mode démo disponible',
  LoginDemoDescription: 'Testez Scoriet sans inscription avec des données de démonstration prêtes à l\'emploi :',
  LoginDemoAdmin: '- Accès complet, 2 équipes, 3 projets',
  LoginDemoUser: '- Membre de l\'équipe, affecté à 1 projet',
  LoginToolTip: 'Cliquez sur les cartes ci-dessus pour une démonstration instantanée ou saisissez le nom d\'utilisateur de démonstration manuellement (laissez le mot de passe vide) - La démonstration redémarre toutes les 20 minutes',
  LoginEmailOrUserName: 'E-mail ou nom d\'utilisateur',
  LoginEmailOrUserNameHint: 'demo-admin ou demo-user',
  LoginPassword: 'Mot de passe',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal317: 'Laisser vide pour la démonstration',
  loginmodal334: 'souviens-toi de moi',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: 'Rester connecté (30 jours)',
  LoginStayLoggedInTooltip: 'Vous resterez connecté même après la fermeture du navigateur',
  LoginDoLogin: 'Connexion...',
  LoginButton: 'Connexion',
  LoginRegister: 'Vous n\'avez pas de compte ? Inscrivez-vous',
  LoginForgotPassword: 'Mot de passe oublié?',

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal26: 'EUR',
  planmodal43: 'Gratuit',
  planmodal46: 'Parfait pour les projets personnels',
  planmodal48: 'Jusqu\'à 3 projets',
  planmodal49: 'Modèles de base',
  planmodal50: 'Analyse de schéma SQL',
  planmodal51: 'Soutien communautaire',
  planmodal53: 'Plan actuel',
  planmodal58: 'Prime',
  planmodal62: 'Idéal pour les développeurs professionnels',
  planmodal64: 'Projets illimités',
  planmodal65: 'Modèles avancés',
  planmodal66: 'Création de modèles personnalisés',
  planmodal67: 'Assistance prioritaire',
  planmodal68: 'Fonctionnalités SQL avancées',
  planmodal69: 'Collaboration d\'équipe',
  planmodal71: 'Choisissez Premium',
  planmodal76: 'Entreprise',
  planmodal80: 'Idéal pour les équipes et les agences',
  planmodal82: 'Toutes les fonctionnalités Premium',
  planmodal83: 'Outils de collaboration d\'équipe',
  planmodal84: 'Intégration de l\'API Google Translate',
  planmodal85: 'Analyses avancées',
  planmodal86: 'Assistance prioritaire avec SLA',
  planmodal87: 'Options de personnalisation de marque',
  planmodal89: 'Choisissez une entreprise',
  planmodal94: 'Patron',
  planmodal97: 'Soutenir la communauté',
  planmodal99: 'Toutes les fonctionnalités Business',
  planmodal100: 'Accès anticipé aux fonctionnalités',
  planmodal101: 'Développement de l\'influence',
  planmodal102: 'Accès à la communauté Discord',
  planmodal103: 'Montant personnalisé (5-50€+)',
  planmodal105: 'Choisissez un mécène',
  planmodal116: 'Choisissez votre forfait',
  planmodal126: 'Plan actuel',
  planmodal127: 'Gratuit',
  planmodal130: 'Plan gratuit',
  planmodal143: 'LE PLUS POPULAIRE',
  planmodal147: 'Patron',
  planmodal151: 'Coutume',
  planmodal173: 'Gratuit',
  planmodal175: 'Gratuit',
  planmodal177: 'Gratuit',
  planmodal190: 'Vous pouvez modifier ou annuler votre forfait à tout moment. Tous les forfaits incluent une garantie satisfait ou remboursé de 30 jours.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal42: 'langue modifiée',
  profilemodal45: 'langue modifiée',
  profilemodal115: 'Non connecté',
  profilemodal127: 'Erreur lors du chargement des données utilisateur',
  profilemodal146: 'Erreur de chargement',
  profilemodal167: 'Non connecté',
  profilemodal186: 'Erreur lors de la mise à jour',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: 'Profil mis à jour avec succès',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: 'Erreur de mise à jour du profil',
  profilemodal214: 'langue modifiée',
  profilemodal246: 'Les nouveaux mots de passe ne correspondent pas',
  profilemodal254: 'Non connecté',
  profilemodal273: 'Erreur lors du changement de mot de passe',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: 'Mot de passe changé avec succès',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal280: 'Une erreur s\'est produite',
  profilemodal305: 'SUPPRIMER',
  profilemodal306: 'Vous devez saisir SUPPRIMER pour supprimer votre compte',
  profilemodal314: 'Non connecté',
  profilemodal318: 'SUPPRIMER',
  profilemodal331: 'Erreur lors de la suppression du compte',
  profilemodal334: 'Compte supprimé avec succès. Vous serez automatiquement déconnecté.',
  profilemodal346: 'Une erreur s\'est produite',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: 'Paramètres du profil',
  profileTab: 'Profil',
  profilemodal406: 'ID de l\'utilisateur',
  profilemodal421: 'Nom d\'utilisateur',
  fullName: 'Nom complet',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal447: 'Votre nom complet',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  emailAddress: 'Adresse e-mail',
  profilemodal463: 'votre.email@exemple.com',
  preferredLanguage: 'Langue préférée',
  languageDescription: 'Choisissez votre langue préférée pour l\'interface de l\'application',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal498: 'Sélectionner la langue',
  profilemodal510: 'Sélectionner la langue',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  updating: 'Mise à jour...',
  updateProfile: 'Mettre à jour le profil',
  passwordTab: 'Changer le mot de passe',
  currentPassword: 'Mot de passe actuel',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal555: 'Votre mot de passe actuel',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  newPassword: 'Nouveau mot de passe',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal573: 'Votre nouveau mot de passe',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  confirmPassword: 'Confirmer le nouveau mot de passe',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal591: 'Répéter le nouveau mot de passe',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  changing: 'Changement...',
  changePassword: 'Changer le mot de passe',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal611: 'Plans et facturation',
  profilemodal616: 'Plan actuel',
  profilemodal617: 'Gratuit',
  profilemodal620: 'Plan gratuit',
  profilemodal626: 'Plans disponibles',
  profilemodal632: 'Gratuit',
  profilemodal635: '• Jusqu\'à 3 projets',
  profilemodal636: '• Modèles de base',
  profilemodal637: '• Soutien communautaire',
  profilemodal640: 'Actuel',
  profilemodal648: 'Prime',
  profilemodal651: '• Projets illimités',
  profilemodal652: '• Modèles avancés',
  profilemodal653: '• Assistance prioritaire',
  profilemodal654: '• Collaboration d\'équipe',
  profilemodal658: 'Mise à niveau',
  profilemodal661: 'Passez à Premium - Bientôt disponible !',
  profilemodal670: 'Patron',
  profilemodal673: '• Toutes les fonctionnalités Premium',
  profilemodal674: '• Accès anticipé aux fonctionnalités',
  profilemodal675: '• Accès à la communauté Discord',
  profilemodal676: '• Montant personnalisé (5-50 €+)',
  profilemodal680: 'Devenir mécène',
  profilemodal683: 'Devenez mécène – Bientôt disponible !',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleteTab: 'Supprimer le compte',
  profilemodal714: 'Cette action est irréversible. Votre compte et toutes les données associées seront définitivement supprimés.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal718: 'Tous vos projets et modèles seront supprimés',
  profilemodal719: 'Vos adhésions à l\'équipe seront résiliées',
  profilemodal720: 'Cette action ne peut pas être annulée',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal725: 'Confirmer le mot de passe actuel',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal732: 'Votre mot de passe actuel',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal743: 'Entrez SUPPRIMER pour confirmer',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal744: 'SUPPRIMER',
  profilemodal750: 'confirmer le texte',
  profilemodal751: 'SUPPRIMER',
  profilemodal757: 'SUPPRIMER',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: 'Suppression...',
  saving: 'Enregistrement...',
  deleteAccount: 'Supprimer le compte',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal766: 'SUPPRIMER',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: 'Les mots de passe ne correspondent pas',
  registermodal84: 'Inscription échouée. Veuillez réessayer.',
  registermodal94: 'Inscription réussie ! Veuillez consulter votre boîte mail pour obtenir un lien de vérification avant de vous connecter.',

  // resources\js\Components\AuthModals\RegisterModal.tsx
  registermodal102: 'Inscription réussie ! ${userId ? `Votre identifiant utilisateur est : ${userId}. ` : \'\'}Vous pouvez maintenant vous connecter.',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: 'Une erreur s\'est produite',
  registermodal203: 'Registre',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: 'Nom',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal239: 'Votre nom complet',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal244: 'Votre nom complet',
  registermodal261: 'nom d\'utilisateur123',
  registermodal274: 'E-mail',
  registermodal282: 'votre.email@exemple.com',
  registermodal291: 'mot de passe',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal293: 'Votre mot de passe',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal298: 'Votre mot de passe',
  registermodal310: 'Confirmez le mot de passe',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal312: 'Répéter le mot de passe',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal317: 'Répéter le mot de passe',
  registermodal329: 'Langue préférée',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal335: 'Sélectionner la langue',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal340: 'Sélectionner la langue',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal351: 'Sélectionner la langue',
  registermodal366: 'Sélectionner la langue',
  registermodal379: 'Inscription en cours...',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal384: 'Registre',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: 'Vous avez déjà un compte ? Se connecter',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal393: 'Vous avez déjà un compte ? Se connecter',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal59: 'Requête XMLHttp',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal73: 'Ce lien de réinitialisation est invalide ou a expiré.',
  resetpasswordmodal79: 'Erreur lors de la validation du lien de réinitialisation.',
  resetpasswordmodal122: 'Erreur de mot de passe:',
  resetpasswordmodal124: 'Erreur de jeton :',
  resetpasswordmodal127: 'Une erreur inconnue s\'est produite. Veuillez réessayer.',
  resetpasswordmodal131: 'Erreur réseau - veuillez réessayer plus tard.',
  resetpasswordmodal162: 'Fermer',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal191: 'Le lien de réinitialisation est en cours de validation...',
  resetpasswordmodal194: 'Un instant s\'il vous plaît...',
  resetpasswordmodal208: 'Vous serez automatiquement redirigé vers la connexion...',
  resetpasswordmodal219: 'Lien de réinitialisation invalide',
  resetpasswordmodal231: 'Pour se connecter',
  resetpasswordmodal234: 'Demandez un nouveau lien de réinitialisation si vous souhaitez réinitialiser votre mot de passe.',
  resetpasswordmodal243: 'E-mail',
  resetpasswordmodal259: 'Nouveau mot de passe',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal265: 'Entrez un nouveau mot de passe',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal281: 'Confirmez le mot de passe',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal287: 'Répéter le mot de passe',
  resetpasswordmodal319: 'Réinitialiser le mot de passe',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal332: 'Continuer à se connecter',
  resetpasswordmodal345: 'Le lien de réinitialisation n\'est pas valide ou a expiré.',
  resetpasswordmodal374: 'Se connecter',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: 'Échec du chargement des schémas',
  databaseexportmodal93: 'Échec du chargement des schémas',
  databaseexportmodal114: 'Échec du chargement des versions de schéma',
  databaseexportmodal141: 'Échec du chargement des versions de schéma',
  databaseexportmodal169: 'Aucun projet sélectionné. Veuillez d\'abord en sélectionner un.',
  databaseexportmodal195: 'Veuillez sélectionner une base de données et une version à exporter',
  databaseexportmodal214: 'Aucune table trouvée dans ce schéma. Le schéma est peut-être vide ou la version n\'existe pas.',
  databaseexportmodal216: 'Accès refusé à ce schéma. Veuillez vérifier vos autorisations.',
  databaseexportmodal225: 'L\'exportation a échoué',
  databaseexportmodal228: '-- Aucun SQL généré',
  databaseexportmodal238: 'L\'exportation a échoué',
  databaseexportmodal269: ' (Actuel)',
  databaseexportmodal285: '📤 Exporter le schéma de la base de données',
  databaseexportmodal308: 'Exporter le schéma de base de données sous forme de script MySQL SQL',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: 'Schéma de base de données',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal329: 'Chargement des schémas...',
  databaseexportmodal338: 'Sélectionner la base de données...',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal339: 'w-full personnalisé-menu déroulant',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: 'Aucun projet sélectionné',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal351: 'Version',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal355: 'Sélectionnez d\'abord la base de données',
  databaseexportmodal357: 'Chargement des versions...',
  databaseexportmodal363: 'Sélectionnez la version...',
  databaseexportmodal368: 'Aucune version trouvée',
  databaseexportmodal380: '📥 Télécharger .sql',
  databaseexportmodal388: '👁️ Afficher SQL',
  databaseexportmodal403: 'Script SQL généré',
  databaseexportmodal406: '📋 Copie',
  databaseexportmodal412: '💾 Télécharger',

  // resources/js\Components\EmailVerification.tsx
  emailverification55: 'Erreur de confirmation de l\'e-mail',
  emailverification59: 'Erreur réseau - veuillez réessayer plus tard',
  emailverification68: 'Lien de confirmation invalide',
  emailverification107: 'Confirmation par e-mail',
  emailverification112: 'L\'email est confirmé...',

  // resources/js/Components/EmailVerification.tsx
  emailverification127: 'Vous êtes maintenant connecté et serez automatiquement redirigé vers l\'application.',
  emailverification135: 'Vous pouvez maintenant commencer à collaborer avec votre équipe.',

  // resources/js\Components\EmailVerification.tsx
  emailverification141: 'Accéder à l\'application maintenant',

  // resources/js/Components/EmailVerification.tsx
  emailverification151: 'Si vous continuez à rencontrer des problèmes, veuillez contacter le support.',

  // resources/js\Components\EmailVerification.tsx
  emailverification155: 'Vers la page d\'accueil',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: 'Une erreur inattendue s\'est produite. Pas d\'inquiétude, vos données sont en sécurité.',
  errorfallback40: 'Détails de l\'erreur :',
  errorfallback58: 'Essayer à nouveau',
  errorfallback65: 'Recharger la page et réinitialiser',
  errorfallback65_2: ' Le bouton supprime toutes les données locales (disposition, paramètres et déconnexion !) et redémarre l\'application.',
  errorfallback75: 'Un avis :',

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: 'Conseil : si le problème persiste, veuillez contacter le support.',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback78: 'Conseil : si le problème persiste',

  // resources/js\Components\LanguageSelector.tsx
  languageselector68: 'Sélectionner la langue',
  languageselector69: 'Sélectionner la langue',

  // resources/js/Components/LanguageSelector.tsx
  languageselector87: 'Choisir la langue',

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: 'Non authentifié',
  applicationsmodal78: 'Échec du chargement des applications',
  applicationsmodal85: 'Erreur lors du chargement des applications',
  applicationsmodal106: 'Non authentifié',
  applicationsmodal125: 'Échec de l\'examen de la demande',
  applicationsmodal143: 'Erreur lors de l\'examen de la demande',
  applicationsmodal200: 'Aucun message',
  applicationsmodal228: 'Approuver la demande',
  applicationsmodal234: 'Rejeter la demande',
  applicationsmodal252: 'Inconnu',
  applicationsmodal301: 'Aucune application trouvée',
  applicationsmodal313: 'Rafraîchir',
  applicationsmodal322: 'Demandeur',
  applicationsmodal329: 'Message',
  applicationsmodal335: 'Statut',
  applicationsmodal342: 'Appliqué',
  applicationsmodal348: 'Révisé par',
  applicationsmodal354: 'Actes',
  applicationsmodal363: 'Fermer',
  applicationsmodal374: 'Rejeter',
  applicationsmodal402: 'Message:',
  applicationsmodal412: 'Motif du rejet',
  applicationsmodal420: 'Accueillez-les dans le projet...',
  applicationsmodal421: 'Faites-leur savoir pourquoi leur candidature a été rejetée...',
  applicationsmodal432: 'Annuler',
  applicationsmodal439: 'Traitement...',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: 'Le nom de la table est obligatoire',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal191: 'Le nom de la table est obligatoire',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: 'Tous les champs doivent avoir un nom',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal196: 'Tous les champs doivent avoir un nom',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: 'Les noms de champs doivent être uniques',
  createtablemodal290: 'Nom de la table *',
  createtablemodal300: 'par exemple, utilisateurs, produits, commandes',
  createtablemodal306: 'Nom de la clé de fichier',
  createtablemodal316: 'Tapez ou sélectionnez un nom de clé',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal318: 'Tapez ou sélectionnez un nom de clé',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal330: 'Nom du fichier renommé',
  createtablemodal339: 'par exemple, CustomUser, ProductCatalog',
  createtablemodal348: 'Nom de fichier court',
  createtablemodal370: 'Champs *',
  createtablemodal380: 'Ajouter un champ',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal382: 'Ajouter un champ',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal391: 'Nom',
  createtablemodal398: 'nom_du_champ',
  createtablemodal428: 'Contrôle',
  createtablemodal482: 'Aucun',
  createtablemodal483: 'Clé primaire',
  createtablemodal484: 'Indice',
  createtablemodal485: 'Unique',
  createtablemodal497: 'Supprimer le champ',
  createtablemodal509: 'Tableau des liens',
  createtablemodal516: '-- Sélectionner le tableau --',
  createtablemodal525: 'Champ de valeur',
  createtablemodal532: '-- Champ de valeur --',
  createtablemodal541: 'Champ d\'affichage',
  createtablemodal548: '-- Champ d\'affichage --',
  createtablemodal557: 'Champ de commande',
  createtablemodal564: '-- Champ de commande --',
  createtablemodal573: 'Direction',
  createtablemodal603: 'Annuler',
  createtablemodal614: 'Créer...',
  createtablemodal619: 'Créer une table',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: 'Échec de la création de l\'équipe',
  createteammodal52: 'Une erreur réseau s\'est produite',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal88: 'Nom de l\'équipe *',
  createteammodal97: 'par exemple, équipe principale, contrôle qualité',
  createteammodal103: 'Description',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: 'Que fait cette équipe ?',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: 'Projets',
  createteammodal136: 'Sélectionnez un ou plusieurs projets pour cette équipe. Maintenez la touche Ctrl/Cmd enfoncée pour en sélectionner plusieurs.',
  createteammodal153: 'Annuler',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal164: 'Créer...',
  createteammodal169: 'Créer une équipe',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal97: 'd.m.Y',
  editprojectmodal98: 'Son',
  editprojectmodal100: 'Europe/Vienne',
  editprojectmodal131: 'd.m.Y',
  editprojectmodal132: 'Son',
  editprojectmodal134: 'Europe/Vienne',
  editprojectmodal168: 'Non authentifié',
  editprojectmodal183: 'Échec de la mise à jour du projet',
  editprojectmodal197: 'Erreur lors de la mise à jour du projet',
  editprojectmodal215: 'Modifier le projet',
  editprojectmodal227: 'Paramètres du projet',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal230: 'Nom du projet *',
  editprojectmodal240: 'mon_nom_de_projet',
  editprojectmodal252: 'Description',
  editprojectmodal569: 'Les noms de projet sont ensuite utilisés pour les URL (nom_utilisateur/nom_du_projet).',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: 'Entrez la description du projet',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal266: 'Code d\'adhésion',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: 'Entrez le code d\'adhésion (facultatif)',
  editprojectmodal280: 'PROJ-',
  editprojectmodal281: 'Générer un code de jointure aléatoire',
  editprojectmodal285: 'Les utilisateurs peuvent rejoindre ce projet en utilisant ce code',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal298: 'Projet public',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal302: 'Rendre ce projet visible à tous les utilisateurs',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal307: 'Transfert de propriété',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal316: 'Conserver le propriétaire actuel ({project.owner.name})',
  editprojectmodal332: 'Connexion à la base de données',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal335: 'Nom de la base de données',
  editprojectmodal345: 'Nom de la base de données pour ce projet',
  editprojectmodal351: 'Type de base de données',
  editprojectmodal370: 'Serveur',
  editprojectmodal383: 'Port',
  editprojectmodal397: 'Nom d\'utilisateur',
  editprojectmodal410: 'Mot de passe',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: 'Propriétés du projet',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal429: 'Répertoire des projets',
  editprojectmodal439: 'Chemin où les fichiers générés doivent être enregistrés',
  editprojectmodal445: 'URL du projet',
  editprojectmodal455: 'URL pour accéder au projet',
  editprojectmodal461: 'Page d\'accueil',
  editprojectmodal477: 'Langue par défaut',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: 'Anglais',
  editprojectmodal485: 'Allemand',
  editprojectmodal486: 'Français',
  editprojectmodal487: 'Espagnol',
  editprojectmodal488: 'italien',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal493: 'Langage standard pour la génération de projets',
  editprojectmodal499: 'Nom de fichier court',
  editprojectmodal506: '2 personnages',
  editprojectmodal507: '3 personnages',
  editprojectmodal508: '4 caractères',
  editprojectmodal509: '5 caractères',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: 'Paramètres de localisation',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal526: 'Séparateur décimal',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal538: 'pour 1,23 ou',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal543: 'Séparateur de milliers',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal555: 'pour 1 234 ou',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal562: 'Format de date',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal568: 'd.m.Y',
  editprojectmodal573: 'pour le 31.12.2024 ou',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal578: 'Format de l\'heure',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal584: 'Son',
  editprojectmodal589: 'pour 14:30:00 ou',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal596: 'Symbole monétaire',
  editprojectmodal602: '€',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: 'CHF',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: 'Fuseau horaire',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal620: 'Europe/Vienne',
  editprojectmodal621: 'Europe/Berlin',
  editprojectmodal622: 'Europe/Zurich',
  editprojectmodal623: 'Europe/Londres',
  editprojectmodal624: 'Amérique/New_York',
  editprojectmodal625: 'Amérique/Chicago',
  editprojectmodal626: 'Amérique/Los Angeles',
  editprojectmodal627: 'Asie/Tokyo',
  editprojectmodal628: 'Asie/Dubaï',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal629: 'UTC',
  editprojectmodal634: 'Fuseau horaire pour les opérations de date/heure',
  editprojectmodal641: 'Clé API Google Traduction',
  editprojectmodal652: 'Clé API pour les traductions automatiques via Google Translate',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal689: 'Annuler',
  editprojectmodal696: 'Enregistrer les modifications',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal317: 'Le nom de la table est obligatoire',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal319: 'Le nom de la table est obligatoire',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal322: 'Tous les champs doivent avoir un nom',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal324: 'Tous les champs doivent avoir un nom',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal329: 'Les noms de champs doivent être uniques',
  edittablemodal335: 'Le nom de la clé de fichier est requis',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal337: 'Le nom de la clé de fichier est requis',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: 'Le nom de clé de fichier sélectionné doit être une clé primaire, une clé unique ou un champ indexé',
  edittablemodal397: 'Nom de la table *',
  edittablemodal407: 'par exemple, utilisateurs, produits, commandes',
  edittablemodal413: 'Nom de la clé du fichier *',
  edittablemodal422: 'Sélectionnez le champ clé...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal424: 'Sélectionnez le champ clé...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal425: '- Auto Inc',
  edittablemodal436: 'Nom du fichier renommé',
  edittablemodal445: 'par exemple, CustomUser, ProductCatalog',
  edittablemodal454: 'Nom de fichier court',
  edittablemodal476: 'Champs *',
  edittablemodal486: 'Ajouter un champ',
  edittablemodal497: 'Nom',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal499: 'Nom',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal504: 'nom_du_champ',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: 'Taper',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal534: 'Contrôle',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal536: 'Contrôle',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal614: 'Commentaire',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal616: 'Commentaire',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: 'Description du champ',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal623: 'Description du champ',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal632: 'Supprimer le champ',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal634: 'Supprimer le champ',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal644: 'Tableau des liens',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal646: 'Tableau des liens',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal651: '-- Sélectionner le tableau --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal653: '-- Sélectionner le tableau --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal660: 'Champ de valeur',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal662: 'Champ de valeur',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal667: '-- Champ de valeur --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal669: '-- Champ de valeur --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal676: 'Champ d\'affichage',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal678: 'Champ d\'affichage',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal683: '-- Champ d\'affichage --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal685: '-- Champ d\'affichage --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal692: 'Champ de commande',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal694: 'Champ de commande',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal699: '-- Champ de commande --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal701: '-- Champ de commande --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal708: 'Direction',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal710: 'Direction',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal739: 'Annuler',
  edittablemodal750: 'Mise à jour...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal752: 'Mise à jour...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal755: 'Mettre à jour le tableau',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal757: 'Mettre à jour le tableau',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: 'Veuillez saisir un code d\'adhésion',
  joincodemodal51: 'Non authentifié',
  joincodemodal63: 'Nous avons regardé partout',
  joincodemodal66: 'Code d\'inscription invalide',
  joincodemodal73: 'Vous avez déjà postulé à ce projet',
  joincodemodal80: 'Erreur lors de la recherche du projet',
  joincodemodal95: 'Non authentifié',
  joincodemodal113: 'Échec de la soumission de la demande',
  joincodemodal117: 'Candidature soumise avec succès ! Le porteur du projet examinera votre demande.',
  joincodemodal129: 'Erreur lors de la soumission de la demande',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal147: ', mois:',
  joincodemodal148: ', jour:',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: 'Rejoindre le projet',
  joincodemodal157: 'Postuler au projet',
  joincodemodal158: 'Candidature envoyée',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal181: 'Code d\'adhésion',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: 'Entrer',
  joincodemodal200: 'Chercher',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: 'Saisissez le code de participation au projet fourni par le propriétaire du projet.',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: 'Informations sur le projet',
  joincodemodal220: 'Aucune description fournie',
  joincodemodal226: 'Propriétaire:',
  joincodemodal237: 'Créé:',
  joincodemodal247: 'Équipes',
  joincodemodal261: 'Dites au propriétaire du projet pourquoi vous souhaitez rejoindre ce projet...',
  joincodemodal277: 'Candidature envoyée !',
  joincodemodal288: 'Annuler',
  joincodemodal299: 'Dos',
  joincodemodal306: 'Soumission...',
  joincodemodal316: 'Fait',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: 'Échec de l\'envoi de l\'invitation',
  manageteammodal132: 'Une erreur réseau s\'est produite',
  manageteammodal139: 'Supprimer ce membre de l\'équipe ?',
  manageteammodal144: 'SUPPRIMER',
  manageteammodal155: 'Échec de la suppression du membre',
  manageteammodal158: 'Échec de la suppression du membre',
  manageteammodal181: 'Échec du changement de rôle',
  manageteammodal184: 'Échec du changement de rôle',
  manageteammodal189: 'Annuler cette invitation ?',
  manageteammodal194: 'SUPPRIMER',
  manageteammodal206: 'Impossible d\'annuler l\'invitation',
  manageteammodal209: 'Impossible d\'annuler l\'invitation',
  manageteammodal244: 'Chargement de l\'équipe...',
  manageteammodal283: 'Aperçu',
  manageteammodal284: 'Membres (${team.members?.length || 0})',
  manageteammodal297: '{onglet.étiquette}',
  manageteammodal308: 'Informations sur l\'équipe',
  manageteammodal312: 'Nom de l\'équipe',
  manageteammodal316: 'Projet',
  manageteammodal320: 'Propriétaire',
  manageteammodal321: 'Inconnu',
  manageteammodal324: 'Statut',
  manageteammodal328: 'Inactif',
  manageteammodal334: 'Description',
  manageteammodal347: 'Membres de l\'équipe',
  manageteammodal354: 'Inviter un membre',
  manageteammodal362: 'Inviter un nouveau membre',
  manageteammodal366: 'Nom d\'utilisateur (obligatoire) *',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal373: 'par exemple, jonction 77',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal377: 'E-mail (facultatif)',
  manageteammodal383: 'E-mail de notification facultatif',
  manageteammodal388: 'Rôle',
  manageteammodal394: 'Membre',
  manageteammodal395: 'Administrateur',
  manageteammodal399: 'Message (facultatif)',
  manageteammodal404: 'Message de bienvenue pour l\'invitation',
  manageteammodal432: 'Envoi...',
  manageteammodal437: 'Envoyer une invitation',
  manageteammodal456: '{membre.utilisateur.email}',
  manageteammodal469: 'Promouvoir au rang d\'administrateur',
  manageteammodal477: 'Rétrograder au rang de membre',
  manageteammodal485: 'Supprimer un membre',
  manageteammodal501: 'Invitations en attente',
  manageteammodal505: 'Aucune invitation en attente',
  manageteammodal534: 'Annuler l\'invitation',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal553: 'Fermer',

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal179: 'Non authentifié',
  membermodal191: 'Échec du chargement des détails de l\'équipe',
  membermodal244: 'Échec du chargement des données',
  membermodal297: 'Non authentifié',
  membermodal316: 'Échec de l\'ajout d\'un membre à l\'équipe',
  membermodal323: 'Succès',
  membermodal335: 'Erreur',
  membermodal336: 'Échec de l\'ajout d\'un membre à l\'équipe',
  membermodal348: 'Avertissement',
  membermodal349: 'Impossible de supprimer le propriétaire de l\'équipe',
  membermodal357: 'Supprimer un membre',
  membermodal365: 'Non authentifié',
  membermodal369: 'SUPPRIMER',
  membermodal378: 'Échec de la suppression du membre',
  membermodal383: 'Succès',
  membermodal384: 'Membre supprimé avec succès',
  membermodal394: 'Erreur',
  membermodal395: 'Échec de la suppression du membre',
  membermodal407: 'Avertissement',
  membermodal408: 'Impossible de changer le rôle du propriétaire',
  membermodal417: 'Non authentifié',
  membermodal432: 'Échec de la mise à jour du rôle',
  membermodal437: 'Succès',
  membermodal438: 'Le rôle du membre a été mis à jour avec succès',
  membermodal448: 'Erreur',
  membermodal449: 'Échec de la mise à jour du rôle',
  membermodal458: 'Membre',
  membermodal459: 'Administrateur',
  membermodal479: 'Disponible',
  membermodal483: 'Disponible',
  membermodal509: 'C\'est le',
  membermodal527: 'Propriétaire',
  membermodal536: 'Supprimer de l\'équipe',
  membermodal549: 'Affecter à l\'équipe',
  membermodal582: 'Disponible',
  membermodal590: 'Aucun membre trouvé',
  membermodal597: 'Membre',
  membermodal603: 'Rôle',
  membermodal609: 'Inscrit',
  membermodal614: 'Actes',
  membermodal625: 'Fermer',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal53: 'Non authentifié',
  pendinginvitationmodal70: 'Échec du chargement de l\'invitation en attente',
  pendinginvitationmodal76: 'Erreur lors du chargement de l\'invitation',
  pendinginvitationmodal97: 'Non authentifié',
  pendinginvitationmodal112: 'Bienvenue dans l\'équipe ! 🎉',
  pendinginvitationmodal118: 'Impossible d\'accepter l\'invitation',
  pendinginvitationmodal121: 'Erreur lors de l\'acceptation de l\'invitation',
  pendinginvitationmodal136: 'Non authentifié',
  pendinginvitationmodal151: 'Invitation refusée',
  pendinginvitationmodal157: 'Impossible de refuser l\'invitation',
  pendinginvitationmodal160: 'Erreur lors du refus de l\'invitation',
  pendinginvitationmodal169: '✅ Accepter et rejoindre le projet',
  pendinginvitationmodal176: '❌ Déclin',
  pendinginvitationmodal189: '🎉 Invitation au projet',
  pendinginvitationmodal200: 'Chargement de l\'invitation...',

  // resources/js/Components/Modals/PendingInvitationModal.tsx
  pendinginvitationmodal213: 'Complétez votre inscription en acceptant cette invitation',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal234: 'Invité par :',
  pendinginvitationmodal244: 'Votre rôle:',
  pendinginvitationmodal251: 'Propriétaire du projet:',
  pendinginvitationmodal261: 'Expire le :',
  pendinginvitationmodal270: 'Message personnel:',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal45: 'Membre',
  projectinvitationsmodal46: 'Administrateur',
  projectinvitationsmodal74: 'Non authentifié',
  projectinvitationsmodal86: 'Échec du chargement des invitations',
  projectinvitationsmodal93: 'Erreur lors du chargement des invitations',
  projectinvitationsmodal100: '=== useEffect déclenché ===',
  projectinvitationsmodal102: 'Chargement des invitations...',
  projectinvitationsmodal113: '=== ENVOYER L\'INVITATION DÉBUT ===',
  projectinvitationsmodal118: 'Les États sont autorisés à récupérer',
  projectinvitationsmodal122: 'Non authentifié',
  projectinvitationsmodal141: 'Réponse reçue :',
  projectinvitationsmodal144: 'Échec de l\'envoi de l\'invitation',
  projectinvitationsmodal147: 'Définition du message de réussite...',
  projectinvitationsmodal148: '✅ Invitation envoyée avec succès ! E-mail envoyé.',
  projectinvitationsmodal150: 'Formulaire de compensation...',
  projectinvitationsmodal153: 'LE MESSAGE DE RÉUSSITE EST MAINTENANT DÉFINI - Devrait être visible !',
  projectinvitationsmodal157: 'Ajout d\'une invitation à la liste - données brutes :',
  projectinvitationsmodal171: 'Toi',
  projectinvitationsmodal177: 'Ajout d\'une invitation enrichie :',
  projectinvitationsmodal182: 'Appel du rappel onSuccess...',
  projectinvitationsmodal187: 'Message de réussite de suppression automatique après 5 secondes',
  projectinvitationsmodal191: '=== ENVOYER L\'INVITATION FIN - SUCCÈS ===',
  projectinvitationsmodal193: 'Erreur lors de l\'envoi de l\'invitation',
  projectinvitationsmodal204: 'Annuler l\'invitation',
  projectinvitationsmodal212: 'SUPPRIMER',
  projectinvitationsmodal220: '✅ Invitation annulée avec succès',
  projectinvitationsmodal229: 'Impossible d\'annuler l\'invitation',
  projectinvitationsmodal232: 'Impossible d\'annuler l\'invitation',
  projectinvitationsmodal243: 'Renvoyer l\'invitation',
  projectinvitationsmodal261: 'Renvoyer l\'invitation',
  projectinvitationsmodal266: '✅ Invitation renvoyée avec succès ! E-mail envoyé.',
  projectinvitationsmodal275: 'Échec du renvoi de l\'invitation',
  projectinvitationsmodal278: 'Échec du renvoi de l\'invitation',
  projectinvitationsmodal286: 'En attente',
  projectinvitationsmodal287: 'Accepté',
  projectinvitationsmodal288: 'Refusé',
  projectinvitationsmodal289: 'Expiré',
  projectinvitationsmodal305: 'Annuler l\'invitation',
  projectinvitationsmodal314: 'Renvoyer l\'invitation',
  projectinvitationsmodal337: 'Fermer',
  projectinvitationsmodal360: 'Envoyer une nouvelle invitation',
  projectinvitationsmodal364: 'Adresse e-mail *',

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: 'utilisateur@exemple.com',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal376: 'Rôle',
  projectinvitationsmodal387: 'Message personnel (facultatif)',
  projectinvitationsmodal392: 'Ajoutez un message personnel à l\'invitation...',
  projectinvitationsmodal398: 'Envoyer une invitation',
  projectinvitationsmodal409: 'Invitations existantes',
  projectinvitationsmodal414: 'Aucune invitation n\'a encore été envoyée',
  projectinvitationsmodal420: 'E-mail',
  projectinvitationsmodal425: 'Rôle',
  projectinvitationsmodal433: 'Statut',
  projectinvitationsmodal439: 'Envoyé',
  projectinvitationsmodal445: 'Expire',
  projectinvitationsmodal450: 'Actes',

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: 'Échec du chargement des membres du projet',
  projectmembersmodal63: 'Erreur lors du chargement des membres du projet',
  projectmembersmodal84: 'SUPPRIMER',
  projectmembersmodal95: 'Échec de la suppression du membre',
  projectmembersmodal98: 'Membre supprimé avec succès',
  projectmembersmodal101: 'Erreur lors de la suppression du membre',
  projectmembersmodal128: 'Échec de la mise à jour du rôle du membre',
  projectmembersmodal131: 'Le rôle du membre a été mis à jour avec succès',
  projectmembersmodal134: 'Erreur lors de la mise à jour du rôle du membre',
  projectmembersmodal141: 'Confirmer la suppression',
  projectmembersmodal176: 'Membre',
  projectmembersmodal177: 'Administrateur',
  projectmembersmodal193: 'Propriétaire',
  projectmembersmodal206: 'Sélectionnez le rôle',
  projectmembersmodal221: 'Supprimer le membre',
  projectmembersmodal238: 'Membres du projet - {project?.name}',
  projectmembersmodal264: 'Aucun membre trouvé',
  projectmembersmodal270: 'Utilisateur',
  projectmembersmodal276: 'Rôle',
  projectmembersmodal282: 'Inscrit',
  projectmembersmodal287: 'Actes',
  projectmembersmodal296: 'Fermer',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: 'Le nom de l\'équipe est obligatoire',
  teammodal108: 'Non authentifié',
  teammodal132: 'Impossible de sauvegarder l\'équipe',
  teammodal137: 'Impossible de sauvegarder l\'équipe',
  teammodal146: 'Sélectionner un projet',
  teammodal155: 'Créer une nouvelle équipe',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal169: 'Nom de l\'équipe *',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal176: 'Entrez le nom de l\'équipe',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal182: 'Description',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: 'Entrez la description de l\'équipe (facultatif)',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal195: 'Projets',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: 'Sélectionner des projets',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal222: 'L\'équipe est active',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal232: 'Annuler',
  teammodal240: 'Créer',

  // resources/js\Components\Panels\AuthPanel.tsx
  authpanel3: './RegisterPanel',
  authpanel4: './ProfilePanel',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: 'Anglais',
  cmsadminpanel41: 'Allemand',
  cmsadminpanel42: 'Français',
  cmsadminpanel43: 'Espagnol',
  cmsadminpanel44: 'italien',
  cmsadminpanel69: 'Échec du chargement des pages :',
  cmsadminpanel106: 'Veuillez remplir tous les champs obligatoires',
  cmsadminpanel122: 'Page mise à jour avec succès !',
  cmsadminpanel129: 'Page créée avec succès !',
  cmsadminpanel135: 'Échec de l\'enregistrement de la page :',
  cmsadminpanel144: 'Confirmer la suppression',
  cmsadminpanel150: 'SUPPRIMER',
  cmsadminpanel152: 'Page supprimée avec succès !',
  cmsadminpanel155: 'Échec de la suppression de la page :',
  cmsadminpanel170: 'Modifier',
  cmsadminpanel178: 'Supprimer',
  cmsadminpanel186: 'Voir la page',
  cmsadminpanel195: 'Inactif',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel216: '📝 Gestion des pages CMS',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: 'Créer une nouvelle page',
  cmsadminpanel241: 'Aucune page trouvée',
  cmsadminpanel244: 'Limace',
  cmsadminpanel245: 'Langue',
  cmsadminpanel246: 'Titre',
  cmsadminpanel247: 'Statut',
  cmsadminpanel250: 'Dernière mise à jour',
  cmsadminpanel256: 'Actes',
  cmsadminpanel265: 'Créer une nouvelle page',
  cmsadminpanel272: 'Annuler',
  cmsadminpanel279: 'Sauvegarder',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel291: 'Limace *',
  cmsadminpanel298: 'aide, mentions légales, politique de confidentialité...',
  cmsadminpanel309: 'Langue *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: 'Sélectionnez une langue',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel328: 'Titre *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: 'Titre de la page...',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel342: 'Contenu *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: 'Source HTML',
  cmsadminpanel363: 'Code source HTML avec coloration syntaxique',
  cmsadminpanel365: 'Formatage',
  cmsadminpanel402: 'Insérer le code HTML ici...',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel72: 'Échec de la génération du code',
  codegenerationpanel75: 'Échec de la génération du code',
  codegenerationpanel86: 'Aucun fichier trouvé pour l\'index de table sélectionné',
  codegenerationpanel165: 'Impossible d\'analyser la fonction JavaScript',
  codegenerationpanel166: 'Contenu brut :',
  codegenerationpanel186: 'Démarrage de l\'exécution par lots des 278 fonctions JavaScript...',
  codegenerationpanel280: 'Aucun fichier généré à télécharger. Veuillez d\'abord exécuter toutes les fonctions.',
  codegenerationpanel286: '# Fichiers de code générés à partir du système de modèles',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: 'texte/brut',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel327: 'Génération de code',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel332: 'ID du modèle',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel338: 'Saisissez l\'ID du modèle (par exemple, 1)',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel344: 'Index des tables',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel351: 'Sélectionner le tableau',
  codegenerationpanel358: 'Générer du code',
  codegenerationpanel374: 'Résumé de la génération :',
  codegenerationpanel387: 'JavaScript propre',
  codegenerationpanel395: 'Résultat d\'exécution',
  codegenerationpanel399: 'Exécuter un fichier unique',
  codegenerationpanel407: 'Exécuter tous les fichiers',
  codegenerationpanel416: 'Télécharger le ZIP',
  codegenerationpanel433: 'Cliquez sur « Exécuter un seul fichier » ou « Exécuter tous les fichiers » pour voir les résultats...',
  codegenerationpanel445: 'Performance:',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel131: 'Non authentifié',
  databasemanagementpanel145: 'Échec du chargement des schémas',
  databasemanagementpanel152: 'Erreur lors du chargement des schémas',
  databasemanagementpanel221: 'Veuillez sélectionner au moins une langue',
  databasemanagementpanel231: 'Non authentifié',
  databasemanagementpanel245: 'Échec de l\'exportation des traductions',
  databasemanagementpanel259: 'Traductions exportées avec succès',
  databasemanagementpanel261: 'Erreur lors de l\'exportation des traductions',
  databasemanagementpanel277: 'Non authentifié',
  databasemanagementpanel294: 'Échec de l\'importation des traductions',
  databasemanagementpanel301: 'Erreur lors de l\'importation des traductions',
  databasemanagementpanel315: 'Non authentifié',
  databasemanagementpanel330: 'Échec de la création du schéma',
  databasemanagementpanel336: 'Schéma de base de données créé avec succès',
  databasemanagementpanel339: 'Erreur lors de la création du schéma',
  databasemanagementpanel367: 'Non authentifié',
  databasemanagementpanel382: 'Échec de la mise à jour du schéma',
  databasemanagementpanel388: 'Schéma mis à jour avec succès',
  databasemanagementpanel391: 'Erreur lors de la mise à jour du schéma',
  databasemanagementpanel419: 'Non authentifié',
  databasemanagementpanel438: 'Échec de l\'association du schéma',
  databasemanagementpanel447: 'Erreur lors de l\'association du schéma',
  databasemanagementpanel454: 'C\'est le',
  databasemanagementpanel485: 'Non attribué',
  databasemanagementpanel516: 'Non authentifié',
  databasemanagementpanel520: 'SUPPRIMER',
  databasemanagementpanel529: 'Échec de la suppression du schéma du projet',
  databasemanagementpanel536: 'Erreur lors de la suppression du schéma',
  databasemanagementpanel551: '(Copie)',
  databasemanagementpanel567: 'Non authentifié',
  databasemanagementpanel585: 'Échec de la copie du schéma',
  databasemanagementpanel594: 'Erreur lors de la copie du schéma',
  databasemanagementpanel606: 'Le nom du schéma ne correspond pas. Veuillez saisir le nom exact du schéma pour confirmer la suppression.',
  databasemanagementpanel616: 'Non authentifié',
  databasemanagementpanel621: 'SUPPRIMER',
  databasemanagementpanel651: 'SUPPRIMER',
  databasemanagementpanel683: 'Erreur lors de la suppression du schéma',
  databasemanagementpanel714: 'Lien vers le projet',
  databasemanagementpanel735: 'Associé au projet',
  databasemanagementpanel743: 'Modifier le schéma',
  databasemanagementpanel749: 'Copier la base de données',
  databasemanagementpanel756: 'Ouvrir dans Designer',
  databasemanagementpanel763: 'Supprimer le schéma',
  databasemanagementpanel771: 'Privé',
  databasemanagementpanel772: 'Publique',
  databasemanagementpanel776: 'Lié (référence en lecture seule)',
  databasemanagementpanel777: 'Cloné (Copie privée)',
  databasemanagementpanel778: 'Importé (fusionner dans l\'existant)',
  databasemanagementpanel786: 'Chargement des schémas de base de données...',
  databasemanagementpanel798: 'Gestion de base de données',
  databasemanagementpanel803: 'Nouvelle base de données',
  databasemanagementpanel811: 'Rafraîchir',
  databasemanagementpanel829: 'Mes schémas de base de données',
  databasemanagementpanel833: 'Aucun schéma de base de données trouvé. Créez votre premier schéma pour commencer.',
  databasemanagementpanel840: 'Nom du schéma',
  databasemanagementpanel841: 'Description',
  databasemanagementpanel843: 'Projets assignés',
  databasemanagementpanel849: 'Visibilité',
  databasemanagementpanel855: 'Propriétaire',
  databasemanagementpanel861: 'Créé',
  databasemanagementpanel867: 'Actes',
  databasemanagementpanel876: 'Exportation/Importation de traduction',
  databasemanagementpanel886: 'Exporter des traductions',
  databasemanagementpanel893: 'Importer des traductions',
  databasemanagementpanel905: 'Créer un nouveau schéma de base de données',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel917: 'Nom du schéma *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: 'Entrez le nom du schéma',
  databasemanagementpanel937: 'Entrez la description du schéma (facultatif)',
  databasemanagementpanel952: 'Sélectionner la visibilité',
  databasemanagementpanel963: 'Annuler',
  databasemanagementpanel970: 'Créer un schéma',
  databasemanagementpanel981: 'Modifier le schéma de la base de données',
  databasemanagementpanel999: 'Entrez le nom du schéma',
  databasemanagementpanel1013: 'Entrez la description du schéma (facultatif)',
  databasemanagementpanel1028: 'Sélectionner la visibilité',
  databasemanagementpanel1036: 'Annuler',
  databasemanagementpanel1043: 'Mettre à jour le schéma',
  databasemanagementpanel1054: 'Lier le schéma au projet',
  databasemanagementpanel1070: 'Aucune description',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1077: 'Sélectionnez le projet *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: 'Sélectionnez un projet',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1094: 'Lien vers le projet :',
  databasemanagementpanel1104: 'Type d\'association',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: 'Nom personnalisé pour ce schéma dans le projet',
  databasemanagementpanel1131: 'Annuler',
  databasemanagementpanel1138: 'Schéma de lien',
  databasemanagementpanel1163: '⚠️ Avertissement de suppression permanente',
  databasemanagementpanel1166: 'TOUS',
  databasemanagementpanel1174: '🎨 Toutes les mises en page du concepteur de schémas',
  databasemanagementpanel1175: '⚙️ Toutes les contraintes et relations',
  databasemanagementpanel1180: 'ne peut pas être annulé',
  databasemanagementpanel1210: 'Annuler',
  databasemanagementpanel1217: '🗑️ Supprimer définitivement',
  databasemanagementpanel1229: 'Exporter les traductions vers Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1244: 'Sélectionnez les langues à inclure dans l\'exportation Excel. L\'exportation contiendra toutes les tables et tous les champs des bases de données liées.',
  databasemanagementpanel1250: 'Sélectionner les langues *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: 'Sélectionnez les langues à exporter',
  databasemanagementpanel1273: 'Annuler',
  databasemanagementpanel1280: 'Exporter vers Excel',
  databasemanagementpanel1292: 'Importer des traductions depuis Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1307: 'Téléchargez un fichier Excel contenant les traductions. Le fichier doit respecter le format d\'exportation.',
  databasemanagementpanel1313: 'Télécharger le fichier Excel *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: 'Choisissez un fichier Excel',
  databasemanagementpanel1338: 'Annuler',
  databasemanagementpanel1350: 'Copier le schéma de la base de données',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1365: 'Cela créera une copie complète du schéma de base de données, incluant toutes les tables, champs, contraintes et mises en page du concepteur. La copie sera définie sur la version 1.',
  databasemanagementpanel1371: 'Nouveau nom de schéma *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: 'Entrez le nom du schéma copié',
  databasemanagementpanel1395: 'Annuler',
  databasemanagementpanel1402: 'Copier la base de données',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel51: 'Code Fira',
  debugmanualgeneratorpanel127: 'Code Fira',
  debugmanualgeneratorpanel136: 'Le code JavaScript généré apparaît ici...',
  debugmanualgeneratorpanel162: 'API Presse-papiers non disponible. Veuillez copier manuellement :',
  debugmanualgeneratorpanel165: 'Accès au presse-papiers impossible. Veuillez vérifier les paramètres de votre navigateur.',
  debugmanualgeneratorpanel352: 'Aucun modèle trouvé. Veuillez d\'abord créer des modèles dans la Gestion des modèles.',
  debugmanualgeneratorpanel358: 'Erreur lors du chargement des modèles',
  debugmanualgeneratorpanel420: 'Erreur lors du chargement des fichiers de modèle',
  debugmanualgeneratorpanel499: 'Table inconnue',
  debugmanualgeneratorpanel563: 'Table inconnue',
  debugmanualgeneratorpanel600: 'Schéma de démonstration (de secours)',
  debugmanualgeneratorpanel746: 'Veuillez sélectionner le modèle et le fichier',
  debugmanualgeneratorpanel753: 'Veuillez sélectionner le projet',
  debugmanualgeneratorpanel758: 'Veuillez sélectionner le tableau',
  debugmanualgeneratorpanel763: 'Veuillez sélectionner la langue',
  debugmanualgeneratorpanel768: 'Ce fichier ne prend pas en charge la génération de code (fichier statique)',
  debugmanualgeneratorpanel928: '❌ Fichier pour la configuration sélectionnée non trouvé',
  debugmanualgeneratorpanel936: 'Inconnu',
  debugmanualgeneratorpanel940: 'Inconnu',
  debugmanualgeneratorpanel946: 'Inconnu',
  debugmanualgeneratorpanel953: '💡 Solution : vérifiez la configuration du modèle et la réponse du backend.',
  debugmanualgeneratorpanel959: 'Erreur lors du chargement du code',
  debugmanualgeneratorpanel962: 'Erreur lors du chargement du code',
  debugmanualgeneratorpanel970: 'Aucun code à exécuter',
  debugmanualgeneratorpanel1026: 'Aucune fonction trouvée dans le code généré',
  debugmanualgeneratorpanel1048: 'Aide au débogage',
  debugmanualgeneratorpanel1093: 'Erreur de syntaxe',
  debugmanualgeneratorpanel1096: 'Erreur de référence',
  debugmanualgeneratorpanel1107: 'Inconnu',
  debugmanualgeneratorpanel1111: 'Erreur de syntaxe',
  debugmanualgeneratorpanel1174: 'Erreur : impossible d\'analyser la fonction JavaScript',
  debugmanualgeneratorpanel1183: 'Erreur de secours inconnue',
  debugmanualgeneratorpanel1203: 'Inconnu',
  debugmanualgeneratorpanel1210: 'Sans nom (inconnu)',
  debugmanualgeneratorpanel1229: 'Inconnu',
  debugmanualgeneratorpanel1259: '🔧 Générateur de manuel de débogage',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1260: 'Développement de modèles et débogage de code pour des fichiers individuels',
  debugmanualgeneratorpanel1270: '📄 Modèle',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1277: 'Choisissez un modèle',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1284: '📝 Fichier modèle',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1293: 'Sélectionner le fichier',
  debugmanualgeneratorpanel1302: '(non requis)',
  debugmanualgeneratorpanel1310: 'Non requis pour ce type de fichier',
  debugmanualgeneratorpanel1319: '(non requis)',
  debugmanualgeneratorpanel1325: 'Non requis pour ce type de fichier',
  debugmanualgeneratorpanel1334: '(non requis)',
  debugmanualgeneratorpanel1342: 'Choisissez la langue',
  debugmanualgeneratorpanel1355: 'inclure la source du modèle',
  debugmanualgeneratorpanel1360: 'Inclure la source du modèle dans le code',
  debugmanualgeneratorpanel1369: 'Obtenir le code',
  debugmanualgeneratorpanel1377: 'Exécuter le code',
  debugmanualgeneratorpanel1385: '🔍 Aide au débogage',
  debugmanualgeneratorpanel1396: 'Non sélectionné',
  debugmanualgeneratorpanel1397: 'Non sélectionné',
  debugmanualgeneratorpanel1398: 'Inconnu',
  debugmanualgeneratorpanel1399: 'Non sélectionné',
  debugmanualgeneratorpanel1400: 'Non sélectionné',
  debugmanualgeneratorpanel1473: '🔴 Aucun projet sélectionné pour le modèle project_file',
  debugmanualgeneratorpanel1476: '🔴 Aucune table sélectionnée pour le modèle db_table_file',
  debugmanualgeneratorpanel1479: '🟡 Aucune langue sélectionnée pour le modèle avec langue activée',
  debugmanualgeneratorpanel1482: '🔴 Tables trouvées[] - index de table manquant',
  debugmanualgeneratorpanel1531: '1. Code préparé',
  debugmanualgeneratorpanel1537: 'Copier GTree',
  debugmanualgeneratorpanel1564: 'Téléchargement de GTree',
  debugmanualgeneratorpanel1583: 'Échec du téléchargement. Veuillez vérifier les données GTree.',
  debugmanualgeneratorpanel1591: 'Copier le code',
  debugmanualgeneratorpanel1621: 'L\'éditeur de code n\'a pas pu être chargé',
  debugmanualgeneratorpanel1622: 'Utiliser une zone de texte simple comme solution de secours',
  debugmanualgeneratorpanel1628: 'Obtenir le code',
  debugmanualgeneratorpanel1679: '2. Résultat exécuté',
  debugmanualgeneratorpanel1683: 'Code PHP généré',
  debugmanualgeneratorpanel1686: 'Copier le code',
  debugmanualgeneratorpanel1724: 'Le téléchargement a échoué.',
  debugmanualgeneratorpanel1739: 'Courrier Nouveau',
  debugmanualgeneratorpanel1744: 'Cliquez sur « Exécuter le code » pour voir le résultat...',
  debugmanualgeneratorpanel1750: '3. 🔍 Aide au débogage',
  debugmanualgeneratorpanel1755: 'Courrier Nouveau',
  debugmanualgeneratorpanel1760: 'Cliquez sur « 🔍 Debug Helper » pour voir les informations de débogage...',

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel31: 'Les mots de passe ne correspondent pas',
  panelsegisterpanel54: 'L\'inscription a échoué',
  panelsegisterpanel57: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
  panelsegisterpanel75: 'Une erreur s\'est produite',
  panelsegisterpanel90: 'Registre',
  panelsegisterpanel123: 'Votre nom complet',
  panelsegisterpanel154: 'Au moins 8 caractères',
  panelsegisterpanel161: 'Entrez le mot de passe',
  panelsegisterpanel162: 'Faible',
  panelsegisterpanel163: 'Moyen',
  panelsegisterpanel164: 'Rigide',
  panelsegisterpanel176: 'Répéter le mot de passe',
  panelsegisterpanel188: 'Registre',
  panelsegisterpanel198: 'Vous avez déjà un compte ? Se connecter',

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: 'Retour au hall',
  panelsewnavigationpanel120: 'Accueillir',
  panelsewnavigationpanel128: 'Projet',
  panelsewnavigationpanel133: 'Gestion de projet',
  panelsewnavigationpanel138: 'Paramètres',
  panelsewnavigationpanel142: 'Paramètres du projet',
  panelsewnavigationpanel161: 'Équipes',
  panelsewnavigationpanel165: 'Gestion d\'équipe',
  panelsewnavigationpanel170: 'Affectation des équipes',
  panelsewnavigationpanel184: 'Modèles',
  panelsewnavigationpanel188: 'Gestion des modèles',
  panelsewnavigationpanel193: 'Affectation de modèle',
  panelsewnavigationpanel201: 'Dépendances du schéma de base de données',
  panelsewnavigationpanel211: 'Mes candidatures',
  panelsewnavigationpanel216: 'Projets publics',
  panelsewnavigationpanel223: 'Base de données',
  panelsewnavigationpanel228: 'Gérer les bases de données',
  panelsewnavigationpanel233: 'Designer',
  panelsewnavigationpanel238: 'Traduction de schéma',
  panelsewnavigationpanel246: 'Importer SQL',
  panelsewnavigationpanel251: 'Exporter SQL',
  panelsewnavigationpanel258: 'Générateur',
  panelsewnavigationpanel263: 'Générateur de manuel de débogage',
  panelsewnavigationpanel268: 'Génération de code',
  panelsewnavigationpanel273: 'Générateur de requêtes',
  panelsewnavigationpanel281: 'Administration',
  panelsewnavigationpanel285: 'Paramètres système',
  panelsewnavigationpanel290: 'Gestion des langues',
  panelsewnavigationpanel298: 'Administrateur CMS',
  panelsewnavigationpanel315: 'Profil',
  panelsewnavigationpanel320: 'Plan de changement',
  panelsewnavigationpanel325: 'Retour au hall',
  panelsewnavigationpanel333: 'Déconnexion',
  panelsewnavigationpanel359: 'Compte',
  panelsewnavigationpanel364: 'Se connecter',
  panelsewnavigationpanel369: 'Registre',
  panelsewnavigationpanel384: 'Réduire le menu',
  panelsewnavigationpanel394: 'Navigation',
  panelsewnavigationpanel413: 'Retour au hall',
  panelsewnavigationpanel422: 'Accueillir',
  panelsewnavigationpanel430: 'Projet',
  panelsewnavigationpanel437: 'Gestion de projet',
  panelsewnavigationpanel443: 'Paramètres',
  panelsewnavigationpanel459: 'Paramètres du projet',
  panelsewnavigationpanel469: 'Équipes',
  panelsewnavigationpanel477: 'Gestion d\'équipe',
  panelsewnavigationpanel488: 'Affectation des équipes',
  panelsewnavigationpanel496: 'Modèles',
  panelsewnavigationpanel504: 'Gestion des modèles',
  panelsewnavigationpanel508: 'Affectation de modèle',
  panelsewnavigationpanel513: 'Dépendances du schéma de base de données',
  panelsewnavigationpanel521: 'Mes candidatures',
  panelsewnavigationpanel525: 'Projets publics',
  panelsewnavigationpanel533: 'Base de données',
  panelsewnavigationpanel540: 'Gérer les bases de données',
  panelsewnavigationpanel544: 'Designer',
  panelsewnavigationpanel548: 'Traduction de schéma',
  panelsewnavigationpanel553: 'Importer SQL',
  panelsewnavigationpanel557: 'Exporter SQL',
  panelsewnavigationpanel565: 'Générateur',
  panelsewnavigationpanel572: 'Générateur de manuel de débogage',
  panelsewnavigationpanel576: 'Génération de code',
  panelsewnavigationpanel580: 'Générateur de requêtes',
  panelsewnavigationpanel589: 'Administration',
  panelsewnavigationpanel596: 'Paramètres système',
  panelsewnavigationpanel600: 'Gestion des langues',
  panelsewnavigationpanel605: 'Administrateur CMS',
  panelsewnavigationpanel619: 'Compte',
  panelsewnavigationpanel644: 'Profil',
  panelsewnavigationpanel648: 'Plan de changement',
  panelsewnavigationpanel652: 'Retour au hall',
  panelsewnavigationpanel672: 'Déconnexion',
  panelsewnavigationpanel679: 'Se connecter',
  panelsewnavigationpanel683: 'Registre',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: 'Promesse',
  filemodal95: 'Veuillez sélectionner un fichier ZIP !',
  filemodal106: 'Fichier ZIP supprimé',
  filemodal111: 'Ajouter un nouveau fichier',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal124: 'Nom de fichier *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: 'Veuillez entrer le nom du fichier!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: 'par exemple, Model.php, component.tsx, config.json',
  filemodal147: 'Modèle-Type *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: 'Veuillez sélectionner le type !',
  filemodal160: 'Sélectionnez le type',
  filemodal182: 'Veuillez entrer le répertoire cible !',
  filemodal185: 'Chemin:',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: 'par exemple, /composants/, /services/, /app/Http/Controllers/',
  filemodal202: 'Sélectionnez le type de contenu :',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal208: 'Saisie de texte',
  filemodal215: 'Téléchargement ZIP',
  filemodal232: 'Veuillez saisir le contenu du fichier!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal268: 'Télécharger le fichier ZIP',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: 'Sélectionnez le fichier ZIP',
  filemodal287: 'Déposez le fichier ZIP ici ou cliquez pour sélectionner',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal288: 'Les fichiers .zip avec des structures de modèles sont pris en charge',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: 'Retirer',
  filemodal334: 'Annuler',
  filemodal340: 'Ajouter',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: 'Entrez l\'e-mail',
  forgotpasswordpanel30: 'Réinitialiser le mot de passe',
  forgotpasswordpanel52: 'Le lien de réinitialisation n\'a pas pu être envoyé',
  forgotpasswordpanel55: 'Un lien de réinitialisation a été envoyé à votre adresse e-mail. Consultez votre boîte de réception.',
  forgotpasswordpanel59: 'Une erreur s\'est produite',
  forgotpasswordpanel73: 'Les mots de passe ne correspondent pas',
  forgotpasswordpanel96: 'Le mot de passe n\'a pas pu être réinitialisé',
  forgotpasswordpanel99: 'Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
  forgotpasswordpanel109: 'Une erreur s\'est produite',
  forgotpasswordpanel129: 'Mot de passe oublié',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel164: 'Saisissez votre adresse e-mail pour recevoir un lien pour réinitialiser votre mot de passe.',
  forgotpasswordpanel170: 'E-mail',
  forgotpasswordpanel178: 'votre.email@exemple.com',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: 'Envoyer le lien de réinitialisation',
  forgotpasswordpanel197: 'Retour à la connexion',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel209: 'Saisissez le code de réinitialisation de l\'e-mail et votre nouveau mot de passe.',
  forgotpasswordpanel215: 'Code de réinitialisation',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: 'Code de l\'email',
  forgotpasswordpanel237: 'Nouveau mot de passe',
  forgotpasswordpanel244: 'Entrez le mot de passe',
  forgotpasswordpanel245: 'Faible',
  forgotpasswordpanel246: 'Moyen',
  forgotpasswordpanel247: 'Rigide',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel252: 'Confirmez le mot de passe',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel259: 'Répéter le mot de passe',
  forgotpasswordpanel272: 'Dos',
  forgotpasswordpanel280: 'Réinitialiser le mot de passe',
  forgotpasswordpanel291: 'Retour à la connexion',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel76: 'Non autorisé. Accès administrateur système requis.',
  languagemanagementpanel78: 'Échec du chargement des langues :',
  languagemanagementpanel120: 'Etes-vous sûr de vouloir supprimer cette langue ?',
  languagemanagementpanel121: 'Supprimer la langue',
  languagemanagementpanel124: 'Oui',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel125: 'Non',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel132: 'SUPPRIMER',
  languagemanagementpanel133: 'Langue supprimée avec succès',
  languagemanagementpanel136: 'Échec de la suppression de la langue :',
  languagemanagementpanel142: 'CORRECTIF',
  languagemanagementpanel146: 'Échec du changement de statut de langue :',
  languagemanagementpanel152: 'CORRECTIF',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: 'Langue par défaut mise à jour avec succès',
  languagemanagementpanel156: 'Échec de la définition de la langue par défaut :',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: 'Langue mise à jour avec succès',
  languagemanagementpanel173: 'Langue créée avec succès',
  languagemanagementpanel178: 'Échec de l\'enregistrement de la langue :',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel183: '🇺🇸 États-Unis',
  languagemanagementpanel184: '🇫🇷 Royaume-Uni',
  languagemanagementpanel185: '🇩🇪 Allemagne',
  languagemanagementpanel186: '🇫🇷 France',
  languagemanagementpanel187: '🇪🇸 Espagne',
  languagemanagementpanel188: '🇮🇹 Italie',
  languagemanagementpanel189: '🇳🇱 Pays-Bas',
  languagemanagementpanel190: '🇵🇹 Portugal',
  languagemanagementpanel191: '🇷🇺 Russie',
  languagemanagementpanel192: '🇯🇵 Japon',
  languagemanagementpanel193: '🇰🇷 Corée du Sud',
  languagemanagementpanel194: '🇨🇳 Chine',
  languagemanagementpanel195: '🇧🇷 Brésil',
  languagemanagementpanel196: '🇲🇽 Mexique',
  languagemanagementpanel197: '🇨🇦 Canada',
  languagemanagementpanel198: '🇦🇺 Australie',
  languagemanagementpanel199: '🇮🇳 Inde',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel214: 'Inactif',
  languagemanagementpanel223: 'Système',
  languagemanagementpanel251: 'Activer',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: 'Définir par défaut',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: 'Impossible de supprimer la langue par défaut',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel291: 'Gestion des langues',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: 'Ajouter une langue',
  languagemanagementpanel317: 'Liste déroulante Lignes par page Lien vers la première page Lien vers la page précédente Rapport sur la page actuelle Lien vers la page suivante Lien vers la dernière page',
  languagemanagementpanel324: 'Aucune langue trouvée',
  languagemanagementpanel326: 'Drapeau',
  languagemanagementpanel327: 'Code',
  languagemanagementpanel328: 'Nom',
  languagemanagementpanel329: 'Nom autochtone',
  languagemanagementpanel330: 'Statut',
  languagemanagementpanel331: 'Ordre de tri',
  languagemanagementpanel332: 'Créateur',
  languagemanagementpanel333: 'Description',
  languagemanagementpanel334: 'Actes',
  languagemanagementpanel340: 'Ajouter une nouvelle langue',
  languagemanagementpanel352: 'Annuler',
  languagemanagementpanel359: 'Créer',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel371: 'Code de langue *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: 'Veuillez saisir le code de langue',
  languagemanagementpanel379: 'Le code doit comporter 5 caractères ou moins',
  languagemanagementpanel380: 'Veuillez saisir un code de langue valide (par exemple',
  languagemanagementpanel410: 'Sélectionner un drapeau',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel423: 'Nom anglais *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: 'Veuillez saisir le nom de la langue',
  languagemanagementpanel431: 'Le nom doit comporter 100 caractères ou moins',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: 'par exemple, anglais, allemand, français',
  languagemanagementpanel449: 'Nom autochtone *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: 'Veuillez saisir le nom de la langue maternelle',
  languagemanagementpanel457: 'Le nom natif doit comporter 100 caractères ou moins',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: 'e.g., English, Deutsch, Français',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: 'La description doit comporter 1 000 caractères ou moins',
  languagemanagementpanel490: 'Description facultative de la langue',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel503: 'Ordre de tri *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: 'Veuillez entrer l\'ordre de tri',
  languagemanagementpanel511: 'L\'ordre de tri doit être égal ou supérieur à 0',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel548: 'Langue par défaut',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel44: 'La connexion a échoué',
  loginpanel74: 'Une erreur s\'est produite',
  loginpanel88: 'Se connecter',

  // resources/js/Components/Panels/LoginPanel.tsx
  loginpanel106: 'E-mail',
  loginpanel114: 'votre.email@exemple.com',
  loginpanel122: 'Mot de passe',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel129: 'Votre mot de passe',
  loginpanel141: 'Connexion...',
  loginpanel152: 'Vous n\'avez pas de compte ? Inscrivez-vous',
  loginpanel160: 'Mot de passe oublié?',

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel61: 'Non authentifié',
  myapplicationspanel73: 'Échec du chargement des applications',
  myapplicationspanel80: 'Erreur lors du chargement des applications',
  myapplicationspanel87: 'C\'est le',
  myapplicationspanel138: 'Aucun message',
  myapplicationspanel164: 'Voir les détails',
  myapplicationspanel201: 'Chargement des applications...',
  myapplicationspanel213: 'Mes candidatures',
  myapplicationspanel217: 'Rafraîchir',
  myapplicationspanel228: 'Historique des applications',
  myapplicationspanel232: 'Aucune candidature',
  myapplicationspanel233: 'Vous n\'avez pas encore postulé à un projet.',
  myapplicationspanel242: 'Aucune application trouvée',
  myapplicationspanel248: 'Projet',
  myapplicationspanel255: 'Message',
  myapplicationspanel261: 'Statut',
  myapplicationspanel268: 'Appliqué',
  myapplicationspanel276: 'Réponse',
  myapplicationspanel282: 'Actes',
  myapplicationspanel292: 'Détails de la demande',
  myapplicationspanel305: 'Informations sur le projet',
  myapplicationspanel322: 'Informations sur la candidature',
  myapplicationspanel326: 'Statut:',
  myapplicationspanel332: 'Appliqué:',
  myapplicationspanel338: 'Code d\'adhésion :',
  myapplicationspanel348: 'Votre message:',
  myapplicationspanel358: 'Rejet',
  myapplicationspanel362: 'Révisé par :',
  myapplicationspanel365: 'Date:',
  myapplicationspanel369: 'Réponse:',
  myapplicationspanel381: 'Fermer',

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel112: 'Retour au hall',
  newnavigationpanel120: 'Accueillir',
  newnavigationpanel128: 'Projet',
  newnavigationpanel133: 'Gestion de projet',
  newnavigationpanel138: 'Paramètres',
  newnavigationpanel142: 'Paramètres du projet',
  newnavigationpanel161: 'Équipes',
  newnavigationpanel165: 'Gestion d\'équipe',
  newnavigationpanel170: 'Affectation des équipes',
  newnavigationpanel184: 'Modèles',
  newnavigationpanel188: 'Gestion des modèles',
  newnavigationpanel193: 'Affectation de modèle',
  newnavigationpanel201: 'Dépendances du schéma de base de données',
  newnavigationpanel211: 'Mes candidatures',
  newnavigationpanel216: 'Projets publics',
  newnavigationpanel223: 'Base de données',
  newnavigationpanel228: 'Gérer les bases de données',
  newnavigationpanel233: 'Designer',
  newnavigationpanel238: 'Traduction de schéma',
  newnavigationpanel246: 'Importer SQL',
  newnavigationpanel251: 'Exporter SQL',
  newnavigationpanel258: 'Générateur',
  newnavigationpanel263: 'Générateur de manuel de débogage',
  newnavigationpanel268: 'Génération de code',
  newnavigationpanel273: 'Générateur de requêtes',
  newnavigationpanel281: 'Administration',
  newnavigationpanel285: 'Paramètres système',
  newnavigationpanel290: 'Gestion des langues',
  newnavigationpanel298: 'Administrateur CMS',
  newnavigationpanel315: 'Profil',
  newnavigationpanel320: 'Plan de changement',
  newnavigationpanel325: 'Retour au hall',
  newnavigationpanel333: 'Déconnexion',
  newnavigationpanel359: 'Compte',
  newnavigationpanel364: 'Se connecter',
  newnavigationpanel369: 'Registre',
  newnavigationpanel384: 'Réduire le menu',
  newnavigationpanel394: 'Navigation',
  newnavigationpanel413: 'Retour au hall',
  newnavigationpanel422: 'Accueillir',
  newnavigationpanel430: 'Projet',
  newnavigationpanel437: 'Gestion de projet',
  newnavigationpanel443: 'Paramètres',
  newnavigationpanel459: 'Paramètres du projet',
  newnavigationpanel469: 'Équipes',
  newnavigationpanel477: 'Gestion d\'équipe',
  newnavigationpanel488: 'Affectation des équipes',
  newnavigationpanel496: 'Modèles',
  newnavigationpanel504: 'Gestion des modèles',
  newnavigationpanel508: 'Affectation de modèle',
  newnavigationpanel513: 'Dépendances du schéma de base de données',
  newnavigationpanel521: 'Mes candidatures',
  newnavigationpanel525: 'Projets publics',
  newnavigationpanel533: 'Base de données',
  newnavigationpanel540: 'Gérer les bases de données',
  newnavigationpanel544: 'Designer',
  newnavigationpanel548: 'Traduction de schéma',
  newnavigationpanel553: 'Importer SQL',
  newnavigationpanel557: 'Exporter SQL',
  newnavigationpanel565: 'Générateur',
  newnavigationpanel572: 'Générateur de manuel de débogage',
  newnavigationpanel576: 'Génération de code',
  newnavigationpanel580: 'Générateur de requêtes',
  newnavigationpanel589: 'Administration',
  newnavigationpanel596: 'Paramètres système',
  newnavigationpanel600: 'Gestion des langues',
  newnavigationpanel605: 'Administrateur CMS',
  newnavigationpanel619: 'Compte',
  newnavigationpanel635: '} text-gray-300`} titre={isLoggedIn ? nom d\'utilisateur :',
  newnavigationpanel644: 'Profil',
  newnavigationpanel648: 'Plan de changement',
  newnavigationpanel652: 'Retour au hall',
  newnavigationpanel672: 'Déconnexion',
  newnavigationpanel679: 'Se connecter',
  newnavigationpanel683: 'Registre',

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: 'Utilisateur inconnu',
  panelt1143: 'bases de données',
  panelt1147: 'bases de données',
  panelt1219: 'Aperçu du fichier',
  panelt1222: 'Aperçu du fichier',
  panelt1281: 'Erreur lors du chargement des projets',
  panelt1287: 'Vérifier la console pour les erreurs',
  panelt1293: 'Voir la console du navigateur pour plus de détails',
  panelt1416: 'Aperçu du fichier',
  panelt1506: 'équipe modifiée',
  panelt1509: 'équipe modifiée',
  panelt1521: 'Aperçu du fichierMise à jour',
  panelt1524: 'Aperçu du fichierMise à jour',
  panelt1680: 'Projet',
  panelt1696: 'Projet',
  panelt1725: 'Tableau',
  panelt1786: '📁 Navigation',
  panelt1791: 'Développer tout',
  panelt1798: 'Réduire tout',
  panelt1809: 'Chargement des projets...',
  panelt1813: 'Aucun projet trouvé',
  panelt1833: 'Choisi:',
  panelt1835: 'Nom:',
  panelt1836: 'Taper:',
  panelt1837: 'IDENTIFIANT:',
  panelt1839: 'Chemin:',
  panelt1842: 'ID du projet :',
  panelt1843: 'Chemin:',
  panelt1845: 'ID de l\'équipe :',
  panelt1848: 'Rôle:',
  panelt1853: 'ID du modèle :',
  panelt1856: 'Tableau:',
  panelt1859: 'Langue:',
  panelt1873: 'Nombre total d\'articles',
  panelt1879: 'Choisi',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: 'Modifier le tableau',
  panelt2151: 'Supprimer le tableau',
  panelt2179: 'Aucun champ',
  panelt2405: 'Authentification requise',
  panelt2439: 'Échec du chargement des schémas',
  panelt2443: 'Authentification',
  panelt2551: 'Échec du chargement des versions de schéma',
  panelt2602: 'Échec du chargement de la version du schéma',
  panelt2685: 'Aucune version disponible. Veuillez d\'abord créer une version de schéma.',
  panelt2704: 'Aucune version sélectionnée ou identifiant de version manquant. Veuillez d\'abord sélectionner une version de schéma.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: 'Échec de la création de la table',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: 'Aucune version sélectionnée ni table à modifier. Veuillez d\'abord sélectionner une version de schéma.',
  panelt2806: 'Échec de la mise à jour du tableau',
  panelt2817: 'Échec de la mise à jour du tableau',
  panelt2826: 'Aucun schéma ni version sélectionné. Veuillez d\'abord sélectionner un schéma.',
  panelt2841: 'Échec de la création d\'une nouvelle version',
  panelt2852: 'Échec de la création d\'une nouvelle version',
  panelt2862: 'Aucun schéma ni version sélectionné. Veuillez d\'abord sélectionner un schéma.',
  panelt2877: 'Échec de la création d\'une nouvelle version',
  panelt2888: 'Échec de la création d\'une nouvelle version',
  panelt2898: 'Aucune version sélectionnée. Veuillez d\'abord sélectionner une version de schéma.',
  panelt2920: 'Échec de la mise à jour de la version',
  panelt2930: 'Aucune version sélectionnée. Veuillez d\'abord sélectionner une version de schéma.',
  panelt2952: 'Échec de la mise à jour de la version',
  panelt21001: 'Échec de la suppression de la table',
  panelt21010: 'Échec de la suppression de la table',
  panelt21030: 'Aucune table sélectionnée pour suppression',
  panelt21054: 'Échec de la création de la version et de la suppression de la table',
  panelt21075: 'Échec de la création d\'une nouvelle version et de la suppression de la table',
  panelt21101: 'Aucune table sélectionnée pour suppression',
  panelt21122: 'Échec de la suppression de la table',
  panelt21133: 'Aucun schéma sélectionné',
  panelt21144: 'Créer une nouvelle version',
  panelt21153: 'Non authentifié',
  panelt21170: 'Échec de la création d\'une nouvelle version',
  panelt21185: 'Échec de la création d\'une nouvelle version',
  panelt21231: 'Non authentifié',
  panelt21245: 'Échec de la suppression de la clé étrangère',
  panelt21270: 'Échec de la suppression de la clé étrangère',
  panelt21282: '🗃️ Concepteur de bases de données',
  panelt21289: 'Chargement des versions de schéma...',
  panelt21291: 'Aucun schéma sélectionné',
  panelt21292: 'Aucun projet sélectionné',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: 'Aucun projet sélectionné',
  panelt21350: '🔄 Rafraîchir',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: 'Créer une nouvelle version (copie la version actuelle)',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21359: '➕ Nouvelle version',
  panelt21375: '✨ Nouvelle table',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21402: 'Chargement du schéma...',
  panelt21439: 'positionAbsolue',
  panelt21511: 'Authentification',
  panelt21515: 'Authentification requise',
  panelt21516: 'Votre session a expiré. Veuillez vous connecter pour accéder aux données du schéma.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21517: 'Utilisez le menu de navigation pour vous reconnecter',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21525: 'Aucune donnée de schéma',
  panelt21528: 'Sélectionnez un projet pour afficher les schémas',
  panelt21530: 'Aucun schéma associé à ce projet',
  panelt21531: 'Sélectionnez un schéma pour visualiser la structure de la base de données',
  panelt21549: '🔍 Détails de la table',
  panelt21552: 'Tableau:',
  panelt21556: 'Champs:',
  panelt21560: 'Contraintes:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21564: 'Clés primaires :',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: 'créer une nouvelle table',
  panelt21600: 'Actuel',
  panelt21629: 'Actions de clé étrangère',
  panelt21635: 'Depuis:',
  panelt21639: 'À:',
  panelt21654: 'Edit FK arrive en Phase 2 ! 🚀',
  panelt21689: 'Supprimer la clé étrangère',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21692: 'Êtes-vous sûr de vouloir supprimer cette contrainte de clé étrangère ?',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21699: 'Contrainte:',
  panelt21703: 'Depuis:',
  panelt21707: 'À:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21714: '⚠️ Une nouvelle version sera créée pour ce changement.',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21736: 'Supprimer la clé étrangère',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesCategoryAll: 'Toutes les catégories',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt367: 'Tous',
  panelt375: 'Non authentifié',
  panelt390: 'Échec du chargement des modèles',
  panelt3103: 'Erreur lors du chargement des modèles',
  panelt3115: 'Non authentifié',
  panelt3148: 'Erreur lors du chargement des modèles de projet',
  panelt3158: 'langue modifiée',
  panelt3161: 'langue modifiée',
  panelt3201: 'Non authentifié',
  panelt3219: 'Échec de l\'attribution des modèles',
  panelt3231: 'Erreur lors de l\'attribution des modèles',
  panelt3245: 'Non authentifié',
  panelt3250: 'SUPPRIMER',
  panelt3272: 'Erreur lors de la suppression du modèle',
  panelt3287: 'Tous',
  panelt3295: 'Toutes les catégories',
  panelt3296: 'Web',
  panelt3297: 'Mobile',
  panelt3298: 'API',
  panelt3299: 'Bureau',
  panelt3300: 'Base de données',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesLoadingText: 'Chargement des modèles...',
  templatesAssignmentTitle: 'Attribution de modèles',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3323: 'par ',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesWorkingOn: 'par {selectedProject.owner.name}',
  templatesSelectProjectHint: 'Veuillez sélectionner un projet dans la navigation pour gérer les modèles',
  templatesSearchPlaceholder: 'Rechercher des modèles...',
  templatesFilterCategory: 'Filtrer par catégorie',
  templatesNoTemplatesFound: 'Aucun modèle trouvé',
  templatesSelectedCount: 'sélectionné',
  templatesRemoveFromProject: 'Retirer du projet',
  templatesColumnName: 'Nom du modèle',
  templatesColumnDescription: 'Description',
  templatesColumnCategory: 'Catégorie',
  templatesColumnLanguage: 'Langue',
  templatesColumnStatus: 'Statut',
  templatesStatusInactive: 'Inactif',
  templatesStatusActive: 'Actif',
  templatesColumnCreated: 'Créé',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3471: 'C\'est le',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesClearSelection: 'Effacer la sélection',
  templatesAssignButton: 'Attribuer des modèles',

  // resources/js\Components\Panels\PanelT5.tsx
  panelt538: 'Base de données',
  panelt544: 'Refonte du site Web',
  panelt555: 'Application mobile',
  panelt567: 'Modal.tsx',
  panelt572: 'README.md',
  panelt577: 'Documents',
  panelt582: 'Contrat.docx',
  panelt585: 'Rapports',
  panelt588: 'Rapport du 1er trimestre.xlsx',
  panelt589: 'Rapport T2.xlsx',
  panelt596: 'Actifs',
  panelt5235: '📁 Explorateur de bases de données',
  panelt5240: 'Développer tout',
  panelt5247: 'Réduire tout',
  panelt5271: 'Choisi:',
  panelt5273: 'Nom:',
  panelt5274: 'Taper:',
  panelt5275: 'IDENTIFIANT:',
  panelt5286: 'Nombre total d\'articles',
  panelt5292: 'Choisi',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel47: 'Non authentifié',
  profilepanel58: 'Les données utilisateur n\'ont pas pu être chargées',
  profilepanel69: 'Une erreur s\'est produite',
  profilepanel84: 'Non authentifié',
  profilepanel100: 'Le profil n\'a pas pu être mis à jour',
  profilepanel103: 'Profil mis à jour avec succès',
  profilepanel107: 'Une erreur s\'est produite',
  profilepanel121: 'Les nouveaux mots de passe ne correspondent pas',
  profilepanel129: 'Non authentifié',
  profilepanel145: 'Le mot de passe n\'a pas pu être modifié',
  profilepanel148: 'Mot de passe modifié avec succès',
  profilepanel156: 'Une erreur s\'est produite',
  profilepanel181: '{utilisateur?.email}',
  profilepanel200: 'Modifier le profil',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel204: 'Nom',
  profilepanel218: 'E-mail',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel234: 'Mettre à jour le profil',
  profilepanel242: 'Changer le mot de passe',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel246: 'Mot de passe actuel',
  profilepanel263: 'Nouveau mot de passe',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel276: 'Entrez le mot de passe',
  profilepanel277: 'Faible',
  profilepanel278: 'Moyen',
  profilepanel279: 'Rigide',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel284: 'Confirmer le nouveau mot de passe',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel302: 'Changement...',
  profilepanel310: 'Informations sur le compte',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel314: 'ID de l\'utilisateur',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel317: '{ID de l\'utilisateur}',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel321: 'Enregistré depuis',
  profilepanel330: 'E-mail vérifié',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel355: 'Jamais enregistré',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel118: 'd.m.Y',
  projectpanel119: 'Son',
  projectpanel121: 'Europe/Vienne',
  projectpanel224: 'Les noms de projets ne peuvent contenir que des lettres minuscules (a-z)',
  projectpanel232: 'Non authentifié',
  projectpanel253: 'Les noms de projets ne peuvent contenir que des lettres minuscules (a-z)',
  projectpanel258: 'Échec de la création du projet',
  projectpanel293: 'd.m.Y',
  projectpanel294: 'Son',
  projectpanel296: 'Europe/Vienne',
  projectpanel298: 'Projet créé avec succès',
  projectpanel301: 'projet modifié',
  projectpanel304: 'Erreur lors de la création du projet',
  projectpanel330: 'd.m.Y',
  projectpanel331: 'Son',
  projectpanel333: 'Europe/Vienne',
  projectpanel348: 'Non authentifié',
  projectpanel352: 'SUPPRIMER',
  projectpanel361: 'Échec de la suppression du projet',
  projectpanel369: 'Projet supprimé avec succès',
  projectpanel372: 'Erreur lors de la suppression du projet',
  projectpanel390: 'C\'est le',
  projectpanel405: 'Non authentifié',
  projectpanel416: 'Échec du chargement des équipes',
  projectpanel451: 'Non authentifié',
  projectpanel462: 'Échec du chargement des schémas',
  projectpanel492: 'Non authentifié',
  projectpanel539: 'Actif',
  projectpanel562: 'Aperçu du projet',
  projectpanel575: 'Gérer les membres',
  projectpanel583: 'Modifier le projet',
  projectpanel589: 'Supprimer le projet',
  projectpanel601: 'Chargement des projets...',
  projectpanel615: 'Gestion de projet',
  projectpanel626: 'Nouveau projet',
  projectpanel634: 'Rejoindre le projet',
  projectpanel642: 'Rafraîchir',
  projectpanel671: 'Projet en cours',
  projectpanel678: 'Modifier le projet',
  projectpanel692: 'Aucune description fournie',
  projectpanel698: 'Propriétaire:',
  projectpanel706: 'Créé:',
  projectpanel716: 'Code d\'adhésion',
  projectpanel724: 'Copier le code de connexion',
  projectpanel730: 'Privé',
  projectpanel742: 'Équipes',
  projectpanel748: 'Membres',
  projectpanel754: 'Modèles',
  projectpanel760: 'bases de données',
  projectpanel766: 'Applications',
  projectpanel773: 'Aucun projet actif',
  projectpanel774: 'Vous n\'avez pas encore de projet actif.',
  projectpanel776: 'Créer un projet',
  projectpanel786: 'Actions rapides',
  projectpanel789: 'Applications',
  projectpanel796: 'Membres du projet',
  projectpanel803: 'Gestion des équipes',
  projectpanel815: 'Invitations',
  projectpanel822: 'Modèles',
  projectpanel838: 'Base de données',
  projectpanel850: 'Tous les projets',
  projectpanel854: 'Aucun projet trouvé',
  projectpanel859: 'Projet',
  projectpanel862: 'Propriétaire',
  projectpanel868: 'Créé',
  projectpanel874: 'Statut',
  projectpanel879: 'Actes',
  projectpanel892: 'Créer un nouveau projet',
  projectpanel904: 'Paramètres du projet',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel907: 'Nom du projet *',
  projectpanel931: 'Description',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: 'Entrez la description du projet (facultatif)',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel955: 'Projet public',
  projectpanel959: 'Les projets publics sont visibles par tous les utilisateurs et peuvent être découverts dans la galerie de projets.',
  projectpanel972: 'Autoriser les demandes d\'adhésion',
  projectpanel976: 'Les utilisateurs peuvent demander à rejoindre ce projet en utilisant un code d\'adhésion.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel984: 'Connexion à la base de données',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel987: 'Nom de la base de données',
  projectpanel998: 'Nom de la base de données pour ce projet',
  projectpanel1004: 'Type de base de données',
  projectpanel1024: 'Serveur',
  projectpanel1038: 'Port',
  projectpanel1053: 'Nom d\'utilisateur',
  projectpanel1067: 'Mot de passe',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1084: 'Propriétés du projet',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1087: 'Répertoire des projets',
  projectpanel1098: 'Chemin où les fichiers générés doivent être enregistrés',
  projectpanel1104: 'URL du projet',
  projectpanel1115: 'URL pour accéder au projet',
  projectpanel1121: 'Page d\'accueil',
  projectpanel1128: 'index.php',
  projectpanel1138: 'Langue par défaut',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1146: 'Anglais',
  projectpanel1147: 'Allemand',
  projectpanel1148: 'Français',
  projectpanel1149: 'Espagnol',
  projectpanel1150: 'italien',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1155: 'Langage standard pour la génération de projets',
  projectpanel1161: 'Nom de fichier court',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1185: 'Paramètres de localisation',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1189: 'Séparateur décimal',
  projectpanel1207: 'Séparateur de milliers',
  projectpanel1227: 'Format de date',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1234: 'd.m.Y',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1244: 'Format de l\'heure',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1251: 'Son',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: 'Symbole monétaire',
  projectpanel1281: 'Fuseau horaire',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1289: 'Europe/Vienne',
  projectpanel1290: 'Europe/Berlin',
  projectpanel1291: 'Europe/Zurich',
  projectpanel1292: 'Europe/Londres',
  projectpanel1293: 'Europe/Paris',
  projectpanel1294: 'Amérique/New_York',
  projectpanel1295: 'Amérique/Los Angeles',
  projectpanel1296: 'Asie/Tokyo',
  projectpanel1297: 'Australie/Sydney',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1303: 'Fuseau horaire par défaut pour le projet',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1325: 'Annuler',
  projectpanel1332: 'Créer un projet',
  projectpanel1342: 'Supprimer le projet',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: 'Êtes-vous sûr de vouloir supprimer ce projet ?',
  projectpanel1362: 'Cette action supprimera DÉFINITIVEMENT le projet et toutes ses données. Cela ne peut pas être annulé ! Les équipes, modèles et bases de données associés à ce projet resteront intacts.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1371: 'Annuler',
  projectpanel1378: 'Supprimer le projet',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1434: '📋 Propriétés du projet',
  projectpanel1437: 'Nom:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1440: '📋 Propriétés du projet',
  projectpanel1443: 'Nom:',
  projectpanel1447: 'Propriétaire:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: 'Code d\'adhésion :',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: 'Créé:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: 'Description:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1455: 'Code d\'adhésion :',
  projectpanel1459: 'Description:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1461: '👤 Membres du projet',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: '👤 Membres du projet',
  projectpanel1471: 'Chargement des membres...',
  projectpanel1481: 'Utilisateur inconnu',
  projectpanel1482: 'Pas d\'email',
  projectpanel1491: 'Membre',
  projectpanel1513: '👥 Équipes et membres',
  projectpanel1517: 'Chargement des équipes...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1529: '🗄️ Schémas de bases de données',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: '🗄️ Schémas de bases de données',
  projectpanel1539: 'Chargement des schémas...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1542: 'Aucun schéma de base de données n\'est encore lié à ce projet.',
  projectpanel1550: '📄 Modèles liés',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: '📄 Modèles liés',
  projectpanel1560: 'Chargement des modèles...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1563: 'Aucun modèle lié à ce projet pour le moment.',
  projectpanel1573: 'Fermer',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: 'Gérer un projet',
  projectpanel1585: 'Gérer un projet',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: 'd.m.Y',
  projectsettingspanel65: 'Son',
  projectsettingspanel67: 'Europe/Vienne',
  projectsettingspanel143: 'd.m.Y',
  projectsettingspanel144: 'Son',
  projectsettingspanel146: 'Europe/Vienne',
  projectsettingspanel151: 'Erreur lors du chargement des données du projet',
  projectsettingspanel190: 'Aucun projet sélectionné',
  projectsettingspanel209: 'Non authentifié',
  projectsettingspanel225: 'Échec de la mise à jour du projet',
  projectsettingspanel243: 'Échec de l\'enregistrement des paramètres de langue',
  projectsettingspanel246: 'Les paramètres du projet ont été enregistrés avec succès',
  projectsettingspanel251: 'Erreur lors de l\'enregistrement des paramètres du projet',
  projectsettingspanel258: 'PROJ-',
  projectsettingspanel275: 'Veuillez sélectionner un projet',
  projectsettingspanel276: 'selectedProject est nul',
  projectsettingspanel277: '🔍 ProjectSettingsPanel chargé mais aucun projet sélectionné',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel295: 'Paramètres du projet',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: 'Enregistrer toutes les modifications',
  projectsettingspanel313: 'En général',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: 'Nom du projet *',
  projectsettingspanel331: 'Description',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel338: 'Entrez la description du projet',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel344: 'Code d\'adhésion',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel351: 'Code d\'adhésion (facultatif)',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel359: 'Les utilisateurs peuvent rejoindre ce projet avec ce code',
  projectsettingspanel375: 'Rendre ce projet visible à tous les utilisateurs',
  projectsettingspanel382: 'Transférer la propriété',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel405: 'base de données',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel408: 'Nom de la base de données',
  projectsettingspanel420: 'Type de base de données',
  projectsettingspanel463: 'nom d\'utilisateur',
  projectsettingspanel475: 'mot de passe',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel489: 'Caractéristiques',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel492: 'Répertoire du projet',
  projectsettingspanel501: 'Chemin où les fichiers générés doivent être enregistrés',
  projectsettingspanel507: 'URL du projet',
  projectsettingspanel516: 'URL pour accéder au projet',
  projectsettingspanel522: 'Maison',
  projectsettingspanel537: 'Langue par défaut',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel544: 'Anglais',
  projectsettingspanel545: 'Allemand',
  projectsettingspanel546: 'Français',
  projectsettingspanel547: 'Espagnol',
  projectsettingspanel548: 'italien',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: 'Langage standard pour la génération de projets',
  projectsettingspanel558: 'Nom de fichier court',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel565: '2 personnages',
  projectsettingspanel566: '3 personnages',
  projectsettingspanel567: '4 caractères',
  projectsettingspanel568: '5 caractères',
  projectsettingspanel578: 'Localisation',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: 'Séparateur décimal',
  projectsettingspanel592: 'par exemple \',\' pour 1,23 ou \'.\' pour 1,23',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel593: 'pour 1,23 ou',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: 'Séparateur de milliers',
  projectsettingspanel608: 'par exemple \'.\' pour 1 234 ou \',\' pour 1 234',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel609: 'pour 1 234 ou',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: 'Format de date',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel622: 'd.m.Y',
  projectsettingspanel626: 'd.m.Y',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: 'Format de l\'heure',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel637: 'Son',
  projectsettingspanel641: 'Son',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel658: 'par exemple \'€\', \'$\', \'£\', \'CHF\'',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel659: 'CHF',
  projectsettingspanel671: 'Europe/Vienne',
  projectsettingspanel672: 'Europe/Berlin',
  projectsettingspanel673: 'Europe/Zurich',
  projectsettingspanel674: 'Europe/Londres',
  projectsettingspanel675: 'Amérique/New_York',
  projectsettingspanel676: 'Amérique/Chicago',
  projectsettingspanel677: 'Amérique/Los Angeles',
  projectsettingspanel678: 'Asie/Tokyo',
  projectsettingspanel679: 'Asie/Dubaï',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel680: 'UTC',
  projectsettingspanel689: 'Clé API Google Translate',
  projectsettingspanel700: 'Clé API pour les traductions automatiques via Google Translate',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: 'Langues',
  projectsettingspanel727: 'Langues disponibles',
  projectsettingspanel728: 'Langues activées',
  projectsettingspanel733: 'Chercher...',
  projectsettingspanel734: 'Chercher...',
  projectsettingspanel739: 'Langues sélectionnées :',
  projectsettingspanel742: 'Aucune langue sélectionnée',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel85: 'Non authentifié',
  publicprojectspanel97: 'Échec du chargement des projets publics',
  publicprojectspanel104: 'Erreur lors du chargement des projets publics',
  publicprojectspanel111: 'C\'est le',
  publicprojectspanel183: 'Échec du clonage du projet',
  publicprojectspanel186: 'Échec du clonage du projet',
  publicprojectspanel210: 'Chargement des projets publics...',
  publicprojectspanel222: 'Projets publics',
  publicprojectspanel227: 'Rejoignez avec le code',
  publicprojectspanel234: 'Rafraîchir',
  publicprojectspanel253: 'Rechercher des projets par nom, description ou propriétaire...',
  publicprojectspanel266: 'Aucun projet public',
  publicprojectspanel270: 'Essayez d’ajuster vos termes de recherche.',
  publicprojectspanel271: 'Il n\'y a aucun projet public disponible pour le moment.',
  publicprojectspanel276: 'Effacer la recherche',
  publicprojectspanel296: 'Publique',
  publicprojectspanel316: 'Aucune description fournie.',
  publicprojectspanel338: 'Votre projet',
  publicprojectspanel342: 'Ceci est votre propre projet. Utilisez l\'onglet « Projets » pour le dupliquer.',
  publicprojectspanel346: 'Projet Clone',
  publicprojectspanel366: 'Total des projets',
  publicprojectspanel372: 'Accepter les membres',
  publicprojectspanel378: 'Affichage',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel411: 'Nom du projet *',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: 'Entrez le nom du projet',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel426: 'Description',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel433: 'Entrez la description du projet',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: 'Projet public',
  publicprojectspanel452: 'Les projets publics sont visibles par tous les utilisateurs et peuvent être découverts dans la galerie de projets.',
  publicprojectspanel455: '💡 Remarque : les projets privés peuvent nécessiter des fonctionnalités premium.',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel463: 'Projet original :',
  publicprojectspanel474: 'Annuler',
  publicprojectspanel481: 'Projet Clone',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel31: 'Les mots de passe ne correspondent pas',
  registerpanel54: 'L\'inscription a échoué',
  registerpanel57: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
  registerpanel75: 'Une erreur s\'est produite',
  registerpanel90: 'Registre',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel115: 'Nom',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel123: 'Votre nom complet',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel131: 'E-mail',
  registerpanel139: 'votre.email@exemple.com',
  registerpanel147: 'mot de passe',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel154: 'Au moins 8 caractères',
  registerpanel161: 'Entrez le mot de passe',
  registerpanel162: 'Faible',
  registerpanel163: 'Moyen',
  registerpanel164: 'Rigide',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel169: 'Confirmez le mot de passe',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel176: 'Répéter le mot de passe',
  registerpanel188: 'Les inscriptions sont en cours...',
  registerpanel198: 'Vous avez déjà un compte ? Se connecter',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel104: 'Échec du chargement des langues :',
  schematranslationpanel133: 'Échec du chargement de la structure du schéma :',
  schematranslationpanel281: 'Veuillez sélectionner au moins une langue',
  schematranslationpanel289: 'Non authentifié',
  schematranslationpanel303: 'Échec de l\'exportation des traductions',
  schematranslationpanel317: 'Traductions exportées avec succès',
  schematranslationpanel319: 'Erreur inconnue',
  schematranslationpanel334: 'Veuillez sélectionner un fichier et au moins une langue',
  schematranslationpanel342: 'Non authentifié',
  schematranslationpanel364: 'Échec de l\'importation des traductions',
  schematranslationpanel377: 'Échec de l\'importation :',
  schematranslationpanel385: 'Aucun projet sélectionné',
  schematranslationpanel449: 'Veuillez sélectionner au moins une langue cible',
  schematranslationpanel459: 'Non authentifié',
  schematranslationpanel481: 'Échec de la traduction automatique :',
  schematranslationpanel505: 'La traduction a échoué',
  schematranslationpanel640: 'Tableau',
  schematranslationpanel648: 'Champ',
  schematranslationpanel662: 'Sélectionnez un élément à traduire',
  schematranslationpanel663: 'Choisissez une table ou un champ dans l\'arborescence du schéma pour gérer ses traductions',
  schematranslationpanel682: 'Gérer les traductions pour cet {itemInfo.type.toLowerCase()}',
  schematranslationpanel688: 'Sauvegarde automatique...',
  schematranslationpanel701: '>Aucune traduction trouvée pour',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel702: 'Saisissez les traductions ci-dessous pour créer de nouvelles entrées. Elles seront automatiquement enregistrées après une seconde d\'inactivité.',
  schematranslationpanel743: 'Gestionnaire de traduction de schémas',
  schematranslationpanel746: 'Traduire les noms des tables et des champs de la base de données pour l\'internationalisation',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: 'Exporter',
  schematranslationpanel762: 'Importer',
  schematranslationpanel771: 'Traduction automatique',
  schematranslationpanel791: 'Schéma de base de données',
  schematranslationpanel802: 'Développer tout',
  schematranslationpanel812: 'Réduire tout',
  schematranslationpanel818: 'Sélectionnez les tables et les champs à traduire',
  schematranslationpanel820: 'Projet : {selectedProject.name}',
  schematranslationpanel827: 'Veuillez d\'abord sélectionner un projet',
  schematranslationpanel830: 'Chargement du schéma...',
  schematranslationpanel834: 'Aucune table de schéma trouvée',
  schematranslationpanel835: 'Ce projet n\'a pas de données de schéma à traduire',
  schematranslationpanel908: 'Exporter les traductions vers Excel',
  schematranslationpanel922: 'Exporter pour {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel923: 'Sélectionnez les langues à inclure dans l\'exportation Excel. L\'exportation contiendra toutes les tables et tous les champs des bases de données liées.',
  schematranslationpanel931: 'Sélectionner les langues *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel938: 'Sélectionnez les langues à exporter',
  schematranslationpanel950: 'Annuler',
  schematranslationpanel957: 'Exporter vers Excel',
  schematranslationpanel969: 'Importer des traductions depuis Excel',
  schematranslationpanel986: 'Importer pour {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel987: 'Téléchargez un fichier Excel avec les traductions. Sélectionnez les langues à importer.',
  schematranslationpanel995: 'Télécharger le fichier Excel *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1006: 'Choisissez un fichier Excel',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1015: 'Sélectionnez les langues à importer *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: 'Sélectionnez les langues à importer',
  schematranslationpanel1034: 'Annuler',
  schematranslationpanel1044: 'Importer des traductions',
  schematranslationpanel1056: 'Traduction automatique avec Google Traduction',
  schematranslationpanel1074: 'Traduction automatique',
  schematranslationpanel1078: 'Tous les tableaux et champs avec la langue source seront traduits automatiquement.',
  schematranslationpanel1079: 'Sélectionnez la langue source (doit déjà être renseignée) et les langues cibles pour la traduction.',
  schematranslationpanel1090: 'traduireTout',
  schematranslationpanel1103: '🚀 Traduire tous les tableaux et champs',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1113: 'Langue source *',
  schematranslationpanel1139: 'Langues cibles *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: 'Sélectionnez les langues cibles',
  schematranslationpanel1195: 'Annuler',
  schematranslationpanel1205: 'Traduire maintenant',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel48: 'Échec du chargement des paramètres :',
  systemsettingspanel67: 'Paramètres mis à jour avec succès !',
  systemsettingspanel69: 'Échec de la mise à jour des paramètres :',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel86: '⚙️ Paramètres système',
  systemsettingspanel89: 'Configurer les paramètres système globaux pour Scoriet',
  systemsettingspanel99: '🌍 API Google Traduction',
  systemsettingspanel102: 'Configurer la clé API globale de Google Translate pour les utilisateurs du plan Business',
  systemsettingspanel107: 'Clé API globale',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: 'Saisissez la clé API Google Translate...',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel132: '💰 Tarifs d\'abonnement',
  systemsettingspanel135: 'Définissez les prix d\'abonnement mensuels pour chaque niveau de forfait',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel148: 'Veuillez saisir le prix Premium',
  systemsettingspanel149: 'Le prix doit être positif',
  systemsettingspanel157: 'dollars américains',
  systemsettingspanel180: 'Veuillez saisir le prix professionnel',
  systemsettingspanel181: 'Le prix doit être positif',
  systemsettingspanel189: 'dollars américains',
  systemsettingspanel212: 'Veuillez saisir le prix minimum du mécène',
  systemsettingspanel213: 'Le prix doit être positif',
  systemsettingspanel221: 'dollars américains',
  systemsettingspanel242: 'Réinitialiser',
  systemsettingspanel251: 'Enregistrer les paramètres',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel105: 'Non authentifié',
  teammanagementpanel143: 'Non authentifié',
  teammanagementpanel155: 'Échec du chargement des équipes',
  teammanagementpanel174: 'Erreur',
  teammanagementpanel175: 'Échec du chargement des équipes',
  teammanagementpanel200: 'Supprimer l\'équipe',
  teammanagementpanel208: 'Non authentifié',
  teammanagementpanel212: 'SUPPRIMER',
  teammanagementpanel221: 'Échec de la suppression de l\'équipe',
  teammanagementpanel226: 'Succès',
  teammanagementpanel227: 'L\'équipe a été supprimée avec succès',
  teammanagementpanel234: 'équipe modifiée',
  teammanagementpanel239: 'Erreur',
  teammanagementpanel240: 'Échec de la suppression de l\'équipe',
  teammanagementpanel258: 'Succès',
  teammanagementpanel259: 'Équipe créée avec succès',
  teammanagementpanel264: 'équipe modifiée',
  teammanagementpanel277: 'Nouvelle équipe',
  teammanagementpanel291: 'Rechercher des équipes ici...',
  teammanagementpanel316: 'Inconnu',
  teammanagementpanel334: 'Inactif',
  teammanagementpanel361: 'Aucun projet',
  teammanagementpanel368: 'C\'est le',
  teammanagementpanel386: 'Gérer les membres',
  teammanagementpanel394: 'Équipe de rédaction',
  teammanagementpanel400: 'Supprimer l\'équipe',
  teammanagementpanel416: 'Gestion d\'équipe',

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: 'Créez, gérez et organisez vos équipes. Affectez des membres à vos équipes et contrôlez leurs autorisations d\'accès.',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: 'Aucune équipe trouvée',
  teammanagementpanel451: 'Nom de l\'équipe',
  teammanagementpanel458: 'Propriétaire',
  teammanagementpanel465: 'Membres',
  teammanagementpanel471: 'Statut',
  teammanagementpanel478: 'Projets',
  teammanagementpanel485: 'Créé',
  teammanagementpanel491: 'Actes',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old97: 'Aucun jeton d\'authentification trouvé',
  teamspanel_old147: 'Une erreur s\'est produite',
  teamspanel_old192: 'Impossible d\'accepter l\'invitation',
  teamspanel_old216: 'Impossible de refuser l\'invitation',
  teamspanel_old225: 'Chargement des équipes...',
  teamspanel_old236: 'Erreur lors du chargement des équipes',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old241: 'Réessayer',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old263: 'Créer une équipe',
  teamspanel_old270: 'Équipes détenues',
  teamspanel_old271: 'Membre de',
  teamspanel_old272: 'Invitations',
  teamspanel_old297: 'Aucune équipe pour le moment',
  teamspanel_old298: 'Créez votre première équipe pour commencer à collaborer',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old316: 'Propriétaire',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old360: 'Je ne suis membre d\'aucune équipe',
  teamspanel_old361: 'Vous verrez les équipes que vous êtes invité à rejoindre ici',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old373: 'Membre',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old415: 'Aucune invitation en attente',
  teamspanel_old416: 'Les invitations d\'équipe apparaîtront ici',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel91: 'Non authentifié',
  teamspanel128: 'Erreur lors du chargement des données',
  teamspanel172: 'Erreur lors du chargement des équipes de projet',
  teamspanel182: 'Non authentifié',
  teamspanel193: 'Échec du chargement des projets',
  teamspanel199: 'Erreur lors du chargement des projets',
  teamspanel227: 'Non authentifié',
  teamspanel238: 'Échec du chargement des équipes',
  teamspanel255: 'Erreur lors du chargement des équipes',
  teamspanel270: 'Non authentifié',
  teamspanel295: 'Échec de l\'affectation des équipes',
  teamspanel347: 'équipe modifiée',
  teamspanel349: ' équipes affectées à des projets avec succès',
  teamspanel350: 'Erreur lors de l\'attribution des équipes',
  teamspanel364: 'Non authentifié',
  teamspanel368: 'SUPPRIMER',
  teamspanel420: 'équipe modifiée',
  teamspanel425: 'Erreur lors de la suppression de l\'équipe',
  teamspanel430: 'supprimé du projet avec succès',
  teamspanel451: 'Chargement des équipes...',
  teamspanel457: 'Équipes de projet',
  teamspanel487: 'Rechercher des projets ou des équipes...',

  // resources/js/Components/Panels/TeamsPanel.tsx
  teamspanel494: 'Aucun projet trouvé',
  teamspanel527: 'Aucune équipe disponible pour ce projet',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel544: 'Inconnu',
  teamspanel552: 'Non attribué',
  teamspanel557: 'Affecté',
  teamspanel563: 'Supprimer du projet',
  teamspanel608: 'Effacer la sélection',
  teamspanel619: 'Affecter des équipes à des projets',
  teamspanel630: 'Aucune équipe trouvée',
  teamspanel675: 'Supprimer du projet',
  teamspanel697: 'Nom de l\'équipe',
  teamspanel698: 'Description',
  teamspanel701: 'Propriétaire',
  teamspanel705: 'Inconnu',
  teamspanel711: 'Membres',
  teamspanel721: 'Statut',
  teamspanel726: 'Inactif',
  teamspanel732: 'Créé',
  teamspanel733: 'C\'est le',
  teamspanel745: 'Effacer la sélection',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: 'Échec du chargement des schémas de base de données',
  templatedbschemadependenciespanel123: 'Dépendance du schéma de base de données ajoutée avec succès',
  templatedbschemadependenciespanel128: 'Échec de l\'ajout de la dépendance',
  templatedbschemadependenciespanel132: 'Échec de l\'ajout de la dépendance',
  templatedbschemadependenciespanel144: 'Ajouter une dépendance au schéma de base de données',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel158: 'Schéma de base de données *',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: 'Veuillez sélectionner un schéma de base de données',
  templatedbschemadependenciespanel176: 'Sélectionnez un schéma de base de données',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel203: 'Dépendance requise',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: 'Entrez un alias pour ce schéma de base de données dans le modèle',
  templatedbschemadependenciespanel242: 'Annuler',
  templatedbschemadependenciespanel248: 'Ajouter une dépendance',
  templatedbschemadependenciespanel324: 'Échec du chargement des modèles',
  templatedbschemadependenciespanel346: 'Échec du chargement des dépendances du modèle',
  templatedbschemadependenciespanel350: 'Échec du chargement des dépendances du modèle',
  templatedbschemadependenciespanel364: 'SUPPRIMER',
  templatedbschemadependenciespanel367: 'Dépendance supprimée avec succès',
  templatedbschemadependenciespanel372: 'Échec de la suppression de la dépendance',
  templatedbschemadependenciespanel376: 'Échec de la suppression de la dépendance',
  templatedbschemadependenciespanel390: 'Inactif',
  templatedbschemadependenciespanel404: 'Affichage uniquement',
  templatedbschemadependenciespanel405: 'Vous ne pouvez modifier que vos propres modèles',
  templatedbschemadependenciespanel415: 'Gérer',
  templatedbschemadependenciespanel440: 'Requis',
  templatedbschemadependenciespanel442: 'Facultatif',
  templatedbschemadependenciespanel457: 'Modèle en lecture seule',
  templatedbschemadependenciespanel469: 'Supprimer la dépendance',
  templatedbschemadependenciespanel483: 'Modèle - Dépendances du schéma de base de données',
  templatedbschemadependenciespanel496: 'Modèles',
  templatedbschemadependenciespanel504: 'Tous',
  templatedbschemadependenciespanel505: 'Système',
  templatedbschemadependenciespanel506: 'Publique',
  templatedbschemadependenciespanel507: 'Projet',
  templatedbschemadependenciespanel517: 'Rechercher des modèles...',
  templatedbschemadependenciespanel527: 'Aucun modèle disponible',
  templatedbschemadependenciespanel536: 'Modèle',
  templatedbschemadependenciespanel541: 'Actes',
  templatedbschemadependenciespanel559: 'Ajouter',
  templatedbschemadependenciespanel570: 'Aucune dépendance au schéma de base de données',
  templatedbschemadependenciespanel578: 'Schéma de base de données',
  templatedbschemadependenciespanel583: 'Statut',
  templatedbschemadependenciespanel588: 'Actes',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel595: 'Sélectionnez un modèle pour afficher ses dépendances de schéma de base de données',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager108: 'Créer',
  templatefilemanager116: 'Fichier supprimé avec succès',
  templatefilemanager120: 'Erreur lors de la suppression du fichier',
  templatefilemanager131: 'Erreur lors du déplacement du fichier',
  templatefilemanager137: 'Etes-vous sûr de vouloir supprimer ce fichier ?',
  templatefilemanager138: 'Supprimer le fichier ?',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager141: 'Et',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: 'Non',
  templatefilemanager175: 'En haut',
  templatefilemanager185: 'Vers le bas',
  templatefilemanager195: 'Modifier',
  templatefilemanager205: 'Supprimer',
  templatefilemanager216: 'Gérer les fichiers modèles',
  templatefilemanager220: 'Nouveau fichier',
  templatefilemanager227: 'Fermer',
  templatefilemanager241: 'Aucun fichier disponible',
  templatefilemanager243: 'Nom',
  templatefilemanager244: 'Taper',
  templatefilemanager245: 'Série',
  templatefilemanager246: 'Taille',
  templatefilemanager247: 'Actes',
  templatefilemanager252: 'Créer un nouveau fichier',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager265: 'Nom de fichier *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager271: 'Veuillez entrer le nom du fichier!',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: 'par exemple, Model.php, component.tsx',
  templatefilemanager288: 'Taper *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager294: 'Veuillez sélectionner le type !',
  templatefilemanager301: 'Sélectionnez le type',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager335: 'Contenu du fichier *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager341: 'Veuillez saisir le contenu du fichier!',
  templatefilemanager347: 'Entrez le code du modèle ici...',
  templatefilemanager361: 'Annuler',
  templatefilemanager368: 'Créer',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: 'Tous',
  templatemanagementpanel113: 'Base de données',
  templatemanagementpanel115: 'Fichier statique',
  templatemanagementpanel116: 'Répertoire statique sous forme d\'archive ZIP',
  templatemanagementpanel117: 'Fichier spécifique au projet avec espaces réservés',
  templatemanagementpanel118: 'Fichier de table de base de données',
  templatemanagementpanel119: 'Fichier spécifique au projet avec prise en charge linguistique',
  templatemanagementpanel120: 'Fichier par table de base de données avec prise en charge linguistique',
  templatemanagementpanel135: 'Gestion des modèles',
  templatemanagementpanel150: 'Erreur lors du chargement des modèles. Veuillez d\'abord vous connecter.',
  templatemanagementpanel202: 'Erreur lors du chargement des détails du modèle',
  templatemanagementpanel211: 'Modèle supprimé définitivement',
  templatemanagementpanel216: 'Erreur lors de la suppression définitive du modèle',
  templatemanagementpanel230: 'Erreur lors de la modification du statut du modèle',
  templatemanagementpanel286: 'Modèle cloné avec succès',
  templatemanagementpanel291: 'Erreur lors du clonage du modèle',
  templatemanagementpanel335: 'Créer',
  templatemanagementpanel340: 'Sauvegarder',
  templatemanagementpanel359: 'Modèle enregistré avec succès',
  templatemanagementpanel395: 'Erreur lors de l\'enregistrement du modèle',
  templatemanagementpanel410: 'Modèle importé avec succès',
  templatemanagementpanel413: 'Erreur lors de l\'importation du modèle',
  templatemanagementpanel419: 'Un modèle portant ce nom existe déjà. Voulez-vous le remplacer ?',
  templatemanagementpanel420: 'Le modèle existe déjà',
  templatemanagementpanel428: 'Modèle importé et écrasé avec succès',
  templatemanagementpanel433: 'Erreur lors de l\'écrasement du modèle',
  templatemanagementpanel436: 'Et',
  templatemanagementpanel437: 'Annuler',
  templatemanagementpanel441: 'Erreur lors de l\'importation du modèle',
  templatemanagementpanel464: 'Modèle exporté avec succès',
  templatemanagementpanel467: 'Erreur lors de l\'exportation du modèle',
  templatemanagementpanel485: 'Aucun modèle sélectionné',
  templatemanagementpanel517: 'Erreur lors de la suppression du fichier',
  templatemanagementpanel521: 'Erreur lors de la suppression du fichier :',
  templatemanagementpanel527: 'Aucun modèle sélectionné',
  templatemanagementpanel595: 'ajouté',
  templatemanagementpanel597: 'Erreur lors de l\'enregistrement du fichier',
  templatemanagementpanel601: 'Erreur lors de l\'enregistrement du fichier :',
  templatemanagementpanel613: 'Gestion des modèles',
  templatemanagementpanel618: 'Nouveau modèle',
  templatemanagementpanel624: 'Importer',
  templatemanagementpanel646: 'Rechercher des modèles...',
  templatemanagementpanel653: 'Catégorie',
  templatemanagementpanel667: 'Aucun modèle trouvé',
  templatemanagementpanel669: '{first} à {last} des modèles {totalRecords}',
  templatemanagementpanel672: 'Nom',
  templatemanagementpanel675: 'Catégorie',
  templatemanagementpanel684: 'Langue',
  templatemanagementpanel693: 'Mots-clés',
  templatemanagementpanel706: 'Fichiers',
  templatemanagementpanel711: 'Statut',
  templatemanagementpanel716: 'Actif',
  templatemanagementpanel721: 'Taper',
  templatemanagementpanel736: 'Privé',
  templatemanagementpanel743: 'Créé',
  templatemanagementpanel744: 'C\'est le',
  templatemanagementpanel747: 'Actes',
  templatemanagementpanel757: 'Montrer',
  templatemanagementpanel764: 'Modifier',
  templatemanagementpanel771: 'Exporter',
  templatemanagementpanel777: 'Cloner',
  templatemanagementpanel785: 'Activer',
  templatemanagementpanel791: 'Supprimer définitivement le modèle ? Cette action est irréversible !',
  templatemanagementpanel795: 'Supprimer définitivement',
  templatemanagementpanel859: 'Description:',
  templatemanagementpanel862: 'Catégorie:',
  templatemanagementpanel865: 'Langue:',
  templatemanagementpanel868: 'Mots clés:',
  templatemanagementpanel876: 'Fichiers ({viewingTemplate.files?.length || 0}) :',
  templatemanagementpanel893: 'Aucun fichier disponible',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel933: 'Nouveau nom de modèle',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: 'Entrez le nom du modèle...',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel944: '🔍 Vérifier la disponibilité...',
  templatemanagementpanel949: '❌ Le nom ne peut pas être attribué deux fois',
  templatemanagementpanel954: '✅ Le nom est disponible',
  templatemanagementpanel961: 'visibilité',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel970: 'Public (visible par tous)',
  templatemanagementpanel971: 'Privé (juste pour vous)',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel976: 'Ceux:',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel977: 'Taper:',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal15: 'Promesse',
  templatemodal16: 'Promesse',
  templatemodal147: 'Créer un nouveau modèle',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal159: 'Nom *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: 'Veuillez saisir le nom du modèle !',
  templatemodal169: 'Le nom du modèle doit contenir uniquement des lettres minuscules',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal195: 'Description',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal206: 'Description du modèle (facultatif)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal220: 'Catégorie *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal226: 'Veuillez sélectionner une catégorie !',
  templatemodal235: 'Tous',
  templatemodal236: 'Sélectionnez une catégorie',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: 'Langue *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: 'Veuillez entrer la langue !',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal259: 'par exemple, PHP, JavaScript, TypeScript',
  templatemodal276: 'Mots-clés',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: 'Ajouter des balises (appuyez sur Entrée)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal301: 'Visibilité *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: 'Veuillez sélectionner la visibilité !',
  templatemodal317: 'Publique',
  templatemodal318: 'Privé',
  templatemodal320: 'Sélectionner la visibilité',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal333: 'Modèle de système',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: 'Fichiers modèles',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal379: 'Veuillez enregistrer le modèle, ce n\'est qu\'alors que vous pourrez ajouter des fichiers au modèle',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal395: 'Nom',
  templatemodal396: 'Taper',
  templatemodal397: 'Taille',
  templatemodal398: 'Actes',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal448: 'Aucun fichier ajouté. Cliquez sur « Ajouter un fichier » pour commencer.',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal449: 'Ajouter un fichier',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal469: 'Le modèle est actif',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal491: 'Sauvegarder',
  templatemodal502: 'Aucun changement',
  templatemodal503: 'Créer',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal65: 'Non authentifié',
  sqlimportmodal76: 'Échec du chargement des schémas',
  sqlimportmodal87: 'Erreur lors du chargement des schémas',
  sqlimportmodal106: 'Aucun projet sélectionné. Veuillez d\'abord en sélectionner un.',
  sqlimportmodal129: 'Un script SQL est requis',
  sqlimportmodal134: 'Veuillez sélectionner un schéma cible',
  sqlimportmodal139: 'Aucun projet sélectionné',
  sqlimportmodal144: 'Aucun schéma sélectionné',
  sqlimportmodal154: 'Authentification requise',
  sqlimportmodal177: 'Échec de l\'importation de SQL',
  sqlimportmodal203: 'L\'importation a échoué',
  sqlimportmodal211: '📥 Importer le schéma SQL',
  sqlimportmodal234: 'Importer le schéma de base de données à partir du script SQL',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal277: 'Schéma cible',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal286: 'Chargement des schémas...',
  sqlimportmodal301: 'Aucun schéma modifiable dans le projet',
  sqlimportmodal313: 'Brève description...',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal322: 'Script SQL',
  sqlimportmodal328: 'Collez vos instructions SQL CREATE TABLE ici...',
  sqlimportmodal332: 'Prend en charge les instructions et contraintes MySQL CREATE TABLE, ALTER TABLE',
  sqlimportmodal338: 'Télécharger le fichier SQL',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal353: 'Fichier chargé avec succès !',
  sqlimportmodal368: 'Cliquez pour sélectionner le fichier SQL',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal369: 'Prend en charge les fichiers .sql et .txt',
  sqlimportmodal405: 'Annuler',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: '📥 Schéma d\'importation',

  // resources/js\Components\TopBar.tsx
  topbar57: 'applications mises à jour',
  topbar60: 'applications mises à jour',
  topbar71: 'Les scories',
  topbar75: 'Générateur de code d\'entreprise',
  topbar98: 'Sélectionner un projet',
  topbar102: 'Aucun projet trouvé',
  topbar122: 'openApplicationsModal',

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: 'instrumentSans',
  fontprovider29: 'instrumentSans',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal19: 'Actuel',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal29: '💡 Créer une nouvelle version ?',
  versionconfirmationmodal53: 'Souhaitez-vous créer une nouvelle version pour cela ?',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal67: 'Oui, créer une nouvelle version',
  versionconfirmationmodal83: 'Non',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: 'Changer directement sans nouvelle version',
  versionconfirmationmodal92: 'ℹ️ Vous pouvez toujours créer une nouvelle version ultérieurement en sélectionnant « Enregistrer comme nouvelle version ».',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal93: 'Enregistrer comme nouvelle version',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: 'Annuler',

  // resources/js\contexts\ProjectContext.tsx
  projectcontext196: 'useProject doit être utilisé dans un ProjectProvider',

  // resources/js\contexts\ToastContext.tsx
  toastcontext19: 'Succès',
  toastcontext28: 'Erreur',
  toastcontext37: 'Informations',
  toastcontext46: 'avertissement',
  toastcontext63: 'useToast doit être utilisé dans un ToastProvider',

  // resources/js\i18n\index.ts
  indexts26: 'stockage local',
  indexts28: 'stockage local',

  // resources/js\lib\api.ts
  apits104: 'Authentification requise - veuillez vous connecter',
  apits119: 'Authentification expirée - veuillez vous reconnecter',
  apits152: 'Tous',
  apits201: 'Erreur inconnue',
  apits219: 'Erreur inconnue',
  apits235: 'Erreur inconnue',
  apits251: 'Erreur inconnue',
  apits268: 'Erreur inconnue',
  apits286: 'Erreur inconnue',
  apits314: 'Erreur inconnue',
  apits329: 'Erreur inconnue',
  apits350: 'Erreur inconnue',
  apits518: 'Échec de la récupération des prix :',
  apits527: 'EUR',
  apits553: 'EUR',

  // resources/js\pages\CMSPage.tsx
  cmspage45: 'langue modifiée',
  cmspage194: 'BÊTA',
  cmspage208: 'Maison',
  cmspage352: 'Les scories',

  // resources/js/pages/CMSPage.tsx
  cmspage353: 'L\'avenir de la génération de code. Conçu par des développeurs, pour des développeurs.',

  // resources/js\pages\CMSPage.tsx
  cmspage387: 'imprimer',
  cmspage412: 'Choisissez votre forfait',
  cmspage422: 'Plan actuel',
  cmspage423: 'Gratuit',
  cmspage426: 'Plan gratuit',
  cmspage435: 'Prime',
  cmspage440: 'Idéal pour les développeurs professionnels',
  cmspage462: 'Choisissez Premium',
  cmspage473: 'LE PLUS POPULAIRE',
  cmspage474: 'Entreprise',
  cmspage479: 'Idéal pour les équipes et les agences',
  cmspage501: 'Choisissez une entreprise',
  cmspage520: 'Soutenir la communauté',
  cmspage542: 'Devenir mécène',
  cmspage553: 'Vous pouvez modifier ou annuler votre forfait à tout moment. Tous les forfaits incluent une garantie satisfait ou remboursé de 30 jours.',

  // resources/js\pages\EmailVerification.tsx
  emailverification13: 'Confirmer l\'e-mail - Scoriet',

  // resources/js\pages\Index.tsx
  index133: 'Chargement du panneau...',
  index258: 'Équipe administrative',

  // resources/js/pages/Index.tsx
  index265: 'carte personnalisée',

  // resources/js\pages\Index.tsx
  index293: 'Gestion des modèles',
  index333: 'Gestion de base de données',
  index378: 'Générateur de manuel de débogage',
  index400: 'Accueillir',
  index413: 'Concepteur de bases de données',
  index426: 'Modèles',
  index439: 'Explorateur de bases de données',
  index476: 'Équipes',
  index495: 'Gestion de projet',
  index508: 'Mes candidatures',
  index521: 'Projets publics',
  index534: 'Protéger',
  index539: 'La suppression de cet onglet sera rejetée',
  index540: 'Cela se fait dans le rappel onLayoutChange',
  index542: 'Essayez Alt+P pour mettre à jour cet onglet',
  index543: 'Essayez Alt+M pour maximiser cet onglet',
  index544: 'Essayez Alt+L pour enregistrer la disposition actuelle',
  index545: 'Essayez Alt+C pour copier la mise en page dans le presse-papiers',
  index556: 'Se connecter',
  index590: 'Gestion des modèles',
  index625: 'Gestion de base de données',
  index662: 'Équipe administrative',
  index676: 'Modèle - Dépendances du schéma de base de données',
  index689: '🔧 Générateur de manuel de débogage',
  index711: 'Génération de code',
  index724: 'Gestion des langues',
  index737: 'Traduction de schéma',
  index750: 'Paramètres système',
  index763: 'Paramètres du projet',
  index776: 'Administrateur CMS',
  index792: 'Modal d\'authentification',
  index796: '📋 Informations',
  index797: 'L\'authentification est désormais gérée via des fenêtres modales.',
  index798: 'Utilisez le menu de navigation pour accéder à la connexion, à l\'inscription ou au profil.',
  index835: '🔧 Générateur de manuel de débogage',
  index861: 'Projet',
  index917: '⚠️ Onglet inconnu : {id}',
  index918: 'Cet ID d\'onglet n\'est pas défini dans la fonction loadTab.',
  index919: 'Onglets disponibles : t2, t3, t5, protect1, connexion, inscription, profil, oublié',
  index921: 'Vérifiez votre fonction loadTab !',
  index1415: 'Fermer tous les onglets',
  index1621: 'openApplicationsModalInPanel',
  index1636: 'openApplicationsModal',
  index1639: 'openApplicationsModal',

  // resources/js/pages/Index.tsx
  index1759: 'Effacer la mise en page enregistrée et réinitialiser les paramètres par défaut ?',

  // resources/js\pages\Index.tsx
  index1771: 'La mise en page a été copiée dans le presse-papiers !',
  index1784: 'La mise en page a été copiée dans le presse-papiers !',
  index1788: 'Voir la console pour la copie manuelle.',
  index1851: 'SAISIR',
  index1856: 'La suppression de cet onglet est rejetée !',
  index1928: 'Scoriet - Générateur de code d\'entreprise',
  index2009: 'Chargement...',
  index2020: 'Chargement...',
  index2058: 'Inscription réussie',
  index2070: 'Chargement...',

  // resources/js/pages/LandingPage.tsx
  statusLink: 'Statut',

  // resources/js\pages\LandingPage.tsx
  landingpage69: 'EUR',
  landingpage110: 'Erreur lors du chargement des données utilisateur :',

  // resources/js/pages/LandingPage.tsx
  sqlParserTitle: 'Analyseur SQL',
  sqlParserDesc: 'Analyse intelligente des schémas de base de données MySQL avec support des relations complexes et contraintes.',
  templateSystemTitle: 'Système de Templates',
  templateSystemDesc: 'Moteur de templates puissant avec exécution JavaScript pour la génération dynamique de code.',
  multiLanguageTitle: 'Support Multi-Langages',
  multiLanguageDesc: 'Générez du code pour PHP, JavaScript, TypeScript, Python et plus avec des templates personnalisables.',
  modernInterfaceTitle: 'Interface Moderne',
  modernInterfaceDesc: 'Interface MDI intuitive basée sur des docks avec empilement d\'onglets et panneaux flottants.',

  // resources/js\pages\LandingPage.tsx
  landingpage151: ' Pour toujours',
  landingpage152: 'Parfait pour les projets personnels',
  landingpage154: 'Jusqu\'à 3 projets',
  landingpage155: 'Modèles de base',
  landingpage156: 'Analyse de schéma SQL',
  landingpage157: 'Soutien communautaire',
  landingpage158: 'financé par la publicité',

  // resources/js/pages/LandingPage.tsx
  goStartFree: 'Commencer gratuitement',
  premiumLabel: 'Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage168: 'Idéal pour les développeurs professionnels',
  landingpage170: 'Projets illimités',
  landingpage171: 'Modèles avancés',
  landingpage172: 'Création de modèles personnalisés',
  landingpage173: 'Assistance prioritaire',
  landingpage174: 'Fonctionnalités SQL avancées',
  landingpage175: 'Collaboration d\'équipe',

  // resources/js/pages/LandingPage.tsx
  goPremium: 'Passer Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage182: 'Entreprise',
  landingpage186: 'Idéal pour les équipes et les agences',
  landingpage188: 'Toutes les fonctionnalités Premium',
  landingpage189: 'Outils de collaboration d\'équipe',
  landingpage190: 'Intégration de l\'API Google Translate',
  landingpage191: 'Analyses avancées',
  landingpage192: 'Assistance prioritaire avec SLA',
  landingpage193: 'Options de personnalisation de marque',
  landingpage195: 'Go Business',

  // resources/js/pages/LandingPage.tsx
  patronLabel: 'Mécène',

  // resources/js\pages\LandingPage.tsx
  landingpage203: 'Soutenir la communauté',
  landingpage205: 'Toutes les fonctionnalités Business',
  landingpage206: 'Accès anticipé aux fonctionnalités',
  landingpage207: 'Développement de l\'influence',
  landingpage208: 'Accès à la communauté Discord',
  landingpage209: 'Montant personnalisé (5-50€+)',

  // resources/js/pages/LandingPage.tsx
  becomePatron: 'Devenir Mécène',

  // resources/js\pages\LandingPage.tsx
  landingpage288: 'Scoriet - Générateur de code d\'entreprise',
  landingpage304: 'Onglet Bienvenue',
  landingpage307: 'ouvrirAccueilAuDémarrage',
  landingpage311: 'Ouvrir cet onglet au démarrage de l\'application',

  // resources/js/pages/LandingPage.tsx
  landingpage316: 'Fermez cet onglet pour vous concentrer sur vos projets',

  // resources/js\pages\LandingPage.tsx
  landingpage336: 'BÊTA',

  // resources/js/pages/LandingPage.tsx
  login: 'Connexion',
  register: 'S\'inscrire',
  profile: 'Profil',
  changePlan: 'Changer de plan',
  logout: 'Déconnexion',
  gotoApp: 'Aller à l\'app',
  title: 'Générateur de Code Enterprise',
  subtitle: 'Transformez vos schémas de base de données en code prêt pour la production avec des templates intelligents. Réduisez le temps de développement de 80% grâce à la génération automatisée de code.',
  startFree: 'Commencer gratuitement',
  tryDemo: 'Essayer la démo',
  watchDemo: 'Regarder la démo',
  featuresTitle: 'Fonctionnalités puissantes pour le développement moderne',
  pricingTitle: 'Choisissez votre plan',
  pricingSubtitle: 'Commencez gratuitement, améliorez quand vous êtes prêt à évoluer',

  // resources/js\pages\LandingPage.tsx
  landingpage479: 'LE PLUS POPULAIRE',
  landingpage486: 'Patreon',
  landingpage514: 'Gratuit',

  // resources/js/pages/LandingPage.tsx
  ctaTitle: 'Prêt à multiplier par 10 votre vitesse de développement?',
  ctaSubtitle: 'Rejoignez des milliers de développeurs qui utilisent déjà Scoriet pour créer de meilleurs logiciels plus rapidement.',
  startFreeTrial: 'Commencer l\'essai gratuit',
  tryDemoNow: 'Essayer la démo maintenant',
  contactSales: 'Contacter les ventes',
  welcomeBack: 'Utilisateur',

  // resources/js\pages\LandingPage.tsx
  landingpage573: 'Utilisateur',

  // resources/js/pages/LandingPage.tsx
  currentPlan: '{t.freeLabel} Plan',
  freeLabel: 'Gratuit',
  freeTier: 'Plan Gratuit',

  // resources/js\pages\LandingPage.tsx
  landingpage589: 'LE PLUS POPULAIRE',
  landingpage594: 'Coutume',

  // resources/js/pages/LandingPage.tsx
  upgradeTo: 'Passer à',
  currentPlanButton: 'Plan Actuel',
  landingpage629: 'Les scories',
  landingpage630: 'L\'avenir de la génération de code. Conçu par des développeurs, pour des développeurs.',
  productLabel: 'Produit',
  featuresLink: 'Fonctionnalités',
  pricingLink: 'Tarifs',
  templatesLink: 'Templates',
  examplesLink: 'Exemples',
  resourcesLabel: 'Ressources',
  documentationLink: 'Documentation',
  apiReferenceLink: 'Référence API',
  tutorialsLink: 'Tutoriels',
  blogLink: 'Blog',
  supportLabel: 'Support',
  helpCenterLink: 'Centre d\'aide',

  // resources/js\pages\LandingPage.tsx
  landingpage664: 'imprimer',

  // resources/js/pages/LandingPage.tsx
  contactUsLink: 'Nous contacter',
  communityLink: 'Communauté',
  allRightsReserved: '© 2025 Scoriet, tous droits réservés',

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: 'Politique de confidentialité',
  termsOfService: 'Conditions d\'utilisation',

  // resources/js\pages\LandingPage.tsx
  landingpage716: 'Choisissez votre forfait',
  landingpage726: 'Plan actuel',
  landingpage727: 'Gratuit',
  landingpage730: 'Plan gratuit',
  landingpage743: 'LE PLUS POPULAIRE',
  landingpage748: 'Coutume',
  landingpage764: 'Plan actuel',
  landingpage765: 'Gratuit',
  landingpage767: 'Gratuit',
  landingpage769: 'Gratuit',
  landingpage782: 'Vous pouvez modifier ou annuler votre forfait à tout moment. Tous les forfaits incluent une garantie satisfait ou remboursé de 30 jours.',
  landingpage801: 'Inscription réussie',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse70: 'Invitation invalide ou expirée',
  projectinvitationresponse77: 'Échec du chargement de l\'invitation',
  projectinvitationresponse133: 'Veuillez remplir tous les champs obligatoires',
  projectinvitationresponse138: 'Les mots de passe ne correspondent pas',
  projectinvitationresponse161: 'Inscription réussie ! Veuillez vérifier votre e-mail pour vérifier votre compte.',
  projectinvitationresponse167: 'L\'inscription a échoué',
  projectinvitationresponse170: 'Erreur lors de l\'inscription',
  projectinvitationresponse181: 'Chargement de l\'invitation...',
  projectinvitationresponse192: '🚀 Les scories',
  projectinvitationresponse193: 'Générateur de code d\'entreprise',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse223: 'Vous avez été invité à rejoindre un projet, mais vous devez d\'abord créer un compte',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse233: 'Déclin',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse235: 'Vous avez été invité à rejoindre un projet sur Scoriet',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse256: 'Invité par :',
  projectinvitationresponse266: 'Rôle:',
  projectinvitationresponse273: 'Propriétaire du projet:',
  projectinvitationresponse283: 'Expire le :',
  projectinvitationresponse292: 'Message personnel:',
  projectinvitationresponse307: '🚀 Créer un compte et rejoindre le projet',
  projectinvitationresponse334: '✅ Accepter l\'invitation',
  projectinvitationresponse348: '❌ Refuser l\'invitation',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse355: 'Vous pouvez refuser cette invitation si vous n\'êtes pas intéressé à rejoindre ce projet.',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse373: 'Bienvenue dans l\'équipe !',
  projectinvitationresponse374: 'Invitation refusée',
  projectinvitationresponse379: 'Vous pouvez désormais accéder au projet et commencer à collaborer avec votre équipe.',
  projectinvitationresponse380: 'Le propriétaire du projet a été informé de votre décision.',
  projectinvitationresponse386: 'Accéder à l\'application Scoriet',
  projectinvitationresponse399: 'Ceci est un message automatisé de Scoriet - Enterprise Code Generator',
  projectinvitationresponse407: 'Créez votre compte Scoriet',
  projectinvitationresponse417: 'Nom et prénom *',
  projectinvitationresponse428: 'Nom d\'utilisateur *',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse433: 'Johndoe',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse436: 'Uniquement des lettres minuscules, des chiffres, des traits d\'union et des traits de soulignement',
  projectinvitationresponse440: 'Adresse e-mail *',
  projectinvitationresponse449: 'Pré-rempli à partir de l\'invitation',
  projectinvitationresponse453: 'Mot de passe *',
  projectinvitationresponse458: 'Entrez votre mot de passe',
  projectinvitationresponse466: 'Confirmez le mot de passe *',
  projectinvitationresponse471: 'Confirmez votre mot de passe',
  projectinvitationresponse480: 'Annuler',
  projectinvitationresponse487: 'Créer un compte',

  // resources/views\admin\pages\create.blade.php
  createblade60: 'Saisissez ici le contenu de votre page. Le HTML est pris en charge.',

  // resources/views\emails\project-invitation.blade.php
  projectinvitationblade116: 'Si vous avez des questions',
  projectinvitationblade151: 'Déclin',

  // resources/views\layouts\static.blade.php
  staticblade37: 'Aide',

  // resources/views\pages\help.blade.php
  helpblade3: 'Aide',
  helpblade8: 'Centre d\'aide',
  helpblade13: 'Bienvenue au centre d\'aide Scoriet',
  helpblade16: 'Commencer',
  helpblade18: 'Apprenez à démarrer avec Scoriet',
  helpblade21: 'Créez votre premier projet',
  helpblade24: 'Étape 1',
  helpblade25: 'Étape 2',
  helpblade26: 'Étape 3',
  helpblade27: 'Étape 4',
  helpblade31: 'Caractéristiques',
  helpblade34: 'Fonctionnalité 1',
  helpblade35: 'Fonctionnalité 2',
  helpblade36: 'Fonctionnalité 3',
  helpblade37: 'Fonctionnalité 4',
  helpblade41: 'Soutien',
  helpblade43: 'Contactez notre équipe d\'assistance',

  // resources/views\pages\impressum.blade.php
  impressumblade3: 'imprimer',
  impressumblade8: 'imprimer',
  impressumblade14: 'Informations selon \' 5 TMG',
  impressumblade17: 'Nom de l\'entreprise',
  impressumblade18: 'Adresse',
  impressumblade22: 'Coordonnées',
  impressumblade25: 'Directeur général',
  impressumblade28: 'Registre du commerce',
  impressumblade31: 'Numéro d\'identification de TVA',

  // routes\api.php
  api36: 'Aucune version de schéma trouvée',
  api47: 'Table de test créée avec l\'ID :',
  api85: 'Ce jeton de réinitialisation de mot de passe n\'est pas valide.',
  api126: 'Échec de la récupération des informations de tarification',
  api180: 'Ceci montre comment le modèle doit être traité correctement',
  api181: 'La boucle n\'a pas été correctement fermée et les variables n\'ont pas été remplacées',
  api183: 'La boucle traite correctement tous les éléments',
  api184: 'Les variables sont correctement remplacées',
  api185: 'La syntaxe est propre et valide PHP',
  api194: 'Moteur de modèles simple - AUCUNE REGEX',
  api197: 'Aucune construction imbriquée sur une ligne',
  api198: 'Les boucles sont fermées proprement',
  api199: 'Pas d\'expression régulière - juste des opérations simples sur les chaînes',
  api202: 'Traitement ligne par ligne',
  api203: 'Remplacement variable simple',
  api204: 'Code maintenable sans regex',
  api205: 'Échappement JavaScript sécurisé',
  api300: 'Les équipes déboguent les points de terminaison',
  api416: 'Travaux d\'essai de la voie',
  api427: 'Tous les projets dans la base de données',
  api452: 'Version du schéma non trouvée',
  api509: 'Échec du débogage :',
  api528: 'Aucune contrainte trouvée',
  api745: 'Aucune version trouvée pour ce schéma',
  api761: 'Chargement des tables pour schema_version_id : {$schemaVersion->id} (version_number : {$schemaVersion->version_number})',
  api765: 'Première table : {$firstTable->table_name}',
  api771: 'La première contrainte comporte {$testColumns} colonnes dans la base de données',
  api777: 'Aucune table trouvée dans ce schéma',
  api803: '-- Exportation de base de données MySQL',
  api804: '-- Schéma :',
  api805: '-- Version: ',
  api806: 'Y-m-d H:i:s',
  api810: '-- AVERTISSEMENT : problèmes d’intégrité des données détectés !',
  api812: '-- Ces contraintes seront ignorées lors de l\'exportation',
  api813: '-- Pensez à réanalyser cette version de schéma ou contactez le support',
  api823: '-- Structure de table pour la table `',
  api860: 'Traitement de l\'ID de contrainte {$constraint->id} pour la table {$table->table_name}',
  api869: 'Colonnes {$constraintColumns->count()} trouvées pour la contrainte {$constraint->id}',
  api872: 'Ignorer la contrainte {$constraint->id} - aucune colonne trouvée',
  api913: '-- Exportation terminée avec succès',
  api914: '-- Nombre total de tables exportées :',
  api915: '-- Total des contraintes exportées :',
  api939: 'L\'exportation a échoué :',
  api954: 'Aucune contrainte trouvée',
  api998: 'Aucune version trouvée pour ce schéma',
  api1026: 'Aucune table trouvée dans ce schéma',
  api1050: '-- Exportation de base de données MySQL',
  api1051: '-- Schéma :',
  api1052: '-- Version: ',
  api1053: 'Y-m-d H:i:s',
  api1059: '-- Structure de table pour la table `',
  api1142: '-- Exportation terminée avec succès',
  api1143: '-- Nombre total de tables exportées :',
  api1161: 'L\'exportation a échoué :',
  api1276: 'Global gtree[] pour la mise en cache côté client',
  api1285: 'Une exception s\'est produite',
  api1300: 'Recherche de code de jointure de débogage',
  api1330: 'Modèle non trouvé',
  api1358: 'Une exception s\'est produite',
  api1379: 'Modèle non trouvé',
  api1386: 'Traitement de modèle avec filtre de projet : {$projectId}',
  api1388: 'Traitement des modèles sans filtre de projet (mode démo)',
  api1393: 'Traitement de modèle avec filtre de table : {$tableName}',
  api1431: 'Chargement des schémas pour le projet : {$project->name}',
  api1438: '{$linkedSchemas->count()} schémas liés trouvés pour le projet {$projectId}',
  api1454: '(version {$latestVersion->id})',
  api1458: 'Nombre total de tables liées au projet : {$schemaTables->count()}',
  api1465: 'Le projet {$projectId} n\'a pas de schémas liés - c\'est normal si aucune base de données n\'est connectée au projet',
  api1469: 'pour le projet {$projectId} car table_name a été spécifié',
  api1498: 'Table fictive créée avec des champs {$dummyFields->count()}',
  api1502: 'Aucun projet spécifié',
  api1532: 'Base de données du projet de démonstration',
  api1676: '🔍 Vérification de la substitution pour le fichier',
  api1682: 'comme spécifique à la table en raison du paramètre table_name : {$tableName}',
  api1684: '❌ Remplacement NON déclenché pour',
  api1707: 'Table non trouvée',
  api1760: ': table_index={$tableIndex}',
  api1809: 'Tous les fichiers dans une seule réponse JSON',
  api1810: 'Aucune requête HTTP multiple nécessaire',
  api1814: 'Recevez le gtree[] complet + tous les fichiers générés en une seule requête',
  api1815: 'Stocker gtree[] dans le navigateur pour une utilisation ultérieure',
  api1816: 'Traiter les fichiers générés (téléchargement/affichage)',
  api1817: 'Facultatif : créer un fichier ZIP à partir du tableau generated_files',
  api1824: 'Une exception s\'est produite',

  // routes\gtree-ultimate.php
  gtreeultimate26: 'Modèle non trouvé',
  gtreeultimate85: 'Y-m-d H:i:s',
  gtreeultimate86: 'A-m-j',
  gtreeultimate90: 'Y-m-d H:i:s',
  gtreeultimate91: 'Utilisateur de démonstration',
  gtreeultimate95: 'Utilisateur',
  gtreeultimate105: 'Projet de partition de démonstration',
  gtreeultimate120: 'Base de données du projet de démonstration',
  gtreeultimate149: 'Y-m-d H:i:s',
  gtreeultimate160: 'A-m-j',
  gtreeultimate161: 'Son',
  gtreeultimate163: 'Y-m-d H:i:s',
  gtreeultimate409: 'Une exception s\'est produite dans Ultimate Template Engine',

  // routes\web.php
  web50: 'Mode démo activé ! Les données sont réinitialisées toutes les 20 minutes.',
};
