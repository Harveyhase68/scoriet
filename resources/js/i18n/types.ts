// Translation system for Scoriet
export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string; // CSS flag class or fallback emoji
  flagClass: string; // CSS class for flag icons
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', flagClass: 'flag-us' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', flagClass: 'flag-de' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', flagClass: 'flag-fr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', flagClass: 'flag-es' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', flagClass: 'flag-it' },
];

export interface Translations {

  // app\Console\Commands\DebugSchemas.php

  // app\Console\Commands\DemoReset.php

  // app\Console\Commands\FixTemplateFilePaths.php

  // app\Console\Commands\TestObservers.php

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas50: string;

  // app\Console\Commands\TestTreeGenerator.php

  // app\Console\Commands\TestTreeUpdate.php

  // app\Http\Controllers\Admin\PageController.php

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller83: string;

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: string;

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller844: string;
  projectcontroller849: string;

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller288: string;
  schemacontroller810: string;
  schemacontroller1328: string;

  // app\Http\Controllers\Api\SchemaTranslationController.php

  // app\Http\Controllers\Api\SettingsController.php

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller649: string;
  templatecontroller717: string;
  templatecontroller827: string;
  templatecontroller936: string;

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller51: string;
  translationexportcontroller78: string;

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller301: string;

  // app\Http\Controllers\AuthController.php
  authcontroller156: string;
  authcontroller492: string;

  // app\Http\Controllers\Auth\PasswordResetLinkController.php

  // app\Http\Controllers\CustomTokenController.php

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller288: string;

  // app\Http\Controllers\PageController.php

  // app\Http\Controllers\ProjectApplicationController.php

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller150: string;
  projectinvitationcontroller179: string;
  projectinvitationcontroller358: string;

  // app\Http\Controllers\QueueTestController.php

  // app\Http\Controllers\SchemaController.php
  schemacontroller132: string;
  schemacontroller193: string;

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller226: string;

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: string;

  // app\Http\Controllers\TeamController.php
  teamcontroller117: string;
  teamcontroller191: string;
  teamcontroller210: string;
  teamcontroller236: string;
  teamcontroller241: string;

  // app\Http\Controllers\TeamInvitationController.php

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: string;
  templatecontroller585: string;

  // app\Http\Controllers\UserController.php

  // app\Http\Middleware\CheckSystemUser.php

  // app\Http\Middleware\EnsureUserIsAdmin.php

  // app\JobsegenerateProjectGenerationTree.php

  // app\Jobs\RegenerateProjectGenerationTree.php

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: string;

  // app\Models\FloatingSchema.php

  // app\Models\ProjectApplication.php

  // app\Models\Project.php

  // app\Models\SchemaVersion.php

  // app\Notifications\NewUserRegistered.php

  // app\Observers\ProjectGenerationTreeObserver.php

  // app\Observers\ProjectObserver.php

  // app\Observers\ProjectSchemaObserver.php

  // app\Observers\ProjectTemplateUsageObserver.php

  // app\Observers\SchemaTableObserver.php

  // app\Observers\SchemaVersionObserver.php

  // app\Observers\TemplateFileObserver.php

  // app\Observers\TemplateObserver.php

  // appotificationsewUserRegistered.php

  // app\Services\MySQLParser.php

  // app\Services\ProjectFileTreeGenerator.php

  // app\Services\SchemaStorageService.php

  // app\Services\SimpleFixedTemplateEngine.php

  // app\Services\SimpleTemplateEngine.php

  // app\Services\SQLParser.php

  // app\Services\StepByStepTemplateEngine.php

  // app\Services\UltimateTemplateEngine.php

  // resources/js\app.tsx
  app48: string;

  // resources/js\Components\AuthModals\AuthModalManager.tsx

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: string;
  authmodalsegistermodal109: string;
  authmodalsegistermodal203: string;
  authmodalsegistermodal239: string;
  authmodalsegistermodal293: string;
  authmodalsegistermodal312: string;
  authmodalsegistermodal335: string;
  authmodalsegistermodal388: string;

  // resources/js\Components\AuthModalsesetPasswordModal.tsx
  authmodalsesetpasswordmodal73: string;
  authmodalsesetpasswordmodal79: string;
  authmodalsesetpasswordmodal122: string;
  authmodalsesetpasswordmodal124: string;
  authmodalsesetpasswordmodal127: string;
  authmodalsesetpasswordmodal131: string;
  authmodalsesetpasswordmodal162: string;
  authmodalsesetpasswordmodal265: string;
  authmodalsesetpasswordmodal319: string;

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: string;
  forgotpasswordmodal46: string;
  forgotpasswordmodal73: string;

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal113: string;

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: string;
  forgotpasswordmodal131: string;

  // resources/js/Components/AuthModals/LoginModal.tsx

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal88: string;
  loginmodal140: string;
  loginmodal142: string;
  loginmodal184: string;
  loginmodal189: string;
  loginmodal212: string;

  // resources/js/Components/AuthModals/LoginModal.tsx

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal246: string;

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginDemoTextHeader: string;
  LoginDemoDescription: string;
  LoginDemoAdmin: string;
  LoginDemoUser: string;
  LoginToolTip: string;
  LoginEmailOrUserName: string;
  LoginEmailOrUserNameHint: string;
  LoginPassword: string;

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal317: string;

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: string;
  LoginStayLoggedInTooltip: string;
  LoginDoLogin: string;
  LoginButton: string;
  LoginRegister: string;
  LoginForgotPassword: string;

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal43: string;
  planmodal49: string;
  planmodal50: string;
  planmodal51: string;
  planmodal58: string;
  planmodal62: string;
  planmodal65: string;
  planmodal116: string;
  planmodal143: string;
  planmodal151: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal115: string;
  profilemodal127: string;
  profilemodal146: string;
  profilemodal186: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: string;
  profilemodal246: string;
  profilemodal273: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal305: string;
  profilemodal334: string;
  profilemodal346: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: string;
  profileTab: string;
  fullName: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx

  // resources/js/Components/AuthModals/ProfileModal.tsx
  emailAddress: string;
  profilemodal463: string;
  preferredLanguage: string;
  languageDescription: string;

  // Email Notification Settings
  emailNotifications: string;
  emailSystemNotifications: string;
  emailSystemNotificationsDesc: string;
  emailUserNotifications: string;
  emailUserNotificationsDesc: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal510: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  updating: string;
  updateProfile: string;
  passwordTab: string;
  currentPassword: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal555: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  newPassword: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal573: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  confirmPassword: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal591: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  changing: string;
  changePassword: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal611: string;
  profilemodal616: string;
  profilemodal640: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleteTab: string;
  profilemodal714: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal718: string;
  profilemodal719: string;
  profilemodal720: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal725: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx

  // resources/js/Components/AuthModals/ProfileModal.tsx

  // resources/js\Components\AuthModals\ProfileModal.tsx

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: string;
  saving: string;
  deleteAccount: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: string;
  registermodal84: string;
  registermodal94: string;

  // resources\js\Components\AuthModals\RegisterModal.tsx

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: string;
  registermodal203: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal261: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx

  // resources/js/Components/AuthModals/RegisterModal.tsx

  // resources/js\Components\AuthModals\RegisterModal.tsx

  // resources/js/Components/AuthModals/RegisterModal.tsx

  // resources/js\Components\AuthModals\RegisterModal.tsx

  // resources/js/Components/AuthModals/RegisterModal.tsx

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal379: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: string;
  databaseexportmodal114: string;
  databaseexportmodal169: string;
  databaseexportmodal195: string;
  databaseexportmodal214: string;
  databaseexportmodal216: string;
  databaseexportmodal225: string;
  databaseexportmodal228: string;
  databaseexportmodal269: string;
  databaseexportmodal285: string;

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: string;

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal338: string;

  // resources/js/Components/DatabaseExportModal.tsx

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: string;

  // resources/js/Components/DatabaseExportModal.tsx

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal363: string;
  databaseexportmodal406: string;
  databaseexportmodal412: string;

  // resources/js\Components\EmailVerification.tsx
  emailverification55: string;
  emailverification59: string;
  emailverification68: string;

  // resources/js/Components/EmailVerification.tsx

  // resources/js\Components\EmailVerification.tsx
  emailverification141: string;

  // resources/js/Components/EmailVerification.tsx

  // resources/js\Components\EmailVerification.tsx
  emailverification155: string;

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: string;
  errorfallback58: string;
  errorfallback65: string;
  errorfallback65_2: string;
  errorfallback75: string;

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: string;

  // resources/js\Components\ErrorFallback.tsx

  // resources/js\Components\LanguageSelector.tsx

  // resources/js/Components/LanguageSelector.tsx

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: string;
  applicationsmodal78: string;
  applicationsmodal85: string;
  applicationsmodal125: string;
  applicationsmodal143: string;
  applicationsmodal228: string;
  applicationsmodal234: string;
  applicationsmodal301: string;
  applicationsmodal313: string;
  applicationsmodal322: string;
  applicationsmodal329: string;
  applicationsmodal335: string;
  applicationsmodal342: string;
  applicationsmodal348: string;
  applicationsmodal354: string;
  applicationsmodal374: string;
  applicationsmodal412: string;
  applicationsmodal420: string;
  applicationsmodal421: string;
  applicationsmodal432: string;
  applicationsmodal439: string;

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: string;

  // resources/js\Components\Modals\CreateTableModal.tsx

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: string;

  // resources/js\Components\Modals\CreateTableModal.tsx

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: string;
  createtablemodal300: string;
  createtablemodal316: string;

  // resources/js\Components\Modals\CreateTableModal.tsx

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal339: string;

  // resources/js\Components\Modals\CreateTableModal.tsx

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal398: string;
  createtablemodal482: string;
  createtablemodal497: string;
  createtablemodal614: string;

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: string;
  createteammodal52: string;

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal103: string;

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: string;

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: string;

  // resources/js\Components\Modals\CreateTeamModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal183: string;
  editprojectmodal197: string;
  editprojectmodal215: string;
  editprojectmodal227: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal240: string;
  editprojectmodal252: string;
  editprojectmodal258: string;
  editprojectmodal569: string;
  
  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: string;

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: string;
  editprojectmodal281: string;

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal332: string;

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: string;

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: string;
  editprojectmodal485: string;
  editprojectmodal486: string;
  editprojectmodal487: string;
  editprojectmodal488: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal506: string;
  editprojectmodal507: string;
  editprojectmodal508: string;
  editprojectmodal509: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: string;

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal602: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: string;

  // resources/js\Components\Modals\EditProjectModal.tsx

  // resources/js/Components/Modals/EditProjectModal.tsx

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal696: string;

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal335: string;

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: string;

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: string;

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: string;

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js/Components/Modals/EditTableModal.tsx

  // resources/js\Components\Modals\EditTableModal.tsx

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: string;
  joincodemodal66: string;
  joincodemodal73: string;
  joincodemodal80: string;
  joincodemodal113: string;
  joincodemodal117: string;
  joincodemodal_toast_detail: string;
  joincodemodal_toast_detail2: string;
  joincodemodal129: string;

  // resources/js/Components/Modals/JoinCodeModal.tsx

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: string;
  joincodemodal157: string;
  joincodemodal158: string;

  // resources/js/Components/Modals/JoinCodeModal.tsx

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: string;
  joincodemodal200: string;

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: string;

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: string;
  joincodemodal220: string;
  joincodemodal247: string;
  joincodemodal299: string;
  joincodemodal306: string;
  joincodemodal316: string;

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: string;
  manageteammodal139: string;
  manageteammodal155: string;
  manageteammodal181: string;
  manageteammodal189: string;
  manageteammodal206: string;
  manageteammodal283: string;
  manageteammodal312: string;
  manageteammodal316: string;
  manageteammodal320: string;
  manageteammodal328: string;

  // resources/js/Components/Modals/ManageTeamModal.tsx

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal383: string;
  manageteammodal388: string;
  manageteammodal394: string;
  manageteammodal395: string;
  manageteammodal404: string;
  manageteammodal437: string;
  manageteammodal469: string;
  manageteammodal477: string;
  manageteammodal485: string;
  manageteammodal534: string;

  // resources/js/Components/Modals/ManageTeamModal.tsx

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal191: string;
  membermodal244: string;
  membermodal316: string;
  membermodal323: string;
  membermodal335: string;
  membermodal348: string;
  membermodal432: string;
  membermodal479: string;
  membermodal536: string;
  membermodal549: string;
  membermodal590: string;
  membermodal609: string;

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal70: string;
  pendinginvitationmodal76: string;
  pendinginvitationmodal112: string;
  pendinginvitationmodal121: string;
  pendinginvitationmodal160: string;
  pendinginvitationmodal169: string;
  pendinginvitationmodal176: string;
  pendinginvitationmodal189: string;

  // resources/js/Components/Modals/PendingInvitationModal.tsx

  // resources/js\Components\Modals\PendingInvitationModal.tsx

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal86: string;
  projectinvitationsmodal93: string;
  projectinvitationsmodal148: string;
  projectinvitationsmodal193: string;
  projectinvitationsmodal220: string;
  projectinvitationsmodal243: string;
  projectinvitationsmodal261: string;
  projectinvitationsmodal266: string;
  projectinvitationsmodal275: string;
  projectinvitationsmodal286: string;
  projectinvitationsmodal287: string;
  projectinvitationsmodal288: string;
  projectinvitationsmodal289: string;
  projectinvitationsmodal305: string;
  projectinvitationsmodal314: string;

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: string;

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal392: string;
  projectinvitationsmodal414: string;
  projectinvitationsmodal420: string;
  projectinvitationsmodal439: string;
  projectinvitationsmodal445: string;

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: string;
  projectmembersmodal63: string;
  projectmembersmodal101: string;
  projectmembersmodal128: string;
  projectmembersmodal134: string;
  projectmembersmodal141: string;
  projectmembersmodal206: string;
  projectmembersmodal221: string;
  projectmembersmodal270: string;

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: string;
  teammodal132: string;
  teammodal146: string;
  teammodal155: string;

