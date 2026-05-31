# Template-Test-Serie: DB-Depend

Tests aller Template-Konstrukte, die **mit Datenbank-Kontext** arbeiten — Tabellen, Felder, Constraints, Foreign Keys, ENUM-Werte, GENERATED columns.
Stand: 2026-05-23

## Voraussetzungen

Ein importiertes Schema mit mindestens:
- **Master-Tabelle** mit verschiedenen Feldtypen (z.B. `users`)
- **Lookup-Tabelle** (z.B. `user_groups`)
- **Foreign Key** Master → Lookup (z.B. `users.ug_no` → `user_groups.ug_no`)
- Idealerweise mindestens je eines von: VARCHAR, INT/BIGINT, DECIMAL, DATE, DATETIME, TIMESTAMP, ENUM, SET, JSON, BLOB, GENERATED column
- 2 aktivierte Sprachen, **Default-Sprache NICHT Englisch**

Das User-Test-Schema mit `users` + `user_groups` aus der db_free-Serie passt perfekt.

## Test-Setup im Scoriet-UI

1. Bestehendes Test-Projekt vom db_free-Setup wiederverwenden (oder neu anlegen)
2. Schema verknüpfen
3. Neues Template anlegen — z.B. "DB-Depend Tests"
4. Pro Test-Datei einen File-Eintrag mit dem angegebenen `file_type` anlegen + Inhalt reinkopieren
5. Im **DebugManualGeneratorPanel** Tabelle + ggf. Sprache wählen → testen
6. Oder im **CodeGenerationPanel** komplett generieren

## Test-Dateien

| # | Datei | file_type | Was wird getestet |
|---|---|---|---|
| 01 | `01_table_basics.txt` | `db_table_file` | Tabellen-Variablen `{:tablename:}`, `{:filename:}`, naming variants, has-flags |
| 02 | `02_fields_loop.txt` | `db_table_file` | `{:for nmaxitems:}` + alle `{:item.*:}`-Properties inkl. neue structured args |
| 03 | `03_fields_filtered.txt` | `db_table_file` | Loop-Varianten: `nokey`, `nokeyall`, `noblob`, `nobinaryblob` |
| 04 | `04_keys_constraints.txt` | `db_table_file` | `{:for nmaxkeys:}` + `{:for nmaxconstraints:}` |
| 05 | `05_foreign_keys.txt` | `db_table_file` | `{:for nmaxforeignkeys:}` |
| 06 | `06_enum_set_iteration.txt` | `db_table_file` | `{:for item.enum_values:}` für ENUM/SET-Werte (neue strukturierte Form) |
| 07 | `07_generated_column.txt` | `db_table_file` | GENERATED columns erkennen + Expression ausgeben |
| 08 | `08_conditionals_per_field.txt` | `db_table_file` | If/elseif basierend auf `item.type`, Flags, `item.size` etc. |
| 09 | `09_tables_loop.txt` | `project_file` | `{:for nmaxtables:}` mit `{:table.*:}` |
| 10 | `10_nested_loops.txt` | `project_file` | `nmaxtables` × `nmaxitems` verschachtelt |
| 11 | `11_filename_per_table_%1.txt` | `db_table_file` | Filename mit `%1` (table), `%10` (Pascal), `%11` (UPPER) |
| 12 | `12_filename_per_table_lang_%1_%2.txt` | `db_table_file_languages` | `%1` × `%2` — generiert Tabellen × Sprachen Dateien |

## Erwartete Output-Volumen

Bei 2 Tabellen (`users`, `user_groups`) und 2 Sprachen (de, en):

| Test | Erwartete Output-Files |
|---|---|
| 01–08 | Je Tabelle 1× = **2 Files** |
| 09–10 | 1× (project-level) |
| 11 | Je Tabelle 1× mit aufgelöstem Namen, z.B. `users_Users_USERS.txt` |
| 12 | Tabellen × Sprachen = **4 Files** |

## Validierungs-Checkliste

Für jeden Test:

- [ ] Inhalt vollständig ersetzt — keine `{:...:}` Platzhalter im Output
- [ ] Alle Felder der Tabelle auftauchen (nicht durch `generation_mode='excluded'` versehentlich gefiltert)
- [ ] ENUM/SET-Werte iterierbar als Array
- [ ] GENERATED column erkennbar
- [ ] FK-Beziehung korrekt aufgelöst (`referenced_table`, `referenced_field`)
- [ ] Filename-Platzhalter aufgelöst (im ZIP-Output sichtbar)

## Hinweise zu `{:value:}` im Enum-Loop

`{:for item.enum_values:}` iteriert ein einfaches String-Array. Innerhalb des Loops greift man auf den aktuellen Wert mit `{:value:}` zu (analog zu wie `{:i:}` für den Index). Falls die Engine das anders implementiert (z.B. `{:item.enum_values[i]:}`), siehst du das im Test 06 — Anpassung an die tatsächliche Engine-Konvention dann nötig.
