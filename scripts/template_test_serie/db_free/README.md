# Template-Test-Serie: DB-Free

Tests aller Template-Konstrukte, die **OHNE Datenbank-Schema** funktionieren.
Stand: 2026-05-22

## Test-Setup im Scoriet-UI

1. Neues **Projekt** anlegen (z.B. "TestProject")
2. **2 Sprachen** aktivieren — Default **nicht Englisch** (z.B. Deutsch + Englisch, Default = Deutsch)
3. Ein **Schema** verknüpfen (auch wenn die Tests db-frei sind, brauchen wir es für `{:projectdbname:}` / `{:projectdbdesc:}`)
4. Neues **Template** anlegen — z.B. "Template Tests"
5. Pro Test-Datei: Im Template einen File-Eintrag anlegen mit dem **angegebenen file_type**, dann den Inhalt der entsprechenden `.txt` reinkopieren
6. Im **CodeGenerationPanel** das Projekt + Template + Sprachen auswählen → generieren
7. Im **DebugManualGeneratorPanel** kann jede Datei einzeln getestet werden (Prepared-Code + Result-Tab)

## Test-Dateien

| # | Datei | file_type | Was wird getestet |
|---|---|---|---|
| 01 | `01_globals_basic.txt` | `project_file` | Reine Projekt-Variablen, System-Vars, Template-Meta |
| 02 | `02_globals_with_language.txt` | `project_file_languages` | `{:selectedlanguage:}` + Locale-Vars (1× pro Sprache generiert) |
| 03 | `03_languages_loop.txt` | `project_file` | `{:for nmaxlanguages:}` mit allen `language.*` Subfeldern |
| 04 | `04_conditions.txt` | `project_file` | `{:if:}`/`{:elseif:}`/`{:else:}`/`{:endif:}` + Operatoren |
| 05 | `05_switch.txt` | `project_file` | `{:switch:}`/`{:case:}`/`{:default:}`/`{:break:}` |
| 06 | `06_code_block.txt` | `project_file` | `{:code:}...{:codeend:}` JS-Block |
| 07 | `07_filename_placeholders_%9[l]_%6[-]_%7[-].txt` | `project_file` | `%9`/`%6`/`%7`/`%8` Platzhalter im Dateinamen |
| 08 | `08_filename_lang_%2_%9[u].txt` | `project_file_languages` | `%2` (lang) + `%9[u]` im Dateinamen (1× pro Sprache) |

## Erwartete Generation

Bei 2 aktivierten Sprachen (de, en):

| Eingangsdatei | Erwartete Ausgabe(n) |
|---|---|
| 01 | 1× `01_globals_basic.txt` |
| 02 | 2× `02_globals_with_language.txt` (jeweils anderer `selectedlanguage`-Wert) |
| 03 | 1× (Loop läuft INNERHALB der Datei) |
| 04, 05, 06 | jeweils 1× |
| 07 | 1× z.B. `07_filename_placeholders_testproject_2026-05-22_09-50-34.txt` |
| 08 | 2× z.B. `08_filename_lang_de_TESTPROJECT.txt` + `08_filename_lang_en_TESTPROJECT.txt` |

## Validierungs-Checkliste

Für jede Datei prüfen:

- [ ] **Inhalt korrekt ersetzt** — keine `{:xxx:}` Platzhalter im Output
- [ ] **Keine Fehlermeldungen** im Debug-Panel ("Prepared Code" + "Result"-Tab beide leer von Errors)
- [ ] **Sprachen-Variation funktioniert** (bei `_languages`-Typen unterschiedlicher Output)
- [ ] **Counter stimmen** (`{:nmaxlanguages:}` = 2, `{:nmaxtables:}` = Schema-Tabellen-Anzahl)
- [ ] **Locale-Vars wechseln** je nach `{:selectedlanguage:}` (Datumsformat etc.)
- [ ] **Filename-Platzhalter aufgelöst** (im Output-ZIP der finale Dateiname checken)