  // resources/js/Components/Modals/TeamModal.tsx

  // resources/js\Components\Modals\TeamModal.tsx

  // resources/js/Components/Modals/TeamModal.tsx

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: string;

  // resources/js/Components/Modals/TeamModal.tsx

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: string;

  // resources/js/Components/Modals/TeamModal.tsx

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal240: string;

  // resources/js\Components\Panels\AuthPanel.tsx

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: string;
  cmsadminpanel106: string;
  cmsadminpanel122: string;
  cmsadminpanel129: string;
  cmsadminpanel144: string;
  cmsadminpanel152: string;
  cmsadminpanel170: string;
  cmsadminpanel178: string;
  cmsadminpanel186: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: string;
  cmsadminpanel241: string;
  cmsadminpanel244: string;
  cmsadminpanel245: string;
  cmsadminpanel246: string;
  cmsadminpanel250: string;
  cmsadminpanel279: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel298: string;

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: string;
  cmsadminpanel365: string;
  cmsadminpanel402: string;

  // resources/js\Components\Panels\CodeGenerationPanel.tsx

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: string;

  // resources/js\Components\Panels\CodeGenerationPanel.tsx

  // resources/js/Components/Panels/CodeGenerationPanel.tsx

  // resources/js\Components\Panels\CodeGenerationPanel.tsx

  // resources/js/Components/Panels/CodeGenerationPanel.tsx

  // resources/js\Components\Panels\CodeGenerationPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel152: string;
  databasemanagementpanel221: string;
  databasemanagementpanel245: string;
  databasemanagementpanel259: string;
  databasemanagementpanel261: string;
  databasemanagementpanel294: string;
  databasemanagementpanel301: string;
  databasemanagementpanel330: string;
  databasemanagementpanel336: string;
  databasemanagementpanel339: string;
  databasemanagementpanel382: string;
  databasemanagementpanel391: string;
  databasemanagementpanel438: string;
  databasemanagementpanel447: string;
  databasemanagementpanel529: string;
  databasemanagementpanel536: string;
  databasemanagementpanel585: string;
  databasemanagementpanel594: string;
  databasemanagementpanel683: string;
  databasemanagementpanel714: string;
  databasemanagementpanel743: string;
  databasemanagementpanel749: string;
  databasemanagementpanel756: string;
  databasemanagementpanel763: string;
  databasemanagementpanel771: string;
  databasemanagementpanel772: string;
  databasemanagementpanel776: string;
  databasemanagementpanel777: string;
  databasemanagementpanel778: string;
  databasemanagementpanel798: string;
  databasemanagementpanel803: string;
  databasemanagementpanel840: string;
  databasemanagementpanel843: string;
  databasemanagementpanel849: string;
  databasemanagementpanel861: string;
  databasemanagementpanel876: string;
  databasemanagementpanel886: string;
  databasemanagementpanel893: string;
  databasemanagementpanel905: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: string;
  databasemanagementpanel937: string;
  databasemanagementpanel952: string;
  databasemanagementpanel970: string;
  databasemanagementpanel981: string;
  databasemanagementpanel1043: string;
  databasemanagementpanel1054: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: string;
  databasemanagementpanel1138: string;
  databasemanagementpanel1163: string;
  databasemanagementpanel1217: string;
  databasemanagementpanel1229: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: string;
  databasemanagementpanel1280: string;
  databasemanagementpanel1292: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: string;
  databasemanagementpanel1350: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: string;
  databasemanagementpanel1402: string;

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel127: string;
  debugmanualgeneratorpanel136: string;
  debugmanualgeneratorpanel214: string;
  debugmanualgeneratorpanel217: string;
  debugmanualgeneratorpanel486: string;
  debugmanualgeneratorpanel486a: string;
  debugmanualgeneratorpanel490: string;
  debugmanualgeneratorpanel990: string;
  debugmanualgeneratorpanel990a: string;
  debugmanualgeneratorpanel990b: string;
  debugmanualgeneratorpanel1035: string;
  debugmanualgeneratorpanel1036: string;
  debugmanualgeneratorpanel1037: string;
  debugmanualgeneratorpanel1038: string;
  debugmanualgeneratorpanel1039: string;
  debugmanualgeneratorpanel1047: string;
  debugmanualgeneratorpanel1050: string;
  debugmanualgeneratorpanel1056: string;
  debugmanualgeneratorpanel1060: string;
  debugmanualgeneratorpanel1092: string;
  debugmanualgeneratorpanel1092a: string;
  debugmanualgeneratorpanel1129: string;
  debugmanualgeneratorpanel1129a: string;
  debugmanualgeneratorpanel1144: string;
  debugmanualgeneratorpanel1144a: string;
  debugmanualgeneratorpanel1148: string;
  debugmanualgeneratorpanel1148a: string;
  debugmanualgeneratorpanel1155: string;
  debugmanualgeneratorpanel1155a: string;
  debugmanualgeneratorpanel1201: string;
  debugmanualgeneratorpanel1201a: string;
  debugmanualgeneratorpanel1201b: string;
  debugmanualgeneratorpanel1208: string;
  debugmanualgeneratorpanel1208a: string;
  debugmanualgeneratorpanel1208b: string;
  debugmanualgeneratorpanel1208c: string;
  debugmanualgeneratorpanel1208d: string;
  debugmanualgeneratorpanel1211: string;
  debugmanualgeneratorpanel1211a: string;
  debugmanualgeneratorpanel1211b: string;
  debugmanualgeneratorpanel1214: string;
  debugmanualgeneratorpanel1214a: string;
  debugmanualgeneratorpanel1214b: string;
  debugmanualgeneratorpanel1214c: string;
  debugmanualgeneratorpanel352: string;
  debugmanualgeneratorpanel358: string;
  debugmanualgeneratorpanel420: string;
  debugmanualgeneratorpanel499: string;
  debugmanualgeneratorpanel600: string;
  debugmanualgeneratorpanel746: string;
  debugmanualgeneratorpanel753: string;
  debugmanualgeneratorpanel758: string;
  debugmanualgeneratorpanel763: string;
  debugmanualgeneratorpanel768: string;
  debugmanualgeneratorpanel959: string;
  debugmanualgeneratorpanel970: string;
  debugmanualgeneratorpanel1026: string;
  debugmanualgeneratorpanel1048: string;
  debugmanualgeneratorpanel1093: string;
  debugmanualgeneratorpanel1096: string;
  debugmanualgeneratorpanel1183: string;
  debugmanualgeneratorpanel1210: string;

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1277: string;

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1284: string;

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1293: string;
  debugmanualgeneratorpanel1302: string;
  debugmanualgeneratorpanel1310: string;
  debugmanualgeneratorpanel1319: string;
  debugmanualgeneratorpanel1325: string;
  debugmanualgeneratorpanel1334: string;
  debugmanualgeneratorpanel1342: string;
  debugmanualgeneratorpanel1355: string;
  debugmanualgeneratorpanel1360: string;
  debugmanualgeneratorpanel1369: string;
  debugmanualgeneratorpanel1377: string;
  debugmanualgeneratorpanel1385: string;
  debugmanualgeneratorpanel1396: string;
  debugmanualgeneratorpanel1397: string;
  debugmanualgeneratorpanel1400: string;
  debugmanualgeneratorpanel1473: string;
  debugmanualgeneratorpanel1476: string;
  debugmanualgeneratorpanel1479: string;
  debugmanualgeneratorpanel1482: string;
  debugmanualgeneratorpanel1531: string;
  debugmanualgeneratorpanel1537: string;
  debugmanualgeneratorpanel1564: string;
  debugmanualgeneratorpanel1583: string;
  debugmanualgeneratorpanel1591: string;
  debugmanualgeneratorpanel1679: string;
  debugmanualgeneratorpanel1724: string;
  debugmanualgeneratorpanel1750: string;
  debugmanualgeneratorpanel1755: string;

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel161: string;
  panelsegisterpanel162: string;
  panelsegisterpanel163: string;
  panelsegisterpanel164: string;

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: string;
  panelsewnavigationpanel120: string;
  panelsewnavigationpanel133: string;
  panelsewnavigationpanel138: string;
  panelsewnavigationpanel142: string;
  panelsewnavigationpanel165: string;
  panelsewnavigationpanel184: string;
  panelsewnavigationpanel188: string;
  panelsewnavigationpanel201: string;
  panelsewnavigationpanel211: string;
  panelsewnavigationpanel216: string;
  panelsewnavigationpanel223: string;
  panelsewnavigationpanel228: string;
  panelsewnavigationpanel233: string;
  panelsewnavigationpanel238: string;
  panelsewnavigationpanel246: string;
  panelsewnavigationpanel251: string;
  panelsewnavigationpanel258: string;
  panelsewnavigationpanel263: string;
  panelsewnavigationpanel268: string;
  panelsewnavigationpanel281: string;
  panelsewnavigationpanel285: string;
  panelsewnavigationpanel290: string;
  panelsewnavigationpanel298: string;
  panelsewnavigationpanel320: string;
  panelsewnavigationpanel333: string;
  panelsewnavigationpanel359: string;
  panelsewnavigationpanel384: string;
  panelsewnavigationpanel477: string;
  panelsewnavigationpanel540: string;
  panelsewnavigationpanel544: string;
  panelsewnavigationpanel548: string;
  panelsewnavigationpanel576: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: string;
  filemodal95: string;
  filemodal106: string;
  filemodal111: string;

  // resources/js/Components/Panels/FileModal.tsx

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: string;
  filemodal182: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal232: string;

  // resources/js/Components/Panels/FileModal.tsx

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: string;

  // resources/js/Components/Panels/FileModal.tsx

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: string;
  filemodal334: string;
  filemodal340: string;

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: string;
  forgotpasswordpanel30: string;
  forgotpasswordpanel52: string;
  forgotpasswordpanel55: string;
  forgotpasswordpanel96: string;
  forgotpasswordpanel99: string;

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: string;

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: string;

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel120: string;
  languagemanagementpanel121: string;
  languagemanagementpanel124: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel133: string;
  languagemanagementpanel142: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: string;
  languagemanagementpanel173: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel183: string;
  languagemanagementpanel184: string;
  languagemanagementpanel185: string;
  languagemanagementpanel186: string;
  languagemanagementpanel187: string;
  languagemanagementpanel188: string;
  languagemanagementpanel189: string;
  languagemanagementpanel190: string;
  languagemanagementpanel191: string;
  languagemanagementpanel192: string;
  languagemanagementpanel193: string;
  languagemanagementpanel194: string;
  languagemanagementpanel195: string;
  languagemanagementpanel196: string;
  languagemanagementpanel197: string;
  languagemanagementpanel198: string;
  languagemanagementpanel199: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel251: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: string;
  languagemanagementpanel317: string;
  languagemanagementpanel324: string;
  languagemanagementpanel326: string;
  languagemanagementpanel327: string;
  languagemanagementpanel329: string;
  languagemanagementpanel331: string;
  languagemanagementpanel332: string;
  languagemanagementpanel340: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: string;
  languagemanagementpanel379: string;
  languagemanagementpanel410: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: string;
  languagemanagementpanel431: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: string;
  languagemanagementpanel457: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: string;
  languagemanagementpanel490: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: string;
  languagemanagementpanel511: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx

  // resources/js\Components\Panels\LoginPanel.tsx

  // resources/js/Components/Panels/LoginPanel.tsx

  // resources/js\Components\Panels\LoginPanel.tsx

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel164: string;
  myapplicationspanel228: string;
  myapplicationspanel276: string;
  myapplicationspanel292: string;
  myapplicationspanel322: string;
  myapplicationspanel358: string;

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel133: string;
  newnavigationpanel138: string;
  newnavigationpanel142: string;
  newnavigationpanel315: string;
  newnavigationpanel320: string;
  newnavigationpanel325: string;
  newnavigationpanel357: string;

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: string;
  panelt1143: string;
  panelt1219: string;
  panelt1281: string;
  panelt1287: string;
  panelt1293: string;
  panelt1506: string;
  panelt1791: string;
  panelt1798: string;
  panelt1813: string;
  panelt1833: string;
  panelt1MyTeams: string;
  panelt1MyTemplates: string;
  panelt1MyDatabases: string;
  panelt1842: string;
  panelt1843: string;
  panelt1845: string;
  panelt1848: string;
  panelt1873: string;
  panelt1879: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: string;
  panelt2151: string;
  panelt2405: string;
  panelt2443: string;
  panelt2602: string;
  panelt2704: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: string;
  panelt2826: string;
  panelt2841: string;
  panelt2898: string;
  panelt2920: string;
  panelt21001: string;
  panelt21030: string;
  panelt21054: string;
  panelt21075: string;
  panelt21133: string;
  panelt21144: string;
  panelt21282: string;
  panelt21289: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: string;

  // resources/js/Components/Panels/PanelT2.tsx

  // resources/js\Components\Panels\PanelT2.tsx

  // resources/js/Components/Panels/PanelT2.tsx

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21528: string;
  panelt21530: string;
  panelt21531: string;

  // resources/js/Components/Panels/PanelT2.tsx

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: string;
  panelt21689: string;

  // resources/js/Components/Panels/PanelT2.tsx

  // resources/js\Components\Panels\PanelT2.tsx

  // resources/js/Components/Panels/PanelT2.tsx

  // resources/js\Components\Panels\PanelT2.tsx

  // resources/js/Components/Panels/PanelT3.tsx

  // resources/js\Components\Panels\PanelT3.tsx
  panelt390: string;
  panelt3296: string;
  panelt3297: string;
  panelt3298: string;
  panelt3299: string;

  // resources/js/Components/Panels/PanelT3.tsx

  // resources/js\Components\Panels\PanelT3.tsx

