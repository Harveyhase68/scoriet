export type SupportedLanguage = 'en' | 'de';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
];

export interface Translations {
  // Toast
  toastSuccess: string;
  toastError: string;
  toastInfo: string;
  toastWarning: string;

  // TopBar
  topbarToggleNav: string;
  topbarBrand: string;

  // Navigation Panel
  navCollapse: string;
  navExpand: string;
  navWelcome: string;
  navProducts: string;
  navSettings: string;
  navThemeDark: string;
  navThemeLight: string;
  navThemeGreen: string;
  navThemeAuto: string;
  navTheme: string;
  navLanguage: string;

  // Product Management Panel
  panelTitle: string;
  panelSubtitle: string;
  btnAddRecord: string;
  btnView: string;
  btnEdit: string;
  btnPrint: string;
  btnDelete: string;
  btnCancel: string;
  btnSave: string;
  btnCreate: string;

  // Table Headers
  colProdNo: string;
  colName: string;
  colGroup: string;
  colDescription: string;
  colCreated: string;
  colSpecialOffer: string;
  colOfferExpires: string;
  colActions: string;

  // Form Labels
  formProdNo: string;
  formProdName: string;
  formProdGroup: string;
  formDescription: string;
  formCreated: string;
  formSpecialOffer: string;
  formOfferExpires: string;
  formSelectGroup: string;

  // Dialog
  dialogAddTitle: string;
  dialogEditTitle: string;
  dialogViewTitle: string;
  dialogDeleteTitle: string;
  dialogDeleteMessage: string;
  dialogDeleteConfirm: string;
  dialogDeleteCancel: string;

  // Messages
  msgCreated: string;
  msgUpdated: string;
  msgDeleted: string;
  msgLoadError: string;
  msgSaveError: string;
  msgDeleteError: string;

  // Validation
  valRequired: string;
  valMaxLength: string;
  valUnique: string;

  // Status
  statusYes: string;
  statusNo: string;
  statusActive: string;
  statusInactive: string;

  // Pagination
  paginatorTemplate: string;
  emptyMessage: string;

  // Image
  colImage: string;
  formImage: string;
  formImageSelect: string;
  formImageRemove: string;
  formImageHint: string;
  formNoImage: string;

  // Print
  printTitle: string;
  printClose: string;

  // Welcome
  welcomeTitle: string;
  welcomeSubtitle: string;

  // List Print
  btnPrintList: string;
  printListTitle: string;
  printListFrom: string;
  printListTo: string;
  printListBtnPrint: string;
  printListHeading: string;
  printListRange: string;

  // Product Group
  addGroupTitle: string;
  addGroupNo: string;
  addGroupName: string;
  msgGroupCreated: string;
  msgGroupSaveError: string;
}