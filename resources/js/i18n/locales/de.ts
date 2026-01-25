import type { Translations } from '../types';

export const de: Translations = {

  // app\Console\Commands\DebugSchemas.php
  debugschemas22: 'Debuggen Sie alle Schemata und ihre Tabellen',
  debugschemas29: '🔍 Debuggen aller Schemata und Tabellen',
  debugschemas38: 'Gefunden ',
  debugschemas49: 'Neueste Versionen pro Schema:',
  debugschemas56: 'Schema-ID: {$schemaId}',
  debugschemas70: 'Schemata mit {$totalTables} Gesamttabellen',

  // app\Console\Commands\DemoReset.php
  demoreset16: 'demo:reset {--backup : Backup vor dem Zurücksetzen erstellen}',
  demoreset23: 'Demodatenbank mit neuen Demodaten auf den Ausgangszustand zurücksetzen',
  demoreset31: 'Das Zurücksetzen der Demo kann nur in einer lokalen oder Demo-Umgebung ausgeführt werden!',
  demoreset35: '🚀 Demo-Datenbank wird zurückgesetzt ...',
  demoreset45: '✅ Demo-Datenbank wurde erfolgreich zurückgesetzt!',
  demoreset46: '📊 Demo-Benutzer verfügbar: Demo-Admin',
  demoreset53: '📦 Datenbanksicherung erstellen ...',
  demoreset60: 'J-m-t_H-i-s',
  demoreset65: '✅ Sicherung erstellt: {$filename}',
  demoreset70: '🗄️ Alle Tabellen löschen ...',
  demoreset89: '🔄 Migrationen werden ausgeführt …',
  demoreset92: '🌱 Demodaten werden bereitgestellt …',

  // app\Console\Commands\FixTemplateFilePaths.php
  fixtemplatefilepaths23: 'Korrigieren Sie leere Dateipfadwerte in der Tabelle „template_files“.',
  fixtemplatefilepaths30: 'Suche nach Templatedateien mit leerem Dateipfad ...',
  fixtemplatefilepaths43: 'Es wurden {$emptyCount} Dateien mit leerem Dateipfad von insgesamt {$totalFiles} Dateien gefunden',
  fixtemplatefilepaths46: 'Alle Templatedateien haben bereits Dateipfadwerte!',
  fixtemplatefilepaths50: 'Leere Dateipfadwerte werden korrigiert …',
  fixtemplatefilepaths70: 'Feste Datei-ID {$file->id}: {$file->file_name} -> {$path}',
  fixtemplatefilepaths74: '{$fixedCount} Templatedateipfade erfolgreich behoben!',

  // app\Console\Commands\TestObservers.php
  testobservers28: 'Testen Sie die Beobachterfunktionalität, indem Sie verschiedene Modellereignisse auslösen',
  testobservers37: '🧪 Testen der Observer-Funktionalität',
  testobservers42: 'Jobs in der Warteschlange vor dem Test: {$jobsBefore}',
  testobservers68: 'Jobs in der Warteschlange nach dem Test: {$jobsAfter}',
  testobservers69: 'Neue Jobs versandt: {$newJobs}',
  testobservers71: '✅ Beobachtertest abgeschlossen!',
  testobservers72: 'Überprüfen Sie die Protokolle auf detaillierte Beobachteraktivitäten.',
  testobservers77: '📋 Template Observer testen …',
  testobservers83: 'Testvorlage für die Beobachterfunktion',
  testobservers92: '✅ Template erstellt: {$template->id}',
  testobservers98: 'Hallo Welt',
  testobservers103: '✅ Datei zur Template hinzugefügt',
  testobservers106: 'Aktualisierte Beschreibung',
  testobservers107: '✅ Aktualisiere Template',
  testobservers111: '✅ Template gelöscht',
  testobservers114: '❌ Template-Beobachtertest fehlgeschlagen:',
  testobservers120: '📄 TemplateFile Observer testen …',
  testobservers126: 'Testvorlage für Dateibeobachter',
  testobservers139: 'Testdatei',
  testobservers144: '✅ Templatedatei erstellt: {$file->id}',
  testobservers147: 'Aktualisierter Inhalt',
  testobservers148: '✅ Aktualisierte Templatedatei',
  testobservers152: '✅ Gelöschte Templatedatei',
  testobservers158: '❌ TemplateFile-Beobachtertest fehlgeschlagen:',
  testobservers164: '🗄️ SchemaVersion Observer testen …',
  testobservers174: '⚠️ Keine Schemaversion für Projekt {$projectId} gefunden',
  testobservers183: 'Testversion für Beobachter',
  testobservers187: '✅ Schemaversion erstellt: {$newVersion->id}',
  testobservers191: '✅ Gelöschte Schemaversion',
  testobservers194: '❌ SchemaVersion-Beobachtertest fehlgeschlagen:',
  testobservers200: '📋 SchemaTable Observer wird getestet …',
  testobservers210: '⚠️ Keine Schemaversion für Projekt {$projectId} gefunden',
  testobservers218: 'Testtabelle für Beobachter',
  testobservers224: '✅ Schematabelle erstellt: {$table->id}',
  testobservers227: 'Aktualisierter Kommentar',
  testobservers228: '✅ Aktualisierte Schematabelle',
  testobservers232: '✅ Schematabelle gelöscht',
  testobservers235: '❌ SchemaTable-Beobachtertest fehlgeschlagen:',
  testobservers241: '🔗 ProjectTemplateUsage Observer wird getestet …',
  testobservers247: '⚠️ Kein Template gefunden',
  testobservers260: '✅ Verwendung der erstellten Projektvorlage: {$usage->id}',
  testobservers264: '✅ Aktualisierte Projektvorlagennutzung',
  testobservers268: '✅ Deaktivierte Projektvorlagennutzung',
  testobservers272: '✅ Verwendung gelöschter Projektvorlagen',
  testobservers275: '❌ ProjectTemplateUsage-Beobachtertest fehlgeschlagen:',

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas23: 'Testen Sie Schemaverbindungen für ein Projekt',
  testprojectschemas32: '🔍 Testen der Schemaverbindungen für das Projekt {$projectId}',
  testprojectschemas37: 'Alle verfügbaren Schemata:',
  testprojectschemas47: 'Projektschemata für Projekt {$projectId}:',
  testprojectschemas50: 'Unbekannt',
  testprojectschemas54: 'Tabellen aus verbundenen Schemata:',
  testprojectschemas59: 'Unbekannt',
  testprojectschemas73: 'Schema',
  testprojectschemas79: ': Keine Versionen gefunden',
  testprojectschemas83: 'Gesamtzahl der Tabellen aus allen verbundenen Schemata: {$totalTables}',

  // app\Console\Commands\TestTreeGenerator.php
  testtreegenerator25: 'Testen Sie die ProjectFileTreeGenerator-Funktionalität',
  testtreegenerator34: '🌳 Testen des ProjectFileTreeGenerator',
  testtreegenerator40: 'Projekt {$projectId} nicht gefunden',
  testtreegenerator44: 'Projekt: {$project->name} (ID: {$project->id})',
  testtreegenerator52: 'Aktive Templateverwendungen:',
  testtreegenerator62: 'Generierte Baumknoten:',
  testtreegenerator71: 'Templatedateien {$usage->template_id} ({$template->name}):',
  testtreegenerator81: '    Kinder: ',
  testtreegenerator95: 'Keine Kinder!',
  testtreegenerator101: 'Gespeicherte Generationsbaum-ID: {$generationTree->id}',
  testtreegenerator102: 'Baumdatenelemente:',
  testtreegenerator103: 'NEIN',

  // app\Console\Commands\TestTreeUpdate.php
  testtreeupdate23: 'Testbaumaktualisierung für ein Projekt',
  testtreeupdate32: '🌳 Testen der Baumaktualisierung für das Projekt {$projectId}',
  testtreeupdate37: 'Projekt {$projectId} nicht gefunden',
  testtreeupdate44: 'Baum mit ID gespeichert: {$tree->id}',
  testtreeupdate45: 'Baum hat',
  testtreeupdate48: 'Template: {$templateGroup[',
  testtreeupdate50: 'Dateien: {$fileCount}',

  // app\Http\Controllers\Admin\PageController.php
  pagecontroller50: 'Für die ausgewählte Sprache ist bereits eine Seite mit diesem Slug vorhanden.',
  pagecontroller89: 'Seite erfolgreich gelöscht.',

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller36: 'Projekt nicht gefunden',
  autotranslatecontroller41: 'Nicht autorisiert',
  autotranslatecontroller49: 'Der Google Translate API-Schlüssel ist für dieses Projekt nicht konfiguriert. Bitte fügen Sie Ihren API-Schlüssel unter Projekteinstellungen → Lokalisierungseinstellungen hinzu.',
  autotranslatecontroller57: 'Anfrage zur automatischen Übersetzung',
  autotranslatecontroller74: 'Google Translate API-Antwort',
  autotranslatecontroller83: 'Übersetzung fehlgeschlagen',
  autotranslatecontroller91: 'übersetzter Text',
  autotranslatecontroller94: 'übersetzter Text',
  autotranslatecontroller99: 'Keine Übersetzung zurückgegeben',
  autotranslatecontroller114: 'Übersetzung für alle Sprachen fehlgeschlagen',

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: 'Nicht autorisiert. Systemadministratorzugriff erforderlich.',
  languagecontroller102: 'Sprache erfolgreich gelöscht.',

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller155: 'Private Projekte sind nur für Premium-User verfügbar',
  projectcontroller187: 'd.m.Y',
  projectcontroller188: 'Sein',
  projectcontroller190: 'Europa/Wien',
  projectcontroller230: 'Nicht autorisiert',
  projectcontroller246: 'Nicht autorisiert',
  projectcontroller294: 'Nur der Projekteigentümer kann das Eigentum übertragen',
  projectcontroller300: 'Der neue Eigentümer muss ein Projektmitglied sein',
  projectcontroller361: 'Nicht autorisiert',
  projectcontroller367: 'Projekt erfolgreich gelöscht',
  projectcontroller377: 'Nicht autorisiert',
  projectcontroller382: 'Projekt endgültig gelöscht',
  projectcontroller392: 'Nicht autorisiert',
  projectcontroller397: 'Projekt erfolgreich wiederhergestellt',
  projectcontroller407: 'Nicht autorisiert',
  projectcontroller429: 'Nicht autorisiert',
  projectcontroller451: 'Nicht autorisiert',
  projectcontroller523: 'Nicht autorisiert',
  projectcontroller540: 'Manche Teams gehören nicht dir',
  projectcontroller556: 'Teams erfolgreich zugewiesen',
  projectcontroller566: 'Nicht autorisiert',
  projectcontroller571: 'Das Team gehört nicht dir',
  projectcontroller576: 'Das Team ist diesem Projekt nicht zugewiesen',
  projectcontroller582: 'Team erfolgreich aus dem Projekt entfernt',
  projectcontroller592: 'Nicht autorisiert',
  projectcontroller605: 'Schema nicht gefunden',
  projectcontroller610: 'Das Schema ist diesem Projekt bereits zugeordnet',
  projectcontroller616: 'Schema erfolgreich zugeordnet',
  projectcontroller626: 'Nicht autorisiert',
  projectcontroller631: 'Das Schema ist diesem Projekt nicht zugeordnet',
  projectcontroller637: 'Schemazuordnung erfolgreich entfernt',
  projectcontroller649: 'Projekt nicht gefunden',
  projectcontroller675: 'Projekt nicht gefunden',
  projectcontroller724: 'Projekt nicht gefunden',
  projectcontroller778: 'Unzureichende Berechtigungen',
  projectcontroller788: 'Der Benutzer ist kein Mitglied dieses Projekts',
  projectcontroller793: 'Projektbesitzer kann nicht entfernt werden',
  projectcontroller798: 'Nur der Projektbesitzer kann Administratoren entfernen',
  projectcontroller814: 'Mitglied erfolgreich aus dem Projekt und allen zugehörigen Teams entfernt',
  projectcontroller828: 'Nur der Projektbesitzer kann die Mitgliedsrollen ändern',
  projectcontroller839: 'Der Benutzer ist kein Mitglied dieses Projekts',
  projectcontroller844: 'Die Rolle des Eigentümers kann nicht geändert werden',
  projectcontroller849: 'Mitgliederrolle erfolgreich aktualisiert',
  projectcontroller861: 'Nicht autorisiert',
  projectcontroller876: 'Projekteinstellungen erfolgreich aktualisiert',
  projectcontroller890: 'Nicht autorisiert',
  projectcontroller907: 'Nicht autorisiert',
  projectcontroller1000: 'Nicht autorisiert',
  projectcontroller1026: 'Nicht autorisiert',
  projectcontroller1033: 'Generationsbaum erfolgreich regeneriert',

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php
  projectgenerationtreecontroller23: 'Für dieses Projekt wurde kein Generationsbaum gefunden',
  projectgenerationtreecontroller52: 'Fehlen ',
  projectgenerationtreecontroller61: 'Für dieses Projekt wurde kein Generationsbaum gefunden',

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller118: 'Schema nicht gefunden',
  schemacontroller139: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller173: '🚨 LÖSCHANFRAGE ERHALTEN',
  schemacontroller191: 'Nicht autorisiert, dieses Schema zu löschen',
  schemacontroller206: 'Das Schema wird von {$projectsCount} Projekten verwendet. Erzwingen Sie das Löschen, um fortzufahren.',
  schemacontroller215: '🗑️ Schemalöschung starten',
  schemacontroller226: '🔥 Präventive Entfernung der Projektzuordnung',
  schemacontroller228: '✅ Vorab entfernte {$deletedProjectAssociations}-Projektzuordnungen',
  schemacontroller233: '✅ Eloquente Trennung abgeschlossen',
  schemacontroller235: '⚠️ Eloquent-Ablösung fehlgeschlagen:',
  schemacontroller240: '🔥 Starte die Hauptlöschtransaktion für das Schema {$schema->id}',
  schemacontroller248: '🔍 Löschumfang',
  schemacontroller259: '✅ {$deletedReferenceColumns} Fremdschlüssel-Referenzspalten entfernt',
  schemacontroller264: '✅ {$deletedReferences} Fremdschlüsselreferenzen entfernt',
  schemacontroller269: '✅ {$deletedConstraintColumns} Einschränkungsspalten entfernt',
  schemacontroller274: '✅ {$deletedConstraints}-Einschränkungen entfernt',
  schemacontroller279: '✅ {$deletedFields} Schemafelder entfernt',
  schemacontroller284: '✅ {$deletedLayouts} Schema-Designer-Layouts entfernt',
  schemacontroller288: '✅ {$deletedTables} Schematabellen entfernt',
  schemacontroller293: '✅ {$deletedVersions} Schemaversionen entfernt',
  schemacontroller298: '🔍 Verbleibende Projektzuordnungen: {$remainingAssociations}',
  schemacontroller302: '✅ Verbleibende Projektzuordnungen zwangsweise entfernt',
  schemacontroller307: '✅ Schema selbst entfernt',
  schemacontroller310: '🎉 Schemalöschung erfolgreich abgeschlossen',
  schemacontroller316: 'Schema und alle zugehörigen Daten erfolgreich gelöscht',
  schemacontroller323: '❌ Schemalöschung fehlgeschlagen',
  schemacontroller330: 'Schema konnte nicht gelöscht werden',
  schemacontroller345: 'Projekt nicht gefunden',
  schemacontroller372: 'Schema nicht gefunden',
  schemacontroller393: 'Schemaversion nicht gefunden',
  schemacontroller431: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller450: 'Layout erfolgreich gespeichert',
  schemacontroller452: 'Fehler beim Speichern des Layouts:',
  schemacontroller453: 'Stapelüberwachung:',
  schemacontroller455: 'Das Speichern des Layouts ist fehlgeschlagen.',
  schemacontroller470: 'Schema nicht gefunden',
  schemacontroller489: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller514: 'CreateTable-Anforderungsdaten:',
  schemacontroller617: 'Tabelle erfolgreich erstellt',
  schemacontroller622: 'CreateTable-Ausnahme:',
  schemacontroller651: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller657: 'Die Tabelle gehört nicht zu dieser Schemaversion',
  schemacontroller684: 'UpdateTable-Anforderungsdaten:',
  schemacontroller804: 'Tabelle erfolgreich aktualisiert',
  schemacontroller810: 'Tabelle konnte nicht aktualisiert werden',
  schemacontroller827: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller833: 'Die Tabelle gehört nicht zu dieser Schemaversion',
  schemacontroller840: 'Tabelle erfolgreich gelöscht',
  schemacontroller854: '🚨 DEBUG DER ROUTENMODELLBINDUNG: Methodeneintrag',
  schemacontroller880: 'Diese Aktion erfordert ein Floating-Schema',
  schemacontroller885: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller890: 'Die Tabelle gehört nicht zu dieser Schemaversion',
  schemacontroller894: '🔍 API-Aufruf: deleteTableWithVersionCopy',
  schemacontroller911: '🔍 KRITISCHE ÜBERPRÜFUNG: Überprüfung des Tabellenbesitzes',
  schemacontroller924: '🔍 DOPPELPRÜFUNG: Tabellensuche nach ID in der Version',
  schemacontroller935: 'Tabellenlöschung: {$table->table_name}',
  schemacontroller938: '✅ Neue Version erstellt',
  schemacontroller944: '🔍 VORHER: Suche nach einer Tabelle zum Löschen in der neuen Version',
  schemacontroller953: '🔍 NACHHER: Tabellensuchergebnis in der neuen Version',
  schemacontroller966: '❌ Tabelle in neuer Version nicht gefunden',
  schemacontroller970: 'nicht in der neuen Version {$newVersion->version_number} gefunden',
  schemacontroller974: '🗑️ LÖSCHEN STEHT VOR: Letzte Bestätigung vor dem Löschen',
  schemacontroller990: '🗑️ Tabellenbeziehungen vor dem Löschen',
  schemacontroller999: '✅ Tabellenlöschung abgeschlossen',
  schemacontroller1006: '✅ Tabelle erfolgreich aus neuer Version gelöscht',
  schemacontroller1010: 'Neue Version erstellt und Tabelle gelöscht',
  schemacontroller1030: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller1048: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller1087: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller1110: 'Neue Tabelle: {$request->table_name}',
  schemacontroller1116: 'Neue Tabelle: {$request->table_name}',
  schemacontroller1125: 'Eine Tabelle mit diesem Namen existiert bereits in dieser Schemaversion',
  schemacontroller1126: 'existiert bereits',
  schemacontroller1158: 'Neue Version mit Tabelle erfolgreich erstellt',
  schemacontroller1165: 'Version und Tabelle konnten nicht erstellt werden',
  schemacontroller1182: 'Schemaversion nicht gefunden',
  schemacontroller1249: 'Diese Aktion erfordert ein Floating-Schema',
  schemacontroller1256: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller1261: 'Mit diesem Endpunkt können nur Fremdschlüsseleinschränkungen gelöscht werden',
  schemacontroller1278: 'FK löschen: {$constraint->constraint_name}',
  schemacontroller1284: 'Tabelle in neuer Version konnte nicht gefunden werden',
  schemacontroller1293: 'In der neuen Version konnte keine Einschränkung gefunden werden.',
  schemacontroller1301: 'Neue Version erstellt und Fremdschlüssel gelöscht',
  schemacontroller1314: 'Fremdschlüssel erfolgreich gelöscht',
  schemacontroller1320: 'Einschränkung nicht gefunden',
  schemacontroller1322: 'FK-Löschfehler:',
  schemacontroller1328: 'Fremdschlüssel konnte nicht gelöscht werden',
  schemacontroller1358: 'Diese Aktion erfordert ein Floating-Schema',
  schemacontroller1365: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller1370: 'Mit diesem Endpunkt können nur Fremdschlüsseleinschränkungen aktualisiert werden',
  schemacontroller1381: 'FK aktualisieren: {$constraint->constraint_name}',
  schemacontroller1387: 'Tabelle in neuer Version konnte nicht gefunden werden',
  schemacontroller1396: 'In der neuen Version konnte keine Einschränkung gefunden werden.',
  schemacontroller1404: 'Neue Version erstellt und Fremdschlüssel aktualisiert',
  schemacontroller1416: 'Fremdschlüssel erfolgreich aktualisiert',
  schemacontroller1422: 'Validierung fehlgeschlagen',
  schemacontroller1426: 'Einschränkung nicht gefunden',
  schemacontroller1428: 'Update FK-Fehler:',
  schemacontroller1434: 'Aktualisierung des Fremdschlüssels fehlgeschlagen',
  schemacontroller1461: 'Diese Aktion erfordert ein Floating-Schema',
  schemacontroller1468: 'Nicht berechtigt, dieses Schema zu bearbeiten',
  schemacontroller1479: 'Erstellen Sie FK auf {$table->table_name}',
  schemacontroller1485: 'Tabelle in neuer Version konnte nicht gefunden werden',
  schemacontroller1493: 'Neue Version erstellt und Fremdschlüssel erstellt',
  schemacontroller1505: 'Fremdschlüssel erfolgreich erstellt',
  schemacontroller1511: 'Validierung fehlgeschlagen',
  schemacontroller1515: 'Tabelle nicht gefunden',
  schemacontroller1517: 'FK-Fehler erstellen:',
  schemacontroller1523: 'Fremdschlüssel konnte nicht erstellt werden',

  // app\Http\Controllers\Api\SchemaTranslationController.php
  schematranslationcontroller71: 'Für diesen Artikel und diese Sprache ist bereits eine Übersetzung vorhanden.',
  schematranslationcontroller102: 'Für diesen Artikel und diese Sprache ist bereits eine Übersetzung vorhanden.',
  schematranslationcontroller115: 'Übersetzung erfolgreich gelöscht.',
  schematranslationcontroller144: 'Projekt nicht gefunden oder Zugriff verweigert',
  schematranslationcontroller188: 'Unbekannt',
  schematranslationcontroller263: 'Übersetzungen erfolgreich aktualisiert.',

  // app\Http\Controllers\Api\SettingsController.php
  settingscontroller16: 'Nicht autorisiert. Systemadministratorzugriff erforderlich.',
  settingscontroller49: 'Einstellungen erfolgreich aktualisiert',

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller29: 'Nicht autorisiert',
  templatecontroller92: 'Nicht autorisierter Zugriff auf dieses Projekt',
  templatecontroller96: 'Dieses Template kann nicht verwendet werden',
  templatecontroller101: 'Das Template wird bereits von diesem Projekt verwendet',
  templatecontroller108: 'Template erfolgreich verknüpft',
  templatecontroller129: 'Der Templatenname muss aus Kleinbuchstaben bestehen',
  templatecontroller141: 'Nicht autorisierter Zugriff auf dieses Projekt',
  templatecontroller145: 'Dieses Template kann nicht geklont werden',
  templatecontroller156: 'Template erfolgreich geklont',
  templatecontroller170: 'Nicht autorisiert',
  templatecontroller245: 'Nicht autorisierter Zugriff auf dieses Projekt',
  templatecontroller268: '{$assignedCount} Template(s) erfolgreich dem Projekt zugewiesen',
  templatecontroller288: 'Projekt nicht gefunden',
  templatecontroller292: 'Template nicht gefunden',
  templatecontroller297: 'Nicht autorisierter Zugriff auf dieses Projekt',
  templatecontroller307: 'Dieses Template ist diesem Projekt nicht zugewiesen',
  templatecontroller314: 'Template erfolgreich aus dem Projekt entfernt',
  templatecontroller333: 'Nicht autorisiert',
  templatecontroller338: 'Templatenverwendung erfolgreich entfernt',
  templatecontroller422: 'Nicht autorisiert',
  templatecontroller437: 'Nicht autorisiert',
  templatecontroller522: 'System-Templates können nicht gelöscht werden',
  templatecontroller524: 'Public Templates anderer Benutzer können nicht gelöscht werden',
  templatecontroller526: 'Sie haben keine Berechtigung',
  templatecontroller537: 'Template erfolgreich gelöscht',
  templatecontroller550: 'System-Templates können nicht permanent gelöscht werden',
  templatecontroller552: 'Public Templates anderer Benutzer können nicht permanent gelöscht werden',
  templatecontroller554: 'Sie haben keine Berechtigung',
  templatecontroller567: 'Template endgültig gelöscht',
  templatecontroller580: 'System-Templates können nicht aktiviert/deaktiviert werden',
  templatecontroller582: 'Public Templates anderer Benutzer können nicht geändert werden',
  templatecontroller584: 'Sie haben keine Berechtigung',
  templatecontroller591: 'Template erfolgreich deaktiviert',
  templatecontroller620: 'Sie haben keine Berechtigung',
  templatecontroller649: 'Template erfolgreich geklont',
  templatecontroller682: 'Sie haben keine Berechtigung',
  templatecontroller717: 'Das Laden der Templateabhängigkeiten ist fehlgeschlagen',
  templatecontroller731: 'Sie haben keine Berechtigung',
  templatecontroller741: 'Validierung für das Hinzufügen einer DB-Schemaabhängigkeit fehlgeschlagen',
  templatecontroller749: 'Validierung fehlgeschlagen',
  templatecontroller763: 'Diese Abhängigkeit existiert bereits',
  templatecontroller777: 'DB Schema Abhängigkeit erfolgreich hinzugefügt',
  templatecontroller781: 'Fehler beim Hinzufügen der DB-Schemaabhängigkeit:',
  templatecontroller789: 'Abhängigkeit konnte nicht hinzugefügt werden:',
  templatecontroller803: 'Sie haben keine Berechtigung',
  templatecontroller814: 'Abhängigkeit nicht gefunden',
  templatecontroller822: 'DB Schema Abhängigkeit erfolgreich entfernt',
  templatecontroller827: 'Die Abhängigkeit konnte nicht entfernt werden',
  templatecontroller841: 'Nicht autorisiert',
  templatecontroller856: 'Nicht autorisiert',
  templatecontroller892: 'Nicht autorisiert',
  templatecontroller927: 'Nicht autorisiert',
  templatecontroller936: 'Datei erfolgreich gelöscht',
  templatecontroller944: '🧪 [API-TEMPLATE-QUEUE] Job-Versand für Template {$template->id} ({$template->name}) wird gestartet',
  templatecontroller954: '🧪 [API-TEMPLATE-QUEUE] Gefundene Projekt-IDs:',
  templatecontroller957: '🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: Noch keine Projekte, die dieses Template verwenden',
  templatecontroller961: '🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: Regeneration wird versendet für',
  templatecontroller965: '🧪 [API-TEMPLATE-QUEUE] Jobs in der Warteschlange vor dem Versand: {$jobsBefore}',
  templatecontroller970: '🧪 [API-TEMPLATE-QUEUE] Versenden des RegenerateProjectGenerationTree-Jobs für das Projekt {$projectId}',
  templatecontroller975: '🧪 [API-TEMPLATE-QUEUE] Auftrag für Projekt {$projectId} erfolgreich versendet',
  templatecontroller977: '🧪 [API-TEMPLATE-QUEUE] Job für Projekt {$projectId} konnte nicht versendet werden:',
  templatecontroller983: '🧪 [API-TEMPLATE-QUEUE] Jobs in der Warteschlange nach dem Versand: {$jobsAfter}',
  templatecontroller984: '🧪 [API-TEMPLATE-QUEUE] Gesamtzahl der versendeten Jobs: {$dispatchedJobs}',
  templatecontroller985: '🧪 [API-TEMPLATE-QUEUE] Auftragsversand für Template {$template->id} abgeschlossen',

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller30: 'Projekt-ID erforderlich',
  translationexportcontroller34: 'Mindestens eine Sprache erforderlich',
  translationexportcontroller48: 'Übersetzungen',
  translationexportcontroller51: 'Feld',
  translationexportcontroller78: 'Tisch',
  translationexportcontroller103: 'Feld',
  translationexportcontroller131: 'J-m-t_H-i-s',
  translationexportcontroller175: 'Import-Header:',
  translationexportcontroller197: 'Zu importierende Sprachspalten:',
  translationexportcontroller223: 'Vorhandene Tabellen:',
  translationexportcontroller224: 'Vorhandene Felder:',
  translationexportcontroller273: 'Übersprungenes Element',
  translationexportcontroller278: 'Zeile {$row} wird verarbeitet: Typ={$type}',
  translationexportcontroller312: 'Import erfolgreich! {$imported} neue Übersetzungen importiert',
  translationexportcontroller331: 'Fehler beim Importieren der Übersetzung:',
  translationexportcontroller339: 'Import fehlgeschlagen: ',

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller42: 'Template nicht gefunden',
  ultimatetemplatecontroller55: '🚀 Hauptprozessvorlage: templateId=$templateId',
  ultimatetemplatecontroller102: 'Die Verarbeitung der ultimativen Template ist fehlgeschlagen',
  ultimatetemplatecontroller151: 'constraints.constraintColumns.field',
  ultimatetemplatecontroller165: 'constraints.constraintColumns.field',
  ultimatetemplatecontroller174: 'Demo-Schema',
  ultimatetemplatecontroller177: 'Demo-Datenbankschema',
  ultimatetemplatecontroller196: '🌍 Sprachen-Debug: Gefunden',
  ultimatetemplatecontroller216: 'Demo-Projekt',
  ultimatetemplatecontroller241: 'Ultimative Scoriet-Template-Engine',
  ultimatetemplatecontroller270: 'J-m-t H:i:s',
  ultimatetemplatecontroller271: 'J-m-t H:i:s',
  ultimatetemplatecontroller272: 'Demo-Benutzer',
  ultimatetemplatecontroller274: 'Demo-Score-Projekt',
  ultimatetemplatecontroller295: 'Allgemein',
  ultimatetemplatecontroller300: 'J-m-t H:i:s',
  ultimatetemplatecontroller301: 'System',
  ultimatetemplatecontroller308: 'd.m.Y',
  ultimatetemplatecontroller309: 'Sein',
  ultimatetemplatecontroller311: 'Europa/Wien',
  ultimatetemplatecontroller359: 'PK nicht in Einschränkungen für {$tableName} gefunden',
  ultimatetemplatecontroller535: 'PK nicht in Einschränkungen für {$tableName} gefunden',
  ultimatetemplatecontroller563: '🐛 Extrahierte Einschränkungsfelder für {$tableName}',
  ultimatetemplatecontroller770: 'J-m-t',
  ultimatetemplatecontroller771: 'Sein',
  ultimatetemplatecontroller772: 'J-m-t_H-i-s',
  ultimatetemplatecontroller804: '🔧 Backend-Debug: Parameter „tableName“ empfangen:',
  ultimatetemplatecontroller815: '🔧 Backend-Debug: Gtree-Anzahl:',
  ultimatetemplatecontroller825: '🔧 Backend-Debug: Tabelle bei Index $index gefunden:',
  ultimatetemplatecontroller833: '🔧 Backend-Debug: Kein tableName-Parameter angegeben',
  ultimatetemplatecontroller879: '// Generierte Dateien',
  ultimatetemplatecontroller881: '// Datei: {$file[',

  // app\Http\Controllers\AuthController.php
  authcontroller42: 'Diese E-Mail-Adresse ist bereits registriert. Möchten Sie sich einloggen?',
  authcontroller44: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  authcontroller48: 'Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen.',
  authcontroller50: 'Der Benutzername darf nur Kleinbuchstaben',
  authcontroller54: 'Die Passwörter stimmen nicht überein.',
  authcontroller56: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  authcontroller59: 'Bitte geben Sie Ihren Namen ein.',
  authcontroller61: 'Bitte überprüfen Sie Ihre Eingaben.',
  authcontroller83: 'Registrierung mit Einladungstoken',
  authcontroller100: 'Ausstehende Einladung zur Registrierung gefunden',
  authcontroller124: 'Fehler beim Senden der Administratorbenachrichtigung:',
  authcontroller128: 'Benutzer erfolgreich registriert. Bitte überprüfen Sie Ihre E-Mail für den Bestätigungslink.',
  authcontroller147: 'Validierungsfehler',
  authcontroller156: 'Login fehlgeschlagen',
  authcontroller165: 'E-Mail-Adresse muss vor dem Login bestätigt werden',
  authcontroller183: 'Persönlicher Zugriffstoken',
  authcontroller190: 'Login erfolgreich',
  authcontroller209: 'E-Mail-Adresse nicht gefunden',
  authcontroller220: 'Reset-Link wurde gesendet',
  authcontroller225: 'Fehler beim Senden des Reset-Links',
  authcontroller242: 'Validierungsfehler',
  authcontroller260: 'Passwort erfolgreich zurückgesetzt',
  authcontroller265: 'Fehler beim Zurücksetzen des Passworts',
  authcontroller292: 'Validierungsfehler',
  authcontroller310: 'Profil erfolgreich aktualisiert',
  authcontroller329: 'Validierungsfehler',
  authcontroller337: 'Das aktuelle Passwort ist nicht korrekt',
  authcontroller346: 'Passwort erfolgreich geändert',
  authcontroller359: 'Ungültiger Bestätigungslink. Der Benutzer existiert nicht oder wurde gelöscht.',
  authcontroller367: 'Ungültiger Bestätigungslink. Der Link ist abgelaufen oder wurde manipuliert.',
  authcontroller374: 'Persönlicher Zugriffstoken',
  authcontroller378: 'E-Mail-Adresse bereits bestätigt',
  authcontroller389: 'Persönlicher Zugriffstoken',
  authcontroller401: 'Automatische Annahme der Einladung nach E-Mail-Verifizierung',
  authcontroller412: 'Einladung erfolgreich automatisch angenommen',
  authcontroller418: 'E-Mail-Adresse erfolgreich bestätigt',
  authcontroller429: 'E-Mail-Bestätigungsfehler',
  authcontroller442: 'E-Mail-Adresse bereits bestätigt',
  authcontroller449: 'Bestätigungs-E-Mail wurde erneut gesendet',
  authcontroller466: 'Validierungsfehler',
  authcontroller474: 'Das eingegebene Passwort ist nicht korrekt',
  authcontroller488: 'Ihr Account wurde erfolgreich gelöscht',
  authcontroller492: 'Fehler beim Löschen des Accounts',
  authcontroller506: 'Erfolgreich abgemeldet',
  authcontroller521: 'Ungültige Sprachauswahl',
  authcontroller532: 'Spracheinstellung erfolgreich aktualisiert',
  authcontroller537: 'Aktualisierung der Spracheinstellung fehlgeschlagen',

  // app\Http\Controllers\Auth\PasswordResetLinkController.php
  passwordresetlinkcontroller39: 'Wenn das Konto existiert, wird ein Link zum Zurücksetzen gesendet.',

  // app\Http\Controllers\CustomTokenController.php
  customtokencontroller51: 'Die angegebenen Anmeldeinformationen sind falsch.',
  customtokencontroller58: 'E-Mail-Adresse muss vor dem Login bestätigt werden',
  customtokencontroller71: 'Die angegebenen Anmeldeinformationen sind falsch.',
  customtokencontroller98: 'OAuth-Token-Fehler:',
  customtokencontroller101: 'Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten.',

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller59: 'neuesteVersion',
  dbschemacontroller66: 'Zugriff auf dieses Schema verweigert',
  dbschemacontroller77: 'Schema nicht gefunden',
  dbschemacontroller95: 'Zugriff auf dieses Schema verweigert',
  dbschemacontroller111: 'Schema nicht gefunden',
  dbschemacontroller129: 'Zugriff auf dieses Schema verweigert',
  dbschemacontroller145: 'Sie können diese Template nicht bearbeiten',
  dbschemacontroller157: 'Die Template ist bereits mit diesem DB-Schema verknüpft',
  dbschemacontroller171: 'Template erfolgreich mit DB-Schema verknüpft',
  dbschemacontroller195: 'Sie können diese Template nicht bearbeiten',
  dbschemacontroller207: 'Template erfolgreich vom DB-Schema getrennt',
  dbschemacontroller212: 'Abhängigkeit nicht gefunden',
  dbschemacontroller223: 'neuesteVersion',
  dbschemacontroller256: 'Sie können nur Ihre eigenen Schemata kopieren',
  dbschemacontroller264: 'Ein leeres Schema kann nicht kopiert werden. Das Quellschema muss mindestens eine Version mit Tabellen haben.',
  dbschemacontroller281: 'Sie haben bereits ein Schema mit diesem Namen. Bitte wählen Sie einen anderen Namen.',
  dbschemacontroller288: '(Kopie)',
  dbschemacontroller305: 'Das Quellschema verfügt über keine gültigen Versionen zum Kopieren',
  dbschemacontroller310: 'Tabellen.Einschränkungen.Fremdschlüsselreferenz.Referenzspalten',
  dbschemacontroller317: 'Kopiert von',
  dbschemacontroller332: 'Neue Schema-ID ist nicht festgelegt',
  dbschemacontroller335: 'Die neue Versions-ID ist nicht festgelegt',
  dbschemacontroller460: 'Datenbankschema erfolgreich kopiert',
  dbschemacontroller472: 'Schema konnte nicht kopiert werden:',

  // app\Http\Controllers\PageController.php
  pagecontroller43: 'Hilfeseite für Gebietsschema nicht gefunden: {$locale}',
  pagecontroller46: 'CMSSeite',
  pagecontroller67: 'Impressumsseite für Gebietsschema nicht gefunden: {$locale}',
  pagecontroller70: 'CMSSeite',

  // app\Http\Controllers\ProjectApplicationController.php
  projectapplicationcontroller24: 'Validierungsfehler',
  projectapplicationcontroller36: 'Ungültiger Join-Code oder Bewerbungen nicht erlaubt',
  projectapplicationcontroller49: 'Sie haben bereits eine Bewerbung für dieses Projekt eingereicht',
  projectapplicationcontroller64: 'Bewerbung erfolgreich eingereicht',
  projectapplicationcontroller85: 'Keine Berechtigung',
  projectapplicationcontroller106: '=== ReviewApplication METHODE AUFGERUFEN ===',
  projectapplicationcontroller118: 'ReviewApplication: Validierung fehlgeschlagen',
  projectapplicationcontroller120: 'Validierungsfehler',
  projectapplicationcontroller130: 'Anwendungs-ID',
  projectapplicationcontroller131: 'Anwendung nicht gefunden',
  projectapplicationcontroller137: 'ReviewApplication Debug',
  projectapplicationcontroller153: 'ReviewApplication: Berechtigung verweigert',
  projectapplicationcontroller158: 'Keine Berechtigung - Du bist nicht der Projekt-Owner',
  projectapplicationcontroller164: 'ReviewApplication: Bereits geprüft',
  projectapplicationcontroller166: 'Diese Bewerbung wurde bereits bearbeitet',
  projectapplicationcontroller173: 'Bewerbung wurde angenommen',
  projectapplicationcontroller176: 'Bewerbung wurde abgelehnt',
  projectapplicationcontroller179: 'ReviewApplication: Erfolg',
  projectapplicationcontroller210: 'ProjectApplicationController: getProjectByJoinCode aufgerufen',
  projectapplicationcontroller211: 'JoinCode',
  projectapplicationcontroller220: 'ProjectApplicationController: Ergebnis der Projektsuche',
  projectapplicationcontroller221: 'JoinCode',
  projectapplicationcontroller231: 'Ungültiger Join-Code. Bitte überprüfen Sie den Code.',
  projectapplicationcontroller237: 'Dieses Projekt ist nicht mehr aktiv.',
  projectapplicationcontroller243: 'Dieses Projekt akzeptiert derzeit keine Beitrittsanfragen.',

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller26: 'Nicht autorisiert',
  projectinvitationcontroller37: 'Validierung fehlgeschlagen',
  projectinvitationcontroller50: 'Der Benutzer ist bereits Mitglied dieses Projekts',
  projectinvitationcontroller61: 'An diese E-Mail-Adresse wurde bereits eine Einladung gesendet',
  projectinvitationcontroller80: 'E-Mail mit der Projekteinladung konnte nicht gesendet werden',
  projectinvitationcontroller88: 'Einladung erfolgreich versendet',
  projectinvitationcontroller89: 'eingeladener Benutzer',
  projectinvitationcontroller103: 'Ungültiges Einladungstoken',
  projectinvitationcontroller107: 'Diese Einladung ist abgelaufen',
  projectinvitationcontroller112: 'Diese Einladung wurde bereits angenommen',
  projectinvitationcontroller113: 'Diese Einladung wurde bereits abgelehnt',
  projectinvitationcontroller114: 'Diese Einladung ist abgelaufen',
  projectinvitationcontroller115: 'Diese Einladung ist nicht mehr gültig',
  projectinvitationcontroller138: 'Ungültiges Einladungstoken',
  projectinvitationcontroller143: 'Die Einladung ist nicht mehr gültig',
  projectinvitationcontroller150: 'Einladung konnte nicht angenommen werden',
  projectinvitationcontroller154: 'Einladung erfolgreich angenommen',
  projectinvitationcontroller167: 'Ungültiges Einladungstoken',
  projectinvitationcontroller172: 'Die Einladung ist nicht mehr gültig',
  projectinvitationcontroller179: 'Einladung konnte nicht abgelehnt werden',
  projectinvitationcontroller187: 'E-Mail zur Ablehnungsbenachrichtigung konnte nicht gesendet werden',
  projectinvitationcontroller194: 'Einladung erfolgreich abgelehnt',
  projectinvitationcontroller206: 'Nicht autorisiert',
  projectinvitationcontroller210: 'eingeladener Benutzer',
  projectinvitationcontroller240: '=== Einladungsanfrage stornieren ===',
  projectinvitationcontroller250: 'Einladung stornieren: Nicht autorisiert',
  projectinvitationcontroller254: 'Nicht autorisiert',
  projectinvitationcontroller258: 'Einladung stornieren: Falsches Projekt',
  projectinvitationcontroller262: 'Die Einladung gehört nicht zu diesem Projekt',
  projectinvitationcontroller266: 'Einladung stornieren: Nicht ausstehend',
  projectinvitationcontroller269: 'Kann nur ausstehende Einladungen stornieren',
  projectinvitationcontroller273: 'Einladung erfolgreich storniert',
  projectinvitationcontroller275: 'Einladung erfolgreich storniert',
  projectinvitationcontroller286: 'Keine ausstehende Einladung',
  projectinvitationcontroller296: 'Keine ausstehende Einladung',
  projectinvitationcontroller310: 'Keine ausstehende Einladung',
  projectinvitationcontroller316: 'Keine ausstehende Einladung',
  projectinvitationcontroller323: 'Einladung konnte nicht angenommen werden',
  projectinvitationcontroller330: 'Einladung erfolgreich angenommen',
  projectinvitationcontroller343: 'Keine ausstehende Einladung',
  projectinvitationcontroller349: 'Keine ausstehende Einladung',
  projectinvitationcontroller358: 'Einladung abgelehnt',

  // app\Http\Controllers\QueueTestController.php
  queuetestcontroller61: '🧪 [TEST] Job-Dispatch-Test starten',
  queuetestcontroller65: 'Kein Projekt gefunden',
  queuetestcontroller69: '🧪 [TEST] Jobs vor dem Versand: {$jobsBefore}',
  queuetestcontroller77: '🧪 [TEST] Jobs nach dem Versand: {$jobsAfter}',
  queuetestcontroller86: 'Jobversand fehlgeschlagen',
  queuetestcontroller89: '🧪 [TEST] Auftragsversand fehlgeschlagen:',
  queuetestcontroller102: '🧪 [TEST] Test zur Erstellung einer Schemaversion wird gestartet',
  queuetestcontroller106: 'Kein Schema gefunden',
  queuetestcontroller116: 'Das Schema ist mit keinem Projekt verbunden',
  queuetestcontroller117: 'Verbinden Sie das Schema zunächst mithilfe der Tabelle „project_schemas“ mit einem Projekt.',
  queuetestcontroller122: '🧪 [TEST] Jobs vor der Erstellung der Schemaversion: {$jobsBefore}',
  queuetestcontroller126: 'Testversion zum Warteschlangentest',
  queuetestcontroller127: '🧪 [TEST] Schemaversion erstellt: {$version->id}',
  queuetestcontroller130: '🧪 [TEST] Jobs nach Schemaversionserstellung: {$jobsAfter}',
  queuetestcontroller142: 'Keine Aufträge versandt',
  queuetestcontroller145: '🧪 [TEST] Erstellung der Schemaversion fehlgeschlagen:',
  queuetestcontroller162: 'Projekt nicht gefunden',
  queuetestcontroller173: '🧪 [MANUELL] Manuell versandter Auftrag für Projekt {$projectId}',
  queuetestcontroller181: 'Der Auftrag wurde manuell erfolgreich versandt',
  queuetestcontroller201: 'Protokolldatei nicht gefunden',
  queuetestcontroller211: '🧪 [QUEUE-TEST]',
  queuetestcontroller212: '🧪 [TEST]',
  queuetestcontroller213: '🧪 [HANDBUCH]',

  // app\Http\Controllers\SchemaController.php
  schemacontroller21: 'templateDependencies.template',
  schemacontroller64: 'templateDependencies.template',
  schemacontroller71: 'Zugriff auf dieses Schema verweigert',
  schemacontroller82: 'Schema nicht gefunden',
  schemacontroller105: 'Sie benötigen ein Premium-Konto, um private Schemata zu erstellen',
  schemacontroller117: 'Sie haben bereits ein Schema mit diesem Namen',
  schemacontroller132: 'Schema erfolgreich erstellt',
  schemacontroller155: 'Sie können nur Ihre eigenen Schemata bearbeiten',
  schemacontroller169: 'Sie benötigen ein Premium-Konto, um Schemata privat zu machen',
  schemacontroller183: 'Sie haben bereits ein Schema mit diesem Namen',
  schemacontroller193: 'Schema erfolgreich aktualisiert',
  schemacontroller216: 'Sie können nur Ihre eigenen Schemata löschen',
  schemacontroller225: 'Schema kann nicht gelöscht werden. Es wird von {$dependentTemplates} Template(n) verwendet.',
  schemacontroller234: 'Schema erfolgreich gelöscht',
  schemacontroller256: 'Zugriff auf dieses Schema verweigert',
  schemacontroller272: 'Schema nicht gefunden',
  schemacontroller290: 'Zugriff auf dieses Schema verweigert',
  schemacontroller306: 'Sie können diese Template nicht bearbeiten',
  schemacontroller318: 'Die Template ist bereits mit diesem Schema verknüpft.',
  schemacontroller332: 'Template erfolgreich mit Schema verknüpft',
  schemacontroller356: 'Sie können diese Template nicht bearbeiten',
  schemacontroller368: 'Die Verknüpfung der Template mit dem Schema wurde erfolgreich aufgehoben.',
  schemacontroller373: 'Abhängigkeit nicht gefunden',
  schemacontroller384: 'templateDependencies.template',

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller31: 'Zugriff auf dieses Schema verweigert',
  schemaexportcontroller56: 'Für dieses Schema wurde keine Version gefunden',
  schemaexportcontroller66: 'constraints.constraintColumns.field',
  schemaexportcontroller67: 'constraints.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller125: 'Export fehlgeschlagen:',
  schemaexportcontroller144: 'Zugriff auf dieses Schema verweigert',
  schemaexportcontroller169: 'Für dieses Schema wurde keine Version gefunden',
  schemaexportcontroller178: 'constraints.constraintColumns.field',
  schemaexportcontroller179: 'constraints.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller193: 'In diesem Schema wurden keine Tabellen gefunden',
  schemaexportcontroller213: 'MySQL-Export fehlgeschlagen:',
  schemaexportcontroller224: '- MySQL-Datenbankexport',
  schemaexportcontroller225: '-- Schema:',
  schemaexportcontroller226: 'Keine Beschreibung',
  schemaexportcontroller227: '-- Version:',
  schemaexportcontroller228: '-- Generiert:',
  schemaexportcontroller229: '-- Tischanzahl:',
  schemaexportcontroller237: '-- Tisch: ',
  schemaexportcontroller239: '-- Kommentar: ',
  schemaexportcontroller272: ' KOMMENTAR',
  schemaexportcontroller283: 'Verarbeitungsbeschränkungen für Tabelle: {$table->table_name}',
  schemaexportcontroller284: 'Anzahl der Einschränkungen:',
  schemaexportcontroller286: 'Einschränkung: {$constraint->constraint_name} (Typ: {$constraint->constraint_type})',
  schemaexportcontroller287: 'Anzahl der ConstraintColumns:',
  schemaexportcontroller293: 'PRIMÄR',
  schemaexportcontroller339: 'BEIM LÖSCHEN',
  schemaexportcontroller358: ' KOMMENTAR',
  schemaexportcontroller367: '-- Export erfolgreich abgeschlossen',
  schemaexportcontroller368: '-- Gesamtzahl der exportierten Tabellen:',
  schemaexportcontroller386: 'Zugriff auf dieses Schema verweigert',
  schemaexportcontroller402: 'Tabellenanzahl konnte nicht abgerufen werden:',
  schemaexportcontroller418: 'Schema nicht gefunden',
  schemaexportcontroller437: 'Für dieses Schema wurde keine Version gefunden',
  schemaexportcontroller447: 'constraints.constraintColumns.field',
  schemaexportcontroller448: 'constraints.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller471: 'Untersuchung von Schemabeziehungen - DEEP DIVE',
  schemaexportcontroller483: 'Schema → Schemaversionen → Schematabellen (über Schemaversions-ID)',
  schemaexportcontroller484: 'NULL (wird in diesem System nicht verwendet)',
  schemaexportcontroller489: 'Debuggen fehlgeschlagen:',

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: 'SQL-Skript ist erforderlich',
  sqlparsercontroller72: 'SQL-Skript ist erforderlich',
  sqlparsercontroller79: 'Schema-ID ist erforderlich',
  sqlparsercontroller89: 'Schema nicht gefunden',
  sqlparsercontroller98: 'Sie haben keine Berechtigung, dieses Schema zu bearbeiten',
  sqlparsercontroller151: 'SQL-Import fehlgeschlagen',
  sqlparsercontroller165: 'Syntaxfehler',
  sqlparsercontroller166: 'Bitte überprüfen Sie Ihre SQL-Syntax auf fehlende Semikolons',
  sqlparsercontroller171: 'Nicht unterstützte Funktion',
  sqlparsercontroller172: 'Diese SQL-Funktion wird von unserem Parser noch nicht unterstützt. Versuchen Sie, Ihr SQL zu vereinfachen.',
  sqlparsercontroller177: 'Tabellen-/Spaltenfehler',
  sqlparsercontroller178: 'Bitte überprüfen Sie die Tabellen- und Spaltendefinitionen auf korrekte Syntax.',
  sqlparsercontroller182: 'Analysefehler',
  sqlparsercontroller183: 'Bitte überprüfen Sie Ihr SQL auf häufige Probleme wie fehlende Semikolons',
  sqlparsercontroller236: '🐛 Breaking Change-Debugging',
  sqlparsercontroller262: '🐛 Nach der Systemtabellenfilterung',
  sqlparsercontroller277: '🐛 Fehlermeldung debuggen',
  sqlparsercontroller278: 'GeschäftExistingTables',
  sqlparsercontroller279: 'GeschäftNeueTische',
  sqlparsercontroller280: 'Bestandsanzahl',
  sqlparsercontroller281: 'newBusinessCount',
  sqlparsercontroller282: 'businessExistingTables_type',
  sqlparsercontroller283: 'businessNewTables_type',
  sqlparsercontroller294: '🛡️ WICHTIGE ÄNDERUNG ERKANNT: Dieser SQL-Import würde eine völlig neue Datenbankstruktur ohne Tabellenüberlappung erstellen.',
  sqlparsercontroller295: 'Die aktuelle Version hat {$existingBusinessCount} Geschäftstabellen: {$existingTablesList}',
  sqlparsercontroller296: 'Neuer Import enthält {$newBusinessCount} Geschäftstabellen: {$newTablesList}',
  sqlparsercontroller297: '🚨 Für die Datensicherheit',
  sqlparsercontroller298: '✅ Lösung: Erstellen Sie eine neue Datenbank/ein neues Schema für diese Struktur, anstatt die vorhandene zu versionieren.',
  sqlparsercontroller299: '✅ Alternative: Stellen Sie sicher, dass mindestens ein Geschäftstabellenname zwischen den Versionen übereinstimmt.',
  sqlparsercontroller303: '✅ Validierung der Breaking Changes bestanden',
  sqlparsercontroller320: 'Schemaversion nicht gefunden',
  sqlparsercontroller361: 'Schemaversion nicht gefunden',
  sqlparsercontroller395: 'SQL-Skript ist erforderlich',
  sqlparsercontroller405: 'SQL erfolgreich analysiert',
  sqlparsercontroller430: '🧪 [QUEUE-TEST] Job-Verteilung für Schema {$schema->id} ({$schema->name}) wird gestartet',
  sqlparsercontroller439: '🧪 [QUEUE-TEST] Gefundene Projekt-IDs:',
  sqlparsercontroller442: '🧪 [QUEUE-TEST] Schema {$schema->id}: Keine Projekte von der Warteschlangenneugenerierung betroffen',
  sqlparsercontroller446: '🧪 [QUEUE-TEST] Schema {$schema->id}: Regeneration wird versendet für',
  sqlparsercontroller450: '🧪 [QUEUE-TEST] Jobs in der Warteschlange vor dem Versand: {$jobsBefore}',
  sqlparsercontroller455: '🧪 [QUEUE-TEST] Versenden des RegenerateProjectGenerationTree-Jobs für das Projekt {$projectId}',
  sqlparsercontroller460: '🧪 [QUEUE-TEST] Auftrag für Projekt {$projectId} erfolgreich versendet',
  sqlparsercontroller462: '🧪 [QUEUE-TEST] Job für Projekt {$projectId} konnte nicht versendet werden:',
  sqlparsercontroller468: '🧪 [QUEUE-TEST] Jobs in der Warteschlange nach dem Versand: {$jobsAfter}',
  sqlparsercontroller469: '🧪 [QUEUE-TEST] Gesamtzahl der versendeten Jobs: {$dispatchedJobs}',
  sqlparsercontroller470: '🧪 [QUEUE-TEST] Job-Versand für Schema {$schema->id} abgeschlossen',

  // app\Http\Controllers\TeamController.php
  teamcontroller88: 'Validierung fehlgeschlagen',
  teamcontroller117: 'Team erfolgreich erstellt',
  teamcontroller131: 'Nicht autorisiert',
  teamcontroller149: 'Unzureichende Berechtigungen',
  teamcontroller169: 'Validierung fehlgeschlagen',
  teamcontroller191: 'Team erfolgreich aktualisiert',
  teamcontroller205: 'Nur der Teambesitzer kann das Team löschen',
  teamcontroller210: 'Team erfolgreich gelöscht',
  teamcontroller223: 'Unzureichende Berechtigungen',
  teamcontroller231: 'Mitglied nicht gefunden',
  teamcontroller236: 'Teambesitzer kann nicht entfernt werden',
  teamcontroller241: 'Mitglied erfolgreich entfernt',
  teamcontroller254: 'Unzureichende Berechtigungen',
  teamcontroller263: 'Validierung fehlgeschlagen',
  teamcontroller273: 'Mitglied nicht gefunden',
  teamcontroller278: 'Die Rolle des Eigentümers kann nicht geändert werden',
  teamcontroller284: 'Mitgliederrolle erfolgreich aktualisiert',
  teamcontroller298: 'Nicht autorisiert',
  teamcontroller308: 'Validierung fehlgeschlagen',
  teamcontroller317: 'Der Benutzer ist bereits Mitglied dieses Teams',
  teamcontroller330: 'Mitglied erfolgreich zum Team hinzugefügt',
  teamcontroller344: 'Nicht autorisiert',

  // app\Http\Controllers\TeamInvitationController.php
  teaminvitationcontroller26: 'Unzureichende Berechtigungen',
  teaminvitationcontroller38: 'Validierung fehlgeschlagen',
  teaminvitationcontroller46: 'Der Benutzer ist bereits ein Teammitglied',
  teaminvitationcontroller56: 'Der Benutzer hat bereits eine ausstehende Einladung',
  teaminvitationcontroller70: 'Einladung erfolgreich versendet',
  teaminvitationcontroller106: 'Unzureichende Berechtigungen',
  teaminvitationcontroller124: 'Ungültiges Einladungstoken',
  teaminvitationcontroller132: 'Diese Einladung ist nicht für Sie',
  teaminvitationcontroller137: 'Einladung ist abgelaufen',
  teaminvitationcontroller139: 'Einladung kann nicht angenommen werden',
  teaminvitationcontroller143: 'Einladung erfolgreich angenommen',
  teaminvitationcontroller156: 'Ungültiges Einladungstoken',
  teaminvitationcontroller164: 'Diese Einladung ist nicht für Sie',
  teaminvitationcontroller168: 'Einladung kann nicht abgelehnt werden',
  teaminvitationcontroller171: 'Einladung abgelehnt',
  teaminvitationcontroller184: 'Unzureichende Berechtigungen',
  teaminvitationcontroller188: 'Kann nur ausstehende Einladungen stornieren',
  teaminvitationcontroller193: 'Einladung abgesagt',
  teaminvitationcontroller206: 'Unzureichende Berechtigungen',
  teaminvitationcontroller210: 'Kann nur ausstehende oder abgelaufene Einladungen erneut senden',
  teaminvitationcontroller222: 'Einladung erfolgreich erneut gesendet',

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: 'Alle',
  templatecontroller98: 'Template nicht gefunden',
  templatecontroller140: 'Template/{$template->id}/{$fileData[',
  templatecontroller154: 'Template erfolgreich erstellt',
  templatecontroller222: 'Template erfolgreich aktualisiert',
  templatecontroller243: 'Template erfolgreich gelöscht',
  templatecontroller306: 'Templatezuweisung wird derzeit simuliert - Datenbankintegration steht noch aus',
  templatecontroller328: 'Templateentfernung erfolgreich simuliert',
  templatecontroller329: 'Das Entfernen der Template wird derzeit simuliert - die Datenbankintegration steht noch aus',
  templatecontroller334: 'Simulierte Entfernung fehlgeschlagen',
  templatecontroller369: 'Scoriet-Templatemanager',
  templatecontroller382: 'Templatee nicht gefunden',
  templatecontroller420: 'Template mit diesem Namen ist bereits vorhanden. Setzen Sie overwrite_existing auf „true“, um sie zu ersetzen.',
  templatecontroller445: 'Template/{$template->id}/{$fileData[',
  templatecontroller455: 'Template erfolgreich importiert',
  templatecontroller481: 'Template nicht gefunden',
  templatecontroller493: 'Anforderung zur DB-Schemaabhängigkeit hinzufügen',
  templatecontroller509: 'Sie können dieser Template keine Abhängigkeiten hinzufügen',
  templatecontroller523: 'Validierung bestanden',
  templatecontroller525: 'Validierung fehlgeschlagen',
  templatecontroller533: 'Gefundenes Schema',
  templatecontroller538: 'Schemazugriff verweigert',
  templatecontroller544: 'Zugriff auf dieses DB-Schema verweigert',
  templatecontroller553: 'Abhängigkeitsprüfung',
  templatecontroller558: 'Abhängigkeit besteht bereits',
  templatecontroller561: 'Die Template hängt bereits von diesem DB-Schema ab',
  templatecontroller565: 'Abhängigkeit schaffen',
  templatecontroller579: 'Abhängigkeit erfolgreich erstellt',
  templatecontroller585: 'DB-Schemaabhängigkeit erfolgreich hinzugefügt',
  templatecontroller587: 'Ausnahme in addDbSchemaDependency',
  templatecontroller616: 'Sie können keine Abhängigkeiten aus dieser Template entfernen',
  templatecontroller628: 'DB-Schemaabhängigkeit erfolgreich entfernt',
  templatecontroller633: 'Abhängigkeit nicht gefunden',
  templatecontroller654: 'Sie können die Abhängigkeiten für diese Template nicht aktualisieren',
  templatecontroller672: 'DB-Schemaabhängigkeit erfolgreich aktualisiert',
  templatecontroller677: 'Abhängigkeit nicht gefunden',
  templatecontroller695: 'Zugriff auf dieses DB-Schema verweigert',
  templatecontroller713: 'DB-Schema nicht gefunden',
  templatecontroller723: '🧪 [TEMPLATE-QUEUE] Starte Job-Versand für Template {$template->id} ({$template->name})',
  templatecontroller733: '🧪 [TEMPLATE-QUEUE] Gefundene Projekt-IDs:',
  templatecontroller736: '🧪 [TEMPLATE-QUEUE] Template {$template->id}: Noch keine Projekte, die diese Template verwenden',
  templatecontroller740: '🧪 [TEMPLATE-QUEUE] Template {$template->id}: Regeneration wird versendet für',
  templatecontroller744: '🧪 [TEMPLATE-QUEUE] Jobs in der Warteschlange vor dem Versand: {$jobsBefore}',
  templatecontroller750: '🧪 [TEMPLATE-QUEUE] Versenden des RegenerateProjectGenerationTree-Jobs für das Projekt {$projectId}',
  templatecontroller754: '🧪 [TEMPLATE-QUEUE] Auftrag für Projekt {$projectId} erfolgreich versendet',
  templatecontroller756: '🧪 [TEMPLATE-QUEUE] Job für Projekt {$projectId} konnte nicht versendet werden:',
  templatecontroller762: '🧪 [TEMPLATE-QUEUE] Jobs in der Warteschlange nach dem Versand: {$jobsAfter}',
  templatecontroller764: '🧪 [TEMPLATE-QUEUE] Gesamtzahl der versendeten Jobs: {$dispatchedJobs}',
  templatecontroller765: '🧪 [TEMPLATE-QUEUE] Auftragsversand für Template {$template->id} abgeschlossen',

  // app\Http\Controllers\UserController.php
  usercontroller25: 'Benutzer nicht authentifiziert.',
  usercontroller36: 'Login-Zeitstempel erfolgreich aktualisiert.',

  // app\Http\Middleware\CheckSystemUser.php
  checksystemuser25: 'Zugriff verweigert. System- oder Administratorrechte erforderlich.',

  // app\Http\Middleware\EnsureUserIsAdmin.php
  ensureuserisadmin32: 'Admin-Middleware-Prüfung',
  ensureuserisadmin42: 'Administratorzugriff verweigert: Benutzer nicht authentifiziert',
  ensureuserisadmin47: 'Nicht authentifiziert. Bitte melden Sie sich zuerst an.',
  ensureuserisadmin52: 'Bitte melden Sie sich an',
  ensureuserisadmin58: 'Ergebnis der Admin-Prüfung',
  ensureuserisadmin64: 'Administratorzugriff verweigert: Benutzer ist kein Administrator/System',
  ensureuserisadmin72: 'Verboten. Administratorzugriff erforderlich.',
  ensureuserisadmin77: 'Zugriff verweigert. Nur System-Administratoren haben Zugang zu diesem Bereich.',
  ensureuserisadmin80: 'Administratorzugriff gewährt',

  // app\JobsegenerateProjectGenerationTree.php
  jobsegenerateprojectgenerationtree36: 'Projekt {$this->projectId} für die Regeneration des Generationsbaums nicht gefunden',
  jobsegenerateprojectgenerationtree40: 'Regenerieren des Generationsbaums für das Projekt: {$project->name} (ID: {$project->id})',
  jobsegenerateprojectgenerationtree45: 'Der Generationsbaum für das Projekt {$project->id} wurde erfolgreich neu erstellt. Gesamtzahl der Elemente:',
  jobsegenerateprojectgenerationtree48: 'Der Generationsbaum für das Projekt {$this->projectId} konnte nicht neu generiert werden:',

  // app\Jobs\RegenerateProjectGenerationTree.php
  regenerateprojectgenerationtree36: 'Projekt {$this->projectId} für die Regeneration des Generationsbaums nicht gefunden',
  regenerateprojectgenerationtree40: 'Regenerieren des Generationsbaums für das Projekt: {$project->name} (ID: {$project->id})',
  regenerateprojectgenerationtree45: 'Der Generationsbaum für das Projekt {$project->id} wurde erfolgreich neu erstellt. Gesamtzahl der Elemente:',
  regenerateprojectgenerationtree48: 'Der Generationsbaum für das Projekt {$this->projectId} konnte nicht neu generiert werden:',

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: 'Du',

  // app\Models\FloatingSchema.php
  floatingschema180: '(Klon)',

  // app\Models\ProjectApplication.php
  projectapplication96: 'Über die Anwendungsgenehmigung hinzugefügt',

  // app\Models\Project.php
  project430: 'Kein authentifizierter Benutzer zum Senden der Einladung',

  // app\Models\SchemaVersion.php
  schemaversion50: 'Version {$nextVersion}',
  schemaversion81: '🔍 createNewVersionWithCopy starten',
  schemaversion93: '✅ Neue leere Version erstellt',
  schemaversion101: '❌ Quellversion nicht gefunden',
  schemaversion102: 'Quellversion {$fromVersionNumber} nicht gefunden',
  schemaversion105: '✅ Quellversion gefunden',
  schemaversion111: '🚀 Phase 1: Tabellen kopieren',
  schemaversion115: '📋 Kopiertabelle',
  schemaversion127: '✅ Tabelle erstellt',
  schemaversion134: '📝 Felder kopieren',
  schemaversion138: '🔤 Feld kopieren',
  schemaversion156: '✅ Feld erfolgreich kopiert',
  schemaversion158: '❌ Feld konnte nicht kopiert werden',
  schemaversion168: '🔗 Phase 1: Kopieren von Nicht-FK-Einschränkungen',
  schemaversion172: '🔒 Kopierbeschränkung',
  schemaversion182: '✅ Einschränkung erstellt',
  schemaversion210: '🚨 Fremdschlüssel ÜBERSPRINGEN - Referenzierte Tabelle nicht gefunden',
  schemaversion238: '❌ Die Einschränkung konnte nicht kopiert werden',
  schemaversion248: '🚀 Phase 2: Verarbeitung von Fremdschlüsseleinschränkungen',
  schemaversion254: '🔑 FK-Einschränkungen für Tabellen verarbeiten',
  schemaversion261: '🔒 Phase 2: Erstellen einer FK-Einschränkung',
  schemaversion273: '✅ FK-Einschränkung erstellt',
  schemaversion310: '✅ FK-Referenz erfolgreich erstellt',
  schemaversion312: '❌ Phase 2: Referenzierte Tabelle immer noch nicht gefunden',
  schemaversion319: '❌ FK-Einschränkung konnte in Phase 2 nicht kopiert werden',
  schemaversion330: '📐 Layoutdaten kopieren',
  schemaversion338: '📐 Layout zum Kopieren gefunden',
  schemaversion351: '📐 Layout erfolgreich kopiert',
  schemaversion353: '📐 Kein Layout zum Kopieren aus der Version gefunden',
  schemaversion356: '❌ Das Kopieren des Layouts ist fehlgeschlagen',
  schemaversion365: '🎉 createNewVersionWithCopy erfolgreich abgeschlossen',
  schemaversion381: 'j.n.Y',

  // app\Notifications\NewUserRegistered.php
  newuserregistered40: 'd.m.Y H:i:s',
  newuserregistered43: 'ðŸŽ‰ Neue Registrierung auf Scoriet',
  newuserregistered44: 'Hallo Admin!',
  newuserregistered45: 'Es hat sich ein neuer Benutzer auf Scoriet registriert:',
  newuserregistered47: '**Benutzerinformationen:**',
  newuserregistered48: '• **Name:** ',
  newuserregistered49: '• **Benutzername:**',
  newuserregistered50: '• **E-Mail:**',
  newuserregistered51: '• **Benutzer-ID:** ',
  newuserregistered52: 'â€¢ **Registriert am:** ',
  newuserregistered54: '**E-Mail-Status:**',
  newuserregistered56: 'User in Admin-Panel anzeigen',
  newuserregistered57: 'Diese E-Mail wurde automatisch generiert.',
  newuserregistered58: 'Viele GrÃ¼ÃŸe vom Scoriet-System',

  // app\Observers\ProjectGenerationTreeObserver.php
  projectgenerationtreeobserver17: '🌳 [GENERATION-TREE-OBSERVER] tree_data für Projekt {$generationTree->project_id} aktualisiert',
  projectgenerationtreeobserver30: '🌳 [GENERATION-TREE-OBSERVER] hat das Ereignis für das Projekt {$generationTree->project_id} gespeichert',
  projectgenerationtreeobserver44: '🌳 [GENERATION-TREE-OBSERVER] Broadcasting-Update für Projekt {$generationTree->project_id}',
  projectgenerationtreeobserver60: '🌳 [GENERATION-TREE-OBSERVER] Fehler beim Senden der Baumaktualisierung:',

  // app\Observers\ProjectObserver.php
  projectobserver18: 'Projekt {$project->id} Sprachen aktualisiert: Dispatching Regeneration',

  // app\Observers\ProjectSchemaObserver.php
  projectschemaobserver23: '🔔 [PROJECT-SCHEMA-OBSERVER] Schema zugewiesen zu Project',
  projectschemaobserver33: '✅ [PROJECT-SCHEMA-OBSERVER] Generation Tree Job versendet',
  projectschemaobserver37: '❌ [PROJECT-SCHEMA-OBSERVER] Job konnte nicht versendet werden',
  projectschemaobserver51: '🔔 [PROJECT-SCHEMA-OBSERVER] Schema entfernt von Project',
  projectschemaobserver61: '✅ [PROJECT-SCHEMA-OBSERVER] Generation Tree Job versendet',
  projectschemaobserver65: '❌ [PROJECT-SCHEMA-OBSERVER] Job konnte nicht versendet werden',

  // app\Observers\ProjectTemplateUsageObserver.php
  projecttemplateusageobserver16: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] erstelltes Ereignis, ausgelöst für die Verwendung {$projectTemplateUsage->id} (Projekt: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver27: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] is_active geändert für Verwendung {$projectTemplateUsage->id} (Projekt: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver37: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] gelöschtes Ereignis ausgelöst für Verwendung {$projectTemplateUsage->id} (Projekt: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver48: 'ProjectTemplateUsage {$projectTemplateUsage->id} ({$action}): Regeneration für Projekt {$projectId} wird versendet',
  projecttemplateusageobserver52: 'Regenerationsauftrag für Projekt {$projectId} erfolgreich versendet',
  projecttemplateusageobserver54: 'Der Regenerationsauftrag für das Projekt {$projectId} konnte nicht versendet werden:',

  // app\Observers\SchemaTableObserver.php
  schematableobserver17: '📋 [SCHEMA-TABLE-OBSERVER] erstelltes Ereignis für Tabelle {$schemaTable->id} ({$schemaTable->table_name}) ausgelöst',
  schematableobserver26: '📋 [SCHEMA-TABLE-OBSERVER] Aktualisiertes Ereignis für Tabelle {$schemaTable->id} ({$schemaTable->table_name}) ausgelöst',
  schematableobserver35: '📋 [SCHEMA-TABLE-OBSERVER] gelöschtes Ereignis für Tabelle {$schemaTable->id} ({$schemaTable->table_name}) ausgelöst',
  schematableobserver52: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Keine aktiven Projekte gefunden',
  schematableobserver56: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Regeneration für ALLE versenden',
  schematableobserver66: '📋 [SCHEMA-TABLE-OBSERVER] Synchroner Regenerationsjob für Projekt {$projectId} ausführen',
  schematableobserver72: 'Regenerationsauftrag für Projekt {$projectId} erfolgreich versendet',
  schematableobserver75: 'Fehler beim Versenden/Ausführen des Regenerationsauftrags für Projekt {$projectId}:',

  // app\Observers\SchemaVersionObserver.php
  schemaversionobserver17: 'SchemaVersionObserver: erstelltes Ereignis, ausgelöst für Schemaversion {$schemaVersion->id}',
  schemaversionobserver50: 'SchemaVersion {$schemaVersion->id} ({$action}): Keine aktiven Projekte gefunden',
  schemaversionobserver54: 'SchemaVersion {$schemaVersion->id} ({$action}): Regeneration für ALLE auslösen',
  schemaversionobserver64: 'SchemaVersion {$schemaVersion->id} ({$action}): Synchroner Regenerationsjob für Projekt {$projectId} ausführen',
  schemaversionobserver70: 'Regenerationsauftrag für Projekt {$projectId} erfolgreich versendet',
  schemaversionobserver73: 'Fehler beim Versenden/Ausführen des Regenerationsauftrags für Projekt {$projectId}:',

  // app\Observers\TemplateFileObserver.php
  templatefileobserver17: '📄 [TEMPLATE-FILE-OBSERVER] erstelltes Ereignis ausgelöst für Datei {$templateFile->id} (Template: {$templateFile->template_id})',
  templatefileobserver26: '📄 [TEMPLATE-FILE-OBSERVER] Aktualisiertes Ereignis für Datei {$templateFile->id} ausgelöst (Template: {$templateFile->template_id})',
  templatefileobserver35: '📄 [TEMPLATE-FILE-OBSERVER] gelöschtes Ereignis für Datei {$templateFile->id} ausgelöst (Template: {$templateFile->template_id})',
  templatefileobserver53: 'TemplateFile {$templateFile->id} ({$action}): Keine Projekte betroffen',
  templatefileobserver57: 'TemplateFile {$templateFile->id} ({$action}): Regeneration wird versendet für',
  templatefileobserver63: 'Regenerationsauftrag für Projekt {$projectId} erfolgreich versendet',
  templatefileobserver65: 'Der Regenerationsauftrag für das Projekt {$projectId} konnte nicht versendet werden:',

  // app\Observers\TemplateObserver.php
  templateobserver17: '🧪 [TEMPLATE-OBSERVER] hat ein Ereignis für die Template {$template->id} ({$template->name}) ausgelöst.',
  templateobserver53: 'Template {$template->id} wurde zwangsweise gelöscht',
  templateobserver70: 'Template {$template->id} ({$action}): Keine Projekte betroffen',
  templateobserver74: 'Template {$template->id} ({$action}): Regeneration wird versendet für',

  // appotificationsewUserRegistered.php
  appotificationsewuserregistered40: 'd.m.Y H:i:s',
  appotificationsewuserregistered43: '🎉 Neue Registrierung auf Scoriet',
  appotificationsewuserregistered44: 'Hallo Admin!',
  appotificationsewuserregistered45: 'Es hat sich ein neuer Benutzer auf Scoriet registriert:',
  appotificationsewuserregistered47: '**Benutzerinformationen:**',
  appotificationsewuserregistered48: '• **Name:** ',
  appotificationsewuserregistered49: 'Nicht angegeben',
  appotificationsewuserregistered50: '• **E-Mail:**',
  appotificationsewuserregistered51: '• **Benutzer-ID:** ',
  appotificationsewuserregistered52: '• **Registriert am:** ',
  appotificationsewuserregistered54: '⏳ Noch nicht bestätigt',
  appotificationsewuserregistered56: 'User in Admin-Panel anzeigen',
  appotificationsewuserregistered57: 'Diese E-Mail wurde automatisch generiert.',
  appotificationsewuserregistered58: 'Viele Grüße vom Scoriet-System',

  // app\Services\MySQLParser.php
  mysqlparser18: 'Fehler beim Parsen: ',

  // app\Services\ProjectFileTreeGenerator.php
  projectfiletreegenerator120: '🧪 [TREE-GEN] Geladene Tabellen aus ALLEN Schemata:',
  projectfiletreegenerator193: 'J-m-t',
  projectfiletreegenerator194: 'Sein',
  projectfiletreegenerator195: 'J-m-t_H-i-s',
  projectfiletreegenerator226: '🧪 [TREE-GEN] Der aufgelöste Pfad ist für die TemplateFile-ID {$templateFile->id} leer',
  projectfiletreegenerator263: 'J-m-t',
  projectfiletreegenerator264: 'Sein',
  projectfiletreegenerator265: 'J-m-t_H-i-s',
  projectfiletreegenerator296: '🧪 [TREE-GEN] Der aufgelöste Pfad ist für die TemplateFile-ID {$templateFile->id} leer',
  projectfiletreegenerator331: 'J-m-t',
  projectfiletreegenerator332: 'Sein',
  projectfiletreegenerator333: 'J-m-t_H-i-s',
  projectfiletreegenerator364: '🧪 [TREE-GEN] Der aufgelöste Pfad ist für die TemplateFile-ID {$templateFile->id} leer',
  projectfiletreegenerator498: 'de_DE',
  projectfiletreegenerator500: 'fr_FR',
  projectfiletreegenerator502: 'it_IT',
  projectfiletreegenerator504: 'nl_NL',
  projectfiletreegenerator505: 'pl_PL',
  projectfiletreegenerator506: 'ru_RU',
  projectfiletreegenerator507: 'ja_JP',
  projectfiletreegenerator508: 'zh_CN',

  // app\Services\SchemaStorageService.php
  schemastorageservice226: 'Referenzierte Tabelle',
  schemastorageservice394: '🔧 Dateischlüssel migriert',
  schemastorageservice413: '🔧 Dateiname umbenannt migriert',
  schemastorageservice427: '🔧 Dateiname kurz migriert',
  schemastorageservice436: '🔧 Kurzer Dateiname automatisch generiert',

  // app\Services\SimpleFixedTemplateEngine.php
  simplefixedtemplateengine661: '✅ {filename} wird korrekt zu accounting_log ersetzt',
  simplefixedtemplateengine662: '✅ Keine Geister-} mehr im JavaScript',
  simplefixedtemplateengine663: '✅ Template-Konstrukte auf eigenen Zeilen',
  simplefixedtemplateengine664: '✅ Saubere Loop-Strukturen',
  simplefixedtemplateengine665: '✅ Keine Regex - nur String-Operations',

  // app\Services\SimpleTemplateEngine.php
  simpletemplateengine128: 'Unbekannt',
  simpletemplateengine129: 'Unbekannt',
  simpletemplateengine130: 'Unbekannt',
  simpletemplateengine153: 'Unbekannt',
  simpletemplateengine154: 'Unbekannt',

  // app\Services\SQLParser.php
  sqlparser71: 'SQL-Syntaxfehler: Token erwartet',
  sqlparser75: 'SQL-Syntaxfehler: Erwartet',
  sqlparser83: 'SQL-Syntaxfehler: Unerwartetes Ende des SQL-Skripts {$context}. Fehlendes Semikolon oder unvollständige Anweisung?',
  sqlparser96: 'am Ende von SQL',
  sqlparser130: '(SQL-Zeile: {$currentLine}',
  sqlparser152: 'Erwarteter Tabellenname',
  sqlparser237: 'Erwarteter Feldname',
  sqlparser466: 'Erwarteter Tabellenname',

  // app\Services\StepByStepTemplateEngine.php
  stepbysteptemplateengine392: 'Template-Konstrukte werden auf einzelne Zeilen aufgeteilt',
  stepbysteptemplateengine394: '{for} und {if} werden als separate Blöcke behandelt',
  stepbysteptemplateengine395: ' mehr im JavaScript',
  stepbysteptemplateengine396: 'Sauberer',

  // app\Services\UltimateTemplateEngine.php
  ultimatetemplateengine195: 'Maximale Schleifentiefe überschritten',
  ultimatetemplateengine656: '// Unbekanntes Inline-Schleifenformat: {$matchText}',
  ultimatetemplateengine968: '// Integrierte Templatefunktionen',

  // resources/js\app.tsx
  app48: 'EUR',
  app59: 'EUR',

  // resources/js\Components\AuthModals\AuthModalManager.tsx
  authmodalmanager3: './RegisterModal',
  authmodalmanager5: './ProfileModal',
  authmodalmanager7: './PlanModal',

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: 'Passwörter stimmen nicht überein',
  authmodalsegistermodal84: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
  authmodalsegistermodal94: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail auf einen Bestätigungslink, bevor Sie sich anmelden.',
  authmodalsegistermodal109: 'Ein Fehler ist aufgetreten',
  authmodalsegistermodal203: 'Registrieren',
  authmodalsegistermodal239: 'Ihr vollständiger Name',
  authmodalsegistermodal293: 'Ihr Passwort',
  authmodalsegistermodal312: 'Passwort wiederholen',
  authmodalsegistermodal335: 'Sprache auswählen',
  authmodalsegistermodal351: 'Sprache auswählen',
  authmodalsegistermodal366: 'Sprache auswählen',
  authmodalsegistermodal379: 'Registrieren',
  authmodalsegistermodal388: 'Sie haben bereits ein Konto? Anmelden',

  // resources/js\Components\AuthModalsesetPasswordModal.tsx
  authmodalsesetpasswordmodal73: 'Dieser Link zum Zurücksetzen ist ungültig oder abgelaufen.',
  authmodalsesetpasswordmodal79: 'Fehler beim Validieren des Reset-Links.',
  authmodalsesetpasswordmodal122: 'Passwortfehler:',
  authmodalsesetpasswordmodal124: 'Token-Fehler:',
  authmodalsesetpasswordmodal127: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  authmodalsesetpasswordmodal131: 'Netzwerkfehler - bitte versuchen Sie es später erneut.',
  authmodalsesetpasswordmodal162: 'Schließen',
  authmodalsesetpasswordmodal265: 'Neues Passwort eingeben',
  authmodalsesetpasswordmodal287: 'Passwort wiederholen',
  authmodalsesetpasswordmodal319: 'Passwort zurücksetzen',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: 'Fehler beim Senden der E-Mail',
  forgotpasswordmodal46: 'Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail-Adresse gesendet.',
  forgotpasswordmodal50: 'Ein Fehler ist aufgetreten',
  forgotpasswordmodal73: 'Passwort vergessen',

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal83: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.',
  forgotpasswordmodal105: 'E-Mail',
  forgotpasswordmodal113: 'Ihre E-Mail-Adresse@Beispiel.com',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: 'Link zurücksetzen Senden',
  forgotpasswordmodal131: 'Zurück zur Anmeldung',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginPasswordHint: 'Ihr Passwort',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal46: 'Sprache geändert',
  loginmodal49: 'Sprache geändert',
  loginmodal88: 'E-Mail-Adresse muss bestätigt werden. Bitte prüfen Sie Ihre E-Mails.',
  loginmodal93: 'Fehler bei der Anmeldung',
  loginmodal136: 'Ein Fehler ist aufgetreten',
  loginmodal139: 'Fehler bei der Anmeldung',
  loginmodal140: 'E-Mail/Benutzername oder Passwort ist falsch.',
  loginmodal142: 'E-Mail-Adresse muss bestätigt werden.',
  loginmodal184: 'Bestätigungs-E-Mail wurde erneut gesendet!',
  loginmodal189: 'Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.',
  loginmodal212: 'Login',

  // resources/js/Components/AuthModals/LoginModal.tsx
  loginmodal241: 'Ihre E-Mail-Adresse ist noch nicht bestätigt.',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal246: 'Bestätigungs-E-Mail erneut senden',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginDemoTextHeader: 'Demo-Modus verfügbar',
  LoginDemoDescription: 'Testen Sie Scoriet ohne Registrierung mit vorgefertigten Demodaten:',
  LoginDemoAdmin: '- Vollzugriff, 2 Teams, 3 Projekte',
  LoginDemoUser: '- Teammitglied, 1 Projekt zugewiesen',
  LoginToolTip: 'Klicken Sie oben auf die Karten, um eine sofortige Demo zu erhalten, oder geben Sie den Demo-Benutzernamen manuell ein (lassen Sie das Passwort leer) - die Demo wird alle 20 Minuten neu gestartet',
  LoginEmailOrUserName: 'E-Mail oder Username',
  LoginEmailOrUserNameHint: 'Demo-Admin oder Demo-Benutzer',
  LoginPassword: 'Passwort',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal317: 'Für Demo leer lassen',
  loginmodal334: 'erinnere dich an mich',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: 'Angemeldet bleiben (30 Tage)',
  LoginStayLoggedInTooltip: 'Sie bleiben auch nach dem Schließen des Browsers angemeldet',
  LoginDoLogin: 'Anmelden...',
  LoginButton: 'Login',
  LoginRegister: 'Sie haben noch kein Konto? Registrieren',
  LoginForgotPassword: 'Passwort vergessen?',

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal26: 'EUR',
  planmodal43: 'Frei',
  planmodal46: 'Perfekt für persönliche Projekte',
  planmodal48: 'Bis zu 3 Projekte',
  planmodal49: 'Grundlegende Templates',
  planmodal50: 'SQL-Schemaanalyse',
  planmodal51: 'Unterstützung durch die Gemeinschaft',
  planmodal53: 'Aktueller Plan',
  planmodal58: 'Prämie',
  planmodal62: 'Am besten für professionelle Entwickler',
  planmodal64: 'Unbegrenzte Projekte',
  planmodal65: 'Erweiterte Templates',
  planmodal66: 'Benutzerdefinierte Templateerstellung',
  planmodal67: 'Vorrangiger Support',
  planmodal68: 'Erweiterte SQL-Funktionen',
  planmodal69: 'Teamzusammenarbeit',
  planmodal71: 'Wählen Sie Premium',
  planmodal76: 'Business',
  planmodal80: 'Am besten für Teams und Agenturen',
  planmodal82: 'Alle Premium-Funktionen',
  planmodal83: 'Tools für die Teamzusammenarbeit',
  planmodal84: 'Google Translate API-Integration',
  planmodal85: 'Erweiterte Analysen',
  planmodal86: 'Vorrangiger Support mit SLA',
  planmodal87: 'Benutzerdefinierte Branding-Optionen',
  planmodal89: 'Wählen Sie Business',
  planmodal94: 'Patron',
  planmodal97: 'Unterstütze die Community',
  planmodal99: 'Alle Business-Funktionen',
  planmodal100: 'Früher Zugriff auf Funktionen',
  planmodal101: 'Einflussentwicklung',
  planmodal102: 'Community-Discord-Zugriff',
  planmodal103: 'Benutzerdefinierter Betrag (5-50 €+)',
  planmodal105: 'Wählen Sie einen Patron',
  planmodal116: 'Wählen Sie Ihren Plan',
  planmodal126: 'Aktueller Plan',
  planmodal127: 'Frei',
  planmodal130: 'Kostenloser Plan',
  planmodal143: 'AM BELIEBTESTEN',
  planmodal147: 'Patron',
  planmodal151: 'Brauch',
  planmodal173: 'Frei',
  planmodal175: 'Frei',
  planmodal177: 'Frei',
  planmodal190: 'Sie können Ihren Plan jederzeit ändern oder kündigen. Alle Pläne beinhalten eine 30-tägige Geld-zurück-Garantie.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal42: 'Sprache geändert',
  profilemodal45: 'Sprache geändert',
  profilemodal115: 'Nicht angemeldet',
  profilemodal127: 'Fehler beim Laden der Benutzerdaten',
  profilemodal146: 'Fehler beim Laden',
  profilemodal167: 'Nicht angemeldet',
  profilemodal186: 'Fehler beim Aktualisieren',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: 'Profil erfolgreich aktualisiert',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: 'Fehler bei der Profilaktualisierung',
  profilemodal214: 'Sprache geändert',
  profilemodal246: 'Neue Passwörter stimmen nicht überein',
  profilemodal254: 'Nicht angemeldet',
  profilemodal273: 'Fehler beim Ändern des Passworts',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: 'Passwort erfolgreich geändert',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal280: 'Ein Fehler ist aufgetreten',
  profilemodal305: 'LÖSCHEN',
  profilemodal306: 'Sie müssen DELETE eingeben, um Ihren Account zu löschen',
  profilemodal314: 'Nicht angemeldet',
  profilemodal318: 'LÖSCHEN',
  profilemodal331: 'Fehler beim Löschen des Accounts',
  profilemodal334: 'Account erfolgreich gelöscht. Sie werden automatisch abgemeldet.',
  profilemodal346: 'Ein Fehler ist aufgetreten',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: 'Profil Einstellungen',
  profileTab: 'Profil',
  profilemodal406: 'Benutzer-ID',
  profilemodal421: 'Benutzername',
  fullName: 'Vollständiger Name',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal447: 'Ihr vollständiger Name',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  emailAddress: 'E-Mail-Adresse',
  profilemodal463: 'ihre.email@example.com',
  preferredLanguage: 'Bevorzugte Sprache',
  languageDescription: 'Wählen Sie Ihre bevorzugte Sprache für die Anwendungsoberfläche',

  // Email Notification Settings
  emailNotifications: 'E-Mail Benachrichtigungen',
  emailSystemNotifications: 'System-Benachrichtigungen',
  emailSystemNotificationsDesc: 'Wichtige Systemmeldungen, Ankündigungen und Admin-Nachrichten',
  emailUserNotifications: 'Benutzer-Nachrichten',
  emailUserNotificationsDesc: 'Nachrichten von anderen Benutzern, Teams und Projekt-Benachrichtigungen',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal498: 'Sprache auswählen',
  profilemodal510: 'Der Benutzername kann nach der Registrierung nicht mehr geändert werden.',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  updating: 'Wird aktualisiert...',
  updateProfile: 'Profil aktualisieren',
  passwordTab: 'Passwort ändern',
  currentPassword: 'Aktuelles Passwort',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal555: 'Ihr aktuelles Passwort',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  newPassword: 'Neues Passwort',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal573: 'Ihr neues Passwort',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  confirmPassword: 'Neues Passwort bestätigen',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal591: 'Neues Passwort wiederholen',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  changing: 'Wird geändert...',
  changePassword: 'Passwort ändern',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal611: 'Pläne und Abrechnung',
  profilemodal616: 'Aktueller Plan',
  profilemodal617: 'Frei',
  profilemodal620: 'Kostenloser Plan',
  profilemodal626: 'Verfügbare Pläne',
  profilemodal632: 'Frei',
  profilemodal635: '• Bis zu 3 Projekte',
  profilemodal636: '• Grundlegende Templates',
  profilemodal637: '• Community-Unterstützung',
  profilemodal640: 'Aktuell',
  profilemodal648: 'Prämie',
  profilemodal651: '• Unbegrenzte Projekte',
  profilemodal652: '• Erweiterte Templates',
  profilemodal653: '• Vorrangiger Support',
  profilemodal654: '• Teamzusammenarbeit',
  profilemodal658: 'Upgrade',
  profilemodal661: 'Upgrade auf Premium - in Kürze verfügbar!',
  profilemodal670: 'Patron',
  profilemodal673: '• Alle Premium-Funktionen',
  profilemodal674: '• Frühzeitiger Zugriff auf Funktionen',
  profilemodal675: '• Community-Discord-Zugriff',
  profilemodal676: '• Benutzerdefinierter Betrag (5-50 €+)',
  profilemodal680: 'Werden Sie Patron',
  profilemodal683: 'Werden Sie Patron - in Kürze verfügbar!',
  profilemodal739: 'Warnung: Konto löschen',
  profilemodal684: '• Alle Premium-Funktionen',
  profilemodal685: '• Tools für die Teamzusammenarbeit',
  profilemodal686: '• Google Translate API-Integration',
  profilemodal687: '• Erweiterte Analysen',
  profilemodal688: '• Vorrangiger Support mit SLA',
  profilemodal689: '• Benutzerdefinierte Branding-Optionen',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleteTab: 'Konto löschen',
  profilemodal714: 'Diese Aktion kann nicht rückgängig gemacht werden. Ihr Konto und alle zugehörigen Daten werden dauerhaft gelöscht.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal718: 'Alle Ihre Projekte und Templates werden gelöscht',
  profilemodal719: 'Ihre Teammitgliedschaften werden beendet',
  profilemodal720: 'Diese Aktion kann nicht rückgängig gemacht werden',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal725: 'Aktuelles Passwort bestätigen',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal732: 'Ihr aktuelles Passwort',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal743: 'Geben Sie zur Bestätigung DELETE ein',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal744: 'LÖSCHEN',
  profilemodal750: 'Text bestätigen',
  profilemodal751: 'LÖSCHEN',
  profilemodal757: 'LÖSCHEN',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: 'Wird gelöscht...',
  saving: 'Wird gespeichert...',
  deleteAccount: 'Konto löschen',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal766: 'LÖSCHEN',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: 'Passwörter stimmen nicht überein',
  registermodal84: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
  registermodal94: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail auf einen Bestätigungslink, bevor Sie sich anmelden.',

  // resources\js\Components\AuthModals\RegisterModal.tsx
  registermodal102: 'Registrierung erfolgreich! ${userId ? `Ihre Benutzer-ID lautet: ${userId}. ` : \'\'}Sie können sich jetzt anmelden.',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: 'Ein Fehler ist aufgetreten',
  registermodal203: 'Registrieren',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: 'Name',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal239: 'Ihr vollständiger Name',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal244: 'Ihr vollständiger Name',
  registermodal261: 'Benutzername123',
  registermodal274: 'E-Mail',
  registermodal282: 'Ihre E-Mail-Adresse@Beispiel.com',
  registermodal291: 'Passwort',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal293: 'Ihr Passwort',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal298: 'Ihr Passwort',
  registermodal310: 'Passwort bestätigen',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal312: 'Passwort wiederholen',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal317: 'Passwort wiederholen',
  registermodal329: 'Bevorzugte Sprache',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal335: 'Sprache auswählen',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal340: 'Sprache auswählen',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal351: 'Sprache auswählen',
  registermodal366: 'Sprache auswählen',
  registermodal379: 'Registrierung läuft...',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal384: 'Registrieren',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: 'Sie haben bereits ein Konto? Anmelden',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal393: 'Sie haben bereits ein Konto? Anmelden',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal59: 'XMLHttpRequest',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal73: 'Dieser Link zum Zurücksetzen ist ungültig oder abgelaufen.',
  resetpasswordmodal79: 'Fehler beim Validieren des Reset-Links.',
  resetpasswordmodal122: 'Passwortfehler:',
  resetpasswordmodal124: 'Token-Fehler:',
  resetpasswordmodal127: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  resetpasswordmodal131: 'Netzwerkfehler - bitte versuchen Sie es später erneut.',
  resetpasswordmodal162: 'Schließen',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal191: 'Der Link zum Zurücksetzen wird validiert ...',
  resetpasswordmodal194: 'Einen Moment bitte...',
  resetpasswordmodal208: 'Sie werden automatisch zum Login weitergeleitet...',
  resetpasswordmodal219: 'Link zum Zurücksetzen ungültig',
  resetpasswordmodal231: 'Zur Anmeldung',
  resetpasswordmodal234: 'Fordern Sie einen neuen Link zum Zurücksetzen an, wenn Sie Ihr Passwort zurücksetzen möchten.',
  resetpasswordmodal243: 'E-Mail',
  resetpasswordmodal259: 'Neues Passwort',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal265: 'Neues Passwort eingeben',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal281: 'Passwort bestätigen',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal287: 'Passwort wiederholen',
  resetpasswordmodal319: 'Passwort zurücksetzen',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal332: 'Weiter zur Anmeldung',
  resetpasswordmodal345: 'Der Link zum Zurücksetzen ist ungültig oder abgelaufen.',
  resetpasswordmodal374: 'Login',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: 'Schemas konnten nicht geladen werden',
  databaseexportmodal93: 'Schemas konnten nicht geladen werden',
  databaseexportmodal114: 'Das Laden der Schemaversionen ist fehlgeschlagen',
  databaseexportmodal141: 'Das Laden der Schemaversionen ist fehlgeschlagen',
  databaseexportmodal169: 'Kein Projekt ausgewählt. Bitte wählen Sie zuerst ein Projekt aus.',
  databaseexportmodal195: 'Bitte wählen Sie eine Datenbank und Version zum Exportieren aus',
  databaseexportmodal214: 'In diesem Schema wurden keine Tabellen gefunden. Das Schema ist möglicherweise leer oder die Version ist nicht vorhanden.',
  databaseexportmodal216: 'Der Zugriff auf dieses Schema wurde verweigert. Bitte überprüfen Sie Ihre Berechtigungen.',
  databaseexportmodal225: 'Export fehlgeschlagen',
  databaseexportmodal228: '-- Kein SQL generiert',
  databaseexportmodal238: 'Export fehlgeschlagen',
  databaseexportmodal269: ' (Aktuell)',
  databaseexportmodal285: '📤 Datenbankschema exportieren',
  databaseexportmodal308: 'Datenbankschema als MySQL SQL-Skript exportieren',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: 'Datenbankschema',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal329: 'Schemata werden geladen ...',
  databaseexportmodal338: 'Datenbank auswählen...',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal339: 'w-vollständiges benutzerdefiniertes Dropdown',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: 'Kein Projekt ausgewählt',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal351: 'Version',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal355: 'Wählen Sie zuerst die Datenbank aus',
  databaseexportmodal357: 'Versionen werden geladen...',
  databaseexportmodal363: 'Version auswählen...',
  databaseexportmodal368: 'Keine Versionen gefunden',
  databaseexportmodal380: '📥 .sql herunterladen',
  databaseexportmodal388: '👁️ SQL anzeigen',
  databaseexportmodal403: 'Generiertes SQL-Skript',
  databaseexportmodal406: '📋 Kopieren',
  databaseexportmodal412: '💾 Herunterladen',

  // resources/js\Components\EmailVerification.tsx
  emailverification55: 'Fehler bei der E-Mail-Bestätigung',
  emailverification59: 'Netzwerkfehler - bitte versuchen Sie es später erneut',
  emailverification68: 'Ungültiger Bestätigungslink',
  emailverification107: 'E-Mail-Bestätigung',
  emailverification112: 'E-Mail wird bestätigt...',

  // resources/js/Components/EmailVerification.tsx
  emailverification127: 'Sie sind nun angemeldet und werden automatisch zur App weitergeleitet.',
  emailverification135: 'Sie können jetzt mit der Zusammenarbeit mit Ihrem Team beginnen.',

  // resources/js\Components\EmailVerification.tsx
  emailverification141: 'Jetzt zur App',

  // resources/js/Components/EmailVerification.tsx
  emailverification151: 'Falls Sie weiterhin Probleme haben, kontaktieren Sie bitte den Support.',

  // resources/js\Components\EmailVerification.tsx
  emailverification155: 'Zur Startseite',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: 'Ein unerwarteter Fehler ist aufgetreten. Keine Sorge - Ihre Daten sind sicher.',
  errorfallback40: 'Fehlerdetails:',
  errorfallback58: 'Erneut versuchen',
  errorfallback65: 'Seite neu laden & Reset',
  errorfallback65_2: ' Button löscht alle lokalen Daten (Layout, Einstellungen & Logout!) und startet die App neu.',
  errorfallback75: 'Hinweis:',

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: 'Tipp: Wenn das Problem weiterhin besteht, bitte kontaktieren Sie den Support.',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback78: 'Tipp: Wenn das Problem weiterhin besteht',

  // resources/js\Components\LanguageSelector.tsx
  languageselector68: 'Sprache auswählen',
  languageselector69: 'Sprache auswählen',

  // resources/js/Components/LanguageSelector.tsx
  languageselector87: 'Sprache auswählen',

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: 'Nicht authentifiziert',
  applicationsmodal78: 'Anwendungen konnten nicht geladen werden',
  applicationsmodal85: 'Fehler beim Laden der Anwendungen',
  applicationsmodal106: 'Nicht authentifiziert',
  applicationsmodal125: 'Antrag konnte nicht geprüft werden',
  applicationsmodal143: 'Fehler beim Überprüfen der Bewerbung',
  applicationsmodal200: 'Keine Nachricht',
  applicationsmodal228: 'Antrag genehmigen',
  applicationsmodal234: 'Bewerbung ablehnen',
  applicationsmodal252: 'Unbekannt',
  applicationsmodal301: 'Keine Anwendungen gefunden',
  applicationsmodal313: 'Aktualisieren',
  applicationsmodal322: 'Antragsteller',
  applicationsmodal329: 'Nachricht',
  applicationsmodal335: 'Status',
  applicationsmodal342: 'Angewandt',
  applicationsmodal348: 'Bewertet von',
  applicationsmodal354: 'Aktionen',
  applicationsmodal363: 'Schließen',
  applicationsmodal374: 'Ablehnen',
  applicationsmodal402: 'Nachricht:',
  applicationsmodal412: 'Ablehnungsgrund',
  applicationsmodal420: 'Heißen Sie sie im Projekt willkommen ...',
  applicationsmodal421: 'Teilen Sie ihnen mit, warum ihre Bewerbung abgelehnt wurde ...',
  applicationsmodal432: 'Abbrechen',
  applicationsmodal439: 'Verarbeitung...',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: 'Tabellenname ist erforderlich',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal191: 'Tabellenname ist erforderlich',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: 'Alle Felder müssen einen Namen haben',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal196: 'Alle Felder müssen einen Namen haben',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: 'Feldnamen müssen eindeutig sein',
  createtablemodal290: 'Tabellenname *',
  createtablemodal300: 'z. B. Benutzer, Produkte, Bestellungen',
  createtablemodal306: 'Dateischlüsselname',
  createtablemodal316: 'Geben Sie einen Schlüsselnamen ein oder wählen Sie ihn aus',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal318: 'Geben Sie einen Schlüsselnamen ein oder wählen Sie ihn aus',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal330: 'Dateiname umbenannt',
  createtablemodal339: 'z. B. CustomUser, ProductCatalog',
  createtablemodal348: 'Dateiname kurz',
  createtablemodal370: 'Felder *',
  createtablemodal380: 'Feld hinzufügen',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal382: 'Feld hinzufügen',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal391: 'Name',
  createtablemodal398: 'Feldname',
  createtablemodal428: 'Kontrolle',
  createtablemodal482: 'Keiner',
  createtablemodal483: 'Primärschlüssel',
  createtablemodal484: 'Index',
  createtablemodal485: 'Einzigartig',
  createtablemodal497: 'Feld entfernen',
  createtablemodal509: 'Link-Tabelle',
  createtablemodal516: '-- Tabelle auswählen --',
  createtablemodal525: 'Wertefeld',
  createtablemodal532: '-- Wertefeld --',
  createtablemodal541: 'Anzeigefeld',
  createtablemodal548: '-- Anzeigefeld --',
  createtablemodal557: 'Bestellfeld',
  createtablemodal564: '-- Bestellfeld --',
  createtablemodal573: 'Richtung',
  createtablemodal603: 'Abbrechen',
  createtablemodal614: 'Erstellen...',
  createtablemodal619: 'Tabelle erstellen',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: 'Team konnte nicht erstellt werden',
  createteammodal52: 'Netzwerkfehler aufgetreten',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal88: 'Teamname *',
  createteammodal97: 'zB Kernteam, Qualitätsprüfung',
  createteammodal103: 'Beschreibung',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: 'Was macht dieses Team?',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: 'Projekte',
  createteammodal136: 'Wählen Sie ein oder mehrere Projekte für dieses Team aus. Halten Sie Strg/Cmd gedrückt, um mehrere auszuwählen.',
  createteammodal153: 'Abbrechen',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal164: 'Erstellen...',
  createteammodal169: 'Team erstellen',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal97: 'd.m.Y',
  editprojectmodal98: 'Sein',
  editprojectmodal100: 'Europa/Wien',
  editprojectmodal131: 'd.m.Y',
  editprojectmodal132: 'Sein',
  editprojectmodal134: 'Europa/Wien',
  editprojectmodal168: 'Nicht authentifiziert',
  editprojectmodal183: 'Projekt konnte nicht aktualisiert werden',
  editprojectmodal197: 'Fehler beim Aktualisieren des Projekts',
  editprojectmodal215: 'Projekt bearbeiten',
  editprojectmodal227: 'Projekteinstellungen',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal230: 'Projektname *',
  editprojectmodal240: 'mein_Projektname',
  editprojectmodal252: '✓ Erlaubt: Kleinbuchstaben, Zahlen, Unterstriche (z.B. my_project_123)',
  editprojectmodal258: 'Beschreibung',
  editprojectmodal569: 'Projekt-Namen werden später für URLs verwendet (username/project_name)',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: 'Projektbeschreibung eingeben',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal266: 'Code beitreten',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: 'Beitrittscode eingeben (optional)',
  editprojectmodal280: 'PROJ-',
  editprojectmodal281: 'Zufälligen Beitrittscode generieren',
  editprojectmodal285: 'Benutzer können diesem Projekt mit diesem Code beitreten',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal298: 'Öffentliches Projekt',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal302: 'Machen Sie dieses Projekt für alle Benutzer sichtbar',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal307: 'Eigentum übertragen',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal316: 'Aktuellen Besitzer behalten ({project.owner.name})',
  editprojectmodal332: 'Datenbankverbindung',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal335: 'Datenbankname',
  editprojectmodal345: 'Name der Datenbank für dieses Projekt',
  editprojectmodal351: 'Datenbanktyp',
  editprojectmodal370: 'Server',
  editprojectmodal383: 'Hafen',
  editprojectmodal397: 'Benutzername',
  editprojectmodal410: 'Passwort',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: 'Projekteigenschaften',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal429: 'Projektverzeichnis',
  editprojectmodal439: 'Pfad wo generierte Dateien gespeichert werden sollen',
  editprojectmodal445: 'Projekt-URL',
  editprojectmodal455: 'URL für den Zugriff auf das Projekt',
  editprojectmodal461: 'Startseite',
  editprojectmodal477: 'Standardsprache',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: 'Englisch',
  editprojectmodal485: 'Deutsch',
  editprojectmodal486: 'Französisch',
  editprojectmodal487: 'Spanisch',
  editprojectmodal488: 'Italienisch',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal493: 'Standard-Sprache für Projekt-Generierung',
  editprojectmodal499: 'Dateiname Kurze Länge',
  editprojectmodal506: '2 Zeichen',
  editprojectmodal507: '3 Zeichen',
  editprojectmodal508: '4 Zeichen',
  editprojectmodal509: '5 Zeichen',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: 'Lokalisierungseinstellungen',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal526: 'Dezimaltrennzeichen',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal538: 'für 1,23 oder',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal543: 'Tausendertrennzeichen',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal555: 'für 1.234 oder',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal562: 'Datumsformat',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal568: 'd.m.Y',
  editprojectmodal573: 'für 31.12.2024 oder',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal578: 'Zeitformat',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal584: 'Sein',
  editprojectmodal589: 'für 14:30:00 oder',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal596: 'Währungssymbol',
  editprojectmodal602: '€',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: 'CHF',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: 'Zeitzone',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal620: 'Europa/Wien',
  editprojectmodal621: 'Europe/Berlin',
  editprojectmodal622: 'Europe/Zurich',
  editprojectmodal623: 'Europa/London',
  editprojectmodal624: 'Amerika/New_York',
  editprojectmodal625: 'Amerika/Chicago',
  editprojectmodal626: 'Amerika/Los Angeles',
  editprojectmodal627: 'Asien/Tokio',
  editprojectmodal628: 'Asien/Dubai',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal629: 'koordinierte Weltzeit',
  editprojectmodal634: 'Zeitzone für Datum/Zeit-Operationen',
  editprojectmodal641: 'Google Übersetzer-API-Schlüssel',
  editprojectmodal652: 'API-Schlüssel für automatische Übersetzungen via Google Translate',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal689: 'Abbrechen',
  editprojectmodal696: 'Änderungen speichern',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal317: 'Tabellenname ist erforderlich',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal319: 'Tabellenname ist erforderlich',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal322: 'Alle Felder müssen einen Namen haben',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal324: 'Alle Felder müssen einen Namen haben',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal329: 'Feldnamen müssen eindeutig sein',
  edittablemodal335: 'Der Dateischlüsselname ist erforderlich',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal337: 'Der Dateischlüsselname ist erforderlich',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: 'Der ausgewählte Dateischlüsselname muss ein Primärschlüssel, ein eindeutiger Schlüssel oder ein indiziertes Feld sein',
  edittablemodal397: 'Tabellenname *',
  edittablemodal407: 'z. B. Benutzer, Produkte, Bestellungen',
  edittablemodal413: 'Dateischlüsselname *',
  edittablemodal422: 'Schlüsselfeld auswählen...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal424: 'Schlüsselfeld auswählen...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal425: '- Auto Inc',
  edittablemodal436: 'Dateiname umbenannt',
  edittablemodal445: 'z. B. CustomUser, ProductCatalog',
  edittablemodal454: 'Dateiname kurz',
  edittablemodal476: 'Felder *',
  edittablemodal486: 'Feld hinzufügen',
  edittablemodal497: 'Name',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal499: 'Name',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal504: 'Feldname',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: 'Typ',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal534: 'Kontrolle',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal536: 'Kontrolle',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal614: 'Kommentar',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal616: 'Kommentar',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: 'Feldbeschreibung',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal623: 'Feldbeschreibung',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal632: 'Feld entfernen',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal634: 'Feld entfernen',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal644: 'Link-Tabelle',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal646: 'Link-Tabelle',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal651: '-- Tabelle auswählen --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal653: '-- Tabelle auswählen --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal660: 'Wertefeld',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal662: 'Wertefeld',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal667: '-- Wertefeld --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal669: '-- Wertefeld --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal676: 'Anzeigefeld',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal678: 'Anzeigefeld',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal683: '-- Anzeigefeld --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal685: '-- Anzeigefeld --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal692: 'Bestellfeld',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal694: 'Bestellfeld',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal699: '-- Bestellfeld --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal701: '-- Bestellfeld --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal708: 'Richtung',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal710: 'Richtung',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal739: 'Abbrechen',
  edittablemodal750: 'Aktualisierung...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal752: 'Aktualisierung...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal755: 'Tabelle aktualisieren',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal757: 'Tabelle aktualisieren',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: 'Bitte geben Sie einen Teilnahmecode ein',
  joincodemodal51: 'Nicht authentifiziert',
  joincodemodal63: 'Wir haben überall gesucht',
  joincodemodal66: 'Ungültiger Beitrittscode',
  joincodemodal73: 'Sie haben sich bereits für dieses Projekt beworben',
  joincodemodal80: 'Fehler beim Suchen des Projekts',
  joincodemodal95: 'Nicht authentifiziert',
  joincodemodal113: 'Antrag konnte nicht übermittelt werden',
  joincodemodal117: 'Antrag erfolgreich übermittelt! Der Projektinhaber wird Ihre Anfrage prüfen.',
  joincodemodal_toast_detail: 'Bitte warten Sie, bis',
  joincodemodal_toast_detail2: 'die Bewerbung bearbeitet hat.',
  joincodemodal129: 'Fehler beim Senden der Bewerbung',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal147: ', Monat:',
  joincodemodal148: ', Tag:',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: 'Projekt beitreten',
  joincodemodal157: 'Für das Projekt bewerben',
  joincodemodal158: 'Bewerbung gesendet',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal181: 'Code beitreten',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: 'Eingeben',
  joincodemodal200: 'Nachschlagen',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: 'Geben Sie den vom Projektbesitzer bereitgestellten Projektbeitrittscode ein.',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: 'Projektinformationen',
  joincodemodal220: 'Keine Beschreibung angegeben',
  joincodemodal226: 'Eigentümer:',
  joincodemodal237: 'Erstellt:',
  joincodemodal247: 'Teams',
  joincodemodal261: 'Sagen Sie dem Projektbesitzer, warum Sie an diesem Projekt teilnehmen möchten ...',
  joincodemodal277: 'Bewerbung abgeschickt!',
  joincodemodal288: 'Abbrechen',
  joincodemodal299: 'Zurück',
  joincodemodal306: 'Senden...',
  joincodemodal316: 'Erledigt',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: 'Einladung konnte nicht gesendet werden',
  manageteammodal132: 'Netzwerkfehler aufgetreten',
  manageteammodal139: 'Dieses Mitglied aus dem Team entfernen?',
  manageteammodal144: 'LÖSCHEN',
  manageteammodal155: 'Das Entfernen des Mitglieds ist fehlgeschlagen.',
  manageteammodal158: 'Das Entfernen des Mitglieds ist fehlgeschlagen.',
  manageteammodal181: 'Rollenänderung fehlgeschlagen',
  manageteammodal184: 'Rollenänderung fehlgeschlagen',
  manageteammodal189: 'Diese Einladung stornieren?',
  manageteammodal194: 'LÖSCHEN',
  manageteammodal206: 'Einladung konnte nicht abgebrochen werden',
  manageteammodal209: 'Einladung konnte nicht abgebrochen werden',
  manageteammodal244: 'Team wird geladen...',
  manageteammodal283: 'Überblick',
  manageteammodal284: 'Mitglieder (${team.members?.length || 0})',
  manageteammodal297: '{tab.label}',
  manageteammodal308: 'Teaminformationen',
  manageteammodal312: 'Teamname',
  manageteammodal316: 'Projekt',
  manageteammodal320: 'Eigentümer',
  manageteammodal321: 'Unbekannt',
  manageteammodal324: 'Status',
  manageteammodal328: 'Inaktiv',
  manageteammodal334: 'Beschreibung',
  manageteammodal347: 'Teammitglieder',
  manageteammodal354: 'Mitglied einladen',
  manageteammodal362: 'Neues Mitglied einladen',
  manageteammodal366: 'Benutzername (erforderlich) *',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal373: 'z. B. Junction77',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal377: 'E-Mail (optional)',
  manageteammodal383: 'Optionale Benachrichtigungs-E-Mail',
  manageteammodal388: 'Rolle',
  manageteammodal394: 'Mitglied',
  manageteammodal395: 'Administrator',
  manageteammodal399: 'Nachricht (optional)',
  manageteammodal404: 'Willkommensnachricht zur Einladung',
  manageteammodal432: 'Senden...',
  manageteammodal437: 'Einladung senden',
  manageteammodal456: '{Mitglied.Benutzer.E-Mail}',
  manageteammodal469: 'Zum Administrator befördern',
  manageteammodal477: 'Zum Mitglied degradieren',
  manageteammodal485: 'Mitglied entfernen',
  manageteammodal501: 'Ausstehende Einladungen',
  manageteammodal505: 'Keine ausstehenden Einladungen',
  manageteammodal534: 'Einladung abbrechen',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal553: 'Schließen',

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal179: 'Nicht authentifiziert',
  membermodal191: 'Teamdetails konnten nicht geladen werden',
  membermodal244: 'Daten konnten nicht geladen werden',
  membermodal297: 'Nicht authentifiziert',
  membermodal316: 'Das Hinzufügen eines Mitglieds zum Team ist fehlgeschlagen.',
  membermodal323: 'Erfolg',
  membermodal335: 'Fehler',
  membermodal336: 'Das Hinzufügen eines Mitglieds zum Team ist fehlgeschlagen.',
  membermodal348: 'Warnung',
  membermodal349: 'Teambesitzer kann nicht entfernt werden',
  membermodal357: 'Mitglied entfernen',
  membermodal365: 'Nicht authentifiziert',
  membermodal369: 'LÖSCHEN',
  membermodal378: 'Das Entfernen des Mitglieds ist fehlgeschlagen.',
  membermodal383: 'Erfolg',
  membermodal384: 'Mitglied erfolgreich entfernt',
  membermodal394: 'Fehler',
  membermodal395: 'Das Entfernen des Mitglieds ist fehlgeschlagen.',
  membermodal407: 'Warnung',
  membermodal408: 'Die Rolle des Eigentümers kann nicht geändert werden',
  membermodal417: 'Nicht authentifiziert',
  membermodal432: 'Fehler beim Aktualisieren der Rolle',
  membermodal437: 'Erfolg',
  membermodal438: 'Mitgliederrolle erfolgreich aktualisiert',
  membermodal448: 'Fehler',
  membermodal449: 'Fehler beim Aktualisieren der Rolle',
  membermodal458: 'Mitglied',
  membermodal459: 'Administrator',
  membermodal479: 'Verfügbar',
  membermodal483: 'Verfügbar',
  membermodal509: 'Das ist die',
  membermodal527: 'Eigentümer',
  membermodal536: 'Aus dem Team entfernen',
  membermodal549: 'Zu Team zuweisen',
  membermodal582: 'Verfügbar',
  membermodal590: 'Keine Mitglieder gefunden',
  membermodal597: 'Mitglied',
  membermodal603: 'Rolle',
  membermodal609: 'Beigetreten',
  membermodal614: 'Aktionen',
  membermodal625: 'Schließen',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal53: 'Nicht authentifiziert',
  pendinginvitationmodal70: 'Ausstehende Einladung konnte nicht geladen werden',
  pendinginvitationmodal76: 'Fehler beim Laden der Einladung',
  pendinginvitationmodal97: 'Nicht authentifiziert',
  pendinginvitationmodal112: 'Willkommen im Team! 🎉',
  pendinginvitationmodal118: 'Einladung konnte nicht angenommen werden',
  pendinginvitationmodal121: 'Fehler beim Akzeptieren der Einladung',
  pendinginvitationmodal136: 'Nicht authentifiziert',
  pendinginvitationmodal151: 'Einladung abgelehnt',
  pendinginvitationmodal157: 'Einladung konnte nicht abgelehnt werden',
  pendinginvitationmodal160: 'Fehler beim Ablehnen der Einladung',
  pendinginvitationmodal169: '✅ Projekt annehmen und beitreten',
  pendinginvitationmodal176: '❌ Ablehnen',
  pendinginvitationmodal189: '🎉 Projekteinladung',
  pendinginvitationmodal200: 'Einladung wird geladen...',

  // resources/js/Components/Modals/PendingInvitationModal.tsx
  pendinginvitationmodal213: 'Schließen Sie Ihre Registrierung ab, indem Sie diese Einladung annehmen',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal234: 'Eingeladen von:',
  pendinginvitationmodal244: 'Ihre Rolle:',
  pendinginvitationmodal251: 'Projektinhaber:',
  pendinginvitationmodal261: 'Läuft ab:',
  pendinginvitationmodal270: 'Persönliche Nachricht:',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal45: 'Mitglied',
  projectinvitationsmodal46: 'Administrator',
  projectinvitationsmodal74: 'Nicht authentifiziert',
  projectinvitationsmodal86: 'Einladungen konnten nicht geladen werden',
  projectinvitationsmodal93: 'Fehler beim Laden der Einladungen',
  projectinvitationsmodal100: '=== useEffect ausgelöst ===',
  projectinvitationsmodal102: 'Einladungen werden geladen …',
  projectinvitationsmodal113: '=== EINLADUNG SENDEN START ===',
  projectinvitationsmodal118: 'Staaten freigegeben, im Begriff abzuholen',
  projectinvitationsmodal122: 'Nicht authentifiziert',
  projectinvitationsmodal141: 'Antwort erhalten:',
  projectinvitationsmodal144: 'Einladung konnte nicht gesendet werden',
  projectinvitationsmodal147: 'Meldung zum erfolgreichen Einrichten...',
  projectinvitationsmodal148: '✅ Einladung erfolgreich gesendet! E-Mail zugestellt.',
  projectinvitationsmodal150: 'Clearing-Formular...',
  projectinvitationsmodal153: 'ERFOLGSMELDUNG IST JETZT EINGESTELLT - sollte sichtbar sein!',
  projectinvitationsmodal157: 'Einladung zur Liste hinzufügen - Rohdaten:',
  projectinvitationsmodal171: 'Du',
  projectinvitationsmodal177: 'Angereicherte Einladung hinzufügen:',
  projectinvitationsmodal182: 'OnSuccess-Rückruf wird aufgerufen ...',
  projectinvitationsmodal187: 'Automatische Löscherfolgsmeldung nach 5 Sekunden',
  projectinvitationsmodal191: '=== EINLADUNG SENDEN ENDE - ERFOLGREICH ===',
  projectinvitationsmodal193: 'Fehler beim Senden der Einladung',
  projectinvitationsmodal204: 'Einladung abbrechen',
  projectinvitationsmodal212: 'LÖSCHEN',
  projectinvitationsmodal220: '✅ Einladung erfolgreich storniert',
  projectinvitationsmodal229: 'Einladung konnte nicht abgebrochen werden',
  projectinvitationsmodal232: 'Einladung konnte nicht abgebrochen werden',
  projectinvitationsmodal243: 'Einladung erneut senden',
  projectinvitationsmodal261: 'Einladung erneut gesendet',
  projectinvitationsmodal266: '✅ Einladung erfolgreich erneut gesendet! E-Mail zugestellt.',
  projectinvitationsmodal275: 'Einladung konnte nicht erneut gesendet werden',
  projectinvitationsmodal278: 'Einladung konnte nicht erneut gesendet werden',
  projectinvitationsmodal286: 'Ausstehend',
  projectinvitationsmodal287: 'Akzeptiert',
  projectinvitationsmodal288: 'Abgelehnt',
  projectinvitationsmodal289: 'Abgelaufen',
  projectinvitationsmodal305: 'Einladung abbrechen',
  projectinvitationsmodal314: 'Einladung erneut senden',
  projectinvitationsmodal337: 'Schließen',
  projectinvitationsmodal360: 'Neue Einladung senden',
  projectinvitationsmodal364: 'E-Mail-Adresse *',

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: 'benutzer@beispiel.com',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal376: 'Rolle',
  projectinvitationsmodal387: 'Persönliche Nachricht (optional)',
  projectinvitationsmodal392: 'Fügen Sie der Einladung eine persönliche Nachricht hinzu...',
  projectinvitationsmodal398: 'Einladung senden',
  projectinvitationsmodal409: 'Vorhandene Einladungen',
  projectinvitationsmodal414: 'Noch keine Einladungen verschickt',
  projectinvitationsmodal420: 'E-Mail',
  projectinvitationsmodal425: 'Rolle',
  projectinvitationsmodal433: 'Status',
  projectinvitationsmodal439: 'Gesendet',
  projectinvitationsmodal445: 'Läuft ab',
  projectinvitationsmodal450: 'Aktionen',

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: 'Projektmitglieder konnten nicht geladen werden',
  projectmembersmodal63: 'Fehler beim Laden der Projektmitglieder',
  projectmembersmodal84: 'LÖSCHEN',
  projectmembersmodal95: 'Das Entfernen des Mitglieds ist fehlgeschlagen.',
  projectmembersmodal98: 'Mitglied erfolgreich entfernt',
  projectmembersmodal101: 'Fehler beim Entfernen des Mitglieds',
  projectmembersmodal128: 'Aktualisierung der Mitgliedsrolle fehlgeschlagen',
  projectmembersmodal131: 'Mitgliederrolle erfolgreich aktualisiert',
  projectmembersmodal134: 'Fehler beim Aktualisieren der Mitgliedsrolle',
  projectmembersmodal141: 'Entfernung bestätigen',
  projectmembersmodal176: 'Mitglied',
  projectmembersmodal177: 'Administrator',
  projectmembersmodal193: 'Eigentümer',
  projectmembersmodal206: 'Rolle auswählen',
  projectmembersmodal221: 'Mitglied entfernen',
  projectmembersmodal238: 'Projektmitglieder - {project?.name}',
  projectmembersmodal264: 'Keine Mitglieder gefunden',
  projectmembersmodal270: 'Benutzer',
  projectmembersmodal276: 'Rolle',
  projectmembersmodal282: 'Beigetreten',
  projectmembersmodal287: 'Aktionen',
  projectmembersmodal296: 'Schließen',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: 'Teamname ist erforderlich',
  teammodal108: 'Nicht authentifiziert',
  teammodal132: 'Das Team konnte nicht gespeichert werden',
  teammodal137: 'Das Team konnte nicht gespeichert werden',
  teammodal146: 'Projekt auswählen',
  teammodal155: 'Neues Team erstellen',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal169: 'Teamname *',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal176: 'Teamnamen eingeben',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal182: 'Beschreibung',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: 'Geben Sie eine Teambeschreibung ein (optional)',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal195: 'Projekte',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: 'Projekte auswählen',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal222: 'Team ist aktiv',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal232: 'Abbrechen',
  teammodal240: 'Erstellen',

  // resources/js\Components\Panels\AuthPanel.tsx
  authpanel3: './RegisterPanel',
  authpanel4: './ProfilePanel',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: 'Englisch',
  cmsadminpanel41: 'Deutsch',
  cmsadminpanel42: 'Französisch',
  cmsadminpanel43: 'Spanisch',
  cmsadminpanel44: 'Italienisch',
  cmsadminpanel69: 'Seiten konnten nicht geladen werden:',
  cmsadminpanel106: 'Bitte füllen Sie alle Pflichtfelder aus',
  cmsadminpanel122: 'Seite erfolgreich aktualisiert!',
  cmsadminpanel129: 'Seite erfolgreich erstellt!',
  cmsadminpanel135: 'Seite konnte nicht gespeichert werden:',
  cmsadminpanel144: 'Löschung bestätigen',
  cmsadminpanel150: 'LÖSCHEN',
  cmsadminpanel152: 'Seite erfolgreich gelöscht!',
  cmsadminpanel155: 'Seite konnte nicht gelöscht werden:',
  cmsadminpanel170: 'Bearbeiten',
  cmsadminpanel178: 'Löschen',
  cmsadminpanel186: 'Seite anzeigen',
  cmsadminpanel195: 'Inaktiv',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel216: '📝 CMS-Seitenverwaltung',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: 'Neue Seite erstellen',
  cmsadminpanel241: 'Keine Seiten gefunden',
  cmsadminpanel244: 'Schnecke',
  cmsadminpanel245: 'Sprache',
  cmsadminpanel246: 'Titel',
  cmsadminpanel247: 'Status',
  cmsadminpanel250: 'Zuletzt aktualisiert',
  cmsadminpanel256: 'Aktionen',
  cmsadminpanel265: 'Neue Seite erstellen',
  cmsadminpanel272: 'Abbrechen',
  cmsadminpanel279: 'Speichern',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel291: 'Schnecke *',
  cmsadminpanel298: 'Hilfe, Impressum, Datenschutz...',
  cmsadminpanel309: 'Sprache *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: 'Wählen Sie eine Sprache',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel328: 'Titel *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: 'Seitentitel...',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel342: 'Inhalt *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: 'HTML-Quelle',
  cmsadminpanel363: 'HTML Quellcode mit Syntax-Highlighting',
  cmsadminpanel365: 'Formatieren',
  cmsadminpanel402: 'HTML-Code hier einfügen...',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel72: 'Fehler beim Generieren des Codes',
  codegenerationpanel75: 'Fehler beim Generieren des Codes',
  codegenerationpanel86: 'Für den ausgewählten Tabellenindex wurden keine Dateien gefunden',
  codegenerationpanel165: 'JavaScript-Funktion konnte nicht analysiert werden',
  codegenerationpanel166: 'Rohinhalt:',
  codegenerationpanel186: 'Batchausführung aller 278 JavaScript-Funktionen wird gestartet …',
  codegenerationpanel280: 'Keine generierten Dateien zum Download. Bitte führen Sie zuerst alle Funktionen aus.',
  codegenerationpanel286: '# Generierte Codedateien aus dem Templatensystem',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: 'Text/Plain',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel327: 'Codegenerierung',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel332: 'Template-ID',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel338: 'Geben Sie die Template-ID ein (z. B. 1).',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel344: 'Tabellenindex',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel351: 'Tabelle auswählen',
  codegenerationpanel358: 'Code generieren',
  codegenerationpanel374: 'Zusammenfassung der Generation:',
  codegenerationpanel387: 'Sauberes JavaScript',
  codegenerationpanel395: 'Ausführungsergebnis',
  codegenerationpanel399: 'Einzelne Datei ausführen',
  codegenerationpanel407: 'Alle Dateien ausführen',
  codegenerationpanel416: 'ZIP herunterladen',
  codegenerationpanel433: 'Klicken Sie auf „Einzelne Datei ausführen“ oder „Alle Dateien ausführen“, um die Ergebnisse anzuzeigen …',
  codegenerationpanel445: 'Leistung:',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel131: 'Nicht authentifiziert',
  databasemanagementpanel145: 'Schemas konnten nicht geladen werden',
  databasemanagementpanel152: 'Fehler beim Laden der Schemata',
  databasemanagementpanel221: 'Bitte wählen Sie mindestens eine Sprache aus',
  databasemanagementpanel231: 'Nicht authentifiziert',
  databasemanagementpanel245: 'Übersetzungen konnten nicht exportiert werden',
  databasemanagementpanel259: 'Übersetzungen erfolgreich exportiert',
  databasemanagementpanel261: 'Fehler beim Exportieren der Übersetzungen',
  databasemanagementpanel277: 'Nicht authentifiziert',
  databasemanagementpanel294: 'Übersetzungen konnten nicht importiert werden',
  databasemanagementpanel301: 'Fehler beim Importieren der Übersetzungen',
  databasemanagementpanel315: 'Nicht authentifiziert',
  databasemanagementpanel330: 'Schema konnte nicht erstellt werden',
  databasemanagementpanel336: 'Datenbankschema erfolgreich erstellt',
  databasemanagementpanel339: 'Fehler beim Erstellen des Schemas',
  databasemanagementpanel367: 'Nicht authentifiziert',
  databasemanagementpanel382: 'Schema konnte nicht aktualisiert werden',
  databasemanagementpanel388: 'Schema erfolgreich aktualisiert',
  databasemanagementpanel391: 'Fehler beim Aktualisieren des Schemas',
  databasemanagementpanel419: 'Nicht authentifiziert',
  databasemanagementpanel438: 'Schema konnte nicht zugeordnet werden',
  databasemanagementpanel447: 'Fehler beim Zuordnen des Schemas',
  databasemanagementpanel454: 'Das ist die',
  databasemanagementpanel485: 'Nicht zugewiesen',
  databasemanagementpanel516: 'Nicht authentifiziert',
  databasemanagementpanel520: 'LÖSCHEN',
  databasemanagementpanel529: 'Schema konnte nicht aus dem Projekt entfernt werden',
  databasemanagementpanel536: 'Fehler beim Entfernen des Schemas',
  databasemanagementpanel551: '(Kopie)',
  databasemanagementpanel567: 'Nicht authentifiziert',
  databasemanagementpanel585: 'Schema konnte nicht kopiert werden',
  databasemanagementpanel594: 'Fehler beim Kopieren des Schemas',
  databasemanagementpanel606: 'Der Schemaname stimmt nicht überein. Geben Sie den genauen Schemanamen ein, um das Löschen zu bestätigen.',
  databasemanagementpanel616: 'Nicht authentifiziert',
  databasemanagementpanel621: 'LÖSCHEN',
  databasemanagementpanel651: 'LÖSCHEN',
  databasemanagementpanel683: 'Fehler beim Löschen des Schemas',
  databasemanagementpanel714: 'Link zum Projekt',
  databasemanagementpanel735: 'Mit Projekt verknüpfen',
  databasemanagementpanel743: 'Schema bearbeiten',
  databasemanagementpanel749: 'Datenbank kopieren',
  databasemanagementpanel756: 'Im Datenbankdesigner öffnen',
  databasemanagementpanel763: 'Schema löschen',
  databasemanagementpanel771: 'Privat',
  databasemanagementpanel772: 'Öffentlich',
  databasemanagementpanel776: 'Verknüpft (Schreibgeschützte Referenz)',
  databasemanagementpanel777: 'Geklont (Privatkopie)',
  databasemanagementpanel778: 'Importiert (In vorhandenes einfügen)',
  databasemanagementpanel786: 'Datenbankschemata werden geladen …',
  databasemanagementpanel798: 'Datenbankverwaltung',
  databasemanagementpanel803: 'Neue Datenbank',
  databasemanagementpanel811: 'Aktualisieren',
  databasemanagementpanel829: 'Meine Datenbankschemata',
  databasemanagementpanel833: 'Keine Datenbankschemata gefunden. Erstellen Sie zunächst Ihr erstes Schema.',
  databasemanagementpanel840: 'Schemaname',
  databasemanagementpanel841: 'Beschreibung',
  databasemanagementpanel843: 'Zugewiesene Projekte',
  databasemanagementpanel849: 'Sichtweite',
  databasemanagementpanel855: 'Eigentümer',
  databasemanagementpanel861: 'Erstellt',
  databasemanagementpanel867: 'Aktionen',
  databasemanagementpanel876: 'Übersetzungsexport/-import',
  databasemanagementpanel886: 'Übersetzungen exportieren',
  databasemanagementpanel893: 'Übersetzungen importieren',
  databasemanagementpanel905: 'Neues Datenbankschema erstellen',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel917: 'Schemaname *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: 'Schemanamen eingeben',
  databasemanagementpanel937: 'Schemabeschreibung eingeben (optional)',
  databasemanagementpanel952: 'Sichtbarkeit auswählen',
  databasemanagementpanel963: 'Abbrechen',
  databasemanagementpanel970: 'Schema erstellen',
  databasemanagementpanel981: 'Datenbankschema bearbeiten',
  databasemanagementpanel999: 'Schemanamen eingeben',
  databasemanagementpanel1013: 'Schemabeschreibung eingeben (optional)',
  databasemanagementpanel1028: 'Sichtbarkeit auswählen',
  databasemanagementpanel1036: 'Abbrechen',
  databasemanagementpanel1043: 'Schema aktualisieren',
  databasemanagementpanel1054: 'Schema mit Projekt verknüpfen',
  databasemanagementpanel1070: 'Keine Beschreibung',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1077: 'Projekt auswählen *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: 'Wählen Sie ein Projekt aus',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1094: 'Link zum Projekt:',
  databasemanagementpanel1104: 'Zuordnungstyp',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: 'Benutzerdefinierter Name für dieses Schema im Projekt',
  databasemanagementpanel1131: 'Abbrechen',
  databasemanagementpanel1138: 'Link-Schema',
  databasemanagementpanel1163: 'Warnung vor dauerhafter Löschung',
  databasemanagementpanel1166: 'ALLE',
  databasemanagementpanel1174: '🎨 Alle Datenbank-Designer-Layouts',
  databasemanagementpanel1175: '⚙️ Alle Einschränkungen und Beziehungen',
  databasemanagementpanel1180: 'kann nicht rückgängig gemacht werden',
  databasemanagementpanel1210: 'Abbrechen',
  databasemanagementpanel1217: 'Für immer löschen',
  databasemanagementpanel1229: 'Übersetzungen nach Excel exportieren',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1244: 'Wählen Sie die Sprachen aus, die im Excel-Export berücksichtigt werden sollen. Der Export enthält alle Tabellen und Felder aus verknüpften Datenbanken.',
  databasemanagementpanel1250: 'Sprachen auswählen *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: 'Wählen Sie die zu exportierenden Sprachen aus',
  databasemanagementpanel1273: 'Abbrechen',
  databasemanagementpanel1280: 'Export nach Excel',
  databasemanagementpanel1292: 'Übersetzungen aus Excel importieren',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1307: 'Laden Sie eine Excel-Datei mit Übersetzungen hoch. Die Datei muss dem Exportformat entsprechen.',
  databasemanagementpanel1313: 'Excel-Datei hochladen *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: 'Excel-Datei auswählen',
  databasemanagementpanel1338: 'Abbrechen',
  databasemanagementpanel1350: 'Datenbankschema kopieren',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1365: 'Dadurch wird eine vollständige Kopie des Datenbankschemas einschließlich aller Tabellen, Felder, Einschränkungen und Designerlayouts erstellt. Die Kopie wird auf Version 1 gesetzt.',
  databasemanagementpanel1371: 'Neuer Schemaname *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: 'Geben Sie den Namen für das kopierte Schema ein',
  databasemanagementpanel1395: 'Abbrechen',
  databasemanagementpanel1402: 'Datenbank kopieren',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel51: 'Fira-Code',
  debugmanualgeneratorpanel127: 'Fira-Code',
  debugmanualgeneratorpanel136: 'Hier erscheint der generierte JavaScript-Code...',
  debugmanualgeneratorpanel162: 'Clipboard-API nicht verfügbar. Bitte manuell kopieren:',
  debugmanualgeneratorpanel165: 'Clipboard-Zugriff nicht möglich. Bitte prüfen Sie Browser-Einstellungen.',

  debugmanualgeneratorpanel214:   'Clipboard-API nicht verfügbar. Bitte manuell kopieren: 214',
  debugmanualgeneratorpanel217:   'Fehler beim Kopieren in die Zwischenablage',
  debugmanualgeneratorpanel486:   'Keine gültigen Template-Dateien für Template ',
  debugmanualgeneratorpanel486a:  'gefunden',
  debugmanualgeneratorpanel490:   'Fehler beim Laden der Template-Dateien: ',
  debugmanualgeneratorpanel990:   'Backend-Template zu umfangreich ',
  debugmanualgeneratorpanel990a:  'von max. ',
  debugmanualgeneratorpanel990b:  'Template enthält zu viele Tabellen oder komplexe Strukturen.',
  debugmanualgeneratorpanel1035:  '❌ Datei für ausgewählte Konfiguration nicht gefunden',
  debugmanualgeneratorpanel1036:  '🔍 Gesuchte Konfiguration:',
  debugmanualgeneratorpanel1037:  'Template:',
  debugmanualgeneratorpanel1038:  'Datei:',
  debugmanualgeneratorpanel1039:  'Typ:',
  debugmanualgeneratorpanel1047:  'Sprache:',
  debugmanualgeneratorpanel1050:  '📋 Verfügbare Dateien ',
  debugmanualgeneratorpanel1056:  'weitere',
  debugmanualgeneratorpanel1060:  '💡 Lösung: Prüfen Sie Template-Konfiguration und Backend-Response.',
  debugmanualgeneratorpanel1092:  '⚠️ Speicher-Warnung: ',
  debugmanualgeneratorpanel1092a: '% Speicher belegt. Template könnte zu komplex für sicheren Betrieb sein.',
  debugmanualgeneratorpanel1129:  ' Funktion',
  debugmanualgeneratorpanel1129a: ' wurde im globalen Gültigkeitsbereich nicht gefunden.',
  debugmanualgeneratorpanel1144:  ' ⚠️ WARNUNG: Template-Ausführung dauerte ',
  debugmanualgeneratorpanel1144a: ' ms (>5s). Erwägen Sie Template-Vereinfachung.',
  debugmanualgeneratorpanel1148:  ' 📊 Leistung:',
  debugmanualgeneratorpanel1148a:  ' ms, Speicher: ',
  debugmanualgeneratorpanel1155:  '❌ Ausführung fehlgeschlagen!\n\nBitte kontrollieren Sie den ',
  debugmanualgeneratorpanel1155a: '  Tab für Details.\n\nFehler: ',
  debugmanualgeneratorpanel1201:  '❌ JavaScript-Syntax-Fehler im Template ',
  debugmanualgeneratorpanel1201a: '🔍 Problem:',
  debugmanualgeneratorpanel1201b: '💡 Häufige Ursachen:\n• Fehlende oder extra Anführungszeichen\n• Unvollständige Variablen wie {item.\n• Falsche Klammern in Schleifen\n• Sonderzeichen die escapt werden müssen\n\n🛠️ Lösung: Prüfen Sie Template-Syntax und {variablename} Platzhalter.',
  debugmanualgeneratorpanel1208:  '❌ Template-Variable nicht gefunden ',
  debugmanualgeneratorpanel1208a: '🔍 Problem: Variable',
  debugmanualgeneratorpanel1208b: ' ist nicht definiert\n📄 Details: ',
  debugmanualgeneratorpanel1208c: '💡 Mögliche Ursachen:\n• gtree wurde nicht geladen\n• Tabelle/Projekt nicht ausgewählt\n• Variable existiert nicht in der Datenstruktur\n• Tippfehler in Variablenname\n\n🛠️ Lösung: Prüfen Sie die ',
  debugmanualgeneratorpanel1208d: ' Variable oder wählen Sie Tabelle/Projekt aus.',
  debugmanualgeneratorpanel1211a: '🔍 Problem:',
  debugmanualgeneratorpanel1211:  '❌ Typ-Fehler im Template ',
  debugmanualgeneratorpanel1211b: '💡 Häufige Ursachen:\n• Zugriff auf undefined/null Werte\n• Falsche Array-Zugriffe wie tables[]\n• Fehlende lang-Arrays in gtree\n• Falsche selectedlanguageindex\n\n🛠️ Lösung: Prüfen Sie Datenstrukturen und Array-Zugriffe.',
  debugmanualgeneratorpanel1214:  '❌ Template-Ausführungsfehler ',
  debugmanualgeneratorpanel1214a: '🔍 Problem:',
  debugmanualgeneratorpanel1214b: '📝 Typ:',
  debugmanualgeneratorpanel1214c: '💡 Debug-Tipps:\n• Öffnen Sie Browser Console (F12) für Details\n• Prüfen Sie das generierte JavaScript\n• Vereinfachen Sie das Template zum Testen\n\n🛠️ Bei wiederholten Problemen: Template-Syntax vereinfachen.',

  debugmanualgeneratorpanel352: 'Keine Templates gefunden. Bitte erstellen Sie zuerst Templates im Template Management.',
  debugmanualgeneratorpanel358: 'Fehler beim Laden der Templates',
  debugmanualgeneratorpanel420: 'Fehler beim Laden der Template-Dateien',
  debugmanualgeneratorpanel499: 'Unbekannter Tisch',
  debugmanualgeneratorpanel563: 'Unbekannter Tisch',
  debugmanualgeneratorpanel600: 'Demo-Schema (Fallback)',
  debugmanualgeneratorpanel746: 'Bitte Template und Datei auswählen',
  debugmanualgeneratorpanel753: 'Bitte Projekt auswählen',
  debugmanualgeneratorpanel758: 'Bitte Tabelle auswählen',
  debugmanualgeneratorpanel763: 'Bitte Sprache auswählen',
  debugmanualgeneratorpanel768: 'Diese Datei unterstützt keine Code-Generierung (Static File)',
  debugmanualgeneratorpanel928: '❌ Datei für ausgewählte Konfiguration nicht gefunden',
  debugmanualgeneratorpanel936: 'Unbekannt',
  debugmanualgeneratorpanel940: 'Unbekannt',
  debugmanualgeneratorpanel946: 'Unbekannt',
  debugmanualgeneratorpanel953: '💡 Lösung: Prüfen Sie Template-Konfiguration und Backend-Response.',
  debugmanualgeneratorpanel959: 'Fehler beim Laden des Codes',
  debugmanualgeneratorpanel962: 'Fehler beim Laden des Codes',
  debugmanualgeneratorpanel970: 'Kein Code zum Ausführen vorhanden',
  debugmanualgeneratorpanel1026: 'Im generierten Code wurde keine Funktion gefunden',
  debugmanualgeneratorpanel1048: 'Debug-Hilfe',
  debugmanualgeneratorpanel1093: 'Syntaxfehler',
  debugmanualgeneratorpanel1096: 'Referenzfehler',
  debugmanualgeneratorpanel1107: 'Unbekannt',
  debugmanualgeneratorpanel1111: 'Syntaxfehler',
  debugmanualgeneratorpanel1174: 'Fehler: Konnte JavaScript-Funktion nicht parsen',
  debugmanualgeneratorpanel1183: 'Unbekannter Fallback-Fehler',
  debugmanualgeneratorpanel1203: 'Unbekannt',
  debugmanualgeneratorpanel1210: 'Unbenannt (Unbekannt)',
  debugmanualgeneratorpanel1229: 'Unbekannt',
  debugmanualgeneratorpanel1259: '🔧 Debug Manual Generator',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1260: 'Templateentwicklung und Code-Debugging für einzelne Dateien',
  debugmanualgeneratorpanel1270: '📄 Template',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1277: 'Template wählen',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1284: '📝 Template Datei',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1293: 'Datei wählen',
  debugmanualgeneratorpanel1302: '(nicht benötigt)',
  debugmanualgeneratorpanel1310: 'Nicht benötigt für diesen File-Typ',
  debugmanualgeneratorpanel1319: '(nicht benötigt)',
  debugmanualgeneratorpanel1325: '❌ Syntaxfehler im Template',
  debugmanualgeneratorpanel1334: '(benötigt)',
  debugmanualgeneratorpanel1342: '🌐 Sprache wählen',
  debugmanualgeneratorpanel1355: '🏗️ Projekt',
  debugmanualgeneratorpanel1360: 'Template-Quelle im Code einschließen',
  debugmanualgeneratorpanel1369: 'Code holen',
  debugmanualgeneratorpanel1377: 'Code ausführen',
  debugmanualgeneratorpanel1385: '🔍 Debug-Helfer',
  debugmanualgeneratorpanel1396: 'Nicht ausgewählt',
  debugmanualgeneratorpanel1397: 'Beheben Sie diese Syntaxfehler, bevor Sie den Code generieren. Das Template funktioniert sonst nicht korrekt!',
  debugmanualgeneratorpanel1398: 'Unbekannt',
  debugmanualgeneratorpanel1399: 'Nicht ausgewählt',
  debugmanualgeneratorpanel1400: '⚠️ Der generierte Code kann Fehler oder ungültiges JavaScript enthalten!',
  debugmanualgeneratorpanel1473: '🔴 Kein Projekt für die Projektdateivorlage ausgewählt',
  debugmanualgeneratorpanel1476: '🔴 Keine Tabelle für die db_table_file-Template ausgewählt',
  debugmanualgeneratorpanel1479: '🟡 Keine Sprache für sprachfähige Templates ausgewählt',
  debugmanualgeneratorpanel1482: '🔴 Gefundene Tabellen[] - fehlender Tabellenindex',
  debugmanualgeneratorpanel1531: '1. Vorbereiteter Code',
  debugmanualgeneratorpanel1537: 'GTree kopieren',
  debugmanualgeneratorpanel1564: 'GTree herunterladen',
  debugmanualgeneratorpanel1583: 'Download fehlgeschlagen. Bitte prüfen Sie die GTree-Daten.',
  debugmanualgeneratorpanel1591: 'Code kopieren',
  debugmanualgeneratorpanel1621: 'Code Editor konnte nicht geladen werden',
  debugmanualgeneratorpanel1622: 'Verwenden Sie eine einfache Textarea als Fallback',
  debugmanualgeneratorpanel1628: 'Code abrufen',
  debugmanualgeneratorpanel1679: '2. Ausgeführtes Ergebnis',
  debugmanualgeneratorpanel1683: 'Generierter PHP-Code',
  debugmanualgeneratorpanel1686: 'Code kopieren',
  debugmanualgeneratorpanel1724: 'Download fehlgeschlagen.',
  debugmanualgeneratorpanel1739: '⚠️ Warnungen zur Templatesyntax',
  debugmanualgeneratorpanel1744: 'Klicken Sie auf \'Code ausführen\' um das Ergebnis zu sehen...',
  debugmanualgeneratorpanel1750: '3. 🔍 Debug-Helfer',
  debugmanualgeneratorpanel1755: 'Diese Warnungen werden Ihren Code nicht beschädigen, aber Sie sollten überlegen, sie zu beheben, um eine bessere Template-Qualität zu erzielen.',
  debugmanualgeneratorpanel1760: 'Klicken Sie auf \'🔍 Debug Helper\' um die Debug-Informationen zu sehen...',

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel31: 'Passwörter stimmen nicht überein',
  panelsegisterpanel54: 'Registrierung fehlgeschlagen',
  panelsegisterpanel57: 'Registrierung erfolgreich! Sie können sich jetzt anmelden.',
  panelsegisterpanel75: 'Ein Fehler ist aufgetreten',
  panelsegisterpanel90: 'Registrieren',
  panelsegisterpanel123: 'Ihr vollständiger Name',
  panelsegisterpanel154: 'Mindestens 8 Zeichen',
  panelsegisterpanel161: 'Passwort eingeben',
  panelsegisterpanel162: 'Schwach',
  panelsegisterpanel163: 'Mittel',
  panelsegisterpanel164: 'Stark',
  panelsegisterpanel176: 'Passwort wiederholen',
  panelsegisterpanel188: 'Registrieren',
  panelsegisterpanel198: 'Bereits ein Konto? Anmelden',

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: 'Zurück zur Lobby',
  panelsewnavigationpanel120: 'Willkommen',
  panelsewnavigationpanel128: 'Projekt',
  panelsewnavigationpanel133: 'Projektmanagement',
  panelsewnavigationpanel138: 'Einstellungen',
  panelsewnavigationpanel142: 'Projekt-Einstellungen',
  panelsewnavigationpanel161: 'Teams',
  panelsewnavigationpanel165: 'Team Management 💰',
  panelsewnavigationpanel170: 'Teamzuweisung',
  panelsewnavigationpanel184: 'Templates',
  panelsewnavigationpanel188: 'Template Verwaltung',
  panelsewnavigationpanel193: 'Template Zuweisung',
  panelsewnavigationpanel201: 'DB-Schemaabhängigkeiten',
  panelsewnavigationpanel211: 'Meine Bewerbungen',
  panelsewnavigationpanel216: 'Öffentliche Projekte',
  panelsewnavigationpanel223: 'Datenbank',
  panelsewnavigationpanel228: 'Datenbanken verwalten',
  panelsewnavigationpanel233: 'Datenbankdesigner 💰',
  panelsewnavigationpanel238: 'Schemaübersetzung',
  panelsewnavigationpanel246: 'Schema importieren',
  panelsewnavigationpanel251: 'Schema exportieren',
  panelsewnavigationpanel258: 'Generator',
  panelsewnavigationpanel263: 'Debug Manual Generator',
  panelsewnavigationpanel268: 'Codegenerierung',
  panelsewnavigationpanel273: 'Abfrage-Generator',
  panelsewnavigationpanel281: 'Verwaltung',
  panelsewnavigationpanel285: 'Systemeinstellungen',
  panelsewnavigationpanel290: 'Sprachmanagement',
  panelsewnavigationpanel298: 'CMS-Administrator',
  panelsewnavigationpanel315: 'Profil',
  panelsewnavigationpanel320: 'Plan ändern',
  panelsewnavigationpanel325: 'Zurück zur Lobby',
  panelsewnavigationpanel333: 'Ausloggen',
  panelsewnavigationpanel359: 'Konto',
  panelsewnavigationpanel364: 'Login',
  panelsewnavigationpanel369: 'Registrieren',
  panelsewnavigationpanel384: 'Menü einklappen',
  panelsewnavigationpanel394: 'Navigation',
  panelsewnavigationpanel413: 'Zurück zur Lobby',
  panelsewnavigationpanel422: 'Willkommen',
  panelsewnavigationpanel430: 'Projekt',
  panelsewnavigationpanel437: 'Projektmanagement',
  panelsewnavigationpanel443: 'Einstellungen',
  panelsewnavigationpanel459: 'Projekt-Einstellungen',
  panelsewnavigationpanel469: 'Teams',
  panelsewnavigationpanel477: 'Team Management',
  panelsewnavigationpanel488: 'Teamzuweisung',
  panelsewnavigationpanel496: 'Template Überprüfung',
  panelsewnavigationpanel504: 'Template Verwaltung',
  panelsewnavigationpanel508: 'Template Zuweisung',
  panelsewnavigationpanel513: 'DB-Schemaabhängigkeiten',
  panelsewnavigationpanel521: 'Meine Bewerbungen',
  panelsewnavigationpanel525: 'Öffentliche Projekte',
  panelsewnavigationpanel533: 'Datenbank',
  panelsewnavigationpanel540: 'Datenbanken verwalten',
  panelsewnavigationpanel544: 'Datenbankdesigner 💰',
  panelsewnavigationpanel548: 'Schemaübersetzung',
  panelsewnavigationpanel553: 'Schema importieren',
  panelsewnavigationpanel557: 'Schema exportieren',
  panelsewnavigationpanel565: 'Generator',
  panelsewnavigationpanel572: 'Debug Manual Generator',
  panelsewnavigationpanel576: 'Codegenerierung',
  panelsewnavigationpanel580: 'Abfrage-Generator',
  panelsewnavigationpanel589: 'Verwaltung',
  panelsewnavigationpanel596: 'Systemeinstellungen',
  panelsewnavigationpanel600: 'Sprachmanagement',
  panelsewnavigationpanel605: 'CMS-Administrator',
  panelsewnavigationpanel619: 'Konto',
  panelsewnavigationpanel644: 'Profil',
  panelsewnavigationpanel648: 'Plan ändern',
  panelsewnavigationpanel652: 'Zurück zur Lobby',
  panelsewnavigationpanel672: 'Ausloggen',
  panelsewnavigationpanel679: 'Login',
  panelsewnavigationpanel683: 'Registrieren',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: 'Versprechen',
  filemodal95: 'Bitte wählen Sie eine ZIP-Datei aus!',
  filemodal106: 'ZIP-Datei entfernt',
  filemodal111: 'Neue Datei hinzufügen',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal124: 'Dateiname *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: 'Bitte Dateinamen eingeben!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: 'z. B. Model.php, component.tsx, config.json',
  filemodal147: 'Template-Typ *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: 'Bitte Typ auswählen!',
  filemodal160: 'Typ auswÃ¤hlen',
  filemodal182: 'Bitte Zielverzeichnis eingeben!',
  filemodal185: 'Pfad:',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: 'z. B. /Komponenten/, /Dienste/, /App/Http/Controllers/',
  filemodal202: 'Inhaltstyp auswählen:',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal208: 'Text-Eingabe',
  filemodal215: 'ZIP-Upload',
  filemodal232: 'Bitte Dateiinhalt eingeben!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal268: 'ZIP-Datei hochladen',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: 'ZIP-Datei auswählen',
  filemodal287: 'ZIP-Datei hier ablegen oder klicken zum Auswählen',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal288: 'Unterstützt werden .zip Dateien mit Template-Strukturen',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: 'Entfernen',
  filemodal334: 'Abbrechen',
  filemodal340: 'Hinzufügen',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: 'E-Mail eingeben',
  forgotpasswordpanel30: 'Passwort zurücksetzen',
  forgotpasswordpanel52: 'Der Link zum Zurücksetzen konnte nicht gesendet werden.',
  forgotpasswordpanel55: 'Ein Link zum Zurücksetzen wurde an Ihre E-Mail-Adresse gesendet. Überprüfen Sie Ihren Posteingang.',
  forgotpasswordpanel59: 'Ein Fehler ist aufgetreten',
  forgotpasswordpanel73: 'Passwörter stimmen nicht überein',
  forgotpasswordpanel96: 'Das Passwort konnte nicht zurückgesetzt werden',
  forgotpasswordpanel99: 'Passwort erfolgreich zurückgesetzt! Sie können sich jetzt mit Ihrem neuen Passwort anmelden.',
  forgotpasswordpanel109: 'Ein Fehler ist aufgetreten',
  forgotpasswordpanel129: 'Passwort vergessen',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel164: 'Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.',
  forgotpasswordpanel170: 'E-Mail',
  forgotpasswordpanel178: 'Ihre E-Mail-Adresse@Beispiel.com',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: 'Link zum Zurücksetzen senden',
  forgotpasswordpanel197: 'Zurück zur Anmeldung',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel209: 'Geben Sie den Reset-Code aus der E-Mail und Ihr neues Passwort ein.',
  forgotpasswordpanel215: 'Reset-Code',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: 'Code aus der E-Mail',
  forgotpasswordpanel237: 'Neues Passwort',
  forgotpasswordpanel244: 'Passwort eingeben',
  forgotpasswordpanel245: 'Schwach',
  forgotpasswordpanel246: 'Mittel',
  forgotpasswordpanel247: 'Stark',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel252: 'Passwort bestätigen',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel259: 'Passwort wiederholen',
  forgotpasswordpanel272: 'Zurück',
  forgotpasswordpanel280: 'Passwort zurücksetzen',
  forgotpasswordpanel291: 'Zurück zur Anmeldung',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel76: 'Nicht autorisiert. Systemadministratorzugriff erforderlich.',
  languagemanagementpanel78: 'Sprachen konnten nicht geladen werden:',
  languagemanagementpanel120: 'Möchten Sie diese Sprache wirklich löschen?',
  languagemanagementpanel121: 'Sprache löschen',
  languagemanagementpanel124: 'Ja',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel125: 'NEIN',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel132: 'LÖSCHEN',
  languagemanagementpanel133: 'Sprache erfolgreich gelöscht',
  languagemanagementpanel136: 'Löschen der Sprache fehlgeschlagen:',
  languagemanagementpanel142: 'PATCH',
  languagemanagementpanel146: 'Umschalten des Sprachstatus fehlgeschlagen:',
  languagemanagementpanel152: 'PATCH',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: 'Standardsprache erfolgreich aktualisiert',
  languagemanagementpanel156: 'Fehler beim Festlegen der Standardsprache:',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: 'Sprache erfolgreich aktualisiert',
  languagemanagementpanel173: 'Sprache erfolgreich erstellt',
  languagemanagementpanel178: 'Sprache konnte nicht gespeichert werden:',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel183: '🇺🇸 Vereinigte Staaten',
  languagemanagementpanel184: '🇬🇧 Vereinigtes Königreich',
  languagemanagementpanel185: 'Deutschland',
  languagemanagementpanel186: '🇫🇷 Frankreich',
  languagemanagementpanel187: '🇪🇸 Spanien',
  languagemanagementpanel188: '🇮🇹 Italien',
  languagemanagementpanel189: '🇳🇱 Niederlande',
  languagemanagementpanel190: '🇵🇹 Portugal',
  languagemanagementpanel191: '🇷🇺 Russland',
  languagemanagementpanel192: '🇯🇵 Japan',
  languagemanagementpanel193: '🇰🇷 Südkorea',
  languagemanagementpanel194: '🇨🇳 China',
  languagemanagementpanel195: '🇧🇷 Brasilien',
  languagemanagementpanel196: '🇲🇽 Mexiko',
  languagemanagementpanel197: '🇨🇦 Kanada',
  languagemanagementpanel198: '🇦🇺 Australien',
  languagemanagementpanel199: '🇮🇳 Indien',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel214: 'Inaktiv',
  languagemanagementpanel223: 'System',
  languagemanagementpanel251: 'Aktivieren',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: 'Als Standard festlegen',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: 'Die Standardsprache kann nicht gelöscht werden',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel291: 'Sprachmanagement',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: 'Sprache hinzufügen',
  languagemanagementpanel317: 'Zeilen pro Seite Dropdown Erste Seite Link Vorherige Seite Link Aktuelle Seite Bericht Nächste Seite Link Letzte Seite Link',
  languagemanagementpanel324: 'Keine Sprachen gefunden',
  languagemanagementpanel326: 'Flagge',
  languagemanagementpanel327: 'Code',
  languagemanagementpanel328: 'Name',
  languagemanagementpanel329: 'Einheimischer Name',
  languagemanagementpanel330: 'Status',
  languagemanagementpanel331: 'Sortierreihenfolge',
  languagemanagementpanel332: 'Schöpfer',
  languagemanagementpanel333: 'Beschreibung',
  languagemanagementpanel334: 'Aktionen',
  languagemanagementpanel340: 'Neue Sprache hinzufügen',
  languagemanagementpanel352: 'Abbrechen',
  languagemanagementpanel359: 'Erstellen',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel371: 'Sprachcode *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: 'Bitte geben Sie den Sprachcode ein',
  languagemanagementpanel379: 'Der Code darf höchstens 5 Zeichen lang sein',
  languagemanagementpanel380: 'Bitte geben Sie einen gültigen Sprachcode ein (z. B.',
  languagemanagementpanel410: 'Flagge auswählen',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel423: 'Englischer Name *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: 'Bitte geben Sie den Namen der Sprache ein',
  languagemanagementpanel431: 'Der Name darf maximal 100 Zeichen lang sein.',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: 'z. B. Englisch, Deutsch, Französisch',
  languagemanagementpanel449: 'Einheimischer Name *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: 'Bitte geben Sie den Namen in Ihrer Muttersprache ein',
  languagemanagementpanel457: 'Der native Name darf maximal 100 Zeichen lang sein',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: 'z. B. Englisch, Deutsch, Französisch',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: 'Die Beschreibung darf höchstens 1000 Zeichen umfassen.',
  languagemanagementpanel490: 'Optionale Beschreibung der Sprache',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel503: 'Sortierreihenfolge *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: 'Bitte Sortierreihenfolge eingeben',
  languagemanagementpanel511: 'Die Sortierreihenfolge muss 0 oder größer sein',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel548: 'Standardsprache',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel44: 'Fehler bei der Anmeldung',
  loginpanel74: 'Ein Fehler ist aufgetreten',
  loginpanel88: 'Login',

  // resources/js/Components/Panels/LoginPanel.tsx
  loginpanel106: 'E-Mail',
  loginpanel114: 'Ihre E-Mail-Adresse@Beispiel.com',
  loginpanel122: 'Passwort',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel129: 'Ihr Passwort',
  loginpanel141: 'Anmelden...',
  loginpanel152: 'Sie haben noch kein Konto? Registrieren',
  loginpanel160: 'Passwort vergessen?',

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel61: 'Nicht authentifiziert',
  myapplicationspanel73: 'Anwendungen konnten nicht geladen werden',
  myapplicationspanel80: 'Fehler beim Laden der Anwendungen',
  myapplicationspanel87: 'Das ist die',
  myapplicationspanel138: 'Keine Nachricht',
  myapplicationspanel164: 'Details anzeigen',
  myapplicationspanel201: 'Anwendungen werden geladen …',
  myapplicationspanel213: 'Meine Bewerbungen',
  myapplicationspanel217: 'Aktualisieren',
  myapplicationspanel228: 'Anwendungsverlauf',
  myapplicationspanel232: 'Keine Anwendungen',
  myapplicationspanel233: 'Sie haben sich noch für keine Projekte beworben.',
  myapplicationspanel242: 'Keine Anwendungen gefunden',
  myapplicationspanel248: 'Projekt',
  myapplicationspanel255: 'Nachricht',
  myapplicationspanel261: 'Status',
  myapplicationspanel268: 'Angewandt',
  myapplicationspanel276: 'Antwort',
  myapplicationspanel282: 'Aktionen',
  myapplicationspanel292: 'Anwendungsdetails',
  myapplicationspanel305: 'Projektinformationen',
  myapplicationspanel322: 'Informationen zur Anwendung',
  myapplicationspanel326: 'Status:',
  myapplicationspanel332: 'Angewandt:',
  myapplicationspanel338: 'Beitrittscode:',
  myapplicationspanel348: 'Ihre Nachricht:',
  myapplicationspanel358: 'Ablehnung',
  myapplicationspanel362: 'Bewertet von:',
  myapplicationspanel365: 'Datum:',
  myapplicationspanel369: 'Antwort:',
  myapplicationspanel381: 'Schließen',

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel112: 'Zurück zur Lobby',
  newnavigationpanel120: 'Willkommen',
  newnavigationpanel128: 'Projekt',
  newnavigationpanel133: 'Projektmanagement',
  newnavigationpanel138: 'Einstellungen',
  newnavigationpanel142: 'Projekt-Einstellungen',
  newnavigationpanel161: 'Teams',
  newnavigationpanel165: 'Team Management',
  newnavigationpanel170: 'Teamzuweisung',
  newnavigationpanel184: 'Templates',
  newnavigationpanel188: 'Template Verwaltung',
  newnavigationpanel193: 'Template Zuweisung',
  newnavigationpanel201: 'DB-Schemaabhängigkeiten',
  newnavigationpanel211: 'Meine Bewerbungen',
  newnavigationpanel216: 'Öffentliche Projekte',
  newnavigationpanel223: 'Datenbank',
  newnavigationpanel228: 'Datenbanken verwalten',
  newnavigationpanel233: 'Datenbankdesigner',
  newnavigationpanel238: 'Schemaübersetzung',
  newnavigationpanel246: 'Schema importieren',
  newnavigationpanel251: 'Schema exportieren',
  newnavigationpanel258: 'Generator',
  newnavigationpanel263: 'Debug Manual Generator',
  newnavigationpanel268: 'Codegenerierung',
  newnavigationpanel273: 'Abfrage-Generator',
  newnavigationpanel281: 'Verwaltung',
  newnavigationpanel285: 'Systemeinstellungen',
  newnavigationpanel290: 'Sprachmanagement',
  newnavigationpanel298: 'CMS-Administrator',
  newnavigationpanel315: 'Profil',
  newnavigationpanel320: 'Plan ändern',
  newnavigationpanel325: 'Zurück zur Lobby',
  newnavigationpanel333: 'Ausloggen',
  newnavigationpanel357: 'Kanban Board 💰',
  newnavigationpanel359: 'Konto',
  newnavigationpanel364: 'Login',
  newnavigationpanel369: 'Registrieren',
  newnavigationpanel384: 'Menü einklappen',
  newnavigationpanel394: 'Navigation',
  newnavigationpanel413: 'Zurück zur Lobby',
  newnavigationpanel422: 'Willkommen',
  newnavigationpanel430: 'Projekt',
  newnavigationpanel437: 'Projektmanagement',
  newnavigationpanel443: 'Einstellungen',
  newnavigationpanel459: 'Projekt-Einstellungen',
  newnavigationpanel469: 'Teams',
  newnavigationpanel477: 'Team Management',
  newnavigationpanel488: 'Teamzuweisung',
  newnavigationpanel496: 'Template',
  newnavigationpanel504: 'Template Verwaltung',
  newnavigationpanel508: 'Templatezuweisung',
  newnavigationpanel513: 'DB-Schemaabhängigkeiten',
  newnavigationpanel521: 'Meine Bewerbungen',
  newnavigationpanel525: 'Öffentliche Projekte',
  newnavigationpanel533: 'Datenbank',
  newnavigationpanel540: 'Datenbanken verwalten',
  newnavigationpanel544: 'Datenbankdesigner',
  newnavigationpanel548: 'Schemaübersetzung',
  newnavigationpanel553: 'Schema importieren',
  newnavigationpanel557: 'Schema exportieren',
  newnavigationpanel565: 'Generator',
  newnavigationpanel572: 'Debug Manual Generator',
  newnavigationpanel576: 'Codegenerierung',
  newnavigationpanel580: 'Abfrage-Generator',
  newnavigationpanel589: 'Verwaltung',
  newnavigationpanel596: 'Systemeinstellungen',
  newnavigationpanel600: 'Sprachmanagement',
  newnavigationpanel605: 'CMS-Administrator',
  newnavigationpanel619: 'Konto',
  newnavigationpanel635: '} text-gray-300`} title={isLoggedIn ? Benutzername :',
  newnavigationpanel644: 'Profil',
  newnavigationpanel648: 'Plan ändern',
  newnavigationpanel652: 'Zurück zur Lobby',
  newnavigationpanel672: 'Ausloggen',
  newnavigationpanel679: 'Login',
  newnavigationpanel683: 'Registrieren',

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: 'Unbekannter Benutzer',
  panelt1143: 'Datenbanken',
  panelt1147: 'Datenbanken',
  panelt1219: 'Dateivorschau',
  panelt1222: 'Dateivorschau',
  panelt1281: 'Fehler beim Laden der Projekte',
  panelt1287: 'Überprüfen Sie die Konsole auf Fehler',
  panelt1293: 'Weitere Einzelheiten finden Sie in der Browserkonsole.',
  panelt1416: 'Dateivorschau',
  panelt1506: 'teamChanged',
  panelt1509: 'teamChanged',
  panelt1521: 'DateiVorschauUpdate',
  panelt1524: 'DateiVorschauUpdate',
  panelt1680: 'Projekt',
  panelt1696: 'Projekt',
  panelt1725: 'Tisch',
  panelt1786: '📁 Navigation',
  panelt1791: 'Alles erweitern',
  panelt1798: 'Alles ausblenden',
  panelt1809: 'Projekte werden geladen...',
  panelt1813: 'Keine Projekte gefunden',
  panelt1833: 'Ausgewählt:',
  panelt1835: 'Name:',
  panelt1StandaloneTeams: 'Teams (nicht verknüpft)',
  panelt1StandaloneTemplates: 'Templates (nicht verknüpft)',
  panelt1StandaloneDatabases: 'Datenbanken (nicht verknüpft)',
  panelt1MyTeams: 'Meine Teams',
  panelt1MyTemplates: 'Meine Templates',
  panelt1MyDatabases: 'Meine Datenbanken',
  panelt1836: 'Typ:',
  panelt1837: 'AUSWEIS:',
  panelt1839: 'Weg:',
  panelt1842: 'Projekt-ID:',
  panelt1843: 'Pfad:',
  panelt1845: 'Team-ID:',
  panelt1848: 'Rolle:',
  panelt1853: 'Template-ID:',
  panelt1856: 'Tisch:',
  panelt1859: 'Sprache:',
  panelt1873: 'Gesamt',
  panelt1879: 'Ausgewählt',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: 'Tabelle bearbeiten',
  panelt2151: 'Tabelle löschen',
  panelt2179: 'Keine Felder',
  panelt2405: 'Authentifizierung erforderlich',
  panelt2439: 'Schemas konnten nicht geladen werden',
  panelt2443: 'Authentifizierung',
  panelt2551: 'Das Laden der Schemaversionen ist fehlgeschlagen',
  panelt2602: 'Schemaversion konnte nicht geladen werden',
  panelt2685: 'Keine Version verfügbar. Bitte erstellen Sie zuerst eine Schemaversion.',
  panelt2704: 'Keine Version ausgewählt oder Versions-ID fehlt. Bitte wählen Sie zuerst eine Schemaversion aus.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: 'Erstellen der Tabelle fehlgeschlagen',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: 'Keine Version oder Tabelle zum Bearbeiten ausgewählt. Bitte wählen Sie zuerst eine Schemaversion aus.',
  panelt2806: 'Tabelle konnte nicht aktualisiert werden',
  panelt2817: 'Tabelle konnte nicht aktualisiert werden',
  panelt2826: 'Kein Schema oder keine Version ausgewählt. Bitte wählen Sie zuerst ein Schema aus.',
  panelt2841: 'Neue Version konnte nicht erstellt werden',
  panelt2852: 'Neue Version konnte nicht erstellt werden',
  panelt2862: 'Kein Schema oder keine Version ausgewählt. Bitte wählen Sie zuerst ein Schema aus.',
  panelt2877: 'Neue Version konnte nicht erstellt werden',
  panelt2888: 'Neue Version konnte nicht erstellt werden',
  panelt2898: 'Keine Version ausgewählt. Bitte wählen Sie zuerst eine Schemaversion aus.',
  panelt2920: 'Versionsaktualisierung fehlgeschlagen',
  panelt2930: 'Keine Version ausgewählt. Bitte wählen Sie zuerst eine Schemaversion aus.',
  panelt2952: 'Versionsaktualisierung fehlgeschlagen',
  panelt21001: 'Tabelle konnte nicht gelöscht werden',
  panelt21010: 'Tabelle konnte nicht gelöscht werden',
  panelt21030: 'Keine Tabelle zum Löschen ausgewählt',
  panelt21054: 'Erstellen der Version und Löschen der Tabelle fehlgeschlagen',
  panelt21075: 'Erstellen der neuen Version und Löschen der Tabelle fehlgeschlagen',
  panelt21101: 'Keine Tabelle zum Löschen ausgewählt',
  panelt21122: 'Tabelle konnte nicht gelöscht werden',
  panelt21133: 'Kein Schema ausgewählt',
  panelt21144: 'Neue Version erstellen',
  panelt21153: 'Nicht authentifiziert',
  panelt21170: 'Neue Version konnte nicht erstellt werden',
  panelt21185: 'Neue Version konnte nicht erstellt werden',
  panelt21231: 'Nicht authentifiziert',
  panelt21245: 'Fremdschlüssel konnte nicht gelöscht werden',
  panelt21270: 'Fremdschlüssel konnte nicht gelöscht werden',
  panelt21282: '🗃️ Datenbankdesigner',
  panelt21289: 'Schemaversionen werden geladen …',
  panelt21291: 'Kein Schema ausgewählt',
  panelt21292: 'Kein Projekt ausgewählt',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: 'Kein Projekt ausgewählt',
  panelt21350: '🔄 Aktualisieren',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: 'Neue Version erstellen (aktuelle Version kopieren)',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21359: '➕ Neue Version',
  panelt21375: '✨ Neue Tabelle',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21402: 'Schema wird geladen...',
  panelt21439: 'positionAbsolute',
  panelt21511: 'Authentifizierung',
  panelt21515: 'Authentifizierung erforderlich',
  panelt21516: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich an, um auf die Schemadaten zuzugreifen.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21517: 'Melden Sie sich erneut über das Navigationsmenü an',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21525: 'Keine Schemadaten',
  panelt21528: 'Wählen Sie ein Projekt aus, um Schemata anzuzeigen',
  panelt21530: 'Keine Schemata mit diesem Projekt verknüpft',
  panelt21531: 'Wählen Sie ein Schema zur Visualisierung der Datenbankstruktur',
  panelt21549: '🔍 Tabellendetails',
  panelt21552: 'Tisch:',
  panelt21556: 'Felder:',
  panelt21560: 'Einschränkungen:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21564: 'Primärschlüssel:',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: 'eine neue Tabelle erstellen',
  panelt21600: 'Aktuell',
  panelt21629: 'Fremdschlüsselaktionen',
  panelt21635: 'Aus:',
  panelt21639: 'Zu:',
  panelt21654: 'Edit FK kommt in Phase 2! 🚀',
  panelt21689: 'Fremdschlüssel löschen',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21692: 'Möchten Sie diese Fremdschlüsseleinschränkung wirklich löschen?',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21699: 'Zwang:',
  panelt21703: 'Aus:',
  panelt21707: 'Zu:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21714: '⚠️ Für diese Änderung wird eine neue Version erstellt.',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21736: 'Fremdschlüssel löschen',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesCategoryAll: 'Alle Kategorien',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt367: 'Alle',
  panelt375: 'Nicht authentifiziert',
  panelt390: 'Das Laden der Templates ist fehlgeschlagen',
  panelt3103: 'Fehler beim Laden der Templates',
  panelt3115: 'Nicht authentifiziert',
  panelt3148: 'Fehler beim Laden der Projektvorlagen',
  panelt3158: 'Sprache geändert',
  panelt3161: 'Sprache geändert',
  panelt3201: 'Nicht authentifiziert',
  panelt3219: 'Fehler beim Zuweisen von Templates',
  panelt3231: 'Fehler beim Zuweisen von Templates',
  panelt3245: 'Nicht authentifiziert',
  panelt3250: 'LÖSCHEN',
  panelt3272: 'Fehler beim Entfernen der Template',
  panelt3287: 'Alle',
  panelt3295: 'Alle Kategorien',
  panelt3296: 'Web',
  panelt3297: 'Mobile',
  panelt3298: 'API',
  panelt3299: 'Desktop',
  panelt3300: 'Datenbank',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesLoadingText: 'Templates werden geladen...',
  templatesAssignmentTitle: 'Template Zuweisung',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3323: 'von ',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesWorkingOn: 'von ',
  templatesSelectProjectHint: 'Bitte wählen Sie ein Projekt aus der Navigation um Templates zu verwalten',
  templatesSearchPlaceholder: 'Templates suchen...',
  templatesFilterCategory: 'Nach Kategorie filtern',
  templatesNoTemplatesFound: 'Keine Templates gefunden',
  templatesSelectedCount: 'ausgewählt',
  templatesRemoveFromProject: 'Aus Projekt entfernen',
  templatesColumnName: 'Template Name',
  templatesColumnDescription: 'Beschreibung',
  templatesColumnCategory: 'Kategorie',
  templatesColumnLanguage: 'Sprache',
  templatesColumnStatus: 'Status',
  templatesStatusInactive: 'Inaktiv',
  templatesStatusActive: 'Aktiv',
  templatesColumnCreated: 'Erstellt',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3471: 'Das ist die',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesClearSelection: 'Auswahl aufheben',
  templatesAssignButton: 'Templates zuweisen',

  // resources/js\Components\Panels\PanelT5.tsx
  panelt538: 'Datenbank',
  panelt544: 'Website-Redesign',
  panelt555: 'Mobile App',
  panelt567: 'Modal.tsx',
  panelt572: 'README.md',
  panelt577: 'Unterlagen',
  panelt582: 'Vertrag.docx',
  panelt585: 'Berichte',
  panelt588: 'Q1-Bericht.xlsx',
  panelt589: 'Q2-Bericht.xlsx',
  panelt596: 'Vermögenswerte',
  panelt5235: '📁 Datenbank-Explorer',
  panelt5240: 'Alles erweitern',
  panelt5247: 'Alles ausblenden',
  panelt5271: 'Ausgewählt:',
  panelt5273: 'Name:',
  panelt5274: 'Typ:',
  panelt5275: 'AUSWEIS:',
  panelt5286: 'Gesamt',
  panelt5292: 'Ausgewählt',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel47: 'Nicht authentifiziert',
  profilepanel58: 'Benutzer-Daten konnten nicht geladen werden',
  profilepanel69: 'Ein Fehler ist aufgetreten',
  profilepanel84: 'Nicht authentifiziert',
  profilepanel100: 'Profil konnte nicht aktualisiert werden',
  profilepanel103: 'Profil erfolgreich aktualisiert',
  profilepanel107: 'Ein Fehler ist aufgetreten',
  profilepanel121: 'Neue Passwörter stimmen nicht überein',
  profilepanel129: 'Nicht authentifiziert',
  profilepanel145: 'Passwort konnte nicht geändert werden',
  profilepanel148: 'Passwort erfolgreich geändert',
  profilepanel156: 'Ein Fehler ist aufgetreten',
  profilepanel181: '{Benutzer?.E-Mail}',
  profilepanel200: 'Profil bearbeiten',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel204: 'Name',
  profilepanel218: 'E-Mail',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel234: 'Profil aktualisieren',
  profilepanel242: 'Passwort ändern',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel246: 'Aktuelles Passwort',
  profilepanel263: 'Neues Passwort',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel276: 'Passwort eingeben',
  profilepanel277: 'Schwach',
  profilepanel278: 'Mittel',
  profilepanel279: 'Stark',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel284: 'Neues Passwort bestätigen',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel302: 'Ändern...',
  profilepanel310: 'Kontoinformationen',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel314: 'Benutzer-ID',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel317: '{Benutzer-ID}',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel321: 'Registriert seit',
  profilepanel330: 'E-Mail verifiziert',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel355: 'Noch nie angemeldet',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel118: 'd.m.Y',
  projectpanel119: 'Aktuell: ',
  projectpanel121: 'Europa/Wien',
  projectpanel224: 'Projektnamen dürfen nur Kleinbuchstaben (a-z)',
  projectpanel232: 'Nicht authentifiziert',
  projectpanel253: 'Projektnamen dürfen nur Kleinbuchstaben (a-z)',
  projectpanel258: 'Projekt konnte nicht erstellt werden',
  projectpanel293: 'd.m.Y',
  projectpanel294: 'Sein',
  projectpanel296: 'Europa/Wien',
  projectpanel298: 'Projekt erfolgreich erstellt',
  projectpanel301: 'Projekt geändert',
  projectpanel304: 'Fehler beim Erstellen des Projekts',
  projectpanel330: 'd.m.Y',
  projectpanel331: 'Sein',
  projectpanel333: 'Europa/Wien',
  projectpanel348: 'Nicht authentifiziert',
  projectpanel352: 'LÖSCHEN',
  projectpanel361: 'Projekt konnte nicht gelöscht werden',
  projectpanel369: 'Projekt erfolgreich gelöscht',
  projectpanel372: 'Fehler beim Löschen des Projekts',
  projectpanel390: 'Das ist die',
  projectpanel405: 'Nicht authentifiziert',
  projectpanel416: 'Das Laden der Teams ist fehlgeschlagen.',
  projectpanel451: 'Nicht authentifiziert',
  projectpanel462: 'Schemas konnten nicht geladen werden',
  projectpanel492: 'Nicht authentifiziert',
  projectpanel539: 'Aktiv',
  projectpanel562: 'Projektübersicht',
  projectpanel575: 'Mitglieder verwalten',
  projectpanel583: 'Projekt bearbeiten',
  projectpanel589: 'Projekt löschen',
  projectpanel601: 'Projekte werden geladen...',
  projectpanel615: 'Projektmanagement',
  projectpanel626: 'Neues Projekt',
  projectpanel634: 'Projekt beitreten',
  projectpanel642: 'Aktualisieren',
  projectpanel671: 'Aktuelles Projekt',
  projectpanel678: 'Projekt bearbeiten',
  projectpanel692: 'Keine Beschreibung angegeben',
  projectpanel698: 'Eigentümer:',
  projectpanel706: 'Erstellt:',
  projectpanel716: 'Code beitreten',
  projectpanel724: 'Beitrittscode kopieren',
  projectpanel730: 'Privat',
  projectpanel742: 'Teams',
  projectpanel748: 'Mitglieder',
  projectpanel754: 'Templates',
  projectpanel760: 'Datenbanken',
  projectpanel766: 'Anwendungen',
  projectpanel773: 'Kein aktives Projekt',
  projectpanel774: 'Sie haben noch kein aktives Projekt.',
  projectpanel776: 'Projekt erstellen',
  projectpanel786: 'Schnellaktionen',
  projectpanel789: 'Anwendungen',
  projectpanel796: 'Projektmitglieder',
  projectpanel803: 'Teamverwaltung',
  projectpanel815: 'Einladungen',
  projectpanelAttachments: 'Anhänge',
  projectpanelKanban: 'Kanban Board',
  navAgileMethod: 'Agile Methoden',
  projectExport: 'Export',
  projectImport: 'Import',
  projectpanel822: 'Template',
  projectpanel838: 'Datenbank',
  projectpanel850: 'Alle Projekte',
  projectpanel854: 'Keine Projekte gefunden',
  projectpanel859: 'Projekt',
  projectpanel862: 'Eigentümer',
  projectpanel868: 'Erstellt',
  projectpanel874: 'Status',
  projectpanel879: 'Aktionen',
  projectpanel892: 'Neues Projekt erstellen',
  projectpanel904: 'Projekteinstellungen',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel907: 'Projektname *',
  projectpanel931: 'Beschreibung',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: 'Projektbeschreibung eingeben (optional)',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel955: 'Öffentliches Projekt',
  projectpanel959: 'Öffentliche Projekte sind für alle Benutzer sichtbar und können in der Projektgalerie entdeckt werden.',
  projectpanel972: 'Beitrittsanfragen zulassen',
  projectpanel976: 'Benutzer können mit einem Beitrittscode die Teilnahme an diesem Projekt beantragen.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel984: 'Datenbankverbindung',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel987: 'Datenbankname',
  projectpanel998: 'Name der Datenbank für dieses Projekt',
  projectpanel1004: 'Datenbanktyp',
  projectpanel1024: 'Server',
  projectpanel1038: 'Hafen',
  projectpanel1053: 'Benutzername',
  projectpanel1067: 'Passwort',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1084: 'Projekteigenschaften',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1087: 'Projektverzeichnis',
  projectpanel1098: 'Pfad wo generierte Dateien gespeichert werden sollen',
  projectpanel1104: 'Projekt-URL',
  projectpanel1115: 'URL für den Zugriff auf das Projekt',
  projectpanel1121: 'Startseite',
  projectpanel1128: 'index.php',
  projectpanel1138: 'Standardsprache',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1146: 'Englisch',
  projectpanel1147: 'Deutsch',
  projectpanel1148: 'Französisch',
  projectpanel1149: 'Spanisch',
  projectpanel1150: 'Italienisch',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1155: 'Standard-Sprache für Projekt-Generierung',
  projectpanel1161: 'Dateiname Kurze Länge',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1185: 'Lokalisierungseinstellungen',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1189: 'Dezimaltrennzeichen',
  projectpanel1207: 'Tausendertrennzeichen',
  projectpanel1227: 'Datumsformat',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1234: 'd.m.Y',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1244: 'Zeitformat',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1251: 'Sein',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: 'Währungssymbol',
  projectpanel1281: 'Zeitzone',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1289: 'Europa/Wien',
  projectpanel1290: 'Europe/Berlin',
  projectpanel1291: 'Europe/Zurich',
  projectpanel1292: 'Europa/London',
  projectpanel1293: 'Europa/Paris',
  projectpanel1294: 'Amerika/New_York',
  projectpanel1295: 'Amerika/Los Angeles',
  projectpanel1296: 'Asien/Tokio',
  projectpanel1297: 'Australien/Sydney',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1303: 'Standard-Zeitzone für Projekt',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1325: 'Abbrechen',
  projectpanel1332: 'Projekt erstellen',
  projectpanel1342: 'Projekt löschen',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: 'Möchten Sie dieses Projekt wirklich löschen?',
  projectpanel1362: 'Durch diese Aktion wird das Projekt und alle zugehörigen Daten ENDGÜLTIG gelöscht. Dies kann nicht rückgängig gemacht werden! Die mit diesem Projekt verknüpften Teams, Templates und Datenbanken bleiben erhalten.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1371: 'Abbrechen',
  projectpanel1378: 'Projekt löschen',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1434: '📋 Projekteigenschaften',
  projectpanel1437: 'Name:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1440: '📋 Projekteigenschaften',
  projectpanel1443: 'Name:',
  projectpanel1447: 'Eigentümer:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: 'Beitrittscode:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: 'Erstellt:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: 'Beschreibung:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1455: 'Beitrittscode:',
  projectpanel1459: 'Beschreibung:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1461: '👤 Projektmitglieder',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: '👤 Projektmitglieder',
  projectpanel1471: 'Mitglieder werden geladen...',
  projectpanel1481: 'Unbekannter Benutzer',
  projectpanel1482: 'Keine E-Mail',
  projectpanel1491: 'Mitglied',
  projectpanel1513: '👥 Teams & Mitglieder',
  projectpanel1517: 'Teams werden geladen …',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1529: '🗄️ Datenbankschemata',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: '🗄️ Datenbankschemata',
  projectpanel1539: 'Schemata werden geladen ...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1542: 'Mit diesem Projekt sind noch keine Datenbankschemata verknüpft.',
  projectpanel1550: '📄 Verknüpfte Templates',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: '📄 Verknüpfte Templates',
  projectpanel1560: 'Templates werden geladen …',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1563: 'Mit diesem Projekt sind noch keine Templates verknüpft.',
  projectpanel1573: 'Schließen',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: 'Projekt verwalten',
  projectpanel1585: 'Projekt verwalten',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: 'd.m.Y',
  projectsettingspanel65: 'Sein',
  projectsettingspanel67: 'Europa/Wien',
  projectsettingspanel143: 'd.m.Y',
  projectsettingspanel144: 'Sein',
  projectsettingspanel146: 'Europa/Wien',
  projectsettingspanel151: 'Fehler beim Laden der Projektdaten',
  projectsettingspanel190: 'Kein Projekt ausgewählt',
  projectsettingspanel209: 'Nicht authentifiziert',
  projectsettingspanel225: 'Projekt konnte nicht aktualisiert werden',
  projectsettingspanel243: 'Spracheinstellungen konnten nicht gespeichert werden',
  projectsettingspanel246: 'Projekt-Einstellungen erfolgreich gespeichert',
  projectsettingspanel251: 'Fehler beim Speichern der Projekt-Einstellungen',
  projectsettingspanel258: 'PROJ-',
  projectsettingspanel275: 'Bitte wählen Sie ein Projekt aus',
  projectsettingspanel276: 'selectedProject ist null',
  projectsettingspanel277: '🔍 ProjectSettingsPanel geladen, aber kein Projekt ausgewählt',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel295: 'Projekt-Einstellungen',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: 'Alle Änderungen speichern',
  projectsettingspanel313: 'Allgemein',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: 'Projektname *',
  projectsettingspanel331: 'Beschreibung',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel338: 'Projektbeschreibung eingeben',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel344: 'Beitrittscode',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel351: 'Beitrittscode (optional)',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel359: 'Benutzer können diesem Projekt mit diesem Code beitreten',
  projectsettingspanel375: 'Dieses Projekt für alle Benutzer sichtbar machen',
  projectsettingspanel382: 'Eigentümerschaft übertragen',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel405: 'Datenbank',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel408: 'Datenbankname',
  projectsettingspanel420: 'Datenbanktyp',
  projectsettingspanel463: 'Benutzername',
  projectsettingspanel475: 'Passwort',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel489: 'Eigenschaften',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel492: 'Projektverzeichnis',
  projectsettingspanel501: 'Pfad wo generierte Dateien gespeichert werden sollen',
  projectsettingspanel507: 'Projekt-URL',
  projectsettingspanel516: 'URL für den Zugriff auf das Projekt',
  projectsettingspanel522: 'Startseite',
  projectsettingspanel537: 'Standard-Sprache',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel544: 'Englisch',
  projectsettingspanel545: 'Deutsch',
  projectsettingspanel546: 'Französisch',
  projectsettingspanel547: 'Spanisch',
  projectsettingspanel548: 'Italienisch',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: 'Standard-Sprache für Projekt-Generierung',
  projectsettingspanel558: 'Dateiname Kurzlänge',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel565: '2 Zeichen',
  projectsettingspanel566: '3 Zeichen',
  projectsettingspanel567: '4 Zeichen',
  projectsettingspanel568: '5 Zeichen',
  projectsettingspanel578: 'Lokalisierung',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: 'Dezimaltrennzeichen',
  projectsettingspanel592: 'z.B. \',\' für 1,23 oder \'.\' für 1.23',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel593: 'für 1,23 oder',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: 'Tausendertrennzeichen',
  projectsettingspanel608: 'z.B. \'.\' für 1.234 oder \',\' für 1,234',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel609: 'für 1.234 oder',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: 'Datumsformat',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel622: 'd.m.Y',
  projectsettingspanel626: 'd.m.Y',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: 'Zeitformat',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel637: 'Sein',
  projectsettingspanel639: 'Aktueller Eigentümer',
  projectsettingspanel641: 'Sein',
  projectsettingspanel644: '⚠️ Warnung: Sie verlieren Ihre Eigentümerrechte nach der Übertragung!',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel658: 'z.B. \'€\', \'$\', \'£\', \'CHF\'',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel659: 'CHF',
  projectsettingspanel671: 'Europa/Wien',
  projectsettingspanel672: 'Europe/Berlin',
  projectsettingspanel673: 'Europe/Zurich',
  projectsettingspanel674: 'Europa/London',
  projectsettingspanel675: 'Amerika/New_York',
  projectsettingspanel676: 'Amerika/Chicago',
  projectsettingspanel677: 'Amerika/Los Angeles',
  projectsettingspanel678: 'Asien/Tokio',
  projectsettingspanel679: 'Asien/Dubai',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel680: 'koordinierte Weltzeit',
  projectsettingspanel689: 'Google Translate API-Schlüssel',
  projectsettingspanel700: 'API-Schlüssel für automatische Übersetzungen via Google Translate',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: 'Sprachen',
  projectsettingspanel727: 'Verfügbare Sprachen',
  projectsettingspanel728: 'Aktivierte Sprachen',
  projectsettingspanel733: 'Suchen...',
  projectsettingspanel734: 'Diagrammeinstellungen',
  projectsettingspanel738: 'Konfigurieren Sie die Standard-Einstellungen für automatisches Diagram-Layout. Diese Werte werden beim "Sort the Diagram" Button verwendet.',
  projectsettingspanel739: 'Ausgewählte Sprachen:',
  projectsettingspanel742: 'Keine Sprachen ausgewählt',
  projectsettingspanel744: 'Max. Tabellen pro Zeile',
  projectsettingspanel753:  'Maximale Anzahl der Tabellen in einer Zeile',
  projectsettingspanel758:  'Tabellen Breite (px)',
  projectsettingspanel767:  'Breite der Tabellen-Boxen im Diagramm',
  projectsettingspanel772:  'Tabellen Höhe (px)',
  projectsettingspanel781:  'Maximale Höhe der Tabellen-Boxen',
  projectsettingspanel786:  'Horizontaler Abstand (px)',
  projectsettingspanel795:  'Horizontaler Abstand zwischen Tabellen',
  projectsettingspanel800:  'Vertikaler Abstand (px)',
  projectsettingspanel809:  'Vertikaler Abstand zwischen Zeilen',
  projectsettingspanel814:  'Vorschau Werte:',
  projectsettingspanel816:  'Max Tabellen pro Zeile:',
  projectsettingspanel817:  'Tabellen Größe:',
  projectsettingspanel818:  'Abstände:',
  projectsettingspanel818a: 'horizontal',
  projectsettingspanel818b: 'Vertikale',
  projectsettingspanel866:  'Haupt-Einstiegsdatei (z.B. index.php, main.py, app.js)',
  projectsettingspanel872:  'Standard-Sprache',
  projectsettingspanel893:  'Archivformat',
  projectsettingspanel906:  'Format für generierte Code-Archive (ZIP für Windows, TAR.GZ/XZ für Linux)',
  projectsettingspanel926:  'Länge der kurzen Dateinamen im Datenbankdesigner (z.B. "us" für users)',
  projectsettingspanel946:  'z.B. "," für 1,23 oder "." für 1.23',
  projectsettingspanel962:  'z.B. "." für 1.234 oder "," für 1,234',
  projectsettingspanel979:  'PHP Format (z.B. "d.m.Y" für 31.12.2024)',
  projectsettingspanel995:  'PHP Format (z.B. "H:i:s" für 14:30:00)',
  projectsettingspanel1012: 'z.B. "€", "$", "£", "CHF"',
  projectsettingspanel1058: 'Google Cloud Console - API-Schlüssel erstellen',
  projectsettingspanel1068: 'Wählen Sie die Sprachen aus, die für die Code-Generierung in diesem Projekt verwendet werden sollen. Verschieben Sie die gewünschten Sprachen nach rechts und nutzen Sie die Pfeiltasten um die Reihenfolge zu ändern',
  projectsettingspanel1111: 'Hier können Sie die Werte für benutzerdefinierte Template-Variablen eintragen. Diese Variablen wurden vom Template-Entwickler definiert und können pro Sprache unterschiedlich sein.',
  projectsettingspanel1122: 'Keine Template-Variablen gefunden. Template-Entwickler können benutzerdefinierte Variablen in ihren Templates definieren.',
  projectsettingspanel1129: 'Sprache für Variablen',
  projectsettingspanel932:  'Lokalisierung',
  projectsettingspanel1108: 'Template Variablen',
  
  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel85: 'Nicht authentifiziert',
  publicprojectspanel97: 'Öffentliche Projekte konnten nicht geladen werden',
  publicprojectspanel104: 'Fehler beim Laden öffentlicher Projekte',
  publicprojectspanel111: 'Das ist die',
  publicprojectspanel183: 'Das Klonen des Projekts ist fehlgeschlagen.',
  publicprojectspanel186: 'Das Klonen des Projekts ist fehlgeschlagen.',
  publicprojectspanel210: 'Öffentliche Projekte werden geladen …',
  publicprojectspanel222: 'Öffentliche Projekte',
  publicprojectspanel227: 'Mit Code beitreten',
  publicprojectspanel234: 'Aktualisieren',
  publicprojectspanel253: 'Suchen Sie nach Projekten nach Name, Beschreibung oder Eigentümer ...',
  publicprojectspanel266: 'Keine öffentlichen Projekte',
  publicprojectspanel270: 'Versuchen Sie, Ihre Suchbegriffe anzupassen.',
  publicprojectspanel271: 'Zurzeit sind keine öffentlichen Projekte verfügbar.',
  publicprojectspanel276: 'Suche löschen',
  publicprojectspanel296: 'Öffentlich',
  publicprojectspanel316: 'Keine Beschreibung angegeben.',
  publicprojectspanel338: 'Ihr Projekt',
  publicprojectspanel342: 'Dies ist Ihr eigenes Projekt. Verwenden Sie die Registerkarte „Projekte“, um es zu duplizieren.',
  publicprojectspanel346: 'Projekt klonen',
  publicprojectspanel366: 'Projekte gesamt',
  publicprojectspanel372: 'Aufnehmende Mitglieder',
  publicprojectspanel378: 'Anzeigen',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel411: 'Projektname *',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: 'Projektnamen eingeben',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel426: 'Beschreibung',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel433: 'Projektbeschreibung eingeben',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: 'Öffentliches Projekt',
  publicprojectspanel452: 'Öffentliche Projekte sind für alle Benutzer sichtbar und können in der Projektgalerie entdeckt werden.',
  publicprojectspanel455: '💡 Hinweis: Für private Projekte sind möglicherweise Premiumfunktionen erforderlich.',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel463: 'Ursprüngliches Projekt:',
  publicprojectspanel474: 'Abbrechen',
  publicprojectspanel481: 'Projekt klonen',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel31: 'Passwörter stimmen nicht überein',
  registerpanel54: 'Registrierung fehlgeschlagen',
  registerpanel57: 'Registrierung erfolgreich! Sie kÃ¶nnen sich jetzt anmelden.',
  registerpanel75: 'Ein Fehler ist aufgetreten',
  registerpanel90: 'Registrieren',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel115: 'Name',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel123: 'Ihr vollständiger Name',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel131: 'E-Mail',
  registerpanel139: 'Ihre E-Mail-Adresse@Beispiel.com',
  registerpanel147: 'Passwort',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel154: 'Mindestens 8 Zeichen',
  registerpanel161: 'Passwort eingeben',
  registerpanel162: 'Schwach',
  registerpanel163: 'Mittel',
  registerpanel164: 'Stark',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel169: 'Passwort bestätigen',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel176: 'Passwort wiederholen',
  registerpanel188: 'Registrierung läuft...',
  registerpanel198: 'Bereits ein Konto? Anmelden',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel104: 'Sprachen konnten nicht geladen werden:',
  schematranslationpanel133: 'Schemastruktur konnte nicht geladen werden:',
  schematranslationpanel281: 'Bitte wählen Sie mindestens eine Sprache aus',
  schematranslationpanel289: 'Nicht authentifiziert',
  schematranslationpanel303: 'Übersetzungen konnten nicht exportiert werden',
  schematranslationpanel317: 'Übersetzungen erfolgreich exportiert',
  schematranslationpanel319: 'Unbekannter Fehler',
  schematranslationpanel334: 'Bitte wählen Sie eine Datei und mindestens eine Sprache aus',
  schematranslationpanel342: 'Nicht authentifiziert',
  schematranslationpanel364: 'Übersetzungen konnten nicht importiert werden',
  schematranslationpanel377: 'Importieren fehlgeschlagen:',
  schematranslationpanel385: 'Kein Projekt ausgewählt',
  schematranslationpanel449: 'Bitte wählen Sie mindestens eine Zielsprache aus',
  schematranslationpanel459: 'Nicht authentifiziert',
  schematranslationpanel481: 'Automatische Übersetzung fehlgeschlagen:',
  schematranslationpanel505: 'Übersetzung fehlgeschlagen',
  schematranslationpanel640: 'Tisch',
  schematranslationpanel648: 'Feld',
  schematranslationpanel662: 'Wählen Sie ein zu übersetzendes Element aus',
  schematranslationpanel663: 'Wählen Sie eine Tabelle oder ein Feld aus dem Schemabaum aus, um dessen Übersetzungen zu verwalten',
  schematranslationpanel682: 'Übersetzungen für dieses {itemInfo.type.toLowerCase()} verwalten',
  schematranslationpanel688: 'Automatisches Speichern...',
  schematranslationpanel701: '>Keine Übersetzungen gefunden für',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel702: 'Geben Sie unten Übersetzungen ein, um neue Einträge zu erstellen. Sie werden nach 1 Sekunde Inaktivität automatisch gespeichert.',
  schematranslationpanel743: 'Schemaübersetzungsmanager',
  schematranslationpanel746: 'Übersetzen Sie Datenbanktabellen- und Feldnamen für die Internationalisierung',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: 'Export',
  schematranslationpanel762: 'Import',
  schematranslationpanel771: 'Automatische Übersetzung',
  schematranslationpanel791: 'Datenbankschema',
  schematranslationpanel802: 'Alles erweitern',
  schematranslationpanel812: 'Alles ausblenden',
  schematranslationpanel818: 'Wählen Sie die zu übersetzenden Tabellen und Felder aus',
  schematranslationpanel820: 'Projekt: ',
  schematranslationpanel827: 'Bitte wählen Sie zuerst ein Projekt aus',
  schematranslationpanel830: 'Schema wird geladen...',
  schematranslationpanel834: 'Keine Schematabellen gefunden',
  schematranslationpanel835: 'Dieses Projekt hat keine Schemadaten zum Übersetzen',
  schematranslationpanel908: 'Übersetzungen nach Excel exportieren',
  schematranslationpanel922: 'Export für {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel923: 'Wählen Sie die Sprachen aus, die im Excel-Export berücksichtigt werden sollen. Der Export enthält alle Tabellen und Felder aus verknüpften Datenbanken.',
  schematranslationpanel931: 'Sprachen auswählen *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel938: 'Wählen Sie die zu exportierenden Sprachen aus',
  schematranslationpanel950: 'Abbrechen',
  schematranslationpanel957: 'Export nach Excel',
  schematranslationpanel969: 'Übersetzungen aus Excel importieren',
  schematranslationpanel986: 'Import für {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel987: 'Laden Sie eine Excel-Datei mit Übersetzungen hoch. Wählen Sie aus, welche Sprachen importiert werden sollen.',
  schematranslationpanel995: 'Excel-Datei hochladen *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1006: 'Excel-Datei auswählen',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1015: 'Wählen Sie die zu importierenden Sprachen aus *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: 'Wählen Sie die zu importierenden Sprachen aus',
  schematranslationpanel1034: 'Abbrechen',
  schematranslationpanel1044: 'Übersetzungen importieren',
  schematranslationpanel1056: 'Automatische Übersetzung mit Google Übersetzer',
  schematranslationpanel1074: 'Automatische Übersetzung',
  schematranslationpanel1078: 'Alle Tabellen und Felder mit der Ausgangssprache werden automatisch übersetzt.',
  schematranslationpanel1079: 'Wählen Sie die Ausgangssprache (muss bereits ausgefüllt sein) und die Zielsprachen für die Übersetzung aus.',
  schematranslationpanel1090: 'translateAll',
  schematranslationpanel1103: '🚀 Übersetzen Sie alle Tabellen und Felder',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1113: 'Ausgangssprache *',
  schematranslationpanel1139: 'Zielsprachen *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: 'Zielsprachen auswählen',
  schematranslationpanel1195: 'Abbrechen',
  schematranslationpanel1205: 'Jetzt übersetzen',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel48: 'Einstellungen konnten nicht geladen werden:',
  systemsettingspanel67: 'Einstellungen erfolgreich aktualisiert!',
  systemsettingspanel69: 'Die Einstellungen konnten nicht aktualisiert werden:',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel86: '⚙️ Systemeinstellungen',
  systemsettingspanel89: 'Konfigurieren Sie die globalen Systemeinstellungen für Scoriet',
  systemsettingspanel99: '🌍 Google Übersetzer-API',
  systemsettingspanel102: 'Konfigurieren Sie den globalen Google Translate API-Schlüssel für Benutzer des Business-Plans',
  systemsettingspanel107: 'Globaler API-Schlüssel',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: 'Geben Sie den API-Schlüssel von Google Translate ein …',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel132: '💰 Abonnementpreise',
  systemsettingspanel135: 'Legen Sie monatliche Abonnementpreise für jede Planstufe fest',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel148: 'Bitte geben Sie den Premiumpreis ein',
  systemsettingspanel149: 'Der Preis muss positiv sein',
  systemsettingspanel157: 'USD',
  systemsettingspanel180: 'Bitte geben Sie den Business-Preis ein',
  systemsettingspanel181: 'Der Preis muss positiv sein',
  systemsettingspanel189: 'USD',
  systemsettingspanel212: 'Bitte geben Sie den Mindestpreis für den Patron ein',
  systemsettingspanel213: 'Der Preis muss positiv sein',
  systemsettingspanel221: 'USD',
  systemsettingspanel242: 'Zurücksetzen',
  systemsettingspanel251: 'Einstellungen speichern',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel105: 'Nicht authentifiziert',
  teammanagementpanel143: 'Nicht authentifiziert',
  teammanagementpanel155: 'Das Laden der Teams ist fehlgeschlagen.',
  teammanagementpanel174: 'Fehler',
  teammanagementpanel175: 'Das Laden der Teams ist fehlgeschlagen.',
  teammanagementpanel200: 'Team löschen',
  teammanagementpanel208: 'Nicht authentifiziert',
  teammanagementpanel212: 'LÖSCHEN',
  teammanagementpanel221: 'Team konnte nicht gelöscht werden',
  teammanagementpanel226: 'Erfolg',
  teammanagementpanel227: 'Team erfolgreich gelöscht',
  teammanagementpanel234: 'teamChanged',
  teammanagementpanel239: 'Fehler',
  teammanagementpanel240: 'Team konnte nicht gelöscht werden',
  teammanagementpanel258: 'Erfolg',
  teammanagementpanel259: 'Team erfolgreich erstellt',
  teammanagementpanel264: 'teamChanged',
  teammanagementpanel277: 'Neues Team',
  teammanagementpanel291: 'Suchen Sie hier nach Teams ...',
  teammanagementpanel316: 'Unbekannt',
  teammanagementpanel334: 'Inaktiv',
  teammanagementpanel361: 'Keine Projekte',
  teammanagementpanel368: 'Das ist die',
  teammanagementpanel386: 'Mitglieder verwalten',
  teammanagementpanel394: 'Team bearbeiten',
  teammanagementpanel400: 'Team löschen',
  teammanagementpanel416: 'Team Management',

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: 'Erstellen, verwalten und organisieren Sie Ihre Teams. Weisen Sie Teammitglieder zu und steuern Sie die Zugriffsberechtigungen.',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: 'Keine Teams gefunden',
  teammanagementpanel451: 'Teamname',
  teammanagementpanel458: 'Eigentümer',
  teammanagementpanel465: 'Mitglieder',
  teammanagementpanel471: 'Status',
  teammanagementpanel478: 'Projekte',
  teammanagementpanel485: 'Erstellt',
  teammanagementpanel491: 'Aktionen',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old97: 'Kein Authentifizierungstoken gefunden',
  teamspanel_old147: 'Ein Fehler ist aufgetreten',
  teamspanel_old192: 'Einladung konnte nicht angenommen werden',
  teamspanel_old216: 'Einladung konnte nicht abgelehnt werden',
  teamspanel_old225: 'Teams werden geladen …',
  teamspanel_old236: 'Fehler beim Laden der Teams',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old241: 'Wiederholen',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old263: 'Team erstellen',
  teamspanel_old270: 'Eigene Teams',
  teamspanel_old271: 'Mitglied von',
  teamspanel_old272: 'Einladungen',
  teamspanel_old297: 'Noch keine Teams',
  teamspanel_old298: 'Erstellen Sie Ihr erstes Team, um mit der Zusammenarbeit zu beginnen',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old316: 'Eigentümer',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old360: 'Kein Mitglied irgendwelcher Teams',
  teamspanel_old361: 'Hier sehen Sie die Teams, zu denen Sie eingeladen sind.',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old373: 'Mitglied',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old415: 'Keine ausstehenden Einladungen',
  teamspanel_old416: 'Teameinladungen werden hier angezeigt',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel91: 'Nicht authentifiziert',
  teamspanel128: 'Fehler beim Laden der Daten',
  teamspanel172: 'Fehler beim Laden der Projektteams',
  teamspanel182: 'Nicht authentifiziert',
  teamspanel193: 'Projekte konnten nicht geladen werden',
  teamspanel199: 'Fehler beim Laden der Projekte',
  teamspanel227: 'Nicht authentifiziert',
  teamspanel238: 'Das Laden der Teams ist fehlgeschlagen.',
  teamspanel255: 'Fehler beim Laden der Teams',
  teamspanel270: 'Nicht authentifiziert',
  teamspanel295: 'Fehler beim Zuweisen von Teams',
  teamspanel347: 'teamChanged',
  teamspanel349: ' Teams erfolgreich Projekten zugewiesen',
  teamspanel350: 'Fehler beim Zuweisen der Teams',
  teamspanel364: 'Nicht authentifiziert',
  teamspanel368: 'LÖSCHEN',
  teamspanel420: 'teamChanged',
  teamspanel425: 'Fehler beim Entfernen des Teams',
  teamspanel430: 'Erfolgreich aus dem Projekt entfernt',
  teamspanel451: 'Teams werden geladen …',
  teamspanel457: 'Projektteams',
  teamspanel487: 'Projekte oder Teams suchen...',

  // resources/js/Components/Panels/TeamsPanel.tsx
  teamspanel494: 'Keine Projekte gefunden',
  teamspanel527: 'Für dieses Projekt sind keine Teams verfügbar',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel544: 'Unbekannt',
  teamspanel552: 'Nicht zugewiesen',
  teamspanel557: 'Zugewiesen',
  teamspanel563: 'Aus Projekt entfernen',
  teamspanel608: 'Auswahl löschen',
  teamspanel619: 'Teams Projekten zuordnen',
  teamspanel630: 'Keine Teams gefunden',
  teamspanel675: 'Aus Projekt entfernen',
  teamspanel697: 'Teamname',
  teamspanel698: 'Beschreibung',
  teamspanel701: 'Eigentümer',
  teamspanel705: 'Unbekannt',
  teamspanel711: 'Mitglieder',
  teamspanel721: 'Status',
  teamspanel726: 'Inaktiv',
  teamspanel732: 'Erstellt',
  teamspanel733: 'Das ist die',
  teamspanel745: 'Auswahl löschen',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: 'DB-Schemas konnten nicht geladen werden',
  templatedbschemadependenciespanel123: 'DB-Schemaabhängigkeit erfolgreich hinzugefügt',
  templatedbschemadependenciespanel128: 'Das Hinzufügen der Abhängigkeit ist fehlgeschlagen',
  templatedbschemadependenciespanel132: 'Das Hinzufügen der Abhängigkeit ist fehlgeschlagen',
  templatedbschemadependenciespanel144: 'DB-Schemaabhängigkeit hinzufügen',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel158: 'Datenbankschema *',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: 'Bitte wählen Sie ein Datenbankschema',
  templatedbschemadependenciespanel176: 'Auswählen eines Datenbankschemas',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel203: 'Erforderliche Abhängigkeit',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: 'Geben Sie einen Alias für dieses DB-Schema in dem Template ein',
  templatedbschemadependenciespanel242: 'Abbrechen',
  templatedbschemadependenciespanel248: 'Abhängigkeit hinzufügen',
  templatedbschemadependenciespanel324: 'Das Laden der Templates ist fehlgeschlagen',
  templatedbschemadependenciespanel346: 'Das Laden der Templateabhängigkeiten ist fehlgeschlagen',
  templatedbschemadependenciespanel350: 'Das Laden der Templateabhängigkeiten ist fehlgeschlagen',
  templatedbschemadependenciespanel364: 'LÖSCHEN',
  templatedbschemadependenciespanel367: 'Abhängigkeit erfolgreich entfernt',
  templatedbschemadependenciespanel372: 'Die Abhängigkeit konnte nicht entfernt werden',
  templatedbschemadependenciespanel376: 'Die Abhängigkeit konnte nicht entfernt werden',
  templatedbschemadependenciespanel390: 'Inaktiv',
  templatedbschemadependenciespanel404: 'Nur anzeigen',
  templatedbschemadependenciespanel405: 'Sie können nur Ihre eigenen Templates bearbeiten',
  templatedbschemadependenciespanel415: 'Verwalten',
  templatedbschemadependenciespanel440: 'Erforderlich',
  templatedbschemadependenciespanel442: 'Optional',
  templatedbschemadependenciespanel457: 'Schreibgeschütztes Template',
  templatedbschemadependenciespanel469: 'Abhängigkeit entfernen',
  templatedbschemadependenciespanel483: 'Template - DB-Schemaabhängigkeiten',
  templatedbschemadependenciespanel496: 'Templates',
  templatedbschemadependenciespanel504: 'Alle',
  templatedbschemadependenciespanel505: 'System',
  templatedbschemadependenciespanel506: 'Öffentlich',
  templatedbschemadependenciespanel507: 'Projekt',
  templatedbschemadependenciespanel517: 'Templates suchen...',
  templatedbschemadependenciespanel527: 'Keine Templates verfügbar',
  templatedbschemadependenciespanel536: 'Template',
  templatedbschemadependenciespanel541: 'Aktionen',
  templatedbschemadependenciespanel559: 'Hinzufügen',
  templatedbschemadependenciespanel570: 'Keine DB-Schema-Abhängigkeiten',
  templatedbschemadependenciespanel578: 'Datenbankschema',
  templatedbschemadependenciespanel583: 'Status',
  templatedbschemadependenciespanel588: 'Aktionen',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel595: 'Wählen Sie eine Template aus, um ihre DB-Schemaabhängigkeiten anzuzeigen',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager108: 'Erstellen',
  templatefilemanager116: 'Datei erfolgreich gelöscht',
  templatefilemanager120: 'Fehler beim Löschen der Datei',
  templatefilemanager131: 'Fehler beim Verschieben der Datei',
  templatefilemanager137: 'Sind Sie sicher, dass Sie diese Datei löschen möchten?',
  templatefilemanager138: 'Datei löschen?',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager141: 'Ja',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: 'Nein',
  templatefilemanager175: 'Nach oben',
  templatefilemanager185: 'Nach unten',
  templatefilemanager195: 'Bearbeiten',
  templatefilemanager205: 'LÃ¶schen',
  templatefilemanager216: 'Template Dateien verwalten',
  templatefilemanager220: 'Neue Datei',
  templatefilemanager227: 'Schließen',
  templatefilemanager241: 'Keine Dateien vorhanden',
  templatefilemanager243: 'Name',
  templatefilemanager244: 'Typ',
  templatefilemanager245: 'Reihenfolge',
  templatefilemanager246: 'Größe',
  templatefilemanager247: 'Aktionen',
  templatefilemanager252: 'Neue Datei erstellen',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager265: 'Dateiname *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager271: 'Bitte Dateinamen eingeben!',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: 'z. B. Model.php, component.tsx',
  templatefilemanager288: 'Typ *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager294: 'Bitte Typ auswählen!',
  templatefilemanager301: 'Typ auswÃ¤hlen',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager335: 'Dateiinhalt *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager341: 'Bitte Dateiinhalt eingeben!',
  templatefilemanager347: 'Template-Code hier eingeben...',
  templatefilemanager361: 'Abbrechen',
  templatefilemanager368: 'Erstellen',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: 'Alle',
  templatemanagementpanel113: 'Datenbank',
  templatemanagementpanel115: 'Statische Datei',
  templatemanagementpanel116: 'Statisches Verzeichnis als ZIP-Archiv',
  templatemanagementpanel117: 'Projektspezifische Datei mit Platzhaltern',
  templatemanagementpanel118: 'DB-Tabellendatei',
  templatemanagementpanel119: 'Projektspezifische Datei mit Sprachunterstützung',
  templatemanagementpanel120: 'Datei pro Datenbanktabelle mit Sprachunterstützung',
  templatemanagementpanel135: 'Template Verwaltung',
  templatemanagementpanel150: 'Fehler beim Laden der Templates. Bitte zuerst einloggen.',
  templatemanagementpanel202: 'Fehler beim Laden der Template-Details',
  templatemanagementpanel211: 'Template endgÃ¼ltig gelÃ¶scht',
  templatemanagementpanel216: 'Fehler beim endgültigen Löschen des Templates',
  templatemanagementpanel230: 'Fehler beim Ändern des Template-Status',
  templatemanagementpanel286: 'Template erfolgreich geklont',
  templatemanagementpanel291: 'Fehler beim Klonen des Templates',
  templatemanagementpanel335: 'Erstellen',
  templatemanagementpanel340: 'Speichern',
  templatemanagementpanel359: 'Template erfolgreich gespeichert',
  templatemanagementpanel395: 'Fehler beim Speichern des Templates',
  templatemanagementpanel410: 'Template erfolgreich importiert',
  templatemanagementpanel413: 'Fehler beim Importieren des Templates',
  templatemanagementpanel419: 'Ein Template mit diesem Namen existiert bereits. Möchten Sie es überschreiben?',
  templatemanagementpanel420: 'Template existiert bereits',
  templatemanagementpanel428: 'Template erfolgreich importiert und überschrieben',
  templatemanagementpanel433: 'Fehler beim Überschreiben des Templates',
  templatemanagementpanel436: 'Und',
  templatemanagementpanel437: 'Abbrechen',
  templatemanagementpanel441: 'Fehler beim Importieren des Templates',
  templatemanagementpanel464: 'Template erfolgreich exportiert',
  templatemanagementpanel467: 'Fehler beim Exportieren des Templates',
  templatemanagementpanel485: 'Kein Template ausgewählt',
  templatemanagementpanel517: 'Fehler beim Löschen der Datei',
  templatemanagementpanel521: 'Fehler beim Löschen der Datei:',
  templatemanagementpanel527: 'Kein Template ausgewählt',
  templatemanagementpanel595: 'hinzugefügt',
  templatemanagementpanel597: 'Fehler beim Speichern der Datei',
  templatemanagementpanel601: 'Fehler beim Speichern der Datei:',
  templatemanagementpanel613: 'Template Verwaltung',
  templatemanagementpanel618: 'Neues Template',
  templatemanagementpanel624: 'Import',
  templatemanagementpanel646: 'Templates suchen...',
  templatemanagementpanel653: 'Kategorie',
  templatemanagementpanel667: 'Keine Templates gefunden',
  templatemanagementpanel669: '{first} bis {last} von {totalRecords} Templates',
  templatemanagementpanel672: 'Name',
  templatemanagementpanel675: 'Kategorie',
  templatemanagementpanel684: 'Sprache',
  templatemanagementpanel693: 'Schlagwörter',
  templatemanagementpanel706: 'Dateien',
  templatemanagementpanel711: 'Status',
  templatemanagementpanel716: 'Aktiv',
  templatemanagementpanel721: 'Typ',
  templatemanagementpanel736: 'Privat',
  templatemanagementpanel743: 'Erstellt',
  templatemanagementpanel744: 'Das ist die',
  templatemanagementpanel747: 'Aktionen',
  templatemanagementpanel757: 'Anzeigen',
  templatemanagementpanel764: 'Bearbeiten',
  templatemanagementpanel771: 'Exportieren',
  templatemanagementpanel777: 'Klonen',
  templatemanagementpanel785: 'Aktivieren',
  templatemanagementpanel791: 'Template endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden!',
  templatemanagementpanel795: 'Endgültig löschen',
  templatemanagementpanel859: 'Beschreibung:',
  templatemanagementpanel862: 'Kategorie:',
  templatemanagementpanel865: 'Sprache:',
  templatemanagementpanel868: 'Stichworte:',
  templatemanagementpanel876: 'Dateien ({viewingTemplate.files?.length || 0}):',
  templatemanagementpanel893: 'Keine Dateien vorhanden',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel933: 'Neuer Template-Name',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: 'Template-Name eingeben...',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel944: '🔍 Prüfe Verfügbarkeit...',
  templatemanagementpanel949: '❌ Name darf nicht doppelt vergeben werden',
  templatemanagementpanel954: '✅ Name ist verfügbar',
  templatemanagementpanel961: 'Sichtbarkeit',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel970: 'Public (für alle sichtbar)',
  templatemanagementpanel971: 'Private (nur für Sie)',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel976: 'Quelle:',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel977: 'Typ:',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal15: 'Versprechen',
  templatemodal16: 'Versprechen',
  templatemodal147: 'Neues Template erstellen',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal159: 'Name *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: 'Bitte Template-Name eingeben!',
  templatemodal169: 'Template-Name darf nur Kleinbuchstaben',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal195: 'Beschreibung',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal206: 'Template Beschreibung (optional)',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal186: 'Template bearbeiten',
  templatemodal199: 'Name *',
  templatemodal208: 'Template-Namen werden später für URLs verwendet (username/template_name)',
  templatemodal228: 'Template-Name darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten (z.B. my_template_123)',
  templatemodal281: 'Kategorie auswählen oder eingeben (z.B. Backend, API, Web)',
  templatemodal293: 'Beliebige Kategorien erlaubt - Vorschläge:',
  templatemodal322: 'Sprache auswählen oder eingeben (z.B. PHP, JavaScript, Python)',
  templatemodal334: 'Beliebige Sprachen erlaubt - Vorschläge:',
  templatemodal366: 'Sichtbarkeit *',
  templatemodal399: 'Systemvorlage',
  templatemodal438: 'Datei hinzufügen',
  templatemodal444: 'Bitte speichern Sie das Template, erst dann können Sie Dateien zum Template hinzufügen',
  templatemodal450: 'Hinweis: Dateien werden sofort dem Template zugewiesen. Änderungen an Template-Details (Name, Beschreibung, etc.) müssen separat gespeichert werden.',
  templatemodal513: 'Keine Dateien hinzugefügt. Klicken Sie auf t.templatemodal449 um zu beginnen.',
  templatemodal521: 'Benutzerdefinierte Variablen',
  templatemodal535: 'Variable hinzufügen',
  templatemodal541: 'Bitte speichern Sie das Template, erst dann können Sie Custom Variables zum Template hinzufügen',
  templatemodal547: 'Hinweis: Custom Variables erlauben Ihnen, Platzhalter wie {copyright} oder {company_name} zu definieren, die nicht in der Datenbank existieren. Diese können dann pro Projekt und Sprache vom Benutzer ausgefüllt werden.',
  templatemodal580: 'Erforderlich',
  templatemodal584: 'Optional',
  templatemodal625: 'Keine Custom Variables definiert. Klicken Sie auf "Variable hinzufügen" um zu beginnen.',
  templatemodal646: 'Template ist aktiv',
  templatemodal655: 'Abbrechen',
  templatemodal667: 'Gespeichert ✓Kategorie *',
  templatemodal480: 'Zeichen',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal220: 'Kategorie *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal226: 'Bitte Kategorie auswählen!',
  templatemodal235: 'Alle',
  templatemodal236: 'Kategorie auswÃ¤hlen',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: 'Sprache *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: 'Bitte Sprache eingeben!',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal259: 'z. B. PHP, JavaScript, TypeScript',
  templatemodal276: 'Tags',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: 'Tags hinzufügen (Enter drücken)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal301: 'Sichtbarkeit *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: 'Bitte Sichtbarkeit auswählen!',
  templatemodal317: 'Öffentlich',
  templatemodal318: 'Privat',
  templatemodal320: 'Sichtbarkeit wählen',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal333: 'System Template',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: 'Template Dateien',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal379: 'Bitte speichern Sie das Template, erst dann können Sie Dateien zum Template hinzufügen',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal395: 'Name',
  templatemodal396: 'Typ',
  templatemodal397: 'Größe',
  templatemodal398: 'Aktionen',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal448: 'Keine Dateien hinzugefügt. Klicken Sie auf Datei hinzufügen um zu beginnen.',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal449: 'Datei hinzufügen',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal469: 'Template ist aktiv',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal491: 'Speichern',
  templatemodal502: 'Keine Änderungen',
  templatemodal503: 'Erstellen',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal65: 'Nicht authentifiziert',
  sqlimportmodal76: 'Schemas konnten nicht geladen werden',
  sqlimportmodal87: 'Fehler beim Laden der Schemata',
  sqlimportmodal106: 'Kein Projekt ausgewählt. Bitte wählen Sie zuerst ein Projekt aus.',
  sqlimportmodal129: 'SQL-Skript ist erforderlich',
  sqlimportmodal134: 'Bitte wählen Sie ein Zielschema',
  sqlimportmodal139: 'Kein Projekt ausgewählt',
  sqlimportmodal144: 'Kein Schema ausgewählt',
  sqlimportmodal154: 'Authentifizierung erforderlich',
  sqlimportmodal177: 'SQL konnte nicht importiert werden',
  sqlimportmodal203: 'Import fehlgeschlagen',
  sqlimportmodal211: '📥 SQL-Schema importieren',
  sqlimportmodal234: 'Datenbankschema aus SQL-Skript importieren',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal277: 'Zielschema',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal286: 'Schemata werden geladen ...',
  sqlimportmodal301: 'Keine bearbeitbaren Schemata im Projekt',
  sqlimportmodal313: 'Kurzbeschreibung...',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal322: 'SQL-Skript',
  sqlimportmodal328: 'Fügen Sie hier Ihre SQL CREATE TABLE-Anweisungen ein ...',
  sqlimportmodal332: 'Unterstützt MySQL CREATE TABLE- und ALTER TABLE-Anweisungen und -Einschränkungen',
  sqlimportmodal338: 'SQL-Datei hochladen',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal353: 'Datei erfolgreich geladen!',
  sqlimportmodal368: 'Klicken Sie, um die SQL-Datei auszuwählen',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal369: 'Unterstützt .sql- und .txt-Dateien',
  sqlimportmodal405: 'Abbrechen',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: '📥 Schema importieren',

  // resources/js\Components\TopBar.tsx
  topbar57: 'AnwendungenAktualisiert',
  topbar60: 'AnwendungenAktualisiert',
  topbar71: 'Die Schlacke',
  topbar75: 'Enterprise Code Generator',
  topbar98: 'Projekt auswählen',
  topbar102: 'Keine Projekte gefunden',
  topbar122: 'openApplicationsModal',

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: 'instrumentSans',
  fontprovider29: 'instrumentSans',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal19: 'Aktuell',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal29: '💡 Neue Version erstellen?',
  versionconfirmationmodal53: 'Möchtest du dafür eine neue Version erstellen?',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal67: 'Ja, neue Version erstellen',
  versionconfirmationmodal51:  'Du bist dabei ',
  versionconfirmationmodal56:  '⚠️ WARNUNG: Tabelle ',
  versionconfirmationmodal56a: ' wird gelöscht!',
  versionconfirmationmodal90:  'Nein, an ',
  versionconfirmationmodal90a: ' weiterarbeiten',
  versionconfirmationmodal83: 'Nein',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: 'Direkt ändern ohne neue Version',
  versionconfirmationmodal92: 'ℹ️ Du kannst später jederzeit mit \'Save as new version\' eine neue Version erstellen.',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal93: 'Als neue Version speichern',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: 'Abbrechen',

  // resources/js\contexts\ProjectContext.tsx
  projectcontext196: 'useProject muss innerhalb eines ProjectProviders verwendet werden',

  // resources/js\contexts\ToastContext.tsx
  toastcontext19: 'Erfolg',
  toastcontext28: 'Fehler',
  toastcontext37: 'Info',
  toastcontext46: 'Warnung',
  toastcontext63: 'useToast muss innerhalb eines ToastProviders verwendet werden',

  // resources/js\i18n\index.ts
  indexts26: 'lokaler Speicher',
  indexts28: 'lokaler Speicher',

  // resources/js\lib\api.ts
  apits104: 'Authentifizierung erforderlich - bitte anmelden',
  apits119: 'Authentifizierung abgelaufen - bitte melden Sie sich erneut an',
  apits152: 'Alle',
  apits201: 'Unbekannter Fehler',
  apits219: 'Unbekannter Fehler',
  apits235: 'Unbekannter Fehler',
  apits251: 'Unbekannter Fehler',
  apits268: 'Unbekannter Fehler',
  apits286: 'Unbekannter Fehler',
  apits314: 'Unbekannter Fehler',
  apits329: 'Unbekannter Fehler',
  apits350: 'Unbekannter Fehler',
  apits518: 'Preis konnte nicht abgerufen werden:',
  apits527: 'EUR',
  apits553: 'EUR',

  // resources/js\pages\CMSPage.tsx
  cmspage45: 'Sprache geändert',
  cmspage194: 'BETA',
  cmspage208: 'Heim',
  cmspage352: 'Die Schlacke',

  // resources/js/pages/CMSPage.tsx
  cmspage353: 'Die Zukunft der Codegenerierung. Von Entwicklern für Entwickler entwickelt.',

  // resources/js\pages\CMSPage.tsx
  cmspage387: 'Sie befinden sich derzeit im ',
  cmspage412: 'Wählen Sie Ihren Plan',
  cmspage422: 'Aktueller Plan',
  cmspage423: 'Frei',
  cmspage426: 'Kostenloser Plan',
  cmspage435: 'Prämie',
  cmspage440: 'Am besten für professionelle Entwickler',
  cmspage462: 'Wählen Sie Premium',
  cmspage473: 'AM BELIEBTESTEN',
  cmspage474: 'Business',
  cmspage479: 'Am besten für Teams und Agenturen',
  cmspage501: 'Wählen Sie Business',
  cmspage520: 'Unterstütze die Community',
  cmspage542: 'Werden Sie Patron',
  cmspage553: 'Sie können Ihren Plan jederzeit ändern oder kündigen. Alle Pläne beinhalten eine 30-tägige Geld-zurück-Garantie.',

  // resources/js\pages\EmailVerification.tsx
  emailverification13: 'E-Mail bestätigen - Scoriet',

  // resources/js\pages\Index.tsx
  index133: 'Panel wird geladen …',
  index258: 'Team Verwaltung',

  // resources/js/pages/Index.tsx
  index265: 'Karte benutzerdefinierte',

  // resources/js\pages\Index.tsx
  index293: 'Template Verwaltung',
  index333: 'Datenbankverwaltung',
  index378: 'Debug Manual Generator',
  index400: 'Willkommen',
  index413: 'Datenbankdesigner',
  index426: 'Templates',
  index439: 'Datenbank-Explorer',
  index476: 'Teams',
  index495: 'Projektmanagement',
  index508: 'Meine Bewerbungen',
  index521: 'Öffentliche Projekte',
  index534: 'Schützen',
  index539: 'Das Entfernen dieser Registerkarte wird abgelehnt',
  index540: 'Dies geschieht im onLayoutChange-Rückruf',
  index542: 'Versuchen Sie Alt+P, um diese Registerkarte zu aktualisieren',
  index543: 'Versuchen Sie Alt+M, um diese Registerkarte zu maximieren',
  index544: 'Versuchen Sie Alt+L, um das aktuelle Layout zu protokollieren',
  index545: 'Versuchen Sie Alt+C, um das Layout in die Zwischenablage zu kopieren',
  index556: 'Login',
  index590: 'Template Verwaltung',
  index625: 'Datenbankverwaltung',
  index662: 'Team Verwaltung',
  index676: 'Template - DB-Schemaabhängigkeiten',
  index689: '🔧 Debug Manual Generator',
  index711: 'Codegenerierung',
  index724: 'Sprachmanagement',
  index737: 'Schemaübersetzung',
  index750: 'Systemeinstellungen',
  index763: 'Projekteinstellungen',
  index776: 'CMS-Administrator',
  index792: 'Authentifizierungsmodal',
  index796: '📋 Informationen',
  index797: 'Die Authentifizierung erfolgt jetzt über modale Fenster.',
  index798: 'Verwenden Sie das Navigationsmenü, um auf „Anmelden“, „Registrieren“ oder „Profil“ zuzugreifen.',
  index835: '🔧 Debug Manual Generator',
  index861: 'Projekt',
  index917: '⚠️ Unbekannter Tab: {id}',
  index918: 'Diese Tab-ID ist in der Funktion „loadTab“ nicht definiert.',
  index919: 'Verfügbare Registerkarten: t2, t3, t5, protect1, login, register, profile, forgot',
  index921: 'Überprüfen Sie Ihre LoadTab-Funktion!',
  index1415: 'Alle Tabs schließen',
  index1621: 'openApplicationsModalInPanel',
  index1636: 'openApplicationsModal',
  index1639: 'openApplicationsModal',

  // resources/js/pages/Index.tsx
  index1759: 'Gespeichertes Layout löschen und auf Standard zurücksetzen?',

  // resources/js\pages\Index.tsx
  index1771: 'Layout wurde in die Zwischenablage kopiert!',
  index1784: 'Layout wurde in die Zwischenablage kopiert!',
  index1788: 'Informationen zum manuellen Kopieren finden Sie in der Konsole.',
  index1851: 'EINGANG',
  index1856: 'Das Entfernen dieses Tabs wird abgelehnt!',
  index1928: 'Scoriet - Enterprise Code Generator',
  index2009: 'Laden...',
  index2020: 'Laden...',
  index2058: 'Registrierung erfolgreich',
  index2070: 'Laden...',

  // resources/js/pages/LandingPage.tsx
  statusLink: 'Status',

  // resources/js\pages\LandingPage.tsx
  landingpage69: 'EUR',
  landingpage110: 'Fehler beim Laden der Benutzerdaten:',

  // resources/js/pages/LandingPage.tsx
  sqlParserTitle: 'SQL Parser',
  sqlParserDesc: 'Intelligente MySQL-Datenbankschema-Parsing mit Unterstützung für komplexe Beziehungen und Constraints.',
  templateSystemTitle: 'Template System',
  templateSystemDesc: 'Mächtige Template-Engine mit JavaScript-Ausführung für dynamische Code-Generierung.',
  multiLanguageTitle: 'Multi-Sprachen Support',
  multiLanguageDesc: 'Generieren Sie Code für PHP, JavaScript, TypeScript, Python und mehr mit anpassbaren Templates.',
  modernInterfaceTitle: 'Moderne Oberfläche',
  modernInterfaceDesc: 'Intuitive dock-basierte MDI-Oberfläche mit Tab-Stapelung und schwebenden Panels.',

  // resources/js\pages\LandingPage.tsx
  landingpage151: '/Für immer',
  landingpage152: 'Perfekt für persönliche Projekte',
  landingpage154: 'Bis zu 3 Projekte',
  landingpage155: 'Grundlegendes Template',
  landingpage156: 'SQL-Schemaanalyse',
  landingpage157: 'Unterstützung durch die Gemeinschaft',
  landingpage158: 'Werbefinanziert',

  // resources/js/pages/LandingPage.tsx
  goStartFree: 'Kostenlos starten',
  premiumLabel: 'Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage168: 'Am besten für professionelle Entwickler',
  landingpage170: 'Unbegrenzte Projekte',
  landingpage171: 'Erweiterte Template',
  landingpage172: 'Benutzerdefinierte Templateerstellung',
  landingpage173: 'Vorrangiger Support',
  landingpage174: 'Erweiterte SQL-Funktionen',
  landingpage175: 'Teamzusammenarbeit',

  // resources/js/pages/LandingPage.tsx
  goPremium: 'Premium werden',

  // resources/js\pages\LandingPage.tsx
  landingpage182: 'Business',
  landingpage186: 'Am besten für Teams und Agenturen',
  landingpage188: 'Alle Premium-Funktionen',
  landingpage189: 'Tools für die Teamzusammenarbeit',
  landingpage190: 'Google Translate API-Integration',
  landingpage191: 'Erweiterte Analysen',
  landingpage192: 'Vorrangiger Support mit SLA',
  landingpage193: 'Benutzerdefinierte Branding-Optionen',
  landingpage195: 'Wählen Sie Business',

  // resources/js/pages/LandingPage.tsx
  patronLabel: 'Patron',

  // resources/js\pages\LandingPage.tsx
  landingpage203: 'Unterstütze die Community',
  landingpage205: 'Alle Business-Funktionen',
  landingpage206: 'Früher Zugriff auf Funktionen',
  landingpage207: 'Einflussentwicklung',
  landingpage208: 'Community-Discord-Zugriff',
  landingpage209: 'Benutzerdefinierter Betrag ab (',

  // resources/js/pages/LandingPage.tsx
  becomePatron: 'Patron werden',

  // resources/js\pages\LandingPage.tsx
  landingpage288: 'Scoriet - Enterprise Code Generator',
  landingpage304: 'Willkommen',
  landingpage307: 'openHomeOnStart',
  landingpage311: 'Öffnen Sie diese Registerkarte beim Start der App',

  // resources/js/pages/LandingPage.tsx
  landingpage316: 'Schließen Sie diese Registerkarte, um sich auf Ihre Projekte zu konzentrieren',

  // resources/js\pages\LandingPage.tsx
  landingpage336: 'BETA',

  // resources/js/pages/LandingPage.tsx
  login: 'Anmelden',
  register: 'Registrieren',
  profile: 'Profil',
  changePlan: 'Plan ändern',
  logout: 'Abmelden',
  gotoApp: 'Zur App',
  title: 'Enterprise Code Generator',
  subtitle: 'Verwandeln Sie Ihre Datenbankschemas in produktionsreifen Code mit intelligenten Templates. Reduzieren Sie die Entwicklungszeit um 80% durch automatisierte Code-Generierung.',
  startFree: 'Kostenlos starten',
  tryDemo: 'Demo testen',
  watchDemo: 'Demo ansehen',
  featuresTitle: 'Mächtige Features für moderne Entwicklung',
  pricingTitle: 'Wählen Sie Ihren Plan',
  pricingSubtitle: 'Starten Sie kostenlos, upgraden Sie wenn Sie bereit zum Skalieren sind',

  // resources/js\pages\LandingPage.tsx
  landingpage479: 'AM BELIEBTESTEN',
  landingpage486: 'Patreon',
  landingpage514: 'Frei',

  // resources/js/pages/LandingPage.tsx
  ctaTitle: 'Bereit Ihre Entwicklungsgeschwindigkeit zu verzehnfachen?',
  ctaSubtitle: 'Schließen Sie sich tausenden von Entwicklern an, die bereits Scoriet verwenden, um bessere Software schneller zu entwickeln.',
  startFreeTrial: 'Kostenlose Testversion starten',
  tryDemoNow: 'Demo jetzt testen',
  contactSales: 'Vertrieb kontaktieren',
  goToApp: 'Zur App',
  welcomeBack: 'Benutzer',

  // resources/js\pages\LandingPage.tsx
  landingpage573: 'Willkommen zurück ',

  // resources/js/pages/LandingPage.tsx
  currentPlan: 'Ihr Plan: ',
  freeLabel: 'Kostenlos',
  freeTier: 'Kostenlos Plan',
  registerFirst: 'Registrieren & Plan wählen',

  // resources/js\pages\LandingPage.tsx
  landingpage589: 'AM BELIEBTESTEN',
  landingpage594: 'Brauch',

  // resources/js/pages/LandingPage.tsx
  upgradeTo: 'Upgrade auf',
  currentPlanButton: 'Aktueller Plan',
  landingpage629: 'Die Schlacke',
  landingpage630: 'Die Zukunft der Codegenerierung. Von Entwicklern für Entwickler entwickelt.',
  productLabel: 'Produkt',
  featuresLink: 'Features',
  pricingLink: 'Preise',
  templatesLink: 'Templates',
  examplesLink: 'Beispiele',
  resourcesLabel: 'Ressourcen',
  documentationLink: 'Dokumentation',
  apiReferenceLink: 'API-Referenz',
  tutorialsLink: 'Tutorials',
  downloadsLink: 'Downloads',
  supportLabel: 'Support',
  helpCenterLink: 'Hilfe-Center',

  // resources/js\pages\LandingPage.tsx
  landingpage664: 'Impressum',

  // resources/js/pages/LandingPage.tsx
  contactUsLink: 'Kontakt',
  communityLink: 'Community',
  allRightsReserved: '© 2026 Scoriet, alle Rechte vorbehalten',

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: 'Datenschutz',
  termsOfService: 'Nutzungsbedingungen',

  // resources/js\pages\LandingPage.tsx
  landingpage716: 'Wählen Sie Ihren Plan',
  landingpage726: 'Aktueller Plan',
  landingpage727: 'Frei',
  landingpage730: 'Kostenloser Plan',
  landingpage743: 'AM BELIEBTESTEN',
  landingpage748: 'Brauch',
  landingpage764: 'Aktueller Plan',
  landingpage765: 'Frei',
  landingpage767: 'Frei',
  landingpage769: 'Frei',
  landingpage782: 'Sie können Ihren Plan jederzeit ändern oder kündigen. Alle Pläne beinhalten eine 30-tägige Geld-zurück-Garantie.',
  landingpage801: 'Registrierung erfolgreich',
  landingpage762: 'Sie befinden sich derzeit auf ',
  landingpage762a: 'Führen Sie ein Upgrade durch, um weitere Funktionen freizuschalten und das Projekt zu unterstützen!',
  landingpage814: 'Sie können Ihren Tarif jederzeit ändern oder kündigen. Alle Tarife beinhalten eine 30-Tage-Geld-zurück-Garantie.',
  landingpage796: 'Auswählen ',
  landingpage802: 'Upgrade auf ',
  landingpage802a: ' - Zahlungsintegration folgt in Kürze!',
  landingpage738:  'Ihr Browser unterstützt das Video-Element nicht.',
  landingpage647: ' - Demnächst erhältlich!',
  landingpage627: '/Monat',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse70: 'Ungültige oder abgelaufene Einladung',
  projectinvitationresponse77: 'Einladung konnte nicht geladen werden',
  projectinvitationresponse133: 'Bitte füllen Sie alle Pflichtfelder aus',
  projectinvitationresponse138: 'Passwörter stimmen nicht überein',
  projectinvitationresponse161: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen.',
  projectinvitationresponse167: 'Anmeldung fehlgeschlagen',
  projectinvitationresponse170: 'Fehler bei der Registrierung',
  projectinvitationresponse181: 'Einladung wird geladen...',
  projectinvitationresponse192: '🚀 Die Schlacke',
  projectinvitationresponse193: 'Enterprise Code Generator',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse223: 'Sie wurden eingeladen, an einem Projekt teilzunehmen, müssen aber zunächst ein Konto erstellen',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse233: 'Abfall',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse235: 'Sie wurden eingeladen, an einem Projekt auf Scoriet teilzunehmen',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse256: 'Eingeladen von:',
  projectinvitationresponse266: 'Rolle:',
  projectinvitationresponse273: 'Projektinhaber:',
  projectinvitationresponse283: 'Läuft ab:',
  projectinvitationresponse292: 'Persönliche Nachricht:',
  projectinvitationresponse307: '🚀 Konto erstellen und Projekt beitreten',
  projectinvitationresponse334: '✅ Einladung annehmen',
  projectinvitationresponse348: '❌ Einladung ablehnen',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse355: 'Sie können diese Einladung ablehnen, wenn Sie nicht an der Teilnahme an diesem Projekt interessiert sind.',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse373: 'Willkommen im Team!',
  projectinvitationresponse374: 'Einladung abgelehnt',
  projectinvitationresponse379: 'Sie können jetzt auf das Projekt zugreifen und mit der Zusammenarbeit mit Ihrem Team beginnen.',
  projectinvitationresponse380: 'Der Projektinhaber wurde über Ihre Entscheidung informiert.',
  projectinvitationresponse386: 'Zur Scoriet App',
  projectinvitationresponse399: 'Dies ist eine automatisierte Nachricht von Scoriet - Enterprise Code Generator',
  projectinvitationresponse407: 'Erstellen Sie Ihr Scoriet-Konto',
  projectinvitationresponse417: 'Vollständiger Name *',
  projectinvitationresponse428: 'Benutzername *',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse433: 'JohnDoe',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse436: 'Nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche',
  projectinvitationresponse440: 'E-Mail-Adresse *',
  projectinvitationresponse449: 'Vorausgefüllt aus der Einladung',
  projectinvitationresponse453: 'Passwort *',
  projectinvitationresponse458: 'Geben Sie Ihr Passwort ein',
  projectinvitationresponse466: 'Passwort bestätigen *',
  projectinvitationresponse471: 'Bestätigen Sie Ihr Passwort',
  projectinvitationresponse480: 'Abbrechen',
  projectinvitationresponse487: 'Benutzerkonto erstellen',

  // resources/views\admin\pages\create.blade.php
  createblade60: 'Geben Sie hier den Inhalt Ihrer Seite ein. HTML wird unterstützt.',

  // resources/views\emails\project-invitation.blade.php
  projectinvitationblade116: 'Wenn Sie Fragen haben',
  projectinvitationblade151: 'Abfall',

  // resources/views\layouts\static.blade.php
  staticblade37: 'Helfen',

  // resources/views\pages\help.blade.php
  helpblade3: 'Helfen',
  helpblade8: 'Hilfecenter',
  helpblade13: 'Willkommen im Scoriet-Hilfecenter',
  helpblade16: 'Erste Schritte',
  helpblade18: 'Erfahren Sie, wie Sie mit Scoriet loslegen können',
  helpblade21: 'Erstellen Sie Ihr erstes Projekt',
  helpblade24: 'Schritt 1',
  helpblade25: 'Schritt 2',
  helpblade26: 'Schritt 3',
  helpblade27: 'Schritt 4',
  helpblade31: 'Merkmale',
  helpblade34: 'Funktion 1',
  helpblade35: 'Funktion 2',
  helpblade36: 'Funktion 3',
  helpblade37: 'Funktion 4',
  helpblade41: 'Unterstützung',
  helpblade43: 'Kontaktieren Sie unser Support-Team',

  // resources/views\pages\impressum.blade.php
  impressumblade3: 'Impressum',
  impressumblade8: 'Impressum',
  impressumblade14: 'Angaben gemäß \' 5 TMG',
  impressumblade17: 'Firmenname',
  impressumblade18: 'Adresse',
  impressumblade22: 'Kontaktinformationen',
  impressumblade25: 'Geschäftsführer',
  impressumblade28: 'Handelsregister',
  impressumblade31: 'USt-IdNr.',

  // routes\api.php
  api36: 'Keine Schemaversion gefunden',
  api47: 'Erstellte Testtabelle mit ID:',
  api85: 'Dieses Token zum Zurücksetzen des Passworts ist ungültig.',
  api126: 'Abrufen der Preisinformationen fehlgeschlagen',
  api180: 'So wird die korrekte Verarbeitung der Template dargestellt',
  api181: 'Die Schleife wurde nicht richtig geschlossen und Variablen nicht ersetzt',
  api183: 'Loop verarbeitet alle Elemente ordnungsgemäß',
  api184: 'Variablen werden korrekt ersetzt',
  api185: 'Die Syntax ist sauber und gültiges PHP',
  api194: 'Simple Template Engine - KEINE REGEX',
  api197: 'Keine verschachtelten Konstrukte in einer Zeile',
  api198: 'Loops werden sauber geschlossen',
  api199: 'Kein Regex - nur einfache string operations',
  api202: 'Zeile-für-Zeile Verarbeitung',
  api203: 'Einfache Variable-Replacement',
  api204: 'Wartbarer Code ohne Regex',
  api205: 'Sichere JavaScript-Escaping',
  api300: 'Teams-Debug-Endpunkt funktioniert',
  api416: 'Teststrecke funktioniert',
  api427: 'Alle Projekte in der Datenbank',
  api452: 'Schemaversion nicht gefunden',
  api509: 'Debuggen fehlgeschlagen:',
  api528: 'Keine Einschränkungen gefunden',
  api745: 'Für dieses Schema wurde keine Version gefunden',
  api761: 'Tabellen werden für Schemaversions-ID geladen: {$schemaVersion->id} (Versionsnummer: {$schemaVersion->version_number})',
  api765: 'Erste Tabelle: {$firstTable->table_name}',
  api771: 'Die erste Einschränkung hat {$testColumns} Spalten in der Datenbank',
  api777: 'In diesem Schema wurden keine Tabellen gefunden',
  api803: '- MySQL-Datenbankexport',
  api804: '-- Schema:',
  api805: '-- Version:',
  api806: 'J-m-t H:i:s',
  api810: '-- WARNUNG: Probleme mit der Datenintegrität erkannt!',
  api812: '-- Diese Einschränkungen werden beim Export übersprungen',
  api813: '-- Erwägen Sie eine erneute Analyse dieser Schemaversion oder wenden Sie sich an den Support',
  api823: '-- Tabellenstruktur für Tabelle `',
  api860: 'Verarbeitung der Einschränkungs-ID {$constraint->id} für Tabelle {$table->table_name}',
  api869: '{$constraintColumns->count()} Spalten für Einschränkung {$constraint->id} gefunden',
  api872: 'Überspringen der Einschränkung {$constraint->id} - keine Spalten gefunden',
  api913: '-- Export erfolgreich abgeschlossen',
  api914: '-- Gesamtzahl der exportierten Tabellen:',
  api915: '-- Gesamtzahl der exportierten Einschränkungen:',
  api939: 'Export fehlgeschlagen:',
  api954: 'Keine Einschränkungen gefunden',
  api998: 'Für dieses Schema wurde keine Version gefunden',
  api1026: 'In diesem Schema wurden keine Tabellen gefunden',
  api1050: '- MySQL-Datenbankexport',
  api1051: '-- Schema:',
  api1052: '-- Version:',
  api1053: 'J-m-t H:i:s',
  api1059: '-- Tabellenstruktur für Tabelle `',
  api1142: '-- Export erfolgreich abgeschlossen',
  api1143: '-- Gesamtzahl der exportierten Tabellen:',
  api1161: 'Export fehlgeschlagen:',
  api1276: 'Globales gtree[] für clientseitiges Caching',
  api1285: 'Ausnahme aufgetreten',
  api1300: 'Debuggen der Join-Code-Suche',
  api1330: 'Template nicht gefunden',
  api1358: 'Ausnahme aufgetreten',
  api1379: 'Template nicht gefunden',
  api1386: 'Templateverarbeitung mit Projektfilter: {$projectId}',
  api1388: 'Templateverarbeitung ohne Projektfilter (Demomodus)',
  api1393: 'Templateverarbeitung mit Tabellenfilter: {$tableName}',
  api1431: 'Schemas für Projekt werden geladen: {$project->name}',
  api1438: '{$linkedSchemas->count()} verknüpfte Schemata für Projekt {$projectId} gefunden',
  api1454: '(Version {$latestVersion->id})',
  api1458: 'Gesamtzahl der mit dem Projekt verknüpften Tabellen: {$schemaTables->count()}',
  api1465: 'Projekt {$projectId} hat keine verknüpften Schemata - das ist normal, wenn keine Datenbanken mit dem Projekt verbunden sind',
  api1469: 'für Projekt {$projectId}, da table_name angegeben wurde',
  api1498: 'Dummy-Tabelle mit {$dummyFields->count()} Feldern erstellt',
  api1502: 'Kein Projekt angegeben',
  api1532: 'Demo-Projektdatenbank',
  api1676: '🔍 Überschreibung für Datei prüfen',
  api1682: 'als tabellenspezifisch aufgrund des Parameters table_name: {$tableName}',
  api1684: '❌ Override NICHT ausgelöst für',
  api1707: 'Tabelle nicht gefunden',
  api1760: ': table_index={$tableIndex}',
  api1809: 'Alle Dateien in einer JSON-Antwort',
  api1810: 'Keine mehrfachen HTTP-Anfragen erforderlich',
  api1814: 'Erhalten Sie den vollständigen gtree[] + alle generierten Dateien in einer einzigen Anfrage',
  api1815: 'Speichern Sie gtree[] im Browser zur späteren Verwendung',
  api1816: 'Generierte Dateien verarbeiten (Herunterladen/Anzeigen)',
  api1817: 'Optional: ZIP aus dem Array „generated_files“ erstellen',
  api1824: 'Ausnahme aufgetreten',

  // routes\gtree-ultimate.php
  gtreeultimate26: 'Template nicht gefunden',
  gtreeultimate85: 'J-m-t H:i:s',
  gtreeultimate86: 'J-m-t',
  gtreeultimate90: 'J-m-t H:i:s',
  gtreeultimate91: 'Demo-Benutzer',
  gtreeultimate95: 'Benutzer',
  gtreeultimate105: 'Demo-Score-Projekt',
  gtreeultimate120: 'Demo-Projektdatenbank',
  gtreeultimate149: 'J-m-t H:i:s',
  gtreeultimate160: 'J-m-t',
  gtreeultimate161: 'Sein',
  gtreeultimate163: 'J-m-t H:i:s',
  gtreeultimate409: 'Ausnahme in Ultimate Template Engine aufgetreten',

  // routes\web.php
  web50: 'Demo-Modus aktiviert! Daten werden alle 20 Minuten zurückgesetzt.',

  //js/components/AuthModals/CreditPurchaseModal.tsx
  creditpurchasemodal72: '💳 Credits kaufen',

  // resources/js/pages/PublicProjectPage.tsx
  publicProjectBy: 'von',
  publicProjectPoweredBy: 'Powered by',
  publicProjectTagline: 'Enterprise Code Generator',
  projectSettings: 'Projekteinstellungen',
  languages: 'Sprachen',
  dateFormat: 'Datumsformat',
  timeFormat: 'Zeitformat',
  currency: 'Währung',
  timezone: 'Zeitzone',
  teams: 'Teams',
  templates: 'Vorlagen',
  databases: 'Datenbanken',
  created: 'Erstellt',
  lastUpdated: 'Zuletzt aktualisiert',

  // resources/js/Components/Panels/ProjectPanel.tsx - Public Link
  copyPublicLink: 'Öffentlichen Link kopieren',
  publicLinkCopied: 'Öffentlicher Link in die Zwischenablage kopiert!',
  projectNotPublic: 'Projekt ist privat - auf öffentlich setzen um zu teilen',

  //resources/js/Components/Panels/FormDesignerPanel.tsx
  formdesignerpanel555: 'Zugriffsprüfung fehlgeschlagen',

};