  // resources/js/Components/Panels/PanelT3.tsx
  templatesSearchPlaceholder: string;
  templatesNoTemplatesFound: string;
  templatesColumnCategory: string;
  templatesStatusActive: string;

  // resources/js\Components\Panels\PanelT3.tsx

  // resources/js/Components/Panels/PanelT3.tsx

  // resources/js\Components\Panels\PanelT5.tsx

  // resources/js\Components\Panels\ProfilePanel.tsx

  // resources/js/Components/Panels/ProfilePanel.tsx

  // resources/js\Components\Panels\ProfilePanel.tsx

  // resources/js/Components/Panels/ProfilePanel.tsx

  // resources/js\Components\Panels\ProfilePanel.tsx

  // resources/js/Components/Panels/ProfilePanel.tsx

  // resources/js\Components\Panels\ProfilePanel.tsx

  // resources/js/Components/Panels/ProfilePanel.tsx

  // resources/js\Components\Panels\ProfilePanel.tsx

  // resources/js/Components/Panels/ProfilePanel.tsx

  // resources/js\Components\Panels\ProfilePanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel119: string;
  projectpanel121: string;
  projectpanel232: string;
  projectpanel258: string;
  projectpanel298: string;
  projectpanel301: string;
  projectpanel304: string;
  projectpanel361: string;
  projectpanel369: string;
  projectpanel372: string;
  projectpanel416: string;
  projectpanel562: string;
  projectpanel575: string;
  projectpanel583: string;
  projectpanel589: string;
  projectpanel601: string;
  projectpanel615: string;
  projectpanel626: string;
  projectpanel671: string;
  projectpanel698: string;
  projectpanel706: string;
  projectpanel724: string;
  projectpanel748: string;
  projectpanel754: string;
  projectpanel766: string;
  projectpanel776: string;
  projectpanel786: string;
  projectpanel796: string;
  projectpanel803: string;
  projectpanel815: string;
  projectpanelAttachments: string;
  projectpanelKanban: string;
  navAgileMethod: string;
  projectExport: string;
  projectImport: string;
  projectpanel850: string;
  projectpanel854: string;
  projectpanel892: string;

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: string;

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: string;

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1342: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: string;
  projectpanel1362: string;

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1443: string;
  projectpanel1447: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: string;

  // resources/js\Components\Panels\ProjectPanel.tsx

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: string;
  projectpanel1471: string;
  projectpanel1482: string;
  projectpanel1513: string;

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: string;

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: string;

  // resources/js/Components/Panels/ProjectPanel.tsx

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: string;
  projectsettingspanel151: string;
  projectsettingspanel243: string;
  projectsettingspanel246: string;
  projectsettingspanel251: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: string;
  projectsettingspanel313: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: string;
  projectsettingspanel331: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel344: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel351: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel359: string;
  projectsettingspanel375: string;
  projectsettingspanel382: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel405: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel408: string;
  projectsettingspanel420: string;
  projectsettingspanel463: string;
  projectsettingspanel475: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel489: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel492: string;
  projectsettingspanel501: string;
  projectsettingspanel507: string;
  projectsettingspanel516: string;
  projectsettingspanel522: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: string;
  projectsettingspanel558: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel639: string;
  projectsettingspanel644: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel689: string;
  projectsettingspanel700: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: string;
  projectsettingspanel727: string;
  projectsettingspanel728: string;
  projectsettingspanel733: string;
  projectsettingspanel734: string;
  projectsettingspanel738: string;
  projectsettingspanel742: string;
  projectsettingspanel744: string;
  projectsettingspanel753:  string;
  projectsettingspanel758:  string;
  projectsettingspanel767:  string;
  projectsettingspanel772:  string;
  projectsettingspanel781:  string;
  projectsettingspanel786:  string;
  projectsettingspanel795:  string;
  projectsettingspanel800:  string;
  projectsettingspanel809:  string;
  projectsettingspanel814:  string;
  projectsettingspanel816:  string;
  projectsettingspanel817:  string;
  projectsettingspanel818:  string;
  projectsettingspanel818a: string;
  projectsettingspanel818b: string;
  projectsettingspanel866:  string;
  projectsettingspanel872:  string;
  projectsettingspanel893:  string;
  projectsettingspanel906:  string;
  projectsettingspanel926:  string;
  projectsettingspanel946:  string;
  projectsettingspanel962:  string;
  projectsettingspanel979:  string;
  projectsettingspanel995:  string;
  projectsettingspanel1012: string;
  projectsettingspanel1058: string;
  projectsettingspanel1068: string;
  projectsettingspanel1111: string;
  projectsettingspanel1122: string;
  projectsettingspanel1129: string;
  projectsettingspanel932: string;
  projectsettingspanel1108: string;

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel97: string;
  publicprojectspanel104: string;
  publicprojectspanel183: string;
  publicprojectspanel227: string;
  publicprojectspanel253: string;
  publicprojectspanel266: string;
  publicprojectspanel270: string;
  publicprojectspanel271: string;
  publicprojectspanel276: string;
  publicprojectspanel316: string;
  publicprojectspanel338: string;
  publicprojectspanel342: string;
  publicprojectspanel346: string;
  publicprojectspanel378: string;

  // resources/js/Components/Panels/PublicProjectsPanel.tsx

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: string;

  // resources/js/Components/Panels/PublicProjectsPanel.tsx

  // resources/js\Components\Panels\PublicProjectsPanel.tsx

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: string;

  // resources/js\Components\Panels\PublicProjectsPanel.tsx

  // resources/js\Components\Panels\RegisterPanel.tsx

  // resources/js/Components/Panels/RegisterPanel.tsx

  // resources/js\Components\Panels\RegisterPanel.tsx

  // resources/js/Components/Panels/RegisterPanel.tsx

  // resources/js\Components\Panels\RegisterPanel.tsx

  // resources/js/Components/Panels/RegisterPanel.tsx

  // resources/js\Components\Panels\RegisterPanel.tsx

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel319: string;
  schematranslationpanel334: string;
  schematranslationpanel449: string;
  schematranslationpanel701: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: string;
  schematranslationpanel762: string;
  schematranslationpanel771: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: string;
  schematranslationpanel1056: string;
  schematranslationpanel1078: string;
  schematranslationpanel1079: string;
  schematranslationpanel1090: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: string;
  schematranslationpanel1205: string;

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel67: string;

  // resources/js/Components/Panels/SystemSettingsPanel.tsx

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: string;

  // resources/js/Components/Panels/SystemSettingsPanel.tsx

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel149: string;
  systemsettingspanel242: string;
  systemsettingspanel251: string;

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel200: string;
  teammanagementpanel221: string;
  teammanagementpanel277: string;
  teammanagementpanel291: string;
  teammanagementpanel386: string;
  teammanagementpanel394: string;

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: string;

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: string;

  // resources/js\Components\Panels\TeamsPanel_Old.tsx

  // resources/js/Components/Panels/TeamsPanel_Old.tsx

  // resources/js\Components\Panels\TeamsPanel_Old.tsx

  // resources/js/Components/Panels/TeamsPanel_Old.tsx

  // resources/js\Components\Panels\TeamsPanel_Old.tsx

  // resources/js/Components/Panels/TeamsPanel_Old.tsx

  // resources/js\Components\Panels\TeamsPanel_Old.tsx

  // resources/js\Components\Panels\TeamsPanel.tsx

  // resources/js/Components/Panels/TeamsPanel.tsx

  // resources/js\Components\Panels\TeamsPanel.tsx

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: string;
  templatedbschemadependenciespanel128: string;

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: string;
  templatedbschemadependenciespanel176: string;

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: string;
  templatedbschemadependenciespanel248: string;
  templatedbschemadependenciespanel367: string;
  templatedbschemadependenciespanel404: string;
  templatedbschemadependenciespanel405: string;
  templatedbschemadependenciespanel415: string;
  templatedbschemadependenciespanel440: string;
  templatedbschemadependenciespanel442: string;
  templatedbschemadependenciespanel457: string;
  templatedbschemadependenciespanel469: string;
  templatedbschemadependenciespanel527: string;
  templatedbschemadependenciespanel536: string;
  templatedbschemadependenciespanel570: string;

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager120: string;
  templatefilemanager131: string;
  templatefilemanager137: string;
  templatefilemanager138: string;

  // resources/js/Components/Panels/TemplateFileManager.tsx

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: string;
  templatefilemanager175: string;
  templatefilemanager185: string;
  templatefilemanager220: string;
  templatefilemanager241: string;
  templatefilemanager245: string;
  templatefilemanager246: string;
  templatefilemanager252: string;

  // resources/js/Components/Panels/TemplateFileManager.tsx

  // resources/js\Components\Panels\TemplateFileManager.tsx

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: string;

  // resources/js\Components\Panels\TemplateFileManager.tsx

  // resources/js/Components/Panels/TemplateFileManager.tsx

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager347: string;
  templatefilemanager361: string;

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: string;
  templatemanagementpanel115: string;
  templatemanagementpanel116: string;
  templatemanagementpanel117: string;
  templatemanagementpanel118: string;
  templatemanagementpanel119: string;
  templatemanagementpanel120: string;
  templatemanagementpanel135: string;
  templatemanagementpanel150: string;
  templatemanagementpanel202: string;
  templatemanagementpanel216: string;
  templatemanagementpanel286: string;
  templatemanagementpanel291: string;
  templatemanagementpanel359: string;
  templatemanagementpanel395: string;
  templatemanagementpanel410: string;
  templatemanagementpanel413: string;
  templatemanagementpanel419: string;
  templatemanagementpanel420: string;
  templatemanagementpanel428: string;
  templatemanagementpanel433: string;
  templatemanagementpanel464: string;
  templatemanagementpanel467: string;
  templatemanagementpanel485: string;
  templatemanagementpanel595: string;
  templatemanagementpanel597: string;
  templatemanagementpanel618: string;
  templatemanagementpanel693: string;
  templatemanagementpanel706: string;
  templatemanagementpanel747: string;
  templatemanagementpanel771: string;
  templatemanagementpanel777: string;
  templatemanagementpanel795: string;
  templatemanagementpanel859: string;

  // resources/js/Components/Panels/TemplateManagementPanel.tsx

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: string;

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel961: string;

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel971: string;

  // resources/js/Components/Panels/TemplateManagementPanel.tsx

  // resources/js\Components\Panels\TemplateManagementPanel.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal16: string;
  templatemodal147: string;

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: string;

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal206: string;

templatemodal186: string;
templatemodal199: string;
templatemodal208: string;
templatemodal228: string;
templatemodal281: string;
templatemodal293: string;
templatemodal322: string;
templatemodal334: string;
templatemodal366: string;
templatemodal399: string;
templatemodal438: string;
templatemodal444: string;
templatemodal450: string;
templatemodal513: string;
templatemodal521: string;
templatemodal535: string;
templatemodal541: string;
templatemodal547: string;
templatemodal580: string;
templatemodal584: string;
templatemodal625: string;
templatemodal646: string;
templatemodal655: string;
templatemodal667: string;
templatemodal480: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal220: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal226: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: string;

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: string;

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: string;
  templatemodal320: string;

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: string;

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx

  // resources/js/Components/Panels/TemplateModal.tsx

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal502: string;

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal134: string;
  sqlimportmodal177: string;
  sqlimportmodal203: string;
  sqlimportmodal211: string;

  // resources/js/Components/SqlImportModal.tsx

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal301: string;
  sqlimportmodal313: string;

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal328: string;

  // resources/js\Components\SqlImportModal.tsx

  // resources/js/Components/SqlImportModal.tsx

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: string;

  // resources/js\Components\TopBar.tsx
  topbar71: string;
  topbar122: string;

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: string;

  // resources/js\Components\VersionConfirmationModal.tsx

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal29: string;
  versionconfirmationmodal51:  string;
  versionconfirmationmodal56:  string;
  versionconfirmationmodal56a: string;
  versionconfirmationmodal90:  string;
  versionconfirmationmodal90a: string;
  versionconfirmationmodal53: string;

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal67: string;

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: string;
  versionconfirmationmodal92: string;

  // resources/js\Components\VersionConfirmationModal.tsx

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: string;

  // resources/js\contexts\ProjectContext.tsx

  // resources/js\contexts\ToastContext.tsx

  // resources/js\i18n\index.ts

  // resources/js\lib\api.ts

  // resources/js\pages\CMSPage.tsx

  // resources/js/pages/CMSPage.tsx

  // resources/js\pages\CMSPage.tsx

  // resources/js\pages\EmailVerification.tsx

  // resources/js\pages\Index.tsx

  // resources/js/pages/Index.tsx

  // resources/js\pages\Index.tsx
  index400: string;
  index413: string;
  index590: string;
  index625: string;
  index1621: string;

  // resources/js/pages/Index.tsx

  // resources/js\pages\Index.tsx

  // resources/js/pages/LandingPage.tsx

  // resources/js\pages\LandingPage.tsx

  // resources/js/pages/LandingPage.tsx
  sqlParserTitle: string;
  sqlParserDesc: string;
  templateSystemTitle: string;
  templateSystemDesc: string;
  multiLanguageTitle: string;
  multiLanguageDesc: string;
  modernInterfaceTitle: string;
  modernInterfaceDesc: string;

  // resources/js\pages\LandingPage.tsx
  landingpage152: string;
  landingpage151: string;

  // resources/js/pages/LandingPage.tsx
  goStartFree: string;

  // resources/js\pages\LandingPage.tsx

  // resources/js/pages/LandingPage.tsx

  // resources/js\pages\LandingPage.tsx

  // resources/js/pages/LandingPage.tsx

  // resources/js\pages\LandingPage.tsx

  // resources/js/pages/LandingPage.tsx

  // resources/js\pages\LandingPage.tsx
  landingpage304: string;
  landingpage311: string;

  // resources/js/pages/LandingPage.tsx
  landingpage316: string;

