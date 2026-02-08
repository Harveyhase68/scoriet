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
  debugschemas22: string;
  debugschemas29: string;
  debugschemas38: string;
  debugschemas49: string;
  debugschemas56: string;
  debugschemas70: string;

  // app\Console\Commands\DemoReset.php
  demoreset16: string;
  demoreset23: string;
  demoreset31: string;
  demoreset35: string;
  demoreset45: string;
  demoreset46: string;
  demoreset53: string;
  demoreset60: string;
  demoreset65: string;
  demoreset70: string;
  demoreset89: string;
  demoreset92: string;

  // app\Console\Commands\FixTemplateFilePaths.php
  fixtemplatefilepaths23: string;
  fixtemplatefilepaths30: string;
  fixtemplatefilepaths43: string;
  fixtemplatefilepaths46: string;
  fixtemplatefilepaths50: string;
  fixtemplatefilepaths70: string;
  fixtemplatefilepaths74: string;

  // app\Console\Commands\TestObservers.php
  testobservers28: string;
  testobservers37: string;
  testobservers42: string;
  testobservers68: string;
  testobservers69: string;
  testobservers71: string;
  testobservers72: string;
  testobservers77: string;
  testobservers83: string;
  testobservers92: string;
  testobservers98: string;
  testobservers103: string;
  testobservers106: string;
  testobservers107: string;
  testobservers111: string;
  testobservers114: string;
  testobservers120: string;
  testobservers126: string;
  testobservers139: string;
  testobservers144: string;
  testobservers147: string;
  testobservers148: string;
  testobservers152: string;
  testobservers158: string;
  testobservers164: string;
  testobservers174: string;
  testobservers183: string;
  testobservers187: string;
  testobservers191: string;
  testobservers194: string;
  testobservers200: string;
  testobservers210: string;
  testobservers218: string;
  testobservers224: string;
  testobservers227: string;
  testobservers228: string;
  testobservers232: string;
  testobservers235: string;
  testobservers241: string;
  testobservers247: string;
  testobservers260: string;
  testobservers264: string;
  testobservers268: string;
  testobservers272: string;
  testobservers275: string;

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas23: string;
  testprojectschemas32: string;
  testprojectschemas37: string;
  testprojectschemas47: string;
  testprojectschemas50: string;
  testprojectschemas54: string;
  testprojectschemas59: string;
  testprojectschemas73: string;
  testprojectschemas79: string;
  testprojectschemas83: string;

  // app\Console\Commands\TestTreeGenerator.php
  testtreegenerator25: string;
  testtreegenerator34: string;
  testtreegenerator40: string;
  testtreegenerator44: string;
  testtreegenerator52: string;
  testtreegenerator62: string;
  testtreegenerator71: string;
  testtreegenerator81: string;
  testtreegenerator95: string;
  testtreegenerator101: string;
  testtreegenerator102: string;
  testtreegenerator103: string;

  // app\Console\Commands\TestTreeUpdate.php
  testtreeupdate23: string;
  testtreeupdate32: string;
  testtreeupdate37: string;
  testtreeupdate44: string;
  testtreeupdate45: string;
  testtreeupdate48: string;
  testtreeupdate50: string;

  // app\Http\Controllers\Admin\PageController.php
  pagecontroller50: string;
  pagecontroller89: string;

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller36: string;
  autotranslatecontroller41: string;
  autotranslatecontroller49: string;
  autotranslatecontroller57: string;
  autotranslatecontroller74: string;
  autotranslatecontroller83: string;
  autotranslatecontroller91: string;
  autotranslatecontroller94: string;
  autotranslatecontroller99: string;
  autotranslatecontroller114: string;

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: string;
  languagecontroller102: string;

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller155: string;
  projectcontroller187: string;
  projectcontroller188: string;
  projectcontroller190: string;
  projectcontroller230: string;
  projectcontroller246: string;
  projectcontroller294: string;
  projectcontroller300: string;
  projectcontroller361: string;
  projectcontroller367: string;
  projectcontroller377: string;
  projectcontroller382: string;
  projectcontroller392: string;
  projectcontroller397: string;
  projectcontroller407: string;
  projectcontroller429: string;
  projectcontroller451: string;
  projectcontroller523: string;
  projectcontroller540: string;
  projectcontroller556: string;
  projectcontroller566: string;
  projectcontroller571: string;
  projectcontroller576: string;
  projectcontroller582: string;
  projectcontroller592: string;
  projectcontroller605: string;
  projectcontroller610: string;
  projectcontroller616: string;
  projectcontroller626: string;
  projectcontroller631: string;
  projectcontroller637: string;
  projectcontroller649: string;
  projectcontroller675: string;
  projectcontroller724: string;
  projectcontroller778: string;
  projectcontroller788: string;
  projectcontroller793: string;
  projectcontroller798: string;
  projectcontroller814: string;
  projectcontroller828: string;
  projectcontroller839: string;
  projectcontroller844: string;
  projectcontroller849: string;
  projectcontroller861: string;
  projectcontroller876: string;
  projectcontroller890: string;
  projectcontroller907: string;
  projectcontroller1000: string;
  projectcontroller1026: string;
  projectcontroller1033: string;

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php
  projectgenerationtreecontroller23: string;
  projectgenerationtreecontroller52: string;
  projectgenerationtreecontroller61: string;

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller118: string;
  schemacontroller139: string;
  schemacontroller173: string;
  schemacontroller191: string;
  schemacontroller206: string;
  schemacontroller215: string;
  schemacontroller226: string;
  schemacontroller228: string;
  schemacontroller233: string;
  schemacontroller235: string;
  schemacontroller240: string;
  schemacontroller248: string;
  schemacontroller259: string;
  schemacontroller264: string;
  schemacontroller269: string;
  schemacontroller274: string;
  schemacontroller279: string;
  schemacontroller284: string;
  schemacontroller288: string;
  schemacontroller293: string;
  schemacontroller298: string;
  schemacontroller302: string;
  schemacontroller307: string;
  schemacontroller310: string;
  schemacontroller316: string;
  schemacontroller323: string;
  schemacontroller330: string;
  schemacontroller345: string;
  schemacontroller372: string;
  schemacontroller393: string;
  schemacontroller431: string;
  schemacontroller450: string;
  schemacontroller452: string;
  schemacontroller453: string;
  schemacontroller455: string;
  schemacontroller470: string;
  schemacontroller489: string;
  schemacontroller514: string;
  schemacontroller617: string;
  schemacontroller622: string;
  schemacontroller651: string;
  schemacontroller657: string;
  schemacontroller684: string;
  schemacontroller804: string;
  schemacontroller810: string;
  schemacontroller827: string;
  schemacontroller833: string;
  schemacontroller840: string;
  schemacontroller854: string;
  schemacontroller880: string;
  schemacontroller885: string;
  schemacontroller890: string;
  schemacontroller894: string;
  schemacontroller911: string;
  schemacontroller924: string;
  schemacontroller935: string;
  schemacontroller938: string;
  schemacontroller944: string;
  schemacontroller953: string;
  schemacontroller966: string;
  schemacontroller970: string;
  schemacontroller974: string;
  schemacontroller990: string;
  schemacontroller999: string;
  schemacontroller1006: string;
  schemacontroller1010: string;
  schemacontroller1030: string;
  schemacontroller1048: string;
  schemacontroller1087: string;
  schemacontroller1110: string;
  schemacontroller1116: string;
  schemacontroller1125: string;
  schemacontroller1126: string;
  schemacontroller1158: string;
  schemacontroller1165: string;
  schemacontroller1182: string;
  schemacontroller1249: string;
  schemacontroller1256: string;
  schemacontroller1261: string;
  schemacontroller1278: string;
  schemacontroller1284: string;
  schemacontroller1293: string;
  schemacontroller1301: string;
  schemacontroller1314: string;
  schemacontroller1320: string;
  schemacontroller1322: string;
  schemacontroller1328: string;
  schemacontroller1358: string;
  schemacontroller1365: string;
  schemacontroller1370: string;
  schemacontroller1381: string;
  schemacontroller1387: string;
  schemacontroller1396: string;
  schemacontroller1404: string;
  schemacontroller1416: string;
  schemacontroller1422: string;
  schemacontroller1426: string;
  schemacontroller1428: string;
  schemacontroller1434: string;
  schemacontroller1461: string;
  schemacontroller1468: string;
  schemacontroller1479: string;
  schemacontroller1485: string;
  schemacontroller1493: string;
  schemacontroller1505: string;
  schemacontroller1511: string;
  schemacontroller1515: string;
  schemacontroller1517: string;
  schemacontroller1523: string;

  // app\Http\Controllers\Api\SchemaTranslationController.php
  schematranslationcontroller71: string;
  schematranslationcontroller102: string;
  schematranslationcontroller115: string;
  schematranslationcontroller144: string;
  schematranslationcontroller188: string;
  schematranslationcontroller263: string;

  // app\Http\Controllers\Api\SettingsController.php
  settingscontroller16: string;
  settingscontroller49: string;

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller29: string;
  templatecontroller92: string;
  templatecontroller96: string;
  templatecontroller101: string;
  templatecontroller108: string;
  templatecontroller129: string;
  templatecontroller141: string;
  templatecontroller145: string;
  templatecontroller156: string;
  templatecontroller170: string;
  templatecontroller245: string;
  templatecontroller268: string;
  templatecontroller288: string;
  templatecontroller292: string;
  templatecontroller297: string;
  templatecontroller307: string;
  templatecontroller314: string;
  templatecontroller333: string;
  templatecontroller338: string;
  templatecontroller422: string;
  templatecontroller437: string;
  templatecontroller522: string;
  templatecontroller524: string;
  templatecontroller526: string;
  templatecontroller537: string;
  templatecontroller550: string;
  templatecontroller552: string;
  templatecontroller554: string;
  templatecontroller567: string;
  templatecontroller580: string;
  templatecontroller582: string;
  templatecontroller584: string;
  templatecontroller591: string;
  templatecontroller620: string;
  templatecontroller649: string;
  templatecontroller682: string;
  templatecontroller717: string;
  templatecontroller731: string;
  templatecontroller741: string;
  templatecontroller749: string;
  templatecontroller763: string;
  templatecontroller777: string;
  templatecontroller781: string;
  templatecontroller789: string;
  templatecontroller803: string;
  templatecontroller814: string;
  templatecontroller822: string;
  templatecontroller827: string;
  templatecontroller841: string;
  templatecontroller856: string;
  templatecontroller892: string;
  templatecontroller927: string;
  templatecontroller936: string;
  templatecontroller944: string;
  templatecontroller954: string;
  templatecontroller957: string;
  templatecontroller961: string;
  templatecontroller965: string;
  templatecontroller970: string;
  templatecontroller975: string;
  templatecontroller977: string;
  templatecontroller983: string;
  templatecontroller984: string;
  templatecontroller985: string;

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller30: string;
  translationexportcontroller34: string;
  translationexportcontroller48: string;
  translationexportcontroller51: string;
  translationexportcontroller78: string;
  translationexportcontroller103: string;
  translationexportcontroller131: string;
  translationexportcontroller175: string;
  translationexportcontroller197: string;
  translationexportcontroller223: string;
  translationexportcontroller224: string;
  translationexportcontroller273: string;
  translationexportcontroller278: string;
  translationexportcontroller312: string;
  translationexportcontroller331: string;
  translationexportcontroller339: string;

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller42: string;
  ultimatetemplatecontroller55: string;
  ultimatetemplatecontroller102: string;
  ultimatetemplatecontroller151: string;
  ultimatetemplatecontroller165: string;
  ultimatetemplatecontroller174: string;
  ultimatetemplatecontroller177: string;
  ultimatetemplatecontroller196: string;
  ultimatetemplatecontroller216: string;
  ultimatetemplatecontroller241: string;
  ultimatetemplatecontroller270: string;
  ultimatetemplatecontroller271: string;
  ultimatetemplatecontroller272: string;
  ultimatetemplatecontroller274: string;
  ultimatetemplatecontroller295: string;
  ultimatetemplatecontroller300: string;
  ultimatetemplatecontroller301: string;
  ultimatetemplatecontroller308: string;
  ultimatetemplatecontroller309: string;
  ultimatetemplatecontroller311: string;
  ultimatetemplatecontroller359: string;
  ultimatetemplatecontroller535: string;
  ultimatetemplatecontroller563: string;
  ultimatetemplatecontroller770: string;
  ultimatetemplatecontroller771: string;
  ultimatetemplatecontroller772: string;
  ultimatetemplatecontroller804: string;
  ultimatetemplatecontroller815: string;
  ultimatetemplatecontroller825: string;
  ultimatetemplatecontroller833: string;
  ultimatetemplatecontroller879: string;
  ultimatetemplatecontroller881: string;

  // app\Http\Controllers\AuthController.php
  authcontroller42: string;
  authcontroller44: string;
  authcontroller48: string;
  authcontroller50: string;
  authcontroller54: string;
  authcontroller56: string;
  authcontroller59: string;
  authcontroller61: string;
  authcontroller83: string;
  authcontroller100: string;
  authcontroller124: string;
  authcontroller128: string;
  authcontroller147: string;
  authcontroller156: string;
  authcontroller165: string;
  authcontroller183: string;
  authcontroller190: string;
  authcontroller209: string;
  authcontroller220: string;
  authcontroller225: string;
  authcontroller242: string;
  authcontroller260: string;
  authcontroller265: string;
  authcontroller292: string;
  authcontroller310: string;
  authcontroller329: string;
  authcontroller337: string;
  authcontroller346: string;
  authcontroller359: string;
  authcontroller367: string;
  authcontroller374: string;
  authcontroller378: string;
  authcontroller389: string;
  authcontroller401: string;
  authcontroller412: string;
  authcontroller418: string;
  authcontroller429: string;
  authcontroller442: string;
  authcontroller449: string;
  authcontroller466: string;
  authcontroller474: string;
  authcontroller488: string;
  authcontroller492: string;
  authcontroller506: string;
  authcontroller521: string;
  authcontroller532: string;
  authcontroller537: string;

  // app\Http\Controllers\Auth\PasswordResetLinkController.php
  passwordresetlinkcontroller39: string;

  // app\Http\Controllers\CustomTokenController.php
  customtokencontroller51: string;
  customtokencontroller58: string;
  customtokencontroller71: string;
  customtokencontroller98: string;
  customtokencontroller101: string;

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller59: string;
  dbschemacontroller66: string;
  dbschemacontroller77: string;
  dbschemacontroller95: string;
  dbschemacontroller111: string;
  dbschemacontroller129: string;
  dbschemacontroller145: string;
  dbschemacontroller157: string;
  dbschemacontroller171: string;
  dbschemacontroller195: string;
  dbschemacontroller207: string;
  dbschemacontroller212: string;
  dbschemacontroller223: string;
  dbschemacontroller256: string;
  dbschemacontroller264: string;
  dbschemacontroller281: string;
  dbschemacontroller288: string;
  dbschemacontroller305: string;
  dbschemacontroller310: string;
  dbschemacontroller317: string;
  dbschemacontroller332: string;
  dbschemacontroller335: string;
  dbschemacontroller460: string;
  dbschemacontroller472: string;

  // app\Http\Controllers\PageController.php
  pagecontroller43: string;
  pagecontroller46: string;
  pagecontroller67: string;
  pagecontroller70: string;

  // app\Http\Controllers\ProjectApplicationController.php
  projectapplicationcontroller24: string;
  projectapplicationcontroller36: string;
  projectapplicationcontroller49: string;
  projectapplicationcontroller64: string;
  projectapplicationcontroller85: string;
  projectapplicationcontroller106: string;
  projectapplicationcontroller118: string;
  projectapplicationcontroller120: string;
  projectapplicationcontroller130: string;
  projectapplicationcontroller131: string;
  projectapplicationcontroller137: string;
  projectapplicationcontroller153: string;
  projectapplicationcontroller158: string;
  projectapplicationcontroller164: string;
  projectapplicationcontroller166: string;
  projectapplicationcontroller173: string;
  projectapplicationcontroller176: string;
  projectapplicationcontroller179: string;
  projectapplicationcontroller210: string;
  projectapplicationcontroller211: string;
  projectapplicationcontroller220: string;
  projectapplicationcontroller221: string;
  projectapplicationcontroller231: string;
  projectapplicationcontroller237: string;
  projectapplicationcontroller243: string;

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller26: string;
  projectinvitationcontroller37: string;
  projectinvitationcontroller50: string;
  projectinvitationcontroller61: string;
  projectinvitationcontroller80: string;
  projectinvitationcontroller88: string;
  projectinvitationcontroller89: string;
  projectinvitationcontroller103: string;
  projectinvitationcontroller107: string;
  projectinvitationcontroller112: string;
  projectinvitationcontroller113: string;
  projectinvitationcontroller114: string;
  projectinvitationcontroller115: string;
  projectinvitationcontroller138: string;
  projectinvitationcontroller143: string;
  projectinvitationcontroller150: string;
  projectinvitationcontroller154: string;
  projectinvitationcontroller167: string;
  projectinvitationcontroller172: string;
  projectinvitationcontroller179: string;
  projectinvitationcontroller187: string;
  projectinvitationcontroller194: string;
  projectinvitationcontroller206: string;
  projectinvitationcontroller210: string;
  projectinvitationcontroller240: string;
  projectinvitationcontroller250: string;
  projectinvitationcontroller254: string;
  projectinvitationcontroller258: string;
  projectinvitationcontroller262: string;
  projectinvitationcontroller266: string;
  projectinvitationcontroller269: string;
  projectinvitationcontroller273: string;
  projectinvitationcontroller275: string;
  projectinvitationcontroller286: string;
  projectinvitationcontroller296: string;
  projectinvitationcontroller310: string;
  projectinvitationcontroller316: string;
  projectinvitationcontroller323: string;
  projectinvitationcontroller330: string;
  projectinvitationcontroller343: string;
  projectinvitationcontroller349: string;
  projectinvitationcontroller358: string;

  // app\Http\Controllers\QueueTestController.php
  queuetestcontroller61: string;
  queuetestcontroller65: string;
  queuetestcontroller69: string;
  queuetestcontroller77: string;
  queuetestcontroller86: string;
  queuetestcontroller89: string;
  queuetestcontroller102: string;
  queuetestcontroller106: string;
  queuetestcontroller116: string;
  queuetestcontroller117: string;
  queuetestcontroller122: string;
  queuetestcontroller126: string;
  queuetestcontroller127: string;
  queuetestcontroller130: string;
  queuetestcontroller142: string;
  queuetestcontroller145: string;
  queuetestcontroller162: string;
  queuetestcontroller173: string;
  queuetestcontroller181: string;
  queuetestcontroller201: string;
  queuetestcontroller211: string;
  queuetestcontroller212: string;
  queuetestcontroller213: string;

  // app\Http\Controllers\SchemaController.php
  schemacontroller21: string;
  schemacontroller64: string;
  schemacontroller71: string;
  schemacontroller82: string;
  schemacontroller105: string;
  schemacontroller117: string;
  schemacontroller132: string;
  schemacontroller155: string;
  schemacontroller169: string;
  schemacontroller183: string;
  schemacontroller193: string;
  schemacontroller216: string;
  schemacontroller225: string;
  schemacontroller234: string;
  schemacontroller256: string;
  schemacontroller272: string;
  schemacontroller290: string;
  schemacontroller306: string;
  schemacontroller318: string;
  schemacontroller332: string;
  schemacontroller356: string;
  schemacontroller368: string;
  schemacontroller373: string;
  schemacontroller384: string;

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller31: string;
  schemaexportcontroller56: string;
  schemaexportcontroller66: string;
  schemaexportcontroller67: string;
  schemaexportcontroller125: string;
  schemaexportcontroller144: string;
  schemaexportcontroller169: string;
  schemaexportcontroller178: string;
  schemaexportcontroller179: string;
  schemaexportcontroller193: string;
  schemaexportcontroller213: string;
  schemaexportcontroller224: string;
  schemaexportcontroller225: string;
  schemaexportcontroller226: string;
  schemaexportcontroller227: string;
  schemaexportcontroller228: string;
  schemaexportcontroller229: string;
  schemaexportcontroller237: string;
  schemaexportcontroller239: string;
  schemaexportcontroller272: string;
  schemaexportcontroller283: string;
  schemaexportcontroller284: string;
  schemaexportcontroller286: string;
  schemaexportcontroller287: string;
  schemaexportcontroller293: string;
  schemaexportcontroller339: string;
  schemaexportcontroller358: string;
  schemaexportcontroller367: string;
  schemaexportcontroller368: string;
  schemaexportcontroller386: string;
  schemaexportcontroller402: string;
  schemaexportcontroller418: string;
  schemaexportcontroller437: string;
  schemaexportcontroller447: string;
  schemaexportcontroller448: string;
  schemaexportcontroller471: string;
  schemaexportcontroller483: string;
  schemaexportcontroller484: string;
  schemaexportcontroller489: string;

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: string;
  sqlparsercontroller72: string;
  sqlparsercontroller79: string;
  sqlparsercontroller89: string;
  sqlparsercontroller98: string;
  sqlparsercontroller151: string;
  sqlparsercontroller165: string;
  sqlparsercontroller166: string;
  sqlparsercontroller171: string;
  sqlparsercontroller172: string;
  sqlparsercontroller177: string;
  sqlparsercontroller178: string;
  sqlparsercontroller182: string;
  sqlparsercontroller183: string;
  sqlparsercontroller236: string;
  sqlparsercontroller262: string;
  sqlparsercontroller277: string;
  sqlparsercontroller278: string;
  sqlparsercontroller279: string;
  sqlparsercontroller280: string;
  sqlparsercontroller281: string;
  sqlparsercontroller282: string;
  sqlparsercontroller283: string;
  sqlparsercontroller294: string;
  sqlparsercontroller295: string;
  sqlparsercontroller296: string;
  sqlparsercontroller297: string;
  sqlparsercontroller298: string;
  sqlparsercontroller299: string;
  sqlparsercontroller303: string;
  sqlparsercontroller320: string;
  sqlparsercontroller361: string;
  sqlparsercontroller395: string;
  sqlparsercontroller405: string;
  sqlparsercontroller430: string;
  sqlparsercontroller439: string;
  sqlparsercontroller442: string;
  sqlparsercontroller446: string;
  sqlparsercontroller450: string;
  sqlparsercontroller455: string;
  sqlparsercontroller460: string;
  sqlparsercontroller462: string;
  sqlparsercontroller468: string;
  sqlparsercontroller469: string;
  sqlparsercontroller470: string;

  // app\Http\Controllers\TeamController.php
  teamcontroller88: string;
  teamcontroller117: string;
  teamcontroller131: string;
  teamcontroller149: string;
  teamcontroller169: string;
  teamcontroller191: string;
  teamcontroller205: string;
  teamcontroller210: string;
  teamcontroller223: string;
  teamcontroller231: string;
  teamcontroller236: string;
  teamcontroller241: string;
  teamcontroller254: string;
  teamcontroller263: string;
  teamcontroller273: string;
  teamcontroller278: string;
  teamcontroller284: string;
  teamcontroller298: string;
  teamcontroller308: string;
  teamcontroller317: string;
  teamcontroller330: string;
  teamcontroller344: string;

  // app\Http\Controllers\TeamInvitationController.php
  teaminvitationcontroller26: string;
  teaminvitationcontroller38: string;
  teaminvitationcontroller46: string;
  teaminvitationcontroller56: string;
  teaminvitationcontroller70: string;
  teaminvitationcontroller106: string;
  teaminvitationcontroller124: string;
  teaminvitationcontroller132: string;
  teaminvitationcontroller137: string;
  teaminvitationcontroller139: string;
  teaminvitationcontroller143: string;
  teaminvitationcontroller156: string;
  teaminvitationcontroller164: string;
  teaminvitationcontroller168: string;
  teaminvitationcontroller171: string;
  teaminvitationcontroller184: string;
  teaminvitationcontroller188: string;
  teaminvitationcontroller193: string;
  teaminvitationcontroller206: string;
  teaminvitationcontroller210: string;
  teaminvitationcontroller222: string;

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: string;
  templatecontroller98: string;
  templatecontroller140: string;
  templatecontroller154: string;
  templatecontroller222: string;
  templatecontroller243: string;
  templatecontroller306: string;
  templatecontroller328: string;
  templatecontroller329: string;
  templatecontroller334: string;
  templatecontroller369: string;
  templatecontroller382: string;
  templatecontroller420: string;
  templatecontroller445: string;
  templatecontroller455: string;
  templatecontroller481: string;
  templatecontroller493: string;
  templatecontroller509: string;
  templatecontroller523: string;
  templatecontroller525: string;
  templatecontroller533: string;
  templatecontroller538: string;
  templatecontroller544: string;
  templatecontroller553: string;
  templatecontroller558: string;
  templatecontroller561: string;
  templatecontroller565: string;
  templatecontroller579: string;
  templatecontroller585: string;
  templatecontroller587: string;
  templatecontroller616: string;
  templatecontroller628: string;
  templatecontroller633: string;
  templatecontroller654: string;
  templatecontroller672: string;
  templatecontroller677: string;
  templatecontroller695: string;
  templatecontroller713: string;
  templatecontroller723: string;
  templatecontroller733: string;
  templatecontroller736: string;
  templatecontroller740: string;
  templatecontroller744: string;
  templatecontroller750: string;
  templatecontroller754: string;
  templatecontroller756: string;
  templatecontroller762: string;
  templatecontroller764: string;
  templatecontroller765: string;

  // app\Http\Controllers\UserController.php
  usercontroller25: string;
  usercontroller36: string;

  // app\Http\Middleware\CheckSystemUser.php
  checksystemuser25: string;

  // app\Http\Middleware\EnsureUserIsAdmin.php
  ensureuserisadmin32: string;
  ensureuserisadmin42: string;
  ensureuserisadmin47: string;
  ensureuserisadmin52: string;
  ensureuserisadmin58: string;
  ensureuserisadmin64: string;
  ensureuserisadmin72: string;
  ensureuserisadmin77: string;
  ensureuserisadmin80: string;

  // app\JobsegenerateProjectGenerationTree.php
  jobsegenerateprojectgenerationtree36: string;
  jobsegenerateprojectgenerationtree40: string;
  jobsegenerateprojectgenerationtree45: string;
  jobsegenerateprojectgenerationtree48: string;

  // app\Jobs\RegenerateProjectGenerationTree.php
  regenerateprojectgenerationtree36: string;
  regenerateprojectgenerationtree40: string;
  regenerateprojectgenerationtree45: string;
  regenerateprojectgenerationtree48: string;

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: string;

  // app\Models\FloatingSchema.php
  floatingschema180: string;

  // app\Models\ProjectApplication.php
  projectapplication96: string;

  // app\Models\Project.php
  project430: string;

  // app\Models\SchemaVersion.php
  schemaversion50: string;
  schemaversion81: string;
  schemaversion93: string;
  schemaversion101: string;
  schemaversion102: string;
  schemaversion105: string;
  schemaversion111: string;
  schemaversion115: string;
  schemaversion127: string;
  schemaversion134: string;
  schemaversion138: string;
  schemaversion156: string;
  schemaversion158: string;
  schemaversion168: string;
  schemaversion172: string;
  schemaversion182: string;
  schemaversion210: string;
  schemaversion238: string;
  schemaversion248: string;
  schemaversion254: string;
  schemaversion261: string;
  schemaversion273: string;
  schemaversion310: string;
  schemaversion312: string;
  schemaversion319: string;
  schemaversion330: string;
  schemaversion338: string;
  schemaversion351: string;
  schemaversion353: string;
  schemaversion356: string;
  schemaversion365: string;
  schemaversion381: string;

  // app\Notifications\NewUserRegistered.php
  newuserregistered40: string;
  newuserregistered43: string;
  newuserregistered44: string;
  newuserregistered45: string;
  newuserregistered47: string;
  newuserregistered48: string;
  newuserregistered49: string;
  newuserregistered50: string;
  newuserregistered51: string;
  newuserregistered52: string;
  newuserregistered54: string;
  newuserregistered56: string;
  newuserregistered57: string;
  newuserregistered58: string;

  // app\Observers\ProjectGenerationTreeObserver.php
  projectgenerationtreeobserver17: string;
  projectgenerationtreeobserver30: string;
  projectgenerationtreeobserver44: string;
  projectgenerationtreeobserver60: string;

  // app\Observers\ProjectObserver.php
  projectobserver18: string;

  // app\Observers\ProjectSchemaObserver.php
  projectschemaobserver23: string;
  projectschemaobserver33: string;
  projectschemaobserver37: string;
  projectschemaobserver51: string;
  projectschemaobserver61: string;
  projectschemaobserver65: string;

  // app\Observers\ProjectTemplateUsageObserver.php
  projecttemplateusageobserver16: string;
  projecttemplateusageobserver27: string;
  projecttemplateusageobserver37: string;
  projecttemplateusageobserver48: string;
  projecttemplateusageobserver52: string;
  projecttemplateusageobserver54: string;

  // app\Observers\SchemaTableObserver.php
  schematableobserver17: string;
  schematableobserver26: string;
  schematableobserver35: string;
  schematableobserver52: string;
  schematableobserver56: string;
  schematableobserver66: string;
  schematableobserver72: string;
  schematableobserver75: string;

  // app\Observers\SchemaVersionObserver.php
  schemaversionobserver17: string;
  schemaversionobserver50: string;
  schemaversionobserver54: string;
  schemaversionobserver64: string;
  schemaversionobserver70: string;
  schemaversionobserver73: string;

  // app\Observers\TemplateFileObserver.php
  templatefileobserver17: string;
  templatefileobserver26: string;
  templatefileobserver35: string;
  templatefileobserver53: string;
  templatefileobserver57: string;
  templatefileobserver63: string;
  templatefileobserver65: string;

  // app\Observers\TemplateObserver.php
  templateobserver17: string;
  templateobserver53: string;
  templateobserver70: string;
  templateobserver74: string;

  // appotificationsewUserRegistered.php
  appotificationsewuserregistered40: string;
  appotificationsewuserregistered43: string;
  appotificationsewuserregistered44: string;
  appotificationsewuserregistered45: string;
  appotificationsewuserregistered47: string;
  appotificationsewuserregistered48: string;
  appotificationsewuserregistered49: string;
  appotificationsewuserregistered50: string;
  appotificationsewuserregistered51: string;
  appotificationsewuserregistered52: string;
  appotificationsewuserregistered54: string;
  appotificationsewuserregistered56: string;
  appotificationsewuserregistered57: string;
  appotificationsewuserregistered58: string;

  // app\Services\MySQLParser.php
  mysqlparser18: string;

  // app\Services\ProjectFileTreeGenerator.php
  projectfiletreegenerator120: string;
  projectfiletreegenerator193: string;
  projectfiletreegenerator194: string;
  projectfiletreegenerator195: string;
  projectfiletreegenerator226: string;
  projectfiletreegenerator263: string;
  projectfiletreegenerator264: string;
  projectfiletreegenerator265: string;
  projectfiletreegenerator296: string;
  projectfiletreegenerator331: string;
  projectfiletreegenerator332: string;
  projectfiletreegenerator333: string;
  projectfiletreegenerator364: string;
  projectfiletreegenerator498: string;
  projectfiletreegenerator500: string;
  projectfiletreegenerator502: string;
  projectfiletreegenerator504: string;
  projectfiletreegenerator505: string;
  projectfiletreegenerator506: string;
  projectfiletreegenerator507: string;
  projectfiletreegenerator508: string;

  // app\Services\SchemaStorageService.php
  schemastorageservice226: string;
  schemastorageservice394: string;
  schemastorageservice413: string;
  schemastorageservice427: string;
  schemastorageservice436: string;

  // app\Services\SimpleFixedTemplateEngine.php
  simplefixedtemplateengine661: string;
  simplefixedtemplateengine662: string;
  simplefixedtemplateengine663: string;
  simplefixedtemplateengine664: string;
  simplefixedtemplateengine665: string;

  // app\Services\SimpleTemplateEngine.php
  simpletemplateengine128: string;
  simpletemplateengine129: string;
  simpletemplateengine130: string;
  simpletemplateengine153: string;
  simpletemplateengine154: string;

  // app\Services\SQLParser.php
  sqlparser71: string;
  sqlparser75: string;
  sqlparser83: string;
  sqlparser96: string;
  sqlparser130: string;
  sqlparser152: string;
  sqlparser237: string;
  sqlparser466: string;

  // app\Services\StepByStepTemplateEngine.php
  stepbysteptemplateengine392: string;
  stepbysteptemplateengine394: string;
  stepbysteptemplateengine395: string;
  stepbysteptemplateengine396: string;

  // app\Services\UltimateTemplateEngine.php
  ultimatetemplateengine195: string;
  ultimatetemplateengine656: string;
  ultimatetemplateengine968: string;

  // resources/js\app.tsx
  app48: string;
  app59: string;

  // resources/js\Components\AuthModals\AuthModalManager.tsx
  authmodalmanager3: string;
  authmodalmanager5: string;
  authmodalmanager7: string;

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: string;
  authmodalsegistermodal84: string;
  authmodalsegistermodal94: string;
  authmodalsegistermodal109: string;
  authmodalsegistermodal203: string;
  authmodalsegistermodal239: string;
  authmodalsegistermodal293: string;
  authmodalsegistermodal312: string;
  authmodalsegistermodal335: string;
  authmodalsegistermodal351: string;
  authmodalsegistermodal366: string;
  authmodalsegistermodal379: string;
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
  authmodalsesetpasswordmodal287: string;
  authmodalsesetpasswordmodal319: string;

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: string;
  forgotpasswordmodal46: string;
  forgotpasswordmodal50: string;
  forgotpasswordmodal73: string;

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal83: string;
  forgotpasswordmodal105: string;
  forgotpasswordmodal113: string;

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: string;
  forgotpasswordmodal131: string;

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginPasswordHint: string;

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal46: string;
  loginmodal49: string;
  loginmodal88: string;
  loginmodal93: string;
  loginmodal136: string;
  loginmodal139: string;
  loginmodal140: string;
  loginmodal142: string;
  loginmodal184: string;
  loginmodal189: string;
  loginmodal212: string;

  // resources/js/Components/AuthModals/LoginModal.tsx
  loginmodal241: string;

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
  loginmodal334: string;

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: string;
  LoginStayLoggedInTooltip: string;
  LoginDoLogin: string;
  LoginButton: string;
  LoginRegister: string;
  LoginForgotPassword: string;

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal26: string;
  planmodal43: string;
  planmodal46: string;
  planmodal48: string;
  planmodal49: string;
  planmodal50: string;
  planmodal51: string;
  planmodal53: string;
  planmodal58: string;
  planmodal62: string;
  planmodal64: string;
  planmodal65: string;
  planmodal66: string;
  planmodal67: string;
  planmodal68: string;
  planmodal69: string;
  planmodal71: string;
  planmodal76: string;
  planmodal80: string;
  planmodal82: string;
  planmodal83: string;
  planmodal84: string;
  planmodal85: string;
  planmodal86: string;
  planmodal87: string;
  planmodal89: string;
  planmodal94: string;
  planmodal97: string;
  planmodal99: string;
  planmodal100: string;
  planmodal101: string;
  planmodal102: string;
  planmodal103: string;
  planmodal105: string;
  planmodal116: string;
  planmodal126: string;
  planmodal127: string;
  planmodal130: string;
  planmodal143: string;
  planmodal147: string;
  planmodal151: string;
  planmodal173: string;
  planmodal175: string;
  planmodal177: string;
  planmodal190: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal42: string;
  profilemodal45: string;
  profilemodal115: string;
  profilemodal127: string;
  profilemodal146: string;
  profilemodal167: string;
  profilemodal186: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: string;
  profilemodal214: string;
  profilemodal246: string;
  profilemodal254: string;
  profilemodal273: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal280: string;
  profilemodal305: string;
  profilemodal306: string;
  profilemodal314: string;
  profilemodal318: string;
  profilemodal331: string;
  profilemodal334: string;
  profilemodal346: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: string;
  profileTab: string;
  profilemodal406: string;
  profilemodal421: string;
  fullName: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal447: string;

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
  profilemodal498: string;
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
  profilemodal617: string;
  profilemodal620: string;
  profilemodal626: string;
  profilemodal632: string;
  profilemodal635: string;
  profilemodal636: string;
  profilemodal637: string;
  profilemodal640: string;
  profilemodal648: string;
  profilemodal651: string;
  profilemodal652: string;
  profilemodal653: string;
  profilemodal654: string;
  profilemodal658: string;
  profilemodal661: string;
  profilemodal670: string;
  profilemodal673: string;
  profilemodal674: string;
  profilemodal675: string;
  profilemodal676: string;
  profilemodal680: string;
  profilemodal683: string;
  profilemodal739:string;
  profilemodal684:string;
  profilemodal685:string;
  profilemodal686:string;
  profilemodal687:string;
  profilemodal688:string;
  profilemodal689:string;

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
  profilemodal732: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal743: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal744: string;
  profilemodal750: string;
  profilemodal751: string;
  profilemodal757: string;

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: string;
  saving: string;
  deleteAccount: string;

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal766: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: string;
  registermodal84: string;
  registermodal94: string;

  // resources\js\Components\AuthModals\RegisterModal.tsx
  registermodal102: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: string;
  registermodal203: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal239: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal244: string;
  registermodal261: string;
  registermodal274: string;
  registermodal282: string;
  registermodal291: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal293: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal298: string;
  registermodal310: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal312: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal317: string;
  registermodal329: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal335: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal340: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal351: string;
  registermodal366: string;
  registermodal379: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal384: string;

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: string;

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal393: string;

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal59: string;

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal73: string;
  resetpasswordmodal79: string;
  resetpasswordmodal122: string;
  resetpasswordmodal124: string;
  resetpasswordmodal127: string;
  resetpasswordmodal131: string;
  resetpasswordmodal162: string;

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal191: string;
  resetpasswordmodal194: string;
  resetpasswordmodal208: string;
  resetpasswordmodal219: string;
  resetpasswordmodal231: string;
  resetpasswordmodal234: string;
  resetpasswordmodal243: string;
  resetpasswordmodal259: string;

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal265: string;

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal281: string;

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal287: string;
  resetpasswordmodal319: string;

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal332: string;
  resetpasswordmodal345: string;
  resetpasswordmodal374: string;

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: string;
  databaseexportmodal93: string;
  databaseexportmodal114: string;
  databaseexportmodal141: string;
  databaseexportmodal169: string;
  databaseexportmodal195: string;
  databaseexportmodal214: string;
  databaseexportmodal216: string;
  databaseexportmodal225: string;
  databaseexportmodal228: string;
  databaseexportmodal238: string;
  databaseexportmodal269: string;
  databaseexportmodal285: string;
  databaseexportmodal308: string;

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: string;

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal329: string;
  databaseexportmodal338: string;

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal339: string;

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: string;

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal351: string;

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal355: string;
  databaseexportmodal357: string;
  databaseexportmodal363: string;
  databaseexportmodal368: string;
  databaseexportmodal380: string;
  databaseexportmodal388: string;
  databaseexportmodal403: string;
  databaseexportmodal406: string;
  databaseexportmodal412: string;

  // resources/js\Components\EmailVerification.tsx
  emailverification55: string;
  emailverification59: string;
  emailverification68: string;
  emailverification107: string;
  emailverification112: string;

  // resources/js/Components/EmailVerification.tsx
  emailverification127: string;
  emailverification135: string;

  // resources/js\Components\EmailVerification.tsx
  emailverification141: string;

  // resources/js/Components/EmailVerification.tsx
  emailverification151: string;

  // resources/js\Components\EmailVerification.tsx
  emailverification155: string;

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: string;
  errorfallback40: string;
  errorfallback58: string;
  errorfallback65: string;
  errorfallback65_2: string;
  errorfallback75: string;

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: string;

  // resources/js\Components\ErrorFallback.tsx
  errorfallback78: string;

  // resources/js\Components\LanguageSelector.tsx
  languageselector68: string;
  languageselector69: string;

  // resources/js/Components/LanguageSelector.tsx
  languageselector87: string;

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: string;
  applicationsmodal78: string;
  applicationsmodal85: string;
  applicationsmodal106: string;
  applicationsmodal125: string;
  applicationsmodal143: string;
  applicationsmodal200: string;
  applicationsmodal228: string;
  applicationsmodal234: string;
  applicationsmodal252: string;
  applicationsmodal301: string;
  applicationsmodal313: string;
  applicationsmodal322: string;
  applicationsmodal329: string;
  applicationsmodal335: string;
  applicationsmodal342: string;
  applicationsmodal348: string;
  applicationsmodal354: string;
  applicationsmodal363: string;
  applicationsmodal374: string;
  applicationsmodal402: string;
  applicationsmodal412: string;
  applicationsmodal420: string;
  applicationsmodal421: string;
  applicationsmodal432: string;
  applicationsmodal439: string;

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: string;

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal191: string;

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: string;

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal196: string;

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: string;
  createtablemodal290: string;
  createtablemodal300: string;
  createtablemodal306: string;
  createtablemodal316: string;

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal318: string;

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal330: string;
  createtablemodal339: string;
  createtablemodal348: string;
  createtablemodal370: string;
  createtablemodal380: string;

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal382: string;

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal391: string;
  createtablemodal398: string;
  createtablemodal428: string;
  createtablemodal482: string;
  createtablemodal483: string;
  createtablemodal484: string;
  createtablemodal485: string;
  createtablemodal497: string;
  createtablemodal509: string;
  createtablemodal516: string;
  createtablemodal525: string;
  createtablemodal532: string;
  createtablemodal541: string;
  createtablemodal548: string;
  createtablemodal557: string;
  createtablemodal564: string;
  createtablemodal573: string;
  createtablemodal603: string;
  createtablemodal614: string;
  createtablemodal619: string;

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: string;
  createteammodal52: string;

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal88: string;
  createteammodal97: string;
  createteammodal103: string;

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: string;

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: string;
  createteammodal136: string;
  createteammodal153: string;

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal164: string;
  createteammodal169: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal97: string;
  editprojectmodal98: string;
  editprojectmodal100: string;
  editprojectmodal131: string;
  editprojectmodal132: string;
  editprojectmodal134: string;
  editprojectmodal168: string;
  editprojectmodal183: string;
  editprojectmodal197: string;
  editprojectmodal215: string;
  editprojectmodal227: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal230: string;
  editprojectmodal240: string;
  editprojectmodal252: string;
  editprojectmodal258: string;
  editprojectmodal569: string;
  
  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal266: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: string;
  editprojectmodal280: string;
  editprojectmodal281: string;
  editprojectmodal285: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal298: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal302: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal307: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal316: string;
  editprojectmodal332: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal335: string;
  editprojectmodal345: string;
  editprojectmodal351: string;
  editprojectmodal370: string;
  editprojectmodal383: string;
  editprojectmodal397: string;
  editprojectmodal410: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal429: string;
  editprojectmodal439: string;
  editprojectmodal445: string;
  editprojectmodal455: string;
  editprojectmodal461: string;
  editprojectmodal477: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: string;
  editprojectmodal485: string;
  editprojectmodal486: string;
  editprojectmodal487: string;
  editprojectmodal488: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal493: string;
  editprojectmodal499: string;
  editprojectmodal506: string;
  editprojectmodal507: string;
  editprojectmodal508: string;
  editprojectmodal509: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal526: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal538: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal543: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal555: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal562: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal568: string;
  editprojectmodal573: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal578: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal584: string;
  editprojectmodal589: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal596: string;
  editprojectmodal602: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal620: string;
  editprojectmodal621: string;
  editprojectmodal622: string;
  editprojectmodal623: string;
  editprojectmodal624: string;
  editprojectmodal625: string;
  editprojectmodal626: string;
  editprojectmodal627: string;
  editprojectmodal628: string;

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal629: string;
  editprojectmodal634: string;
  editprojectmodal641: string;
  editprojectmodal652: string;

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal689: string;
  editprojectmodal696: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal317: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal319: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal322: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal324: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal329: string;
  edittablemodal335: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal337: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: string;
  edittablemodal397: string;
  edittablemodal407: string;
  edittablemodal413: string;
  edittablemodal422: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal424: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal425: string;
  edittablemodal436: string;
  edittablemodal445: string;
  edittablemodal454: string;
  edittablemodal476: string;
  edittablemodal486: string;
  edittablemodal497: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal499: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal504: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal534: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal536: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal614: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal616: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal623: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal632: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal634: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal644: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal646: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal651: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal653: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal660: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal662: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal667: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal669: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal676: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal678: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal683: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal685: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal692: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal694: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal699: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal701: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal708: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal710: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal739: string;
  edittablemodal750: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal752: string;

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal755: string;

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal757: string;

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: string;
  joincodemodal51: string;
  joincodemodal63: string;
  joincodemodal66: string;
  joincodemodal73: string;
  joincodemodal80: string;
  joincodemodal95: string;
  joincodemodal113: string;
  joincodemodal117: string;
  joincodemodal_toast_detail: string;
  joincodemodal_toast_detail2: string;
  joincodemodal129: string;

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal147: string;
  joincodemodal148: string;

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: string;
  joincodemodal157: string;
  joincodemodal158: string;

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal181: string;

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: string;
  joincodemodal200: string;

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: string;

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: string;
  joincodemodal220: string;
  joincodemodal226: string;
  joincodemodal237: string;
  joincodemodal247: string;
  joincodemodal261: string;
  joincodemodal277: string;
  joincodemodal288: string;
  joincodemodal299: string;
  joincodemodal306: string;
  joincodemodal316: string;

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: string;
  manageteammodal132: string;
  manageteammodal139: string;
  manageteammodal144: string;
  manageteammodal155: string;
  manageteammodal158: string;
  manageteammodal181: string;
  manageteammodal184: string;
  manageteammodal189: string;
  manageteammodal194: string;
  manageteammodal206: string;
  manageteammodal209: string;
  manageteammodal244: string;
  manageteammodal283: string;
  manageteammodal284: string;
  manageteammodal297: string;
  manageteammodal308: string;
  manageteammodal312: string;
  manageteammodal316: string;
  manageteammodal320: string;
  manageteammodal321: string;
  manageteammodal324: string;
  manageteammodal328: string;
  manageteammodal334: string;
  manageteammodal347: string;
  manageteammodal354: string;
  manageteammodal362: string;
  manageteammodal366: string;

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal373: string;

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal377: string;
  manageteammodal383: string;
  manageteammodal388: string;
  manageteammodal394: string;
  manageteammodal395: string;
  manageteammodal399: string;
  manageteammodal404: string;
  manageteammodal432: string;
  manageteammodal437: string;
  manageteammodal456: string;
  manageteammodal469: string;
  manageteammodal477: string;
  manageteammodal485: string;
  manageteammodal501: string;
  manageteammodal505: string;
  manageteammodal534: string;

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal553: string;

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal179: string;
  membermodal191: string;
  membermodal244: string;
  membermodal297: string;
  membermodal316: string;
  membermodal323: string;
  membermodal335: string;
  membermodal336: string;
  membermodal348: string;
  membermodal349: string;
  membermodal357: string;
  membermodal365: string;
  membermodal369: string;
  membermodal378: string;
  membermodal383: string;
  membermodal384: string;
  membermodal394: string;
  membermodal395: string;
  membermodal407: string;
  membermodal408: string;
  membermodal417: string;
  membermodal432: string;
  membermodal437: string;
  membermodal438: string;
  membermodal448: string;
  membermodal449: string;
  membermodal458: string;
  membermodal459: string;
  membermodal479: string;
  membermodal483: string;
  membermodal509: string;
  membermodal527: string;
  membermodal536: string;
  membermodal549: string;
  membermodal582: string;
  membermodal590: string;
  membermodal597: string;
  membermodal603: string;
  membermodal609: string;
  membermodal614: string;
  membermodal625: string;

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal53: string;
  pendinginvitationmodal70: string;
  pendinginvitationmodal76: string;
  pendinginvitationmodal97: string;
  pendinginvitationmodal112: string;
  pendinginvitationmodal118: string;
  pendinginvitationmodal121: string;
  pendinginvitationmodal136: string;
  pendinginvitationmodal151: string;
  pendinginvitationmodal157: string;
  pendinginvitationmodal160: string;
  pendinginvitationmodal169: string;
  pendinginvitationmodal176: string;
  pendinginvitationmodal189: string;
  pendinginvitationmodal200: string;

  // resources/js/Components/Modals/PendingInvitationModal.tsx
  pendinginvitationmodal213: string;

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal234: string;
  pendinginvitationmodal244: string;
  pendinginvitationmodal251: string;
  pendinginvitationmodal261: string;
  pendinginvitationmodal270: string;

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal45: string;
  projectinvitationsmodal46: string;
  projectinvitationsmodal74: string;
  projectinvitationsmodal86: string;
  projectinvitationsmodal93: string;
  projectinvitationsmodal100: string;
  projectinvitationsmodal102: string;
  projectinvitationsmodal113: string;
  projectinvitationsmodal118: string;
  projectinvitationsmodal122: string;
  projectinvitationsmodal141: string;
  projectinvitationsmodal144: string;
  projectinvitationsmodal147: string;
  projectinvitationsmodal148: string;
  projectinvitationsmodal150: string;
  projectinvitationsmodal153: string;
  projectinvitationsmodal157: string;
  projectinvitationsmodal171: string;
  projectinvitationsmodal177: string;
  projectinvitationsmodal182: string;
  projectinvitationsmodal187: string;
  projectinvitationsmodal191: string;
  projectinvitationsmodal193: string;
  projectinvitationsmodal204: string;
  projectinvitationsmodal212: string;
  projectinvitationsmodal220: string;
  projectinvitationsmodal229: string;
  projectinvitationsmodal232: string;
  projectinvitationsmodal243: string;
  projectinvitationsmodal261: string;
  projectinvitationsmodal266: string;
  projectinvitationsmodal275: string;
  projectinvitationsmodal278: string;
  projectinvitationsmodal286: string;
  projectinvitationsmodal287: string;
  projectinvitationsmodal288: string;
  projectinvitationsmodal289: string;
  projectinvitationsmodal305: string;
  projectinvitationsmodal314: string;
  projectinvitationsmodal337: string;
  projectinvitationsmodal360: string;
  projectinvitationsmodal364: string;

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: string;

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal376: string;
  projectinvitationsmodal387: string;
  projectinvitationsmodal392: string;
  projectinvitationsmodal398: string;
  projectinvitationsmodal409: string;
  projectinvitationsmodal414: string;
  projectinvitationsmodal420: string;
  projectinvitationsmodal425: string;
  projectinvitationsmodal433: string;
  projectinvitationsmodal439: string;
  projectinvitationsmodal445: string;
  projectinvitationsmodal450: string;

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: string;
  projectmembersmodal63: string;
  projectmembersmodal84: string;
  projectmembersmodal95: string;
  projectmembersmodal98: string;
  projectmembersmodal101: string;
  projectmembersmodal128: string;
  projectmembersmodal131: string;
  projectmembersmodal134: string;
  projectmembersmodal141: string;
  projectmembersmodal176: string;
  projectmembersmodal177: string;
  projectmembersmodal193: string;
  projectmembersmodal206: string;
  projectmembersmodal221: string;
  projectmembersmodal238: string;
  projectmembersmodal264: string;
  projectmembersmodal270: string;
  projectmembersmodal276: string;
  projectmembersmodal282: string;
  projectmembersmodal287: string;
  projectmembersmodal296: string;

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: string;
  teammodal108: string;
  teammodal132: string;
  teammodal137: string;
  teammodal146: string;
  teammodal155: string;

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal169: string;

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal176: string;

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal182: string;

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: string;

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal195: string;

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: string;

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal222: string;

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal232: string;
  teammodal240: string;

  // resources/js\Components\Panels\AuthPanel.tsx
  authpanel3: string;
  authpanel4: string;

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: string;
  cmsadminpanel41: string;
  cmsadminpanel42: string;
  cmsadminpanel43: string;
  cmsadminpanel44: string;
  cmsadminpanel69: string;
  cmsadminpanel106: string;
  cmsadminpanel122: string;
  cmsadminpanel129: string;
  cmsadminpanel135: string;
  cmsadminpanel144: string;
  cmsadminpanel150: string;
  cmsadminpanel152: string;
  cmsadminpanel155: string;
  cmsadminpanel170: string;
  cmsadminpanel178: string;
  cmsadminpanel186: string;
  cmsadminpanel195: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel216: string;

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: string;
  cmsadminpanel241: string;
  cmsadminpanel244: string;
  cmsadminpanel245: string;
  cmsadminpanel246: string;
  cmsadminpanel247: string;
  cmsadminpanel250: string;
  cmsadminpanel256: string;
  cmsadminpanel265: string;
  cmsadminpanel272: string;
  cmsadminpanel279: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel291: string;
  cmsadminpanel298: string;
  cmsadminpanel309: string;

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel328: string;

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: string;

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel342: string;

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: string;
  cmsadminpanel363: string;
  cmsadminpanel365: string;
  cmsadminpanel402: string;

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel72: string;
  codegenerationpanel75: string;
  codegenerationpanel86: string;
  codegenerationpanel165: string;
  codegenerationpanel166: string;
  codegenerationpanel186: string;
  codegenerationpanel280: string;
  codegenerationpanel286: string;

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: string;

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel327: string;

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel332: string;

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel338: string;

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel344: string;

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel351: string;
  codegenerationpanel358: string;
  codegenerationpanel374: string;
  codegenerationpanel387: string;
  codegenerationpanel395: string;
  codegenerationpanel399: string;
  codegenerationpanel407: string;
  codegenerationpanel416: string;
  codegenerationpanel433: string;
  codegenerationpanel445: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel131: string;
  databasemanagementpanel145: string;
  databasemanagementpanel152: string;
  databasemanagementpanel221: string;
  databasemanagementpanel231: string;
  databasemanagementpanel245: string;
  databasemanagementpanel259: string;
  databasemanagementpanel261: string;
  databasemanagementpanel277: string;
  databasemanagementpanel294: string;
  databasemanagementpanel301: string;
  databasemanagementpanel315: string;
  databasemanagementpanel330: string;
  databasemanagementpanel336: string;
  databasemanagementpanel339: string;
  databasemanagementpanel367: string;
  databasemanagementpanel382: string;
  databasemanagementpanel388: string;
  databasemanagementpanel391: string;
  databasemanagementpanel419: string;
  databasemanagementpanel438: string;
  databasemanagementpanel447: string;
  databasemanagementpanel454: string;
  databasemanagementpanel485: string;
  databasemanagementpanel516: string;
  databasemanagementpanel520: string;
  databasemanagementpanel529: string;
  databasemanagementpanel536: string;
  databasemanagementpanel551: string;
  databasemanagementpanel567: string;
  databasemanagementpanel585: string;
  databasemanagementpanel594: string;
  databasemanagementpanel606: string;
  databasemanagementpanel616: string;
  databasemanagementpanel621: string;
  databasemanagementpanel651: string;
  databasemanagementpanel683: string;
  databasemanagementpanel714: string;
  databasemanagementpanel735: string;
  databasemanagementpanel743: string;
  databasemanagementpanel749: string;
  databasemanagementpanel756: string;
  databasemanagementpanel763: string;
  databasemanagementpanel771: string;
  databasemanagementpanel772: string;
  databasemanagementpanel776: string;
  databasemanagementpanel777: string;
  databasemanagementpanel778: string;
  databasemanagementpanel786: string;
  databasemanagementpanel798: string;
  databasemanagementpanel803: string;
  databasemanagementpanel811: string;
  databasemanagementpanel829: string;
  databasemanagementpanel833: string;
  databasemanagementpanel840: string;
  databasemanagementpanel841: string;
  databasemanagementpanel843: string;
  databasemanagementpanel849: string;
  databasemanagementpanel855: string;
  databasemanagementpanel861: string;
  databasemanagementpanel867: string;
  databasemanagementpanel876: string;
  databasemanagementpanel886: string;
  databasemanagementpanel893: string;
  databasemanagementpanel905: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel917: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: string;
  databasemanagementpanel937: string;
  databasemanagementpanel952: string;
  databasemanagementpanel963: string;
  databasemanagementpanel970: string;
  databasemanagementpanel981: string;
  databasemanagementpanel999: string;
  databasemanagementpanel1013: string;
  databasemanagementpanel1028: string;
  databasemanagementpanel1036: string;
  databasemanagementpanel1043: string;
  databasemanagementpanel1054: string;
  databasemanagementpanel1070: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1077: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1094: string;
  databasemanagementpanel1104: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: string;
  databasemanagementpanel1131: string;
  databasemanagementpanel1138: string;
  databasemanagementpanel1163: string;
  databasemanagementpanel1166: string;
  databasemanagementpanel1174: string;
  databasemanagementpanel1175: string;
  databasemanagementpanel1180: string;
  databasemanagementpanel1210: string;
  databasemanagementpanel1217: string;
  databasemanagementpanel1229: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1244: string;
  databasemanagementpanel1250: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: string;
  databasemanagementpanel1273: string;
  databasemanagementpanel1280: string;
  databasemanagementpanel1292: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1307: string;
  databasemanagementpanel1313: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: string;
  databasemanagementpanel1338: string;
  databasemanagementpanel1350: string;

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1365: string;
  databasemanagementpanel1371: string;

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: string;
  databasemanagementpanel1395: string;
  databasemanagementpanel1402: string;

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel51: string;
  debugmanualgeneratorpanel127: string;
  debugmanualgeneratorpanel136: string;
  debugmanualgeneratorpanel162: string;
  debugmanualgeneratorpanel165: string;
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
  debugmanualgeneratorpanel563: string;
  debugmanualgeneratorpanel600: string;
  debugmanualgeneratorpanel746: string;
  debugmanualgeneratorpanel753: string;
  debugmanualgeneratorpanel758: string;
  debugmanualgeneratorpanel763: string;
  debugmanualgeneratorpanel768: string;
  debugmanualgeneratorpanel928: string;
  debugmanualgeneratorpanel936: string;
  debugmanualgeneratorpanel940: string;
  debugmanualgeneratorpanel946: string;
  debugmanualgeneratorpanel953: string;
  debugmanualgeneratorpanel959: string;
  debugmanualgeneratorpanel962: string;
  debugmanualgeneratorpanel970: string;
  debugmanualgeneratorpanel1026: string;
  debugmanualgeneratorpanel1048: string;
  debugmanualgeneratorpanel1093: string;
  debugmanualgeneratorpanel1096: string;
  debugmanualgeneratorpanel1107: string;
  debugmanualgeneratorpanel1111: string;
  debugmanualgeneratorpanel1174: string;
  debugmanualgeneratorpanel1183: string;
  debugmanualgeneratorpanel1203: string;
  debugmanualgeneratorpanel1210: string;
  debugmanualgeneratorpanel1229: string;
  debugmanualgeneratorpanel1259: string;

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1260: string;
  debugmanualgeneratorpanel1270: string;

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
  debugmanualgeneratorpanel1398: string;
  debugmanualgeneratorpanel1399: string;
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
  debugmanualgeneratorpanel1621: string;
  debugmanualgeneratorpanel1622: string;
  debugmanualgeneratorpanel1628: string;
  debugmanualgeneratorpanel1679: string;
  debugmanualgeneratorpanel1683: string;
  debugmanualgeneratorpanel1686: string;
  debugmanualgeneratorpanel1724: string;
  debugmanualgeneratorpanel1739: string;
  debugmanualgeneratorpanel1744: string;
  debugmanualgeneratorpanel1750: string;
  debugmanualgeneratorpanel1755: string;
  debugmanualgeneratorpanel1760: string;

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel31: string;
  panelsegisterpanel54: string;
  panelsegisterpanel57: string;
  panelsegisterpanel75: string;
  panelsegisterpanel90: string;
  panelsegisterpanel123: string;
  panelsegisterpanel154: string;
  panelsegisterpanel161: string;
  panelsegisterpanel162: string;
  panelsegisterpanel163: string;
  panelsegisterpanel164: string;
  panelsegisterpanel176: string;
  panelsegisterpanel188: string;
  panelsegisterpanel198: string;

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: string;
  panelsewnavigationpanel120: string;
  panelsewnavigationpanel128: string;
  panelsewnavigationpanel133: string;
  panelsewnavigationpanel138: string;
  panelsewnavigationpanel142: string;
  panelsewnavigationpanel161: string;
  panelsewnavigationpanel165: string;
  panelsewnavigationpanel170: string;
  panelsewnavigationpanel184: string;
  panelsewnavigationpanel188: string;
  panelsewnavigationpanel193: string;
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
  panelsewnavigationpanel273: string;
  panelsewnavigationpanel281: string;
  panelsewnavigationpanel285: string;
  panelsewnavigationpanel290: string;
  panelsewnavigationpanel298: string;
  panelsewnavigationpanel315: string;
  panelsewnavigationpanel320: string;
  panelsewnavigationpanel325: string;
  panelsewnavigationpanel333: string;
  panelsewnavigationpanel359: string;
  panelsewnavigationpanel364: string;
  panelsewnavigationpanel369: string;
  panelsewnavigationpanel384: string;
  panelsewnavigationpanel394: string;
  panelsewnavigationpanel413: string;
  panelsewnavigationpanel422: string;
  panelsewnavigationpanel430: string;
  panelsewnavigationpanel437: string;
  panelsewnavigationpanel443: string;
  panelsewnavigationpanel459: string;
  panelsewnavigationpanel469: string;
  panelsewnavigationpanel477: string;
  panelsewnavigationpanel488: string;
  panelsewnavigationpanel496: string;
  panelsewnavigationpanel504: string;
  panelsewnavigationpanel508: string;
  panelsewnavigationpanel513: string;
  panelsewnavigationpanel521: string;
  panelsewnavigationpanel525: string;
  panelsewnavigationpanel533: string;
  panelsewnavigationpanel540: string;
  panelsewnavigationpanel544: string;
  panelsewnavigationpanel548: string;
  panelsewnavigationpanel553: string;
  panelsewnavigationpanel557: string;
  panelsewnavigationpanel565: string;
  panelsewnavigationpanel572: string;
  panelsewnavigationpanel576: string;
  panelsewnavigationpanel580: string;
  panelsewnavigationpanel589: string;
  panelsewnavigationpanel596: string;
  panelsewnavigationpanel600: string;
  panelsewnavigationpanel605: string;
  panelsewnavigationpanel619: string;
  panelsewnavigationpanel644: string;
  panelsewnavigationpanel648: string;
  panelsewnavigationpanel652: string;
  panelsewnavigationpanel672: string;
  panelsewnavigationpanel679: string;
  panelsewnavigationpanel683: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: string;
  filemodal95: string;
  filemodal106: string;
  filemodal111: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal124: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: string;
  filemodal147: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: string;
  filemodal160: string;
  filemodal182: string;
  filemodal185: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: string;
  filemodal202: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal208: string;
  filemodal215: string;
  filemodal232: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal268: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: string;
  filemodal287: string;

  // resources/js/Components/Panels/FileModal.tsx
  filemodal288: string;

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: string;
  filemodal334: string;
  filemodal340: string;

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: string;
  forgotpasswordpanel30: string;
  forgotpasswordpanel52: string;
  forgotpasswordpanel55: string;
  forgotpasswordpanel59: string;
  forgotpasswordpanel73: string;
  forgotpasswordpanel96: string;
  forgotpasswordpanel99: string;
  forgotpasswordpanel109: string;
  forgotpasswordpanel129: string;

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel164: string;
  forgotpasswordpanel170: string;
  forgotpasswordpanel178: string;

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: string;
  forgotpasswordpanel197: string;

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel209: string;
  forgotpasswordpanel215: string;

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: string;
  forgotpasswordpanel237: string;
  forgotpasswordpanel244: string;
  forgotpasswordpanel245: string;
  forgotpasswordpanel246: string;
  forgotpasswordpanel247: string;

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel252: string;

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel259: string;
  forgotpasswordpanel272: string;
  forgotpasswordpanel280: string;
  forgotpasswordpanel291: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel76: string;
  languagemanagementpanel78: string;
  languagemanagementpanel120: string;
  languagemanagementpanel121: string;
  languagemanagementpanel124: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel125: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel132: string;
  languagemanagementpanel133: string;
  languagemanagementpanel136: string;
  languagemanagementpanel142: string;
  languagemanagementpanel146: string;
  languagemanagementpanel152: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: string;
  languagemanagementpanel156: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: string;
  languagemanagementpanel173: string;
  languagemanagementpanel178: string;

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
  languagemanagementpanel214: string;
  languagemanagementpanel223: string;
  languagemanagementpanel251: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel291: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: string;
  languagemanagementpanel317: string;
  languagemanagementpanel324: string;
  languagemanagementpanel326: string;
  languagemanagementpanel327: string;
  languagemanagementpanel328: string;
  languagemanagementpanel329: string;
  languagemanagementpanel330: string;
  languagemanagementpanel331: string;
  languagemanagementpanel332: string;
  languagemanagementpanel333: string;
  languagemanagementpanel334: string;
  languagemanagementpanel340: string;
  languagemanagementpanel352: string;
  languagemanagementpanel359: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel371: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: string;
  languagemanagementpanel379: string;
  languagemanagementpanel380: string;
  languagemanagementpanel410: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel423: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: string;
  languagemanagementpanel431: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: string;
  languagemanagementpanel449: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: string;
  languagemanagementpanel457: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: string;
  languagemanagementpanel490: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel503: string;

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: string;
  languagemanagementpanel511: string;

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel548: string;

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel44: string;
  loginpanel74: string;
  loginpanel88: string;

  // resources/js/Components/Panels/LoginPanel.tsx
  loginpanel106: string;
  loginpanel114: string;
  loginpanel122: string;

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel129: string;
  loginpanel141: string;
  loginpanel152: string;
  loginpanel160: string;

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel61: string;
  myapplicationspanel73: string;
  myapplicationspanel80: string;
  myapplicationspanel87: string;
  myapplicationspanel138: string;
  myapplicationspanel164: string;
  myapplicationspanel201: string;
  myapplicationspanel213: string;
  myapplicationspanel217: string;
  myapplicationspanel228: string;
  myapplicationspanel232: string;
  myapplicationspanel233: string;
  myapplicationspanel242: string;
  myapplicationspanel248: string;
  myapplicationspanel255: string;
  myapplicationspanel261: string;
  myapplicationspanel268: string;
  myapplicationspanel276: string;
  myapplicationspanel282: string;
  myapplicationspanel292: string;
  myapplicationspanel305: string;
  myapplicationspanel322: string;
  myapplicationspanel326: string;
  myapplicationspanel332: string;
  myapplicationspanel338: string;
  myapplicationspanel348: string;
  myapplicationspanel358: string;
  myapplicationspanel362: string;
  myapplicationspanel365: string;
  myapplicationspanel369: string;
  myapplicationspanel381: string;

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel112: string;
  newnavigationpanel120: string;
  newnavigationpanel128: string;
  newnavigationpanel133: string;
  newnavigationpanel138: string;
  newnavigationpanel142: string;
  newnavigationpanel161: string;
  newnavigationpanel165: string;
  newnavigationpanel170: string;
  newnavigationpanel184: string;
  newnavigationpanel188: string;
  newnavigationpanel193: string;
  newnavigationpanel201: string;
  newnavigationpanel211: string;
  newnavigationpanel216: string;
  newnavigationpanel223: string;
  newnavigationpanel228: string;
  newnavigationpanel233: string;
  newnavigationpanel238: string;
  newnavigationpanel246: string;
  newnavigationpanel251: string;
  newnavigationpanel258: string;
  newnavigationpanel263: string;
  newnavigationpanel268: string;
  newnavigationpanel273: string;
  newnavigationpanel281: string;
  newnavigationpanel285: string;
  newnavigationpanel290: string;
  newnavigationpanel298: string;
  newnavigationpanel315: string;
  newnavigationpanel320: string;
  newnavigationpanel325: string;
  newnavigationpanel333: string;
  newnavigationpanel357: string;
  newnavigationpanel359: string;
  newnavigationpanel364: string;
  newnavigationpanel369: string;
  newnavigationpanel384: string;
  newnavigationpanel394: string;
  newnavigationpanel413: string;
  newnavigationpanel422: string;
  newnavigationpanel430: string;
  newnavigationpanel437: string;
  newnavigationpanel443: string;
  newnavigationpanel459: string;
  newnavigationpanel469: string;
  newnavigationpanel477: string;
  newnavigationpanel488: string;
  newnavigationpanel496: string;
  newnavigationpanel504: string;
  newnavigationpanel508: string;
  newnavigationpanel513: string;
  newnavigationpanel521: string;
  newnavigationpanel525: string;
  newnavigationpanel533: string;
  newnavigationpanel540: string;
  newnavigationpanel544: string;
  newnavigationpanel548: string;
  newnavigationpanel553: string;
  newnavigationpanel557: string;
  newnavigationpanel565: string;
  newnavigationpanel572: string;
  newnavigationpanel576: string;
  newnavigationpanel580: string;
  newnavigationpanel589: string;
  newnavigationpanel596: string;
  newnavigationpanel600: string;
  newnavigationpanel605: string;
  newnavigationpanel619: string;
  newnavigationpanel635: string;
  newnavigationpanel644: string;
  newnavigationpanel648: string;
  newnavigationpanel652: string;
  newnavigationpanel672: string;
  newnavigationpanel679: string;
  newnavigationpanel683: string;

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: string;
  panelt1143: string;
  panelt1147: string;
  panelt1219: string;
  panelt1222: string;
  panelt1281: string;
  panelt1287: string;
  panelt1293: string;
  panelt1416: string;
  panelt1506: string;
  panelt1509: string;
  panelt1521: string;
  panelt1524: string;
  panelt1680: string;
  panelt1696: string;
  panelt1725: string;
  panelt1786: string;
  panelt1791: string;
  panelt1798: string;
  panelt1809: string;
  panelt1813: string;
  panelt1833: string;
  panelt1835: string;
  panelt1StandaloneTeams: string;
  panelt1StandaloneTemplates: string;
  panelt1StandaloneDatabases: string;
  panelt1MyTeams: string;
  panelt1MyTemplates: string;
  panelt1MyDatabases: string;
  panelt1836: string;
  panelt1837: string;
  panelt1839: string;
  panelt1842: string;
  panelt1843: string;
  panelt1845: string;
  panelt1848: string;
  panelt1853: string;
  panelt1856: string;
  panelt1859: string;
  panelt1873: string;
  panelt1879: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: string;
  panelt2151: string;
  panelt2179: string;
  panelt2405: string;
  panelt2439: string;
  panelt2443: string;
  panelt2551: string;
  panelt2602: string;
  panelt2685: string;
  panelt2704: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: string;
  panelt2806: string;
  panelt2817: string;
  panelt2826: string;
  panelt2841: string;
  panelt2852: string;
  panelt2862: string;
  panelt2877: string;
  panelt2888: string;
  panelt2898: string;
  panelt2920: string;
  panelt2930: string;
  panelt2952: string;
  panelt21001: string;
  panelt21010: string;
  panelt21030: string;
  panelt21054: string;
  panelt21075: string;
  panelt21101: string;
  panelt21122: string;
  panelt21133: string;
  panelt21144: string;
  panelt21153: string;
  panelt21170: string;
  panelt21185: string;
  panelt21231: string;
  panelt21245: string;
  panelt21270: string;
  panelt21282: string;
  panelt21289: string;
  panelt21291: string;
  panelt21292: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: string;
  panelt21350: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21359: string;
  panelt21375: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21402: string;
  panelt21439: string;
  panelt21511: string;
  panelt21515: string;
  panelt21516: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21517: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21525: string;
  panelt21528: string;
  panelt21530: string;
  panelt21531: string;
  panelt21549: string;
  panelt21552: string;
  panelt21556: string;
  panelt21560: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21564: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: string;
  panelt21600: string;
  panelt21629: string;
  panelt21635: string;
  panelt21639: string;
  panelt21654: string;
  panelt21689: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21692: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21699: string;
  panelt21703: string;
  panelt21707: string;

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21714: string;

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21736: string;

  // resources/js/Components/Panels/PanelT3.tsx
  templatesCategoryAll: string;

  // resources/js\Components\Panels\PanelT3.tsx
  panelt367: string;
  panelt375: string;
  panelt390: string;
  panelt3103: string;
  panelt3115: string;
  panelt3148: string;
  panelt3158: string;
  panelt3161: string;
  panelt3201: string;
  panelt3219: string;
  panelt3231: string;
  panelt3245: string;
  panelt3250: string;
  panelt3272: string;
  panelt3287: string;
  panelt3295: string;
  panelt3296: string;
  panelt3297: string;
  panelt3298: string;
  panelt3299: string;
  panelt3300: string;

  // resources/js/Components/Panels/PanelT3.tsx
  templatesLoadingText: string;
  templatesAssignmentTitle: string;

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3323: string;

  // resources/js/Components/Panels/PanelT3.tsx
  templatesWorkingOn: string;
  templatesSelectProjectHint: string;
  templatesSearchPlaceholder: string;
  templatesFilterCategory: string;
  templatesNoTemplatesFound: string;
  templatesSelectedCount: string;
  templatesRemoveFromProject: string;
  templatesColumnName: string;
  templatesColumnDescription: string;
  templatesColumnCategory: string;
  templatesColumnLanguage: string;
  templatesColumnStatus: string;
  templatesStatusInactive: string;
  templatesStatusActive: string;
  templatesColumnCreated: string;

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3471: string;

  // resources/js/Components/Panels/PanelT3.tsx
  templatesClearSelection: string;
  templatesAssignButton: string;

  // resources/js\Components\Panels\PanelT5.tsx
  panelt538: string;
  panelt544: string;
  panelt555: string;
  panelt567: string;
  panelt572: string;
  panelt577: string;
  panelt582: string;
  panelt585: string;
  panelt588: string;
  panelt589: string;
  panelt596: string;
  panelt5235: string;
  panelt5240: string;
  panelt5247: string;
  panelt5271: string;
  panelt5273: string;
  panelt5274: string;
  panelt5275: string;
  panelt5286: string;
  panelt5292: string;

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel47: string;
  profilepanel58: string;
  profilepanel69: string;
  profilepanel84: string;
  profilepanel100: string;
  profilepanel103: string;
  profilepanel107: string;
  profilepanel121: string;
  profilepanel129: string;
  profilepanel145: string;
  profilepanel148: string;
  profilepanel156: string;
  profilepanel181: string;
  profilepanel200: string;

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel204: string;
  profilepanel218: string;

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel234: string;
  profilepanel242: string;

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel246: string;
  profilepanel263: string;

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel276: string;
  profilepanel277: string;
  profilepanel278: string;
  profilepanel279: string;

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel284: string;

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel302: string;
  profilepanel310: string;

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel314: string;

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel317: string;

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel321: string;
  profilepanel330: string;

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel355: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel118: string;
  projectpanel119: string;
  projectpanel121: string;
  projectpanel224: string;
  projectpanel232: string;
  projectpanel253: string;
  projectpanel258: string;
  projectpanel293: string;
  projectpanel294: string;
  projectpanel296: string;
  projectpanel298: string;
  projectpanel301: string;
  projectpanel304: string;
  projectpanel330: string;
  projectpanel331: string;
  projectpanel333: string;
  projectpanel348: string;
  projectpanel352: string;
  projectpanel361: string;
  projectpanel369: string;
  projectpanel372: string;
  projectpanel390: string;
  projectpanel405: string;
  projectpanel416: string;
  projectpanel451: string;
  projectpanel462: string;
  projectpanel492: string;
  projectpanel539: string;
  projectpanel562: string;
  projectpanel575: string;
  projectpanel583: string;
  projectpanel589: string;
  projectpanel601: string;
  projectpanel615: string;
  projectpanel626: string;
  projectpanel634: string;
  projectpanel642: string;
  projectpanel671: string;
  projectpanel678: string;
  projectpanel692: string;
  projectpanel698: string;
  projectpanel706: string;
  projectpanel716: string;
  projectpanel724: string;
  projectpanel730: string;
  projectpanel742: string;
  projectpanel748: string;
  projectpanel754: string;
  projectpanel760: string;
  projectpanel766: string;
  projectpanel773: string;
  projectpanel774: string;
  projectpanel776: string;
  projectpanel786: string;
  projectpanel789: string;
  projectpanel796: string;
  projectpanel803: string;
  projectpanel815: string;
  projectpanelAttachments: string;
  projectpanelKanban: string;
  navAgileMethod: string;
  projectExport: string;
  projectImport: string;
  projectpanel822: string;
  projectpanel838: string;
  projectpanel850: string;
  projectpanel854: string;
  projectpanel859: string;
  projectpanel862: string;
  projectpanel868: string;
  projectpanel874: string;
  projectpanel879: string;
  projectpanel892: string;
  projectpanel904: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel907: string;
  projectpanel931: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel955: string;
  projectpanel959: string;
  projectpanel972: string;
  projectpanel976: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel984: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel987: string;
  projectpanel998: string;
  projectpanel1004: string;
  projectpanel1024: string;
  projectpanel1038: string;
  projectpanel1053: string;
  projectpanel1067: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1084: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1087: string;
  projectpanel1098: string;
  projectpanel1104: string;
  projectpanel1115: string;
  projectpanel1121: string;
  projectpanel1128: string;
  projectpanel1138: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1146: string;
  projectpanel1147: string;
  projectpanel1148: string;
  projectpanel1149: string;
  projectpanel1150: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1155: string;
  projectpanel1161: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1185: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1189: string;
  projectpanel1207: string;
  projectpanel1227: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1234: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1244: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1251: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: string;
  projectpanel1281: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1289: string;
  projectpanel1290: string;
  projectpanel1291: string;
  projectpanel1292: string;
  projectpanel1293: string;
  projectpanel1294: string;
  projectpanel1295: string;
  projectpanel1296: string;
  projectpanel1297: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1303: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1325: string;
  projectpanel1332: string;
  projectpanel1342: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: string;
  projectpanel1362: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1371: string;
  projectpanel1378: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1434: string;
  projectpanel1437: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1440: string;
  projectpanel1443: string;
  projectpanel1447: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1455: string;
  projectpanel1459: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1461: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: string;
  projectpanel1471: string;
  projectpanel1481: string;
  projectpanel1482: string;
  projectpanel1491: string;
  projectpanel1513: string;
  projectpanel1517: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1529: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: string;
  projectpanel1539: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1542: string;
  projectpanel1550: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: string;
  projectpanel1560: string;

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1563: string;
  projectpanel1573: string;

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: string;
  projectpanel1585: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: string;
  projectsettingspanel65: string;
  projectsettingspanel67: string;
  projectsettingspanel143: string;
  projectsettingspanel144: string;
  projectsettingspanel146: string;
  projectsettingspanel151: string;
  projectsettingspanel190: string;
  projectsettingspanel209: string;
  projectsettingspanel225: string;
  projectsettingspanel243: string;
  projectsettingspanel246: string;
  projectsettingspanel251: string;
  projectsettingspanel258: string;
  projectsettingspanel275: string;
  projectsettingspanel276: string;
  projectsettingspanel277: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel295: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: string;
  projectsettingspanel313: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: string;
  projectsettingspanel331: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel338: string;

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
  projectsettingspanel537: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel544: string;
  projectsettingspanel545: string;
  projectsettingspanel546: string;
  projectsettingspanel547: string;
  projectsettingspanel548: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: string;
  projectsettingspanel558: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel565: string;
  projectsettingspanel566: string;
  projectsettingspanel567: string;
  projectsettingspanel568: string;
  projectsettingspanel578: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: string;
  projectsettingspanel592: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel593: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: string;
  projectsettingspanel608: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel609: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel622: string;
  projectsettingspanel626: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel637: string;
  projectsettingspanel639: string;
  projectsettingspanel641: string;
  projectsettingspanel644: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel658: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel659: string;
  projectsettingspanel671: string;
  projectsettingspanel672: string;
  projectsettingspanel673: string;
  projectsettingspanel674: string;
  projectsettingspanel675: string;
  projectsettingspanel676: string;
  projectsettingspanel677: string;
  projectsettingspanel678: string;
  projectsettingspanel679: string;

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel680: string;
  projectsettingspanel689: string;
  projectsettingspanel700: string;

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: string;
  projectsettingspanel727: string;
  projectsettingspanel728: string;
  projectsettingspanel733: string;
  projectsettingspanel734: string;
  projectsettingspanel738: string;
  projectsettingspanel739: string;
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
  publicprojectspanel85: string;
  publicprojectspanel97: string;
  publicprojectspanel104: string;
  publicprojectspanel111: string;
  publicprojectspanel183: string;
  publicprojectspanel186: string;
  publicprojectspanel210: string;
  publicprojectspanel222: string;
  publicprojectspanel227: string;
  publicprojectspanel234: string;
  publicprojectspanel253: string;
  publicprojectspanel266: string;
  publicprojectspanel270: string;
  publicprojectspanel271: string;
  publicprojectspanel276: string;
  publicprojectspanel296: string;
  publicprojectspanel316: string;
  publicprojectspanel338: string;
  publicprojectspanel342: string;
  publicprojectspanel346: string;
  publicprojectspanel366: string;
  publicprojectspanel372: string;
  publicprojectspanel378: string;

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel411: string;

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: string;

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel426: string;

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel433: string;

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: string;
  publicprojectspanel452: string;
  publicprojectspanel455: string;

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel463: string;
  publicprojectspanel474: string;
  publicprojectspanel481: string;

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel31: string;
  registerpanel54: string;
  registerpanel57: string;
  registerpanel75: string;
  registerpanel90: string;

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel115: string;

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel123: string;

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel131: string;
  registerpanel139: string;
  registerpanel147: string;

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel154: string;
  registerpanel161: string;
  registerpanel162: string;
  registerpanel163: string;
  registerpanel164: string;

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel169: string;

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel176: string;
  registerpanel188: string;
  registerpanel198: string;

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel104: string;
  schematranslationpanel133: string;
  schematranslationpanel281: string;
  schematranslationpanel289: string;
  schematranslationpanel303: string;
  schematranslationpanel317: string;
  schematranslationpanel319: string;
  schematranslationpanel334: string;
  schematranslationpanel342: string;
  schematranslationpanel364: string;
  schematranslationpanel377: string;
  schematranslationpanel385: string;
  schematranslationpanel449: string;
  schematranslationpanel459: string;
  schematranslationpanel481: string;
  schematranslationpanel505: string;
  schematranslationpanel640: string;
  schematranslationpanel648: string;
  schematranslationpanel662: string;
  schematranslationpanel663: string;
  schematranslationpanel682: string;
  schematranslationpanel688: string;
  schematranslationpanel701: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel702: string;
  schematranslationpanel743: string;
  schematranslationpanel746: string;

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: string;
  schematranslationpanel762: string;
  schematranslationpanel771: string;
  schematranslationpanel791: string;
  schematranslationpanel802: string;
  schematranslationpanel812: string;
  schematranslationpanel818: string;
  schematranslationpanel820: string;
  schematranslationpanel827: string;
  schematranslationpanel830: string;
  schematranslationpanel834: string;
  schematranslationpanel835: string;
  schematranslationpanel908: string;
  schematranslationpanel922: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel923: string;
  schematranslationpanel931: string;

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel938: string;
  schematranslationpanel950: string;
  schematranslationpanel957: string;
  schematranslationpanel969: string;
  schematranslationpanel986: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel987: string;
  schematranslationpanel995: string;

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1006: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1015: string;

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: string;
  schematranslationpanel1034: string;
  schematranslationpanel1044: string;
  schematranslationpanel1056: string;
  schematranslationpanel1074: string;
  schematranslationpanel1078: string;
  schematranslationpanel1079: string;
  schematranslationpanel1090: string;
  schematranslationpanel1103: string;

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1113: string;
  schematranslationpanel1139: string;

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: string;
  schematranslationpanel1195: string;
  schematranslationpanel1205: string;

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel48: string;
  systemsettingspanel67: string;
  systemsettingspanel69: string;

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel86: string;
  systemsettingspanel89: string;
  systemsettingspanel99: string;
  systemsettingspanel102: string;
  systemsettingspanel107: string;

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: string;

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel132: string;
  systemsettingspanel135: string;

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel148: string;
  systemsettingspanel149: string;
  systemsettingspanel157: string;
  systemsettingspanel180: string;
  systemsettingspanel181: string;
  systemsettingspanel189: string;
  systemsettingspanel212: string;
  systemsettingspanel213: string;
  systemsettingspanel221: string;
  systemsettingspanel242: string;
  systemsettingspanel251: string;

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel105: string;
  teammanagementpanel143: string;
  teammanagementpanel155: string;
  teammanagementpanel174: string;
  teammanagementpanel175: string;
  teammanagementpanel200: string;
  teammanagementpanel208: string;
  teammanagementpanel212: string;
  teammanagementpanel221: string;
  teammanagementpanel226: string;
  teammanagementpanel227: string;
  teammanagementpanel234: string;
  teammanagementpanel239: string;
  teammanagementpanel240: string;
  teammanagementpanel258: string;
  teammanagementpanel259: string;
  teammanagementpanel264: string;
  teammanagementpanel277: string;
  teammanagementpanel291: string;
  teammanagementpanel316: string;
  teammanagementpanel334: string;
  teammanagementpanel361: string;
  teammanagementpanel368: string;
  teammanagementpanel386: string;
  teammanagementpanel394: string;
  teammanagementpanel400: string;
  teammanagementpanel416: string;

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: string;

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: string;
  teammanagementpanel451: string;
  teammanagementpanel458: string;
  teammanagementpanel465: string;
  teammanagementpanel471: string;
  teammanagementpanel478: string;
  teammanagementpanel485: string;
  teammanagementpanel491: string;

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old97: string;
  teamspanel_old147: string;
  teamspanel_old192: string;
  teamspanel_old216: string;
  teamspanel_old225: string;
  teamspanel_old236: string;

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old241: string;

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old263: string;
  teamspanel_old270: string;
  teamspanel_old271: string;
  teamspanel_old272: string;
  teamspanel_old297: string;
  teamspanel_old298: string;

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old316: string;

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old360: string;
  teamspanel_old361: string;

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old373: string;

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old415: string;
  teamspanel_old416: string;

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel91: string;
  teamspanel128: string;
  teamspanel172: string;
  teamspanel182: string;
  teamspanel193: string;
  teamspanel199: string;
  teamspanel227: string;
  teamspanel238: string;
  teamspanel255: string;
  teamspanel270: string;
  teamspanel295: string;
  teamspanel347: string;
  teamspanel349: string;
  teamspanel350: string;
  teamspanel364: string;
  teamspanel368: string;
  teamspanel420: string;
  teamspanel425: string;
  teamspanel430: string;
  teamspanel451: string;
  teamspanel457: string;
  teamspanel487: string;

  // resources/js/Components/Panels/TeamsPanel.tsx
  teamspanel494: string;
  teamspanel527: string;

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel544: string;
  teamspanel552: string;
  teamspanel557: string;
  teamspanel563: string;
  teamspanel608: string;
  teamspanel619: string;
  teamspanel630: string;
  teamspanel675: string;
  teamspanel697: string;
  teamspanel698: string;
  teamspanel701: string;
  teamspanel705: string;
  teamspanel711: string;
  teamspanel721: string;
  teamspanel726: string;
  teamspanel732: string;
  teamspanel733: string;
  teamspanel745: string;

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: string;
  templatedbschemadependenciespanel123: string;
  templatedbschemadependenciespanel128: string;
  templatedbschemadependenciespanel132: string;
  templatedbschemadependenciespanel144: string;

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel158: string;

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: string;
  templatedbschemadependenciespanel176: string;

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel203: string;

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: string;
  templatedbschemadependenciespanel242: string;
  templatedbschemadependenciespanel248: string;
  templatedbschemadependenciespanel324: string;
  templatedbschemadependenciespanel346: string;
  templatedbschemadependenciespanel350: string;
  templatedbschemadependenciespanel364: string;
  templatedbschemadependenciespanel367: string;
  templatedbschemadependenciespanel372: string;
  templatedbschemadependenciespanel376: string;
  templatedbschemadependenciespanel390: string;
  templatedbschemadependenciespanel404: string;
  templatedbschemadependenciespanel405: string;
  templatedbschemadependenciespanel415: string;
  templatedbschemadependenciespanel440: string;
  templatedbschemadependenciespanel442: string;
  templatedbschemadependenciespanel457: string;
  templatedbschemadependenciespanel469: string;
  templatedbschemadependenciespanel483: string;
  templatedbschemadependenciespanel496: string;
  templatedbschemadependenciespanel504: string;
  templatedbschemadependenciespanel505: string;
  templatedbschemadependenciespanel506: string;
  templatedbschemadependenciespanel507: string;
  templatedbschemadependenciespanel517: string;
  templatedbschemadependenciespanel527: string;
  templatedbschemadependenciespanel536: string;
  templatedbschemadependenciespanel541: string;
  templatedbschemadependenciespanel559: string;
  templatedbschemadependenciespanel570: string;
  templatedbschemadependenciespanel578: string;
  templatedbschemadependenciespanel583: string;
  templatedbschemadependenciespanel588: string;

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel595: string;

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager108: string;
  templatefilemanager116: string;
  templatefilemanager120: string;
  templatefilemanager131: string;
  templatefilemanager137: string;
  templatefilemanager138: string;

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager141: string;

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: string;
  templatefilemanager175: string;
  templatefilemanager185: string;
  templatefilemanager195: string;
  templatefilemanager205: string;
  templatefilemanager216: string;
  templatefilemanager220: string;
  templatefilemanager227: string;
  templatefilemanager241: string;
  templatefilemanager243: string;
  templatefilemanager244: string;
  templatefilemanager245: string;
  templatefilemanager246: string;
  templatefilemanager247: string;
  templatefilemanager252: string;

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager265: string;

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager271: string;

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: string;
  templatefilemanager288: string;

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager294: string;
  templatefilemanager301: string;

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager335: string;

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager341: string;
  templatefilemanager347: string;
  templatefilemanager361: string;
  templatefilemanager368: string;

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: string;
  templatemanagementpanel113: string;
  templatemanagementpanel115: string;
  templatemanagementpanel116: string;
  templatemanagementpanel117: string;
  templatemanagementpanel118: string;
  templatemanagementpanel119: string;
  templatemanagementpanel120: string;
  templatemanagementpanel135: string;
  templatemanagementpanel150: string;
  templatemanagementpanel202: string;
  templatemanagementpanel211: string;
  templatemanagementpanel216: string;
  templatemanagementpanel230: string;
  templatemanagementpanel286: string;
  templatemanagementpanel291: string;
  templatemanagementpanel335: string;
  templatemanagementpanel340: string;
  templatemanagementpanel359: string;
  templatemanagementpanel395: string;
  templatemanagementpanel410: string;
  templatemanagementpanel413: string;
  templatemanagementpanel419: string;
  templatemanagementpanel420: string;
  templatemanagementpanel428: string;
  templatemanagementpanel433: string;
  templatemanagementpanel436: string;
  templatemanagementpanel437: string;
  templatemanagementpanel441: string;
  templatemanagementpanel464: string;
  templatemanagementpanel467: string;
  templatemanagementpanel485: string;
  templatemanagementpanel517: string;
  templatemanagementpanel521: string;
  templatemanagementpanel527: string;
  templatemanagementpanel595: string;
  templatemanagementpanel597: string;
  templatemanagementpanel601: string;
  templatemanagementpanel613: string;
  templatemanagementpanel618: string;
  templatemanagementpanel624: string;
  templatemanagementpanel646: string;
  templatemanagementpanel653: string;
  templatemanagementpanel667: string;
  templatemanagementpanel669: string;
  templatemanagementpanel672: string;
  templatemanagementpanel675: string;
  templatemanagementpanel684: string;
  templatemanagementpanel693: string;
  templatemanagementpanel706: string;
  templatemanagementpanel711: string;
  templatemanagementpanel716: string;
  templatemanagementpanel721: string;
  templatemanagementpanel736: string;
  templatemanagementpanel743: string;
  templatemanagementpanel744: string;
  templatemanagementpanel747: string;
  templatemanagementpanel757: string;
  templatemanagementpanel764: string;
  templatemanagementpanel771: string;
  templatemanagementpanel777: string;
  templatemanagementpanel785: string;
  templatemanagementpanel791: string;
  templatemanagementpanel795: string;
  templatemanagementpanel859: string;
  templatemanagementpanel862: string;
  templatemanagementpanel865: string;
  templatemanagementpanel868: string;
  templatemanagementpanel876: string;
  templatemanagementpanel893: string;

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel933: string;

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: string;

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel944: string;
  templatemanagementpanel949: string;
  templatemanagementpanel954: string;
  templatemanagementpanel961: string;

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel970: string;
  templatemanagementpanel971: string;

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel976: string;

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel977: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal15: string;
  templatemodal16: string;
  templatemodal147: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal159: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: string;
  templatemodal169: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal195: string;

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
  templatemodal235: string;
  templatemodal236: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal259: string;
  templatemodal276: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal301: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: string;
  templatemodal317: string;
  templatemodal318: string;
  templatemodal320: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal333: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal379: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal395: string;
  templatemodal396: string;
  templatemodal397: string;
  templatemodal398: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal448: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal449: string;

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal469: string;

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal491: string;
  templatemodal502: string;
  templatemodal503: string;

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal65: string;
  sqlimportmodal76: string;
  sqlimportmodal87: string;
  sqlimportmodal106: string;
  sqlimportmodal129: string;
  sqlimportmodal134: string;
  sqlimportmodal139: string;
  sqlimportmodal144: string;
  sqlimportmodal154: string;
  sqlimportmodal177: string;
  sqlimportmodal203: string;
  sqlimportmodal211: string;
  sqlimportmodal234: string;

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal277: string;

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal286: string;
  sqlimportmodal301: string;
  sqlimportmodal313: string;

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal322: string;
  sqlimportmodal328: string;
  sqlimportmodal332: string;
  sqlimportmodal338: string;

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal353: string;
  sqlimportmodal368: string;

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal369: string;
  sqlimportmodal405: string;

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: string;

  // resources/js\Components\TopBar.tsx
  topbar57: string;
  topbar60: string;
  topbar71: string;
  topbar75: string;
  topbar98: string;
  topbar102: string;
  topbar122: string;

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: string;
  fontprovider29: string;

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal19: string;

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
  versionconfirmationmodal83: string;

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: string;
  versionconfirmationmodal92: string;

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal93: string;

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: string;

  // resources/js\contexts\ProjectContext.tsx
  projectcontext196: string;

  // resources/js\contexts\ToastContext.tsx
  toastcontext19: string;
  toastcontext28: string;
  toastcontext37: string;
  toastcontext46: string;
  toastcontext63: string;

  // resources/js\i18n\index.ts
  indexts26: string;
  indexts28: string;

  // resources/js\lib\api.ts
  apits104: string;
  apits119: string;
  apits152: string;
  apits201: string;
  apits219: string;
  apits235: string;
  apits251: string;
  apits268: string;
  apits286: string;
  apits314: string;
  apits329: string;
  apits350: string;
  apits518: string;
  apits527: string;
  apits553: string;

  // resources/js\pages\CMSPage.tsx
  cmspage45: string;
  cmspage194: string;
  cmspage208: string;
  cmspage352: string;

  // resources/js/pages/CMSPage.tsx
  cmspage353: string;

  // resources/js\pages\CMSPage.tsx
  cmspage387: string;
  cmspage412: string;
  cmspage422: string;
  cmspage423: string;
  cmspage426: string;
  cmspage435: string;
  cmspage440: string;
  cmspage462: string;
  cmspage473: string;
  cmspage474: string;
  cmspage479: string;
  cmspage501: string;
  cmspage520: string;
  cmspage542: string;
  cmspage553: string;

  // resources/js\pages\EmailVerification.tsx
  emailverification13: string;

  // resources/js\pages\Index.tsx
  index133: string;
  index258: string;

  // resources/js/pages/Index.tsx
  index265: string;

  // resources/js\pages\Index.tsx
  index293: string;
  index333: string;
  index378: string;
  index400: string;
  index413: string;
  index426: string;
  index439: string;
  index476: string;
  index495: string;
  index508: string;
  index521: string;
  index534: string;
  index539: string;
  index540: string;
  index542: string;
  index543: string;
  index544: string;
  index545: string;
  index556: string;
  index590: string;
  index625: string;
  index662: string;
  index676: string;
  index689: string;
  index711: string;
  index724: string;
  index737: string;
  index750: string;
  index763: string;
  index776: string;
  index792: string;
  index796: string;
  index797: string;
  index798: string;
  index835: string;
  index861: string;
  index917: string;
  index918: string;
  index919: string;
  index921: string;
  index1415: string;
  index1621: string;
  index1636: string;
  index1639: string;

  // resources/js/pages/Index.tsx
  index1759: string;

  // resources/js\pages\Index.tsx
  index1771: string;
  index1784: string;
  index1788: string;
  index1851: string;
  index1856: string;
  index1928: string;
  index2009: string;
  index2020: string;
  index2058: string;
  index2070: string;

  // resources/js/pages/LandingPage.tsx
  statusLink: string;

  // resources/js\pages\LandingPage.tsx
  landingpage69: string;
  landingpage110: string;

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
  landingpage154: string;
  landingpage155: string;
  landingpage156: string;
  landingpage157: string;
  landingpage158: string;

  // resources/js/pages/LandingPage.tsx
  goStartFree: string;
  premiumLabel: string;

  // resources/js\pages\LandingPage.tsx
  landingpage168: string;
  landingpage170: string;
  landingpage171: string;
  landingpage172: string;
  landingpage173: string;
  landingpage174: string;
  landingpage175: string;

  // resources/js/pages/LandingPage.tsx
  goPremium: string;

  // resources/js\pages\LandingPage.tsx
  landingpage182: string;
  landingpage186: string;
  landingpage188: string;
  landingpage189: string;
  landingpage190: string;
  landingpage191: string;
  landingpage192: string;
  landingpage193: string;
  landingpage195: string;

  // resources/js/pages/LandingPage.tsx
  patronLabel: string;

  // resources/js\pages\LandingPage.tsx
  landingpage203: string;
  landingpage205: string;
  landingpage206: string;
  landingpage207: string;
  landingpage208: string;
  landingpage209: string;

  // resources/js/pages/LandingPage.tsx
  becomePatron: string;

  // resources/js\pages\LandingPage.tsx
  landingpage288: string;
  landingpage304: string;
  landingpage307: string;
  landingpage311: string;

  // resources/js/pages/LandingPage.tsx
  landingpage316: string;

  // resources/js\pages\LandingPage.tsx
  landingpage336: string;

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
  landingpage486: string;
  landingpage514: string;

  // resources/js/pages/LandingPage.tsx
  ctaTitle: string;
  ctaSubtitle: string;
  startFreeTrial: string;
  tryDemoNow: string;
  contactSales: string;
  goToApp: string;
  welcomeBack: string;

  // resources/js\pages\LandingPage.tsx
  landingpage573: string;

  // resources/js/pages/LandingPage.tsx
  currentPlan: string;
  freeLabel: string;
  freeTier: string;
  registerFirst: string;

  // resources/js\pages\LandingPage.tsx
  landingpage589: string;
  landingpage594: string;

  // resources/js/pages/LandingPage.tsx
  upgradeTo: string;
  currentPlanButton: string;
  landingpage629: string;
  landingpage630: string;
  productLabel: string;
  featuresLink: string;
  pricingLink: string;
  templatesLink: string;
  examplesLink: string;
  resourcesLabel: string;
  documentationLink: string;
  apiReferenceLink: string;
  tutorialsLink: string;
  downloadsLink: string;
  supportLabel: string;
  helpCenterLink: string;

  // resources/js\pages\LandingPage.tsx
  landingpage664: string;

  // resources/js/pages/LandingPage.tsx
  contactUsLink: string;
  communityLink: string;
  allRightsReserved: string;

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: string;
  termsOfService: string;

  // resources/js\pages\LandingPage.tsx
  landingpage716: string;
  landingpage726: string;
  landingpage727: string;
  landingpage730: string;
  landingpage743: string;
  landingpage748: string;
  landingpage764: string;
  landingpage765: string;
  landingpage767: string;
  landingpage769: string;
  landingpage782: string;
  landingpage801: string;
  landingpage762: string;
  landingpage762a: string;
  landingpage814: string;
  landingpage796: string;
  landingpage802: string;
  landingpage802a: string;
  landingpage738: string;
  landingpage647: string;
  landingpage627: string;

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse70: string;
  projectinvitationresponse77: string;
  projectinvitationresponse133: string;
  projectinvitationresponse138: string;
  projectinvitationresponse161: string;
  projectinvitationresponse167: string;
  projectinvitationresponse170: string;
  projectinvitationresponse181: string;
  projectinvitationresponse192: string;
  projectinvitationresponse193: string;

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse223: string;

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse233: string;

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse235: string;

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse256: string;
  projectinvitationresponse266: string;
  projectinvitationresponse273: string;
  projectinvitationresponse283: string;
  projectinvitationresponse292: string;
  projectinvitationresponse307: string;
  projectinvitationresponse334: string;
  projectinvitationresponse348: string;

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse355: string;

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse373: string;
  projectinvitationresponse374: string;
  projectinvitationresponse379: string;
  projectinvitationresponse380: string;
  projectinvitationresponse386: string;
  projectinvitationresponse399: string;
  projectinvitationresponse407: string;
  projectinvitationresponse417: string;
  projectinvitationresponse428: string;

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse433: string;

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse436: string;
  projectinvitationresponse440: string;
  projectinvitationresponse449: string;
  projectinvitationresponse453: string;
  projectinvitationresponse458: string;
  projectinvitationresponse466: string;
  projectinvitationresponse471: string;
  projectinvitationresponse480: string;
  projectinvitationresponse487: string;

  // resources/views\admin\pages\create.blade.php
  createblade60: string;

  // resources/views\emails\project-invitation.blade.php
  projectinvitationblade116: string;
  projectinvitationblade151: string;

  // resources/views\layouts\static.blade.php
  staticblade37: string;

  // resources/views\pages\help.blade.php
  helpblade3: string;
  helpblade8: string;
  helpblade13: string;
  helpblade16: string;
  helpblade18: string;
  helpblade21: string;
  helpblade24: string;
  helpblade25: string;
  helpblade26: string;
  helpblade27: string;
  helpblade31: string;
  helpblade34: string;
  helpblade35: string;
  helpblade36: string;
  helpblade37: string;
  helpblade41: string;
  helpblade43: string;

  // resources/views\pages\impressum.blade.php
  impressumblade3: string;
  impressumblade8: string;
  impressumblade14: string;
  impressumblade17: string;
  impressumblade18: string;
  impressumblade22: string;
  impressumblade25: string;
  impressumblade28: string;
  impressumblade31: string;

  // routes\api.php
  api36: string;
  api47: string;
  api85: string;
  api126: string;
  api180: string;
  api181: string;
  api183: string;
  api184: string;
  api185: string;
  api194: string;
  api197: string;
  api198: string;
  api199: string;
  api202: string;
  api203: string;
  api204: string;
  api205: string;
  api300: string;
  api416: string;
  api427: string;
  api452: string;
  api509: string;
  api528: string;
  api745: string;
  api761: string;
  api765: string;
  api771: string;
  api777: string;
  api803: string;
  api804: string;
  api805: string;
  api806: string;
  api810: string;
  api812: string;
  api813: string;
  api823: string;
  api860: string;
  api869: string;
  api872: string;
  api913: string;
  api914: string;
  api915: string;
  api939: string;
  api954: string;
  api998: string;
  api1026: string;
  api1050: string;
  api1051: string;
  api1052: string;
  api1053: string;
  api1059: string;
  api1142: string;
  api1143: string;
  api1161: string;
  api1276: string;
  api1285: string;
  api1300: string;
  api1330: string;
  api1358: string;
  api1379: string;
  api1386: string;
  api1388: string;
  api1393: string;
  api1431: string;
  api1438: string;
  api1454: string;
  api1458: string;
  api1465: string;
  api1469: string;
  api1498: string;
  api1502: string;
  api1532: string;
  api1676: string;
  api1682: string;
  api1684: string;
  api1707: string;
  api1760: string;
  api1809: string;
  api1810: string;
  api1814: string;
  api1815: string;
  api1816: string;
  api1817: string;
  api1824: string;

  // routes\gtree-ultimate.php
  gtreeultimate26: string;
  gtreeultimate85: string;
  gtreeultimate86: string;
  gtreeultimate90: string;
  gtreeultimate91: string;
  gtreeultimate95: string;
  gtreeultimate105: string;
  gtreeultimate120: string;
  gtreeultimate149: string;
  gtreeultimate160: string;
  gtreeultimate161: string;
  gtreeultimate163: string;
  gtreeultimate409: string;

  // routes\web.php
  web50: string;

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
  profilemodal377: string;
  profilemodal378: string;
  profilemodal379: string;
  profilemodal380: string;
  profilemodal381: string;
  profilemodal382: string;
  profilemodal383: string;
  profilemodal387: string;
  profilemodal478: string;
  profilemodal501: string;
  profilemodal526: string;
  profilemodal550: string;
  profilemodal572: string;
  profilemodal600: string;
  profilemodal604: string;
  profilemodal638: string;
  profilemodal649: string;
  profilemodal677: string;
  profilemodal692: string;
  profilemodal703: string;
  profilemodal754: string;
  profilemodal758: string;
  profilemodal761: string;
  profilemodal783: string;
  profilemodal810: string;
  profilemodal841: string;
  profilemodal845: string;
  profilemodal858: string;
  profilemodal871: string;
  profilemodal886: string;
  profilemodal896: string;
  profilemodal911: string;
  profilemodal913: string;
  profilemodal915: string;
  profilemodal928: string;
  profilemodal928_2: string;
  profilemodal937: string;
  profilemodal950: string;
  profilemodal955: string;
  profilemodal970: string;
  profilemodal1151: string;
  profilemodal1376: string;
  profilemodal1393: string;
  profilemodal1404: string;
  profilemodal1409: string;
  profilemodal1447: string;
  profilemodal1464: string;
  profilemodal1473: string;
  profilemodal1480: string;
  profilemodal1483: string;
  profilemodal1500: string;
  profilemodal1681: string;
  profilemodal1682: string;
  profilemodal1687: string;
  profilemodal1693: string;
  profilemodal1706: string;
  profilemodal1706_2: string;
  profilemodal1715: string;
  profilemodal1755: string;
  profilemodal1769: string;
  profilemodal1817: string;
  profilemodal1945: string;
  profilemodal1958: string;
  profilemodal1955: string;
  profilemodal1977: string;
  profilemodal2021: string;
  profilemodal2026: string;
  profilemodal2026_2: string;
  profilemodal2026_3: string;
  profilemodal2031: string;
  profilemodal2031_2: string;
  profilemodal2035: string;
  profilemodal2041: string;
  profilemodal2048: string;
  profilemodal2048_2: string;
  profilemodal2081: string;
  profilemodal2089: string;
  profilemodal2121: string;
  profilemodal2121_2: string;
  profilemodal2127: string;
  profilemodal2127_2: string;
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
  profilemodal2524: string;
  profilemodal2538: string;
  profilemodal2535: string;
  profilemodal2556: string;
  profilemodal2570: string;
  profilemodal2586: string;
  profilemodal2589: string;
  profilemodal2597: string;
  profilemodal2606: string;
  profilemodal2637: string;
  profilemodal2640: string;
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

  //PlanModal.tsx
  planmodal54: string;
  planmodal95: string;
  planmodal112: string;
  planmodal121: string;
  planmodal135: string;
  planmodal152: string;
  planmodal161: string;
  planmodal176: string;
  planmodal192: string;
  planmodal201: string;
  planmodal215: string;
  planmodal232: string;
  planmodal241: string;
  planmodal249: string;
  planmodal259: string;
  planmodal275: string;
  planmodal279: string;
  planmodal285: string;
  planmodal284: string;
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
  projectpanel932: string;
  projectpanel936: string;
  projectpanel935: string;
  projectpanel949: string;
  projectpanel957: string;
  projectpanel1009: string;
  projectpanel1208: string;
  projectpanel1213: string;
  projectpanel1225: string;
  projectpanel1231: string;
  projectpanel1231_2: string;
  projectpanel1238: string;
  projectpanel1239: string;
  projectpanel1278: string;
  projectpanel1298: string;
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
  projectpanel2119: string;
  projectpanel2124: string;
  projectpanel2150: string;
  projectpanel2169: string;
  projectpanel2180: string;
  projectpanel2197: string;
  projectpanel2206: string;
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
  projectpanel2383: string;
  projectpanel2377: string;
  projectpanel2394: string;
  projectpanel2400: string;
  projectpanel2410: string;
  projectpanel2452: string;
  projectpanel2458: string;

  //ProjectSettingsPanel.tsx
  projectsettingspanel337: string;
  projectsettingspanel374: string;
  projectsettingspanel407: string;
  projectsettingspanel433: string;
  projectsettingspanel436: string;
  projectsettingspanel439: string;
  projectsettingspanel460: string;
  projectsettingspanel474: string;
  projectsettingspanel477: string;
  projectsettingspanel523: string;
  projectsettingspanel549: string;
  projectsettingspanel571: string;
  projectsettingspanel640: string;
  projectsettingspanel642: string;
  projectsettingspanel646: string;
  projectsettingspanel653: string;
  projectsettingspanel686: string;
  projectsettingspanel688: string;
  projectsettingspanel691: string;
  projectsettingspanel692: string;
  projectsettingspanel804: string;
  projectsettingspanel805: string;
  projectsettingspanel834: string;
  projectsettingspanel834_2: string;
  projectsettingspanel834_3: string;
  projectsettingspanel890: string;
  projectsettingspanel958: string;
  projectsettingspanel975: string;
  projectsettingspanel982: string;
  projectsettingspanel984: string;
  projectsettingspanel985: string;
  projectsettingspanel1015: string;
  projectsettingspanel1016: string;
  projectsettingspanel1017: string;
  projectsettingspanel1042: string;
  projectsettingspanel1433: string;
  projectsettingspanel1434: string;
  projectsettingspanel1435: string;
  projectsettingspanel1682: string;
  projectsettingspanel1743: string;
  projectsettingspanel1785: string;
  projectsettingspanel1816: string;
  projectsettingspanel1841: string;
  projectsettingspanel1841_2: string;
  projectsettingspanel1856: string;
  projectsettingspanel1885: string;
  projectsettingspanel1895: string;
  projectsettingspanel1903: string;
  projectsettingspanel1904: string;
  projectsettingspanel1901: string;
  projectsettingspanel1912: string;
  projectsettingspanel1922: string;
  projectsettingspanel1941: string;
  projectsettingspanel1941_2: string;
  projectsettingspanel1944: string;
  projectsettingspanel1950: string;
  projectsettingspanel1976: string;
  projectsettingspanel1970: string;
  projectsettingspanel1970_2: string;
  projectsettingspanel1967: string;
  projectsettingspanel1990: string;
  projectsettingspanel1990_2: string;
  projectsettingspanel1995: string;
  projectsettingspanel2005: string;
  projectsettingspanel2010: string;
  projectsettingspanel2014: string;
  projectsettingspanel2023: string;
  projectsettingspanel2029: string;
  projectsettingspanel2030: string;
  projectsettingspanel2031: string;
  projectsettingspanel2038: string;
  projectsettingspanel2038_2: string;
  projectsettingspanel2060: string;
  projectsettingspanel2065: string;
  projectsettingspanel2065_2: string;
  projectsettingspanel2077: string;
  projectsettingspanel2087: string;
  projectsettingspanel2095: string;
  projectsettingspanel2115: string;
  projectsettingspanel2116: string;
  projectsettingspanel2107: string;
  projectsettingspanel2132: string;
  projectsettingspanel2138: string;
  projectsettingspanel2152: string;
  projectsettingspanel2156: string;
  projectsettingspanel2190: string;
  projectsettingspanel2197: string;
  projectsettingspanel2210: string;
  projectsettingspanel2223: string;
  projectsettingspanel2231: string;
  projectsettingspanel2240: string;
  projectsettingspanel2236: string;
  projectsettingspanel2255: string;
  projectsettingspanel2265: string;
  projectsettingspanel2274: string;
  projectsettingspanel2274_2: string;
  projectsettingspanel2297: string;
  projectsettingspanel2305: string;
  projectsettingspanel2319: string;
  projectsettingspanel2322: string;
  projectsettingspanel2331: string;
  projectsettingspanel2334: string;
  projectsettingspanel2335: string;
  projectsettingspanel2336: string;
  projectsettingspanel2338: string;
  projectsettingspanel2338_2: string;

  //TeamManagementPanel.tsx
  teammanagementpanel247: string;
  teammanagementpanel247_2: string;
  teammanagementpanel337: string;
  teammanagementpanel338: string;
  teammanagementpanel350: string;
  teammanagementpanel369: string;
  teammanagementpanel370: string;
  teammanagementpanel370_2: string;
  teammanagementpanel374: string;
  teammanagementpanel387: string;
  teammanagementpanel388: string;
  teammanagementpanel395: string;
  teammanagementpanel396: string;
  teammanagementpanel425: string;
  teammanagementpanel426: string;
  teammanagementpanel426_2: string;
  teammanagementpanel468: string;
  teammanagementpanel504: string;
  teammanagementpanel505: string;
  teammanagementpanel512: string;
  teammanagementpanel513: string;
  teammanagementpanel547: string;
  teammanagementpanel548: string;
  teammanagementpanel560: string;
  teammanagementpanel561: string;
  teammanagementpanel568: string;
  teammanagementpanel569: string;
  teammanagementpanel594: string;
  teammanagementpanel597: string;
  teammanagementpanel597_2: string;
  teammanagementpanel601: string;
  teammanagementpanel602: string;
  teammanagementpanel603: string;
  teammanagementpanel687: string;
  teammanagementpanel721: string;
  teammanagementpanel762: string;
  teammanagementpanel754: string;
  teammanagementpanel771: string;
  teammanagementpanel781: string;
  teammanagementpanel788: string;
  teammanagementpanel803: string;
  teammanagementpanel818: string;
  teammanagementpanel827: string;
  teammanagementpanel977: string;
  teammanagementpanel983: string;
  teammanagementpanel988: string;
  teammanagementpanel1009: string;
  teammanagementpanel1055: string;
  teammanagementpanel1057: string;
  teammanagementpanel1058: string;
  teammanagementpanel1043: string;
  teammanagementpanel1049: string;
  teammanagementpanel1082: string;
  teammanagementpanel1082_2: string;
  teammanagementpanel1094: string;
  teammanagementpanel1089: string;
  teammanagementpanel1130: string;
  teammanagementpanel1145: string;
  teammanagementpanel1155: string;
  teammanagementpanel1155_2: string;
  teammanagementpanel1167: string;
  teammanagementpanel1193: string;
  teammanagementpanel1196: string;
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
  teammanagementpanel1282: string;
  teammanagementpanel1282_2: string;

  //KanbanBoardPanel.tsx
  kanbanboardpanel299: string;
  kanbanboardpanel307: string;
  kanbanboardpanel469: string;
  kanbanboardpanel474: string;
  kanbanboardpanel495: string;
  kanbanboardpanel495_2: string;
  kanbanboardpanel498: string;
  kanbanboardpanel499: string;
  kanbanboardpanel499_2: string;
  kanbanboardpanel524: string;
  kanbanboardpanel528: string;
  kanbanboardpanel632: string;
  kanbanboardpanel636: string;
  kanbanboardpanel671: string;
  kanbanboardpanel700: string;
  kanbanboardpanel700_2: string;
  kanbanboardpanel705: string;
  kanbanboardpanel708: string;
  kanbanboardpanel715: string;
  kanbanboardpanel716: string;
  kanbanboardpanel731: string;
  kanbanboardpanel734: string;
  kanbanboardpanel737: string;
  kanbanboardpanel790: string;
  kanbanboardpanel807: string;
  kanbanboardpanel813: string;
  kanbanboardpanel816: string;
  kanbanboardpanel823: string;
  kanbanboardpanel840: string;
  kanbanboardpanel846: string;
  kanbanboardpanel849: string;
  kanbanboardpanel980: string;
  kanbanboardpanel1006: string;
  kanbanboardpanel1027: string;
  kanbanboardpanel1027_2: string;
  kanbanboardpanel1032: string;
  kanbanboardpanel1035: string;
  kanbanboardpanel1067: string;
  kanbanboardpanel1088: string;
  kanbanboardpanel1088_2: string;
  kanbanboardpanel1093: string;
  kanbanboardpanel1096: string;
  kanbanboardpanel1103: string;
  kanbanboardpanel1109: string;
  kanbanboardpanel1125: string;
  kanbanboardpanel1128: string;
  kanbanboardpanel1131: string;
  kanbanboardpanel1166: string;
  kanbanboardpanel1168: string;
  kanbanboardpanel1169: string;
  kanbanboardpanel1175: string;
  kanbanboardpanel1179: string;
  kanbanboardpanel1183: string;
  kanbanboardpanel1187: string;
  kanbanboardpanel1198: string;
  kanbanboardpanel1203: string;
  kanbanboardpanel1203_2: string;
  kanbanboardpanel1213: string;
  kanbanboardpanel1213_2: string;
  kanbanboardpanel1294: string;
  kanbanboardpanel1303: string;
  kanbanboardpanel1317: string;
  kanbanboardpanel1317_2: string;
  kanbanboardpanel1324: string;
  kanbanboardpanel1341: string;
  kanbanboardpanel1349: string;
  kanbanboardpanel1361: string;
  kanbanboardpanel1353: string;
  kanbanboardpanel1394: string;
  kanbanboardpanel1401: string;
  kanbanboardpanel1408: string;
  kanbanboardpanel1436: string;
  kanbanboardpanel1451: string;
  kanbanboardpanel1451_2: string;
  kanbanboardpanel1460: string;
  kanbanboardpanel1466: string;
  kanbanboardpanel1480: string;
  kanbanboardpanel1475: string;
  kanbanboardpanel1486: string;
  kanbanboardpanel1492: string;
  kanbanboardpanel1497: string;
  kanbanboardpanel1507: string;
  kanbanboardpanel1525: string;
  kanbanboardpanel1558: string;
  kanbanboardpanel1564: string;
  kanbanboardpanel1573: string;
  kanbanboardpanel1578: string;
  kanbanboardpanel1584: string;
  kanbanboardpanel1602: string;
  kanbanboardpanel1611: string;
  kanbanboardpanel1614: string;
  kanbanboardpanel1631: string;
  kanbanboardpanel1621: string;
  kanbanboardpanel1656: string;
  kanbanboardpanel1669: string;
  kanbanboardpanel1677: string;

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
  templatemanagementpanel593: string;
  templatemanagementpanel593_2: string;
  templatemanagementpanel596: string;
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
  templatemanagementpanel772: string;
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
  templatemanagementpanel903: string;
  templatemanagementpanel911: string;
  templatemanagementpanel914: string;
  templatemanagementpanel966: string;
  templatemanagementpanel966_2: string;
  templatemanagementpanel966_3: string;
  templatemanagementpanel972: string;
  templatemanagementpanel973: string;
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
  templatemanagementpanel1744: string;
  templatemanagementpanel1744_2: string;
  templatemanagementpanel1829: string;
  templatemanagementpanel1935: string;
  templatemanagementpanel1936: string;
  templatemanagementpanel1937: string;
  templatemanagementpanel1938: string;
  templatemanagementpanel1948: string;
  templatemanagementpanel1977: string;
  templatemanagementpanel2004: string;
  templatemanagementpanel2012: string;
  templatemanagementpanel2017: string;
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
  templatemanagementpanel2358: string;
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
  templatemanagementpanel2608: string;
  templatemanagementpanel2638: string;
  templatemanagementpanel2688: string;
  templatemanagementpanel2689: string;
  templatemanagementpanel2705: string;
  templatemanagementpanel2699: string;
  templatemanagementpanel2717: string;
  templatemanagementpanel2728: string;
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
  templatemanagementpanel2918: string;
  templatemanagementpanel2931: string;
  templatemanagementpanel2941: string;
  templatemanagementpanel2977: string;
  templatemanagementpanel2978: string;
  templatemanagementpanel2995: string;
  templatemanagementpanel2995_2: string;
  templatemanagementpanel2995_3: string;

  //TemplateReviewPanel.tsx
  templatereviewpanel114: string;
  templatereviewpanel127: string;
  templatereviewpanel142: string;
  templatereviewpanel147: string;
  templatereviewpanel166: string;
  templatereviewpanel197: string;
  templatereviewpanel199: string;
  templatereviewpanel225: string;
  templatereviewpanel237: string;
  templatereviewpanel239: string;
  templatereviewpanel272: string;
  templatereviewpanel303: string;
  templatereviewpanel303_2: string;
  templatereviewpanel306: string;
  templatereviewpanel399: string;
  templatereviewpanel396: string;
  templatereviewpanel429: string;
  templatereviewpanel436: string;
  templatereviewpanel443: string;
  templatereviewpanel449: string;
  templatereviewpanel455: string;
  templatereviewpanel460: string;
  templatereviewpanel465: string;
  templatereviewpanel470: string;
  templatereviewpanel493: string;
  templatereviewpanel498: string;
  templatereviewpanel504: string;
  templatereviewpanel510: string;
  templatereviewpanel517: string;
  templatereviewpanel541: string;
  templatereviewpanel531: string;
  templatereviewpanel551: string;
  templatereviewpanel566: string;
  templatereviewpanel584: string;
  templatereviewpanel599: string;
  templatereviewpanel610: string;
  templatereviewpanel614: string;
  templatereviewpanel622: string;
  templatereviewpanel638: string;
  templatereviewpanel648: string;

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
  templatemanagementpanel2223: string;
  templatemanagementpanel2171: string;
  templatemanagementpanel2191: string;
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
}