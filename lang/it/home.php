<?php

/*
 * Contenuto della home page pubblica (resources/views/public/home.blade.php).
 * Mantenere le cinque lingue strutturalmente identiche (stesse chiavi, stesse lunghezze delle liste).
 */

return [
    'hero_eyebrow' => 'Open source · RAD basato su template · Pensato per l’era dell’IA',
    'hero_points' => [
        'C#, Java, Laravel, PHP, Rust, Flutter e altro',
        'Login con 2FA / MFA incluso',
        'Gratuito e open source su GitHub',
    ],
    'pipeline' => ['Schema del database', 'Template', 'App completa', 'L’IA costruisce sopra'],

    'problem_kicker' => 'Il problema',
    'problem_title' => 'Ogni nuova app inizia con le stesse settimane di lavoro di base',
    'problem_text' => 'Login, gestione utenti, tabelle, moduli, elenchi, finestre di ricerca, report: prima di scrivere la prima riga di logica di business sono già passati giorni o settimane. Anche gli assistenti di programmazione IA partono da zero: reinventano le stesse basi in ogni sessione, consumano token e denaro e ogni volta producono una struttura diversa.',
    'problem_items' => [
        'Settimane spese sui dati anagrafici prima del lavoro vero',
        'L’IA riparte da zero ogni volta: costoso e incoerente',
        'Ogni progetto è costruito in modo diverso, la manutenzione diventa difficile',
    ],

    'solution_kicker' => 'La soluzione',
    'solution_title' => 'Scoriet costruisce le fondamenta. L’IA costruisce sopra.',
    'solution_text' => 'Scoriet è un generatore di applicazioni basato su template (RAD). Dal tuo schema di database genera un’applicazione completa e funzionante, con login, amministrazione del database, tabelle, moduli, report e finestre di ricerca. Il tuo assistente IA prosegue poi su un codice pulito e coerente invece che su una cartella vuota. Risparmi tempo, token e denaro: un solo sviluppatore completa un’intera app in pochi giorni invece che in settimane.',

    'compare_title' => 'IA da zero vs. IA su una base Scoriet',
    'compare_bad_title' => 'L’IA parte da una cartella vuota',
    'compare_bad' => [
        'Genera di nuovo login, tabelle e moduli, token dopo token',
        'La struttura cambia da una sessione all’altra',
        'Giorni o settimane prima che le basi funzionino',
        'Costi elevati in token prima di avere logica di business',
    ],
    'compare_good_title' => 'L’IA costruisce su un’app Scoriet',
    'compare_good' => [
        'Login con 2FA, tabelle, moduli e report esistono già',
        'Architettura coerente da template collaudati',
        'Logica di business dal primo giorno',
        'I token vengono spesi dove creano valore',
    ],

    'steps_kicker' => 'Come funziona',
    'steps_title' => 'Dallo schema del database all’applicazione finita in quattro passi',
    'steps' => [
        ['title' => 'Progetta o importa il tuo database', 'text' => 'Importa uno schema MySQL esistente o modella tabelle e campi nel designer di database integrato. Le etichette dei campi e lo schema stesso possono essere tradotti.'],
        ['title' => 'Scegli un template', 'text' => 'Scegli un template per C#, Java / Spring Boot, Laravel, PHP, Rust, Flutter e altro, oppure scrivi il tuo. I template definiscono esattamente quale codice viene generato.'],
        ['title' => 'Genera l’app completa', 'text' => 'Scoriet genera un’applicazione completa: login con 2FA / OTP / MFA e amministrazione del database con tabelle, moduli, report e finestre di ricerca, multilingue se lo desideri.'],
        ['title' => 'Continua con l’IA o a mano', 'text' => 'Consegna il progetto generato al tuo assistente IA o al tuo team e concentrati su ciò che rende unica la tua applicazione.'],
    ],

    'generated_kicker' => 'Incluso in ogni app generata',
    'generated_title' => 'Cosa contiene già la tua applicazione dopo la generazione',
    'generated_items' => [
        'Login e gestione utenti con 2FA / OTP / MFA',
        'Amministrazione del database per tutte le tabelle',
        'Moduli di inserimento con validazione',
        'Elenchi e tabelle con ordinamento e paginazione',
        'Finestre di ricerca e filtri',
        'Report',
        'Interfaccia utente multilingue',
        'Codice sorgente pulito e leggibile che ti appartiene',
    ],

    'tech_kicker' => 'Uno schema, molte piattaforme',
    'tech_title' => 'Genera per il linguaggio e il framework che ti servono',
    'tech_text' => 'Lo stesso schema di database diventa un’applicazione web, desktop o mobile. Poiché Scoriet è interamente basato su template, qualsiasi altro linguaggio o framework può essere aggiunto con i tuoi template.',
    'tech_more' => 'e i tuoi template',

    'lifecycle_kicker' => 'Dopo la generazione',
    'lifecycle_title' => 'Non solo generare una volta: mantenere ed evolvere',
    'lifecycle_text' => 'I progetti reali cambiano. Scoriet supporta l’intero flusso di lavoro dopo la prima generazione.',
    'lifecycle' => [
        ['title' => 'Deploy via FTP e CLI', 'text' => 'Carica i progetti generati direttamente sul tuo server o integrali nella tua build con il servizio CLI.'],
        ['title' => 'Confronta le modifiche', 'text' => 'Vedi quali file generati sono stati modificati a mano e confrontali file per file.'],
        ['title' => 'Reverse engineering', 'text' => 'Le modifiche manuali vengono riportate nella generazione e sopravvivono così alla prossima esecuzione.'],
        ['title' => 'Migrazioni del database', 'text' => 'Scoriet genera lo script SQL che aggiorna il tuo database dalla versione 1 alla versione 2 dello schema.'],
    ],

    'features_kicker' => 'Tutto in un unico studio',
    'features_title' => 'Tutti gli strumenti che ti servono, nel browser',
    'features' => [
        ['title' => 'Designer di database', 'text' => 'Modella visivamente tabelle, campi e relazioni o importa SQL esistente.'],
        ['title' => 'Editor visuale dei moduli', 'text' => 'Disponi i moduli con il drag & drop: il layout viene usato nella generazione.'],
        ['title' => 'Editor dei report', 'text' => 'Progetta i report visivamente e generali insieme all’app.'],
        ['title' => 'Editor delle finestre', 'text' => 'Progetta finestre basate su una singola tabella: la base per migrare applicazioni WinDev a Scoriet.'],
        ['title' => 'Team', 'text' => 'Lavora ai progetti insieme, con ruoli e inviti.'],
        ['title' => 'Gestione progetti Kanban', 'text' => 'Pianifica e segui il lavoro sul progetto proprio accanto al codice.'],
        ['title' => 'Messaggistica interna', 'text' => 'Parla con il tuo team senza lasciare lo studio.'],
        ['title' => 'Traduzioni integrate', 'text' => 'Scoriet parla cinque lingue e genera applicazioni multilingue, schema tradotto compreso.'],
        ['title' => 'Import ed export dei template', 'text' => 'Condividi i template tra progetti, team e installazioni.'],
        ['title' => 'Store dei template', 'text' => 'Compra e vendi template, controllati contro il codice malevolo prima della pubblicazione.'],
    ],

    'trust_kicker' => 'Open source',
    'trust_title' => 'Open source e sicuro per progettazione',
    'trust_text' => 'Scoriet è open source e liberamente disponibile su GitHub. I template possono essere importati, esportati e persino venduti nello store dei template di Scoriet. Ogni template e ogni modifica vengono analizzati automaticamente alla ricerca di codice malevolo e revisionati dalla community prima della pubblicazione, così nessuno può dirottare la tua applicazione o il tuo ambiente di sviluppo.',
    'trust_github' => 'Vedi su GitHub',

    'faq_title' => 'Domande frequenti',
    'faq' => [
        ['q' => 'Che cos’è Scoriet?', 'a' => 'Scoriet è un generatore di applicazioni e codice open source basato su template (strumento RAD). Trasforma uno schema di database in un’applicazione completa con login, amministrazione del database, moduli, report e finestre di ricerca.'],
        ['q' => 'Per quali linguaggi e framework può generare Scoriet?', 'a' => 'Esistono template per C#, Java / Spring Boot, Laravel / PHP, Rust, Flutter, React e altro. Poiché la generazione è interamente basata su template, qualsiasi linguaggio o framework può essere aggiunto con i tuoi template.'],
        ['q' => 'Come lavora Scoriet con gli assistenti di programmazione IA?', 'a' => 'Scoriet genera le fondamenta: login, modello dati, moduli, elenchi e report. Il tuo assistente IA costruisce sopra la logica di business invece di partire da una cartella vuota. Così risparmi token, tempo e denaro e mantieni un’architettura coerente.'],
        ['q' => 'Posso modificare il codice generato?', 'a' => 'Sì, il codice ti appartiene. Scoriet mostra quali file hai modificato, permette di confrontarli e può riportare le tue modifiche nella generazione successiva tramite reverse engineering.'],
        ['q' => 'Scoriet è gratuito?', 'a' => 'Scoriet è open source e può essere scaricato da GitHub. La versione ospitata su scoriet.dev offre un piano gratuito per iniziare.'],
        ['q' => 'I template dello store sono sicuri?', 'a' => 'I template dello store vengono controllati automaticamente contro il codice malevolo e revisionati dalla community. Ogni modifica deve essere approvata prima della pubblicazione.'],
    ],
];