  // resources/js\pages\LandingPage.tsx

  // resources/js/pages/LandingPage.tsx
  login: string;
  register: string;
  profile: string;
  changePlan: string;
  logout: string;
  gotoApp: string;
  title: string;
  subtitle: string;
  startFree: string;
  tryDemo: string;
  watchDemo: string;
  featuresTitle: string;
  pricingTitle: string;
  pricingSubtitle: string;

  // resources/js\pages\LandingPage.tsx
  landingpage479: string;

  // resources/js/pages/LandingPage.tsx
  ctaTitle: string;
  ctaSubtitle: string;
  startFreeTrial: string;
  tryDemoNow: string;
  contactSales: string;
  goToApp: string;

  // resources/js\pages\LandingPage.tsx
  landingpage573: string;

  // resources/js/pages/LandingPage.tsx
  currentPlan: string;
  freeLabel: string;
  freeTier: string;
  registerFirst: string;

  // resources/js\pages\LandingPage.tsx
  landingpage589: string;

  // resources/js/pages/LandingPage.tsx
  upgradeTo: string;
  currentPlanButton: string;
  landingpage630: string;
  productLabel: string;
  featuresLink: string;
  pricingLink: string;
  resourcesLabel: string;
  documentationLink: string;
  tutorialsLink: string;
  downloadsLink: string;
  supportLabel: string;

  // resources/js\pages\LandingPage.tsx

  // resources/js/pages/LandingPage.tsx
  contactUsLink: string;
  communityLink: string;
  allRightsReserved: string;

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: string;
  termsOfService: string;

  // resources/js\pages\LandingPage.tsx
  landingpage738: string;

  // resources/js\pages\ProjectInvitationResponse.tsx

  // resources/js/pages/ProjectInvitationResponse.tsx

  // resources/js\pages\ProjectInvitationResponse.tsx

  // resources/js/pages/ProjectInvitationResponse.tsx

  // resources/js\pages\ProjectInvitationResponse.tsx

  // resources/js/pages/ProjectInvitationResponse.tsx

  // resources/js\pages\ProjectInvitationResponse.tsx

  // resources/js/pages/ProjectInvitationResponse.tsx

  // resources/js\pages\ProjectInvitationResponse.tsx

  // resources/views\admin\pages\create.blade.php

  // resources/views\emails\project-invitation.blade.php

  // resources/views\layouts\static.blade.php

  // resources/views\pages\help.blade.php

  // resources/views\pages\impressum.blade.php

  // routes\api.php

  // routes\gtree-ultimate.php

  // routes\web.php

  //js/components/AuthModals/CreditPurchaseModal.tsx
  creditpurchasemodal72: string;
  
  // resources/js/pages/PublicProjectPage.tsx
  publicProjectBy: string;
  publicProjectPoweredBy: string;
  publicProjectTagline: string;
  projectSettings: string;
  languages: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  timezone: string;
  teams: string;
  templates: string;
  databases: string;
  created: string;
  lastUpdated: string;
  messageError: string;
  
  // resources/js/Components/Panels/ProjectPanel.tsx - Public Link
  copyPublicLink: string;
  publicLinkCopied: string;
  projectNotPublic: string;

  //resources/js/Components/Panels/FormDesignerPanel.tsx
  formdesignerpanel555: string;

  // PWA Install
  installApp: string;
  installSuccess: string;
  installSuccessDetail: string;

  // LandingPage.tsx
  landingpage221: string;
  landingpage222: string;
  landingpage223: string;
  landingpage224: string;
  landingpage225: string;
  landingpage226: string;
  landingpage237: string;
  landingpage239: string;
  landingpage240: string;
  landingpage241: string;
  landingpage242: string;
  landingpage243: string;
  landingpage245: string;
  landingpage236: string;
  landingpage254: string;
  landingpage255: string;
  landingpage257: string;
  landingpage258: string;
  landingpage259: string;
  landingpage260: string;
  landingpage261: string;
  landingpage263: string;
  
  //ProfileModal.tsx
  profilemodal347: string;
  profilemodal348: string;
  profilemodal349: string;
  profilemodal350: string;
  profilemodal351: string;
  profilemodal352: string;
  profilemodal353: string;
  profilemodal354: string;
  profilemodal355: string;
  profilemodal356: string;
  profilemodal357: string;
  profilemodal358: string;
  profilemodal359: string;
  profilemodal360: string;
  profilemodal361: string;
  profilemodal362: string;
  profilemodal363: string;
  profilemodal364: string;
  profilemodal365: string;
  profilemodal366: string;
  profilemodal367: string;
  profilemodal368: string;
  profilemodal369: string;
  profilemodal370: string;
  profilemodal371: string;
  profilemodal372: string;
  profilemodal373: string;
  profilemodal374: string;
  profilemodal375: string;
  profilemodal378: string;
  profilemodal379: string;
  profilemodal380: string;
  profilemodal382: string;
  profilemodal383: string;
  profilemodal387: string;
  profilemodal1151: string;
  profilemodal1376: string;
  profilemodal1393: string;
  profilemodal1404: string;
  profilemodal1409: string;
  profilemodal1447: string;
  profilemodal1464: string;
  profilemodal2234: string;
  profilemodal2248: string;
  profilemodal2251: string;
  profilemodal2284: string;
  profilemodal2290: string;
  profilemodal2297: string;
  profilemodal2303: string;
  profilemodal2311: string;
  profilemodal2321: string;
  profilemodal2329: string;
  profilemodal2340: string;
  profilemodal2346: string;
  profilemodal2348: string;
  profilemodal2360: string;
  profilemodal2361: string;
  profilemodal2361_2: string;
  profilemodal2369: string;
  profilemodal2376: string;
  profilemodal2381: string;
  profilemodal2388: string;
  profilemodal2393: string;
  profilemodal2406: string;
  profilemodal2411: string;
  profilemodal2419: string;
  profilemodal2429: string;
  profilemodal2437: string;
  profilemodal2446: string;
  profilemodal2453: string;
  profilemodal2458: string;
  profilemodal2470: string;
  profilemodal2488: string;
  profilemodal2489: string;
  profilemodal2490: string;
  profilemodal2491: string;
  profilemodal2499: string;
  profilemodal2499_2: string;
  profilemodal2519: string;
  profilemodal2513: string;

  //PlanModal.tsx
  planmodal54: string;
  planmodal326: string;
  planmodal328: string;
  planmodal329: string;
  planmodal330: string;
  planmodal331: string;
  planmodal332: string;
  planmodal334: string;
  planmodal342: string;
  planmodal344: string;
  planmodal345: string;
  planmodal346: string;
  planmodal347: string;
  planmodal348: string;
  planmodal358: string;
  planmodal360: string;
  planmodal361: string;
  planmodal362: string;
  planmodal363: string;
  planmodal364: string;
  planmodal365: string;
  planmodal367: string;
  planmodal350: string;
  planmodal433: string;
  planmodal433_2: string;
  planmodal435: string;
  planmodal435_2: string;
  planmodal450: string;
  planmodal476: string;
  planmodal479: string;
  planmodal496: string;
  planmodal505: string;
  planmodal513: string;
  planmodal513_2: string;
  planmodal523: string;
  planmodal546: string;
  planmodal568: string;
  planmodal578: string;
  planmodal578_2: string;
  planmodal581: string;
  planmodal624: string;
  planmodal629: string;
  planmodal637: string;
  planmodal652: string;
  planmodal598: string;
  planmodal601: string;
  planmodal609: string;
  planmodal617: string;

  //ProjectPanel.tsx
  projectpanel216: string;
  projectpanel332: string;
  projectpanel341: string;
  projectpanel365: string;
  projectpanel391: string;
  projectpanel403: string;
  projectpanel420: string;
  projectpanel420_2: string;
  projectpanel424: string;
  projectpanel445: string;
  projectpanel445_2: string;
  projectpanel445_3: string;
  projectpanel447: string;
  projectpanel463: string;
  projectpanel488: string;
  projectpanel488_2: string;
  projectpanel503: string;
  projectpanel631: string;
  projectpanel631_2: string;
  projectpanel804: string;
  projectpanel851: string;
  projectpanel861: string;
  projectpanel871: string;
  projectpanel887: string;
  projectpanel926: string;
  projectpanel925: string;
  projectpanel936: string;
  projectpanel935: string;
  projectpanel949: string;
  projectpanel957: string;
  projectpanel1009: string;
  projectpanel1208: string;
  projectpanel1213: string;
  projectpanel1225: string;
  projectpanel1231: string;
  projectpanel1238: string;
  projectpanel1239: string;
  projectpanel1278: string;
  projectpanel1299: string;
  projectpanel1347: string;
  projectpanel1347_2: string;
  projectpanel1353: string;
  projectpanel1425: string;
  projectpanel1448: string;
  projectpanel1442: string;
  projectpanel1472: string;
  projectpanel1476: string;
  projectpanel1489: string;
  projectpanel1493: string;
  projectpanel1515: string;
  projectpanel1504: string;
  projectpanel1521: string;
  projectpanel1604: string;
  projectpanel1615: string;
  projectpanel1621: string;
  projectpanel1632: string;
  projectpanel1638: string;
  projectpanel1649: string;
  projectpanel1655: string;
  projectpanel1672: string;
  projectpanel1678: string;
  projectpanel1694: string;
  projectpanel1706: string;
  projectpanel1718: string;
  projectpanel1724: string;
  projectpanel1736: string;
  projectpanel1744: string;
  projectpanel1755: string;
  projectpanel1761: string;
  projectpanel1772: string;
  projectpanel1780: string;
  projectpanel1792: string;
  projectpanel1798: string;
  projectpanel1820: string;
  projectpanel1895: string;
  projectpanel1895_2: string;
  projectpanel1929: string;
  projectpanel1930: string;
  projectpanel1930_2: string;
  projectpanel2035: string;
  projectpanel2046: string;
  projectpanel2057: string;
  projectpanel2068: string;
  projectpanel2079: string;
  projectpanel2089: string;
  projectpanel2110: string;
  projectpanel2124: string;
  projectpanel2150: string;
  projectpanel2180: string;
  projectpanel2235: string;
  projectpanel2254: string;
  projectpanel2260: string;
  projectpanel2265: string;
  projectpanel2271: string;
  projectpanel2306: string;
  projectpanel2315: string;
  projectpanel2322: string;
  projectpanel2348: string;
  projectpanel2352: string;
  projectpanel2356: string;
  projectpanel2360: string;
  projectpanel2364: string;
  projectpanel2368: string;
  projectpanel2377: string;
  projectpanel2394: string;
  projectpanel2410: string;
  projectpanel2452: string;
  projectpanel2458: string;

  //ProjectSettingsPanel.tsx

  //TeamManagementPanel.tsx
  teammanagementpanel803: string;

  //KanbanBoardPanel.tsx

