import type { Translations } from '../types';

export const de: Translations = {
  // Toast
  toastSuccess: 'Erfolg',
  toastError: 'Fehler',
  toastInfo: 'Info',
  toastWarning: 'Warnung',

  // TopBar
  topbarToggleNav: 'Navigation umschalten',
  topbarBrand: 'Laravel React Template',

  // Navigation Panel
  navCollapse: 'Men\u00fc einklappen',
  navExpand: 'Men\u00fc ausklappen',
  navWelcome: 'Willkommen',
{:for nmaxtables:}
  nav{:table.filepascalcase:}: '{:table.caption:}',
{:endfor:}
  navSettings: 'Einstellungen',
  navThemeDark: 'Dunkel',
  navThemeLight: 'Hell',
  navThemeGreen: 'Gr\u00fcn',
  navThemeAuto: 'Auto',
  navTheme: 'Design',
  navLanguage: 'Sprache',

{:for nmaxtables:}
  // {:table.caption:} Management Panel
  {:table.filecamelcase:}ManagementPanelTitle: '{:table.filesingularpascalcase:} Verwaltung',
  {:table.filecamelcase:}ManagementPanelSubtitle: 'Verwalten Sie Ihre {:table.caption:}',
  {:table.filecamelcase:}ManagementPanelbtnAddRecord: '+ Datensatz hinzuf\u00fcgen',
  {:table.filecamelcase:}ManagementPanelbtnView: 'Anzeigen',
  {:table.filecamelcase:}ManagementPanelbtnEdit: 'Bearbeiten',
  {:table.filecamelcase:}ManagementPanelbtnPrint: 'Drucken',
  {:table.filecamelcase:}ManagementPanelbtnDelete: 'L\u00f6schen',
  {:table.filecamelcase:}ManagementPanelbtnCancel: 'Abbrechen',
  {:table.filecamelcase:}ManagementPanelbtnSave: '\u00c4nderungen speichern',
  {:table.filecamelcase:}ManagementPanelbtnCreate: 'Erstellen',
    
{:for nmaxitems:}
{:if item.isblob:}
  // Image
  {:table.filecamelcase:}{:item.pascalcase:}ColImage: 'Bild',
  {:table.filecamelcase:}{:item.pascalcase:}FormImage: 'Produktbild',
  {:table.filecamelcase:}{:item.pascalcase:}FormImageSelect: 'Bild ausw\u00e4hlen',
  {:table.filecamelcase:}{:item.pascalcase:}FormImageRemove: 'Bild entfernen',
  {:table.filecamelcase:}{:item.pascalcase:}FormImageHint: 'Max. 5 MB (JPG, PNG, GIF, WebP)',
  {:table.filecamelcase:}{:item.pascalcase:}FormNoImage: 'Kein Bild',
{:endif:}
{:endfor:}
{:endfor:}

  // Table Headers
{:for nmaxtables:}
  // For File {:table.filename:}
{:for nmaxitems:}
  col{:item.name:}: '{:item.caption:}',
{:endfor:}

{:endfor:}
  // Form Labels
{:for nmaxtables:}
  // For File {:table.filename:}
{:for nmaxitems:}
  form{:item.pascalcase:}: '{:item.caption:}',
{:endfor:}

{:endfor:}
  // Dialog
  dialogAddTitle: 'Neuen Datensatz hinzuf\u00fcgen',
  dialogEditTitle: 'Datensatz bearbeiten',
  dialogViewTitle: 'Datensatz anzeigen',
  dialogDeleteTitle: 'L\u00f6schung best\u00e4tigen',
  dialogDeleteMessage: 'M\u00f6chten Sie diesen Datensatz wirklich l\u00f6schen? Diese Aktion kann nicht r\u00fcckg\u00e4ngig gemacht werden.',
  dialogDeleteConfirm: 'L\u00f6schen',
  dialogDeleteCancel: 'Abbrechen',

  // Messages
  msgCreated: 'Datensatz erfolgreich erstellt.',
  msgUpdated: 'Datensatz erfolgreich aktualisiert.',
  msgDeleted: 'Datensatz erfolgreich gel\u00f6scht.',
  msgLoadError: 'Fehler beim Laden der Daten: ',
  msgSaveError: 'Fehler beim Speichern des Datensatzes: ',
  msgDeleteError: 'Fehler beim L\u00f6schen des Datensatzes: ',

  // Validation
  valRequired: 'Dieses Feld ist erforderlich.',
  valMaxLength: 'Maximale L\u00e4nge \u00fcberschritten.',
  valUnique: 'Dieser Wert muss eindeutig sein.',

  // Status
  statusYes: 'Ja',
  statusNo: 'Nein',
  statusActive: 'Aktiv',
  statusInactive: 'Inaktiv',

  // Pagination
  paginatorTemplate: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
  emptyMessage: 'Keine Datens\u00e4tze gefunden.',

  // Print
  printTitle: 'Druckvorschau',
  printClose: 'Schlie\u00dfen',

  // Welcome
  welcomeTitle: 'Laravel React Template',
  welcomeSubtitle: 'W\u00e4hlen Sie einen Eintrag aus dem Navigationsmen\u00fc um zu beginnen.',

{:for nmaxtables:}
  // List {:table.filesingularpascalcase:}
  {:table.filecamelcase:}PrintListTitle: 'Liste drucken',
  {:table.filecamelcase:}printListTitle: '{:table.filesingularpascalcase:} Liste drucken',
  {:table.filecamelcase:}printListFrom: 'Von {:table.filesingularpascalcase:}',
  {:table.filecamelcase:}printListTo: 'Bis {:table.filesingularpascalcase:}',
  {:table.filecamelcase:}printListBtnPrint: 'Drucken',
  {:table.filecamelcase:}printListHeading: '{:table.filesingularpascalcase:} Liste',
  {:table.filecamelcase:}printListRange: '{:table.filesingularpascalcase:} Nr {from} - {to}',
  
{:endfor:}
{:for nmaxtables:}
{:for nmaxforeignkeys:}
  // Quick-Add {:foreign.referencedtable:} from {:table.caption:}
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}Title: 'Neue/n {:foreign.referencedtablepascalcase:} anlegen',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}No: '{:foreign.referencedtablepascalcase:} Nr.',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}Name: '{:foreign.referencedtablepascalcase:} Name',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}Created: '{:foreign.referencedtablepascalcase:} erfolgreich erstellt.',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}SaveError: 'Fehler beim Speichern: ',
{:endfor:}

{:endfor:}
};