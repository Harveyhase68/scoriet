import type { Translations } from '../types';

export const it: Translations = {

  // app\Console\Commands\DebugSchemas.php
  debugschemas22: 'Esegui il debug di tutti gli schemi e delle relative tabelle',
  debugschemas29: '🔍 Debug di tutti gli schemi e le tabelle',
  debugschemas38: 'Trovato ',
  debugschemas49: 'Ultime versioni per schema:',
  debugschemas56: 'ID schema: {$schemaId}',
  debugschemas70: 'schemi con {$totalTables} tabelle totali',

  // app\Console\Commands\DemoReset.php
  demoreset16: 'demo:reset {--backup : Crea un backup prima del reset}',
  demoreset23: 'Ripristina il database demo allo stato iniziale con nuovi dati demo',
  demoreset31: 'Il ripristino demo può essere eseguito solo in ambiente locale o demo!',
  demoreset35: '🚀 Avvio del ripristino del database demo...',
  demoreset45: '✅ Il database demo è stato reimpostato con successo!',
  demoreset46: '📊 Utenti demo disponibili: demo-admin',
  demoreset53: '📦 Creazione del backup del database...',
  demoreset60: 'Y-m-d_H-i-s',
  demoreset65: '✅ Backup creato: {$filename}',
  demoreset70: '🗄️ Abbandono tutte le tabelle...',
  demoreset89: '🔄 Esecuzione delle migrazioni...',
  demoreset92: '🌱 Invio dei dati demo...',

  // app\Console\Commands\FixTemplateFilePaths.php
  fixtemplatefilepaths23: 'Correggi i valori file_path vuoti nella tabella template_files',
  fixtemplatefilepaths30: 'Controllo dei file modello con file_path vuoto...',
  fixtemplatefilepaths43: 'Trovati {$emptyCount} file con file_path vuoto su un totale di {$totalFiles} file',
  fixtemplatefilepaths46: 'Tutti i file modello hanno già valori file_path!',
  fixtemplatefilepaths50: 'Correzione dei valori file_path vuoti...',
  fixtemplatefilepaths70: 'ID file corretto {$file->id}: {$file->file_name} -> {$path}',
  fixtemplatefilepaths74: 'Percorsi dei file modello {$fixedCount} corretti con successo!',

  // app\Console\Commands\TestObservers.php
  testobservers28: 'Testare la funzionalità dell\'osservatore attivando vari eventi del modello',
  testobservers37: '🧪 Test della funzionalità Observer',
  testobservers42: 'Lavori in coda prima del test: {$jobsBefore}',
  testobservers68: 'Lavori in coda dopo il test: {$jobsAfter}',
  testobservers69: 'Nuovi lavori inviati: {$newJobs}',
  testobservers71: '✅ Test dell\'osservatore completato!',
  testobservers72: 'Consultare i registri per informazioni dettagliate sull\'attività degli osservatori.',
  testobservers77: '📋 Test Template Observer...',
  testobservers83: 'Modello di test per la funzionalità dell\'osservatore',
  testobservers92: '✅ Modello creato: {$template->id}',
  testobservers98: 'Ciao mondo',
  testobservers103: '✅ Aggiunto file al modello',
  testobservers106: 'Descrizione aggiornata',
  testobservers107: '✅ Modello aggiornato',
  testobservers111: '✅ Modello eliminato',
  testobservers114: '❌ Il test dell\'osservatore del modello non è riuscito:',
  testobservers120: '📄 Test di TemplateFile Observer...',
  testobservers126: 'Modello di test per l\'osservatore di file',
  testobservers139: 'File di prova',
  testobservers144: '✅ File modello creato: {$file->id}',
  testobservers147: 'Contenuto aggiornato',
  testobservers148: '✅ File modello aggiornato',
  testobservers152: '✅ File modello eliminato',
  testobservers158: '❌ Il test dell\'osservatore del file modello è fallito:',
  testobservers164: '🗄️ Test di SchemaVersion Observer...',
  testobservers174: '⚠️ Nessuna versione dello schema trovata per il progetto {$projectId}',
  testobservers183: 'Versione di prova per l\'osservatore',
  testobservers187: '✅ Versione schema creata: {$newVersion->id}',
  testobservers191: '✅ Versione dello schema eliminata',
  testobservers194: '❌ Il test dell\'osservatore SchemaVersion non è riuscito:',
  testobservers200: '📋 Test di SchemaTable Observer...',
  testobservers210: '⚠️ Nessuna versione dello schema trovata per il progetto {$projectId}',
  testobservers218: 'Tabella di prova per l\'osservatore',
  testobservers224: '✅ Tabella schema creata: {$table->id}',
  testobservers227: 'Commento aggiornato',
  testobservers228: '✅ Tabella degli schemi aggiornata',
  testobservers232: '✅ Tabella schema eliminata',
  testobservers235: '❌ Il test dell\'osservatore SchemaTable non è riuscito:',
  testobservers241: '🔗 Test di ProjectTemplateUsage Observer...',
  testobservers247: '⚠️ Nessun modello trovato',
  testobservers260: '✅ Utilizzo del modello di progetto creato: {$usage->id}',
  testobservers264: '✅ Utilizzo del modello di progetto aggiornato',
  testobservers268: '✅ Utilizzo del modello di progetto disattivato',
  testobservers272: '✅ Utilizzo del modello di progetto eliminato',
  testobservers275: '❌ Il test dell\'osservatore ProjectTemplateUsage non è riuscito:',

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas23: 'Testare le connessioni dello schema per un progetto',
  testprojectschemas32: '🔍 Test delle connessioni dello schema per il progetto {$projectId}',
  testprojectschemas37: 'Tutti gli schemi disponibili:',
  testprojectschemas47: 'Schemi di progetto per il progetto {$projectId}:',
  testprojectschemas50: 'Sconosciuto',
  testprojectschemas54: 'Tabelle da schemi connessi:',
  testprojectschemas59: 'Sconosciuto',
  testprojectschemas73: 'Schema',
  testprojectschemas79: ': Nessuna versione trovata',
  testprojectschemas83: 'Totale tabelle da tutti gli schemi connessi: {$totalTables}',

  // app\Console\Commands\TestTreeGenerator.php
  testtreegenerator25: 'Funzionalità di prova di ProjectFileTreeGenerator',
  testtreegenerator34: '🌳 Test di ProjectFileTreeGenerator',
  testtreegenerator40: 'Progetto {$projectId} non trovato',
  testtreegenerator44: 'Progetto: {$project->name} (ID: {$project->id})',
  testtreegenerator52: 'Utilizzi dei modelli attivi:',
  testtreegenerator62: 'Nodi dell\'albero generati:',
  testtreegenerator71: 'File modello {$usage->template_id} ({$template->name}):',
  testtreegenerator81: '    Bambini: ',
  testtreegenerator95: 'Niente bambini!',
  testtreegenerator101: 'ID albero di generazione salvato: {$generationTree->id}',
  testtreegenerator102: 'Elementi di dati dell\'albero:',
  testtreegenerator103: 'NO',

  // app\Console\Commands\TestTreeUpdate.php
  testtreeupdate23: 'Aggiornamento dell\'albero di prova per un progetto',
  testtreeupdate32: '🌳 Aggiornamento dell\'albero di test per il progetto {$projectId}',
  testtreeupdate37: 'Progetto {$projectId} non trovato',
  testtreeupdate44: 'Albero salvato con ID: {$tree->id}',
  testtreeupdate45: 'L\'albero ha',
  testtreeupdate48: 'Modello: {$templateGroup[',
  testtreeupdate50: 'File: {$fileCount}',

  // app\Http\Controllers\Admin\PageController.php
  pagecontroller50: 'Esiste già una pagina con questo slug per la lingua selezionata.',
  pagecontroller89: 'Pagina eliminata con successo.',

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller36: 'Progetto non trovato',
  autotranslatecontroller41: 'Non autorizzato',
  autotranslatecontroller49: 'La chiave API di Google Translate non è configurata per questo progetto. Aggiungi la tua chiave API in Impostazioni progetto → Impostazioni di localizzazione.',
  autotranslatecontroller57: 'Richiesta di traduzione automatica',
  autotranslatecontroller74: 'Risposta dell\'API di Google Translate',
  autotranslatecontroller83: 'Traduzione fallita',
  autotranslatecontroller91: 'testo tradotto',
  autotranslatecontroller94: 'testo tradotto',
  autotranslatecontroller99: 'Nessuna traduzione restituita',
  autotranslatecontroller114: 'Traduzione fallita per tutte le lingue',

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: 'Non autorizzato. È richiesto l\'accesso come amministratore di sistema.',
  languagecontroller102: 'Lingua eliminata con successo.',

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller155: 'I progetti privati sono disponibili solo per gli utenti premium',
  projectcontroller187: 'd.m.Y',
  projectcontroller188: 'Il suo',
  projectcontroller190: 'Europa/Vienna',
  projectcontroller230: 'Non autorizzato',
  projectcontroller246: 'Non autorizzato',
  projectcontroller294: 'Solo il proprietario del progetto può trasferire la proprietà',
  projectcontroller300: 'Il nuovo proprietario deve essere un membro del progetto',
  projectcontroller361: 'Non autorizzato',
  projectcontroller367: 'Progetto eliminato con successo',
  projectcontroller377: 'Non autorizzato',
  projectcontroller382: 'Progetto eliminato definitivamente',
  projectcontroller392: 'Non autorizzato',
  projectcontroller397: 'Progetto ripristinato con successo',
  projectcontroller407: 'Non autorizzato',
  projectcontroller429: 'Non autorizzato',
  projectcontroller451: 'Non autorizzato',
  projectcontroller523: 'Non autorizzato',
  projectcontroller540: 'Alcune squadre non ti appartengono',
  projectcontroller556: 'Squadre assegnate con successo',
  projectcontroller566: 'Non autorizzato',
  projectcontroller571: 'La squadra non ti appartiene',
  projectcontroller576: 'Il team non è assegnato a questo progetto',
  projectcontroller582: 'Il team è stato rimosso con successo dal progetto',
  projectcontroller592: 'Non autorizzato',
  projectcontroller605: 'Schema non trovato',
  projectcontroller610: 'Lo schema è già associato a questo progetto',
  projectcontroller616: 'Schema associato correttamente',
  projectcontroller626: 'Non autorizzato',
  projectcontroller631: 'Lo schema non è associato a questo progetto',
  projectcontroller637: 'Associazione schema rimossa correttamente',
  projectcontroller649: 'Progetto non trovato',
  projectcontroller675: 'Progetto non trovato',
  projectcontroller724: 'Progetto non trovato',
  projectcontroller778: 'Autorizzazioni insufficienti',
  projectcontroller788: 'L\'utente non è un membro di questo progetto',
  projectcontroller793: 'Impossibile rimuovere il proprietario del progetto',
  projectcontroller798: 'Solo il proprietario del progetto può rimuovere gli amministratori',
  projectcontroller814: 'Membro rimosso con successo dal progetto e da tutti i team associati',
  projectcontroller828: 'Solo il proprietario del progetto può modificare i ruoli dei membri',
  projectcontroller839: 'L\'utente non è un membro di questo progetto',
  projectcontroller844: 'Impossibile modificare il ruolo del proprietario',
  projectcontroller849: 'Ruolo del membro aggiornato con successo',
  projectcontroller861: 'Non autorizzato',
  projectcontroller876: 'Impostazioni del progetto aggiornate correttamente',
  projectcontroller890: 'Non autorizzato',
  projectcontroller907: 'Non autorizzato',
  projectcontroller1000: 'Non autorizzato',
  projectcontroller1026: 'Non autorizzato',
  projectcontroller1033: 'Albero di generazione rigenerato con successo',

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php
  projectgenerationtreecontroller23: 'Nessun albero generazionale trovato per questo progetto',
  projectgenerationtreecontroller52: 'Mancante ',
  projectgenerationtreecontroller61: 'Nessun albero generazionale trovato per questo progetto',

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller118: 'Schema non trovato',
  schemacontroller139: 'Non autorizzato a modificare questo schema',
  schemacontroller173: '🚨 RICHIESTA DI ELIMINA RICEVUTA',
  schemacontroller191: 'Non autorizzato a eliminare questo schema',
  schemacontroller206: 'Lo schema è utilizzato da {$projectsCount} progetti. Utilizzare l\'eliminazione forzata per procedere.',
  schemacontroller215: '🗑️ Avvio dell\'eliminazione dello schema',
  schemacontroller226: '🔥 Rimozione preventiva dell\'associazione del progetto',
  schemacontroller228: '✅ Associazioni di progetto {$deletedProjectAssociations} pre-rimosse',
  schemacontroller233: '✅ Distacco eloquente completato',
  schemacontroller235: '⚠️ Distacco Eloquent fallito:',
  schemacontroller240: '🔥 Avvio della transazione di eliminazione principale per lo schema {$schema->id}',
  schemacontroller248: '🔍 Ambito di eliminazione',
  schemacontroller259: '✅ Rimosse le colonne di riferimento della chiave esterna {$deletedReferenceColumns}',
  schemacontroller264: '✅ Rimossi i riferimenti alle chiavi esterne {$deletedReferences}',
  schemacontroller269: '✅ Rimosse le colonne di vincolo {$deletedConstraintColumns}',
  schemacontroller274: '✅ Rimossi i vincoli {$deletedConstraints}',
  schemacontroller279: '✅ Rimossi i campi dello schema {$deletedFields}',
  schemacontroller284: '✅ Rimossi i layout del progettista di schemi {$deletedLayouts}',
  schemacontroller288: '✅ Rimosse le tabelle dello schema {$deletedTables}',
  schemacontroller293: '✅ Rimosse {$deletedVersions} versioni dello schema',
  schemacontroller298: '🔍 Associazioni di progetto rimanenti: {$remainingAssociations}',
  schemacontroller302: '✅ Rimozione forzata delle associazioni di progetto rimanenti',
  schemacontroller307: '✅ Rimosso lo schema stesso',
  schemacontroller310: '🎉 Eliminazione dello schema completata con successo',
  schemacontroller316: 'Schema e tutti i dati correlati eliminati correttamente',
  schemacontroller323: '❌ Eliminazione dello schema non riuscita',
  schemacontroller330: 'Impossibile eliminare lo schema',
  schemacontroller345: 'Progetto non trovato',
  schemacontroller372: 'Schema non trovato',
  schemacontroller393: 'Versione dello schema non trovata',
  schemacontroller431: 'Non autorizzato a modificare questo schema',
  schemacontroller450: 'Layout salvato con successo',
  schemacontroller452: 'Errore di salvataggio del layout:',
  schemacontroller453: 'Stack trace:',
  schemacontroller455: 'Impossibile salvare il layout',
  schemacontroller470: 'Schema non trovato',
  schemacontroller489: 'Non autorizzato a modificare questo schema',
  schemacontroller514: 'Dati della richiesta CreateTable:',
  schemacontroller617: 'Tabella creata con successo',
  schemacontroller622: 'Eccezione CreateTable:',
  schemacontroller651: 'Non autorizzato a modificare questo schema',
  schemacontroller657: 'La tabella non appartiene a questa versione dello schema',
  schemacontroller684: 'Dati della richiesta UpdateTable:',
  schemacontroller804: 'Tabella aggiornata con successo',
  schemacontroller810: 'Impossibile aggiornare la tabella',
  schemacontroller827: 'Non autorizzato a modificare questo schema',
  schemacontroller833: 'La tabella non appartiene a questa versione dello schema',
  schemacontroller840: 'Tabella eliminata con successo',
  schemacontroller854: '🚨 DEBUG DEL BINDING DEL MODELLO DI PERCORSO: Immissione del metodo',
  schemacontroller880: 'Questa azione richiede uno schema mobile',
  schemacontroller885: 'Non autorizzato a modificare questo schema',
  schemacontroller890: 'La tabella non appartiene a questa versione dello schema',
  schemacontroller894: '🔍 API CHIAMATA: deleteTableWithVersionCopy',
  schemacontroller911: '🔍 VERIFICA CRITICA: Controllo della proprietà della tabella',
  schemacontroller924: '🔍 DOPPIO CONTROLLO: Ricerca nella tabella per ID nella versione',
  schemacontroller935: 'Eliminazione tabella: {$table->table_name}',
  schemacontroller938: '✅ Nuova versione creata',
  schemacontroller944: '🔍 PRIMA: Cerco una tabella da eliminare nella nuova versione',
  schemacontroller953: '🔍 DOPO: Risultato della ricerca nella tabella nella nuova versione',
  schemacontroller966: '❌ Tabella non trovata nella nuova versione',
  schemacontroller970: 'non trovato nella nuova versione {$newVersion->version_number}',
  schemacontroller974: '🗑️ IN PROcinto di ELIMINARE: Conferma finale prima dell\'eliminazione',
  schemacontroller990: '🗑️ Relazioni tra le tabelle prima dell\'eliminazione',
  schemacontroller999: '✅ Eliminazione tabella completata',
  schemacontroller1006: '✅ Tabella eliminata correttamente dalla nuova versione',
  schemacontroller1010: 'Nuova versione creata e tabella eliminata',
  schemacontroller1030: 'Non autorizzato a modificare questo schema',
  schemacontroller1048: 'Non autorizzato a modificare questo schema',
  schemacontroller1087: 'Non autorizzato a modificare questo schema',
  schemacontroller1110: 'Nuova tabella: {$request->table_name}',
  schemacontroller1116: 'Nuova tabella: {$request->table_name}',
  schemacontroller1125: 'Una tabella con questo nome esiste già in questa versione dello schema',
  schemacontroller1126: 'esiste già',
  schemacontroller1158: 'Nuova versione creata con tabella correttamente',
  schemacontroller1165: 'Impossibile creare la versione e la tabella',
  schemacontroller1182: 'Versione dello schema non trovata',
  schemacontroller1249: 'Questa azione richiede uno schema mobile',
  schemacontroller1256: 'Non autorizzato a modificare questo schema',
  schemacontroller1261: 'Con questo endpoint è possibile eliminare solo i vincoli di chiave esterna',
  schemacontroller1278: 'Elimina FK: {$constraint->constraint_name}',
  schemacontroller1284: 'Impossibile trovare la tabella nella nuova versione',
  schemacontroller1293: 'Impossibile trovare il vincolo nella nuova versione',
  schemacontroller1301: 'Nuova versione creata e chiave esterna eliminata',
  schemacontroller1314: 'Chiave esterna eliminata correttamente',
  schemacontroller1320: 'Vincolo non trovato',
  schemacontroller1322: 'Elimina errore FK:',
  schemacontroller1328: 'Impossibile eliminare la chiave esterna',
  schemacontroller1358: 'Questa azione richiede uno schema mobile',
  schemacontroller1365: 'Non autorizzato a modificare questo schema',
  schemacontroller1370: 'Con questo endpoint è possibile aggiornare solo i vincoli di chiave esterna',
  schemacontroller1381: 'Aggiorna FK: {$constraint->constraint_name}',
  schemacontroller1387: 'Impossibile trovare la tabella nella nuova versione',
  schemacontroller1396: 'Impossibile trovare il vincolo nella nuova versione',
  schemacontroller1404: 'Nuova versione creata e chiave esterna aggiornata',
  schemacontroller1416: 'Chiave esterna aggiornata correttamente',
  schemacontroller1422: 'Convalida fallita',
  schemacontroller1426: 'Vincolo non trovato',
  schemacontroller1428: 'Aggiornamento errore FK:',
  schemacontroller1434: 'Impossibile aggiornare la chiave esterna',
  schemacontroller1461: 'Questa azione richiede uno schema mobile',
  schemacontroller1468: 'Non autorizzato a modificare questo schema',
  schemacontroller1479: 'Crea FK su {$table->table_name}',
  schemacontroller1485: 'Impossibile trovare la tabella nella nuova versione',
  schemacontroller1493: 'Nuova versione creata e chiave esterna creata',
  schemacontroller1505: 'Chiave esterna creata correttamente',
  schemacontroller1511: 'Convalida fallita',
  schemacontroller1515: 'Tabella non trovata',
  schemacontroller1517: 'Crea errore FK:',
  schemacontroller1523: 'Impossibile creare la chiave esterna',

  // app\Http\Controllers\Api\SchemaTranslationController.php
  schematranslationcontroller71: 'Esiste già una traduzione per questo elemento e questa lingua.',
  schematranslationcontroller102: 'Esiste già una traduzione per questo elemento e questa lingua.',
  schematranslationcontroller115: 'Traduzione eliminata con successo.',
  schematranslationcontroller144: 'Progetto non trovato o accesso negato',
  schematranslationcontroller188: 'Sconosciuto',
  schematranslationcontroller263: 'Traduzioni aggiornate con successo.',

  // app\Http\Controllers\Api\SettingsController.php
  settingscontroller16: 'Non autorizzato. È richiesto l\'accesso come amministratore di sistema.',
  settingscontroller49: 'Impostazioni aggiornate correttamente',

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller29: 'Non autorizzato',
  templatecontroller92: 'Non autorizzato ad accedere a questo progetto',
  templatecontroller96: 'Non è possibile utilizzare questo modello',
  templatecontroller101: 'Il modello è già utilizzato da questo progetto',
  templatecontroller108: 'Modello collegato correttamente',
  templatecontroller129: 'Il nome del modello deve essere in lettere minuscole',
  templatecontroller141: 'Non autorizzato ad accedere a questo progetto',
  templatecontroller145: 'Impossibile clonare questo modello',
  templatecontroller156: 'Modello clonato con successo',
  templatecontroller170: 'Non autorizzato',
  templatecontroller245: 'Non autorizzato ad accedere a questo progetto',
  templatecontroller268: 'Assegnati correttamente {$assignedCount} modelli al progetto',
  templatecontroller288: 'Progetto non trovato',
  templatecontroller292: 'Modello non trovato',
  templatecontroller297: 'Non autorizzato ad accedere a questo progetto',
  templatecontroller307: 'Il modello non è assegnato a questo progetto',
  templatecontroller314: 'Modello rimosso dal progetto con successo',
  templatecontroller333: 'Non autorizzato',
  templatecontroller338: 'Utilizzo del modello rimosso correttamente',
  templatecontroller422: 'Non autorizzato',
  templatecontroller437: 'Non autorizzato',
  templatecontroller522: 'I modelli di sistema non possono essere eliminati',
  templatecontroller524: 'I modelli pubblici di altri utenti non possono essere eliminati',
  templatecontroller526: 'Non hai alcuna autorizzazione',
  templatecontroller537: 'Modello eliminato con successo',
  templatecontroller550: 'I modelli di sistema non possono essere eliminati definitivamente',
  templatecontroller552: 'I modelli pubblici di altri utenti non possono essere eliminati definitivamente',
  templatecontroller554: 'Non hai alcuna autorizzazione',
  templatecontroller567: 'Modello eliminato definitivamente',
  templatecontroller580: 'I modelli di sistema non possono essere attivati/disattivati',
  templatecontroller582: 'I modelli pubblici di altri utenti non possono essere modificati',
  templatecontroller584: 'Non hai alcuna autorizzazione',
  templatecontroller591: 'Modello disattivato correttamente',
  templatecontroller620: 'Non hai alcuna autorizzazione',
  templatecontroller649: 'Modello clonato con successo',
  templatecontroller682: 'Non hai alcuna autorizzazione',
  templatecontroller717: 'Impossibile caricare le dipendenze del modello',
  templatecontroller731: 'Non hai alcuna autorizzazione',
  templatecontroller741: 'Convalida non riuscita per l\'aggiunta della dipendenza dello schema DB',
  templatecontroller749: 'Convalida fallita',
  templatecontroller763: 'Questa dipendenza esiste già',
  templatecontroller777: 'Dipendenza dello schema DB aggiunta correttamente',
  templatecontroller781: 'Impossibile aggiungere la dipendenza dello schema DB:',
  templatecontroller789: 'Impossibile aggiungere la dipendenza:',
  templatecontroller803: 'Non hai alcuna autorizzazione',
  templatecontroller814: 'Dipendenza non trovata',
  templatecontroller822: 'Dipendenza dallo schema DB rimossa correttamente',
  templatecontroller827: 'Impossibile rimuovere la dipendenza',
  templatecontroller841: 'Non autorizzato',
  templatecontroller856: 'Non autorizzato',
  templatecontroller892: 'Non autorizzato',
  templatecontroller927: 'Non autorizzato',
  templatecontroller936: 'File eliminato con successo',
  templatecontroller944: '🧪 [API-TEMPLATE-QUEUE] Avvio dell\'invio del lavoro per il modello {$template->id} ({$template->name})',
  templatecontroller954: '🧪 [API-TEMPLATE-QUEUE] ID progetto trovati:',
  templatecontroller957: '🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: nessun progetto utilizza ancora questo template',
  templatecontroller961: '🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: Invio della rigenerazione per',
  templatecontroller965: '🧪 [API-TEMPLATE-QUEUE] Lavori in coda prima della spedizione: {$jobsBefore}',
  templatecontroller970: '🧪 [API-TEMPLATE-QUEUE] Invio del job RegenerateProjectGenerationTree per il progetto {$projectId}',
  templatecontroller975: '🧪 [API-TEMPLATE-QUEUE] Job inviato correttamente per il progetto {$projectId}',
  templatecontroller977: '🧪 [API-TEMPLATE-QUEUE] Impossibile inviare il lavoro per il progetto {$projectId}:',
  templatecontroller983: '🧪 [API-TEMPLATE-QUEUE] Lavori in coda dopo la spedizione: {$jobsAfter}',
  templatecontroller984: '🧪 [API-TEMPLATE-QUEUE] Totale lavori distribuiti: {$dispatchedJobs}',
  templatecontroller985: '🧪 [API-TEMPLATE-QUEUE] Invio del lavoro completato per il modello {$template->id}',

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller30: 'ID progetto richiesto',
  translationexportcontroller34: 'Almeno una lingua richiesta',
  translationexportcontroller48: 'Traduzioni',
  translationexportcontroller51: 'Campo',
  translationexportcontroller78: 'Tavolo',
  translationexportcontroller103: 'Campo',
  translationexportcontroller131: 'Y-m-d_H-i-s',
  translationexportcontroller175: 'Importa intestazioni:',
  translationexportcontroller197: 'Colonne della lingua da importare:',
  translationexportcontroller223: 'Tabelle esistenti:',
  translationexportcontroller224: 'Campi esistenti:',
  translationexportcontroller273: 'Salto dell\'elemento',
  translationexportcontroller278: 'Elaborazione della riga {$row}: tipo={$type}',
  translationexportcontroller312: 'Importazione avvenuta con successo! {$imported} nuove traduzioni importate',
  translationexportcontroller331: 'Errore di importazione della traduzione:',
  translationexportcontroller339: 'Importazione non riuscita:',

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller42: 'Modello non trovato',
  ultimatetemplatecontroller55: '🚀 Processo principaleTemplate: templateId=$templateId',
  ultimatetemplatecontroller102: 'Elaborazione del modello definitivo non riuscita',
  ultimatetemplatecontroller151: 'vincoli.colonne di vincoli.campo',
  ultimatetemplatecontroller165: 'vincoli.colonne di vincoli.campo',
  ultimatetemplatecontroller174: 'Schema demo',
  ultimatetemplatecontroller177: 'Schema del database dimostrativo',
  ultimatetemplatecontroller196: '🌍 Debug delle lingue: trovato',
  ultimatetemplatecontroller216: 'Progetto dimostrativo',
  ultimatetemplatecontroller241: 'Motore di modelli Scoriet definitivo',
  ultimatetemplatecontroller270: 'Y-m-d H:i:s',
  ultimatetemplatecontroller271: 'Y-m-d H:i:s',
  ultimatetemplatecontroller272: 'Utente demo',
  ultimatetemplatecontroller274: 'Progetto Demo Score',
  ultimatetemplatecontroller295: 'Generale',
  ultimatetemplatecontroller300: 'Y-m-d H:i:s',
  ultimatetemplatecontroller301: 'Sistema',
  ultimatetemplatecontroller308: 'd.m.Y',
  ultimatetemplatecontroller309: 'Il suo',
  ultimatetemplatecontroller311: 'Europa/Vienna',
  ultimatetemplatecontroller359: 'PK non trovato nei vincoli per {$tableName}',
  ultimatetemplatecontroller535: 'PK non trovato nei vincoli per {$tableName}',
  ultimatetemplatecontroller563: '🐛 Campi di vincolo estratti per {$tableName}',
  ultimatetemplatecontroller770: 'Y-m-d',
  ultimatetemplatecontroller771: 'Il suo',
  ultimatetemplatecontroller772: 'Y-m-d_H-i-s',
  ultimatetemplatecontroller804: '🔧 Debug backend: parametro tableName ricevuto:',
  ultimatetemplatecontroller815: '🔧 Debug backend: conteggio gtree:',
  ultimatetemplatecontroller825: '🔧 Debug backend: trovata la tabella all\'indice $index:',
  ultimatetemplatecontroller833: '🔧 Debug backend: nessun parametro tableName fornito',
  ultimatetemplatecontroller879: '// File generati',
  ultimatetemplatecontroller881: '// File: {$file[',

  // app\Http\Controllers\AuthController.php
  authcontroller42: 'Questo indirizzo email è già registrato. Vuoi effettuare l\'accesso?',
  authcontroller44: 'Si prega di inserire un indirizzo email valido.',
  authcontroller48: 'Questo nome utente è già in uso. Scegline uno diverso.',
  authcontroller50: 'Il nome utente deve contenere solo lettere minuscole',
  authcontroller54: 'Le password non corrispondono.',
  authcontroller56: 'La password deve essere lunga almeno 8 caratteri.',
  authcontroller59: 'Inserisci il tuo nome.',
  authcontroller61: 'Si prega di controllare i dati inseriti.',
  authcontroller83: 'Registrazione con token di invito',
  authcontroller100: 'Trovato invito in sospeso per la registrazione',
  authcontroller124: 'Impossibile inviare la notifica all\'amministratore:',
  authcontroller128: 'Utente registrato con successo. Controlla la tua email per il link di conferma.',
  authcontroller147: 'Errore di convalida',
  authcontroller156: 'Accesso non riuscito',
  authcontroller165: 'L\'indirizzo email deve essere confermato prima di effettuare l\'accesso',
  authcontroller183: 'Token di accesso personale',
  authcontroller190: 'Accesso riuscito',
  authcontroller209: 'Indirizzo email non trovato',
  authcontroller220: 'Il collegamento di reimpostazione è stato inviato',
  authcontroller225: 'Errore durante l\'invio del collegamento di ripristino',
  authcontroller242: 'Errore di convalida',
  authcontroller260: 'Password reimpostata correttamente',
  authcontroller265: 'Errore durante la reimpostazione della password',
  authcontroller292: 'Errore di convalida',
  authcontroller310: 'Profilo aggiornato con successo',
  authcontroller329: 'Errore di convalida',
  authcontroller337: 'La password attuale è errata',
  authcontroller346: 'Password modificata con successo',
  authcontroller359: 'Link di conferma non valido. L\'utente non esiste o è stato eliminato.',
  authcontroller367: 'Link di conferma non valido. Il link è scaduto o è stato compromesso.',
  authcontroller374: 'Token di accesso personale',
  authcontroller378: 'Indirizzo email già confermato',
  authcontroller389: 'Token di accesso personale',
  authcontroller401: 'Accettazione automatica dell\'invito dopo la verifica dell\'e-mail',
  authcontroller412: 'Invito accettato automaticamente con successo',
  authcontroller418: 'Indirizzo email confermato con successo',
  authcontroller429: 'Errore di conferma e-mail',
  authcontroller442: 'Indirizzo email già confermato',
  authcontroller449: 'L\'email di conferma è stata inviata di nuovo',
  authcontroller466: 'Errore di convalida',
  authcontroller474: 'La password inserita non è corretta',
  authcontroller488: 'Il tuo account è stato eliminato con successo',
  authcontroller492: 'Errore durante l\'eliminazione dell\'account',
  authcontroller506: 'Disconnessione avvenuta con successo',
  authcontroller521: 'Selezione della lingua non valida',
  authcontroller532: 'La preferenza della lingua è stata aggiornata correttamente',
  authcontroller537: 'Impossibile aggiornare la preferenza della lingua',

  // app\Http\Controllers\Auth\PasswordResetLinkController.php
  passwordresetlinkcontroller39: 'Se l\'account esiste, verrà inviato un link per reimpostarlo.',

  // app\Http\Controllers\CustomTokenController.php
  customtokencontroller51: 'Le credenziali fornite non sono corrette.',
  customtokencontroller58: 'L\'indirizzo email deve essere confermato prima di effettuare l\'accesso',
  customtokencontroller71: 'Le credenziali fornite non sono corrette.',
  customtokencontroller98: 'Errore del token OAuth:',
  customtokencontroller101: 'Si è verificato un errore durante l\'elaborazione della richiesta.',

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller59: 'ultima versione',
  dbschemacontroller66: 'Accesso negato a questo schema',
  dbschemacontroller77: 'Schema non trovato',
  dbschemacontroller95: 'Accesso negato a questo schema',
  dbschemacontroller111: 'Schema non trovato',
  dbschemacontroller129: 'Accesso negato a questo schema',
  dbschemacontroller145: 'Non puoi modificare questo modello',
  dbschemacontroller157: 'Il modello è già collegato a questo schema DB',
  dbschemacontroller171: 'Modello collegato correttamente allo schema del DB',
  dbschemacontroller195: 'Non puoi modificare questo modello',
  dbschemacontroller207: 'Modello scollegato correttamente dallo schema del DB',
  dbschemacontroller212: 'Dipendenza non trovata',
  dbschemacontroller223: 'ultima versione',
  dbschemacontroller256: 'Puoi copiare solo i tuoi schemi',
  dbschemacontroller264: 'Impossibile copiare uno schema vuoto. Lo schema di origine deve avere almeno una versione con tabelle.',
  dbschemacontroller281: 'Esiste già uno schema con questo nome. Scegline uno diverso.',
  dbschemacontroller288: '(Copia)',
  dbschemacontroller305: 'Lo schema di origine non ha versioni valide da copiare',
  dbschemacontroller310: 'tabelle.vincoli.foreignKeyReference.referenceColumns',
  dbschemacontroller317: 'Copiato da',
  dbschemacontroller332: 'Il nuovo ID schema non è impostato',
  dbschemacontroller335: 'Il nuovo ID della versione non è impostato',
  dbschemacontroller460: 'Schema del database copiato correttamente',
  dbschemacontroller472: 'Impossibile copiare lo schema:',

  // app\Http\Controllers\PageController.php
  pagecontroller43: 'Pagina di aiuto non trovata per la località: {$locale}',
  pagecontroller46: 'CMSPage',
  pagecontroller67: 'Pagina Impressum non trovata per la località: {$locale}',
  pagecontroller70: 'CMSPage',

  // app\Http\Controllers\ProjectApplicationController.php
  projectapplicationcontroller24: 'Errore di convalida',
  projectapplicationcontroller36: 'Codice di adesione non valido o applicazioni non consentite',
  projectapplicationcontroller49: 'Hai già inviato una domanda per questo progetto',
  projectapplicationcontroller64: 'Domanda inviata con successo',
  projectapplicationcontroller85: 'Nessuna autorizzazione',
  projectapplicationcontroller106: '=== ReviewApplication METODO CHIAMATO ===',
  projectapplicationcontroller118: 'ReviewApplication: convalida non riuscita',
  projectapplicationcontroller120: 'Errore di convalida',
  projectapplicationcontroller130: 'ID applicazione',
  projectapplicationcontroller131: 'Applicazione non trovata',
  projectapplicationcontroller137: 'Debug dell\'applicazione di revisione',
  projectapplicationcontroller153: 'ReviewApplication: Permesso negato',
  projectapplicationcontroller158: 'Nessuna autorizzazione - Non sei il proprietario del progetto',
  projectapplicationcontroller164: 'ReviewApplication: Già esaminato',
  projectapplicationcontroller166: 'Questa domanda è già stata elaborata',
  projectapplicationcontroller173: 'La domanda è stata accettata',
  projectapplicationcontroller176: 'La domanda è stata respinta',
  projectapplicationcontroller179: 'RevisioneApplicazione: Successo',
  projectapplicationcontroller210: 'ProjectApplicationController: getProjectByJoinCode chiamato',
  projectapplicationcontroller211: 'joinCode',
  projectapplicationcontroller220: 'ProjectApplicationController: risultato della ricerca del progetto',
  projectapplicationcontroller221: 'joinCode',
  projectapplicationcontroller231: 'Codice di iscrizione non valido. Controlla il codice.',
  projectapplicationcontroller237: 'Questo progetto non è più attivo.',
  projectapplicationcontroller243: 'Al momento questo progetto non accetta richieste di iscrizione.',

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller26: 'Non autorizzato',
  projectinvitationcontroller37: 'Convalida fallita',
  projectinvitationcontroller50: 'L\'utente è già membro di questo progetto',
  projectinvitationcontroller61: 'Un invito è già stato inviato a questo indirizzo email',
  projectinvitationcontroller80: 'Impossibile inviare l\'e-mail di invito al progetto',
  projectinvitationcontroller88: 'Invito inviato con successo',
  projectinvitationcontroller89: 'utente invitato',
  projectinvitationcontroller103: 'Token di invito non valido',
  projectinvitationcontroller107: 'Questo invito è scaduto',
  projectinvitationcontroller112: 'Questo invito è già stato accettato',
  projectinvitationcontroller113: 'Questo invito è già stato rifiutato',
  projectinvitationcontroller114: 'Questo invito è scaduto',
  projectinvitationcontroller115: 'Questo invito non è più valido',
  projectinvitationcontroller138: 'Token di invito non valido',
  projectinvitationcontroller143: 'L\'invito non è più valido',
  projectinvitationcontroller150: 'Impossibile accettare l\'invito',
  projectinvitationcontroller154: 'Invito accettato con successo',
  projectinvitationcontroller167: 'Token di invito non valido',
  projectinvitationcontroller172: 'L\'invito non è più valido',
  projectinvitationcontroller179: 'Impossibile rifiutare l\'invito',
  projectinvitationcontroller187: 'Impossibile inviare l\'e-mail di notifica del rifiuto',
  projectinvitationcontroller194: 'Invito rifiutato con successo',
  projectinvitationcontroller206: 'Non autorizzato',
  projectinvitationcontroller210: 'utente invitato',
  projectinvitationcontroller240: '=== Annulla richiesta di invito ===',
  projectinvitationcontroller250: 'Annulla invito: Non autorizzato',
  projectinvitationcontroller254: 'Non autorizzato',
  projectinvitationcontroller258: 'Annulla invito: progetto sbagliato',
  projectinvitationcontroller262: 'L\'invito non appartiene a questo progetto',
  projectinvitationcontroller266: 'Annulla invito: Non in sospeso',
  projectinvitationcontroller269: 'È possibile annullare solo gli inviti in sospeso',
  projectinvitationcontroller273: 'Invito annullato con successo',
  projectinvitationcontroller275: 'Invito annullato con successo',
  projectinvitationcontroller286: 'Nessun invito in sospeso',
  projectinvitationcontroller296: 'Nessun invito in sospeso',
  projectinvitationcontroller310: 'Nessun invito in sospeso',
  projectinvitationcontroller316: 'Nessun invito in sospeso',
  projectinvitationcontroller323: 'Impossibile accettare l\'invito',
  projectinvitationcontroller330: 'Invito accettato con successo',
  projectinvitationcontroller343: 'Nessun invito in sospeso',
  projectinvitationcontroller349: 'Nessun invito in sospeso',
  projectinvitationcontroller358: 'Invito rifiutato',

  // app\Http\Controllers\QueueTestController.php
  queuetestcontroller61: '🧪 [TEST] Avvio del test di invio dei lavori',
  queuetestcontroller65: 'Nessun progetto trovato',
  queuetestcontroller69: '🧪 [TEST] Lavori prima della spedizione: {$jobsBefore}',
  queuetestcontroller77: '🧪 [TEST] Lavori dopo la spedizione: {$jobsAfter}',
  queuetestcontroller86: 'Invio del lavoro fallito',
  queuetestcontroller89: '🧪 [TEST] Invio del lavoro fallito:',
  queuetestcontroller102: '🧪 [TEST] Avvio del test di creazione della versione dello schema',
  queuetestcontroller106: 'Nessuno schema trovato',
  queuetestcontroller116: 'Lo schema non è connesso ad alcun progetto',
  queuetestcontroller117: 'Collegare prima lo schema a un progetto utilizzando la tabella project_schemas',
  queuetestcontroller122: '🧪 [TEST] Lavori prima della creazione della versione dello schema: {$jobsBefore}',
  queuetestcontroller126: 'Versione di prova per il test della coda',
  queuetestcontroller127: '🧪 [TEST] Versione schema creata: {$version->id}',
  queuetestcontroller130: '🧪 [TEST] Lavori dopo la creazione della versione dello schema: {$jobsAfter}',
  queuetestcontroller142: 'Nessun lavoro inviato',
  queuetestcontroller145: '🧪 [TEST] Creazione della versione dello schema fallita:',
  queuetestcontroller162: 'Progetto non trovato',
  queuetestcontroller173: '🧪 [MANUALE] Lavoro inviato manualmente per il progetto {$projectId}',
  queuetestcontroller181: 'Lavoro inviato manualmente con successo',
  queuetestcontroller201: 'File di registro non trovato',
  queuetestcontroller211: '🧪 [CODA-TEST]',
  queuetestcontroller212: '🧪 [TEST]',
  queuetestcontroller213: '🧪 [MANUALE]',

  // app\Http\Controllers\SchemaController.php
  schemacontroller21: 'Dipendenze modello.modello',
  schemacontroller64: 'Dipendenze modello.modello',
  schemacontroller71: 'Accesso negato a questo schema',
  schemacontroller82: 'Schema non trovato',
  schemacontroller105: 'Per creare schemi privati è necessario un account premium',
  schemacontroller117: 'Hai già uno schema con questo nome',
  schemacontroller132: 'Schema creato con successo',
  schemacontroller155: 'Puoi modificare solo i tuoi schemi',
  schemacontroller169: 'Per rendere privati gli schemi è necessario un account premium',
  schemacontroller183: 'Hai già uno schema con questo nome',
  schemacontroller193: 'Schema aggiornato con successo',
  schemacontroller216: 'Puoi eliminare solo i tuoi schemi',
  schemacontroller225: 'Impossibile eliminare lo schema. È utilizzato da {$dependentTemplates} template',
  schemacontroller234: 'Schema eliminato con successo',
  schemacontroller256: 'Accesso negato a questo schema',
  schemacontroller272: 'Schema non trovato',
  schemacontroller290: 'Accesso negato a questo schema',
  schemacontroller306: 'Non puoi modificare questo modello',
  schemacontroller318: 'Il modello è già collegato a questo schema',
  schemacontroller332: 'Modello collegato allo schema correttamente',
  schemacontroller356: 'Non puoi modificare questo modello',
  schemacontroller368: 'Modello scollegato dallo schema correttamente',
  schemacontroller373: 'Dipendenza non trovata',
  schemacontroller384: 'Dipendenze modello.modello',

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller31: 'Accesso negato a questo schema',
  schemaexportcontroller56: 'Nessuna versione trovata per questo schema',
  schemaexportcontroller66: 'vincoli.colonne di vincoli.campo',
  schemaexportcontroller67: 'vincoli.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller125: 'Esportazione fallita:',
  schemaexportcontroller144: 'Accesso negato a questo schema',
  schemaexportcontroller169: 'Nessuna versione trovata per questo schema',
  schemaexportcontroller178: 'vincoli.colonne di vincoli.campo',
  schemaexportcontroller179: 'vincoli.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller193: 'Nessuna tabella trovata in questo schema',
  schemaexportcontroller213: 'Esportazione MySQL non riuscita:',
  schemaexportcontroller224: '-- Esportazione del database MySQL',
  schemaexportcontroller225: '-- Schema:',
  schemaexportcontroller226: 'Nessuna descrizione',
  schemaexportcontroller227: '-- Versione:',
  schemaexportcontroller228: '-- Generato:',
  schemaexportcontroller229: '-- Numero di tavoli:',
  schemaexportcontroller237: '-- Tavolo: ',
  schemaexportcontroller239: '-- Commento:',
  schemaexportcontroller272: 'COMMENTO',
  schemaexportcontroller283: 'Vincoli di elaborazione per la tabella: {$table->table_name}',
  schemaexportcontroller284: 'Conteggio dei vincoli:',
  schemaexportcontroller286: 'Vincolo: {$constraint->constraint_name} (tipo: {$constraint->constraint_type})',
  schemaexportcontroller287: 'ConstraintColumns conteggio:',
  schemaexportcontroller293: 'PRIMARIO',
  schemaexportcontroller339: 'IN CANCELLAZIONE',
  schemaexportcontroller358: 'COMMENTO',
  schemaexportcontroller367: '-- Esportazione completata con successo',
  schemaexportcontroller368: '-- Numero totale di tabelle esportate:',
  schemaexportcontroller386: 'Accesso negato a questo schema',
  schemaexportcontroller402: 'Impossibile ottenere il conteggio delle tabelle:',
  schemaexportcontroller418: 'Schema non trovato',
  schemaexportcontroller437: 'Nessuna versione trovata per questo schema',
  schemaexportcontroller447: 'vincoli.colonne di vincoli.campo',
  schemaexportcontroller448: 'vincoli.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller471: 'Indagine sulla relazione tra schema e contesto - APPROFONDIMENTO',
  schemaexportcontroller483: 'Schema → schema_versions → schema_tables (tramite schema_version_id)',
  schemaexportcontroller484: 'NULL (non utilizzato in questo sistema)',
  schemaexportcontroller489: 'Debug non riuscito:',

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: 'È richiesto lo script SQL',
  sqlparsercontroller72: 'È richiesto lo script SQL',
  sqlparsercontroller79: 'L\'ID schema è obbligatorio',
  sqlparsercontroller89: 'Schema non trovato',
  sqlparsercontroller98: 'Non hai l\'autorizzazione per modificare questo schema',
  sqlparsercontroller151: 'Importazione SQL non riuscita',
  sqlparsercontroller165: 'Errore di sintassi',
  sqlparsercontroller166: 'Controlla la sintassi SQL per verificare la presenza di punti e virgola mancanti',
  sqlparsercontroller171: 'Funzionalità non supportata',
  sqlparsercontroller172: 'Questa funzionalità SQL non è ancora supportata dal nostro parser. Prova a semplificare il tuo SQL.',
  sqlparsercontroller177: 'Errore di tabella/colonna',
  sqlparsercontroller178: 'Controllare le definizioni di tabelle e colonne per una sintassi corretta.',
  sqlparsercontroller182: 'Errore di analisi',
  sqlparsercontroller183: 'Controlla il tuo SQL per problemi comuni come punti e virgola mancanti',
  sqlparsercontroller236: '🐛 Debug delle modifiche interrotte',
  sqlparsercontroller262: '🐛 Dopo il filtraggio della tabella di sistema',
  sqlparsercontroller277: '🐛 Debug del messaggio di errore',
  sqlparsercontroller278: 'businessExistingTables',
  sqlparsercontroller279: 'businessNewTables',
  sqlparsercontroller280: 'numero di attività esistenti',
  sqlparsercontroller281: 'newBusinessCount',
  sqlparsercontroller282: 'businessExistingTables_type',
  sqlparsercontroller283: 'businessNewTables_type',
  sqlparsercontroller294: '🛡️ RILEVATA MODIFICA INTERROMPENTE: questa importazione SQL creerebbe una struttura di database completamente nuova senza sovrapposizioni di tabelle.',
  sqlparsercontroller295: 'La versione corrente ha {$existingBusinessCount} tabelle aziendali: {$existingTablesList}',
  sqlparsercontroller296: 'La nuova importazione contiene {$newBusinessCount} tabelle aziendali: {$newTablesList}',
  sqlparsercontroller297: '🚨 Per la sicurezza dei dati',
  sqlparsercontroller298: '✅ Soluzione: creare un nuovo database/schema per questa struttura anziché controllare la versione di quello esistente.',
  sqlparsercontroller299: '✅ Alternativa: assicurati che almeno un nome di tabella aziendale corrisponda tra le versioni.',
  sqlparsercontroller303: '✅ Validazione della modifica interrotta superata',
  sqlparsercontroller320: 'Versione dello schema non trovata',
  sqlparsercontroller361: 'Versione dello schema non trovata',
  sqlparsercontroller395: 'È richiesto lo script SQL',
  sqlparsercontroller405: 'SQL analizzato correttamente',
  sqlparsercontroller430: '🧪 [QUEUE-TEST] Avvio dell\'invio dei lavori per lo schema {$schema->id} ({$schema->name})',
  sqlparsercontroller439: '🧪 [QUEUE-TEST] ID progetto trovati:',
  sqlparsercontroller442: '🧪 [QUEUE-TEST] Schema {$schema->id}: nessun progetto interessato dalla rigenerazione della coda',
  sqlparsercontroller446: '🧪 [QUEUE-TEST] Schema {$schema->id}: Invio della rigenerazione per',
  sqlparsercontroller450: '🧪 [QUEUE-TEST] Lavori in coda prima della spedizione: {$jobsBefore}',
  sqlparsercontroller455: '🧪 [QUEUE-TEST] Invio del job RegenerateProjectGenerationTree per il progetto {$projectId}',
  sqlparsercontroller460: '🧪 [QUEUE-TEST] Job inviato correttamente per il progetto {$projectId}',
  sqlparsercontroller462: '🧪 [QUEUE-TEST] Impossibile inviare il lavoro per il progetto {$projectId}:',
  sqlparsercontroller468: '🧪 [QUEUE-TEST] Lavori in coda dopo la spedizione: {$jobsAfter}',
  sqlparsercontroller469: '🧪 [QUEUE-TEST] Totale lavori distribuiti: {$dispatchedJobs}',
  sqlparsercontroller470: '🧪 [QUEUE-TEST] Invio del lavoro completato per lo schema {$schema->id}',

  // app\Http\Controllers\TeamController.php
  teamcontroller88: 'Convalida fallita',
  teamcontroller117: 'Team creato con successo',
  teamcontroller131: 'Non autorizzato',
  teamcontroller149: 'Autorizzazioni insufficienti',
  teamcontroller169: 'Convalida fallita',
  teamcontroller191: 'Team aggiornato con successo',
  teamcontroller205: 'Solo il proprietario del team può eliminare il team',
  teamcontroller210: 'Team eliminato con successo',
  teamcontroller223: 'Autorizzazioni insufficienti',
  teamcontroller231: 'Membro non trovato',
  teamcontroller236: 'Impossibile rimuovere il proprietario del team',
  teamcontroller241: 'Membro rimosso con successo',
  teamcontroller254: 'Autorizzazioni insufficienti',
  teamcontroller263: 'Convalida fallita',
  teamcontroller273: 'Membro non trovato',
  teamcontroller278: 'Impossibile modificare il ruolo del proprietario',
  teamcontroller284: 'Ruolo del membro aggiornato con successo',
  teamcontroller298: 'Non autorizzato',
  teamcontroller308: 'Convalida fallita',
  teamcontroller317: 'L\'utente è già membro di questo team',
  teamcontroller330: 'Membro aggiunto al team con successo',
  teamcontroller344: 'Non autorizzato',

  // app\Http\Controllers\TeamInvitationController.php
  teaminvitationcontroller26: 'Autorizzazioni insufficienti',
  teaminvitationcontroller38: 'Convalida fallita',
  teaminvitationcontroller46: 'L\'utente è già un membro del team',
  teaminvitationcontroller56: 'L\'utente ha già un invito in sospeso',
  teaminvitationcontroller70: 'Invito inviato con successo',
  teaminvitationcontroller106: 'Autorizzazioni insufficienti',
  teaminvitationcontroller124: 'Token di invito non valido',
  teaminvitationcontroller132: 'Questo invito non è per te',
  teaminvitationcontroller137: 'L\'invito è scaduto',
  teaminvitationcontroller139: 'Impossibile accettare l\'invito',
  teaminvitationcontroller143: 'Invito accettato con successo',
  teaminvitationcontroller156: 'Token di invito non valido',
  teaminvitationcontroller164: 'Questo invito non è per te',
  teaminvitationcontroller168: 'Impossibile rifiutare l\'invito',
  teaminvitationcontroller171: 'Invito rifiutato',
  teaminvitationcontroller184: 'Autorizzazioni insufficienti',
  teaminvitationcontroller188: 'È possibile annullare solo gli inviti in sospeso',
  teaminvitationcontroller193: 'Invito annullato',
  teaminvitationcontroller206: 'Autorizzazioni insufficienti',
  teaminvitationcontroller210: 'È possibile inviare nuovamente solo inviti in sospeso o scaduti',
  teaminvitationcontroller222: 'Invito reinviato con successo',

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: 'Tutto',
  templatecontroller98: 'Modello non trovato',
  templatecontroller140: 'modelli/{$template->id}/{$fileData[',
  templatecontroller154: 'Modello creato con successo',
  templatecontroller222: 'Modello aggiornato con successo',
  templatecontroller243: 'Modello eliminato con successo',
  templatecontroller306: 'L\'assegnazione del modello è attualmente simulata - integrazione del database in sospeso',
  templatecontroller328: 'Rimozione del modello simulata con successo',
  templatecontroller329: 'La rimozione del modello è attualmente simulata - integrazione del database in sospeso',
  templatecontroller334: 'Rimozione simulata non riuscita',
  templatecontroller369: 'Gestore modelli Scoriet',
  templatecontroller382: 'Modello non trovato',
  templatecontroller420: 'Un modello con questo nome esiste già. Imposta overwrite_existing su true per sostituirlo.',
  templatecontroller445: 'modelli/{$template->id}/{$fileData[',
  templatecontroller455: 'Modello importato con successo',
  templatecontroller481: 'Modello non trovato',
  templatecontroller493: 'Aggiungi richiesta di dipendenza dello schema DB',
  templatecontroller509: 'Non è possibile aggiungere dipendenze a questo modello',
  templatecontroller523: 'Validazione superata',
  templatecontroller525: 'Convalida fallita',
  templatecontroller533: 'Schema trovato',
  templatecontroller538: 'Accesso allo schema negato',
  templatecontroller544: 'Accesso negato a questo schema DB',
  templatecontroller553: 'Controllo delle dipendenze',
  templatecontroller558: 'La dipendenza esiste già',
  templatecontroller561: 'Il modello dipende già da questo schema DB',
  templatecontroller565: 'Creare dipendenza',
  templatecontroller579: 'Dipendenza creata con successo',
  templatecontroller585: 'Dipendenza dello schema DB aggiunta correttamente',
  templatecontroller587: 'Eccezione in addDbSchemaDependency',
  templatecontroller616: 'Non è possibile rimuovere le dipendenze da questo modello',
  templatecontroller628: 'Dipendenza dallo schema DB rimossa correttamente',
  templatecontroller633: 'Dipendenza non trovata',
  templatecontroller654: 'Non è possibile aggiornare le dipendenze per questo modello',
  templatecontroller672: 'Dipendenza dello schema DB aggiornata correttamente',
  templatecontroller677: 'Dipendenza non trovata',
  templatecontroller695: 'Accesso negato a questo schema DB',
  templatecontroller713: 'Schema DB non trovato',
  templatecontroller723: '🧪 [TEMPLATE-QUEUE] Avvio dell\'invio dei lavori per il modello {$template->id} ({$template->name})',
  templatecontroller733: '🧪 [TEMPLATE-QUEUE] ID progetto trovati:',
  templatecontroller736: '🧪 [TEMPLATE-QUEUE] Template {$template->id}: nessun progetto utilizza ancora questo template',
  templatecontroller740: '🧪 [TEMPLATE-QUEUE] Template {$template->id}: Invio della rigenerazione per',
  templatecontroller744: '🧪 [TEMPLATE-QUEUE] Lavori in coda prima della spedizione: {$jobsBefore}',
  templatecontroller750: '🧪 [TEMPLATE-QUEUE] Invio del job RegenerateProjectGenerationTree per il progetto {$projectId}',
  templatecontroller754: '🧪 [TEMPLATE-QUEUE] Lavoro inviato correttamente per il progetto {$projectId}',
  templatecontroller756: '🧪 [TEMPLATE-QUEUE] Impossibile inviare il lavoro per il progetto {$projectId}:',
  templatecontroller762: '🧪 [TEMPLATE-QUEUE] Lavori in coda dopo la spedizione: {$jobsAfter}',
  templatecontroller764: '🧪 [TEMPLATE-QUEUE] Totale lavori distribuiti: {$dispatchedJobs}',
  templatecontroller765: '🧪 [TEMPLATE-QUEUE] Completamento dell\'invio del lavoro per il modello {$template->id}',

  // app\Http\Controllers\UserController.php
  usercontroller25: 'Utente non autenticato.',
  usercontroller36: 'Timestamp di accesso aggiornato correttamente.',

  // app\Http\Middleware\CheckSystemUser.php
  checksystemuser25: 'Accesso negato. Sono richiesti privilegi di sistema o di amministratore.',

  // app\Http\Middleware\EnsureUserIsAdmin.php
  ensureuserisadmin32: 'Controllo del middleware amministrativo',
  ensureuserisadmin42: 'Accesso amministratore negato: utente non autenticato',
  ensureuserisadmin47: 'Non autenticato. Effettua prima l\'accesso.',
  ensureuserisadmin52: 'Per favore effettua il login',
  ensureuserisadmin58: 'Risultato del controllo amministrativo',
  ensureuserisadmin64: 'Accesso amministratore negato: l\'utente non è amministratore/di sistema',
  ensureuserisadmin72: 'Vietato. È richiesto l\'accesso come amministratore.',
  ensureuserisadmin77: 'Accesso negato. Solo gli amministratori di sistema hanno accesso a quest\'area.',
  ensureuserisadmin80: 'Accesso amministratore concesso',

  // app\JobsegenerateProjectGenerationTree.php
  jobsegenerateprojectgenerationtree36: 'Progetto {$this->projectId} non trovato per la rigenerazione dell\'albero di generazione',
  jobsegenerateprojectgenerationtree40: 'Rigenerazione dell\'albero di generazione per il progetto: {$project->name} (ID: {$project->id})',
  jobsegenerateprojectgenerationtree45: 'Albero di generazione rigenerato con successo per il progetto {$project->id}. Elementi totali:',
  jobsegenerateprojectgenerationtree48: 'Impossibile rigenerare l\'albero di generazione per il progetto {$this->projectId}:',

  // app\Jobs\RegenerateProjectGenerationTree.php
  regenerateprojectgenerationtree36: 'Progetto {$this->projectId} non trovato per la rigenerazione dell\'albero di generazione',
  regenerateprojectgenerationtree40: 'Rigenerazione dell\'albero di generazione per il progetto: {$project->name} (ID: {$project->id})',
  regenerateprojectgenerationtree45: 'Albero di generazione rigenerato con successo per il progetto {$project->id}. Elementi totali:',
  regenerateprojectgenerationtree48: 'Impossibile rigenerare l\'albero di generazione per il progetto {$this->projectId}:',

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: 'Voi',

  // app\Models\FloatingSchema.php
  floatingschema180: '(Clone)',

  // app\Models\ProjectApplication.php
  projectapplication96: 'Aggiunto tramite approvazione dell\'applicazione',

  // app\Models\Project.php
  project430: 'Nessun utente autenticato per inviare l\'invito',

  // app\Models\SchemaVersion.php
  schemaversion50: 'Versione {$nextVersion}',
  schemaversion81: '🔍 creaNuovaVersioneConCopia inizio',
  schemaversion93: '✅ Nuova versione vuota creata',
  schemaversion101: '❌ Versione sorgente non trovata',
  schemaversion102: 'Versione sorgente {$fromVersionNumber} non trovata',
  schemaversion105: '✅ Versione sorgente trovata',
  schemaversion111: '🚀 Fase 1: Copia delle tabelle',
  schemaversion115: '📋 Copia della tabella',
  schemaversion127: '✅ Tabella creata',
  schemaversion134: '📝 Copia dei campi',
  schemaversion138: '🔤 Copia campo',
  schemaversion156: '✅ Campo copiato correttamente',
  schemaversion158: '❌ Impossibile copiare il campo',
  schemaversion168: '🔗 Fase 1: Copia dei vincoli non FK',
  schemaversion172: '🔒 Vincolo di copia',
  schemaversion182: '✅ Vincolo creato',
  schemaversion210: '🚨 Chiave esterna ignorata: tabella referenziata non trovata',
  schemaversion238: '❌ Impossibile copiare il vincolo',
  schemaversion248: '🚀 Fase 2: Elaborazione dei vincoli di chiave esterna',
  schemaversion254: '🔑 Elaborazione dei vincoli FK per la tabella',
  schemaversion261: '🔒 Fase 2: Creazione del vincolo FK',
  schemaversion273: '✅ Vincolo FK creato',
  schemaversion310: '✅ Riferimento FK creato con successo',
  schemaversion312: '❌ Fase 2: la tabella referenziata non è ancora stata trovata',
  schemaversion319: '❌ Impossibile copiare il vincolo FK nella Fase 2',
  schemaversion330: '📐 Copia dei dati di layout',
  schemaversion338: '📐 Trovato layout da copiare',
  schemaversion351: '📐 Layout copiato correttamente',
  schemaversion353: '📐 Nessun layout trovato da copiare dalla versione',
  schemaversion356: '❌ Impossibile copiare il layout',
  schemaversion365: '🎉 createNewVersionWithCopy completato con successo',
  schemaversion381: 'j.n.Y',

  // app\Notifications\NewUserRegistered.php
  newuserregistered40: 'd.m.Y H:i:s',
  newuserregistered43: '?? Nuova registrazione su Scoriet',
  newuserregistered44: 'Ciao Admin!',
  newuserregistered45: 'Un nuovo utente si è registrato su Scoriet:',
  newuserregistered47: '**Informazioni utente:**',
  newuserregistered48: '• **Nome:** ',
  newuserregistered49: '• **Nome utente:**',
  newuserregistered50: '• **E-Mail:** ',
  newuserregistered51: '• **ID utente:**',
  newuserregistered52: '• **Registrato il:**',
  newuserregistered54: '**Stato e-mail:**',
  newuserregistered56: 'Mostra gli utenti nel pannello di amministrazione',
  newuserregistered57: 'Questa e-mail è stata generata automaticamente.',
  newuserregistered58: 'Cordiali saluti dal sistema Scoriet',

  // app\Observers\ProjectGenerationTreeObserver.php
  projectgenerationtreeobserver17: '🌳 [GENERATION-TREE-OBSERVER] tree_data aggiornati per il progetto {$generationTree->project_id}',
  projectgenerationtreeobserver30: '🌳 [GENERATION-TREE-OBSERVER] evento salvato per il progetto {$generationTree->project_id}',
  projectgenerationtreeobserver44: '🌳 [GENERATION-TREE-OBSERVER] Aggiornamento sulla trasmissione per il progetto {$generationTree->project_id}',
  projectgenerationtreeobserver60: '🌳 [GENERATION-TREE-OBSERVER] Impossibile trasmettere l\'aggiornamento dell\'albero:',

  // app\Observers\ProjectObserver.php
  projectobserver18: 'Aggiornate le lingue del progetto {$project->id}: distribuzione della rigenerazione',

  // app\Observers\ProjectSchemaObserver.php
  projectschemaobserver23: '🔔 [PROJECT-SCHEMA-OBSERVER] Schema assegnato al progetto',
  projectschemaobserver33: '✅ [PROJECT-SCHEMA-OBSERVER] Job di generazione albero inviato',
  projectschemaobserver37: '❌ [PROJECT-SCHEMA-OBSERVER] Impossibile inviare il lavoro',
  projectschemaobserver51: '🔔 [PROJECT-SCHEMA-OBSERVER] Schema rimosso dal progetto',
  projectschemaobserver61: '✅ [PROJECT-SCHEMA-OBSERVER] Job di generazione albero inviato',
  projectschemaobserver65: '❌ [PROJECT-SCHEMA-OBSERVER] Impossibile inviare il lavoro',

  // app\Observers\ProjectTemplateUsageObserver.php
  projecttemplateusageobserver16: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] ha creato un evento attivato per l\'utilizzo {$projectTemplateUsage->id} (progetto: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver27: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] is_active è stato modificato per l\'utilizzo {$projectTemplateUsage->id} (progetto: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver37: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] evento eliminato attivato per l\'utilizzo {$projectTemplateUsage->id} (progetto: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver48: 'ProjectTemplateUsage {$projectTemplateUsage->id} ({$action}): Invio della rigenerazione per il progetto {$projectId}',
  projecttemplateusageobserver52: 'Job di rigenerazione inviato con successo per il progetto {$projectId}',
  projecttemplateusageobserver54: 'Impossibile inviare il processo di rigenerazione per il progetto {$projectId}:',

  // app\Observers\SchemaTableObserver.php
  schematableobserver17: '📋 [SCHEMA-TABLE-OBSERVER] ha creato un evento attivato per la tabella {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver26: '📋 [SCHEMA-TABLE-OBSERVER] evento aggiornato attivato per la tabella {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver35: '📋 [SCHEMA-TABLE-OBSERVER] evento eliminato attivato per la tabella {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver52: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Nessun progetto attivo trovato',
  schematableobserver56: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Invio della rigenerazione per TUTTI',
  schematableobserver66: '📋 [SCHEMA-TABLE-OBSERVER] Esecuzione sincrona del processo di rigenerazione per il progetto {$projectId}',
  schematableobserver72: 'Job di rigenerazione inviato con successo per il progetto {$projectId}',
  schematableobserver75: 'Impossibile inviare/eseguire il processo di rigenerazione per il progetto {$projectId}:',

  // app\Observers\SchemaVersionObserver.php
  schemaversionobserver17: 'SchemaVersionObserver: evento creato attivato per la versione dello schema {$schemaVersion->id}',
  schemaversionobserver50: 'SchemaVersion {$schemaVersion->id} ({$action}): Nessun progetto attivo trovato',
  schemaversionobserver54: 'SchemaVersion {$schemaVersion->id} ({$action}): Invio della rigenerazione per TUTTI',
  schemaversionobserver64: 'SchemaVersion {$schemaVersion->id} ({$action}): esecuzione sincrona del processo di rigenerazione per il progetto {$projectId}',
  schemaversionobserver70: 'Job di rigenerazione inviato con successo per il progetto {$projectId}',
  schemaversionobserver73: 'Impossibile inviare/eseguire il processo di rigenerazione per il progetto {$projectId}:',

  // app\Observers\TemplateFileObserver.php
  templatefileobserver17: '📄 [TEMPLATE-FILE-OBSERVER] ha creato un evento attivato per il file {$templateFile->id} (template: {$templateFile->template_id})',
  templatefileobserver26: '📄 [TEMPLATE-FILE-OBSERVER] evento aggiornato attivato per il file {$templateFile->id} (template: {$templateFile->template_id})',
  templatefileobserver35: '📄 [TEMPLATE-FILE-OBSERVER] evento eliminato attivato per il file {$templateFile->id} (template: {$templateFile->template_id})',
  templatefileobserver53: 'TemplateFile {$templateFile->id} ({$action}): nessun progetto interessato',
  templatefileobserver57: 'TemplateFile {$templateFile->id} ({$action}): Invio della rigenerazione per',
  templatefileobserver63: 'Job di rigenerazione inviato con successo per il progetto {$projectId}',
  templatefileobserver65: 'Impossibile inviare il processo di rigenerazione per il progetto {$projectId}:',

  // app\Observers\TemplateObserver.php
  templateobserver17: '🧪 [TEMPLATE-OBSERVER] ha creato un evento attivato per il modello {$template->id} ({$template->name})',
  templateobserver53: 'Il modello {$template->id} è stato eliminato forzatamente',
  templateobserver70: 'Template {$template->id} ({$action}): nessun progetto interessato',
  templateobserver74: 'Template {$template->id} ({$action}): Invio della rigenerazione per',

  // appotificationsewUserRegistered.php
  appotificationsewuserregistered40: 'd.m.Y H:i:s',
  appotificationsewuserregistered43: '🎉 Nuova registrazione su Scoriet',
  appotificationsewuserregistered44: 'Ciao Admin!',
  appotificationsewuserregistered45: 'Un nuovo utente si è registrato su Scoriet:',
  appotificationsewuserregistered47: '**Informazioni utente:**',
  appotificationsewuserregistered48: '• **Nome:** ',
  appotificationsewuserregistered49: 'Non specificato',
  appotificationsewuserregistered50: '• **E-Mail:** ',
  appotificationsewuserregistered51: '• **ID utente:**',
  appotificationsewuserregistered52: '• **Registrato il:**',
  appotificationsewuserregistered54: '⏳ Non ancora confermato',
  appotificationsewuserregistered56: 'Mostra gli utenti nel pannello di amministrazione',
  appotificationsewuserregistered57: 'Questa e-mail è stata generata automaticamente.',
  appotificationsewuserregistered58: 'Cordiali saluti dal sistema Scoriet',

  // app\Services\MySQLParser.php
  mysqlparser18: 'Errore di analisi:',

  // app\Services\ProjectFileTreeGenerator.php
  projectfiletreegenerator120: '🧪 [TREE-GEN] Tabelle caricate da TUTTI gli schemi:',
  projectfiletreegenerator193: 'Y-m-d',
  projectfiletreegenerator194: 'Il suo',
  projectfiletreegenerator195: 'Y-m-d_H-i-s',
  projectfiletreegenerator226: '🧪 [TREE-GEN] Il percorso risolto è vuoto per l\'ID TemplateFile {$templateFile->id}',
  projectfiletreegenerator263: 'Y-m-d',
  projectfiletreegenerator264: 'Il suo',
  projectfiletreegenerator265: 'Y-m-d_H-i-s',
  projectfiletreegenerator296: '🧪 [TREE-GEN] Il percorso risolto è vuoto per l\'ID TemplateFile {$templateFile->id}',
  projectfiletreegenerator331: 'Y-m-d',
  projectfiletreegenerator332: 'Il suo',
  projectfiletreegenerator333: 'Y-m-d_H-i-s',
  projectfiletreegenerator364: '🧪 [TREE-GEN] Il percorso risolto è vuoto per l\'ID TemplateFile {$templateFile->id}',
  projectfiletreegenerator498: 'de_DE',
  projectfiletreegenerator500: 'fr_FR',
  projectfiletreegenerator502: 'esso_IT',
  projectfiletreegenerator504: 'nl_NL',
  projectfiletreegenerator505: 'pl_PL',
  projectfiletreegenerator506: 'ru_RU',
  projectfiletreegenerator507: 'ja_JP',
  projectfiletreegenerator508: 'zh_CN',

  // app\Services\SchemaStorageService.php
  schemastorageservice226: 'Tabella referenziata',
  schemastorageservice394: '🔧 Chiave del file migrata',
  schemastorageservice413: '🔧 Nome file rinominato migrato',
  schemastorageservice427: '🔧 Nome file abbreviato migrato',
  schemastorageservice436: '🔧 Nome file breve generato automaticamente',

  // app\Services\SimpleFixedTemplateEngine.php
  simplefixedtemplateengine661: '✅ {filename} è stato sostituito correttamente con accounting_log',
  simplefixedtemplateengine662: '✅ Niente più fantasmi in JavaScript',
  simplefixedtemplateengine663: '✅ Costrutti di modelli su linee proprie',
  simplefixedtemplateengine664: '✅ Strutture ad anello pulite',
  simplefixedtemplateengine665: '✅ Nessuna espressione regolare, solo operazioni sulle stringhe',

  // app\Services\SimpleTemplateEngine.php
  simpletemplateengine128: 'Sconosciuto',
  simpletemplateengine129: 'Sconosciuto',
  simpletemplateengine130: 'Sconosciuto',
  simpletemplateengine153: 'Sconosciuto',
  simpletemplateengine154: 'Sconosciuto',

  // app\Services\SQLParser.php
  sqlparser71: 'Errore di sintassi SQL: token previsto',
  sqlparser75: 'Errore di sintassi SQL: previsto',
  sqlparser83: 'Errore di sintassi SQL: fine imprevista dello script SQL {$context}. Punto e virgola mancante o istruzione incompleta?',
  sqlparser96: 'alla fine di SQL',
  sqlparser130: '(riga SQL: {$currentLine}',
  sqlparser152: 'Nome della tabella previsto',
  sqlparser237: 'Nome del campo previsto',
  sqlparser466: 'Nome della tabella previsto',

  // app\Services\StepByStepTemplateEngine.php
  stepbysteptemplateengine392: 'I costrutti dei modelli sono suddivisi in singole righe',
  stepbysteptemplateengine394: '{for} e {if} sono trattati come blocchi separati',
  stepbysteptemplateengine395: 'altro in JavaScript',
  stepbysteptemplateengine396: 'Pulitore',

  // app\Services\UltimateTemplateEngine.php
  ultimatetemplateengine195: 'Profondità massima del loop superata',
  ultimatetemplateengine656: '// Formato del ciclo in linea sconosciuto: {$matchText}',
  ultimatetemplateengine968: '// Funzioni modello integrate',

  // resources/js\app.tsx
  app48: 'euro',
  app59: 'euro',

  // resources/js\Components\AuthModals\AuthModalManager.tsx
  authmodalmanager3: './RegisterModal',
  authmodalmanager5: './ProfileModal',
  authmodalmanager7: './PlanModal',

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: 'Le password non corrispondono',
  authmodalsegistermodal84: 'Registrazione non riuscita. Riprova.',
  authmodalsegistermodal94: 'Registrazione avvenuta con successo! Controlla la tua email per un link di verifica prima di effettuare l\'accesso.',
  authmodalsegistermodal109: 'Si è verificato un errore',
  authmodalsegistermodal203: 'Registro',
  authmodalsegistermodal239: 'Il tuo nome completo',
  authmodalsegistermodal293: 'La tua password',
  authmodalsegistermodal312: 'Ripeti la password',
  authmodalsegistermodal335: 'Seleziona la lingua',
  authmodalsegistermodal351: 'Seleziona la lingua',
  authmodalsegistermodal366: 'Seleziona la lingua',
  authmodalsegistermodal379: 'Registro',
  authmodalsegistermodal388: 'Hai già un account? Accedi',

  // resources/js\Components\AuthModalsesetPasswordModal.tsx
  authmodalsesetpasswordmodal73: 'Questo collegamento di reimpostazione non è valido o è scaduto.',
  authmodalsesetpasswordmodal79: 'Errore durante la convalida del collegamento di reimpostazione.',
  authmodalsesetpasswordmodal122: 'Errore password:',
  authmodalsesetpasswordmodal124: 'Errore token:',
  authmodalsesetpasswordmodal127: 'Si è verificato un errore sconosciuto. Riprova.',
  authmodalsesetpasswordmodal131: 'Errore di rete. Riprova più tardi.',
  authmodalsesetpasswordmodal162: 'Vicino',
  authmodalsesetpasswordmodal265: 'Inserisci la nuova password',
  authmodalsesetpasswordmodal287: 'Ripeti la password',
  authmodalsesetpasswordmodal319: 'Reimposta password',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: 'Errore durante l\'invio dell\'e-mail',
  forgotpasswordmodal46: 'Un link per reimpostare la password è stato inviato al tuo indirizzo email.',
  forgotpasswordmodal50: 'Si è verificato un errore',
  forgotpasswordmodal73: 'Ha dimenticato la password',

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal83: 'Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password.',
  forgotpasswordmodal105: 'E-Mail',
  forgotpasswordmodal113: 'your.email@example.com',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: 'Reimposta collegamento Invia',
  forgotpasswordmodal131: 'Torna al login',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginPasswordHint: 'La tua password',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal46: 'lingua modificata',
  loginmodal49: 'lingua modificata',
  loginmodal88: 'L\'indirizzo email deve essere confermato. Controlla la tua posta elettronica.',
  loginmodal93: 'Accesso non riuscito',
  loginmodal136: 'Si è verificato un errore',
  loginmodal139: 'Accesso non riuscito',
  loginmodal140: 'L\'email/nome utente o la password non sono corretti.',
  loginmodal142: 'L\'indirizzo email deve essere confermato.',
  loginmodal184: 'L\'email di conferma è stata inviata di nuovo!',
  loginmodal189: 'Errore durante l\'invio dell\'e-mail. Riprova più tardi.',
  loginmodal212: 'Login',

  // resources/js/Components/AuthModals/LoginModal.tsx
  loginmodal241: 'Il tuo indirizzo email non è stato ancora confermato.',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal246: 'Invia nuovamente l\'email di conferma',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginDemoTextHeader: 'Modalità demo disponibile',
  LoginDemoDescription: 'Prova Scoriet senza registrazione con dati demo già pronti:',
  LoginDemoAdmin: '- Accesso completo, 2 team, 3 progetti',
  LoginDemoUser: '- Membro del team, assegnato 1 progetto',
  LoginToolTip: 'Fai clic sulle carte sopra per una demo immediata o inserisci manualmente il nome utente demo (lascia la password vuota). La demo si riavvia ogni 20 minuti.',
  LoginEmailOrUserName: 'E-mail o nome utente',
  LoginEmailOrUserNameHint: 'demo-admin o demo-user',
  LoginPassword: 'Parola d\'ordine',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal317: 'Lasciare vuoto per la demo',
  loginmodal334: 'Ricordati di me',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: 'Rimani connesso (30 giorni)',
  LoginStayLoggedInTooltip: 'Rimarrai connesso anche dopo aver chiuso il browser',
  LoginDoLogin: 'Accesso in corso...',
  LoginButton: 'Accesso',
  LoginRegister: 'Non hai un account? Registrati',
  LoginForgotPassword: 'Ha dimenticato la password?',

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal26: 'euro',
  planmodal43: 'Gratuito',
  planmodal46: 'Perfetto per progetti personali',
  planmodal48: 'Fino a 3 progetti',
  planmodal49: 'Modelli di base',
  planmodal50: 'Analisi dello schema SQL',
  planmodal51: 'Supporto della comunità',
  planmodal53: 'Piano attuale',
  planmodal58: 'Premio',
  planmodal62: 'Ideale per sviluppatori professionisti',
  planmodal64: 'Progetti illimitati',
  planmodal65: 'Modelli avanzati',
  planmodal66: 'Creazione di modelli personalizzati',
  planmodal67: 'Supporto prioritario',
  planmodal68: 'Funzionalità SQL avanzate',
  planmodal69: 'Collaborazione di squadra',
  planmodal71: 'Scegli Premium',
  planmodal76: 'Attività commerciale',
  planmodal80: 'Ideale per team e agenzie',
  planmodal82: 'Tutte le funzionalità Premium',
  planmodal83: 'Strumenti di collaborazione di squadra',
  planmodal84: 'Integrazione dell\'API di Google Translate',
  planmodal85: 'Analisi avanzate',
  planmodal86: 'Supporto prioritario con SLA',
  planmodal87: 'Opzioni di branding personalizzate',
  planmodal89: 'Scegli Business',
  planmodal94: 'Patrono',
  planmodal97: 'Sostieni la comunità',
  planmodal99: 'Tutte le funzionalità aziendali',
  planmodal100: 'Accesso anticipato alle funzionalità',
  planmodal101: 'Sviluppo dell\'influenza',
  planmodal102: 'Accesso alla comunità Discord',
  planmodal103: 'Importo personalizzato (€5-50+)',
  planmodal105: 'Scegli il Patrono',
  planmodal116: 'Scegli il tuo piano',
  planmodal126: 'Piano attuale',
  planmodal127: 'Gratuito',
  planmodal130: 'Piano gratuito',
  planmodal143: 'I PIÙ POPOLARI',
  planmodal147: 'Patrono',
  planmodal151: 'Costume',
  planmodal173: 'Gratuito',
  planmodal175: 'Gratuito',
  planmodal177: 'Gratuito',
  planmodal190: 'Puoi modificare o annullare il tuo piano in qualsiasi momento. Tutti i piani includono una garanzia di rimborso di 30 giorni.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal42: 'lingua modificata',
  profilemodal45: 'lingua modificata',
  profilemodal115: 'Non hai effettuato l\'accesso',
  profilemodal127: 'Errore durante il caricamento dei dati utente',
  profilemodal146: 'Errore durante il caricamento',
  profilemodal167: 'Non hai effettuato l\'accesso',
  profilemodal186: 'Errore durante l\'aggiornamento',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: 'Profilo aggiornato con successo',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: 'Errore di aggiornamento del profilo',
  profilemodal214: 'lingua modificata',
  profilemodal246: 'Le nuove password non corrispondono',
  profilemodal254: 'Non hai effettuato l\'accesso',
  profilemodal273: 'Errore durante la modifica della password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: 'Password cambiata con successo',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal280: 'Si è verificato un errore',
  profilemodal305: 'ELIMINARE',
  profilemodal306: 'Devi inserire ELIMINA per eliminare il tuo account',
  profilemodal314: 'Non hai effettuato l\'accesso',
  profilemodal318: 'ELIMINARE',
  profilemodal331: 'Errore durante l\'eliminazione dell\'account',
  profilemodal334: 'Account eliminato con successo. Verrai disconnesso automaticamente.',
  profilemodal346: 'Si è verificato un errore',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: 'Impostazioni profilo',
  profileTab: 'Profilo',
  profilemodal406: 'ID utente',
  profilemodal421: 'Nome utente',
  fullName: 'Nome completo',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal447: 'Il tuo nome completo',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  emailAddress: 'Indirizzo email',
  profilemodal463: 'ihre.email@example.com',
  preferredLanguage: 'Lingua preferita',
  languageDescription: 'Scegli la tua lingua preferita per l\'interfaccia dell\'applicazione',

  // Email Notification Settings
  emailNotifications: 'Notifiche e-mail',
  emailSystemNotifications: 'Notifiche di sistema',
  emailSystemNotificationsDesc: 'Messaggi di sistema importanti, annunci e messaggi amministrativi',
  emailUserNotifications: 'Messaggi utenti',
  emailUserNotificationsDesc: 'Messaggi da altri utenti, team e notifiche di progetto',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal498: 'Seleziona la lingua',
  profilemodal510: 'Il nome utente non può essere modificato dopo la registrazione.',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  updating: 'Aggiornamento...',
  updateProfile: 'Aggiorna profilo',
  passwordTab: 'Cambia password',
  currentPassword: 'Password attuale',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal555: 'La tua password attuale',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  newPassword: 'Nuova password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal573: 'La tua nuova password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  confirmPassword: 'Conferma nuova password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal591: 'Ripeti la nuova password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  changing: 'Cambiando...',
  changePassword: 'Cambia password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal611: 'Piani e fatturazione',
  profilemodal616: 'Piano attuale',
  profilemodal617: 'Gratuito',
  profilemodal620: 'Piano gratuito',
  profilemodal626: 'Piani disponibili',
  profilemodal632: 'Gratuito',
  profilemodal635: '• Fino a 3 progetti',
  profilemodal636: '• Modelli di base',
  profilemodal637: '• Supporto della comunità',
  profilemodal640: 'Attuale',
  profilemodal648: 'Premio',
  profilemodal651: '• Progetti illimitati',
  profilemodal652: '• Modelli avanzati',
  profilemodal653: '• Supporto prioritario',
  profilemodal654: '• Collaborazione di squadra',
  profilemodal658: 'Aggiornamento',
  profilemodal661: 'Passa a Premium: in arrivo!',
  profilemodal670: 'Patrono',
  profilemodal673: '• Tutte le funzionalità Premium',
  profilemodal674: '• Accesso anticipato alle funzionalità',
  profilemodal675: '• Accesso alla community Discord',
  profilemodal676: '• Importo personalizzato (€ 5-50+)',
  profilemodal680: 'Diventa Patrono',
  profilemodal683: 'Diventa sostenitore - Prossimamente!',
  profilemodal739: 'Attenzione: Elimina account',
  profilemodal684: '• Tutte le funzionalità premium',
  profilemodal685: '• Strumenti per la collaborazione di squadra',
  profilemodal686: '• Integrazione API di Google Translate',
  profilemodal687: '• Analisi avanzate',
  profilemodal688: '• Supporto prioritario con SLA',
  profilemodal689: '• Opzioni di branding personalizzate',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleteTab: 'Elimina account',
  profilemodal714: 'Questa azione non può essere annullata. Il tuo account e tutti i dati associati verranno eliminati definitivamente.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal718: 'Tutti i tuoi progetti e modelli verranno eliminati',
  profilemodal719: 'La tua iscrizione al team verrà terminata',
  profilemodal720: 'Questa azione non può essere annullata',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal725: 'Conferma la password corrente',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal732: 'La tua password attuale',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal743: 'Inserisci ELIMINA per confermare',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal744: 'ELIMINARE',
  profilemodal750: 'confermaTesto',
  profilemodal751: 'ELIMINARE',
  profilemodal757: 'ELIMINARE',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: 'Eliminando...',
  saving: 'Salvando...',
  deleteAccount: 'Elimina account',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal766: 'ELIMINARE',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: 'Le password non corrispondono',
  registermodal84: 'Registrazione non riuscita. Riprova.',
  registermodal94: 'Registrazione avvenuta con successo! Controlla la tua email per trovare un link di verifica prima di effettuare l\'accesso.',

  // resources\js\Components\AuthModals\RegisterModal.tsx
  registermodal102: 'Registrazione avvenuta con successo! ${userId ? `Il tuo ID utente è: ${userId}. ` : \'\'}Ora puoi effettuare l\'accesso.',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: 'Si è verificato un errore',
  registermodal203: 'Registro',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: 'Nome',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal239: 'Il tuo nome completo',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal244: 'Il tuo nome completo',
  registermodal261: 'nomeutente123',
  registermodal274: 'E-Mail',
  registermodal282: 'your.email@example.com',
  registermodal291: 'password',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal293: 'La tua password',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal298: 'La tua password',
  registermodal310: 'Conferma password',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal312: 'Ripeti la password',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal317: 'Ripeti la password',
  registermodal329: 'Lingua preferita',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal335: 'Seleziona la lingua',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal340: 'Seleziona la lingua',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal351: 'Seleziona la lingua',
  registermodal366: 'Seleziona la lingua',
  registermodal379: 'Registrazione in corso...',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal384: 'Registro',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: 'Hai già un account? Accedi',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal393: 'Hai già un account? Accedi',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal59: 'Richiesta XMLHttp',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal73: 'Questo collegamento di reimpostazione non è valido o è scaduto.',
  resetpasswordmodal79: 'Errore durante la convalida del collegamento di reimpostazione.',
  resetpasswordmodal122: 'Errore password:',
  resetpasswordmodal124: 'Errore token:',
  resetpasswordmodal127: 'Si è verificato un errore sconosciuto. Riprova.',
  resetpasswordmodal131: 'Errore di rete. Riprova più tardi.',
  resetpasswordmodal162: 'Vicino',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal191: 'Il collegamento di reimpostazione è in fase di convalida...',
  resetpasswordmodal194: 'Un attimo, per favore...',
  resetpasswordmodal208: 'Verrai automaticamente reindirizzato alla pagina di accesso...',
  resetpasswordmodal219: 'Collegamento di ripristino non valido',
  resetpasswordmodal231: 'Per accedere',
  resetpasswordmodal234: 'Richiedi un nuovo link di reimpostazione se desideri reimpostare la tua password.',
  resetpasswordmodal243: 'E-Mail',
  resetpasswordmodal259: 'Nuova password',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal265: 'Inserisci la nuova password',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal281: 'Conferma password',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal287: 'Ripeti la password',
  resetpasswordmodal319: 'Reimposta password',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal332: 'Continua ad accedere',
  resetpasswordmodal345: 'Il collegamento di ripristino non è valido o è scaduto.',
  resetpasswordmodal374: 'Login',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: 'Impossibile caricare gli schemi',
  databaseexportmodal93: 'Impossibile caricare gli schemi',
  databaseexportmodal114: 'Impossibile caricare le versioni dello schema',
  databaseexportmodal141: 'Impossibile caricare le versioni dello schema',
  databaseexportmodal169: 'Nessun progetto selezionato. Seleziona prima un progetto.',
  databaseexportmodal195: 'Seleziona un database e una versione da esportare',
  databaseexportmodal214: 'Nessuna tabella trovata in questo schema. Lo schema potrebbe essere vuoto o la versione potrebbe non esistere.',
  databaseexportmodal216: 'Accesso negato a questo schema. Controlla i tuoi permessi.',
  databaseexportmodal225: 'Esportazione fallita',
  databaseexportmodal228: '-- Nessun codice SQL generato',
  databaseexportmodal238: 'Esportazione fallita',
  databaseexportmodal269: ' (Attuale)',
  databaseexportmodal285: '📤 Esporta schema del database',
  databaseexportmodal308: 'Esporta lo schema del database come script SQL MySQL',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: 'Schema del database',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal329: 'Caricamento schemi in corso...',
  databaseexportmodal338: 'Seleziona database...',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal339: 'w-full menu a discesa personalizzato',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: 'Nessun progetto selezionato',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal351: 'Versione',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal355: 'Seleziona prima il database',
  databaseexportmodal357: 'Caricamento delle versioni in corso...',
  databaseexportmodal363: 'Seleziona la versione...',
  databaseexportmodal368: 'Nessuna versione trovata',
  databaseexportmodal380: '📥 Scarica .sql',
  databaseexportmodal388: '👁️ Visualizza SQL',
  databaseexportmodal403: 'Script SQL generato',
  databaseexportmodal406: '📋 Copia',
  databaseexportmodal412: '💾 Scarica',

  // resources/js\Components\EmailVerification.tsx
  emailverification55: 'Errore di conferma e-mail',
  emailverification59: 'Errore di rete. Riprova più tardi.',
  emailverification68: 'Link di conferma non valido',
  emailverification107: 'Conferma e-mail',
  emailverification112: 'L\'email è confermata...',

  // resources/js/Components/EmailVerification.tsx
  emailverification127: 'Ora hai effettuato l\'accesso e verrai reindirizzato automaticamente all\'app.',
  emailverification135: 'Ora puoi iniziare a collaborare con il tuo team.',

  // resources/js\Components\EmailVerification.tsx
  emailverification141: 'Vai all\'app ora',

  // resources/js/Components/EmailVerification.tsx
  emailverification151: 'Se i problemi persistono, contatta l\'assistenza.',

  // resources/js\Components\EmailVerification.tsx
  emailverification155: 'Alla homepage',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: 'Si è verificato un errore imprevisto. Non preoccuparti: i tuoi dati sono al sicuro.',
  errorfallback40: 'Dettagli dell\'errore:',
  errorfallback58: 'Riprova',
  errorfallback65: 'Ricarica la pagina e reimposta',
  errorfallback65_2: ' Il pulsante elimina tutti i dati locali (layout, impostazioni e logout!) e riavvia l\'app.',
  errorfallback75: 'Un avviso:',

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: 'Suggerimento: se il problema persiste, contattare l\'assistenza.',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback78: 'Suggerimento: se il problema persiste',

  // resources/js\Components\LanguageSelector.tsx
  languageselector68: 'Seleziona la lingua',
  languageselector69: 'Seleziona la lingua',

  // resources/js/Components/LanguageSelector.tsx
  languageselector87: 'Scegli la lingua',

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: 'Non autenticato',
  applicationsmodal78: 'Impossibile caricare le applicazioni',
  applicationsmodal85: 'Errore durante il caricamento delle applicazioni',
  applicationsmodal106: 'Non autenticato',
  applicationsmodal125: 'Impossibile esaminare la domanda',
  applicationsmodal143: 'Errore durante la revisione dell\'applicazione',
  applicationsmodal200: 'Nessun messaggio',
  applicationsmodal228: 'Approva la domanda',
  applicationsmodal234: 'Rifiuta la domanda',
  applicationsmodal252: 'Sconosciuto',
  applicationsmodal301: 'Nessuna applicazione trovata',
  applicationsmodal313: 'Aggiorna',
  applicationsmodal322: 'Richiedente',
  applicationsmodal329: 'Messaggio',
  applicationsmodal335: 'Stato',
  applicationsmodal342: 'Applicato',
  applicationsmodal348: 'Recensito da',
  applicationsmodal354: 'Azioni',
  applicationsmodal363: 'Vicino',
  applicationsmodal374: 'Rifiutare',
  applicationsmodal402: 'Messaggio:',
  applicationsmodal412: 'Motivo del rifiuto',
  applicationsmodal420: 'Diamo loro il benvenuto nel progetto...',
  applicationsmodal421: 'Fate sapere loro perché la loro domanda è stata respinta...',
  applicationsmodal432: 'Cancellare',
  applicationsmodal439: 'Elaborazione in corso...',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: 'Il nome della tabella è obbligatorio',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal191: 'Il nome della tabella è obbligatorio',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: 'Tutti i campi devono avere un nome',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal196: 'Tutti i campi devono avere un nome',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: 'I nomi dei campi devono essere univoci',
  createtablemodal290: 'Nome della tabella *',
  createtablemodal300: 'ad esempio, utenti, prodotti, ordini',
  createtablemodal306: 'Nome chiave file',
  createtablemodal316: 'Digita o seleziona un nome chiave',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal318: 'Digita o seleziona un nome chiave',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal330: 'Nome file rinominato',
  createtablemodal339: 'ad esempio, CustomUser, ProductCatalog',
  createtablemodal348: 'Nome file breve',
  createtablemodal370: 'Campi *',
  createtablemodal380: 'Aggiungi campo',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal382: 'Aggiungi campo',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal391: 'Nome',
  createtablemodal398: 'nome_campo',
  createtablemodal428: 'Controllare',
  createtablemodal482: 'Nessuno',
  createtablemodal483: 'Chiave primaria',
  createtablemodal484: 'Indice',
  createtablemodal485: 'Unico',
  createtablemodal497: 'Rimuovi campo',
  createtablemodal509: 'Tabella dei collegamenti',
  createtablemodal516: '-- Seleziona tabella --',
  createtablemodal525: 'Campo valore',
  createtablemodal532: '-- Campo Valore --',
  createtablemodal541: 'Campo di visualizzazione',
  createtablemodal548: '-- Campo di visualizzazione --',
  createtablemodal557: 'Campo ordine',
  createtablemodal564: '-- Campo Ordine --',
  createtablemodal573: 'Direzione',
  createtablemodal603: 'Cancellare',
  createtablemodal614: 'Creazione...',
  createtablemodal619: 'Crea tabella',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: 'Impossibile creare il team',
  createteammodal52: 'Si è verificato un errore di rete',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal88: 'Nome della squadra *',
  createteammodal97: 'ad esempio, Core Team, Controllo Qualità',
  createteammodal103: 'Descrizione',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: 'Cosa fa questa squadra?',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: 'Progetti',
  createteammodal136: 'Seleziona uno o più progetti per questo team. Tieni premuto Ctrl/Cmd per selezionarne più di uno.',
  createteammodal153: 'Cancellare',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal164: 'Creazione...',
  createteammodal169: 'Crea squadra',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal97: 'd.m.Y',
  editprojectmodal98: 'Il suo',
  editprojectmodal100: 'Europa/Vienna',
  editprojectmodal131: 'd.m.Y',
  editprojectmodal132: 'Il suo',
  editprojectmodal134: 'Europa/Vienna',
  editprojectmodal168: 'Non autenticato',
  editprojectmodal183: 'Impossibile aggiornare il progetto',
  editprojectmodal197: 'Errore durante l\'aggiornamento del progetto',
  editprojectmodal215: 'Modifica progetto',
  editprojectmodal227: 'Impostazioni del progetto',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal230: 'Nome del progetto *',
  editprojectmodal240: 'nome_del_mio_progetto',
  editprojectmodal252: '✓ Consentiti: lettere minuscole, numeri, caratteri di sottolineatura (ad esempio my_project_123)',
  editprojectmodal258: 'Descrizione',
  editprojectmodal569: 'I nomi dei progetti vengono poi utilizzati per gli URL (nome utente/nome_progetto)',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: 'Inserisci la descrizione del progetto',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal266: 'Codice di adesione',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: 'Inserisci il codice di iscrizione (facoltativo)',
  editprojectmodal280: 'PROG-',
  editprojectmodal281: 'Genera codice di join casuale',
  editprojectmodal285: 'Gli utenti possono unirsi a questo progetto utilizzando questo codice',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal298: 'Progetto pubblico',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal302: 'Rendi questo progetto visibile a tutti gli utenti',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal307: 'Trasferimento di proprietà',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal316: 'Mantieni il proprietario attuale ({project.owner.name})',
  editprojectmodal332: 'Connessione al database',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal335: 'Nome del database',
  editprojectmodal345: 'Nome del database per questo progetto',
  editprojectmodal351: 'Tipo di database',
  editprojectmodal370: 'Server',
  editprojectmodal383: 'Porta',
  editprojectmodal397: 'Nome utente',
  editprojectmodal410: 'Password',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: 'Proprietà del progetto',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal429: 'Elenco dei progetti',
  editprojectmodal439: 'Percorso in cui salvare i file generati',
  editprojectmodal445: 'URL del progetto',
  editprojectmodal455: 'URL per accedere al progetto',
  editprojectmodal461: 'Pagina iniziale',
  editprojectmodal477: 'Lingua predefinita',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: 'Inglese',
  editprojectmodal485: 'tedesco',
  editprojectmodal486: 'francese',
  editprojectmodal487: 'spagnolo',
  editprojectmodal488: 'Italiano',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal493: 'Linguaggio standard per la generazione del progetto',
  editprojectmodal499: 'Nome file Breve Lunghezza',
  editprojectmodal506: '2 personaggi',
  editprojectmodal507: '3 personaggi',
  editprojectmodal508: '4 personaggi',
  editprojectmodal509: '5 caratteri',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: 'Impostazioni di localizzazione',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal526: 'Separatore decimale',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal538: 'per 1,23 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal543: 'Separatore di migliaia',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal555: 'per 1.234 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal562: 'Formato data',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal568: 'd.m.Y',
  editprojectmodal573: 'per il 31.12.2026 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal578: 'Formato ora',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal584: 'Il suo',
  editprojectmodal589: 'per le 14:30:00 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal596: 'Simbolo di valuta',
  editprojectmodal602: '€',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: 'CHF',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: 'Fuso orario',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal620: 'Europa/Vienna',
  editprojectmodal621: 'Europa/Berlino',
  editprojectmodal622: 'Europa/Zurigo',
  editprojectmodal623: 'Europa/Londra',
  editprojectmodal624: 'America/New_York',
  editprojectmodal625: 'America/Chicago',
  editprojectmodal626: 'America/Los Angeles',
  editprojectmodal627: 'Asia/Tokyo',
  editprojectmodal628: 'Asia/Dubai',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal629: 'UTC',
  editprojectmodal634: 'Fuso orario per le operazioni di data/ora',
  editprojectmodal641: 'Chiave API di Google Translate',
  editprojectmodal652: 'Chiave API per traduzioni automatiche tramite Google Translate',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal689: 'Cancellare',
  editprojectmodal696: 'Salva modifiche',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal317: 'Il nome della tabella è obbligatorio',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal319: 'Il nome della tabella è obbligatorio',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal322: 'Tutti i campi devono avere un nome',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal324: 'Tutti i campi devono avere un nome',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal329: 'I nomi dei campi devono essere univoci',
  edittablemodal335: 'Il nome della chiave del file è obbligatorio',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal337: 'Il nome della chiave del file è obbligatorio',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: 'Il nome della chiave del file selezionato deve essere una chiave primaria, una chiave univoca o un campo indicizzato',
  edittablemodal397: 'Nome della tabella *',
  edittablemodal407: 'ad esempio, utenti, prodotti, ordini',
  edittablemodal413: 'Nome chiave file *',
  edittablemodal422: 'Seleziona campo chiave...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal424: 'Seleziona campo chiave...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal425: '- Auto Inc',
  edittablemodal436: 'Nome file rinominato',
  edittablemodal445: 'ad esempio, CustomUser, ProductCatalog',
  edittablemodal454: 'Nome file breve',
  edittablemodal476: 'Campi *',
  edittablemodal486: 'Aggiungi campo',
  edittablemodal497: 'Nome',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal499: 'Nome',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal504: 'nome_campo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: 'Tipo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal534: 'Controllare',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal536: 'Controllare',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal614: 'Commento',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal616: 'Commento',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: 'Descrizione del campo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal623: 'Descrizione del campo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal632: 'Rimuovi campo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal634: 'Rimuovi campo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal644: 'Tabella dei collegamenti',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal646: 'Tabella dei collegamenti',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal651: '-- Seleziona tabella --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal653: '-- Seleziona tabella --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal660: 'Campo valore',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal662: 'Campo valore',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal667: '-- Campo Valore --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal669: '-- Campo Valore --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal676: 'Campo di visualizzazione',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal678: 'Campo di visualizzazione',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal683: '-- Campo di visualizzazione --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal685: '-- Campo di visualizzazione --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal692: 'Campo ordine',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal694: 'Campo ordine',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal699: '-- Campo Ordine --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal701: '-- Campo Ordine --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal708: 'Direzione',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal710: 'Direzione',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal739: 'Cancellare',
  edittablemodal750: 'Aggiornamento...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal752: 'Aggiornamento...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal755: 'Aggiorna tabella',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal757: 'Aggiorna tabella',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: 'Inserisci un codice di iscrizione',
  joincodemodal51: 'Non autenticato',
  joincodemodal63: 'Abbiamo cercato ovunque',
  joincodemodal66: 'Codice di adesione non valido',
  joincodemodal73: 'Hai già fatto domanda per questo progetto',
  joincodemodal80: 'Errore durante la ricerca del progetto',
  joincodemodal95: 'Non autenticato',
  joincodemodal113: 'Impossibile inviare la domanda',
  joincodemodal117: 'Domanda inviata con successo! Il proprietario del progetto esaminerà la tua richiesta.',
  joincodemodal_toast_detail: 'Attendi che',
  joincodemodal_toast_detail2: 'abbia esaminato la tua candidatura.',
  joincodemodal129: 'Errore durante l\'invio della domanda',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal147: ', mese:',
  joincodemodal148: ', giorno:',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: 'Unisciti al progetto',
  joincodemodal157: 'Candidati al progetto',
  joincodemodal158: 'Domanda inviata',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal181: 'Codice di adesione',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: 'Entra',
  joincodemodal200: 'Cercare',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: 'Inserisci il codice di adesione al progetto fornito dal proprietario del progetto.',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: 'Informazioni sul progetto',
  joincodemodal220: 'Nessuna descrizione fornita',
  joincodemodal226: 'Proprietario:',
  joincodemodal237: 'Creato:',
  joincodemodal247: 'Squadre',
  joincodemodal261: 'Spiega al proprietario del progetto perché vorresti unirti a questo progetto...',
  joincodemodal277: 'Domanda inviata!',
  joincodemodal288: 'Cancellare',
  joincodemodal299: 'Indietro',
  joincodemodal306: 'Invio in corso...',
  joincodemodal316: 'Fatto',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: 'Impossibile inviare l\'invito',
  manageteammodal132: 'Si è verificato un errore di rete',
  manageteammodal139: 'Rimuovere questo membro dal team?',
  manageteammodal144: 'ELIMINARE',
  manageteammodal155: 'Impossibile rimuovere il membro',
  manageteammodal158: 'Impossibile rimuovere il membro',
  manageteammodal181: 'Impossibile cambiare ruolo',
  manageteammodal184: 'Impossibile cambiare ruolo',
  manageteammodal189: 'Annullare questo invito?',
  manageteammodal194: 'ELIMINARE',
  manageteammodal206: 'Impossibile annullare l\'invito',
  manageteammodal209: 'Impossibile annullare l\'invito',
  manageteammodal244: 'Caricamento squadra in corso...',
  manageteammodal283: 'Panoramica',
  manageteammodal284: 'Membri (${team.members?.length || 0})',
  manageteammodal297: '{etichetta.tab}',
  manageteammodal308: 'Informazioni sulla squadra',
  manageteammodal312: 'Nome della squadra',
  manageteammodal316: 'Progetto',
  manageteammodal320: 'Proprietario',
  manageteammodal321: 'Sconosciuto',
  manageteammodal324: 'Stato',
  manageteammodal328: 'Inattivo',
  manageteammodal334: 'Descrizione',
  manageteammodal347: 'Membri del team',
  manageteammodal354: 'Invita un membro',
  manageteammodal362: 'Invita un nuovo membro',
  manageteammodal366: 'Nome utente (obbligatorio) *',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal373: 'ad esempio, junction77',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal377: 'E-mail (facoltativo)',
  manageteammodal383: 'E-mail di notifica facoltativa',
  manageteammodal388: 'Ruolo',
  manageteammodal394: 'Membro',
  manageteammodal395: 'Amministratore',
  manageteammodal399: 'Messaggio (facoltativo)',
  manageteammodal404: 'Messaggio di benvenuto per l\'invito',
  manageteammodal432: 'Invio in corso...',
  manageteammodal437: 'Invia invito',
  manageteammodal456: '{membro.utente.email}',
  manageteammodal469: 'Promuovi ad amministratore',
  manageteammodal477: 'Declassare a membro',
  manageteammodal485: 'Rimuovi membro',
  manageteammodal501: 'Inviti in sospeso',
  manageteammodal505: 'Nessun invito in sospeso',
  manageteammodal534: 'Annulla invito',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal553: 'Vicino',

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal179: 'Non autenticato',
  membermodal191: 'Impossibile caricare i dettagli del team',
  membermodal244: 'Impossibile caricare i dati',
  membermodal297: 'Non autenticato',
  membermodal316: 'Impossibile aggiungere un membro al team',
  membermodal323: 'Successo',
  membermodal335: 'Errore',
  membermodal336: 'Impossibile aggiungere un membro al team',
  membermodal348: 'Avvertimento',
  membermodal349: 'Impossibile rimuovere il proprietario del team',
  membermodal357: 'Rimuovi membro',
  membermodal365: 'Non autenticato',
  membermodal369: 'ELIMINARE',
  membermodal378: 'Impossibile rimuovere il membro',
  membermodal383: 'Successo',
  membermodal384: 'Membro rimosso con successo',
  membermodal394: 'Errore',
  membermodal395: 'Impossibile rimuovere il membro',
  membermodal407: 'Avvertimento',
  membermodal408: 'Impossibile modificare il ruolo del proprietario',
  membermodal417: 'Non autenticato',
  membermodal432: 'Impossibile aggiornare il ruolo',
  membermodal437: 'Successo',
  membermodal438: 'Ruolo del membro aggiornato con successo',
  membermodal448: 'Errore',
  membermodal449: 'Impossibile aggiornare il ruolo',
  membermodal458: 'Membro',
  membermodal459: 'Amministratore',
  membermodal479: 'Disponibile',
  membermodal483: 'Disponibile',
  membermodal509: 'Questo è il',
  membermodal527: 'Proprietario',
  membermodal536: 'Rimuovi dal team',
  membermodal549: 'Assegna al team',
  membermodal582: 'Disponibile',
  membermodal590: 'Nessun membro trovato',
  membermodal597: 'Membro',
  membermodal603: 'Ruolo',
  membermodal609: 'Partecipato',
  membermodal614: 'Azioni',
  membermodal625: 'Vicino',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal53: 'Non autenticato',
  pendinginvitationmodal70: 'Impossibile caricare l\'invito in sospeso',
  pendinginvitationmodal76: 'Errore durante il caricamento dell\'invito',
  pendinginvitationmodal97: 'Non autenticato',
  pendinginvitationmodal112: 'Benvenuti nel team! 🎉',
  pendinginvitationmodal118: 'Impossibile accettare l\'invito',
  pendinginvitationmodal121: 'Errore durante l\'accettazione dell\'invito',
  pendinginvitationmodal136: 'Non autenticato',
  pendinginvitationmodal151: 'Invito rifiutato',
  pendinginvitationmodal157: 'Impossibile rifiutare l\'invito',
  pendinginvitationmodal160: 'Errore durante il rifiuto dell\'invito',
  pendinginvitationmodal169: '✅ Accetta e unisciti al progetto',
  pendinginvitationmodal176: '❌ Rifiuta',
  pendinginvitationmodal189: '🎉 Invito al progetto',
  pendinginvitationmodal200: 'Caricamento invito in corso...',

  // resources/js/Components/Modals/PendingInvitationModal.tsx
  pendinginvitationmodal213: 'Completa la tua registrazione accettando questo invito',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal234: 'Invitato da:',
  pendinginvitationmodal244: 'Il tuo ruolo:',
  pendinginvitationmodal251: 'Titolare del progetto:',
  pendinginvitationmodal261: 'Scade:',
  pendinginvitationmodal270: 'Messaggio personale:',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal45: 'Membro',
  projectinvitationsmodal46: 'Amministratore',
  projectinvitationsmodal74: 'Non autenticato',
  projectinvitationsmodal86: 'Impossibile caricare gli inviti',
  projectinvitationsmodal93: 'Errore durante il caricamento degli inviti',
  projectinvitationsmodal100: '=== useEffect attivato ===',
  projectinvitationsmodal102: 'Caricamento inviti in corso...',
  projectinvitationsmodal113: '=== INVIA INVITO INIZIA ===',
  projectinvitationsmodal118: 'Stati sgomberati, in procinto di recuperare',
  projectinvitationsmodal122: 'Non autenticato',
  projectinvitationsmodal141: 'Risposta ricevuta:',
  projectinvitationsmodal144: 'Impossibile inviare l\'invito',
  projectinvitationsmodal147: 'Impostazione del messaggio di successo...',
  projectinvitationsmodal148: '✅ Invito inviato con successo! Email consegnata.',
  projectinvitationsmodal150: 'Modulo di compensazione...',
  projectinvitationsmodal153: 'IL MESSAGGIO DI SUCCESSO È ORA IMPOSTATO - Dovrebbe essere visibile!',
  projectinvitationsmodal157: 'Aggiunta dell\'invito all\'elenco - dati grezzi:',
  projectinvitationsmodal171: 'Voi',
  projectinvitationsmodal177: 'Aggiunta di un invito arricchito:',
  projectinvitationsmodal182: 'Chiamata di richiamata di Successo...',
  projectinvitationsmodal187: 'Messaggio di successo con cancellazione automatica dopo 5 secondi',
  projectinvitationsmodal191: '=== FINE INVIO INVITO - RIUSCITO ===',
  projectinvitationsmodal193: 'Errore durante l\'invio dell\'invito',
  projectinvitationsmodal204: 'Annulla invito',
  projectinvitationsmodal212: 'ELIMINARE',
  projectinvitationsmodal220: '✅ Invito annullato con successo',
  projectinvitationsmodal229: 'Impossibile annullare l\'invito',
  projectinvitationsmodal232: 'Impossibile annullare l\'invito',
  projectinvitationsmodal243: 'Invia nuovamente l\'invito',
  projectinvitationsmodal261: 'Invia nuovamente l\'invito',
  projectinvitationsmodal266: '✅ Invito reinviato con successo! Email consegnata.',
  projectinvitationsmodal275: 'Impossibile inviare nuovamente l\'invito',
  projectinvitationsmodal278: 'Impossibile inviare nuovamente l\'invito',
  projectinvitationsmodal286: 'In attesa di',
  projectinvitationsmodal287: 'Accettato',
  projectinvitationsmodal288: 'Rifiutato',
  projectinvitationsmodal289: 'Scaduto',
  projectinvitationsmodal305: 'Annulla invito',
  projectinvitationsmodal314: 'Invia nuovamente l\'invito',
  projectinvitationsmodal337: 'Vicino',
  projectinvitationsmodal360: 'Invia nuovo invito',
  projectinvitationsmodal364: 'Indirizzo e-mail *',

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: 'utente@esempio.com',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal376: 'Ruolo',
  projectinvitationsmodal387: 'Messaggio personale (facoltativo)',
  projectinvitationsmodal392: 'Aggiungi un messaggio personale all\'invito...',
  projectinvitationsmodal398: 'Invia invito',
  projectinvitationsmodal409: 'Inviti esistenti',
  projectinvitationsmodal414: 'Nessun invito inviato ancora',
  projectinvitationsmodal420: 'E-mail',
  projectinvitationsmodal425: 'Ruolo',
  projectinvitationsmodal433: 'Stato',
  projectinvitationsmodal439: 'Inviato',
  projectinvitationsmodal445: 'Scade',
  projectinvitationsmodal450: 'Azioni',

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: 'Impossibile caricare i membri del progetto',
  projectmembersmodal63: 'Errore durante il caricamento dei membri del progetto',
  projectmembersmodal84: 'ELIMINARE',
  projectmembersmodal95: 'Impossibile rimuovere il membro',
  projectmembersmodal98: 'Membro rimosso con successo',
  projectmembersmodal101: 'Errore durante la rimozione del membro',
  projectmembersmodal128: 'Impossibile aggiornare il ruolo del membro',
  projectmembersmodal131: 'Ruolo del membro aggiornato con successo',
  projectmembersmodal134: 'Errore durante l\'aggiornamento del ruolo del membro',
  projectmembersmodal141: 'Conferma rimozione',
  projectmembersmodal176: 'Membro',
  projectmembersmodal177: 'Amministratore',
  projectmembersmodal193: 'Proprietario',
  projectmembersmodal206: 'Seleziona il ruolo',
  projectmembersmodal221: 'Rimuovi membro',
  projectmembersmodal238: 'Membri del progetto - {project?.name}',
  projectmembersmodal264: 'Nessun membro trovato',
  projectmembersmodal270: 'Utente',
  projectmembersmodal276: 'Ruolo',
  projectmembersmodal282: 'Partecipato',
  projectmembersmodal287: 'Azioni',
  projectmembersmodal296: 'Vicino',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: 'Il nome della squadra è obbligatorio',
  teammodal108: 'Non autenticato',
  teammodal132: 'Impossibile salvare la squadra',
  teammodal137: 'Impossibile salvare la squadra',
  teammodal146: 'Seleziona progetto',
  teammodal155: 'Crea un nuovo team',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal169: 'Nome della squadra *',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal176: 'Inserisci il nome della squadra',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal182: 'Descrizione',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: 'Inserisci la descrizione del team (facoltativo)',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal195: 'Progetti',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: 'Seleziona progetti',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal222: 'Il team è attivo',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal232: 'Cancellare',
  teammodal240: 'Creare',

  // resources/js\Components\Panels\AuthPanel.tsx
  authpanel3: './RegisterPanel',
  authpanel4: './ProfilePanel',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: 'Inglese',
  cmsadminpanel41: 'tedesco',
  cmsadminpanel42: 'francese',
  cmsadminpanel43: 'spagnolo',
  cmsadminpanel44: 'Italiano',
  cmsadminpanel69: 'Impossibile caricare le pagine:',
  cmsadminpanel106: 'Si prega di compilare tutti i campi obbligatori',
  cmsadminpanel122: 'Pagina aggiornata con successo!',
  cmsadminpanel129: 'Pagina creata con successo!',
  cmsadminpanel135: 'Impossibile salvare la pagina:',
  cmsadminpanel144: 'Conferma eliminazione',
  cmsadminpanel150: 'ELIMINARE',
  cmsadminpanel152: 'Pagina eliminata con successo!',
  cmsadminpanel155: 'Impossibile eliminare la pagina:',
  cmsadminpanel170: 'Modificare',
  cmsadminpanel178: 'Eliminare',
  cmsadminpanel186: 'Visualizza pagina',
  cmsadminpanel195: 'Inattivo',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel216: '📝 Gestione delle pagine CMS',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: 'Crea nuova pagina',
  cmsadminpanel241: 'Nessuna pagina trovata',
  cmsadminpanel244: 'Lumaca',
  cmsadminpanel245: 'Lingua',
  cmsadminpanel246: 'Titolo',
  cmsadminpanel247: 'Stato',
  cmsadminpanel250: 'Ultimo aggiornamento',
  cmsadminpanel256: 'Azioni',
  cmsadminpanel265: 'Crea nuova pagina',
  cmsadminpanel272: 'Cancellare',
  cmsadminpanel279: 'Salva',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel291: 'Lumaca *',
  cmsadminpanel298: 'aiuto, impressum, informativa sulla privacy...',
  cmsadminpanel309: 'Lingua *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: 'Seleziona una lingua',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel328: 'Titolo *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: 'Titolo della pagina...',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel342: 'Contenuto *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: 'Codice sorgente HTML',
  cmsadminpanel363: 'Codice sorgente HTML con evidenziazione della sintassi',
  cmsadminpanel365: 'Formattazione',
  cmsadminpanel402: 'Inserisci qui il codice HTML...',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel72: 'Impossibile generare il codice',
  codegenerationpanel75: 'Impossibile generare il codice',
  codegenerationpanel86: 'Nessun file trovato per l\'indice della tabella selezionata',
  codegenerationpanel165: 'Impossibile analizzare la funzione JavaScript',
  codegenerationpanel166: 'Contenuto grezzo:',
  codegenerationpanel186: 'Avvio dell\'esecuzione batch di tutte le 278 funzioni JavaScript...',
  codegenerationpanel280: 'Nessun file generato da scaricare. Eseguire prima tutte le funzioni.',
  codegenerationpanel286: '# File di codice generati dal sistema di modelli',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: 'testo/semplice',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel327: 'Generazione di codice',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel332: 'ID modello',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel338: 'Inserisci l\'ID del modello (ad esempio, 1)',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel344: 'Indice della tabella',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel351: 'Seleziona la tabella',
  codegenerationpanel358: 'Genera codice',
  codegenerationpanel374: 'Riepilogo della generazione:',
  codegenerationpanel387: 'JavaScript pulito',
  codegenerationpanel395: 'Risultato dell\'esecuzione',
  codegenerationpanel399: 'Esegui singolo file',
  codegenerationpanel407: 'Esegui tutti i file',
  codegenerationpanel416: 'Scarica ZIP',
  codegenerationpanel433: 'Fare clic su "Esegui singolo file" o "Esegui tutti i file" per visualizzare i risultati...',
  codegenerationpanel445: 'Prestazione:',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel131: 'Non autenticato',
  databasemanagementpanel145: 'Impossibile caricare gli schemi',
  databasemanagementpanel152: 'Errore durante il caricamento degli schemi',
  databasemanagementpanel221: 'Seleziona almeno una lingua',
  databasemanagementpanel231: 'Non autenticato',
  databasemanagementpanel245: 'Impossibile esportare le traduzioni',
  databasemanagementpanel259: 'Traduzioni esportate con successo',
  databasemanagementpanel261: 'Errore durante l\'esportazione delle traduzioni',
  databasemanagementpanel277: 'Non autenticato',
  databasemanagementpanel294: 'Impossibile importare le traduzioni',
  databasemanagementpanel301: 'Errore durante l\'importazione delle traduzioni',
  databasemanagementpanel315: 'Non autenticato',
  databasemanagementpanel330: 'Impossibile creare lo schema',
  databasemanagementpanel336: 'Schema del database creato correttamente',
  databasemanagementpanel339: 'Errore durante la creazione dello schema',
  databasemanagementpanel367: 'Non autenticato',
  databasemanagementpanel382: 'Impossibile aggiornare lo schema',
  databasemanagementpanel388: 'Schema aggiornato con successo',
  databasemanagementpanel391: 'Errore durante l\'aggiornamento dello schema',
  databasemanagementpanel419: 'Non autenticato',
  databasemanagementpanel438: 'Impossibile associare lo schema',
  databasemanagementpanel447: 'Errore durante l\'associazione dello schema',
  databasemanagementpanel454: 'Questo è il',
  databasemanagementpanel485: 'Non assegnato',
  databasemanagementpanel516: 'Non autenticato',
  databasemanagementpanel520: 'ELIMINARE',
  databasemanagementpanel529: 'Impossibile rimuovere lo schema dal progetto',
  databasemanagementpanel536: 'Errore durante la rimozione dello schema',
  databasemanagementpanel551: '(Copia)',
  databasemanagementpanel567: 'Non autenticato',
  databasemanagementpanel585: 'Impossibile copiare lo schema',
  databasemanagementpanel594: 'Errore durante la copia dello schema',
  databasemanagementpanel606: 'Il nome dello schema non corrisponde. Digitare il nome esatto dello schema per confermare l\'eliminazione.',
  databasemanagementpanel616: 'Non autenticato',
  databasemanagementpanel621: 'ELIMINARE',
  databasemanagementpanel651: 'ELIMINARE',
  databasemanagementpanel683: 'Errore durante l\'eliminazione dello schema',
  databasemanagementpanel714: 'Collegamento al progetto',
  databasemanagementpanel735: 'Associare al progetto',
  databasemanagementpanel743: 'Modifica schema',
  databasemanagementpanel749: 'Copia database',
  databasemanagementpanel756: 'Apri in Designer',
  databasemanagementpanel763: 'Elimina schema',
  databasemanagementpanel771: 'Privato',
  databasemanagementpanel772: 'Pubblico',
  databasemanagementpanel776: 'Collegato (riferimento di sola lettura)',
  databasemanagementpanel777: 'Clonato (copia privata)',
  databasemanagementpanel778: 'Importato (Unisci a esistente)',
  databasemanagementpanel786: 'Caricamento degli schemi del database in corso...',
  databasemanagementpanel798: 'Gestione del database',
  databasemanagementpanel803: 'Nuovo database',
  databasemanagementpanel811: 'Aggiorna',
  databasemanagementpanel829: 'I miei schemi di database',
  databasemanagementpanel833: 'Nessuno schema di database trovato. Crea il tuo primo schema per iniziare.',
  databasemanagementpanel840: 'Nome dello schema',
  databasemanagementpanel841: 'Descrizione',
  databasemanagementpanel843: 'Progetti assegnati',
  databasemanagementpanel849: 'Visibilità',
  databasemanagementpanel855: 'Proprietario',
  databasemanagementpanel861: 'Creato',
  databasemanagementpanel867: 'Azioni',
  databasemanagementpanel876: 'Esportazione/importazione di traduzioni',
  databasemanagementpanel886: 'Esporta traduzioni',
  databasemanagementpanel893: 'Importa traduzioni',
  databasemanagementpanel905: 'Crea nuovo schema di database',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel917: 'Nome schema *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: 'Inserisci il nome dello schema',
  databasemanagementpanel937: 'Inserisci la descrizione dello schema (facoltativo)',
  databasemanagementpanel952: 'Seleziona visibilità',
  databasemanagementpanel963: 'Cancellare',
  databasemanagementpanel970: 'Crea schema',
  databasemanagementpanel981: 'Modifica schema database',
  databasemanagementpanel999: 'Inserisci il nome dello schema',
  databasemanagementpanel1013: 'Inserisci la descrizione dello schema (facoltativo)',
  databasemanagementpanel1028: 'Seleziona visibilità',
  databasemanagementpanel1036: 'Cancellare',
  databasemanagementpanel1043: 'Aggiorna schema',
  databasemanagementpanel1054: 'Collega lo schema al progetto',
  databasemanagementpanel1070: 'Nessuna descrizione',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1077: 'Seleziona Progetto *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: 'Seleziona un progetto',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1094: 'Link al progetto:',
  databasemanagementpanel1104: 'Tipo di associazione',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: 'Nome personalizzato per questo schema nel progetto',
  databasemanagementpanel1131: 'Cancellare',
  databasemanagementpanel1138: 'Schema di collegamento',
  databasemanagementpanel1163: 'Avviso di eliminazione permanente',
  databasemanagementpanel1166: 'TUTTO',
  databasemanagementpanel1174: '🎨 Tutti i layout di Schema Designer',
  databasemanagementpanel1175: '⚙️ Tutti i vincoli e le relazioni',
  databasemanagementpanel1180: 'non può essere annullato',
  databasemanagementpanel1210: 'Cancellare',
  databasemanagementpanel1217: 'Elimina per sempre',
  databasemanagementpanel1229: 'Esportare le traduzioni in Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1244: 'Seleziona le lingue da includere nell\'esportazione Excel. L\'esportazione conterrà tutte le tabelle e i campi dei database collegati.',
  databasemanagementpanel1250: 'Seleziona le lingue *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: 'Seleziona le lingue da esportare',
  databasemanagementpanel1273: 'Cancellare',
  databasemanagementpanel1280: 'Esporta in Excel',
  databasemanagementpanel1292: 'Importa traduzioni da Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1307: 'Carica un file Excel con le traduzioni. Il file deve rispettare il formato di esportazione.',
  databasemanagementpanel1313: 'Carica file Excel *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: 'Scegli file Excel',
  databasemanagementpanel1338: 'Cancellare',
  databasemanagementpanel1350: 'Copia lo schema del database',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1365: 'Verrà creata una copia completa dello schema del database, incluse tutte le tabelle, i campi, i vincoli e i layout del designer. La copia verrà impostata sulla versione 1.',
  databasemanagementpanel1371: 'Nuovo nome schema *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: 'Inserisci il nome per lo schema copiato',
  databasemanagementpanel1395: 'Cancellare',
  databasemanagementpanel1402: 'Copia database',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel51: 'Codice Fira',
  debugmanualgeneratorpanel127: 'Codice Fira',
  debugmanualgeneratorpanel136: 'Il codice JavaScript generato appare qui...',
  debugmanualgeneratorpanel162: 'API degli Appunti non disponibile. Copia manualmente:',
  debugmanualgeneratorpanel165: 'Impossibile accedere agli appunti. Controlla le impostazioni del tuo browser.',

  debugmanualgeneratorpanel214:   'API degli Appunti non disponibile. Copia manualmente:',
  debugmanualgeneratorpanel217:   'errori durante la copia negli appunti',
  debugmanualgeneratorpanel486:   'Nessun file modello valido per il modello',
  debugmanualgeneratorpanel486a:  'trovato',
  debugmanualgeneratorpanel490:   'Errori durante il caricamento dei file modello:',
  debugmanualgeneratorpanel990:   'Il modello di backend è troppo esteso',
  debugmanualgeneratorpanel990a:  'di max.',
  debugmanualgeneratorpanel990b:  'Il modello contiene troppe tabelle o strutture complesse.',
  debugmanualgeneratorpanel1035:  '❌ File non trovato per la configurazione selezionata',
  debugmanualgeneratorpanel1036:  '🔍 Configurazione desiderata:',
  debugmanualgeneratorpanel1037:  'Modello:',
  debugmanualgeneratorpanel1038:  'File:',
  debugmanualgeneratorpanel1039:  'Tipo:',
  debugmanualgeneratorpanel1047:  'Lingua:',
  debugmanualgeneratorpanel1050:  '📋 File disponibili',
  debugmanualgeneratorpanel1056:  'altri',
  debugmanualgeneratorpanel1060:  '💡 Soluzione: controllare la configurazione del modello e la risposta del backend.',
  debugmanualgeneratorpanel1092:  '⚠️ Avviso di memoria:',
  debugmanualgeneratorpanel1092a: 'È utilizzato il % della memoria. Il modello potrebbe essere troppo complesso per un funzionamento sicuro.',
  debugmanualgeneratorpanel1129:  'Funzione',
  debugmanualgeneratorpanel1129a: 'non trovato nell\'ambito globale',
  debugmanualgeneratorpanel1144:  '⚠️ ATTENZIONE: l\'esecuzione del modello ha richiesto',
  debugmanualgeneratorpanel1144a: 'ms (>5s). Considerare la semplificazione del modello.',
  debugmanualgeneratorpanel1148:  '📊 Prestazioni:',
  debugmanualgeneratorpanel1148a:  'ms, memoria:',
  debugmanualgeneratorpanel1155:  '❌ Esecuzione fallita!\n\nControlla il',
  debugmanualgeneratorpanel1155a: 'Scheda per i dettagli.\n\nErrore:',
  debugmanualgeneratorpanel1201:  '❌ Errore di sintassi JavaScript nel modello',
  debugmanualgeneratorpanel1201a: '🔍 Problema:',
  debugmanualgeneratorpanel1201b: '💡 Cause comuni:\n\n• Virgolette mancanti o in eccesso\n• Variabili incomplete come {item.\n• Parentesi errate nei cicli\n• Caratteri speciali che devono essere sottoposti a escape\n\n🛠️ Soluzione: controllare la sintassi del modello e i segnaposto {variablename}.',
  debugmanualgeneratorpanel1208:  '❌ Variabile modello non trovata',
  debugmanualgeneratorpanel1208a: '🔍 Problema: Variabile',
  debugmanualgeneratorpanel1208b: 'non è definito\n\n📄 Dettagli:',
  debugmanualgeneratorpanel1208c: '💡 Possibili cause:\n• gtree non caricato\n• Tabella/progetto non selezionato\n• La variabile non esiste nella struttura dati\n• Errore di battitura nel nome della variabile\n\n🛠️ Soluzione: controllare',
  debugmanualgeneratorpanel1208d: 'Variabile o seleziona tabella/progetto.',
  debugmanualgeneratorpanel1211:  '❌ Errore tipo modello',
  debugmanualgeneratorpanel1211a: '🔍 Problema:',
  debugmanualgeneratorpanel1211b: '💡 Cause comuni:\n\n• Accesso a valori non definiti/nulli\n• Accessi errati ad array come tables[]\n• Array lang mancanti in gtree\n• Selectedlanguageindex errato\n\n🛠️ Soluzione: controllare le strutture dati e gli accessi agli array.',
  debugmanualgeneratorpanel1214:  '❌ Errore di esecuzione del modello',
  debugmanualgeneratorpanel1214a: '🔍 Problema:',
  debugmanualgeneratorpanel1214b: '📝 Tipo:',
  debugmanualgeneratorpanel1214c: '💡 Suggerimenti per il debug:\n\n• Aprire la console del browser (F12) per i dettagli\n\n• Controllare il codice JavaScript generato\n• Semplificare il modello per i test\n\n🛠️ Se i problemi persistono: semplificare la sintassi del modello.',

  debugmanualgeneratorpanel352: 'Nessun modello trovato. Crea prima i modelli in Gestione modelli.',
  debugmanualgeneratorpanel358: 'Errore durante il caricamento dei modelli',
  debugmanualgeneratorpanel420: 'Errore durante il caricamento dei file modello',
  debugmanualgeneratorpanel499: 'Tabella sconosciuta',
  debugmanualgeneratorpanel563: 'Tabella sconosciuta',
  debugmanualgeneratorpanel600: 'Schema demo (fallback)',
  debugmanualgeneratorpanel746: 'Seleziona modello e file',
  debugmanualgeneratorpanel753: 'Seleziona il progetto',
  debugmanualgeneratorpanel758: 'Seleziona la tabella',
  debugmanualgeneratorpanel763: 'Seleziona la lingua',
  debugmanualgeneratorpanel768: 'Questo file non supporta la generazione di codice (file statico)',
  debugmanualgeneratorpanel928: '❌ File per la configurazione selezionata non trovato',
  debugmanualgeneratorpanel936: 'Sconosciuto',
  debugmanualgeneratorpanel940: 'Sconosciuto',
  debugmanualgeneratorpanel946: 'Sconosciuto',
  debugmanualgeneratorpanel953: '💡 Soluzione: controllare la configurazione del modello e la risposta del backend.',
  debugmanualgeneratorpanel959: 'Errore durante il caricamento del codice',
  debugmanualgeneratorpanel962: 'Errore durante il caricamento del codice',
  debugmanualgeneratorpanel970: 'Nessun codice da eseguire',
  debugmanualgeneratorpanel1026: 'Nessuna funzione trovata nel codice generato',
  debugmanualgeneratorpanel1048: 'Aiuto per il debug',
  debugmanualgeneratorpanel1093: 'Errore di sintassi',
  debugmanualgeneratorpanel1096: 'Errore di riferimento',
  debugmanualgeneratorpanel1107: 'Sconosciuto',
  debugmanualgeneratorpanel1111: 'Errore di sintassi',
  debugmanualgeneratorpanel1174: 'Errore: impossibile analizzare la funzione JavaScript',
  debugmanualgeneratorpanel1183: 'Errore di fallback sconosciuto',
  debugmanualgeneratorpanel1203: 'Sconosciuto',
  debugmanualgeneratorpanel1210: 'Senza nome (Sconosciuto)',
  debugmanualgeneratorpanel1229: 'Sconosciuto',
  debugmanualgeneratorpanel1259: '🔧 Generatore di manuali di debug',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1260: 'Sviluppo di modelli e debug del codice per singoli file',
  debugmanualgeneratorpanel1270: '📄 Modello',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1277: 'Scegli il modello',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1284: '📝 File modello',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1293: 'Seleziona file',
  debugmanualgeneratorpanel1302: '(non richiesto)',
  debugmanualgeneratorpanel1310: 'Non richiesto per questo tipo di file',
  debugmanualgeneratorpanel1319: '(richiesto)',
  debugmanualgeneratorpanel1325: '❌ Errori di sintassi del modello',
  debugmanualgeneratorpanel1334: '(non richiesto)',
  debugmanualgeneratorpanel1342: '🌐 Scegli la lingua',
  debugmanualgeneratorpanel1355: '🏗️ Progetto',
  debugmanualgeneratorpanel1360: 'Includi il codice sorgente del modello nel codice',
  debugmanualgeneratorpanel1369: 'Ottieni il codice',
  debugmanualgeneratorpanel1377: 'Eseguire il codice',
  debugmanualgeneratorpanel1385: '🔍 Aiuto per il debug',
  debugmanualgeneratorpanel1396: 'Non selezionato',
  debugmanualgeneratorpanel1397: 'Correggi questi errori di sintassi prima di generare il codice. Il modello non funzionerà correttamente!',
  debugmanualgeneratorpanel1398: 'Sconosciuto',
  debugmanualgeneratorpanel1399: 'Non selezionato',
  debugmanualgeneratorpanel1400: '⚠️ Il codice generato potrebbe contenere errori o codice JavaScript non valido!',
  debugmanualgeneratorpanel1473: '🔴 Nessun progetto selezionato per il modello project_file',
  debugmanualgeneratorpanel1476: '🔴 Nessuna tabella selezionata per il modello db_table_file',
  debugmanualgeneratorpanel1479: '🟡 Nessuna lingua selezionata per il modello abilitato per la lingua',
  debugmanualgeneratorpanel1482: '🔴 Tabelle trovate[] - indice della tabella mancante',
  debugmanualgeneratorpanel1531: '1. Codice preparato',
  debugmanualgeneratorpanel1537: 'Copia GTree',
  debugmanualgeneratorpanel1564: 'GTree downloaden',
  debugmanualgeneratorpanel1583: 'Download non riuscito. Controllare i dati GTree.',
  debugmanualgeneratorpanel1591: 'Copia il codice',
  debugmanualgeneratorpanel1621: 'Impossibile caricare l\'editor di codice',
  debugmanualgeneratorpanel1622: 'Utilizzare un\'area di testo semplice come fallback',
  debugmanualgeneratorpanel1628: 'Ottieni il codice',
  debugmanualgeneratorpanel1679: '2. Risultato eseguito',
  debugmanualgeneratorpanel1683: 'Codice PHP generato',
  debugmanualgeneratorpanel1686: 'Copia il codice',
  debugmanualgeneratorpanel1724: 'Download non riuscito.',
  debugmanualgeneratorpanel1739: '⚠️ Avvertenze sulla sintassi del modello',
  debugmanualgeneratorpanel1744: 'Fare clic su "Esegui codice" per vedere il risultato...',
  debugmanualgeneratorpanel1750: '3. 🔍 Aiuto per il debug',
  debugmanualgeneratorpanel1755: 'Questi avvisi non danneggeranno il tuo codice, ma prendi in considerazione la possibilità di correggerli per migliorare la qualità del modello.',
  debugmanualgeneratorpanel1760: 'Fai clic su "🔍 Debug Helper" per visualizzare le informazioni di debug...',

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel31: 'Le password non corrispondono',
  panelsegisterpanel54: 'Registrazione fallita',
  panelsegisterpanel57: 'Registrazione avvenuta con successo! Ora puoi effettuare l\'accesso.',
  panelsegisterpanel75: 'Si è verificato un errore',
  panelsegisterpanel90: 'Registro',
  panelsegisterpanel123: 'Il tuo nome completo',
  panelsegisterpanel154: 'Almeno 8 caratteri',
  panelsegisterpanel161: 'Inserisci la password',
  panelsegisterpanel162: 'Debole',
  panelsegisterpanel163: 'Medio',
  panelsegisterpanel164: 'Stark',
  panelsegisterpanel176: 'Ripeti la password',
  panelsegisterpanel188: 'Registro',
  panelsegisterpanel198: 'Hai già un account? Accedi',

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: 'Torna alla lobby',
  panelsewnavigationpanel120: 'Benvenuto',
  panelsewnavigationpanel128: 'Progetto',
  panelsewnavigationpanel133: 'Gestione del progetto',
  panelsewnavigationpanel138: 'Impostazioni',
  panelsewnavigationpanel142: 'Impostazioni del progetto',
  panelsewnavigationpanel161: 'Squadre',
  panelsewnavigationpanel165: 'Gestione del team',
  panelsewnavigationpanel170: 'Assegnazione delle squadre',
  panelsewnavigationpanel184: 'Modelli',
  panelsewnavigationpanel188: 'Gestione dei modelli',
  panelsewnavigationpanel193: 'Assegnazione modello',
  panelsewnavigationpanel201: 'Dipendenze dello schema DB',
  panelsewnavigationpanel211: 'Le mie applicazioni',
  panelsewnavigationpanel216: 'Progetti pubblici',
  panelsewnavigationpanel223: 'Banca dati',
  panelsewnavigationpanel228: 'Gestire i database',
  panelsewnavigationpanel233: 'Designer',
  panelsewnavigationpanel238: 'Traduzione dello schema',
  panelsewnavigationpanel246: 'Importa SQL',
  panelsewnavigationpanel251: 'Esporta SQL',
  panelsewnavigationpanel258: 'Generatore',
  panelsewnavigationpanel263: 'Generatore manuale di debug',
  panelsewnavigationpanel268: 'Generazione di codice',
  panelsewnavigationpanel273: 'Generatore di query',
  panelsewnavigationpanel281: 'Amministrazione',
  panelsewnavigationpanel285: 'Impostazioni di sistema',
  panelsewnavigationpanel290: 'Gestione del linguaggio',
  panelsewnavigationpanel298: 'Amministratore CMS',
  panelsewnavigationpanel315: 'Profilo',
  panelsewnavigationpanel320: 'Cambia piano',
  panelsewnavigationpanel325: 'Torna alla lobby',
  panelsewnavigationpanel333: 'Esci',
  panelsewnavigationpanel359: 'Account',
  panelsewnavigationpanel364: 'Login',
  panelsewnavigationpanel369: 'Registro',
  panelsewnavigationpanel384: 'Comprimi menu',
  panelsewnavigationpanel394: 'Navigazione',
  panelsewnavigationpanel413: 'Torna alla lobby',
  panelsewnavigationpanel422: 'Benvenuto',
  panelsewnavigationpanel430: 'Progetto',
  panelsewnavigationpanel437: 'Gestione del progetto',
  panelsewnavigationpanel443: 'Impostazioni',
  panelsewnavigationpanel459: 'Impostazioni del progetto',
  panelsewnavigationpanel469: 'Squadre',
  panelsewnavigationpanel477: 'Gestione del team',
  panelsewnavigationpanel488: 'Assegnazione delle squadre',
  panelsewnavigationpanel496: 'Revisione del modello',
  panelsewnavigationpanel504: 'Gestione dei modelli',
  panelsewnavigationpanel508: 'Assegnazione modello',
  panelsewnavigationpanel513: 'Dipendenze dello schema DB',
  panelsewnavigationpanel521: 'Le mie applicazioni',
  panelsewnavigationpanel525: 'Progetti pubblici',
  panelsewnavigationpanel533: 'Banca dati',
  panelsewnavigationpanel540: 'Gestire i database',
  panelsewnavigationpanel544: 'Designer',
  panelsewnavigationpanel548: 'Traduzione dello schema',
  panelsewnavigationpanel553: 'Importa SQL',
  panelsewnavigationpanel557: 'Esporta SQL',
  panelsewnavigationpanel565: 'Generatore',
  panelsewnavigationpanel572: 'Generatore manuale di debug',
  panelsewnavigationpanel576: 'Generazione di codice',
  panelsewnavigationpanel580: 'Generatore di query',
  panelsewnavigationpanel589: 'Amministrazione',
  panelsewnavigationpanel596: 'Impostazioni di sistema',
  panelsewnavigationpanel600: 'Gestione del linguaggio',
  panelsewnavigationpanel605: 'Amministratore CMS',
  panelsewnavigationpanel619: 'Account',
  panelsewnavigationpanel644: 'Profilo',
  panelsewnavigationpanel648: 'Cambia piano',
  panelsewnavigationpanel652: 'Torna alla lobby',
  panelsewnavigationpanel672: 'Esci',
  panelsewnavigationpanel679: 'Login',
  panelsewnavigationpanel683: 'Registro',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: 'Promessa',
  filemodal95: 'Seleziona un file ZIP!',
  filemodal106: 'File ZIP rimosso',
  filemodal111: 'Aggiungi nuovo file',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal124: 'Nome del file *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: 'Inserisci il nome del file!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: 'ad esempio, Model.php, component.tsx, config.json',
  filemodal147: 'Tipo di modello *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: 'Seleziona il tipo!',
  filemodal160: 'Seleziona il tipo',
  filemodal182: 'Inserisci la directory di destinazione!',
  filemodal185: 'Sentiero:',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: 'ad esempio, /componenti/, /servizi/, /app/Http/Controllers/',
  filemodal202: 'Seleziona il tipo di contenuto:',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal208: 'Inserimento di testo',
  filemodal215: 'Caricamento ZIP',
  filemodal232: 'Inserisci il contenuto del file!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal268: 'Carica il file ZIP',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: 'Seleziona il file ZIP',
  filemodal287: 'Trascina qui il file ZIP o clicca per selezionarlo',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal288: 'Sono supportati i file .zip con strutture modello',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: 'Rimuovere',
  filemodal334: 'Cancellare',
  filemodal340: 'Aggiungere',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: 'Inserisci l\'email',
  forgotpasswordpanel30: 'Reimposta password',
  forgotpasswordpanel52: 'Non è stato possibile inviare il collegamento di reimpostazione',
  forgotpasswordpanel55: 'Un link per il reset è stato inviato al tuo indirizzo email. Controlla la tua posta in arrivo.',
  forgotpasswordpanel59: 'Si è verificato un errore',
  forgotpasswordpanel73: 'Le password non corrispondono',
  forgotpasswordpanel96: 'Impossibile reimpostare la password',
  forgotpasswordpanel99: 'Password reimpostata con successo! Ora puoi accedere con la tua nuova password.',
  forgotpasswordpanel109: 'Si è verificato un errore',
  forgotpasswordpanel129: 'Ha dimenticato la password',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel164: 'Inserisci il tuo indirizzo email per ricevere un link per reimpostare la password.',
  forgotpasswordpanel170: 'E-Mail',
  forgotpasswordpanel178: 'your.email@example.com',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: 'Invia collegamento di reimpostazione',
  forgotpasswordpanel197: 'Torna al login',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel209: 'Inserisci il codice di reimpostazione ricevuto tramite e-mail e la tua nuova password.',
  forgotpasswordpanel215: 'Codice di reset',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: 'Codice dall\'email',
  forgotpasswordpanel237: 'Nuova password',
  forgotpasswordpanel244: 'Inserisci la password',
  forgotpasswordpanel245: 'Debole',
  forgotpasswordpanel246: 'Medio',
  forgotpasswordpanel247: 'Stark',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel252: 'Conferma password',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel259: 'Ripeti la password',
  forgotpasswordpanel272: 'Indietro',
  forgotpasswordpanel280: 'Reimposta password',
  forgotpasswordpanel291: 'Torna al login',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel76: 'Non autorizzato. È richiesto l\'accesso come amministratore di sistema.',
  languagemanagementpanel78: 'Impossibile caricare le lingue:',
  languagemanagementpanel120: 'Sei sicuro di voler eliminare questa lingua?',
  languagemanagementpanel121: 'Elimina lingua',
  languagemanagementpanel124: 'SÌ',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel125: 'NO',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel132: 'ELIMINARE',
  languagemanagementpanel133: 'Lingua eliminata con successo',
  languagemanagementpanel136: 'Impossibile eliminare la lingua:',
  languagemanagementpanel142: 'TOPPA',
  languagemanagementpanel146: 'Impossibile modificare lo stato della lingua:',
  languagemanagementpanel152: 'TOPPA',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: 'Lingua predefinita aggiornata con successo',
  languagemanagementpanel156: 'Impossibile impostare la lingua predefinita:',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: 'Lingua aggiornata con successo',
  languagemanagementpanel173: 'Lingua creata con successo',
  languagemanagementpanel178: 'Impossibile salvare la lingua:',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel183: '🇺🇸 Stati Uniti',
  languagemanagementpanel184: '🇬🇧 Regno Unito',
  languagemanagementpanel185: '🇩🇪 Germania',
  languagemanagementpanel186: '🇫🇷 Francia',
  languagemanagementpanel187: '🇪🇸 Spagna',
  languagemanagementpanel188: '🇮🇹 Italia',
  languagemanagementpanel189: '🇳🇱 Paesi Bassi',
  languagemanagementpanel190: '🇵🇹 Portogallo',
  languagemanagementpanel191: '🇷🇺 Russia',
  languagemanagementpanel192: '🇯🇵 Giappone',
  languagemanagementpanel193: '🇰🇷 Corea del Sud',
  languagemanagementpanel194: '🇨🇳 Cina',
  languagemanagementpanel195: '🇧🇷 Brasile',
  languagemanagementpanel196: '🇲🇽 Messico',
  languagemanagementpanel197: '🇨🇦 Canada',
  languagemanagementpanel198: '🇦🇺 Australia',
  languagemanagementpanel199: '🇮🇳 India',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel214: 'Inattivo',
  languagemanagementpanel223: 'Sistema',
  languagemanagementpanel251: 'Attivare',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: 'Imposta come predefinito',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: 'Impossibile eliminare la lingua predefinita',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel291: 'Gestione del linguaggio',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: 'Aggiungi lingua',
  languagemanagementpanel317: 'RighePerPaginaMenu a discesaCollegamento PrimaPaginaCollegamento PaginaPrecedentePaginaCorrenteReportCollegamento PaginaSuccessivaCollegamento UltimaPagina',
  languagemanagementpanel324: 'Nessuna lingua trovata',
  languagemanagementpanel326: 'Bandiera',
  languagemanagementpanel327: 'Codice',
  languagemanagementpanel328: 'Nome',
  languagemanagementpanel329: 'Nome nativo',
  languagemanagementpanel330: 'Stato',
  languagemanagementpanel331: 'Ordine di ordinamento',
  languagemanagementpanel332: 'Creatore',
  languagemanagementpanel333: 'Descrizione',
  languagemanagementpanel334: 'Azioni',
  languagemanagementpanel340: 'Aggiungi nuova lingua',
  languagemanagementpanel352: 'Cancellare',
  languagemanagementpanel359: 'Creare',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel371: 'Codice lingua *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: 'Inserisci il codice della lingua',
  languagemanagementpanel379: 'Il codice deve contenere al massimo 5 caratteri',
  languagemanagementpanel380: 'Inserisci un codice lingua valido (ad esempio',
  languagemanagementpanel410: 'Seleziona bandiera',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel423: 'Nome inglese *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: 'Inserisci il nome della lingua',
  languagemanagementpanel431: 'Il nome deve contenere al massimo 100 caratteri',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: 'ad esempio, inglese, tedesco, francese',
  languagemanagementpanel449: 'Nome nativo *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: 'Inserisci il nome della lingua madre',
  languagemanagementpanel457: 'Il nome nativo deve contenere al massimo 100 caratteri',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: 'ad esempio, inglese, tedesco, francese',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: 'La descrizione deve contenere al massimo 1000 caratteri',
  languagemanagementpanel490: 'Descrizione facoltativa della lingua',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel503: 'Ordine di ordinamento *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: 'Inserisci l\'ordine di ordinamento',
  languagemanagementpanel511: 'L\'ordine di ordinamento deve essere 0 o superiore',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel548: 'Lingua predefinita',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel44: 'Accesso non riuscito',
  loginpanel74: 'Si è verificato un errore',
  loginpanel88: 'Login',

  // resources/js/Components/Panels/LoginPanel.tsx
  loginpanel106: 'E-Mail',
  loginpanel114: 'your.email@example.com',
  loginpanel122: 'Password',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel129: 'La tua password',
  loginpanel141: 'Accesso in corso...',
  loginpanel152: 'Non hai un account? Registrati',
  loginpanel160: 'Ha dimenticato la password?',

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel61: 'Non autenticato',
  myapplicationspanel73: 'Impossibile caricare le applicazioni',
  myapplicationspanel80: 'Errore durante il caricamento delle applicazioni',
  myapplicationspanel87: 'Questo è il',
  myapplicationspanel138: 'Nessun messaggio',
  myapplicationspanel164: 'Visualizza i dettagli',
  myapplicationspanel201: 'Caricamento delle applicazioni in corso...',
  myapplicationspanel213: 'Le mie applicazioni',
  myapplicationspanel217: 'Aggiorna',
  myapplicationspanel228: 'Cronologia delle applicazioni',
  myapplicationspanel232: 'Nessuna applicazione',
  myapplicationspanel233: 'Non hai ancora presentato domanda per nessun progetto.',
  myapplicationspanel242: 'Nessuna applicazione trovata',
  myapplicationspanel248: 'Progetto',
  myapplicationspanel255: 'Messaggio',
  myapplicationspanel261: 'Stato',
  myapplicationspanel268: 'Applicato',
  myapplicationspanel276: 'Risposta',
  myapplicationspanel282: 'Azioni',
  myapplicationspanel292: 'Dettagli dell\'applicazione',
  myapplicationspanel305: 'Informazioni sul progetto',
  myapplicationspanel322: 'Informazioni sull\'applicazione',
  myapplicationspanel326: 'Stato:',
  myapplicationspanel332: 'Applicato:',
  myapplicationspanel338: 'Codice di iscrizione:',
  myapplicationspanel348: 'Il tuo messaggio:',
  myapplicationspanel358: 'Rifiuto',
  myapplicationspanel362: 'Recensito da:',
  myapplicationspanel365: 'Data:',
  myapplicationspanel369: 'Risposta:',
  myapplicationspanel381: 'Vicino',

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel112: 'Torna alla lobby',
  newnavigationpanel120: 'Benvenuto',
  newnavigationpanel128: 'Progetto',
  newnavigationpanel133: 'Gestione del progetto',
  newnavigationpanel138: 'Impostazioni',
  newnavigationpanel142: 'Impostazioni del progetto',
  newnavigationpanel161: 'Squadre',
  newnavigationpanel165: 'Gestione del team',
  newnavigationpanel170: 'Assegnazione delle squadre',
  newnavigationpanel184: 'Modelli',
  newnavigationpanel188: 'Gestione dei modelli',
  newnavigationpanel193: 'Assegnazione modello',
  newnavigationpanel201: 'Dipendenze dello schema DB',
  newnavigationpanel211: 'Le mie applicazioni',
  newnavigationpanel216: 'Progetti pubblici',
  newnavigationpanel223: 'Banca dati',
  newnavigationpanel228: 'Gestire i database',
  newnavigationpanel233: 'Designer',
  newnavigationpanel238: 'Traduzione dello schema',
  newnavigationpanel246: 'Importa SQL',
  newnavigationpanel251: 'Esporta SQL',
  newnavigationpanel258: 'Generatore',
  newnavigationpanel263: 'Generatore manuale di debug',
  newnavigationpanel268: 'Generazione di codice',
  newnavigationpanel273: 'Generatore di query',
  newnavigationpanel281: 'Amministrazione',
  newnavigationpanel285: 'Impostazioni di sistema',
  newnavigationpanel290: 'Gestione del linguaggio',
  newnavigationpanel298: 'Amministratore CMS',
  newnavigationpanel315: 'Profilo',
  newnavigationpanel320: 'Cambia piano',
  newnavigationpanel325: 'Torna alla lobby',
  newnavigationpanel333: 'Esci',
  newnavigationpanel357: 'Kanban Board 💰',
  newnavigationpanel359: 'Account',
  newnavigationpanel364: 'Login',
  newnavigationpanel369: 'Registro',
  newnavigationpanel384: 'Comprimi menu',
  newnavigationpanel394: 'Navigazione',
  newnavigationpanel413: 'Torna alla lobby',
  newnavigationpanel422: 'Benvenuto',
  newnavigationpanel430: 'Progetto',
  newnavigationpanel437: 'Gestione del progetto',
  newnavigationpanel443: 'Impostazioni',
  newnavigationpanel459: 'Impostazioni del progetto',
  newnavigationpanel469: 'Squadre',
  newnavigationpanel477: 'Gestione del team',
  newnavigationpanel488: 'Assegnazione delle squadre',
  newnavigationpanel496: 'Modelli',
  newnavigationpanel504: 'Gestione dei modelli',
  newnavigationpanel508: 'Assegnazione modello',
  newnavigationpanel513: 'Dipendenze dello schema DB',
  newnavigationpanel521: 'Le mie applicazioni',
  newnavigationpanel525: 'Progetti pubblici',
  newnavigationpanel533: 'Banca dati',
  newnavigationpanel540: 'Gestire i database',
  newnavigationpanel544: 'Designer',
  newnavigationpanel548: 'Traduzione dello schema',
  newnavigationpanel553: 'Importa SQL',
  newnavigationpanel557: 'Esporta SQL',
  newnavigationpanel565: 'Generatore',
  newnavigationpanel572: 'Generatore manuale di debug',
  newnavigationpanel576: 'Generazione di codice',
  newnavigationpanel580: 'Generatore di query',
  newnavigationpanel589: 'Amministrazione',
  newnavigationpanel596: 'Impostazioni di sistema',
  newnavigationpanel600: 'Gestione del linguaggio',
  newnavigationpanel605: 'Amministratore CMS',
  newnavigationpanel619: 'Account',
  newnavigationpanel635: '} text-gray-300`} title={isLoggedIn ? userName :',
  newnavigationpanel644: 'Profilo',
  newnavigationpanel648: 'Cambia piano',
  newnavigationpanel652: 'Torna alla lobby',
  newnavigationpanel672: 'Esci',
  newnavigationpanel679: 'Login',
  newnavigationpanel683: 'Registro',

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: 'Utente sconosciuto',
  panelt1143: 'Banche dati',
  panelt1147: 'Banche dati',
  panelt1219: 'Anteprima del file',
  panelt1222: 'Anteprima del file',
  panelt1281: 'Errore durante il caricamento dei progetti',
  panelt1287: 'Controllare la console per errori',
  panelt1293: 'Per i dettagli, vedere la console del browser',
  panelt1416: 'Anteprima del file',
  panelt1506: 'teamChanged',
  panelt1509: 'teamChanged',
  panelt1521: 'filePreviewUpdate',
  panelt1524: 'filePreviewUpdate',
  panelt1680: 'Progetto',
  panelt1696: 'Progetto',
  panelt1725: 'Tavolo',
  panelt1786: '📁 Navigazione',
  panelt1791: 'Espandi tutto',
  panelt1798: 'Comprimi tutto',
  panelt1809: 'Caricamento progetti in corso...',
  panelt1813: 'Nessun progetto trovato',
  panelt1833: 'Selezionato:',
  panelt1835: 'Nome:',
  panelt1StandaloneTeams: 'Team (non collegati)',
  panelt1StandaloneTemplates: 'Template (non collegati)',
  panelt1StandaloneDatabases: 'Database (non collegati)',
  panelt1MyTeams: 'I miei Team',
  panelt1MyTemplates: 'I miei Template',
  panelt1MyDatabases: 'I miei Database',
  panelt1836: 'Tipo:',
  panelt1837: 'ID:',
  panelt1839: 'Sentiero:',
  panelt1842: 'ID progetto:',
  panelt1843: 'Sentiero:',
  panelt1845: 'ID squadra:',
  panelt1848: 'Ruolo:',
  panelt1853: 'ID modello:',
  panelt1856: 'Tavolo:',
  panelt1859: 'Lingua:',
  panelt1873: 'Articoli totali',
  panelt1879: 'Selezionato',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: 'Modifica tabella',
  panelt2151: 'Elimina tabella',
  panelt2179: 'Nessun campo',
  panelt2405: 'Autenticazione richiesta',
  panelt2439: 'Impossibile caricare gli schemi',
  panelt2443: 'Autenticazione',
  panelt2551: 'Impossibile caricare le versioni dello schema',
  panelt2602: 'Impossibile caricare la versione dello schema',
  panelt2685: 'Nessuna versione disponibile. Creare prima una versione dello schema.',
  panelt2704: 'Nessuna versione selezionata o ID versione mancante. Selezionare prima una versione dello schema.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: 'Impossibile creare la tabella',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: 'Nessuna versione selezionata o tabella da modificare. Selezionare prima una versione dello schema.',
  panelt2806: 'Impossibile aggiornare la tabella',
  panelt2817: 'Impossibile aggiornare la tabella',
  panelt2826: 'Nessuno schema o versione selezionati. Seleziona prima uno schema.',
  panelt2841: 'Impossibile creare una nuova versione',
  panelt2852: 'Impossibile creare una nuova versione',
  panelt2862: 'Nessuno schema o versione selezionati. Seleziona prima uno schema.',
  panelt2877: 'Impossibile creare una nuova versione',
  panelt2888: 'Impossibile creare una nuova versione',
  panelt2898: 'Nessuna versione selezionata. Selezionare prima una versione dello schema.',
  panelt2920: 'Impossibile aggiornare la versione',
  panelt2930: 'Nessuna versione selezionata. Selezionare prima una versione dello schema.',
  panelt2952: 'Impossibile aggiornare la versione',
  panelt21001: 'Impossibile eliminare la tabella',
  panelt21010: 'Impossibile eliminare la tabella',
  panelt21030: 'Nessuna tabella selezionata per l\'eliminazione',
  panelt21054: 'Impossibile creare la versione ed eliminare la tabella',
  panelt21075: 'Impossibile creare una nuova versione ed eliminare la tabella',
  panelt21101: 'Nessuna tabella selezionata per l\'eliminazione',
  panelt21122: 'Impossibile eliminare la tabella',
  panelt21133: 'Nessuno schema selezionato',
  panelt21144: 'Crea nuova versione',
  panelt21153: 'Non autenticato',
  panelt21170: 'Impossibile creare una nuova versione',
  panelt21185: 'Impossibile creare una nuova versione',
  panelt21231: 'Non autenticato',
  panelt21245: 'Impossibile eliminare la chiave esterna',
  panelt21270: 'Impossibile eliminare la chiave esterna',
  panelt21282: '🗃️ Progettista di database',
  panelt21289: 'Caricamento delle versioni dello schema in corso...',
  panelt21291: 'Nessuno schema selezionato',
  panelt21292: 'Nessun progetto selezionato',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: 'Nessun progetto selezionato',
  panelt21350: '🔄 Aggiorna',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: 'Crea una nuova versione (copia la versione corrente)',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21359: '➕ Nuova versione',
  panelt21375: '✨ Nuova tabella',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21402: 'Caricamento schema in corso...',
  panelt21439: 'posizioneAssoluta',
  panelt21511: 'Autenticazione',
  panelt21515: 'Autenticazione richiesta',
  panelt21516: 'La sessione è scaduta. Effettua il login per accedere ai dati dello schema.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21517: 'Utilizza il menu di navigazione per effettuare nuovamente l\'accesso',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21525: 'Nessun dato di schema',
  panelt21528: 'Seleziona un progetto per visualizzare gli schemi',
  panelt21530: 'Nessuno schema associato a questo progetto',
  panelt21531: 'Seleziona uno schema per visualizzare la struttura del database',
  panelt21549: '🔍 Dettagli del tavolo',
  panelt21552: 'Tavolo:',
  panelt21556: 'Campi:',
  panelt21560: 'Vincoli:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21564: 'Chiavi primarie:',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: 'creare una nuova tabella',
  panelt21600: 'Attuale',
  panelt21629: 'Azioni chiave esterna',
  panelt21635: 'Da:',
  panelt21639: 'A:',
  panelt21654: 'Modifica FK in arrivo nella Fase 2! 🚀',
  panelt21689: 'Elimina chiave esterna',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21692: 'Sei sicuro di voler eliminare questo vincolo di chiave esterna?',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21699: 'Vincolo:',
  panelt21703: 'Da:',
  panelt21707: 'A:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21714: '⚠️ Per questa modifica verrà creata una nuova versione.',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21736: 'Elimina chiave esterna',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesCategoryAll: 'Tutte le categorie',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt367: 'Tutto',
  panelt375: 'Non autenticato',
  panelt390: 'Impossibile caricare i modelli',
  panelt3103: 'Errore durante il caricamento dei modelli',
  panelt3115: 'Non autenticato',
  panelt3148: 'Errore durante il caricamento dei modelli di progetto',
  panelt3158: 'lingua modificata',
  panelt3161: 'lingua modificata',
  panelt3201: 'Non autenticato',
  panelt3219: 'Impossibile assegnare i modelli',
  panelt3231: 'Errore durante l\'assegnazione dei modelli',
  panelt3245: 'Non autenticato',
  panelt3250: 'ELIMINARE',
  panelt3272: 'Errore durante la rimozione del modello',
  panelt3287: 'Tutto',
  panelt3295: 'Tutte le categorie',
  panelt3296: 'Rete',
  panelt3297: 'Mobile',
  panelt3298: 'API',
  panelt3299: 'Scrivania',
  panelt3300: 'Banca dati',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesLoadingText: 'Caricamento modelli...',
  templatesAssignmentTitle: 'Assegnazione modelli',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3323: 'di ',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesWorkingOn: 'da ',
  templatesSelectProjectHint: 'Seleziona un progetto dalla navigazione per gestire i modelli',
  templatesSearchPlaceholder: 'Cerca modelli...',
  templatesFilterCategory: 'Filtra per categoria',
  templatesNoTemplatesFound: 'Nessun modello trovato',
  templatesSelectedCount: 'selezionato',
  templatesRemoveFromProject: 'Rimuovi dal progetto',
  templatesColumnName: 'Nome modello',
  templatesColumnDescription: 'Descrizione',
  templatesColumnCategory: 'Categoria',
  templatesColumnLanguage: 'Lingua',
  templatesColumnStatus: 'Stato',
  templatesStatusInactive: 'Inattivo',
  templatesStatusActive: 'Attivo',
  templatesColumnCreated: 'Creato',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3471: 'Questo è il',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesClearSelection: 'Cancella selezione',
  templatesAssignButton: 'Assegna modelli',

  // resources/js\Components\Panels\PanelT5.tsx
  panelt538: 'Banca dati',
  panelt544: 'Riprogettazione del sito web',
  panelt555: 'Applicazione mobile',
  panelt567: 'Modal.tsx',
  panelt572: 'LEGGIMI.md',
  panelt577: 'Documenti',
  panelt582: 'Contratto.docx',
  panelt585: 'Rapporti',
  panelt588: 'Rapporto Q1.xlsx',
  panelt589: 'Rapporto Q2.xlsx',
  panelt596: 'Attività',
  panelt5235: '📁 Esploratore di database',
  panelt5240: 'Espandi tutto',
  panelt5247: 'Comprimi tutto',
  panelt5271: 'Selezionato:',
  panelt5273: 'Nome:',
  panelt5274: 'Tipo:',
  panelt5275: 'ID:',
  panelt5286: 'Articoli totali',
  panelt5292: 'Selezionato',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel47: 'Non autenticato',
  profilepanel58: 'Impossibile caricare i dati dell\'utente',
  profilepanel69: 'Si è verificato un errore',
  profilepanel84: 'Non autenticato',
  profilepanel100: 'Il profilo non può essere aggiornato',
  profilepanel103: 'Profilo aggiornato con successo',
  profilepanel107: 'Si è verificato un errore',
  profilepanel121: 'Le nuove password non corrispondono',
  profilepanel129: 'Non autenticato',
  profilepanel145: 'La password non può essere modificata',
  profilepanel148: 'Password modificata con successo',
  profilepanel156: 'Si è verificato un errore',
  profilepanel181: '{utente?.email}',
  profilepanel200: 'Modifica profilo',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel204: 'Nome',
  profilepanel218: 'E-Mail',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel234: 'Aggiorna profilo',
  profilepanel242: 'Cambiare la password',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel246: 'password attuale',
  profilepanel263: 'Nuova password',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel276: 'Inserisci la password',
  profilepanel277: 'Debole',
  profilepanel278: 'Medio',
  profilepanel279: 'Stark',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel284: 'Conferma la nuova password',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel302: 'Modifica...',
  profilepanel310: 'Informazioni sull\'account',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel314: 'ID utente',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel317: '{utente?.id}',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel321: 'Registrato dal',
  profilepanel330: 'Email verificata',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel355: 'Mai registrato',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel118: 'd.m.Y',
  projectpanel119: 'Corrente: ',
  projectpanel121: 'Europa/Vienna',
  projectpanel224: 'I nomi dei progetti possono contenere solo lettere minuscole (a-z)',
  projectpanel232: 'Non autenticato',
  projectpanel253: 'I nomi dei progetti possono contenere solo lettere minuscole (a-z)',
  projectpanel258: 'Impossibile creare il progetto',
  projectpanel293: 'd.m.Y',
  projectpanel294: 'Il suo',
  projectpanel296: 'Europa/Vienna',
  projectpanel298: 'Progetto creato con successo',
  projectpanel301: 'progettomodificato',
  projectpanel304: 'Errore durante la creazione del progetto',
  projectpanel330: 'd.m.Y',
  projectpanel331: 'Il suo',
  projectpanel333: 'Europa/Vienna',
  projectpanel348: 'Non autenticato',
  projectpanel352: 'ELIMINARE',
  projectpanel361: 'Impossibile eliminare il progetto',
  projectpanel369: 'Progetto eliminato con successo',
  projectpanel372: 'Errore durante l\'eliminazione del progetto',
  projectpanel390: 'Questo è il',
  projectpanel405: 'Non autenticato',
  projectpanel416: 'Impossibile caricare i team',
  projectpanel451: 'Non autenticato',
  projectpanel462: 'Impossibile caricare gli schemi',
  projectpanel492: 'Non autenticato',
  projectpanel539: 'Attivo',
  projectpanel562: 'Panoramica del progetto',
  projectpanel575: 'Gestisci i membri',
  projectpanel583: 'Modifica progetto',
  projectpanel589: 'Elimina progetto',
  projectpanel601: 'Caricamento progetti in corso...',
  projectpanel615: 'Gestione del progetto',
  projectpanel626: 'Nuovo progetto',
  projectpanel634: 'Unisciti al progetto',
  projectpanel642: 'Aggiorna',
  projectpanel671: 'Progetto attuale',
  projectpanel678: 'Modifica progetto',
  projectpanel692: 'Nessuna descrizione fornita',
  projectpanel698: 'Proprietario:',
  projectpanel706: 'Creato:',
  projectpanel716: 'Codice di adesione',
  projectpanel724: 'Copia il codice di adesione',
  projectpanel730: 'Privato',
  projectpanel742: 'Squadre',
  projectpanel748: 'Membri',
  projectpanel754: 'Modelli',
  projectpanel760: 'Banche dati',
  projectpanel766: 'Applicazioni',
  projectpanel773: 'Nessun progetto attivo',
  projectpanel774: 'Non hai ancora un progetto attivo.',
  projectpanel776: 'Crea progetto',
  projectpanel786: 'Azioni rapide',
  projectpanel789: 'Applicazioni',
  projectpanel796: 'Membri del progetto',
  projectpanel803: 'Gestione dei team',
  projectpanel815: 'Inviti',
  projectpanelAttachments: 'Allegati',
  projectpanelKanban: 'Kanban Board',
  navAgileMethod: 'Metodi Agili',
  projectExport: 'Esporta',
  projectImport: 'Importa',
  projectpanel822: 'Modelli',
  projectpanel838: 'Banca dati',
  projectpanel850: 'Tutti i progetti',
  projectpanel854: 'Nessun progetto trovato',
  projectpanel859: 'Progetto',
  projectpanel862: 'Proprietario',
  projectpanel868: 'Creato',
  projectpanel874: 'Stato',
  projectpanel879: 'Azioni',
  projectpanel892: 'Crea nuovo progetto',
  projectpanel904: 'Impostazioni del progetto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel907: 'Nome del progetto *',
  projectpanel931: 'Descrizione',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: 'Inserisci la descrizione del progetto (facoltativo)',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel955: 'Progetto pubblico',
  projectpanel959: 'I progetti pubblici sono visibili a tutti gli utenti e possono essere scoperti nella galleria dei progetti.',
  projectpanel972: 'Consenti richieste di partecipazione',
  projectpanel976: 'Gli utenti possono richiedere di unirsi a questo progetto utilizzando un codice di adesione.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel984: 'Connessione al database',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel987: 'Nome del database',
  projectpanel998: 'Nome del database per questo progetto',
  projectpanel1004: 'Tipo di database',
  projectpanel1024: 'Server',
  projectpanel1038: 'Porta',
  projectpanel1053: 'Nome utente',
  projectpanel1067: 'Password',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1084: 'Proprietà del progetto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1087: 'Elenco dei progetti',
  projectpanel1098: 'Percorso in cui salvare i file generati',
  projectpanel1104: 'URL del progetto',
  projectpanel1115: 'URL per accedere al progetto',
  projectpanel1121: 'Pagina iniziale',
  projectpanel1128: 'indice.php',
  projectpanel1138: 'Lingua predefinita',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1146: 'Inglese',
  projectpanel1147: 'tedesco',
  projectpanel1148: 'francese',
  projectpanel1149: 'spagnolo',
  projectpanel1150: 'Italiano',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1155: 'Linguaggio standard per la generazione del progetto',
  projectpanel1161: 'Nome file Breve Lunghezza',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1185: 'Impostazioni di localizzazione',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1189: 'Separatore decimale',
  projectpanel1207: 'Separatore di migliaia',
  projectpanel1227: 'Formato data',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1234: 'd.m.Y',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1244: 'Formato ora',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1251: 'Il suo',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: 'Simbolo di valuta',
  projectpanel1281: 'Fuso orario',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1289: 'Europa/Vienna',
  projectpanel1290: 'Europa/Berlino',
  projectpanel1291: 'Europa/Zurigo',
  projectpanel1292: 'Europa/Londra',
  projectpanel1293: 'Europa/Parigi',
  projectpanel1294: 'America/New_York',
  projectpanel1295: 'America/Los Angeles',
  projectpanel1296: 'Asia/Tokyo',
  projectpanel1297: 'Australia/Sydney',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1303: 'Fuso orario predefinito per il progetto',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1325: 'Cancellare',
  projectpanel1332: 'Crea progetto',
  projectpanel1342: 'Elimina progetto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: 'Sei sicuro di voler eliminare questo progetto?',
  projectpanel1362: 'Questa azione eliminerà PERMANENTEMENTE il progetto e tutti i suoi dati. Questa operazione non può essere annullata! I team, i modelli e i database associati a questo progetto rimarranno intatti.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1371: 'Cancellare',
  projectpanel1378: 'Elimina progetto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1434: '📋 Proprietà del progetto',
  projectpanel1437: 'Nome:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1440: '📋 Proprietà del progetto',
  projectpanel1443: 'Nome:',
  projectpanel1447: 'Proprietario:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: 'Codice di iscrizione:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: 'Creato:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: 'Descrizione:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1455: 'Codice di iscrizione:',
  projectpanel1459: 'Descrizione:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1461: '👤 Membri del progetto',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: '👤 Membri del progetto',
  projectpanel1471: 'Caricamento membri in corso...',
  projectpanel1481: 'Utente sconosciuto',
  projectpanel1482: 'Nessuna e-mail',
  projectpanel1491: 'Membro',
  projectpanel1513: '👥 Squadre e membri',
  projectpanel1517: 'Caricamento squadre in corso...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1529: '🗄️ Schemi di database',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: '🗄️ Schemi di database',
  projectpanel1539: 'Caricamento schemi in corso...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1542: 'Nessuno schema di database è ancora collegato a questo progetto.',
  projectpanel1550: '📄 Modelli collegati',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: '📄 Modelli collegati',
  projectpanel1560: 'Caricamento modelli in corso...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1563: 'Nessun modello è ancora collegato a questo progetto.',
  projectpanel1573: 'Vicino',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: 'Gestisci progetto',
  projectpanel1585: 'Gestisci progetto',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: 'd.m.Y',
  projectsettingspanel65: 'Il suo',
  projectsettingspanel67: 'Europa/Vienna',
  projectsettingspanel143: 'd.m.Y',
  projectsettingspanel144: 'Il suo',
  projectsettingspanel146: 'Europa/Vienna',
  projectsettingspanel151: 'Errore durante il caricamento dei dati del progetto',
  projectsettingspanel190: 'Nessun progetto selezionato',
  projectsettingspanel209: 'Non autenticato',
  projectsettingspanel225: 'Impossibile aggiornare il progetto',
  projectsettingspanel243: 'Impossibile salvare le impostazioni della lingua',
  projectsettingspanel246: 'Impostazioni del progetto salvate correttamente',
  projectsettingspanel251: 'Errore durante il salvataggio delle impostazioni del progetto',
  projectsettingspanel258: 'PROG-',
  projectsettingspanel275: 'Seleziona un progetto',
  projectsettingspanel276: 'selectedProject è nullo',
  projectsettingspanel277: '🔍 ProjectSettingsPanel caricato ma nessun progetto selezionato',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel295: 'Impostazioni del progetto',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: 'Salva tutte le modifiche',
  projectsettingspanel313: 'Generalmente',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: 'Nome del progetto *',
  projectsettingspanel331: 'Descrizione',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel338: 'Inserisci la descrizione del progetto',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel344: 'Unisciti al codice',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel351: 'Codice di adesione (facoltativo)',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel359: 'Gli utenti possono unirsi a questo progetto con questo codice',
  projectsettingspanel375: 'Rendi questo progetto visibile a tutti gli utenti',
  projectsettingspanel382: 'Trasferire la proprietà',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel405: 'Banca dati',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel408: 'Nome del database',
  projectsettingspanel420: 'Tipo di database',
  projectsettingspanel463: 'nome utente',
  projectsettingspanel475: 'password',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel489: 'Caratteristiche',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel492: 'Elenco dei progetti',
  projectsettingspanel501: 'Percorso in cui salvare i file generati',
  projectsettingspanel507: 'URL del progetto',
  projectsettingspanel516: 'URL per accedere al progetto',
  projectsettingspanel522: 'Casa',
  projectsettingspanel537: 'Lingua predefinita',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel544: 'Inglese',
  projectsettingspanel545: 'tedesco',
  projectsettingspanel546: 'francese',
  projectsettingspanel547: 'spagnolo',
  projectsettingspanel548: 'Italiano',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: 'Linguaggio standard per la generazione del progetto',
  projectsettingspanel558: 'Nome file breve',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel565: '2 personaggi',
  projectsettingspanel566: '3 personaggi',
  projectsettingspanel567: '4 personaggi',
  projectsettingspanel568: '5 caratteri',
  projectsettingspanel578: 'Localizzazione',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: 'Separatore decimale',
  projectsettingspanel592: 'ad esempio \',\' per 1,23 o \'.\' per 1,23',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel593: 'per 1,23 o',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: 'Separatore delle migliaia',
  projectsettingspanel608: 'ad esempio \'.\' per 1.234 o \',\' per 1.234',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel609: 'per 1.234 o',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: 'Formato data',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel622: 'd.m.Y',
  projectsettingspanel626: 'd.m.Y',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: 'Formato dell\'ora',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel637: 'Il suo',
  projectsettingspanel639: 'Proprietario attuale',
  projectsettingspanel641: 'Il suo',
  projectsettingspanel644: '⚠️ Attenzione: dopo il trasferimento perderai i tuoi diritti di proprietà!',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel658: 'ad esempio \'€\', \'$\', \'£\', \'CHF\'',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel659: 'CHF',
  projectsettingspanel671: 'Europa/Vienna',
  projectsettingspanel672: 'Europa/Berlino',
  projectsettingspanel673: 'Europa/Zurigo',
  projectsettingspanel674: 'Europa/Londra',
  projectsettingspanel675: 'America/New_York',
  projectsettingspanel676: 'America/Chicago',
  projectsettingspanel677: 'America/Los Angeles',
  projectsettingspanel678: 'Asia/Tokyo',
  projectsettingspanel679: 'Asia/Dubai',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel680: 'UTC',
  projectsettingspanel689: 'Chiave API di Google Translate',
  projectsettingspanel700: 'Chiave API per traduzioni automatiche tramite Google Translate',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: 'Lingue',
  projectsettingspanel727: 'Lingue disponibili',
  projectsettingspanel728: 'Lingue attivate',
  projectsettingspanel733: 'Cercare...',
  projectsettingspanel734: 'Impostazioni diagramma',
  projectsettingspanel738: 'Configura le impostazioni predefinite per il layout automatico del diagramma. Questi valori verranno utilizzati per il pulsante "Ordina il diagramma".',
  projectsettingspanel739: 'Lingue selezionate:',
  projectsettingspanel742: 'Nessuna lingua selezionata',
  projectsettingspanel744: 'Numero massimo di tabelle per riga',
  projectsettingspanel753:  'Numero massimo di tabelle in una riga',
  projectsettingspanel758:  'Larghezza della tabella (px)',
  projectsettingspanel767:  'Larghezza delle caselle della tabella nel diagramma',
  projectsettingspanel772:  'Altezza della tabella (px)',
  projectsettingspanel781:  'Altezza massima delle scatole da tavolo',
  projectsettingspanel786:  'Spaziatura orizzontale (px)',
  projectsettingspanel795:  'Spaziatura orizzontale tra le tabelle',
  projectsettingspanel800:  'Spaziatura verticale (px)',
  projectsettingspanel809:  'Spaziatura verticale tra le righe',
  projectsettingspanel814:  'Valori di anteprima:',
  projectsettingspanel816:  'Valori di anteprima:',
  projectsettingspanel817:  'Numero massimo di tabelle per riga:',
  projectsettingspanel818:  'Dimensioni del tavolo:',
  projectsettingspanel818a: 'orizzontale',
  projectsettingspanel818b: 'verticale',
  projectsettingspanel866:  'File di voce principale (ad esempio, index.php, main.py, app.js)',
  projectsettingspanel872:  'Lingua standard',
  projectsettingspanel893:  'Formato archivio',
  projectsettingspanel906:  'Formato per gli archivi di codice generati (ZIP per Windows, TAR.GZ/XZ per Linux)',
  projectsettingspanel926:  'Lunghezza dei nomi di file brevi in Database Designer (ad esempio, "us" per gli utenti)',
  projectsettingspanel946:  'ad esempio "," per 1,23 o "." per 1,23',
  projectsettingspanel962:  'ad esempio "." per 1,234 o "," per 1.234',
  projectsettingspanel979:  'Formato PHP (ad esempio "d.m.Y" per 31.12.2026)',
  projectsettingspanel995:  'Formato PHP (ad esempio "H:i:s" per 14:30:00)',
  projectsettingspanel1012: 'ad esempio "€", "$", "£", "CHF"',
  projectsettingspanel1058: 'Google Cloud Console - Crea chiave API',
  projectsettingspanel1068: 'Seleziona le lingue da utilizzare per la generazione del codice in questo progetto. Sposta le lingue desiderate verso destra e usa i tasti freccia per modificarne l\'ordine.',
  projectsettingspanel1111: 'Qui puoi inserire i valori per le variabili del modello personalizzate. Queste variabili sono state definite dallo sviluppatore del modello e possono variare per ogni lingua.',
  projectsettingspanel1122: 'Non sono state trovate variabili modello. Gli sviluppatori di modelli possono definire variabili personalizzate nei loro modelli.',
  projectsettingspanel1129: 'Linguaggio per le variabili',
  projectsettingspanel932: 'Localizzazione',
  projectsettingspanel1108: 'Variabili modello',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel85: 'Non autenticato',
  publicprojectspanel97: 'Impossibile caricare i progetti pubblici',
  publicprojectspanel104: 'Errore durante il caricamento dei progetti pubblici',
  publicprojectspanel111: 'Questo è il',
  publicprojectspanel183: 'Impossibile clonare il progetto',
  publicprojectspanel186: 'Impossibile clonare il progetto',
  publicprojectspanel210: 'Caricamento progetti pubblici in corso...',
  publicprojectspanel222: 'Progetti pubblici',
  publicprojectspanel227: 'Unisciti con il codice',
  publicprojectspanel234: 'Aggiorna',
  publicprojectspanel253: 'Cerca progetti per nome, descrizione o proprietario...',
  publicprojectspanel266: 'Nessun progetto pubblico',
  publicprojectspanel270: 'Prova a modificare i termini di ricerca.',
  publicprojectspanel271: 'Al momento non sono disponibili progetti pubblici.',
  publicprojectspanel276: 'Cancella ricerca',
  publicprojectspanel296: 'Pubblico',
  publicprojectspanel316: 'Nessuna descrizione fornita.',
  publicprojectspanel338: 'Il tuo progetto',
  publicprojectspanel342: 'Questo è il tuo progetto. Utilizza la scheda Progetti per duplicarlo.',
  publicprojectspanel346: 'Progetto clone',
  publicprojectspanel366: 'Progetti totali',
  publicprojectspanel372: 'Accettazione dei membri',
  publicprojectspanel378: 'Mostrando',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel411: 'Nome del progetto *',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: 'Inserisci il nome del progetto',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel426: 'Descrizione',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel433: 'Inserisci la descrizione del progetto',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: 'Progetto pubblico',
  publicprojectspanel452: 'I progetti pubblici sono visibili a tutti gli utenti e possono essere scoperti nella galleria dei progetti.',
  publicprojectspanel455: '💡 Nota: i progetti privati potrebbero richiedere funzionalità premium.',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel463: 'Progetto originale:',
  publicprojectspanel474: 'Cancellare',
  publicprojectspanel481: 'Progetto clone',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel31: 'Le password non corrispondono',
  registerpanel54: 'Registrazione fallita',
  registerpanel57: 'Registrazione avvenuta con successo! Ora puoi effettuare l\'accesso.',
  registerpanel75: 'Si è verificato un errore',
  registerpanel90: 'Registro',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel115: 'Nome',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel123: 'Il tuo nome completo',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel131: 'E-Mail',
  registerpanel139: 'your.email@example.com',
  registerpanel147: 'password',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel154: 'Almeno 8 caratteri',
  registerpanel161: 'Inserisci la password',
  registerpanel162: 'Debole',
  registerpanel163: 'Medio',
  registerpanel164: 'Stark',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel169: 'Conferma password',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel176: 'Ripeti la password',
  registerpanel188: 'La registrazione è in corso...',
  registerpanel198: 'Hai già un account? Accedi',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel104: 'Impossibile caricare le lingue:',
  schematranslationpanel133: 'Impossibile caricare la struttura dello schema:',
  schematranslationpanel281: 'Seleziona almeno una lingua',
  schematranslationpanel289: 'Non autenticato',
  schematranslationpanel303: 'Impossibile esportare le traduzioni',
  schematranslationpanel317: 'Traduzioni esportate con successo',
  schematranslationpanel319: 'Errore sconosciuto',
  schematranslationpanel334: 'Seleziona un file e almeno una lingua',
  schematranslationpanel342: 'Non autenticato',
  schematranslationpanel364: 'Impossibile importare le traduzioni',
  schematranslationpanel377: 'Impossibile importare:',
  schematranslationpanel385: 'Nessun progetto selezionato',
  schematranslationpanel449: 'Seleziona almeno una lingua di destinazione',
  schematranslationpanel459: 'Non autenticato',
  schematranslationpanel481: 'Traduzione automatica fallita:',
  schematranslationpanel505: 'Traduzione fallita',
  schematranslationpanel640: 'Tavolo',
  schematranslationpanel648: 'Campo',
  schematranslationpanel662: 'Seleziona un elemento da tradurre',
  schematranslationpanel663: 'Scegli una tabella o un campo dall\'albero dello schema per gestirne le traduzioni',
  schematranslationpanel682: 'Gestisci le traduzioni per questo {itemInfo.type.toLowerCase()}',
  schematranslationpanel688: 'Salvataggio automatico...',
  schematranslationpanel701: '>Nessuna traduzione trovata per',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel702: 'Inserisci le traduzioni qui sotto per creare nuove voci. Verranno salvate automaticamente dopo 1 secondo di inattività.',
  schematranslationpanel743: 'Gestore di traduzione degli schemi',
  schematranslationpanel746: 'Traduci i nomi delle tabelle e dei campi del database per l\'internazionalizzazione',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: 'Esportare',
  schematranslationpanel762: 'Importare',
  schematranslationpanel771: 'Traduzione automatica',
  schematranslationpanel791: 'Schema del database',
  schematranslationpanel802: 'Espandi tutto',
  schematranslationpanel812: 'Comprimi tutto',
  schematranslationpanel818: 'Seleziona tabelle e campi da tradurre',
  schematranslationpanel820: 'Progetto: ',
  schematranslationpanel827: 'Seleziona prima un progetto',
  schematranslationpanel830: 'Caricamento schema in corso...',
  schematranslationpanel834: 'Nessuna tabella di schema trovata',
  schematranslationpanel835: 'Questo progetto non ha dati di schema da tradurre',
  schematranslationpanel908: 'Esportare le traduzioni in Excel',
  schematranslationpanel922: 'Esporta per {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel923: 'Seleziona le lingue da includere nell\'esportazione Excel. L\'esportazione conterrà tutte le tabelle e i campi dei database collegati.',
  schematranslationpanel931: 'Seleziona le lingue *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel938: 'Seleziona le lingue da esportare',
  schematranslationpanel950: 'Cancellare',
  schematranslationpanel957: 'Esporta in Excel',
  schematranslationpanel969: 'Importa traduzioni da Excel',
  schematranslationpanel986: 'Importa per {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel987: 'Carica un file Excel con le traduzioni. Seleziona le lingue da importare.',
  schematranslationpanel995: 'Carica file Excel *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1006: 'Scegli file Excel',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1015: 'Seleziona le lingue da importare *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: 'Seleziona le lingue da importare',
  schematranslationpanel1034: 'Cancellare',
  schematranslationpanel1044: 'Importa traduzioni',
  schematranslationpanel1056: 'Traduzione automatica con Google Translate',
  schematranslationpanel1074: 'Traduzione automatica',
  schematranslationpanel1078: 'Tutte le tabelle e i campi nella lingua di origine verranno tradotti automaticamente.',
  schematranslationpanel1079: 'Selezionare la lingua di origine (deve essere già compilata) e le lingue di destinazione per la traduzione.',
  schematranslationpanel1090: 'tradurreTutto',
  schematranslationpanel1103: '🚀 Traduci tutte le tabelle e i campi',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1113: 'Lingua di origine *',
  schematranslationpanel1139: 'Lingue di destinazione *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: 'Seleziona le lingue di destinazione',
  schematranslationpanel1195: 'Cancellare',
  schematranslationpanel1205: 'Traduci ora',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel48: 'Impossibile caricare le impostazioni:',
  systemsettingspanel67: 'Impostazioni aggiornate con successo!',
  systemsettingspanel69: 'Impossibile aggiornare le impostazioni:',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel86: '⚙️ Impostazioni di sistema',
  systemsettingspanel89: 'Configurare le impostazioni di sistema globali per Scoriet',
  systemsettingspanel99: '🌍 API di Google Traduttore',
  systemsettingspanel102: 'Configura la chiave API globale di Google Translate per gli utenti del piano Business',
  systemsettingspanel107: 'Chiave API globale',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: 'Inserisci la chiave API di Google Translate...',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel132: '💰 Prezzi degli abbonamenti',
  systemsettingspanel135: 'Imposta i prezzi degli abbonamenti mensili per ogni livello del piano',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel148: 'Inserisci il prezzo Premium',
  systemsettingspanel149: 'Il prezzo deve essere positivo',
  systemsettingspanel157: 'Dollaro statunitense',
  systemsettingspanel180: 'Inserisci il prezzo Business',
  systemsettingspanel181: 'Il prezzo deve essere positivo',
  systemsettingspanel189: 'Dollaro statunitense',
  systemsettingspanel212: 'Inserisci il prezzo minimo per il Patron',
  systemsettingspanel213: 'Il prezzo deve essere positivo',
  systemsettingspanel221: 'Dollaro statunitense',
  systemsettingspanel242: 'Reset',
  systemsettingspanel251: 'Salva impostazioni',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel105: 'Non autenticato',
  teammanagementpanel143: 'Non autenticato',
  teammanagementpanel155: 'Impossibile caricare i team',
  teammanagementpanel174: 'Errore',
  teammanagementpanel175: 'Impossibile caricare i team',
  teammanagementpanel200: 'Elimina squadra',
  teammanagementpanel208: 'Non autenticato',
  teammanagementpanel212: 'ELIMINARE',
  teammanagementpanel221: 'Impossibile eliminare il team',
  teammanagementpanel226: 'Successo',
  teammanagementpanel227: 'Team eliminato con successo',
  teammanagementpanel234: 'teamChanged',
  teammanagementpanel239: 'Errore',
  teammanagementpanel240: 'Impossibile eliminare il team',
  teammanagementpanel258: 'Successo',
  teammanagementpanel259: 'Team creato con successo',
  teammanagementpanel264: 'teamChanged',
  teammanagementpanel277: 'Nuova squadra',
  teammanagementpanel291: 'Cerca squadre qui...',
  teammanagementpanel316: 'Sconosciuto',
  teammanagementpanel334: 'Inattivo',
  teammanagementpanel361: 'Nessun progetto',
  teammanagementpanel368: 'Questo è il',
  teammanagementpanel386: 'Gestisci i membri',
  teammanagementpanel394: 'Modifica squadra',
  teammanagementpanel400: 'Elimina squadra',
  teammanagementpanel416: 'Gestione del team',

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: 'Crea, gestisci e organizza i tuoi team. Assegna i membri del team e controlla le autorizzazioni di accesso.',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: 'Nessuna squadra trovata',
  teammanagementpanel451: 'Nome della squadra',
  teammanagementpanel458: 'Proprietario',
  teammanagementpanel465: 'Membri',
  teammanagementpanel471: 'Stato',
  teammanagementpanel478: 'Progetti',
  teammanagementpanel485: 'Creato',
  teammanagementpanel491: 'Azioni',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old97: 'Nessun token di autenticazione trovato',
  teamspanel_old147: 'Si è verificato un errore',
  teamspanel_old192: 'Impossibile accettare l\'invito',
  teamspanel_old216: 'Impossibile rifiutare l\'invito',
  teamspanel_old225: 'Caricamento squadre in corso...',
  teamspanel_old236: 'Errore durante il caricamento dei team',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old241: 'Riprova',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old263: 'Crea squadra',
  teamspanel_old270: 'Squadre di proprietà',
  teamspanel_old271: 'Membro di',
  teamspanel_old272: 'Inviti',
  teamspanel_old297: 'Nessuna squadra ancora',
  teamspanel_old298: 'Crea il tuo primo team per iniziare a collaborare',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old316: 'Proprietario',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old360: 'Non membro di nessuna squadra',
  teamspanel_old361: 'Qui vedrai i team a cui sei invitato a partecipare',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old373: 'Membro',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old415: 'Nessun invito in sospeso',
  teamspanel_old416: 'Gli inviti alla squadra appariranno qui',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel91: 'Non autenticato',
  teamspanel128: 'Errore durante il caricamento dei dati',
  teamspanel172: 'Errore durante il caricamento dei team di progetto',
  teamspanel182: 'Non autenticato',
  teamspanel193: 'Impossibile caricare i progetti',
  teamspanel199: 'Errore durante il caricamento dei progetti',
  teamspanel227: 'Non autenticato',
  teamspanel238: 'Impossibile caricare i team',
  teamspanel255: 'Errore durante il caricamento dei team',
  teamspanel270: 'Non autenticato',
  teamspanel295: 'Impossibile assegnare i team',
  teamspanel347: 'teamChanged',
  teamspanel349: ' team assegnati con successo ai progetti',
  teamspanel350: 'Errore durante l\'assegnazione dei team',
  teamspanel364: 'Non autenticato',
  teamspanel368: 'ELIMINARE',
  teamspanel420: 'teamChanged',
  teamspanel425: 'Errore durante la rimozione del team',
  teamspanel430: 'rimosso dal progetto con successo',
  teamspanel451: 'Caricamento squadre in corso...',
  teamspanel457: 'Team di progetto',
  teamspanel487: 'Cerca progetti o team...',

  // resources/js/Components/Panels/TeamsPanel.tsx
  teamspanel494: 'Nessun progetto trovato',
  teamspanel527: 'Nessun team disponibile per questo progetto',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel544: 'Sconosciuto',
  teamspanel552: 'Non assegnato',
  teamspanel557: 'Assegnato',
  teamspanel563: 'Rimuovi dal progetto',
  teamspanel608: 'Cancella selezione',
  teamspanel619: 'Assegnare i team ai progetti',
  teamspanel630: 'Nessuna squadra trovata',
  teamspanel675: 'Rimuovi dal progetto',
  teamspanel697: 'Nome della squadra',
  teamspanel698: 'Descrizione',
  teamspanel701: 'Proprietario',
  teamspanel705: 'Sconosciuto',
  teamspanel711: 'Membri',
  teamspanel721: 'Stato',
  teamspanel726: 'Inattivo',
  teamspanel732: 'Creato',
  teamspanel733: 'Questo è il',
  teamspanel745: 'Cancella selezione',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: 'Impossibile caricare gli schemi del DB',
  templatedbschemadependenciespanel123: 'Dipendenza dello schema DB aggiunta correttamente',
  templatedbschemadependenciespanel128: 'Impossibile aggiungere la dipendenza',
  templatedbschemadependenciespanel132: 'Impossibile aggiungere la dipendenza',
  templatedbschemadependenciespanel144: 'Aggiungi dipendenza dallo schema DB',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel158: 'Schema del database *',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: 'Seleziona uno schema di database',
  templatedbschemadependenciespanel176: 'Seleziona uno schema di database',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel203: 'Dipendenza richiesta',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: 'Inserisci un alias per questo schema DB nel modello',
  templatedbschemadependenciespanel242: 'Cancellare',
  templatedbschemadependenciespanel248: 'Aggiungi dipendenza',
  templatedbschemadependenciespanel324: 'Impossibile caricare i modelli',
  templatedbschemadependenciespanel346: 'Impossibile caricare le dipendenze del modello',
  templatedbschemadependenciespanel350: 'Impossibile caricare le dipendenze del modello',
  templatedbschemadependenciespanel364: 'ELIMINARE',
  templatedbschemadependenciespanel367: 'Dipendenza rimossa con successo',
  templatedbschemadependenciespanel372: 'Impossibile rimuovere la dipendenza',
  templatedbschemadependenciespanel376: 'Impossibile rimuovere la dipendenza',
  templatedbschemadependenciespanel390: 'Inattivo',
  templatedbschemadependenciespanel404: 'Solo visualizzazione',
  templatedbschemadependenciespanel405: 'Puoi modificare solo i tuoi modelli',
  templatedbschemadependenciespanel415: 'Maneggio',
  templatedbschemadependenciespanel440: 'Necessario',
  templatedbschemadependenciespanel442: 'Opzionale',
  templatedbschemadependenciespanel457: 'Modello di sola lettura',
  templatedbschemadependenciespanel469: 'Rimuovi dipendenza',
  templatedbschemadependenciespanel483: 'Modello - Dipendenze dello schema DB',
  templatedbschemadependenciespanel496: 'Modelli',
  templatedbschemadependenciespanel504: 'Tutto',
  templatedbschemadependenciespanel505: 'Sistema',
  templatedbschemadependenciespanel506: 'Pubblico',
  templatedbschemadependenciespanel507: 'Progetto',
  templatedbschemadependenciespanel517: 'Cerca modelli...',
  templatedbschemadependenciespanel527: 'Nessun modello disponibile',
  templatedbschemadependenciespanel536: 'Modello',
  templatedbschemadependenciespanel541: 'Azioni',
  templatedbschemadependenciespanel559: 'Aggiungere',
  templatedbschemadependenciespanel570: 'Nessuna dipendenza dallo schema DB',
  templatedbschemadependenciespanel578: 'Schema del database',
  templatedbschemadependenciespanel583: 'Stato',
  templatedbschemadependenciespanel588: 'Azioni',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel595: 'Seleziona un modello per visualizzare le dipendenze dello schema DB',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager108: 'Creare',
  templatefilemanager116: 'File eliminato con successo',
  templatefilemanager120: 'Errore durante l\'eliminazione del file',
  templatefilemanager131: 'Errore durante lo spostamento del file',
  templatefilemanager137: 'Sei sicuro di voler eliminare questo file?',
  templatefilemanager138: 'Eliminare il file?',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager141: 'E',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: 'NO',
  templatefilemanager175: 'Su',
  templatefilemanager185: 'Verso il basso',
  templatefilemanager195: 'Modificare',
  templatefilemanager205: 'Eliminare',
  templatefilemanager216: 'Gestisci i file modello',
  templatefilemanager220: 'Nuovo file',
  templatefilemanager227: 'Vicino',
  templatefilemanager241: 'Nessun file disponibile',
  templatefilemanager243: 'Nome',
  templatefilemanager244: 'Tipo',
  templatefilemanager245: 'Serie',
  templatefilemanager246: 'Misurare',
  templatefilemanager247: 'Azioni',
  templatefilemanager252: 'Crea un nuovo file',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager265: 'Nome del file *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager271: 'Inserisci il nome del file!',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: 'ad esempio, Model.php, component.tsx',
  templatefilemanager288: 'Tipo *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager294: 'Seleziona il tipo!',
  templatefilemanager301: 'Seleziona il tipo',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager335: 'Contenuto del file *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager341: 'Inserisci il contenuto del file!',
  templatefilemanager347: 'Inserisci qui il codice del modello...',
  templatefilemanager361: 'Cancellare',
  templatefilemanager368: 'Creare',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: 'Tutto',
  templatemanagementpanel113: 'Banca dati',
  templatemanagementpanel115: 'File statico',
  templatemanagementpanel116: 'Directory statica come archivio ZIP',
  templatemanagementpanel117: 'File specifico del progetto con segnaposto',
  templatemanagementpanel118: 'File tabella DB',
  templatemanagementpanel119: 'File specifico del progetto con supporto linguistico',
  templatemanagementpanel120: 'File per tabella di database con supporto linguistico',
  templatemanagementpanel135: 'Gestione dei modelli',
  templatemanagementpanel150: 'Errore durante il caricamento dei modelli. Effettua prima l\'accesso.',
  templatemanagementpanel202: 'Errore durante il caricamento dei dettagli del modello',
  templatemanagementpanel211: 'Modello eliminato definitivamente',
  templatemanagementpanel216: 'Errore durante l\'eliminazione definitiva del modello',
  templatemanagementpanel230: 'Errore durante la modifica dello stato del modello',
  templatemanagementpanel286: 'Modello clonato con successo',
  templatemanagementpanel291: 'Errore durante la clonazione del modello',
  templatemanagementpanel335: 'Creare',
  templatemanagementpanel340: 'Salva',
  templatemanagementpanel359: 'Modello salvato correttamente',
  templatemanagementpanel395: 'Errore durante il salvataggio del modello',
  templatemanagementpanel410: 'Modello importato con successo',
  templatemanagementpanel413: 'Errore durante l\'importazione del modello',
  templatemanagementpanel419: 'Esiste già un modello con questo nome. Vuoi sovrascriverlo?',
  templatemanagementpanel420: 'Il modello esiste già',
  templatemanagementpanel428: 'Modello importato e sovrascritto correttamente',
  templatemanagementpanel433: 'Errore durante la sovrascrittura del modello',
  templatemanagementpanel436: 'E',
  templatemanagementpanel437: 'Cancellare',
  templatemanagementpanel441: 'Errore durante l\'importazione del modello',
  templatemanagementpanel464: 'Modello esportato correttamente',
  templatemanagementpanel467: 'Errore durante l\'esportazione del modello',
  templatemanagementpanel485: 'Nessun modello selezionato',
  templatemanagementpanel517: 'Errore durante l\'eliminazione del file',
  templatemanagementpanel521: 'Errore durante l\'eliminazione del file:',
  templatemanagementpanel527: 'Nessun modello selezionato',
  templatemanagementpanel595: 'aggiunto',
  templatemanagementpanel597: 'Errore durante il salvataggio del file',
  templatemanagementpanel601: 'Errore durante il salvataggio del file:',
  templatemanagementpanel613: 'Gestione dei modelli',
  templatemanagementpanel618: 'Nuovo modello',
  templatemanagementpanel624: 'Importare',
  templatemanagementpanel646: 'Cerca modelli...',
  templatemanagementpanel653: 'Categoria',
  templatemanagementpanel667: 'Nessun modello trovato',
  templatemanagementpanel669: 'Da {first} a {last} di {totalRecords} modelli',
  templatemanagementpanel672: 'Nome',
  templatemanagementpanel675: 'Categoria',
  templatemanagementpanel684: 'Lingua',
  templatemanagementpanel693: 'Etichette',
  templatemanagementpanel706: 'File',
  templatemanagementpanel711: 'Stato',
  templatemanagementpanel716: 'Attivo',
  templatemanagementpanel721: 'Tipo',
  templatemanagementpanel736: 'Privato',
  templatemanagementpanel743: 'Creato',
  templatemanagementpanel744: 'Questo è il',
  templatemanagementpanel747: 'Azioni',
  templatemanagementpanel757: 'Spettacolo',
  templatemanagementpanel764: 'Modificare',
  templatemanagementpanel771: 'Esportare',
  templatemanagementpanel777: 'Clone',
  templatemanagementpanel785: 'Attivare',
  templatemanagementpanel791: 'Vuoi eliminare definitivamente il modello? Questa azione non può essere annullata!',
  templatemanagementpanel795: 'Elimina definitivamente',
  templatemanagementpanel859: 'Descrizione:',
  templatemanagementpanel862: 'Categoria:',
  templatemanagementpanel865: 'Lingua:',
  templatemanagementpanel868: 'Tag:',
  templatemanagementpanel876: 'File ({viewingTemplate.files?.length || 0}):',
  templatemanagementpanel893: 'Nessun file disponibile',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel933: 'Nuovo nome del modello',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: 'Inserisci il nome del modello...',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel944: '🔍 Controlla la disponibilità...',
  templatemanagementpanel949: '❌ Il nome non può essere assegnato due volte',
  templatemanagementpanel954: '✅ Il nome è disponibile',
  templatemanagementpanel961: 'visibilità',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel970: 'Pubblico (visibile a tutti)',
  templatemanagementpanel971: 'Privato (solo per te)',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel976: 'Quelle:',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel977: 'Tipo:',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal15: 'Promessa',
  templatemodal16: 'Promessa',
  templatemodal147: 'Crea un nuovo modello',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal159: 'Nome *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: 'Inserisci il nome del modello!',
  templatemodal169: 'Il nome del modello deve contenere solo lettere minuscole',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal195: 'Descrizione',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal206: 'Descrizione del modello (facoltativa)',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal186: 'Modifica modello',
  templatemodal199: 'Nome *',
  templatemodal208: 'I nomi dei modelli vengono poi utilizzati per gli URL (nome utente/nome_modello)',
  templatemodal228: 'I nomi dei modelli possono contenere solo lettere minuscole, numeri e caratteri di sottolineatura (ad esempio, my_template_123).',
  templatemodal281: 'Seleziona o inserisci una categoria (ad esempio, Backend, API, Web)',
  templatemodal293: 'Sono ammesse tutte le categorie - suggerimenti:',
  templatemodal322: 'Seleziona o inserisci un linguaggio (ad esempio, PHP, JavaScript, Python)',
  templatemodal334: 'Qualsiasi lingua consentita - suggerimenti:',
  templatemodal366: 'Visibilità *',
  templatemodal399: 'Modello di sistema',
  templatemodal438: 'Aggiungi file',
  templatemodal444: 'Salva il modello; solo allora potrai aggiungere file al modello.',
  templatemodal450: 'Nota: i file vengono assegnati immediatamente al modello. Le modifiche ai dettagli del modello (nome, descrizione, ecc.) devono essere salvate separatamente.',
  templatemodal513: 'Nessun file aggiunto. Clicca su t.templatemodal449 per iniziare.',
  templatemodal521: 'Variabili personalizzate',
  templatemodal535: 'Aggiungi variabile',
  templatemodal541: 'Salvare il modello; solo allora sarà possibile aggiungere variabili personalizzate al modello.',
  templatemodal547: 'Nota: le variabili personalizzate consentono di definire segnaposto come {\'{copyright}\'} o {\'{company_name}\'} che non esistono nel database. Questi possono quindi essere compilati dall\'utente per ogni progetto e lingua.',
  templatemodal580: 'Necessario',
  templatemodal584: 'Opzionale',
  templatemodal625: 'Nessuna variabile personalizzata definita. Fai clic su "Aggiungi variabile" per iniziare.',
  templatemodal646: 'Il modello è attivo',
  templatemodal655: 'Cancellare',
  templatemodal667: 'Salvato ✓Categoria *',
  templatemodal480: 'Cartello',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal220: 'Categoria *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal226: 'Seleziona una categoria!',
  templatemodal235: 'Tutto',
  templatemodal236: 'Seleziona la categoria',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: 'Lingua *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: 'Inserisci la lingua!',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal259: 'ad esempio, PHP, JavaScript, TypeScript',
  templatemodal276: 'Etichette',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: 'Aggiungi tag (premi Invio)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal301: 'Visibilità *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: 'Seleziona la visibilità!',
  templatemodal317: 'Pubblico',
  templatemodal318: 'Privato',
  templatemodal320: 'Seleziona visibilità',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal333: 'Modello di sistema',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: 'File modello',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal379: 'Si prega di salvare il modello, solo allora potrai aggiungere file al modello',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal395: 'Nome',
  templatemodal396: 'Tipo',
  templatemodal397: 'Misurare',
  templatemodal398: 'Azioni',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal448: 'Nessun file aggiunto. Fai clic su Aggiungi file per iniziare.',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal449: 'Aggiungi file',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal469: 'Il modello è attivo',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal491: 'Salva',
  templatemodal502: 'Nessun cambiamento',
  templatemodal503: 'Creare',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal65: 'Non autenticato',
  sqlimportmodal76: 'Impossibile caricare gli schemi',
  sqlimportmodal87: 'Errore durante il caricamento degli schemi',
  sqlimportmodal106: 'Nessun progetto selezionato. Seleziona prima un progetto.',
  sqlimportmodal129: 'È richiesto lo script SQL',
  sqlimportmodal134: 'Seleziona uno schema di destinazione',
  sqlimportmodal139: 'Nessun progetto selezionato',
  sqlimportmodal144: 'Nessuno schema selezionato',
  sqlimportmodal154: 'Autenticazione richiesta',
  sqlimportmodal177: 'Impossibile importare SQL',
  sqlimportmodal203: 'Importazione non riuscita',
  sqlimportmodal211: '📥 Importa schema SQL',
  sqlimportmodal234: 'Importa lo schema del database dallo script SQL',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal277: 'Schema di destinazione',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal286: 'Caricamento schemi in corso...',
  sqlimportmodal301: 'Nessuno schema modificabile nel progetto',
  sqlimportmodal313: 'Breve descrizione...',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal322: 'Script SQL',
  sqlimportmodal328: 'Incolla qui le tue istruzioni SQL CREATE TABLE...',
  sqlimportmodal332: 'Supporta le istruzioni e i vincoli MySQL CREATE TABLE, ALTER TABLE',
  sqlimportmodal338: 'Carica file SQL',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal353: 'File caricato con successo!',
  sqlimportmodal368: 'Fare clic per selezionare il file SQL',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal369: 'Supporta i file .sql e .txt',
  sqlimportmodal405: 'Cancellare',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: '📥 Importa schema',

  // resources/js\Components\TopBar.tsx
  topbar57: 'applicazioniAggiornate',
  topbar60: 'applicazioniAggiornate',
  topbar71: 'Scoriet',
  topbar75: 'Generatore di codice aziendale',
  topbar98: 'Seleziona progetto',
  topbar102: 'Nessun progetto trovato',
  topbar122: 'openApplicationsModal',

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: 'strumentoSans',
  fontprovider29: 'strumentoSans',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal19: 'Attuale',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal29: '💡 Vuoi creare una nuova versione?',
  versionconfirmationmodal51:  'Loro spiegano ',
  versionconfirmationmodal56:  '⚠️ ATTENZIONE: Tabella ',
  versionconfirmationmodal56a: 'verrà eliminato!',
  versionconfirmationmodal90:  'Mezzogiorno' ,
  versionconfirmationmodal90a: ' continuare a lavorare',
  versionconfirmationmodal53: 'Vuoi creare una nuova versione per questo?',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal67: 'Sì, crea una nuova versione',
  versionconfirmationmodal83: 'NO',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: 'Cambia direttamente senza una nuova versione',
  versionconfirmationmodal92: 'ℹ️ Puoi sempre creare una nuova versione in un secondo momento cliccando su "Salva come nuova versione".',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal93: 'Salva come nuova versione',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: 'Cancellare',

  // resources/js\contexts\ProjectContext.tsx
  projectcontext196: 'useProject deve essere utilizzato all\'interno di un ProjectProvider',

  // resources/js\contexts\ToastContext.tsx
  toastcontext19: 'Successo',
  toastcontext28: 'Errore',
  toastcontext37: 'Informazioni',
  toastcontext46: 'avvertimento',
  toastcontext63: 'useToast deve essere utilizzato all\'interno di un ToastProvider',

  // resources/js\i18n\index.ts
  indexts26: 'archiviazione locale',
  indexts28: 'archiviazione locale',

  // resources/js\lib\api.ts
  apits104: 'Autenticazione richiesta - effettua il login',
  apits119: 'Autenticazione scaduta: accedi nuovamente',
  apits152: 'Tutto',
  apits201: 'Errore sconosciuto',
  apits219: 'Errore sconosciuto',
  apits235: 'Errore sconosciuto',
  apits251: 'Errore sconosciuto',
  apits268: 'Errore sconosciuto',
  apits286: 'Errore sconosciuto',
  apits314: 'Errore sconosciuto',
  apits329: 'Errore sconosciuto',
  apits350: 'Errore sconosciuto',
  apits518: 'Impossibile recuperare i prezzi:',
  apits527: 'euro',
  apits553: 'euro',

  // resources/js\pages\CMSPage.tsx
  cmspage45: 'lingua modificata',
  cmspage194: 'BETA',
  cmspage208: 'Casa',
  cmspage352: 'La scoria',

  // resources/js/pages/CMSPage.tsx
  cmspage353: 'Il futuro della generazione di codice. Creato dagli sviluppatori, per gli sviluppatori.',

  // resources/js\pages\CMSPage.tsx
  cmspage387: 'impronta',
  cmspage412: 'Scegli il tuo piano',
  cmspage422: 'Piano attuale',
  cmspage423: 'Gratuito',
  cmspage426: 'Piano gratuito',
  cmspage435: 'Premio',
  cmspage440: 'Ideale per sviluppatori professionisti',
  cmspage462: 'Scegli Premium',
  cmspage473: 'I PIÙ POPOLARI',
  cmspage474: 'Attività commerciale',
  cmspage479: 'Ideale per team e agenzie',
  cmspage501: 'Scegli Business',
  cmspage520: 'Sostieni la comunità',
  cmspage542: 'Diventa Patrono',
  cmspage553: 'Puoi modificare o annullare il tuo piano in qualsiasi momento. Tutti i piani includono una garanzia di rimborso di 30 giorni.',

  // resources/js\pages\EmailVerification.tsx
  emailverification13: 'Conferma email - Scoriet',

  // resources/js\pages\Index.tsx
  index133: 'Caricamento pannello...',
  index258: 'Team di amministrazione',

  // resources/js/pages/Index.tsx
  index265: 'carta personalizzata',

  // resources/js\pages\Index.tsx
  index293: 'Gestione dei modelli',
  index333: 'Gestione del database',
  index378: 'Generatore manuale di debug',
  index400: 'Benvenuto',
  index413: 'Progettista di database',
  index426: 'Modelli',
  index439: 'Esploratore di database',
  index476: 'Squadre',
  index495: 'Gestione del progetto',
  index508: 'Le mie applicazioni',
  index521: 'Progetti pubblici',
  index534: 'Proteggere',
  index539: 'La rimozione di questa scheda verrà rifiutata',
  index540: 'Questo viene fatto nel callback onLayoutChange',
  index542: 'Prova Alt+P per aggiornare questa scheda',
  index543: 'Prova Alt+M per ingrandire questa scheda',
  index544: 'Prova Alt+L per registrare il layout corrente',
  index545: 'Prova Alt+C per copiare il layout negli appunti',
  index556: 'Login',
  index590: 'Gestione dei modelli',
  index625: 'Gestione del database',
  index662: 'Team di amministrazione',
  index676: 'Modello - Dipendenze dello schema DB',
  index689: '🔧 Generatore di manuali di debug',
  index711: 'Generazione di codice',
  index724: 'Gestione del linguaggio',
  index737: 'Traduzione dello schema',
  index750: 'Impostazioni di sistema',
  index763: 'Impostazioni del progetto',
  index776: 'Amministratore CMS',
  index792: 'Autenticazione modale',
  index796: '📋 Informazioni',
  index797: 'L\'autenticazione è ora gestita tramite finestre modali.',
  index798: 'Utilizzare il menu di navigazione per accedere ad Accedi, Registrati o Profilo.',
  index835: '🔧 Generatore di manuali di debug',
  index861: 'Progetto',
  index917: '⚠️ Scheda sconosciuta: {id}',
  index918: 'Questo ID scheda non è definito nella funzione loadTab.',
  index919: 'Schede disponibili: t2, t3, t5, protect1, login, register, profile, forgot',
  index921: 'Controlla la funzione loadTab!',
  index1415: 'Chiudi tutte le schede',
  index1621: 'openApplicationsModalInPanel',
  index1636: 'openApplicationsModal',
  index1639: 'openApplicationsModal',

  // resources/js/pages/Index.tsx
  index1759: 'Vuoi cancellare il layout salvato e ripristinare le impostazioni predefinite?',

  // resources/js\pages\Index.tsx
  index1771: 'Il layout è stato copiato negli appunti!',
  index1784: 'Il layout è stato copiato negli appunti!',
  index1788: 'Per la copia manuale, consultare la console.',
  index1851: 'INGRESSO',
  index1856: 'La rimozione di questa scheda è stata rifiutata!',
  index1928: 'Scoriet - Generatore di codice aziendale',
  index2009: 'Caricamento...',
  index2020: 'Caricamento...',
  index2058: 'Registrazione avvenuta con successo',
  index2070: 'Caricamento...',

  // resources/js/pages/LandingPage.tsx
  statusLink: 'Stato',

  // resources/js\pages\LandingPage.tsx
  landingpage69: 'euro',
  landingpage110: 'Errore durante il caricamento dei dati utente:',

  // resources/js/pages/LandingPage.tsx
  sqlParserTitle: 'Parser SQL',
  sqlParserDesc: 'Analisi intelligente degli schemi di database MySQL con supporto per relazioni complesse e vincoli.',
  templateSystemTitle: 'Sistema di Template',
  templateSystemDesc: 'Motore di template potente con esecuzione JavaScript per la generazione dinamica di codice.',
  multiLanguageTitle: 'Supporto Multi-Linguaggio',
  multiLanguageDesc: 'Genera codice per PHP, JavaScript, TypeScript, Python e altro con template personalizzabili.',
  modernInterfaceTitle: 'Interfaccia Moderna',
  modernInterfaceDesc: 'Interfaccia MDI intuitiva basata su dock con impilamento di schede e pannelli flottanti.',

  // resources/js\pages\LandingPage.tsx
  landingpage151: ' Per sempre',
  landingpage152: 'Perfetto per progetti personali',
  landingpage154: 'Fino a 3 progetti',
  landingpage155: 'Modelli di base',
  landingpage156: 'Analisi dello schema SQL',
  landingpage157: 'Supporto della comunità',
  landingpage158: 'Finanziato dalla pubblicità',

  // resources/js/pages/LandingPage.tsx
  goStartFree: 'Inizia gratis',
  premiumLabel: 'Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage168: 'Ideale per sviluppatori professionisti',
  landingpage170: 'Progetti illimitati',
  landingpage171: 'Modelli avanzati',
  landingpage172: 'Creazione di modelli personalizzati',
  landingpage173: 'Supporto prioritario',
  landingpage174: 'Funzionalità SQL avanzate',
  landingpage175: 'Collaborazione di squadra',

  // resources/js/pages/LandingPage.tsx
  goPremium: 'Vai Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage182: 'Attività commerciale',
  landingpage186: 'Ideale per team e agenzie',
  landingpage188: 'Tutte le funzionalità Premium',
  landingpage189: 'Strumenti di collaborazione di squadra',
  landingpage190: 'Integrazione dell\'API di Google Translate',
  landingpage191: 'Analisi avanzate',
  landingpage192: 'Supporto prioritario con SLA',
  landingpage193: 'Opzioni di branding personalizzate',
  landingpage195: 'Vai Business',

  // resources/js/pages/LandingPage.tsx
  patronLabel: 'Patrono',

  // resources/js\pages\LandingPage.tsx
  landingpage203: 'Sostieni la comunità',
  landingpage205: 'Tutte le funzionalità aziendali',
  landingpage206: 'Accesso anticipato alle funzionalità',
  landingpage207: 'Sviluppo dell\'influenza',
  landingpage208: 'Accesso alla comunità Discord',
  landingpage209: 'Importo personalizzato (€5-50+)',

  // resources/js/pages/LandingPage.tsx
  becomePatron: 'Diventa Patrono',

  // resources/js\pages\LandingPage.tsx
  landingpage288: 'Scoriet - Generatore di codice aziendale',
  landingpage304: 'Scheda di benvenuto',
  landingpage307: 'apriHomeOnStart',
  landingpage311: 'Apri questa scheda all\'avvio dell\'app',

  // resources/js/pages/LandingPage.tsx
  landingpage316: 'Chiudi questa scheda per concentrarti sui tuoi progetti',

  // resources/js\pages\LandingPage.tsx
  landingpage336: 'BETA',

  // resources/js/pages/LandingPage.tsx
  login: 'Accedi',
  register: 'Registrati',
  profile: 'Profilo',
  changePlan: 'Cambia piano',
  logout: 'Esci',
  gotoApp: 'Vai all\'app',
  title: 'Generatore di Codice Enterprise',
  subtitle: 'Trasforma i tuoi schemi di database in codice pronto per la produzione con template intelligenti. Riduci il tempo di sviluppo dell\'80% con la generazione automatizzata di codice.',
  startFree: 'Inizia gratis',
  tryDemo: 'Prova demo',
  watchDemo: 'Guarda demo',
  featuresTitle: 'Funzionalità potenti per lo sviluppo moderno',
  pricingTitle: 'Scegli il tuo piano',
  pricingSubtitle: 'Inizia gratis, aggiorna quando sei pronto a scalare',

  // resources/js\pages\LandingPage.tsx
  landingpage479: 'I PIÙ POPOLARI',
  landingpage486: 'Patreon',
  landingpage514: 'Gratuito',

  // resources/js/pages/LandingPage.tsx
  ctaTitle: 'Pronto a moltiplicare per 10 la tua velocità di sviluppo?',
  ctaSubtitle: 'Unisciti a migliaia di sviluppatori che stanno già usando Scoriet per costruire software migliore più velocemente.',
  startFreeTrial: 'Inizia prova gratuita',
  tryDemoNow: 'Prova demo ora',
  contactSales: 'Contatta vendite',
  goToApp: 'A la aplicación',
  welcomeBack: 'Utente',
  
  // resources/js\pages\LandingPage.tsx
  landingpage573: 'Utente',

  // resources/js/pages/LandingPage.tsx
  currentPlan: 'Piano {t.freeLabel}',
  freeLabel: 'Gratuito',
  freeTier: 'Piano Gratuito',

  // resources/js\pages\LandingPage.tsx
  landingpage589: 'I PIÙ POPOLARI',
  landingpage594: 'Costume',
  registerFirst: 'Registrati e scegli il piano',

  // resources/js/pages/LandingPage.tsx
  upgradeTo: 'Aggiorna a',
  currentPlanButton: 'Piano Attuale',
  landingpage629: 'La scoria',
  landingpage630: 'Il futuro della generazione di codice. Creato dagli sviluppatori, per gli sviluppatori.',
  productLabel: 'Prodotto',
  featuresLink: 'Funzionalità',
  pricingLink: 'Prezzi',
  templatesLink: 'Template',
  examplesLink: 'Esempi',
  resourcesLabel: 'Risorse',
  documentationLink: 'Documentazione',
  apiReferenceLink: 'Riferimento API',
  tutorialsLink: 'Tutorial',
  downloadsLink: 'Download',
  supportLabel: 'Supporto',
  helpCenterLink: 'Centro assistenza',

  // resources/js\pages\LandingPage.tsx
  landingpage664: 'impronta',

  // resources/js/pages/LandingPage.tsx
  contactUsLink: 'Contattaci',
  communityLink: 'Comunità',
  allRightsReserved: '© 2026 Scoriet, tutti i diritti riservati',

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Termini di servizio',

  // resources/js\pages\LandingPage.tsx
  landingpage716: 'Scegli il tuo piano',
  landingpage726: 'Piano attuale',
  landingpage727: 'Gratuito',
  landingpage730: 'Piano gratuito',
  landingpage743: 'I PIÙ POPOLARI',
  landingpage748: 'Costume',
  landingpage764: 'Piano attuale',
  landingpage765: 'Gratuito',
  landingpage767: 'Gratuito',
  landingpage769: 'Gratuito',
  landingpage782: 'Puoi modificare o annullare il tuo piano in qualsiasi momento. Tutti i piani includono una garanzia di rimborso di 30 giorni.',
  landingpage801: 'Registrazione avvenuta con successo',
  landingpage762:  'Attualmente ti trovi su',
  landingpage762a: 'Esegui l\'upgrade per sbloccare più funzionalità e supportare il progetto!',
  landingpage814:  'Puoi modificare o annullare il tuo piano in qualsiasi momento. Tutti i piani includono una garanzia di rimborso di 30 giorni.',
  landingpage796:  'Scegli',
  landingpage802:  'Aggiornamento a',
  landingpage802a: ' - Prossimamente l\'integrazione dei pagamenti!',
  landingpage738:  'Il tuo browser non supporta l\'elemento video.',
  landingpage647:  ' - Prossimamente!',
  landingpage627:  '/mese',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse70: 'Invito non valido o scaduto',
  projectinvitationresponse77: 'Impossibile caricare l\'invito',
  projectinvitationresponse133: 'Si prega di compilare tutti i campi obbligatori',
  projectinvitationresponse138: 'Le password non corrispondono',
  projectinvitationresponse161: 'Registrazione avvenuta con successo! Controlla la tua email per verificare il tuo account.',
  projectinvitationresponse167: 'Registrazione fallita',
  projectinvitationresponse170: 'Errore durante la registrazione',
  projectinvitationresponse181: 'Caricamento invito in corso...',
  projectinvitationresponse192: '🚀 Le scorie',
  projectinvitationresponse193: 'Generatore di codice aziendale',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse223: 'Sei stato invitato a partecipare a un progetto, ma prima devi creare un account',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse233: 'Declino',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse235: 'Sei stato invitato a partecipare a un progetto su Scoriet',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse256: 'Invitato da:',
  projectinvitationresponse266: 'Ruolo:',
  projectinvitationresponse273: 'Titolare del progetto:',
  projectinvitationresponse283: 'Scade:',
  projectinvitationresponse292: 'Messaggio personale:',
  projectinvitationresponse307: '🚀 Crea un account e unisciti al progetto',
  projectinvitationresponse334: '✅ Accetta l\'invito',
  projectinvitationresponse348: '❌ Rifiuta invito',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse355: 'Se non sei interessato a partecipare al progetto, puoi rifiutare questo invito.',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse373: 'Benvenuti nel team!',
  projectinvitationresponse374: 'Invito rifiutato',
  projectinvitationresponse379: 'Ora puoi accedere al progetto e iniziare a collaborare con il tuo team.',
  projectinvitationresponse380: 'Il proprietario del progetto è stato informato della tua decisione.',
  projectinvitationresponse386: 'Vai all\'app Scoriet',
  projectinvitationresponse399: 'Questo è un messaggio automatico da Scoriet - Generatore di codice aziendale',
  projectinvitationresponse407: 'Crea il tuo account Scoriet',
  projectinvitationresponse417: 'Nome e cognome *',
  projectinvitationresponse428: 'Nome utente *',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse433: 'Johndoe',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse436: 'Solo lettere minuscole, numeri, trattini e caratteri di sottolineatura',
  projectinvitationresponse440: 'Indirizzo e-mail *',
  projectinvitationresponse449: 'Precompilato dall\'invito',
  projectinvitationresponse453: 'Parola d\'ordine *',
  projectinvitationresponse458: 'Inserisci la tua password',
  projectinvitationresponse466: 'Conferma password *',
  projectinvitationresponse471: 'Conferma la tua password',
  projectinvitationresponse480: 'Cancellare',
  projectinvitationresponse487: 'Creare un account',

  // resources/views\admin\pages\create.blade.php
  createblade60: 'Inserisci qui il contenuto della tua pagina. È supportato l\'HTML.',

  // resources/views\emails\project-invitation.blade.php
  projectinvitationblade116: 'Se hai domande',
  projectinvitationblade151: 'Declino',

  // resources/views\layouts\static.blade.php
  staticblade37: 'Aiuto',

  // resources/views\pages\help.blade.php
  helpblade3: 'Aiuto',
  helpblade8: 'Centro assistenza',
  helpblade13: 'Benvenuti al Centro assistenza Scoriet',
  helpblade16: 'Iniziare',
  helpblade18: 'Scopri come iniziare con Scoriet',
  helpblade21: 'Crea il tuo primo progetto',
  helpblade24: 'Fase 1',
  helpblade25: 'Fase 2',
  helpblade26: 'Fase 3',
  helpblade27: 'Fase 4',
  helpblade31: 'Caratteristiche',
  helpblade34: 'Caratteristica 1',
  helpblade35: 'Caratteristica 2',
  helpblade36: 'Caratteristica 3',
  helpblade37: 'Caratteristica 4',
  helpblade41: 'Supporto',
  helpblade43: 'Contatta il nostro team di supporto',

  // resources/views\pages\impressum.blade.php
  impressumblade3: 'impronta',
  impressumblade8: 'impronta',
  impressumblade14: 'Informazioni ai sensi del \' 5 TMG',
  impressumblade17: 'Nome dell\'azienda',
  impressumblade18: 'Indirizzo',
  impressumblade22: 'Informazioni sui contatti',
  impressumblade25: 'Consigliere delegato',
  impressumblade28: 'Registro delle Imprese',
  impressumblade31: 'Partita IVA n.',

  // routes\api.php
  api36: 'Nessuna versione dello schema trovata',
  api47: 'Creata tabella di prova con ID:',
  api85: 'Questo token di reimpostazione della password non è valido.',
  api126: 'Impossibile recuperare le informazioni sui prezzi',
  api180: 'Questo mostra come il modello dovrebbe essere elaborato correttamente',
  api181: 'Il ciclo non è stato chiuso correttamente e le variabili non sono state sostituite',
  api183: 'Il ciclo elabora correttamente tutti gli elementi',
  api184: 'Le variabili sono sostituite correttamente',
  api185: 'La sintassi è pulita e valida PHP',
  api194: 'Motore di template semplice - NO REGEX',
  api197: 'Nessuna costruzione annidata in una riga',
  api198: 'I loop sono chiusi in modo pulito',
  api199: 'Nessuna espressione regolare, solo semplici operazioni sulle stringhe',
  api202: 'Elaborazione riga per riga',
  api203: 'Sostituzione semplice delle variabili',
  api204: 'Codice manutenibile senza regex',
  api205: 'Escape sicuro di JavaScript',
  api300: 'I team eseguono il debug degli endpoint',
  api416: 'Lavori di prova sul percorso',
  api427: 'Tutti i progetti nel database',
  api452: 'Versione dello schema non trovata',
  api509: 'Debug non riuscito:',
  api528: 'Nessun vincolo trovato',
  api745: 'Nessuna versione trovata per questo schema',
  api761: 'Caricamento tabelle per schema_version_id: {$schemaVersion->id} (version_number: {$schemaVersion->version_number})',
  api765: 'Prima tabella: {$firstTable->table_name}',
  api771: 'Il primo vincolo ha {$testColumns} colonne nel database',
  api777: 'Nessuna tabella trovata in questo schema',
  api803: '-- Esportazione del database MySQL',
  api804: '-- Schema:',
  api805: '-- Versione:',
  api806: 'Y-m-d H:i:s',
  api810: '-- ATTENZIONE: rilevati problemi di integrità dei dati!',
  api812: '-- Questi vincoli verranno ignorati dall\'esportazione',
  api813: '-- Valutare la possibilità di rianalizzare questa versione dello schema o contattare l\'assistenza',
  api823: '-- Struttura della tabella per la tabella `',
  api860: 'Elaborazione dell\'ID vincolo {$constraint->id} per la tabella {$table->table_name}',
  api869: 'Trovate {$constraintColumns->count()} colonne per il vincolo {$constraint->id}',
  api872: 'Omissione del vincolo {$constraint->id} - nessuna colonna trovata',
  api913: '-- Esportazione completata con successo',
  api914: '-- Numero totale di tabelle esportate:',
  api915: '-- Totale vincoli esportati:',
  api939: 'Esportazione fallita:',
  api954: 'Nessun vincolo trovato',
  api998: 'Nessuna versione trovata per questo schema',
  api1026: 'Nessuna tabella trovata in questo schema',
  api1050: '-- Esportazione del database MySQL',
  api1051: '-- Schema:',
  api1052: '-- Versione:',
  api1053: 'Y-m-d H:i:s',
  api1059: '-- Struttura della tabella per la tabella `',
  api1142: '-- Esportazione completata con successo',
  api1143: '-- Numero totale di tabelle esportate:',
  api1161: 'Esportazione fallita:',
  api1276: 'gtree[] globale per la memorizzazione nella cache lato client',
  api1285: 'Si è verificata un\'eccezione',
  api1300: 'Ricerca del codice di join di debug',
  api1330: 'Modello non trovato',
  api1358: 'Si è verificata un\'eccezione',
  api1379: 'Modello non trovato',
  api1386: 'Elaborazione del modello con filtro progetto: {$projectId}',
  api1388: 'Elaborazione del modello senza filtro di progetto (modalità demo)',
  api1393: 'Elaborazione del modello con filtro tabella: {$tableName}',
  api1431: 'Caricamento degli schemi per il progetto: {$project->name}',
  api1438: 'Trovati {$linkedSchemas->count()} schemi collegati per il progetto {$projectId}',
  api1454: '(versione {$latestVersion->id})',
  api1458: 'Numero totale di tabelle collegate al progetto: {$schemaTables->count()}',
  api1465: 'Il progetto {$projectId} non ha schemi collegati: ciò è normale se nessun database è connesso al progetto',
  api1469: 'per il progetto {$projectId} perché è stato specificato table_name',
  api1498: 'Creata tabella fittizia con campi {$dummyFields->count()}',
  api1502: 'Nessun progetto specificato',
  api1532: 'Database del progetto dimostrativo',
  api1676: '🔍 Controllo dell\'override per il file',
  api1682: 'come specifico della tabella a causa del parametro table_name: {$tableName}',
  api1684: '❌ Override NON attivato per',
  api1707: 'Tabella non trovata',
  api1760: ': indice_tabella={$indicetabella}',
  api1809: 'Tutti i file in una risposta JSON',
  api1810: 'Non sono necessarie più richieste HTTP',
  api1814: 'Ricevi gtree[] completo + tutti i file generati in una singola richiesta',
  api1815: 'Memorizza gtree[] nel browser per un uso futuro',
  api1816: 'Elaborare i file generati (scaricare/visualizzare)',
  api1817: 'Facoltativo: crea ZIP dall\'array generated_files',
  api1824: 'Si è verificata un\'eccezione',

  // routes\gtree-ultimate.php
  gtreeultimate26: 'Modello non trovato',
  gtreeultimate85: 'Y-m-d H:i:s',
  gtreeultimate86: 'Y-m-d',
  gtreeultimate90: 'Y-m-d H:i:s',
  gtreeultimate91: 'Utente demo',
  gtreeultimate95: 'Utente',
  gtreeultimate105: 'Progetto Demo Score',
  gtreeultimate120: 'Database del progetto dimostrativo',
  gtreeultimate149: 'Y-m-d H:i:s',
  gtreeultimate160: 'Y-m-d',
  gtreeultimate161: 'Il suo',
  gtreeultimate163: 'Y-m-d H:i:s',
  gtreeultimate409: 'Si è verificata un\'eccezione in Ultimate Template Engine',

  // routes\web.php
  web50: 'Modalità demo attivata! I dati vengono azzerati ogni 20 minuti.',

    //js/components/AuthModals/CreditPurchaseModal.tsx
  creditpurchasemodal72: '💳 Acquista crediti',

  // resources/js/pages/PublicProjectPage.tsx
  publicProjectBy: 'di',
  publicProjectPoweredBy: 'Offerto da',
  publicProjectTagline: 'Generatore di codice aziendale',
  projectSettings: 'Impostazioni del progetto',
  languages: 'Lingue',
  dateFormat: 'Formato data',
  timeFormat: 'Formato ora',
  currency: 'Valuta',
  timezone: 'Fuso orario',
  teams: 'Squadre',
  templates: 'Modelli',
  databases: 'Banche dati',
  created: 'Creato',
  lastUpdated: 'Ultimo aggiornamento',

  // resources/js/Components/Panels/ProjectPanel.tsx - Public Link
  copyPublicLink: 'Copia collegamento pubblico',
  publicLinkCopied: 'Link pubblico copiato negli appunti!',
  projectNotPublic: 'Il progetto è privato: rendilo pubblico per condividerlo',

    //resources/js/Components/Panels/FormDesignerPanel.tsx
  formdesignerpanel555: 'Controllo di accesso fallito',

  // PWA Install
  installApp: 'Installa app',
  installSuccess: 'Installazione avviata',
  installSuccessDetail: 'Scoriet si sta installando sul tuo dispositivo...',

  	landingpage221: '1 progetto',
	landingpage222: '1 banca dati',
	landingpage223: '50 crediti gratuiti',
	landingpage224: 'Modelli pubblici',
	landingpage225: 'Supporto della comunità',
	landingpage226: 'Sblocca le funzionalità secondo necessità con i crediti',
	landingpage237: 'Team + Generazione basata sul credito',
	landingpage239: 'Team abilitati',
	landingpage240: 'Modelli privati',
	landingpage241: '5 crediti per generazione',
	landingpage242: 'Acquista crediti secondo necessità',
	landingpage243: '5 ticket di supporto gratuiti all\'anno',
	landingpage245: 'Scegli il Patrono Annuale',
	landingpage236: '/Anno',
	landingpage254: '/Mese',
	landingpage255: 'Tutto illimitato',
	landingpage257: 'Tutto illimitato',
	landingpage258: 'Nessun credito richiesto',
	landingpage259: 'Progetti illimitati',
	landingpage260: 'Database illimitati',
	landingpage261: '5 ticket di supporto gratuiti al mese',
	landingpage263: 'Scegli il Patron Mensile',
	profilemodal347: 'Austria',
	profilemodal348: 'Germania',
	profilemodal349: 'Svizzera',
	profilemodal350: 'Francia',
	profilemodal351: 'Italia',
	profilemodal352: 'Spagna',
	profilemodal353: 'Paesi Bassi',
	profilemodal354: 'Belgio',
	profilemodal355: 'Polonia',
	profilemodal356: 'Repubblica Ceca',
	profilemodal357: 'Ungheria',
	profilemodal358: 'Slovacchia',
	profilemodal359: 'Slovenia',
	profilemodal360: 'Croazia',
	profilemodal361: 'Romania',
	profilemodal362: 'Bulgaria',
	profilemodal363: 'Grecia',
	profilemodal364: 'Portogallo',
	profilemodal365: 'Svezia',
	profilemodal366: 'Danimarca',
	profilemodal367: 'Finlandia',
	profilemodal368: 'Irlanda',
	profilemodal369: 'Lussemburgo',
	profilemodal370: 'Malta',
	profilemodal371: 'Cipro',
	profilemodal372: 'Estonia',
	profilemodal373: 'Lettonia',
	profilemodal374: 'Lituania',
	profilemodal375: '--- Non UE ---',
	profilemodal377: 'Hai',
	profilemodal378: 'Gran Bretagna',
	profilemodal379: 'Australia',
	profilemodal380: 'Giappone',
	profilemodal381: 'Se',
	profilemodal382: 'Brasile',
	profilemodal383: 'Varie',
	profilemodal387: 'Bonifico bancario (SEPA)',
	profilemodal478: 'Errore durante il caricamento dello stato della CLI:',
	profilemodal501: 'Errore durante il caricamento degli abbonamenti:',
	profilemodal526: 'Errore durante il caricamento delle funzionalità:',
	profilemodal550: 'Errore durante il caricamento dello stato di archiviazione:',
	profilemodal572: 'Errore durante il caricamento dello sconto bundle:',
	profilemodal600: 'Estensione non riuscita',
	profilemodal604: 'Estensione non riuscita',
	profilemodal638: 'Errore durante l\'attivazione',
	profilemodal649: 'Errore durante l\'attivazione',
	profilemodal677: 'Tipo di funzionalità sconosciuto',
	profilemodal692: 'Errore durante l\'attivazione',
	profilemodal703: 'Errore durante l\'attivazione',
	profilemodal754: 'Errore durante il salvataggio dei dati del venditore',
	profilemodal758: 'Profilo del venditore salvato con successo',
	profilemodal761: 'Errore sconosciuto',
	profilemodal783: 'Errore durante il caricamento dei prezzi:',
	profilemodal810: 'Errore durante il caricamento dei provider git:',
	profilemodal841: 'Attivazione fallita',
	profilemodal845: 'Attivazione fallita',
	profilemodal858: 'Non autenticato',
	profilemodal871: 'Impossibile ottenere l\'URL di autorizzazione',
	profilemodal886: 'Errore di connessione:',
	profilemodal896: 'Non autenticato',
	profilemodal911: 'La richiesta di connessione è scaduta. Clicca di nuovo su "Connetti".',
	profilemodal913: 'Connessione fallita',
	profilemodal915: 'Impossibile completare la connessione',
	profilemodal928: 'Vorresti stabilire una connessione con',
	profilemodal928_2: 'Davvero separati?',
	profilemodal937: 'Non autenticato',
	profilemodal950: 'Disconnessione non riuscita',
	profilemodal955: 'Errore di disconnessione:',
	profilemodal970: 'connessione fallita:',
	profilemodal1151: 'Per eliminare il tuo account devi digitare "ELIMINA".',
	profilemodal1376: 'Seleziona il design',
	profilemodal1393: 'Seleziona il design',
	profilemodal1404: 'Seleziona il design',
	profilemodal1409: 'Scegli la combinazione di colori che preferisci. "Automatico" utilizza la luce diurna (6:00-18:00).',
	profilemodal1447: 'max 3 caratteri',
	profilemodal1464: 'Queste impostazioni verranno visualizzate sulla bacheca Kanban per il tuo incarico.',
	profilemodal1473: 'Notifiche e-mail',
	profilemodal1480: 'Notifiche di sistema',
	profilemodal1483: 'Messaggi di sistema importanti, annunci e messaggi amministrativi',
	profilemodal1500: 'Messaggi da altri utenti, team e notifiche di progetto',
	profilemodal1681: '% usato',
	profilemodal1682: ' gratuito',
	profilemodal1687: 'Spazio di archiviazione pieno! Elimina i vecchi messaggi per liberare spazio.',
	profilemodal1693: 'Memoria quasi piena!',
	profilemodal1706: 'Stato del patrono',
	profilemodal1706_2: '- Hai accesso illimitato a tutte le funzionalità!',
	profilemodal1715: 'Funzionalità disponibili',
	profilemodal1755: 'RISPARMIA 10 CREDITI!',
	profilemodal1769: 'Valido fino al:',
	profilemodal1817: 'Crediti/anno per',
	profilemodal1945: 'Non hai abbastanza crediti. Acquista crediti per sbloccare le funzionalità.',
	profilemodal1958: 'Progetti aggiuntivi, modelli privati o database aggiuntivi: possono essere ampliati tutte le volte che si desidera.',
	profilemodal1955: 'Abbonamenti individuali',
	profilemodal1977: 'Non hai ancora attivato alcun progetto aggiuntivo, modello privato o database aggiuntivo.',
	profilemodal2021: 'Scade il',
	profilemodal2026: 'Scade tra',
	profilemodal2026_2: 'Etichetta',
	profilemodal2026_3: 'giorni',
	profilemodal2031: 'Scade tra',
	profilemodal2031_2: 'giorni',
	profilemodal2035: 'Valido fino al',
	profilemodal2041: 'Valido a tempo indeterminato',
	profilemodal2048: 'Rinnova ora e +',
	profilemodal2048_2: 'Ricevi giorni bonus!',
	profilemodal2081: 'Opzioni del pacchetto',
	profilemodal2089: 'Hai già un abbonamento CLI o al servizio. Scegli un\'opzione:',
	profilemodal2121: 'Riceverai <strong>',
	profilemodal2121_2: 'Accreditato!',
	profilemodal2127: 'Risparmi ',
	profilemodal2127_2: 'Crediti!',
	profilemodal2150: 'Come sostenitore, hai accesso illimitato a tutte le funzionalità!',
	profilemodal2151: 'Al momento stai utilizzando il piano gratuito. Passa a un piano più economico per usufruire di più funzionalità!',
	profilemodal2161: 'Stato del patrono',
	profilemodal2161_2: '- Grazie per il vostro supporto!',
	profilemodal2170: 'Diventa un mecenate!',
	profilemodal2173: 'Accesso illimitato a tutte le funzionalità, progetti privati, modelli e altro ancora.',
	profilemodal2181: 'Visualizza i piani',
	profilemodal2194: 'Sono richiesti crediti per progetti, database, team e generazione di codice.',
	profilemodal2201: 'Acquista crediti',
	profilemodal2209: 'Panoramica dei prezzi',
	profilemodal2214: 'Progetto: 50 crediti/anno',
	profilemodal2218: 'Banca dati: 50 crediti/anno',
	profilemodal2222: 'Team: 50 crediti/anno',
	profilemodal2226: 'Generazione: 5 crediti',
	profilemodal2234: 'Venditore',
	profilemodal2248: 'Attiva la modalità venditore',
	profilemodal2251: 'Attiva questa modalità per vendere i modelli nel negozio.',
	profilemodal2284: 'Dati aziendali',
	profilemodal2290: 'Nome dell\'azienda / Nome *',
	profilemodal2297: 'Musterfirma GmbH',
	profilemodal2303: 'Terra *',
	profilemodal2311: 'Seleziona il paese',
	profilemodal2321: 'Indirizzo',
	profilemodal2329: 'Musterstraße 123&#10;1234 Musterstadt',
	profilemodal2340: 'Informazioni fiscali',
	profilemodal2346: 'Numero UID (Partita IVA)',
	profilemodal2348: '* Obbligatorio per l\'addebito inverso',
	profilemodal2360: 'Le aziende austriache ricevono note di credito comprensive di IVA.',
	profilemodal2361: 'Le aziende con un UID ricevono crediti netti (addebito inverso).',
	profilemodal2361_2: 'Le aziende dell\'UE con partita IVA ricevono crediti netti (inversione contabile).',
	profilemodal2369: 'Licenza commerciale / Registrazione aziendale',
	profilemodal2376: 'Numero di registrazione',
	profilemodal2381: 'Codice fiscale',
	profilemodal2388: 'Codice fiscale',
	profilemodal2393: 'Senza prova di registrazione aziendale, l\'IVA del 20% verrà detratta dal pagamento.',
	profilemodal2406: 'Metodo di pagamento',
	profilemodal2411: 'Metodo di pagamento *',
	profilemodal2419: 'Scegli il metodo di pagamento',
	profilemodal2429: 'Indirizzo email PayPal *',
	profilemodal2437: 'ihre-email@paypal.com',
	profilemodal2446: 'Titolare del conto *',
	profilemodal2453: 'Max Mustermann',
	profilemodal2458: 'Codice IBAN *',
	profilemodal2470: 'BIC/SWIFT',
	profilemodal2488: '• I pagamenti vengono effettuati mensilmente (inizio del mese successivo)',
	profilemodal2489: '• Pagamento minimo: € 10,00',
	profilemodal2490: '• Ricevi l\'80% del prezzo di vendita',
	profilemodal2491: '• Il 20% rimane sulla piattaforma',
	profilemodal2499: 'Salva...',
	profilemodal2499_2: 'Salva il profilo del venditore',
	profilemodal2519: 'giorni rimanenti',
	profilemodal2513: 'Connessione di un provider Git',
	profilemodal2524: 'Collega il tuo account GitHub o GitLab per caricare il codice generato direttamente nei tuoi repository.',
	profilemodal2538: 'Abilita l\'integrazione Git per inviare il codice direttamente a GitHub/GitLab, creare PR e unirli automaticamente.',
	profilemodal2535: 'L\'integrazione con Git è una funzionalità premium.',
	profilemodal2556: 'Crediti insufficienti',
	profilemodal2570: 'Abilita l\'integrazione Git per connettere i provider.',
	profilemodal2586: 'Connesso come @',
	profilemodal2589: 'Non connesso',
	profilemodal2597: 'Separato',
	profilemodal2606: 'Collegare',
	profilemodal2637: 'Connesso come @',
	profilemodal2640: 'Non connesso',
	profilemodal2648: 'Separato',
	profilemodal2657: 'Collegare',
	profilemodal2672: 'Come funziona?',
	profilemodal2675: '1. Collega il tuo account GitHub o GitLab',
	profilemodal2676: '2. Selezionare un repository nel progetto.',
	profilemodal2677: '3. Dopo la generazione del codice, è possibile eseguire il push direttamente.',
	profilemodal2678: '• Hai il controllo completo sul ramo e sul messaggio di commit.',
	profilemodal2679: '• Nessuna unione automatica: solo push e creazione PR facoltativa',
	profilemodal2708: 'Attenzione: Elimina account',
	profilemodal2740: 'Entra',
	profilemodal2740_2: 'per confermare',
	profilemodal2753: 'Devi inserire esattamente',
	profilemodal2753_2: '(lettere maiuscole)',
	planmodal54: 'Errore durante il caricamento dello stato dell\'utente:',
	planmodal95: 'Effettua il login per acquistare crediti.',
	planmodal112: 'Errore durante la creazione della sessione di pagamento',
	planmodal121: 'Si è verificato un errore',
	planmodal135: 'Effettua l\'accesso per effettuare l\'aggiornamento.',
	planmodal152: 'Errore durante la creazione della sessione di pagamento',
	planmodal161: 'Si è verificato un errore',
	planmodal176: 'Effettua il login per acquistare crediti.',
	planmodal192: 'Errore durante la creazione dell\'ordine PayPal',
	planmodal201: 'Si è verificato un errore',
	planmodal215: 'Effettua l\'accesso per effettuare l\'aggiornamento.',
	planmodal232: 'Errore durante la creazione dell\'ordine PayPal',
	planmodal241: 'Si è verificato un errore',
	planmodal249: 'Vuoi davvero annullare l\'abbonamento? Rimarrai un Patron fino alla fine del periodo di fatturazione corrente.',
	planmodal259: 'Effettua l\'accesso.',
	planmodal275: 'Errore durante l\'annullamento dell\'abbonamento',
	planmodal279: 'Il tuo abbonamento è stato annullato. Rimarrai un Sostenitore fino alla fine del periodo di fatturazione corrente.',
	planmodal285: 'Si è verificato un errore',
	planmodal284: 'Errore di annullamento dell\'abbonamento:',
	planmodal326: 'Perfetto per provare Scoriet',
	planmodal328: '50 crediti per iniziare (10 generazioni)',
	planmodal329: '1 progetto incluso',
	planmodal330: '1 database incluso',
	planmodal331: 'Solo modelli pubblici',
	planmodal332: 'Supporto della comunità',
	planmodal334: 'Piano attuale',
	planmodal342: 'Il miglior rapporto qualità-prezzo per sviluppatori impegnati',
	planmodal344: 'Squadre sbloccate',
	planmodal345: 'Modelli privati abilitati',
	planmodal346: 'Utilizza crediti per la generazione (5 crediti/generazione)',
	planmodal347: 'Acquista crediti secondo necessità',
	planmodal348: 'Supporto prioritario (5 ticket/mese inclusi)',
	planmodal358: 'Massima flessibilità con accesso illimitato',
	planmodal360: 'Tutto illimitato',
	planmodal361: 'Nessun credito necessario per la generazione',
	planmodal362: 'Progetti privati illimitati',
	planmodal363: 'Database illimitati',
	planmodal364: 'Squadre sbloccate',
	planmodal365: 'Supporto prioritario (5 ticket/mese inclusi)',
	planmodal367: 'Aggiorna a mensile',
	planmodal350: 'Aggiorna ad annuale',
	planmodal433: 'Attualmente sei su',
	planmodal433_2: 'piano. Grazie per essere un Patron!',
	planmodal435: 'Attualmente ti trovi su',
	planmodal435_2: 'Esegui l\'upgrade per sbloccare più funzionalità o acquista crediti su richiesta!',
	planmodal450: 'Abbonati per un accesso illimitato o per un utilizzo basato sul credito con i team',
	planmodal476: '/Mensile',
	planmodal479: '/Annualmente',
	planmodal496: 'Piano attuale',
	planmodal505: 'Annulla l\'abbonamento per effettuare il downgrade',
	planmodal513: 'Verrà terminato...',
	planmodal513_2: 'Annulla abbonamento',
	planmodal523: 'Annulla prima l\'abbonamento corrente',
	planmodal546: 'Caricamento in corso...',
	planmodal568: 'Puoi modificare o annullare il tuo piano in qualsiasi momento. Tutti i piani includono una garanzia di rimborso di 30 giorni.',
	planmodal578: 'Paga a consumo!',
	planmodal578_2: 'Mantieni il piano gratuito e acquista crediti quando ne hai bisogno.',
	planmodal581: 'Ogni generazione di codice costa 5 crediti. I crediti non scadono mai.',
	planmodal624: 'generazioni di codice',
	planmodal629: 'Caricamento in corso...',
	planmodal637: 'Caricamento in corso...',
	planmodal652: '💡 I crediti vengono aggiunti al tuo account immediatamente e non scadono mai.',
	planmodal598: 'Più popolare',
	planmodal601: '💎 Miglior valore',
	planmodal609: 'Crediti',
	planmodal617: 'Prezzo per credito',
	projectpanel216: 'Impossibile caricare i dati utente:',
	projectpanel332: 'Effettua l\'accesso per creare progetti.',
	projectpanel341: 'Non autenticato',
	projectpanel365: 'Errore durante il controllo delle informazioni sull\'abbonamento:',
	projectpanel391: 'Nessun abbonamento trovato per questo progetto',
	projectpanel403: 'Non autenticato',
	projectpanel420: 'Crediti insufficienti! Obbligatorio:',
	projectpanel420_2: '',
	projectpanel424: 'Errore durante lo sblocco del progetto',
	projectpanel445: 'Progetto',
	projectpanel445_2: 'è stato sbloccato con successo! (',
	projectpanel445_3: '(Giorni bonus ricevuti)',
	projectpanel447: 'Errore durante lo sblocco',
	projectpanel463: 'I nomi dei progetti possono contenere solo lettere minuscole (a-z), numeri (0-9) e caratteri di sottolineatura (_) come separatori. Esempio: my_project_2026',
	projectpanel488: 'Non hai abbastanza crediti! Hai bisogno',
	projectpanel488_2: 'Crediti, ma solo',
	projectpanel503: 'I nomi dei progetti possono contenere solo lettere minuscole (a-z), numeri (0-9) e caratteri di sottolineatura (_) come separatori. Esempio: my_project_2026',
	projectpanel631: 'Devi digitare',
	projectpanel631_2: 'per confermare l\'eliminazione',
	projectpanel804: 'Impossibile caricare i modelli:',
	projectpanel851: 'Non autenticato',
	projectpanel861: 'Impossibile caricare l\'anteprima dell\'esportazione',
	projectpanel871: 'Impossibile caricare l\'anteprima dell\'esportazione',
	projectpanel887: 'Non autenticato',
	projectpanel926: 'Il progetto è stato esportato con successo.',
	projectpanel925: 'Successo',
	projectpanel932: 'Errore di esportazione:',
	projectpanel936: 'Esportazione fallita',
	projectpanel935: 'Errore',
	projectpanel949: 'Bloccato',
	projectpanel957: 'Prendere',
	projectpanel1009: 'Sblocca progetto (50 crediti)',
	projectpanel1208: 'Squadre',
	projectpanel1213: 'Membri',
	projectpanel1225: 'Banche dati',
	projectpanel1231: 'Applicazioni',
	projectpanel1231_2: 'Applicazioni',
	projectpanel1238: 'Nessun progetto attivo',
	projectpanel1239: 'Non hai ancora un progetto attivo.',
	projectpanel1278: 'Team di amministrazione -',
	projectpanel1298: 'Allegati',
	projectpanel1299: 'Allegati -',
	projectpanel1347: 'Solo il proprietario del progetto può esportare.',
	projectpanel1347_2: 'Esporta progetto come archivio',
	projectpanel1353: 'Importa progetto',
	projectpanel1425: 'Nome del progetto *',
	projectpanel1448: 'Descrizione',
	projectpanel1442: 'Sono consentite solo lettere minuscole (a-z), numeri (0-9) e caratteri di sottolineatura (_)',
	projectpanel1472: 'Progetto pubblico',
	projectpanel1476: 'I progetti pubblici sono visibili a tutti gli utenti e possono essere scoperti nella galleria dei progetti.',
	projectpanel1489: 'Consenti richieste di partecipazione',
	projectpanel1493: 'Gli utenti possono richiedere di unirsi a questo progetto utilizzando un codice di adesione.',
	projectpanel1515: 'Nome del database per questo progetto',
	projectpanel1504: 'Nome del database',
	projectpanel1521: 'Tipo di database',
	projectpanel1604: 'Elenco dei progetti',
	projectpanel1615: 'percorso in cui salvare i file generati',
	projectpanel1621: 'URL del progetto',
	projectpanel1632: 'URL per accedere al progetto',
	projectpanel1638: 'Pagina iniziale',
	projectpanel1649: 'File di voce principale (ad esempio, index.php, main.py, app.js)',
	projectpanel1655: 'Lingua predefinita',
	projectpanel1672: 'Linguaggio standard per la generazione del progetto',
	projectpanel1678: 'Nome file Breve Lunghezza',
	projectpanel1694: 'Lunghezza dei nomi di file brevi in Database Designer (ad esempio, "us" per gli utenti)',
	projectpanel1706: 'Separatore decimale',
	projectpanel1718: 'Separatore decimale (ad esempio 1,50 o 1,50)',
	projectpanel1724: 'Separatore di migliaia',
	projectpanel1736: 'Separatore delle migliaia (ad esempio 1.000 o 1.000)',
	projectpanel1744: 'Formato data',
	projectpanel1755: 'Formato data (g.m.A = 31.12.2026)',
	projectpanel1761: 'Formato ora',
	projectpanel1772: 'Formato ora (H:i:s = 23:59:59)',
	projectpanel1780: 'Simbolo di valuta',
	projectpanel1792: 'Simbolo della valuta (€, $, CHF, ecc.)',
	projectpanel1798: 'Fuso orario',
	projectpanel1820: 'Fuso orario standard per il progetto',
	projectpanel1895: 'Devi inserire esattamente',
	projectpanel1895_2: '(lettere maiuscole)',
	projectpanel1929: 'Domanda inviata',
	projectpanel1930: 'Si prega di attendere fino a',
	projectpanel1930_2: 'ha elaborato la domanda.',
	projectpanel2035: 'Partecipato: ',
	projectpanel2046: 'Nessun membro del progetto è stato ancora caricato.',
	projectpanel2057: 'Caricamento squadre in corso...',
	projectpanel2068: 'Nessun team è ancora assegnato a questo progetto.',
	projectpanel2079: 'Caricamento schemi in corso...',
	projectpanel2089: 'Nessuno schema di database è ancora collegato a questo progetto.',
	projectpanel2110: 'Nessun modello è ancora collegato a questo progetto.',
	projectpanel2119: 'Allegati',
	projectpanel2124: 'Caricamento allegati in corso...',
	projectpanel2150: 'Scaricamento',
	projectpanel2169: 'Download non riuscito:',
	projectpanel2180: 'Nessun allegato ancora.',
	projectpanel2197: 'Link pubblico copiato negli appunti!',
	projectpanel2206: 'Il progetto è privato: rendilo pubblico per condividerlo',
	projectpanel2235: 'Progetto creato con successo!',
	projectpanel2254: 'Il progetto è stato creato con successo!',
	projectpanel2260: 'Vuoi selezionare questo progetto come progetto predefinito?',
	projectpanel2306: 'Esporta progetto',
	projectpanel2315: 'Cancellare',
	projectpanel2322: 'Esportare',
	projectpanel2348: 'Allegati:',
	projectpanel2352: 'Dimensione del file:',
	projectpanel2356: 'Schemi:',
	projectpanel2360: 'Modelli:',
	projectpanel2364: 'Modifiche al codice:',
  projectpanel2265: 'No grazie',
  projectpanel2271: 'Sì, selezionalo',
	projectpanel2368: 'Formulare:',
	projectpanel2383: 'Il tavolo,',
	projectpanel2377: 'Schemi:',
	projectpanel2394: 'Modelli:',
	projectpanel2400: 'file (',
	projectpanel2410: 'Formato di esportazione:',
	projectpanel2452: 'Le assegnazioni dei team e le autorizzazioni degli utenti non vengono esportate e devono essere ricreate dopo l\'importazione.',
	projectpanel2458: 'Impossibile caricare l\'anteprima dell\'esportazione.',
	projectsettingspanel337: 'Errore durante il caricamento dei modelli collegati:',
	projectsettingspanel374: 'Errore durante il caricamento delle impostazioni FTP:',
	projectsettingspanel407: 'Test di connessione fallito',
	projectsettingspanel433: 'Impostazioni FTP/SSH salvate',
	projectsettingspanel436: 'Errore durante il salvataggio delle impostazioni FTP/SSH',
	projectsettingspanel439: 'Errore durante il salvataggio delle impostazioni FTP/SSH',
	projectsettingspanel460: 'Impostazioni FTP/SSH rimosse',
	projectsettingspanel474: 'Errore durante la rimozione delle impostazioni FTP/SSH',
	projectsettingspanel477: 'Errore durante la rimozione delle impostazioni FTP/SSH',
	projectsettingspanel523: 'Errore durante il caricamento delle impostazioni git:',
	projectsettingspanel549: 'Errore durante il caricamento dei repository git:',
	projectsettingspanel571: 'Errore durante il caricamento dei rami git:',
	projectsettingspanel640: 'Impostazioni Git salvate correttamente',
	projectsettingspanel642: 'Errore durante il salvataggio delle impostazioni Git',
	projectsettingspanel646: 'Errore durante il salvataggio delle impostazioni Git',
	projectsettingspanel653: 'Vuoi davvero rimuovere l\'integrazione Git?',
	projectsettingspanel686: 'Integrazione Git rimossa con successo',
	projectsettingspanel688: 'Errore durante la rimozione dell\'integrazione Git',
	projectsettingspanel691: 'Errore durante la rimozione dell\'integrazione git:',
	projectsettingspanel692: 'Errore durante la rimozione dell\'integrazione Git',
	projectsettingspanel804: 'Errore durante il caricamento delle variabili del modello:',
	projectsettingspanel805: 'Errore durante il caricamento delle variabili del modello',
	projectsettingspanel834: 'Vuoi davvero trasferire la proprietà a',
	projectsettingspanel834_2: 'trasmesso?',
	projectsettingspanel834_3: 'Questa azione non può essere annullata e perderai i tuoi diritti di proprietà!',
	projectsettingspanel890: 'Impostazioni del progetto e variabili del modello salvate correttamente.',
	projectsettingspanel958: 'Errore durante il salvataggio delle variabili per il modello',
	projectsettingspanel975: 'Non autenticato',
	projectsettingspanel982: 'Variabili modello salvate correttamente',
	projectsettingspanel984: 'Errore durante il salvataggio delle variabili del modello:',
	projectsettingspanel985: 'Errore durante il salvataggio delle variabili del modello',
	projectsettingspanel1015: 'Seleziona un progetto',
	projectsettingspanel1016: 'selectedProject è nullo',
	projectsettingspanel1017: 'ProjectSettingsPanel caricato ma nessun progetto selezionato',
	projectsettingspanel1042: 'Progetto:',
	projectsettingspanel1433: 'Standard',
	projectsettingspanel1434: 'buona compressione',
	projectsettingspanel1435: 'migliore compressione',
	projectsettingspanel1682: 'Cerca fuso orario...',
	projectsettingspanel1743: 'Lingue selezionate:',
	projectsettingspanel1785: 'Seleziona la lingua',
	projectsettingspanel1816: 'Necessario',
	projectsettingspanel1841: 'Valore per',
	projectsettingspanel1841_2: 'ingresso',
	projectsettingspanel1856: 'Le variabili del modello vengono salvate automaticamente utilizzando il pulsante "Salva tutte le modifiche" in alto.',
	projectsettingspanel1885: 'Gli script di distribuzione verranno salvati automaticamente tramite il pulsante "Salva tutto" qui sopra.',
	projectsettingspanel1895: 'Collega un repository Git per inviare direttamente il codice generato.',
	projectsettingspanel1903: 'Per prima cosa, collega GitHub o GitLab al tuo profilo.',
	projectsettingspanel1904: 'prima di poter configurare l\'integrazione Git per questo progetto.',
	projectsettingspanel1901: 'Nessun provider Git connesso.',
	projectsettingspanel1912: 'Fornitore Git',
	projectsettingspanel1922: 'Seleziona un provider Git...',
	projectsettingspanel1941: 'Seleziona repository...',
	projectsettingspanel1941_2: 'Carico...',
	projectsettingspanel1944: 'Cerca nel repository...',
	projectsettingspanel1950: 'Caricamento repository in corso...',
	projectsettingspanel1976: 'Ramo per push di codice (ad esempio, generato da feature/scoriet)',
	projectsettingspanel1970: 'Seleziona filiale...',
	projectsettingspanel1970_2: 'Carico...',
	projectsettingspanel1967: '(protetto)\' : \'\'',
	projectsettingspanel1990: 'Carico...',
	projectsettingspanel1990_2: 'Seleziona filiale...',
	projectsettingspanel1995: 'Ramo di destinazione per le richieste pull (ad esempio, principale, master)',
	projectsettingspanel2005: 'Directory di destinazione (facoltativa)',
	projectsettingspanel2010: 'ad esempio src/generated o vuoto per root',
	projectsettingspanel2014: 'Sottodirectory nel repository per il codice generato',
	projectsettingspanel2023: 'Flusso di lavoro',
	projectsettingspanel2029: '\'Nur Push (Ramo, Impegno, Spinta)',
	projectsettingspanel2030: 'Crea richiesta Push + Pull',
	projectsettingspanel2031: 'Push + PR + Unione automatica (Attenzione!)',
	projectsettingspanel2038: 'Avvertimento:',
	projectsettingspanel2038_2: 'Auto-Merge ha unito automaticamente la PR al ramo principale!',
	projectsettingspanel2060: 'Modello di descrizione PR',
	projectsettingspanel2065: 'Codice generato automaticamente da Scoriet. Generato il:',
	projectsettingspanel2065_2: 'Progetto:',
	projectsettingspanel2077: 'Elimina automaticamente il ramo dopo l\'unione',
	projectsettingspanel2087: 'Salva le impostazioni Git',
	projectsettingspanel2095: 'Rimuovi l\'integrazione Git',
	projectsettingspanel2115: 'Solo spinta',
	projectsettingspanel2116: 'Spinta + PR',
	projectsettingspanel2107: 'Configurazione Git attiva',
	projectsettingspanel2132: 'Configura le credenziali di accesso FTP o SFTP per caricare il codice generato direttamente sul tuo server.',
	projectsettingspanel2138: 'Tipo di distribuzione',
	projectsettingspanel2152: 'Nessuno (disabilitato)',
	projectsettingspanel2156: 'Seleziona il tipo di distribuzione...',
	projectsettingspanel2190: 'Standard:',
	projectsettingspanel2197: 'nome utente',
	projectsettingspanel2210: 'password',
	projectsettingspanel2223: 'La password è stata salvata. Lasciare vuoto per conservarla.',
	projectsettingspanel2231: 'directory remota',
	projectsettingspanel2240: 'Directory di destinazione sul server. Lasciare vuoto per la directory radice.',
	projectsettingspanel2236: 'O',
	projectsettingspanel2255: 'Modalità passiva (consigliata)',
	projectsettingspanel2265: 'Utilizzare SSL/TLS (FTPS)',
	projectsettingspanel2274: 'Prova la connessione...',
	projectsettingspanel2274_2: 'Prova di connessione',
	projectsettingspanel2297: 'Salva le impostazioni FTP/SSH',
	projectsettingspanel2305: 'Rimuovi impostazioni',
	projectsettingspanel2319: 'Configurazione FTP/SSH attiva',
	projectsettingspanel2322: 'Hai salvato una configurazione FTP/SSH. Seleziona un tipo di distribuzione per modificare le impostazioni.',
	projectsettingspanel2331: 'Configurazione attiva',
	projectsettingspanel2334: '• Tipo:',
	projectsettingspanel2335: '• Ospite: ',
	projectsettingspanel2336: '• Utenti:',
	projectsettingspanel2338: '• Elenco:',
	projectsettingspanel2338_2: '• Elenco:',
	teammanagementpanel247: 'Sei sicuro di voler eliminare la squadra?',
	teammanagementpanel247_2: 'Questa azione non può essere annullata.',
	teammanagementpanel337: 'Nessuna autorizzazione',
	teammanagementpanel338: 'Solo i proprietari o gli amministratori del team possono sbloccare il team.',
	teammanagementpanel350: 'Non autenticato',
	teammanagementpanel369: 'Crediti insufficienti',
	teammanagementpanel370: 'Necessario: ',
	teammanagementpanel370_2: 'Disponibile: ',
	teammanagementpanel374: 'Errore durante lo sblocco del team',
	teammanagementpanel387: 'Successo',
	teammanagementpanel388: 'Sbloccato con successo!',
	teammanagementpanel395: 'Errore durante lo sblocco',
	teammanagementpanel396: 'Errore',
	teammanagementpanel425: 'Errore durante il caricamento dei progetti:',
	teammanagementpanel426: 'Errore',
	teammanagementpanel426_2: 'Errore durante il caricamento dei progetti',
	teammanagementpanel468: 'Errore durante il caricamento dei membri del team:',
	teammanagementpanel504: 'Errore',
	teammanagementpanel505: 'Errore durante il controllo della trasmissione',
	teammanagementpanel512: 'Errore',
	teammanagementpanel513: 'Errore di rete durante il controllo della trasmissione',
	teammanagementpanel547: 'Successo',
	teammanagementpanel548: 'Il team è stato trasferito con successo',
	teammanagementpanel560: 'Errore',
	teammanagementpanel561: 'Errore durante il trasferimento del team',
	teammanagementpanel568: 'Errore',
	teammanagementpanel569: 'Errore di rete durante la trasmissione',
	teammanagementpanel594: 'Impossibile aggiornare i link del team',
	teammanagementpanel597: 'Successo',
	teammanagementpanel597_2: 'I link del team sono stati aggiornati correttamente',
	teammanagementpanel601: 'Errore durante l\'aggiornamento dei link del team:',
	teammanagementpanel602: 'Errore durante l\'aggiornamento dei link',
	teammanagementpanel603: 'Errore',
	teammanagementpanel687: 'Prendere',
	teammanagementpanel721: 'Nessun progetto',
	teammanagementpanel762: 'Mostra ruoli',
	teammanagementpanel754: 'Visualizza i membri',
	teammanagementpanel771: 'Trasferimento squadra sospesa',
	teammanagementpanel781: 'Sblocca la squadra (50 crediti)',
	teammanagementpanel788: 'Solo il proprietario può sbloccare/trasferire.',
	teammanagementpanel803: 'Link ai progetti',
	teammanagementpanel818: 'Gestire i ruoli',
	teammanagementpanel827: 'squadra trasferita',
	teammanagementpanel977: 'Connetti il team:',
	teammanagementpanel983: 'Cancellare',
	teammanagementpanel988: 'Fare domanda a',
	teammanagementpanel1009: 'Nessun progetto trovato',
	teammanagementpanel1055: 'Verrà trasferito...',
	teammanagementpanel1057: 'Trasferito in stato bloccato',
	teammanagementpanel1058: 'squadra trasferita',
	teammanagementpanel1043: 'Squadra trasferita:',
	teammanagementpanel1049: 'Cancellare',
	teammanagementpanel1082: 'Pericolo:',
	teammanagementpanel1082_2: 'Dopo il trasferimento, diventerai un amministratore e non potrai più eliminare il team.',
	teammanagementpanel1094: 'Non ci sono ancora membri nel team. Aggiungi prima altri membri al team.',
	teammanagementpanel1089: '1. Seleziona il nuovo proprietario:',
	teammanagementpanel1130: 'Controlla le opzioni di trasmissione...',
	teammanagementpanel1145: 'Puoi possedere un numero illimitato di team. Il team rimane attivo!',
	teammanagementpanel1155: 'Slot disponibili:',
	teammanagementpanel1155_2: 'Il destinatario ha posti liberi nella squadra. La squadra rimane attiva!',
	teammanagementpanel1167: 'Il destinatario non ha slot liberi nella squadra.',
	teammanagementpanel1193: 'Slot di trasferimento',
	teammanagementpanel1196: 'Stai cedendo il tuo posto nel team al destinatario (scade il {\' \'}',
	teammanagementpanel1226: 'Trasferimento senza slot',
	teammanagementpanel1229: 'La squadra sarà',
	teammanagementpanel1229_2: 'bloccato',
	teammanagementpanel1229_3: 'trasmesso.',
	teammanagementpanel1230: 'Il destinatario potrà sbloccarlo in seguito (50 crediti) oppure passarlo ad altri.',
	teammanagementpanel1241: 'Informazioni:',
	teammanagementpanel1241_2: 'Un team bloccato può essere visualizzato ma non modificato.',
	teammanagementpanel1242: 'Il nuovo proprietario può sbloccare o trasferire la squadra in qualsiasi momento.',
	teammanagementpanel1254: 'I link al progetto verranno rimossi:',
	teammanagementpanel1261: '(privato, ti appartiene)',
	teammanagementpanel1267: 'Mancia:',
	teammanagementpanel1267_2: 'Per prima cosa puoi trasferire questi progetti al nuovo proprietario per mantenere il collegamento.',
	teammanagementpanel1277: 'I link al progetto saranno mantenuti:',
	teammanagementpanel1282: 'appartiene al destinatario',
	teammanagementpanel1282_2: 'pubblico',
	kanbanboardpanel299: 'Rimuovi assegnazione',
	kanbanboardpanel307: 'assegnami',
	kanbanboardpanel469: 'Impossibile caricare la bacheca Kanban',
	kanbanboardpanel474: 'Impossibile caricare la bacheca Kanban',
	kanbanboardpanel495: 'Non è stato possibile verificare lo stato di accesso.',
	kanbanboardpanel495_2: 'Errore',
	kanbanboardpanel498: 'Controllo di accesso fallito:',
	kanbanboardpanel499: 'Errore',
	kanbanboardpanel499_2: 'Errore di rete durante la richiesta di accesso',
	kanbanboardpanel524: 'Attivazione fallita',
	kanbanboardpanel528: 'Errore di rete durante l\'attivazione',
	kanbanboardpanel632: 'Impossibile spostare la carta',
	kanbanboardpanel636: 'Impossibile spostare la carta',
	kanbanboardpanel671: 'Inserisci un titolo',
	kanbanboardpanel700: 'Scheda aggiornata',
	kanbanboardpanel700_2: 'Carta creata',
	kanbanboardpanel705: 'Impossibile salvare la carta',
	kanbanboardpanel708: 'Impossibile salvare la carta',
	kanbanboardpanel715: 'Sei sicuro di voler eliminare questa carta?',
	kanbanboardpanel716: 'Conferma Elimina',
	kanbanboardpanel731: 'Carta eliminata',
	kanbanboardpanel734: 'Impossibile eliminare la carta',
	kanbanboardpanel737: 'Impossibile eliminare la carta',
	kanbanboardpanel790: 'Non hai effettuato l\'accesso',
	kanbanboardpanel807: 'Ti è stata assegnata una carta.',
	kanbanboardpanel813: 'Assegnazione fallita',
	kanbanboardpanel816: 'Assegnazione fallita',
	kanbanboardpanel823: 'Non hai effettuato l\'accesso',
	kanbanboardpanel840: 'Sei stato rimosso dalla mappa',
	kanbanboardpanel846: 'Rimozione fallita',
	kanbanboardpanel849: 'Rimozione fallita',
	kanbanboardpanel980: 'Creato il',
	kanbanboardpanel1006: 'Popup bloccato. Consenti i popup per questa pagina.',
	kanbanboardpanel1027: 'Ruolo assegnato',
	kanbanboardpanel1027_2: 'Rotolo rimosso',
	kanbanboardpanel1032: 'Errore durante l\'impostazione del ruolo',
	kanbanboardpanel1035: 'Errore durante l\'impostazione del ruolo',
	kanbanboardpanel1067: 'Inserisci un nome di colonna',
	kanbanboardpanel1088: 'Colonna aggiornata',
	kanbanboardpanel1088_2: 'Colonna creata',
	kanbanboardpanel1093: 'Impossibile salvare la colonna',
	kanbanboardpanel1096: 'Impossibile salvare la colonna',
	kanbanboardpanel1103: 'Impossibile eliminare la colonna con le schede. Spostare o eliminare prima le schede.',
	kanbanboardpanel1109: 'Sei sicuro di voler eliminare questa colonna?',
	kanbanboardpanel1125: 'Colonna eliminata',
	kanbanboardpanel1128: 'Impossibile eliminare la colonna',
	kanbanboardpanel1131: 'Impossibile eliminare la colonna',
	kanbanboardpanel1166: 'Sblocca la bacheca Kanban',
	kanbanboardpanel1168: 'La bacheca Kanban ti aiuta a organizzare visivamente le attività del tuo progetto.',
	kanbanboardpanel1169: 'Crea colonne, mappe e monitora l\'avanzamento del tuo lavoro.',
	kanbanboardpanel1175: 'Trascina e rilascia le carte',
	kanbanboardpanel1179: 'Etichette e priorità',
	kanbanboardpanel1183: 'Date di scadenza',
	kanbanboardpanel1187: 'Assegnazione al team',
	kanbanboardpanel1198: 'Il tuo saldo:',
	kanbanboardpanel1203: 'Sbloccare...',
	kanbanboardpanel1203_2: 'Sblocca ora',
	kanbanboardpanel1213: 'Hai bisogno di almeno',
	kanbanboardpanel1213_2: 'Crediti',
	kanbanboardpanel1294: 'Seleziona un progetto per visualizzare la sua bacheca Kanban',
	kanbanboardpanel1303: 'Caricamento della bacheca Kanban...',
	kanbanboardpanel1317: 'Conflitto di abbreviazioni:',
	kanbanboardpanel1317_2: 'I seguenti membri del team hanno abbreviazioni identiche: {\' \'}',
	kanbanboardpanel1324: 'Si prega di utilizzare le proprie iniziali nel profilo.',
	kanbanboardpanel1341: 'Gestione dei ruoli del team',
	kanbanboardpanel1349: 'Esporta la scheda in formato PDF',
	kanbanboardpanel1361: 'Aggiorna',
	kanbanboardpanel1353: 'Aggiungi colonna',
	kanbanboardpanel1394: 'Aggiungi carta',
	kanbanboardpanel1401: 'Modifica colonna',
	kanbanboardpanel1408: 'Elimina colonna',
	kanbanboardpanel1436: 'Lascia cadere le carte qui',
	kanbanboardpanel1451: 'Modifica scheda',
	kanbanboardpanel1451_2: 'Nuova carta',
	kanbanboardpanel1460: 'Cancellare',
	kanbanboardpanel1466: 'Salva',
	kanbanboardpanel1480: 'Inserisci il titolo della carta',
	kanbanboardpanel1475: 'Titolo *',
	kanbanboardpanel1486: 'Descrizione',
	kanbanboardpanel1492: 'Inserisci la descrizione',
	kanbanboardpanel1497: 'Priorità',
	kanbanboardpanel1507: 'Due Date',
	kanbanboardpanel1525: 'Etichette',
	kanbanboardpanel1558: 'Cancellare',
	kanbanboardpanel1564: 'Salva',
	kanbanboardpanel1573: 'Nome *',
	kanbanboardpanel1578: 'Nome della colonna',
	kanbanboardpanel1584: 'Colore',
	kanbanboardpanel1602: 'Limite WIP (facoltativo)',
	kanbanboardpanel1611: 'Numero massimo di carte nella colonna',
	kanbanboardpanel1614: 'Lascia vuoto per nessun limite',
	kanbanboardpanel1631: 'Assegna ruoli Kanban ai membri del team. I ruoli vengono visualizzati come badge sull\'avatar.',
	kanbanboardpanel1621: 'Gestione dei ruoli del team',
	kanbanboardpanel1656: 'Nessun ruolo',
	kanbanboardpanel1669: 'Scegli il ruolo',
	kanbanboardpanel1677: 'Ruoli disponibili:',
	templatemanagementpanel199: 'Directory statica (archivio)',
	templatemanagementpanel200: 'File di progetto',
	templatemanagementpanel204: 'File di progetto (lingue)',
	templatemanagementpanel203: 'File di tabella DB (lingue)',
	templatemanagementpanel198: 'Singolo file statico (ad esempio config.json)',
	templatemanagementpanel201: 'File per tabella del database (modello, controller, ecc.)',
	templatemanagementpanel225: 'Gestione dei modelli:',
	templatemanagementpanel303: 'Errore durante il caricamento dei miei modelli:',
	templatemanagementpanel372: 'Errore durante il caricamento dei modelli della community:',
	templatemanagementpanel397: 'Errore durante il caricamento dei modelli acquistati:',
	templatemanagementpanel471: 'Devi digitare',
	templatemanagementpanel471_2: 'per confermare l\'eliminazione',
	templatemanagementpanel480: 'Modello eliminato definitivamente',
	templatemanagementpanel534: 'Link aggiornati con successo',
	templatemanagementpanel540: 'Errore durante l\'aggiornamento dei link',
	templatemanagementpanel547: 'Nessun abbonamento trovato per questo modello',
	templatemanagementpanel557: 'Non autenticato',
	templatemanagementpanel574: 'Errore durante la modifica della visibilità',
	templatemanagementpanel577: 'Ora è pubblico!',
	templatemanagementpanel593: 'Crediti insufficienti! Obbligatorio:',
	templatemanagementpanel593_2: 'Disponibile: ',
	templatemanagementpanel596: 'Errore durante lo sblocco del modello',
	templatemanagementpanel600: 'È stato sbloccato!',
	templatemanagementpanel600_2: 'Ricevi giorni bonus',
	templatemanagementpanel609: 'Errore durante lo sblocco',
	templatemanagementpanel696: 'Errore durante il caricamento dei progetti:',
	templatemanagementpanel697: 'Errore durante il caricamento dei progetti',
	templatemanagementpanel719: 'I link del modello sono stati aggiornati correttamente',
	templatemanagementpanel724: 'Errore durante l\'aggiornamento dei link',
	templatemanagementpanel749: 'Sono richiesti almeno 50 crediti',
	templatemanagementpanel753: 'Minimo richiesto 1,00 EUR',
	templatemanagementpanel767: 'Impostazioni del negozio salvate',
	templatemanagementpanel772: 'Errore durante il salvataggio',
	templatemanagementpanel788: 'Errore durante il caricamento del supporto:',
	templatemanagementpanel798: 'Si prega di caricare solo file immagine.',
	templatemanagementpanel803: 'Il logo non deve superare le dimensioni di 2 MB.',
	templatemanagementpanel818: 'Errore durante il caricamento',
	templatemanagementpanel831: 'Si prega di caricare solo file immagine.',
	templatemanagementpanel837: 'Le immagini non devono essere più grandi di 5 MB.',
	templatemanagementpanel850: 'Immagine/i caricata/e',
	templatemanagementpanel854: 'Errore durante il caricamento',
	templatemanagementpanel863: 'Inserisci l\'URL di un video.',
	templatemanagementpanel872: 'Inserisci un URL YouTube o Vimeo valido.',
	templatemanagementpanel886: 'Video aggiunto',
	templatemanagementpanel892: 'Errore durante l\'aggiunta',
	templatemanagementpanel902: 'Davvero eliminarlo?',
	templatemanagementpanel903: 'Conferma l\'eliminazione',
	templatemanagementpanel911: 'Eliminato',
	templatemanagementpanel914: 'Errore durante l\'eliminazione',
	templatemanagementpanel966: 'Modello riuscito',
	templatemanagementpanel966_2: 'aggiornato',
	templatemanagementpanel966_3: 'creato',
	templatemanagementpanel972: 'Rilevato contenuto insolito nel modello, ritorno alla modalità privata.',
	templatemanagementpanel973: 'Rilevato:',
	templatemanagementpanel1020: 'Rilevato contenuto insolito nel modello, ritorno alla modalità privata.',
	templatemanagementpanel1022: 'Rilevato:',
	templatemanagementpanel1158: 'Modello importato correttamente dall\'archivio',
	templatemanagementpanel1164: 'Esiste già un modello con questo nome. Vuoi sovrascriverlo?',
	templatemanagementpanel1165: 'Esiste già un modello.',
	templatemanagementpanel1184: 'Modello sovrascritto correttamente',
	templatemanagementpanel1188: 'Errore durante la sovrascrittura del modello',
	templatemanagementpanel1191: 'Errore durante la sovrascrittura del modello:',
	templatemanagementpanel1194: 'Sì, sovrascrivi',
	templatemanagementpanel1195: 'Cancellare',
	templatemanagementpanel1202: 'Errore durante l\'importazione dell\'archivio:',
	templatemanagementpanel1220: 'Impossibile scaricare',
	templatemanagementpanel1232: 'Modello come',
	templatemanagementpanel1232_2: 'scaricato',
	templatemanagementpanel1299: 'file',
	templatemanagementpanel1299_2: 'eliminato con successo',
	templatemanagementpanel1304: 'Rilevato contenuto insolito nel modello, ritorno alla modalità privata.',
	templatemanagementpanel1306: 'Rilevato:',
	templatemanagementpanel1316: 'Errore durante l\'eliminazione del file:',
	templatemanagementpanel1350: 'Errore durante l\'elaborazione del file ZIP:',
	templatemanagementpanel1423: 'File completato con successo',
	templatemanagementpanel1423_2: 'aggiornato',
	templatemanagementpanel1428: 'Rilevato contenuto insolito nel modello, ritorno alla modalità privata.',
	templatemanagementpanel1430: 'Rilevato:',
	templatemanagementpanel1440: 'Errore durante il salvataggio del file:',
	templatemanagementpanel1461: 'Errore durante il caricamento delle variabili:',
	templatemanagementpanel1465: 'Errore durante il caricamento delle variabili:',
	templatemanagementpanel1482: 'Nessun modello selezionato',
	templatemanagementpanel1489: 'Variabile eliminata con successo',
	templatemanagementpanel1492: 'Errore durante l\'eliminazione della variabile',
	templatemanagementpanel1495: 'Errore durante l\'eliminazione della variabile',
	templatemanagementpanel1501: 'Nessun modello selezionato',
	templatemanagementpanel1511: 'Variabile aggiornata con successo',
	templatemanagementpanel1513: 'Errore durante l\'aggiornamento della variabile',
	templatemanagementpanel1520: 'Variabile creata con successo',
	templatemanagementpanel1522: 'Errore durante la creazione della variabile',
	templatemanagementpanel1531: 'Errore durante il salvataggio della variabile',
	templatemanagementpanel1555: 'Importa archivio',
	templatemanagementpanel1598: 'Tutto',
	templatemanagementpanel1599: 'Privato',
	templatemanagementpanel1600: 'Pubblico',
	templatemanagementpanel1601: 'Sistema',
	templatemanagementpanel1604: 'Tutto',
	templatemanagementpanel1605: 'Privato',
	templatemanagementpanel1606: 'Pubblico',
	templatemanagementpanel1607: 'Negozio',
	templatemanagementpanel1616: 'Tutte le lingue',
	templatemanagementpanel1647: ' Fino a ',
	templatemanagementpanel1647_2: ' da ',
	templatemanagementpanel1647_3: 'Modelli',
	templatemanagementpanel1737: 'Nessun progetto collegato',
	templatemanagementpanel1744: 'progetto',
	templatemanagementpanel1744_2: 'Progetti',
	templatemanagementpanel1829: 'Link ai progetti',
	templatemanagementpanel1935: 'Tutto',
	templatemanagementpanel1936: 'Sistema',
	templatemanagementpanel1937: 'Pubblico',
	templatemanagementpanel1938: 'Negozio',
	templatemanagementpanel1946: 'Tutte le lingue',
	templatemanagementpanel1948: 'Lingua',
	templatemanagementpanel1977: ' Fino a ',
	templatemanagementpanel1977_2: ' da ',
	templatemanagementpanel1977_3: 'Modelli',
	templatemanagementpanel2004: 'Sistema',
	templatemanagementpanel2012: 'Crediti',
	templatemanagementpanel2017: 'Negozio',
	templatemanagementpanel2050: 'Nessun progetto collegato',
	templatemanagementpanel2057: 'progetto',
	templatemanagementpanel2057_2: 'Progetti',
	templatemanagementpanel2036: 'Progetti',
	templatemanagementpanel2069: 'Attivo',
	templatemanagementpanel2085: 'Rilasciato',
	templatemanagementpanel2095: 'Test',
	templatemanagementpanel2133: 'Link ai progetti',
	templatemanagementpanel2142: 'Gestisci i link',
	templatemanagementpanel2155: 'Già clonato',
	templatemanagementpanel2155_2: 'Clone',
	templatemanagementpanel2185: 'Nessun modello acquistato trovato',
	templatemanagementpanel2187: ' Fino a ',
	templatemanagementpanel2187_2: ' da ',
	templatemanagementpanel2187_3: 'Modelli',
	templatemanagementpanel2209: 'Venditore',
	templatemanagementpanel2217: 'Stato',
	templatemanagementpanel2219: 'Comprato',
	templatemanagementpanel2230: 'Visualizzazione',
	templatemanagementpanel2236: 'Progetto di collegamento',
	templatemanagementpanel2242: 'Clona e adatta',
	templatemanagementpanel2296: 'Vicino',
	templatemanagementpanel2318: 'Categoria:',
	templatemanagementpanel2321: 'Lingua:',
	templatemanagementpanel2349: 'Nessun file trovato',
	templatemanagementpanel2358: 'Modello clone:',
	templatemanagementpanel2364: 'Cancellare',
	templatemanagementpanel2377: 'Clona ora',
	templatemanagementpanel2392: 'Nuovo nome del modello',
	templatemanagementpanel2403: 'Controlla la disponibilità...',
	templatemanagementpanel2408: 'Il nome non deve essere utilizzato due volte.',
	templatemanagementpanel2413: 'Il nome è disponibile',
	templatemanagementpanel2422: 'visibilità',
	templatemanagementpanel2430: 'Pubblico (visibile a tutti)',
	templatemanagementpanel2431: 'Privato (solo per te)',
	templatemanagementpanel2442: 'I modelli acquistati sono considerati',
	templatemanagementpanel2442_2: 'clonato.',
	templatemanagementpanel2468: 'Elimina modello',
	templatemanagementpanel2485: 'Eliminazione permanente',
	templatemanagementpanel2490: 'Il modello',
	templatemanagementpanel2490_2: 'verranno eliminati definitivamente.',
	templatemanagementpanel2495: 'Tutti i file, le variabili e le configurazioni verranno rimossi irrevocabilmente.',
	templatemanagementpanel2500: 'Gib',
	templatemanagementpanel2500_2: 'uno, per confermare:',
	templatemanagementpanel2511: 'Devi essere preciso',
	templatemanagementpanel2511_2: '(Lettere maiuscole)',
	templatemanagementpanel2519: 'Cancellare',
	templatemanagementpanel2526: 'Eliminare...',
	templatemanagementpanel2526_2: 'Elimina modello',
	templatemanagementpanel2547: 'Cancellare',
	templatemanagementpanel2554: 'Fare domanda a',
	templatemanagementpanel2574: 'Nessun progetto trovato',
	templatemanagementpanel2617: 'Cancellare',
	templatemanagementpanel2623: 'Salva',
	templatemanagementpanel2608: 'Gestisci i link:',
	templatemanagementpanel2638: 'Nessun progetto collegato',
	templatemanagementpanel2688: 'Rilasciato - Il tuo modello è visibile nello store',
	templatemanagementpanel2689: 'In attesa di approvazione - Visibile dopo l\'approvazione dell\'amministratore o dopo 5+ revisioni',
	templatemanagementpanel2705: 'Ricavi totali',
	templatemanagementpanel2699: 'Saldi',
	templatemanagementpanel2717: 'Metodo di pagamento',
	templatemanagementpanel2728: 'Crediti',
	templatemanagementpanel2738: 'EUR (tramite Stripe/PayPal)',
	templatemanagementpanel2747: 'Prezzo in crediti (minimo: 50)',
	templatemanagementpanel2758: 'Ricevi l\'80%:',
	templatemanagementpanel2758_2: 'Crediti per vendita',
	templatemanagementpanel2764: 'Prezzo in EUR (minimo: 1,00)',
	templatemanagementpanel2776: 'Ricevi l\'80%:',
	templatemanagementpanel2776_2: 'EUR per vendita',
	templatemanagementpanel2784: 'Distribuzione delle entrate:',
	templatemanagementpanel2784_2: 'L\'80% va a te, il 20% è una commissione sulla piattaforma',
	templatemanagementpanel2790: 'Cancellare',
	templatemanagementpanel2796: 'Salva...',
	templatemanagementpanel2796_2: 'Salva',
	templatemanagementpanel2830: 'Nessun logo',
	templatemanagementpanel2844: 'Caricamento...',
	templatemanagementpanel2844_2: 'Carica il logo',
	templatemanagementpanel2852: 'Eliminare',
	templatemanagementpanel2858: 'Max. 2 MB, ridimensionato a 256x256',
	templatemanagementpanel2867: 'Screenshot / Immagini',
	templatemanagementpanel2878: 'Caricamento...',
	templatemanagementpanel2878_2: 'Carica immagini',
	templatemanagementpanel2884: 'Max. 5 MB per immagine, sono possibili più immagini',
	templatemanagementpanel2909: 'Nessuna immagine caricata ancora',
	templatemanagementpanel2918: 'Video (YouTube / Vimeo)',
	templatemanagementpanel2931: 'Aggiungere',
	templatemanagementpanel2941: 'Titolo del video (facoltativo)',
	templatemanagementpanel2977: 'Nessun video aggiunto ancora',
	templatemanagementpanel2978: 'I link di YouTube e Vimeo vengono visualizzati come video incorporati.',
	templatemanagementpanel2995: 'Modello creato con successo',
	templatemanagementpanel2995_2: 'Modello ',
	templatemanagementpanel2995_3: 'è stato importato.',
	templatereviewpanel114: 'Impossibile caricare i modelli in sospeso:',
	templatereviewpanel127: 'Recensione inviata con successo!',
	templatereviewpanel142: 'Modello approvato dall\'amministratore!',
	templatereviewpanel147: 'Impossibile approvare il modello:',
	templatereviewpanel166: 'Impossibile caricare i file modello:',
	templatereviewpanel197: 'Modello esportato con successo!',
	templatereviewpanel199: 'Impossibile esportare il modello:',
	templatereviewpanel225: 'Impossibile scaricare ZIP',
	templatereviewpanel237: 'Modello ZIP scaricato correttamente!',
	templatereviewpanel239: 'Impossibile scaricare ZIP:',
	templatereviewpanel272: 'Prezzo non impostato',
	templatereviewpanel303: 'Rilasciato',
	templatereviewpanel303_2: 'Recensioni',
	templatereviewpanel306: 'ancora necessario',
	templatereviewpanel399: 'Esaminare i modelli pubblici e di archivio in attesa di approvazione',
	templatereviewpanel396: 'Coda di revisione del modello',
	templatereviewpanel429: 'Modello',
	templatereviewpanel436: 'Creatore',
	templatereviewpanel443: 'Categoria',
	templatereviewpanel449: 'Tipo',
	templatereviewpanel455: 'Lingua',
	templatereviewpanel460: 'File',
	templatereviewpanel465: 'Punto',
	templatereviewpanel470: 'Azioni',
	templatereviewpanel493: 'Nessuna descrizione',
	templatereviewpanel498: 'Categoria:',
	templatereviewpanel504: 'Lingua:',
	templatereviewpanel510: 'Tag:',
	templatereviewpanel517: 'Nessun tag',
	templatereviewpanel541: 'Prezzo non impostato',
	templatereviewpanel531: 'Tipo:',
	templatereviewpanel551: 'Stato della revisione:',
	templatereviewpanel566: 'ancora necessario',
	templatereviewpanel584: 'Recensione completa',
	templatereviewpanel599: 'Nessuna descrizione',
	templatereviewpanel610: 'Rilasciato',
	templatereviewpanel614: 'Scarica ZIP',
	templatereviewpanel622: 'Esporta JSON',
	templatereviewpanel638: 'File modello',
	templatereviewpanel648: 'Scaricamento',

  //InviteManagementPanel.tsx
  invitemanagementpanel96: 'Impossibile caricare gli inviti: '

};