  //TemplateManagementPanel199
  templatemanagementpanel199: string;
  templatemanagementpanel200: string;
  templatemanagementpanel204: string;
  templatemanagementpanel203: string;
  templatemanagementpanel198: string;
  templatemanagementpanel201: string;
  templatemanagementpanel225: string;
  templatemanagementpanel303: string;
  templatemanagementpanel372: string;
  templatemanagementpanel397: string;
  templatemanagementpanel471: string;
  templatemanagementpanel471_2: string;
  templatemanagementpanel480: string;
  templatemanagementpanel534: string;
  templatemanagementpanel540: string;
  templatemanagementpanel547: string;
  templatemanagementpanel557: string;
  templatemanagementpanel574: string;
  templatemanagementpanel577: string;
  templatemanagementpanel600: string;
  templatemanagementpanel600_2: string;
  templatemanagementpanel609: string;
  templatemanagementpanel696: string;
  templatemanagementpanel697: string;
  templatemanagementpanel719: string;
  templatemanagementpanel724: string;
  templatemanagementpanel749: string;
  templatemanagementpanel753: string;
  templatemanagementpanel767: string;
  templatemanagementpanel788: string;
  templatemanagementpanel798: string;
  templatemanagementpanel803: string;
  templatemanagementpanel818: string;
  templatemanagementpanel831: string;
  templatemanagementpanel837: string;
  templatemanagementpanel850: string;
  templatemanagementpanel854: string;
  templatemanagementpanel863: string;
  templatemanagementpanel872: string;
  templatemanagementpanel886: string;
  templatemanagementpanel892: string;
  templatemanagementpanel902: string;
  templatemanagementpanel911: string;
  templatemanagementpanel914: string;
  templatemanagementpanel966: string;
  templatemanagementpanel966_2: string;
  templatemanagementpanel966_3: string;
  templatemanagementpanel1020: string;
  templatemanagementpanel1022: string;
  templatemanagementpanel1194: string;
  templatemanagementpanel1195: string;
  templatemanagementpanel1220: string;
  templatemanagementpanel1232: string;
  templatemanagementpanel1232_2: string;
  templatemanagementpanel1299: string;
  templatemanagementpanel1299_2: string;
  templatemanagementpanel1304: string;
  templatemanagementpanel1306: string;
  templatemanagementpanel1316: string;
  templatemanagementpanel1350: string;
  templatemanagementpanel1423: string;
  templatemanagementpanel1423_2: string;
  templatemanagementpanel1428: string;
  templatemanagementpanel1430: string;
  templatemanagementpanel1440: string;
  templatemanagementpanel1461: string;
  templatemanagementpanel1465: string;
  templatemanagementpanel1482: string;
  templatemanagementpanel1489: string;
  templatemanagementpanel1492: string;
  templatemanagementpanel1495: string;
  templatemanagementpanel1501: string;
  templatemanagementpanel1511: string;
  templatemanagementpanel1513: string;
  templatemanagementpanel1520: string;
  templatemanagementpanel1522: string;
  templatemanagementpanel1531: string;
  templatemanagementpanel1598: string;
  templatemanagementpanel1599: string;
  templatemanagementpanel1600: string;
  templatemanagementpanel1601: string;
  templatemanagementpanel1604: string;
  templatemanagementpanel1605: string;
  templatemanagementpanel1606: string;
  templatemanagementpanel1607: string;
  templatemanagementpanel1647: string;
  templatemanagementpanel1737: string;
  templatemanagementpanel1829: string;
  templatemanagementpanel1935: string;
  templatemanagementpanel1936: string;
  templatemanagementpanel1937: string;
  templatemanagementpanel1938: string;
  templatemanagementpanel1948: string;
  templatemanagementpanel1977: string;
  templatemanagementpanel2050: string;
  templatemanagementpanel2057: string;
  templatemanagementpanel2057_2: string;
  templatemanagementpanel2069: string;
  templatemanagementpanel2085: string;
  templatemanagementpanel2095: string;
  templatemanagementpanel2133: string;
  templatemanagementpanel2142: string;
  templatemanagementpanel2155: string;
  templatemanagementpanel2155_2: string;
  templatemanagementpanel2185: string;
  templatemanagementpanel2187: string;
  templatemanagementpanel2209: string;
  templatemanagementpanel2217: string;
  templatemanagementpanel2219: string;
  templatemanagementpanel2230: string;
  templatemanagementpanel2236: string;
  templatemanagementpanel2242: string;
  templatemanagementpanel2296: string;
  templatemanagementpanel2318: string;
  templatemanagementpanel2321: string;
  templatemanagementpanel2349: string;
  templatemanagementpanel2364: string;
  templatemanagementpanel2377: string;
  templatemanagementpanel2392: string;
  templatemanagementpanel2403: string;
  templatemanagementpanel2408: string;
  templatemanagementpanel2413: string;
  templatemanagementpanel2422: string;
  templatemanagementpanel2430: string;
  templatemanagementpanel2431: string;
  templatemanagementpanel2442: string;
  templatemanagementpanel2442_2: string;
  templatemanagementpanel2468: string;
  templatemanagementpanel2485: string;
  templatemanagementpanel2490: string;
  templatemanagementpanel2490_2: string;
  templatemanagementpanel2495: string;
  templatemanagementpanel2500: string;
  templatemanagementpanel2500_2: string;
  templatemanagementpanel2511: string;
  templatemanagementpanel2511_2: string;
  templatemanagementpanel2519: string;
  templatemanagementpanel2526: string;
  templatemanagementpanel2526_2: string;
  templatemanagementpanel2547: string;
  templatemanagementpanel2554: string;
  templatemanagementpanel2574: string;
  templatemanagementpanel2617: string;
  templatemanagementpanel2623: string;
  templatemanagementpanel2638: string;
  templatemanagementpanel2688: string;
  templatemanagementpanel2689: string;
  templatemanagementpanel2705: string;
  templatemanagementpanel2699: string;
  templatemanagementpanel2717: string;
  templatemanagementpanel2738: string;
  templatemanagementpanel2747: string;
  templatemanagementpanel2758: string;
  templatemanagementpanel2758_2: string;
  templatemanagementpanel2764: string;
  templatemanagementpanel2776: string;
  templatemanagementpanel2776_2: string;
  templatemanagementpanel2784: string;
  templatemanagementpanel2784_2: string;
  templatemanagementpanel2790: string;
  templatemanagementpanel2796: string;
  templatemanagementpanel2796_2: string;
  templatemanagementpanel2830: string;
  templatemanagementpanel2844: string;
  templatemanagementpanel2844_2: string;
  templatemanagementpanel2852: string;
  templatemanagementpanel2858: string;
  templatemanagementpanel2867: string;
  templatemanagementpanel2878: string;
  templatemanagementpanel2878_2: string;
  templatemanagementpanel2884: string;
  templatemanagementpanel2909: string;
  templatemanagementpanel2931: string;
  templatemanagementpanel2941: string;
  templatemanagementpanel2977: string;
  templatemanagementpanel2978: string;
  templatemanagementpanel2995: string;
  templatemanagementpanel2995_2: string;

  //TemplateReviewPanel.tsx

  //InviteManagementPanel.tsx
  invitemanagementpanel96: string;

  formsetmanagementpanel421: string;
  formsetmanagementpanel431: string;
  formsetmanagementpanel440: string;
  formsetmanagementpanel448: string;
  formsetmanagementpanel454: string;
  formsetmanagementpanel466: string;
  formsetmanagementpanel472: string;
  formsetmanagementpanel478: string;
  formsetmanagementpanel493: string;
  formsetmanagementpanel497: string;
  formsetmanagementpanel498: string;
  formsetmanagementpanel499: string;
  formsetmanagementpanel500: string;
  formsetmanagementpanel501: string;
  formsetmanagementpanel510: string;
  formsetmanagementpanel510_2: string;
  
  formsetmanagementpanel532: string;
  formsetmanagementpanel539: string;
  formsetmanagementpanel544: string;
  formsetmanagementpanel545: string;
  formsetmanagementpanel551: string;
  formsetmanagementpanel556: string;
  formsetmanagementpanel571: string;
  formsetmanagementpanel587: string;
  formsetmanagementpanel587_2: string;
  formsetmanagementpanel597: string;
  formsetmanagementpanel598: string;
  formsetmanagementpanel599: string;
  formsetmanagementpanel600: string;
  formsetmanagementpanel607: string;
  formsetmanagementpanel607_2: string;
  formsetmanagementpanel617: string;
  formsetmanagementpanel624: string;
  formsetmanagementpanel631: string;
  formsetmanagementpanel631_2: string;
  deleteversiondialog110: string;
  formsetmanagementpanel363: string;
  formsetmanagementpanel428: string;
  formsetmanagementpanel429: string;
  formsetmanagementpanel427: string;
  formsetmanagementpanel426: string;
  formsetmanagementpanel425: string;
  formsetmanagementpanel598_2: string;
  formsetmanagementpanel585: string;
  formsetmanagementpanel595: string;
  formsetmanagementpanel595_2: string;
  deleteversiondialog214: string;
  deleteversiondialog81: string;
  deleteversiondialog87: string;
  deleteversiondialog98: string;
  deleteversiondialog115: string;
  deleteversiondialog126: string;
  deleteversiondialog126_2: string;
  deleteversiondialog135: string;
  deleteversiondialog153: string;
  deleteversiondialog151: string;
  deleteversiondialog172: string;
  deleteversiondialog172_2: string;
  deleteversiondialog179: string;
  deleteversiondialog185: string;
  deleteversiondialog146: string;
  deleteversiondialog209: string;
  deleteversiondialog209_2: string;
  deleteversiondialog148: string;
  deleteversiondialog123: string;

  templateimportwizardpanel200: string;
  templateimportwizardpanel418: string;
  templateimportwizardpanel204: string;
  templateimportwizardpanel205: string;
  templateimportwizardpanel206: string;
  templateimportwizardpanel207: string;
  templateimportwizardpanel442: string;
  templateimportwizardpanel545: string;
  templateimportwizardpanel564: string;
  templateimportwizardpanel574: string;
  templateimportwizardpanel599: string;
  templateimportwizardpanel609: string;
  templateimportwizardpanel630: string;
  templateimportwizardpanel647: string;
  templateimportwizardpanel663: string;
  templateimportwizardpanel667: string;
  templateimportwizardpanel667_2: string;
  templateimportwizardpanel670: string;
  templateimportwizardpanel716: string;
  templateimportwizardpanel720: string;
  templateimportwizardpanel724: string;
  templateimportwizardpanel728: string;
  templateimportwizardpanel761: string;
  templateimportwizardpanel767: string;
  templateimportwizardpanel964: string;
  templateimportwizardpanel975: string;
  templateimportwizardpanel992: string;
  templateimportwizardpanel1002: string;
  templateimportwizardpanel1017: string;
  templateimportwizardpanel1022: string;
  templateimportwizardpanel1036: string;
  templateimportwizardpanel1044: string;
  templateimportwizardpanel1062: string;
   templateimportwizardpanel1071: string;
  templateimportwizardpanel1085: string;
  templateimportwizardpanel1094: string;
  templateimportwizardpanel1103: string;
  templateimportwizardpanel1155: string;
  templateimportwizardpanel1191: string;
  templateimportwizardpanel1117: string;
  templateimportwizardpanel1118: string;
  templatemanagementpanel1589: string;
  templatemanagementpanel1158: string;
  templatemanagementpanel1164: string;
  templatemanagementpanel1165: string;
  templatemanagementpanel1184: string;
  templatemanagementpanel1188: string;
  templatemanagementpanel1191: string;
  templatemanagementpanel1202: string;
  templatemanagementpanel1199: string;
  templatemanagementpanel1555: string;
  templatemanagementpanel1616: string;
  templatemanagementpanel1929: string;
  templateimportwizardpanel1412: string;
  templateimportwizardpanel1409: string;
  templateimportwizardpanel1423: string;
  templateimportwizardpanel1430: string;
  templateimportwizardpanel1443: string;
  templateimportwizardpanel1451: string;
  templateimportwizardpanel1454: string;
  templateimportwizardpanel1460: string;
  templateimportwizardpanel1466: string;
  templateimportwizardpanel1476: string;
  templateimportwizardpanel1472: string;
  templateimportwizardpanel1514: string;

  templateimportwizardpanel1515: string;
  templateimportwizardpanel1525: string;
  templateimportwizardpanel1539: string;
  templateimportwizardpanel1543: string;
  templateimportwizardpanel1562: string;
  templateimportwizardpanel1526: string;
  templateimportwizardpanel1526_2: string;
  templateimportwizardpanel1308: string;
  templateimportwizardpanel1571: string;
  templateimportwizardpanel1578: string;
  templateimportwizardpanel1639: string;
  templateimportwizardpanel1653: string;
  templateimportwizardpanel1678: string;
  templateimportwizardpanel1669: string;
  templateimportwizardpanel1684: string;
  templateimportwizardpanel1691: string;
  templateimportwizardpanel1698: string;
  templateimportwizardpanel1707: string;
  templateimportwizardpanel1719: string;
  templateimportwizardpanel1728: string;
  templateimportwizardpanel1740: string;
  templateimportwizardpanel1745: string;
  templateimportwizardpanel1754: string;
  templateimportwizardpanel1761: string;
  templateimportwizardpanel1766: string;
  templateimportwizardpanel1767: string;
  templateimportwizardpanel1768: string;
  templateimportwizardpanel1796: string;
  templateimportwizardpanel1799: string;
  templateimportwizardpanel1818: string;
  templateimportwizardpanel1821: string;
  templateimportwizardpanel1821_2: string;
  templateimportwizardpanel1821_3: string;
  templateimportwizardpanel1827: string;
  templateimportwizardpanel1831: string;
  templateimportwizardpanel1836: string;
  templateimportwizardpanel1860: string;
  templateimportwizardpanel1870: string;
  templateimportwizardpanel1883: string;
  templateimportwizardpanel1891: string;
  templateimportwizardpanel1891_2: string;
  templateimportwizardpanel1898: string;
  templateimportwizardpanel1901: string;
  templateimportwizardpanel1914: string;
  templateimportwizardpanel1917: string;
  templateimportwizardpanel1921: string;
  templateimportwizardpanel1942: string;
  templateimportwizardpanel1952: string;
  templateimportwizardpanel1960: string;
  templateimportwizardpanel1968: string;
  templateimportwizardpanel1974: string;
  templateimportwizardpanel1990: string;
  templateimportwizardpanel2035: string;
  templateimportwizardpanel604: string;
  templatemanagementpanel1946: string;
  templatemanagementpanel2036: string;
  templateimportwizardpanel1388: string;
  templateimportwizardpanel1401: string;
  templateimportwizardpanel1285: string;
  templateimportwizardpanel1291: string;
  templateimportwizardpanel1326: string;
  templateimportwizardpanel1333: string;
  templateimportwizardpanel1341: string;
  templateimportwizardpanel1347: string;
  
  templateimportwizardpanel1591: string;
  templateimportwizardpanel1605: string;
  templateimportwizardpanel1616: string;
  templateimportwizardpanel1632: string;
  templateimportwizardpanel1622: string;
  templateimportwizardpanelDuplicateName: string;
  templateimportwizardpanelOverwrite: string;
  templateimportwizardpanelOverwriteTooltip: string;
  templateimportwizardpanelMerge: string;
  templateimportwizardpanelMergeTooltip: string;
  templatemanagementpanel2171: string;
  templatemanagementpanel2324: string;
  
