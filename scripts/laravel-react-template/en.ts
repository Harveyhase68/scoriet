import type { Translations } from '../types';

export const en: Translations = {
  // Toast
  toastSuccess: 'Success',
  toastError: 'Error',
  toastInfo: 'Info',
  toastWarning: 'Warning',

  // TopBar
  topbarToggleNav: 'Toggle Navigation',
  topbarBrand: 'Laravel React Template',

  // Navigation Panel
  navCollapse: 'Collapse Menu',
  navExpand: 'Expand Menu',
  navWelcome: 'Welcome',
{:for nmaxtables:}
  nav{:table.filepascalcase:}: '{:table.caption:}',
{:endfor:}
  navSettings: 'Settings',
  navThemeDark: 'Dark',
  navThemeLight: 'Light',
  navThemeGreen: 'Green',
  navThemeAuto: 'Auto',
  navTheme: 'Theme',
  navLanguage: 'Language',

{:for nmaxtables:}
  // {:table.caption:} Management Panel
  {:table.filecamelcase:}ManagementPanelTitle: '{:table.filesingularpascalcase:} Management',
  {:table.filecamelcase:}ManagementPanelSubtitle: 'Manage your {:table.caption:}',
  {:table.filecamelcase:}ManagementPanelbtnAddRecord: '+ Add record',
  {:table.filecamelcase:}ManagementPanelbtnView: 'View',
  {:table.filecamelcase:}ManagementPanelbtnEdit: 'Edit',
  {:table.filecamelcase:}ManagementPanelbtnPrint: 'Print',
  {:table.filecamelcase:}ManagementPanelbtnDelete: 'Delete',
  {:table.filecamelcase:}ManagementPanelbtnCancel: 'Cancel',
  {:table.filecamelcase:}ManagementPanelbtnSave: 'Save Changes',
  {:table.filecamelcase:}ManagementPanelbtnCreate: 'Create',
    
{:for nmaxitems:}
{:if item.isblob:}
  // Image {:table.filename:}
  {:table.filecamelcase:}{:item.pascalcase:}ColImage: 'Image',
  {:table.filecamelcase:}{:item.pascalcase:}FormImage: 'Product Image',
  {:table.filecamelcase:}{:item.pascalcase:}FormImageSelect: 'Select Image',
  {:table.filecamelcase:}{:item.pascalcase:}FormImageRemove: 'Remove Image',
  {:table.filecamelcase:}{:item.pascalcase:}FormImageHint: 'Max. 5 MB (JPG, PNG, GIF, WebP)',
  {:table.filecamelcase:}{:item.pascalcase:}FormNoImage: 'No image',
    
{:endif:}
{:endfor:}
{:endfor:}

  // Table Headers
{:for nmaxtables:}
  // For File {:table.filename:}
{:for nmaxitems:}
  {:table.filecamelcase:}Col{:item.name:}: '{:item.caption:}',
{:endfor:}
    
{:endfor:}
  // Form Labels
{:for nmaxtables:}
  // For File {:table.filename:}
{:for nmaxitems:}    
  {:table.filecamelcase:}Form{:item.pascalcase:}: '{:item.caption:}',
{:endfor:}
    
{:endfor:}
  // Dialog
  dialogAddTitle: 'Add new record',
  dialogEditTitle: 'Edit record',
  dialogViewTitle: 'View record',
  dialogDeleteTitle: 'Confirm Deletion',
  dialogDeleteMessage: 'Are you sure you want to delete this record? This action cannot be undone.',
  dialogDeleteConfirm: 'Delete',
  dialogDeleteCancel: 'Cancel',

  // Messages
  msgCreated: 'Record created successfully.',
  msgUpdated: 'Record updated successfully.',
  msgDeleted: 'Record deleted successfully.',
  msgLoadError: 'Failed to load data: ',
  msgSaveError: 'Failed to save record: ',
  msgDeleteError: 'Failed to delete record: ',

  // Validation
  valRequired: 'This field is required.',
  valMaxLength: 'Maximum length exceeded.',
  valUnique: 'This value must be unique.',

  // Status
  statusYes: 'Yes',
  statusNo: 'No',
  statusActive: 'Active',
  statusInactive: 'Inactive',

  // Pagination
  paginatorTemplate: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
  emptyMessage: 'No records found.',

  // Print
  printTitle: 'Print Preview',
  printClose: 'Close',

  // Welcome
  welcomeTitle: 'Laravel React Template',
  welcomeSubtitle: 'Select an item from the navigation panel to get started.',

{:for nmaxtables:}
  // List {:table.filesingularpascalcase:}
  {:table.filecamelcase:}PrintList: 'Print List',
  {:table.filecamelcase:}PrintListTitle: 'Print {:table.filesingularpascalcase:} List',
  {:table.filecamelcase:}PrintListFrom: 'From {:table.filesingularpascalcase:} No',
  {:table.filecamelcase:}PrintListTo: 'To {:table.filesingularpascalcase:} No',
  {:table.filecamelcase:}PrintListBtnPrint: 'Print',
  {:table.filecamelcase:}PrintListHeading: '{:table.filesingularpascalcase:} List',
  {:table.filecamelcase:}PrintListRange: '{:table.filesingularpascalcase:} No {from} - {to}',
    
{:endfor:}
{:for nmaxtables:}
{:for nmaxforeignkeys:}
  // Quick-Add {:foreign.referencedtable:} from {:table.caption:}
  {:table.filepascalcase:}AddRelated{:foreign.referencedtablepascalcase:}Title: 'Add new {:foreign.referencedtablepascalcase:}',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}No: '{:foreign.referencedtablepascalcase:} Number',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}Name: '{:foreign.referencedtablepascalcase:} Name',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}Created: '{:foreign.referencedtablepascalcase:} created successfully.',
  {:table.filecamelcase:}AddRelated{:foreign.referencedtablepascalcase:}SaveError: 'Failed to save: ',
    
{:endfor:}
{:endfor:}
};