  templatemanagementpanel2926: string;
  templatemanagementpanel539: string;
  templatemanagementpanel814: string;
  templatemanagementpanel988: string;
  templatemanagementpanel988_2: string;
  templatemanagementpanel1125: string;
  templatemanagementpanel1720: string;
  templatemanagementpanel1723: string;
  templatemanagementpanel1731: string;
  templatemanagementpanel1735: string;
  templatemanagementpanel1769: string;
  templatemanagementpanel1807: string;
  templatemanagementpanel1815: string;
  templatemanagementpanel1856: string;
  templatemanagementpanel1857: string;
  templatemanagementpanel1858: string;
  templatemanagementpanel1859: string;
  templatemanagementpanel1894: string;
  templatemanagementpanel1908: string;
  templatemanagementpanel1697: string;
  templatemanagementpanel1711: string;
  templatemanagementpanel1558: string;
  cachedebugpanel406: string;
  cachedebugpanel646: string;
  codeadjustmentspanel1484: string;
  codeadjustmentspanel1493: string;
  codeadjustmentspanel1498: string;
  codeadjustmentspanel1532: string;
  codeadjustmentspanel1559: string;
  codeadjustmentspanel1864: string;
  codeadjustmentspanel1874: string;
  codeadjustmentspanel1879: string;
  codeadjustmentspanel1884: string;
  codeadjustmentspanel1894: string;
  codeadjustmentspanel1903: string;
  codeadjustmentspanel1910: string;
  codeadjustmentspanel1921: string;
  codeadjustmentspanel1925: string;
  codeadjustmentspanel1929: string;
  codeadjustmentspanel1933: string;
  codeadjustmentspanel1937: string;
  codeadjustmentspanel1958: string;
  codeadjustmentspanel1964: string;
  codeadjustmentspanel1974: string;
  codeadjustmentspanel1986: string;
  codeadjustmentspanel2011: string;
  codeadjustmentspanel2021: string;
  codeadjustmentspanel2021_2: string;
  codeadjustmentspanel2029: string;
  codeadjustmentspanel2038: string;
  codeadjustmentspanel2050: string;
  codeadjustmentspanel2087: string;
  codeadjustmentspanel2107: string;
  codeadjustmentspanel2110: string;
  codeadjustmentspanel2117: string;
  codeadjustmentspanel2122: string;
  codeadjustmentspanel2136: string;
  codeadjustmentspanel2150: string;
  codeadjustmentspanel2165: string;
  codeadjustmentspanel2176: string;
  codeadjustmentspanel2189: string;
  codeadjustmentspanel2206: string;
  codeadjustmentspanel2208: string;
  codeadjustmentspanel2209: string;
  codeadjustmentspanel2210: string;
  codeadjustmentspanel2211: string;
  codeadjustmentspanel2239: string;
  codeadjustmentspanel2239_2: string;
  codeadjustmentspanel2246: string;
  codeadjustmentspanel2258: string;
  codeadjustmentspanel2270: string;
  codeadjustmentspanel2281: string;
  codeadjustmentspanel2285: string;
  codeadjustmentspanel2290: string;
  codeadjustmentspanel2305: string;
  codeadjustmentspanel2307: string;
  codeadjustmentspanel2317: string;
  codeadjustmentspanel2317_2: string;
  codeadjustmentspanel2323: string;
  codeadjustmentspanel2324: string;
  codeadjustmentspanel2341: string;
  codeadjustmentspanel2353: string;
  codeadjustmentspanel2367: string;
  codeadjustmentspanel2357: string;
  codeadjustmentspanel2380: string;
  codeadjustmentspanel2394: string;
  codeadjustmentspanel2394_2: string;
  codeadjustmentspanel2400: string;
  codeadjustmentspanel2401: string;
  codeadjustmentspanel2444: string;
  codeadjustmentspanel2445: string;
  codeadjustmentspanel2454: string;
  codeadjustmentspanel2455: string;
  codeadjustmentspanel2471: string;
  codeadjustmentspanel2475: string;
  codeadjustmentspanel2461: string;
  codeadjustmentspanel2441: string;
  codeadjustmentspanel2487: string;
  codeadjustmentspanel2494: string;
  codeadjustmentspanel2496: string;
  codeadjustmentspanel2517: string;
  codeadjustmentspanel2520: string;
  codeadjustmentspanel2525: string;
  codeadjustmentspanel2550: string;
  codeadjustmentspanel2553: string;
  codeadjustmentspanel2583: string;
  codeadjustmentspanel2577: string;
  codeadjustmentspanel2593: string;
  codeadjustmentspanel2609: string;
  codeadjustmentspanel2617: string;
  codeadjustmentspanel2627: string;
  codeadjustmentspanel2636: string;
  codeadjustmentspanel2636_2: string;
  codeadjustmentspanel2636_3: string;
  codeadjustmentspanel2647: string;
  codeadjustmentspanel2655: string;
  codeadjustmentspanel2663: string;
  codeadjustmentspanel2672: string;
  codeadjustmentspanel2691: string;
  codeadjustmentspanel2697: string;
  codeadjustmentspanel2699: string;
  codeadjustmentspanel2707: string;
  codeadjustmentspanel2717: string;
  codeadjustmentspanel2717_2: string;
  codeadjustmentspanel2712: string;
  codeadjustmentspanel2683: string;
  codeadjustmentspanel2726: string;
  codeadjustmentspanel2736: string;
  codeadjustmentspanel2744: string;
  codeadjustmentspanel2744_2: string;
  codeadjustmentspanel2767: string;
  codeadjustmentspanel2801: string;
  codeadjustmentspanel2818: string;
  codeadjustmentspanel2818_2: string;
  codeadjustmentspanel2829: string;
  codeadjustmentspanel2830: string;
  codeadjustmentspanel2815: string;
  templatemanagementpanel1937_2: string;
  templatemanagementpanel2538: string;
  templatemanagementpanel2659: string;
  templatemanagementpanel2659_2: string;
  templatemanagementpanel2671: string;
  templatemanagementpanel2712: string;
  templatemanagementpanel2813: string;
  registermodal323: string;
  registermodal_request_access: string;
  registermodal365: string;
  registermodal405: string;
  registermodal420: string;
  registermodal426: string;
  registermodal426_2: string;
  registermodal440: string;
  registermodal446: string;
  registermodal465: string;
  registermodal495: string;
  registermodal511: string;
  registermodal559: string;
  creditpurchasemodal98: string;
  creditpurchasemodal87: string;
  creditpurchasemodal95: string;
  creditpurchasemodal95_2: string;
  creditpurchasemodal111: string;
  creditpurchasemodal114: string;
  creditpurchasemodal130: string;
  creditpurchasemodal137: string;
  creditpurchasemodal149: string;
  creditpurchasemodal149_2: string;
  creditpurchasemodal149_3: string;
  creditpurchasemodal160: string;
  creditpurchasemodal161: string;
  creditpurchasemodal161_2: string;
  templatemanagementpanel2044: string;
  templatemanagementpanel2048: string;
  templatemanagementpanel2013: string;
  databasemanagementpanel1239: string;
  templatemanagementpanel2212: string;
  templatemanagementpanel2332: string;
  templatemanagementpanel2033: string;
  templatemanagementpanel1618: string;
  filemodal369: string;
  filemodal370: string;
  filemodal371: string;
  filemodal372: string;
  filemodal373: string;
  filemodal374: string;
  filemodal495: string;
  filemodal496: string;
  filemodal526: string;
  filemodal540: string;
  filemodal542: string;
  filemodal558: string;
  filemodal558_2: string;
  filemodal561: string;
  filemodal594: string;
  filemodal595: string;
  filemodal599: string;
  filemodal604: string;
  filemodal607: string;
  filemodal615: string;
  filemodal620: string;
  filemodal641: string;
  filemodal645: string;
  filemodal645_2: string;
  filemodal647: string;
  filemodal651: string;
  filemodal722: string;
  filemodal729: string;
  filemodal729_2: string;
  filemodal734: string;
  filemodal771: string;
  filemodal771_2: string;
  filemodal771_3: string;
  filemodal777: string;
  filemodal832: string;
  filemodal833: string;
  filemodal842: string;
  filemodal853: string;
  filemodal870: string;
  filemodal881: string;
  filemodal891: string;
  filemodal1010: string;
  filemodal1024: string;
  filemodal1012: string;
  filemodal1034: string;
  filemodal1047: string;
  filemodal1055: string;
  filemodal1055_2: string;
  filemodal1056: string;
  filemodal1056_2: string;
  filemodal1056_3: string;
  filemodal1062: string;
  filemodal1064: string;
  filemodal1092: string;
  filemodal1097: string;
  filemodal1105: string;
  filemodal1122: string;
  filemodal1128: string;
  filemodal1137: string;
  filemodal1170: string;
  filemodal1178: string;
  filemodal1178_2: string;
  filemodal1187: string;
  filemodal1214: string;
  filemodal1234: string;
  filemodal1232: string;
  filemodal1270: string;
  filemodal1270_2: string;
  filemodal1270_3: string;
  filemodal1286: string;
  filemodal1296: string;
  filemodal1297: string;
  filemodal1308: string;
  filemodal1319: string;
  filemodal1333: string;
  filemodal1342: string;
  filemodal1351: string;
  filemodal1362: string;
  filemodal1362_2: string;
  filemodal1363: string;
  filemodal959: string;
  filemodal982: string;
  filemodal1073: string;
  filemodal1371: string;
  projectwizardmodal65: string;
  projectwizardmodal199: string;
  projectwizardmodal223: string;
  projectwizardmodal245: string;
  projectwizardmodal267: string;
  projectwizardmodal299: string;
  projectwizardmodal358: string;
  projectwizardmodal402: string;
  projectwizardmodal467: string;
  projectwizardmodal505: string;
  projectwizardmodal542: string;
  projectwizardmodal562: string;
  projectwizardmodal567: string;
  projectwizardmodal575: string;
  projectwizardmodal609: string;
  projectwizardmodal632: string;
  projectwizardmodal636: string;
  projectwizardmodal640: string;
  projectwizardmodal649: string;
  projectwizardmodal663: string;
  projectwizardmodal694: string;
  projectwizardmodal698: string;
  projectwizardmodal702: string;
  projectwizardmodal850: string;
  projectwizardmodal871: string;
  projectwizardmodal871_2: string;
  projectwizardmodal940: string;
  projectwizardmodal940_2: string;
  projectwizardmodal947: string;
  projectwizardmodal1018: string;
  projectwizardmodal1025: string;
  projectwizardmodal1026: string;
  projectwizardmodal1027: string;
  projectwizardmodal1053: string;
  projectwizardmodal1053_2: string;
  projectwizardmodal1079: string;
  projectwizardmodal1087: string;
  projectwizardmodal1087_2: string;
  projectwizardmodal1087_3: string;
  projectwizardmodal1145: string;
  projectwizardmodal1153: string;
  projectwizardmodal1157: string;
  projectwizardmodal1153_2: string;
  projectwizardmodal1157_2: string;
  projectwizardmodal1183: string;
  projectwizardmodal1248: string;
  projectwizardmodal1253: string;
  projectwizardmodal1256: string;
  projectwizardmodal1259: string;
  projectwizardmodal1262: string;
  projectwizardmodal1262_2: string;
  projectwizardmodal1287: string;
  projectwizardmodal1287_2: string;
  projectwizardmodal1287_3: string;
  projectwizardmodal1295: string;
  projectwizardmodal1303: string;
  projectwizardmodal1313: string;
  projectwizardmodal1320: string;
  projectwizardmodal1322: string;
  projectwizardmodal1334: string;
  projectwizardmodal1352: string;
  projectwizardmodal1358: string;
  projectwizardmodal1364: string;
  projectwizardmodal1372: string;
  projectwizardmodal1378: string;
  projectwizardmodal1409: string;
  projectwizardmodal1420: string;
  projectwizardmodal1432: string;
  projectwizardmodal1443: string;
  projectwizardmodal1449: string;
  projectwizardmodal1450: string;
  projectwizardmodal1451: string;
  projectwizardmodal1452: string;
  projectwizardmodal1467: string;
  projectwizardmodal1484: string;
  projectwizardmodal1507: string;
  projectwizardmodal1518: string;
  projectwizardmodal1556: string;
  projectwizardmodal1557: string;
  projectwizardmodal1540: string;
  projectwizardmodal1542: string;
  projectwizardmodal1545: string;
  projectwizardmodal1597: string;
  projectwizardmodal1603: string;
  projectwizardmodal1621: string;
  projectwizardmodal1626: string;
  projectwizardmodal1629: string;
  projectwizardmodal1629_2: string;
  projectwizardmodal1629_3: string;
  projectwizardmodal1629_4: string;
  projectwizardmodal1629_5: string;
  projectwizardmodal1632_2: string;
  projectwizardmodal1632_3: string;
  projectwizardmodal1638: string;
  projectwizardmodal1643: string;
  projectwizardmodal1649: string;
  projectwizardmodal1654: string;
  projectwizardmodal1659: string;
  projectwizardmodal1669: string;
  projectwizardmodal1669_2: string;
  projectwizardmodal1669_3: string;
  filemodal900: string;
  filemodal905: string;
  filemodal894: string;
  filemodal848: string;
  filemodal994: string;
  filemodal1325: string;
  teammanagementpanel977: string;
  teammanagementpanel983: string;
  teammanagementpanel988: string;
  teammanagementpanel1009: string;
  teammanagementpanel1043: string;
  teammanagementpanel1049: string;
  teammanagementpanel1055: string;
  teammanagementpanel1057: string;
  teammanagementpanel1058: string;
  teammanagementpanel1082: string;
  teammanagementpanel1082_2: string;
  teammanagementpanel1089: string;
  teammanagementpanel1094: string;
  teammanagementpanel1130: string;
  teammanagementpanel1145: string;
  teammanagementpanel1145_2: string;
  teammanagementpanel1155: string;
  teammanagementpanel1155_2: string;
  teammanagementpanel1167: string;
  teammanagementpanel1193: string;
  teammanagementpanel1196: string;
  teammanagementpanel1198: string;
  teammanagementpanel1226: string;
  teammanagementpanel1229: string;
  teammanagementpanel1229_2: string;
  teammanagementpanel1229_3: string;
  teammanagementpanel1230: string;
  teammanagementpanel1241: string;
  teammanagementpanel1241_2: string;
  teammanagementpanel1242: string;
  teammanagementpanel1254: string;
  teammanagementpanel1261: string;
  teammanagementpanel1267: string;
  teammanagementpanel1267_2: string;
  teammanagementpanel1277: string;
  teammanagementpanel548: string;
  teammanagementpanel561: string;
  teammanagementpanel569: string;
  teammanagementpanel568: string;
  teammanagementpanel597: string;
  teammanagementpanel597_2: string;
  teammanagementpanel602: string;
  teammanagementpanel601: string;
  teammanagementpanel603: string;
  teammanagementpanel754: string;
  teammanagementpanel762: string;
  teammanagementpanel771: string;
  teammanagementpanel781: string;
  teammanagementpanel788: string;
  teammanagementpanel818: string;
  teammanagementpanel827: string;
  teammanagementpanel374: string;
  teammanagementpanel370: string;
  teammanagementpanel370_2: string;
  teammanagementpanel369: string;
  teammanagementpanel350: string;
  teammanagementpanel337: string;
  teammanagementpanel338: string;
  teammanagementpanel247: string;
  teammanagementpanel247_2: string;
  teammanagementpanel179: string;
  teammanagementpanel181: string;
  membermodal518: string;
  membermodal518_2: string;
  membermodal518_3: string;
  teamrolespanel609: string;
  teamrolespanel614: string;
  teamrolespanel685: string;
  teamrolespanel685_2: string;
  teamrolespanel685_3: string;
  teamrolespanel696: string;
  teamrolespanel697: string;
  teamrolespanel698: string;
  teamrolespanel699: string;
  teamrolespanel707: string;
  teamrolespanel707_2: string;
  teamrolespanel718: string;
  teamrolespanel718_2: string;
  teamrolespanel746: string;
  teamrolespanel761: string;
  teamrolespanel857: string;
  teamrolespanel863: string;
  teamrolespanel64: string;
  teamrolespanel65: string;
  teamrolespanel66: string;
  teamrolespanel67: string;
  teamrolespanel68: string;
  teamrolespanel69: string;
  teamrolespanel70: string;
  teamrolespanel71: string;
  teamrolespanel471: string;
  teamrolespanel474: string;
  teamrolespanel115: string;
  teamrolespanel131: string;
  teamrolespanel152: string;
  teamrolespanel194: string;
  teamrolespanel194_2: string;
  teamrolespanel224: string;
  teamrolespanel230: string;
  teamrolespanel230_2: string;
  teamrolespanel240: string;
  teamrolespanel253: string;
  teamrolespanel254: string;
  teamrolespanel262: string;
  teamrolespanel262_2: string;
  teamrolespanel262_3: string;
  teamrolespanel263: string;
  teamrolespanel277: string;
  teamrolespanel287: string;
  teamrolespanel307: string;
  teamrolespanel310: string;
  teamrolespanel310_2: string;
  teamrolespanel316: string;
  teamrolespanel347: string;
  teamrolespanel350: string;
  teamrolespanel350_2: string;
  teamrolespanel357: string;
  teamrolespanel425: string;
  teamrolespanel429: string;
  teamrolespanel448: string;
  teamrolespanel469: string;
  teamrolespanel486: string;
  teamrolespanel516: string;
  teamrolespanel523: string;
  teamrolespanel531: string;
  teamrolespanel544: string;
  teamrolespanel544_2: string;
  teamrolespanel670: string;
  teamrolespanel673: string;
  messagingpanel1202: string;
  messagingpanel144: string;
  teamrolespanel632: string;
  kanbanboardpanel1338: string;
  kanbanboardpanel1341: string;
  kanbanboardpanel1346: string;
  kanbanboardpanel1349: string;
  kanbanboardpanel1361: string;
  kanbanboardpanel1353: string;
  kanbanboardpanel1385: string;
  kanbanboardpanel1394: string;
  kanbanboardpanel1401: string;
  kanbanboardpanel1408: string;
  kanbanboardpanel1436: string;
  kanbanboardpanel1451: string;
  kanbanboardpanel1451_2: string;
  kanbanboardpanel1460: string;
  kanbanboardpanel1466: string;
  kanbanboardpanel1480: string;
  kanbanboardpanel1492: string;
  kanbanboardpanel1621: string;
  kanbanboardpanel1631: string;
  kanbanboardpanel1677: string;
  teamrolespanel629: string;
  teamrolespanel594: string;
  teamrolespanel834: string;
  kanbanboardpanel1656: string;
  kanbanboardpanel1669: string;
  teamrolespanel586: string;
  teamrolespanel853: string;
  teamrolespanel843: string;
  teamrolespanel844: string;
  teamrolespanel849: string;
  kanbanboardpanel1602: string;
  kanbanboardpanel1611: string;
  kanbanboardpanel1614: string;
  kanbanboardpanel1578: string;
  kanbanboardpanel1558: string;
  kanbanboardpanel1564: string;
  kanbanboardpanel1525: string;
  kanbanboardpanel1317: string;
  kanbanboardpanel1317_2: string;
  kanbanboardpanel1324: string;
  kanbanboardpanel1294: string;
  kanbanboardpanel1303: string;
  kanbanboardpanel1213: string;
  kanbanboardpanel1198: string;
  kanbanboardpanel1194: string;
  kanbanboardpanel1187: string;
  kanbanboardpanel1183: string;
  kanbanboardpanel1179: string;
  kanbanboardpanel1175: string;
  kanbanboardpanel1168: string;
  kanbanboardpanel1169: string;
  kanbanboardpanel1166: string;
  kanbanboardpanel1152: string;
  kanbanboardpanel1130: string;
  kanbanboardpanel1127: string;
  kanbanboardpanel1124: string;
  kanbanboardpanel1108: string;
  kanbanboardpanel1109: string;
  kanbanboardpanel1102: string;
  kanbanboardpanel1092: string;
  kanbanboardpanel1095: string;
  kanbanboardpanel1087: string;
  kanbanboardpanel1087_2: string;
  kanbanboardpanel1066: string;
  kanbanboardpanel1034: string;
  kanbanboardpanel1031: string;
  kanbanboardpanel1026: string;
  kanbanboardpanel1026_2: string;
  kanbanboardpanel1005: string;
  kanbanboardpanel848: string;
  kanbanboardpanel845: string;
  kanbanboardpanel839: string;
  kanbanboardpanel822: string;
  kanbanboardpanel815: string;
  kanbanboardpanel812: string;
  kanbanboardpanel806: string;
  kanbanboardpanel789: string;
  kanbanboardpanel730: string;
  kanbanboardpanel733: string;
  kanbanboardpanel736: string;
  kanbanboardpanel714: string;
  kanbanboardpanel715: string;
  kanbanboardpanel707: string;
  kanbanboardpanel704: string;
  kanbanboardpanel699: string;
  kanbanboardpanel699_2: string;
  kanbanboardpanel670: string;
  kanbanboardpanel635: string;
  kanbanboardpanel631: string;
  kanbanboardpanel523: string;
  kanbanboardpanel527: string;
  kanbanboardpanel526: string;
  kanbanboardpanel497: string;
  kanbanboardpanel498: string;
  kanbanboardpanel494: string;
  kanbanboardpanel472: string;
  kanbanboardpanel473: string;
  kanbanboardpanel469: string;
  formsetmanagementpanel128: string;
  formsetmanagementpanel160: string;
  formsetmanagementpanel196: string;
  formsetmanagementpanel214: string;
  formsetmanagementpanel249: string;
  formsetmanagementpanel254: string;
  formsetmanagementpanel255: string;
  formsetmanagementpanel278: string;
  formsetmanagementpanel278_2: string;
  formsetmanagementpanel289: string;
  formsetmanagementpanel295: string;
  formsetmanagementpanel298: string;
  formsetmanagementpanel299: string;
  formsetmanagementpanel317: string;
  formsetmanagementpanel328: string;
  formsetmanagementpanel328_2: string;
  formsetmanagementpanel332: string;
  formsetmanagementpanel335: string;
  formsetmanagementpanel336: string;
  formsetmanagementpanel350: string;
  formsetmanagementpanel382: string;
  formsetmanagementpanel388: string;
  formsetmanagementpanel389: string;
  formsetmanagementpanel390: string;
  formsetmanagementpanel391: string;
  formsetmanagementpanel348: string;
  formsetmanagementpanel349: string;
  formsetmanagementpanel263: string;
  formsetmanagementpanel401: string;
  formsetmanagementpanel406: string;
  formsetmanagementpanel503: string;
  formsetmanagementpanel423: string;
  formsetmanagementpanel495: string;
  formsetmanagementpanel495_2: string;
  formsetmanagementpanel423_2: string;
  formsetmanagementpanel423_3: string;
  formsetmanagementpanel423_4: string;
  messagingpanel166: string;
  messagingpanel364: string;
  messagingpanel363: string;
  messagingpanel446: string;
  messagingpanel445: string;
  messagingpanel455: string;
  messagingpanel454: string;
  messagingpanel462: string;
  messagingpanel463: string;
  messagingpanel508: string;
  messagingpanel522: string;
  messagingpanel539: string;
  messagingpanel612: string;
  messagingpanel612_2: string;
  messagingpanel616: string;
  messagingpanel620: string;
  messagingpanel624: string;
  messagingpanel698: string;
  messagingpanel697: string;
  messagingpanel714: string;
  messagingpanel720: string;
  messagingpanel775: string;
  messagingpanel781: string;
  messagingpanel845: string;
  messagingpanel859: string;
  messagingpanel871: string;
  messagingpanel877: string;
  messagingpanel943: string;
  messagingpanel957: string;
  messagingpanel957_2: string;
  messagingpanel958: string;
  messagingpanel959: string;
  messagingpanel1002: string;
  messagingpanel1011: string;
  messagingpanel1011_2: string;
  messagingpanel1030: string;
  messagingpanel1084: string;
  messagingpanel1089: string;
  messagingpanel1106: string;
  messagingpanel1106_2: string;
  messagingpanel1130: string;
  messagingpanel1142: string;
  messagingpanel1152: string;
  messagingpanel1162: string;
  messagingpanel1163: string;
  messagingpanel1164: string;
  messagingpanel1165: string;
  messagingpanel1180: string;
  messagingpanel1187: string;
  messagingpanel1209: string;
  messagingpanel1216: string;
  messagingpanel1224: string;
  messagingpanel1226: string;
  messagingpanel1240: string;
  messagingpanel1248: string;
  messagingpanel1251: string;
  messagingpanel1253: string;
  messagingpanel1265: string;
  messagingpanel1262: string;
  messagingpanel1275: string;
  messagingpanel1285: string;
  messagingpanel1298: string;
  messagingpanel1298_2: string;
  messagingpanel1302: string;
  messagingpanel1302_2: string;
  messagingpanel1340: string;
  messagingpanel1346: string;
  messagingpanel1346_2: string;
  messagingpanel1346_3: string;
  messagingpanel1367: string;
  messagingpanel1376: string;
  messagingpanel1382: string;
  messagingpanel1395: string;
  messagingpanel1406: string;
  messagingpanel1411: string;
  messagingpanel1422: string;
  messagingpanel1425: string;
  messagingpanel1436: string;
  messagingpanel1437: string;
  messagingpanel1438: string;
  messagingpanel1442: string;
  messagingpanel1400: string;
  messagingpanel1402: string;
  messagingpanel1407: string;
  messagingpanel1413: string;
  messagingpanel1451: string;
  messagingpanel330: string;
  messagingpanel331: string;
  messagingpanel351: string;
  messagingpanel133: string;
  gitpushmodal114: string;
  gitpushmodal78: string;
  gitpushmodal85: string;
  gitpushmodal91: string;
  gitpushmodal91_2: string;
  gitpushmodal91_3: string;
  gitpushmodal106: string;
  gitpushmodal138: string;
  gitpushmodal151: string;
  gitpushmodal155: string;
  gitpushmodal160: string;
  gitpushmodal169: string;
  gitpushmodal184: string;
  gitpushmodal186: string;
  gitpushmodal188: string;
  gitpushmodal194: string;
  gitpushmodal203: string;
  gitpushmodal207: string;
  gitpushmodal216: string;
  gitpushmodal217: string;
  gitpushmodal218: string;
  gitpushmodal219: string;
  gitpushmodal241: string;
  gitpushmodal236: string;
  gitpushmodal249: string;
  gitpushmodal262: string;
  gitpushmodal284: string;
  gitpushmodal297: string;
  gitpushmodal304: string;
  gitpushmodal304_2: string;
  gitpushmodal311: string;
  gitpushmodal323: string;
  gitpushmodal339: string;
  gitpushmodal362: string;
  gitpushmodal367: string;
  gitpushmodal373: string;
  gitpushmodal379: string;
  gitpushmodal393: string;
  gitpushmodal407: string;
  gitpushmodal418: string;
  gitpushmodal424: string;
  gitpushmodal435: string;
  gitpushmodal444: string;
  gitpushmodal450: string;
  databasemanagementpanel593: string;
  databasemanagementpanel532: string;
  projectsettingspanel975: string;
  formdesignerpanel116: string;
  formdesignerpanel1559: string;
  formdesignerpanel2212: string;
  formdesignerpanel389: string;
  formdesignerpanel237: string;
  formdesignerpanel302: string;
  formdesignerpanel303: string;
  formdesignerpanel304: string;
  formdesignerpanel305: string;
  formdesignerpanel322: string;
  formdesignerpanel323: string;
  formdesignerpanel325: string;
  formdesignerpanel325_2: string;
  formdesignerpanel327: string;
  formdesignerpanel520: string;
  formdesignerpanel521: string;
  formdesignerpanel522: string;
  formdesignerpanel523: string;
  formdesignerpanel524: string;
  formdesignerpanel536: string;
  formdesignerpanel537: string;
  formdesignerpanel538: string;
  formdesignerpanel539: string;
  formdesignerpanel542: string;
  formdesignerpanel543: string;
  formdesignerpanel544: string;
  formdesignerpanel545: string;
  formdesignerpanel546: string;
  formdesignerpanel547: string;
  formdesignerpanel550: string;
  formdesignerpanel551: string;
  formdesignerpanel573: string;
  formdesignerpanel574: string;
  formdesignerpanel592: string;
  formdesignerpanel596: string;
  formdesignerpanel595: string;
  formdesignerpanel589: string;
  formdesignerpanel642: string;
  formdesignerpanel643: string;
  formdesignerpanel669: string;
  formdesignerpanel670: string;
  formdesignerpanel676: string;
  formdesignerpanel676_2: string;
  formdesignerpanel694: string;
  formdesignerpanel694_2: string;
  formdesignerpanel715: string;
  formdesignerpanel718: string;
  formdesignerpanel719: string;
  formdesignerpanel783: string;
  formdesignerpanel783_2: string;
  formdesignerpanel875: string;
  formdesignerpanel879: string;
  formdesignerpanel878: string;
  formdesignerpanel950: string;
  formdesignerpanel950_2: string;
  formdesignerpanel953: string;
  formdesignerpanel956: string;
  formdesignerpanel957: string;
  formdesignerpanel1014: string;
  formdesignerpanel1014_2: string;
  formdesignerpanel1021: string;
  formdesignerpanel1022: string;
  formdesignerpanel1030: string;
  formdesignerpanel1030_2: string;
  formdesignerpanel1058: string;
  formdesignerpanel1059: string;
  formdesignerpanel1061: string;
  formdesignerpanel1062: string;
  formdesignerpanel1087: string;
  formdesignerpanel1088: string;
  formdesignerpanel1090: string;
  formdesignerpanel1091: string;
  formdesignerpanel1142: string;
  formdesignerpanel1152: string;
  formdesignerpanel1153: string;
  formdesignerpanel1155: string;
  formdesignerpanel1156: string;
  formdesignerpanel1312: string;
  formdesignerpanel1316: string;
  formdesignerpanel1321: string;
  formdesignerpanel1328: string;
  formdesignerpanel1362: string;
  formdesignerpanel1362_2: string;
  formdesignerpanel1365: string;
  formdesignerpanel1372: string;
  formdesignerpanel1375: string;
  formdesignerpanel1381: string;
  formdesignerpanel1395: string;
  formdesignerpanel1395_2: string;
  formdesignerpanel1581: string;
  formdesignerpanel1585: string;
  formdesignerpanel1603: string;
  formdesignerpanel1699: string;
  formdesignerpanel1680: string;
  formdesignerpanel1762: string;
  formdesignerpanel1801: string;
  formdesignerpanel1823: string;
  formdesignerpanel1851: string;
  formdesignerpanel1869: string;
  formdesignerpanel1870: string;
  formdesignerpanel1950: string;
  formdesignerpanel1979: string;
  formdesignerpanel2013: string;
  formdesignerpanel2017: string;
  formdesignerpanel2024: string;
  formdesignerpanel2032: string;
  formdesignerpanel2069: string;
  formdesignerpanel2072: string;
  formdesignerpanel2082: string;
  formdesignerpanel2096: string;
  formdesignerpanel2099: string;
  formdesignerpanel2117: string;
  formdesignerpanel2135: string;
  formdesignerpanel2159: string;
  formdesignerpanel2162: string;
  formdesignerpanel2172: string;
  formdesignerpanel2182: string;
  formdesignerpanel2192: string;
  formdesignerpanel2202: string;
  formdesignerpanel2213: string;
  formdesignerpanel2234: string;
  formdesignerpanel2243: string;
  formdesignerpanel2255: string;
  formdesignerpanel2259: string;
  formdesignerpanel2265: string;
  formdesignerpanel2273: string;
  formdesignerpanel2274: string;
  formdesignerpanel2275: string;
  formdesignerpanel2286: string;
  formdesignerpanel2291: string;
  formdesignerpanel2305: string;
  formdesignerpanel2316: string;
  formdesignerpanel2327: string;
  formdesignerpanel2331: string;
  formdesignerpanel2335: string;
  formdesignerpanel2336: string;
  formdesignerpanel2337: string;
  formdesignerpanel2349: string;
  formdesignerpanel2362: string;
  formdesignerpanel2360: string;
  formdesignerpanel2367: string;
  formdesignerpanel2374: string;
  formdesignerpanel2380: string;
  formdesignerpanel2391: string;
  formdesignerpanel2404: string;
  formdesignerpanel2415: string;
  formdesignerpanel2428: string;
  formdesignerpanel2439: string;
  formdesignerpanel2452: string;
  formdesignerpanel2463: string;
  formdesignerpanel2476: string;
  formdesignerpanel2491: string;
  formdesignerpanel2506: string;
  formdesignerpanel2512: string;
  formdesignerpanel2525: string;
  formdesignerpanel2525_2: string;
  formdesignerpanel2536: string;
  formdesignerpanel2536_2: string;
  formdesignerpanel2546: string;
  formdesignerpanel2554: string;
  formdesignerpanel2559: string;
  formdesignerpanel2581: string;
  formdesignerpanel2581_2: string;
  formdesignerpanel2588: string;
  formdesignerpanel2591: string;
  formdesignerpanel2619: string;
  formdesignerpanel2621: string;
  formdesignerpanel2622: string;
  formdesignerpanel2631: string;
  formdesignerpanel2635: string;
  formdesignerpanel2658: string;
  formdesignerpanel2658_2: string;
  formdesignerpanel2665: string;
  formdesignerpanel2669: string;
  formdesignerpanel2677: string;
  formdesignerpanel2684: string;
  formdesignerpanel2689: string;
  formdesignerpanel2692: string;
  formdesignerpanel2701: string;
  formdesignerpanel2718: string;
  formdesignerpanel2725: string;
  formdesignerpanel2269: string;
  formdesignerpanel2252: string;
  formdesignerpanel1386: string;
  formdesignerpanel2520: string;
  formdesignerpanel2526: string;
  codeadjustmentspanel2537: string;
  databasemanagementpanel1346: string;
  databasemanagementpanel1353: string;
  databasemanagementpanel1354: string;
  databasemanagementpanel1355: string;
  databasemanagementpanel1366: string;
  databasemanagementpanel1375: string;
  databasemanagementpanel1383: string;
  databasemanagementpanel1420: string;
  databasemanagementpanel1426: string;
  databasemanagementpanel1427: string;
  databasemanagementpanel1428: string;
  databasemanagementpanel1431: string;
  databasemanagementpanel1438: string;
  databasemanagementpanel1447: string;
  databasemanagementpanel1455: string;
  databasemanagementpanel1497: string;
  databasemanagementpanel1497_2: string;
  databasemanagementpanel1537: string;
  databasemanagementpanel1552: string;
  databasemanagementpanel1558: string;
  databasemanagementpanel1572: string;
  databasemanagementpanel1584: string;
  databasemanagementpanel1600: string;
  databasemanagementpanel1603: string;
  databasemanagementpanel1619: string;
  databasemanagementpanel1630: string;
  databasemanagementpanel1669: string;
  databasemanagementpanel1684: string;
  databasemanagementpanel1690: string;
  databasemanagementpanel1704: string;
  databasemanagementpanel1729: string;
  databasemanagementpanel1732: string;
  databasemanagementpanel1783: string;
  databasemanagementpanel1801: string;
  databasemanagementpanel1811: string;
  databasemanagementpanel1825: string;
  databasemanagementpanel1856: string;
  databasemanagementpanel1880: string;
  databasemanagementpanel1881: string;
  databasemanagementpanel1882: string;
  databasemanagementpanel1883: string;
  databasemanagementpanel1884: string;
  databasemanagementpanel1889: string;
  databasemanagementpanel1895: string;
  databasemanagementpanel1895_2: string;
  databasemanagementpanel1912: string;
  databasemanagementpanel1912_2: string;
  databasemanagementpanel1958: string;
  databasemanagementpanel1961: string;
  databasemanagementpanel1967: string;
  databasemanagementpanel1980: string;
  databasemanagementpanel2024: string;
  databasemanagementpanel2027: string;
  databasemanagementpanel2033: string;
  databasemanagementpanel2047: string;
  databasemanagementpanel2084: string;
  databasemanagementpanel2087: string;
  databasemanagementpanel2093: string;
  databasemanagementpanel2104: string;
  databasemanagementpanel2144: string;
  databasemanagementpanel2151: string;
  databasemanagementpanel2172: string;
  databasemanagementpanel2135: string;
  panelt22489: string;
  panelt23067: string;
  profilemodal1613: string;
  profilemodal2190: string;
  codegenerationpanel3164: string;
  newnavigationpanel1207: string;
  newnavigationpanel1211: string;
  newnavigationpanel1216: string;
  newnavigationpanel1229: string;
  newnavigationpanel1229_2: string;
  newnavigationpanel1242: string;
  newnavigationpanel1250: string;
  newnavigationpanel1260: string;
  newnavigationpanel168: string;
  profilemodal2486: string;
  publicprojectspanel584: string;
  publicprojectspanel609: string;
  publicprojectspanel609_2: string;
  publicprojectspanel611: string;
  publicprojectspanel581: string;
  publicprojectspanel587: string;
  publicprojectspanel578: string;
  publicprojectspanel553: string;
  publicprojectspanel561: string;
  publicprojectspanel565: string;
  publicprojectspanel545: string;
  publicprojectspanel546: string;
  publicprojectspanel541: string;
  publicprojectspanel447: string;
  publicprojectspanel244: string;
  publicprojectspanel250: string;
  publicprojectspanel250_2: string;
  publicprojectspanel189: string;
  publicprojectspanel127: string;
  publicprojectspanel127_2: string;
  profilemodal1438: string;
  profilemodal1451: string;
  topbar315: string;
  topbar315_2: string;
  editprojectmodal578: string;
  editprojectmodal594: string;
  editprojectmodal619: string;
  editprojectmodal640: string;
  editprojectmodal647: string;
  editprojectmodal658: string;
  editprojectmodal662: string;
  editprojectmodal701: string;
  projectattachmentspanel519: string;
  projectattachmentspanel513: string;
  projectattachmentspanel503: string;
  projectattachmentspanel496: string;
  projectattachmentspanel489: string;
  projectattachmentspanel483: string;
  projectattachmentspanel435: string;
  messagingpanel1271: string;
  profilemodal1687: string;
  profilemodal1693: string;
  profilemodal1706: string;
  profilemodal1706_2: string;
  profilemodal1715: string;
  profilemodal1755: string;
  profilemodal1760: string;
  profilemodal1769: string;
  profilemodal1808: string;
  profilemodal1817: string;
  profilemodal1848: string;
  twofactorsection410: string;
  twofactorsection94: string;
  twofactorsection146: string;
  twofactorsection154: string;
  twofactorsection187: string;
  twofactorsection195: string;
  twofactorsection210: string;
  twofactorsection261: string;
  twofactorsection269: string;
  twofactorsection271: string;
  twofactorsection296: string;
  twofactorsection320: string;
  twofactorsection341: string;
  twofactorsection366: string;
  twofactorsection374: string;
  twofactorsection384: string;
  twofactorsection418: string;
  twofactorsection419: string;
  twofactorsection429: string;
  twofactorsection434: string;
  twofactorsection436: string;
  twofactorsection442: string;
  twofactorsection450: string;
  twofactorsection462: string;
  twofactorsection470: string;
  twofactorsection485: string;
  twofactorsection504: string;
  twofactorsection507: string;
  twofactorsection510: string;
  twofactorsection513: string;
  twofactorsection520: string;
  twofactorsection531: string;
  twofactorsection549: string;
  twofactorsection555: string;
  twofactorsection575: string;
  twofactorsection566: string;
  twofactorsection587: string;
  twofactorsection593: string;
  twofactorsection604: string;
  twofactorsection621: string;
  twofactorsection627: string;
  twofactorsection639: string;
  twofactorsection648: string;
  twofactorsection651: string;
  twofactorsection666: string;
  twofactorsection675: string;
  twofactorsection681: string;
  twofactorsection702: string;
  twofactorsection706: string;
  twofactorsection693: string;
  twofactorsection719: string;
  twofactorsection725: string;
  twofactorsection733: string;
  twofactorsection739: string;
  twofactorsection750: string;
  twofactorsection762: string;
  twofactorsection781: string;
  twofactorsection795: string;
  twofactorsection819: string;
  twofactorsection823: string;
  twofactorsection839: string;
  twofactorsection845: string;
  twofactorsection855: string;
  twofactorsection871: string;
  twofactorsection878: string;
  twofactorsection884: string;
  twofactorsection500: string;
  profilemodal1647: string;
  profilemodal1945: string;
  profilemodal1955: string;
  profilemodal1958: string;
  profilemodal1977: string;
  profilemodal2026: string;
  profilemodal2026_2: string;
  profilemodal2026_3: string;
  profilemodal2031: string;
  profilemodal2031_2: string;
  profilemodal2048: string;
  profilemodal2048_2: string;
  profilemodal2089: string;
  profilemodal2121: string;
  profilemodal2121_2: string;
  profilemodal2150: string;
  profilemodal2151: string;
  profilemodal2161: string;
  profilemodal2161_2: string;
  profilemodal2170: string;
  profilemodal2173: string;
  profilemodal2181: string;
  profilemodal2194: string;
  profilemodal2201: string;
  profilemodal2209: string;
  profilemodal2214: string;
  profilemodal2218: string;
  profilemodal2222: string;
  profilemodal2226: string;
  profilemodal2265: string;
  profilemodal2271: string;
  messagingpanel1434: string;
  newnavigationpanel584: string;
  newnavigationpanel1076: string;
  index796: string;
  profilemodal1682: string;
  profilemodal1681: string;
  profilemodal1924: string;
  profilemodal1924_2: string;
  profilemodal2524: string;
  profilemodal2535: string;
  profilemodal2538: string;
  profilemodal2545: string;
  profilemodal2548: string;
  profilemodal2548_2: string;
  profilemodal2556: string;
  profilemodal2570: string;
  profilemodal2586: string;
  profilemodal2589: string;
  profilemodal2597: string;
  profilemodal2606: string;
  profilemodal2637: string;
  profilemodal2648: string;
  profilemodal2657: string;
  profilemodal2672: string;
  profilemodal2675: string;
  profilemodal2676: string;
  profilemodal2677: string;
  profilemodal2678: string;
  profilemodal2679: string;
  profilemodal2708: string;
  profilemodal2740: string;
  profilemodal2740_2: string;
  profilemodal2753: string;
  profilemodal2753_2: string;
  profilemodal1417: string;
}