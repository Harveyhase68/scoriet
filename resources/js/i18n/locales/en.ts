import type { Translations } from '../types';

export const en: Translations = {

  // app\Console\Commands\DebugSchemas.php
  debugschemas22: 'Debug all schemas and their tables',
  debugschemas29: '🔍 Debugging all schemas and tables',
  debugschemas38: 'Found ',
  debugschemas49: 'Latest versions per schema:',
  debugschemas56: 'Schema ID: {$schemaId}',
  debugschemas70: ' schemas with {$totalTables} total tables',

  // app\Console\Commands\DemoReset.php
  demoreset16: 'demo:reset {--backup : Create backup before reset}',
  demoreset23: 'Reset demo database to initial state with fresh demo data',
  demoreset31: 'Demo reset can only be run in local or demo environment!',
  demoreset35: '🚀 Starting Demo Database Reset...',
  demoreset45: '✅ Demo database has been reset successfully!',
  demoreset46: '📊 Demo users available: demo-admin',
  demoreset53: '📦 Creating database backup...',
  demoreset60: 'Y-m-d_H-i-s',
  demoreset65: '✅ Backup created: {$filename}',
  demoreset70: '🗄️ Dropping all tables...',
  demoreset89: '🔄 Running migrations...',
  demoreset92: '🌱 Seeding demo data...',

  // app\Console\Commands\FixTemplateFilePaths.php
  fixtemplatefilepaths23: 'Fix empty file_path values in template_files table',
  fixtemplatefilepaths30: 'Checking for template files with empty file_path...',
  fixtemplatefilepaths43: 'Found {$emptyCount} files with empty file_path out of {$totalFiles} total files',
  fixtemplatefilepaths46: 'All template files already have file_path values!',
  fixtemplatefilepaths50: 'Fixing empty file_path values...',
  fixtemplatefilepaths70: 'Fixed file ID {$file->id}: {$file->file_name} -> {$path}',
  fixtemplatefilepaths74: 'Successfully fixed {$fixedCount} template file paths!',

  // app\Console\Commands\TestObservers.php
  testobservers28: 'Test observer functionality by triggering various model events',
  testobservers37: '🧪 Testing Observer Functionality',
  testobservers42: 'Jobs in queue before test: {$jobsBefore}',
  testobservers68: 'Jobs in queue after test: {$jobsAfter}',
  testobservers69: 'New jobs dispatched: {$newJobs}',
  testobservers71: '✅ Observer test completed!',
  testobservers72: 'Check the logs for detailed observer activity.',
  testobservers77: '📋 Testing Template Observer...',
  testobservers83: 'Test template for observer functionality',
  testobservers92: '✅ Created template: {$template->id}',
  testobservers98: 'Hello World',
  testobservers103: '✅ Added file to template',
  testobservers106: 'Updated description',
  testobservers107: '✅ Updated template',
  testobservers111: '✅ Deleted template',
  testobservers114: '❌ Template observer test failed: ',
  testobservers120: '📄 Testing TemplateFile Observer...',
  testobservers126: 'Test template for file observer',
  testobservers139: 'Test File',
  testobservers144: '✅ Created template file: {$file->id}',
  testobservers147: 'Updated Content',
  testobservers148: '✅ Updated template file',
  testobservers152: '✅ Deleted template file',
  testobservers158: '❌ TemplateFile observer test failed: ',
  testobservers164: '🗄️ Testing SchemaVersion Observer...',
  testobservers174: '⚠️ No schema version found for project {$projectId}',
  testobservers183: 'Test version for observer',
  testobservers187: '✅ Created schema version: {$newVersion->id}',
  testobservers191: '✅ Deleted schema version',
  testobservers194: '❌ SchemaVersion observer test failed: ',
  testobservers200: '📋 Testing SchemaTable Observer...',
  testobservers210: '⚠️ No schema version found for project {$projectId}',
  testobservers218: 'Test table for observer',
  testobservers224: '✅ Created schema table: {$table->id}',
  testobservers227: 'Updated comment',
  testobservers228: '✅ Updated schema table',
  testobservers232: '✅ Deleted schema table',
  testobservers235: '❌ SchemaTable observer test failed: ',
  testobservers241: '🔗 Testing ProjectTemplateUsage Observer...',
  testobservers247: '⚠️ No template found',
  testobservers260: '✅ Created project template usage: {$usage->id}',
  testobservers264: '✅ Updated project template usage',
  testobservers268: '✅ Deactivated project template usage',
  testobservers272: '✅ Deleted project template usage',
  testobservers275: '❌ ProjectTemplateUsage observer test failed: ',

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas23: 'Test schema connections for a project',
  testprojectschemas32: '🔍 Testing schema connections for project {$projectId}',
  testprojectschemas37: 'All available schemas: ',
  testprojectschemas47: 'Project schemas for project {$projectId}: ',
  testprojectschemas50: 'Unknown',
  testprojectschemas54: 'Tables from connected schemas:',
  testprojectschemas59: 'Unknown',
  testprojectschemas73: '  Schema ',
  testprojectschemas79: ': No versions found',
  testprojectschemas83: 'Total tables from all connected schemas: {$totalTables}',

  // app\Console\Commands\TestTreeGenerator.php
  testtreegenerator25: 'Test ProjectFileTreeGenerator functionality',
  testtreegenerator34: '🌳 Testing ProjectFileTreeGenerator',
  testtreegenerator40: 'Project {$projectId} not found',
  testtreegenerator44: 'Project: {$project->name} (ID: {$project->id})',
  testtreegenerator52: 'Active template usages: ',
  testtreegenerator62: 'Generated tree nodes: ',
  testtreegenerator71: 'Template {$usage->template_id} ({$template->name}) files: ',
  testtreegenerator81: '    Children: ',
  testtreegenerator95: '    No children!',
  testtreegenerator101: 'Saved generation tree ID: {$generationTree->id}',
  testtreegenerator102: 'Tree data items: ',
  testtreegenerator103: 'No',

  // app\Console\Commands\TestTreeUpdate.php
  testtreeupdate23: 'Test tree update for a project',
  testtreeupdate32: '🌳 Testing tree update for project {$projectId}',
  testtreeupdate37: 'Project {$projectId} not found',
  testtreeupdate44: 'Tree saved with ID: {$tree->id}',
  testtreeupdate45: 'Tree has ',
  testtreeupdate48: 'Template: {$templateGroup[',
  testtreeupdate50: '  Files: {$fileCount}',

  // app\Http\Controllers\Admin\PageController.php
  pagecontroller50: 'A page with this slug already exists for the selected language.',
  pagecontroller89: 'Page deleted successfully.',

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller36: 'Project not found',
  autotranslatecontroller41: 'Unauthorized',
  autotranslatecontroller49: 'Google Translate API key not configured for this project. Please add your API key in Project Settings → Localization Settings.',
  autotranslatecontroller57: 'Auto-translate request',
  autotranslatecontroller74: 'Google Translate API response',
  autotranslatecontroller83: 'Translation failed',
  autotranslatecontroller91: 'translatedText',
  autotranslatecontroller94: 'translatedText',
  autotranslatecontroller99: 'No translation returned',
  autotranslatecontroller114: 'Translation failed for all languages',

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: 'Unauthorized. System admin access required.',
  languagecontroller102: 'Language deleted successfully.',

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller155: 'Private projects are only available for premium users',
  projectcontroller187: 'd.m.Y',
  projectcontroller188: 'H:i:s',
  projectcontroller190: 'Europe/Vienna',
  projectcontroller230: 'Unauthorized',
  projectcontroller246: 'Unauthorized',
  projectcontroller294: 'Only the project owner can transfer ownership',
  projectcontroller300: 'New owner must be a project member',
  projectcontroller361: 'Unauthorized',
  projectcontroller367: 'Project deleted successfully',
  projectcontroller377: 'Unauthorized',
  projectcontroller382: 'Project permanently deleted',
  projectcontroller392: 'Unauthorized',
  projectcontroller397: 'Project restored successfully',
  projectcontroller407: 'Unauthorized',
  projectcontroller429: 'Unauthorized',
  projectcontroller451: 'Unauthorized',
  projectcontroller523: 'Unauthorized',
  projectcontroller540: 'Some teams do not belong to you',
  projectcontroller556: 'Teams assigned successfully',
  projectcontroller566: 'Unauthorized',
  projectcontroller571: 'Team does not belong to you',
  projectcontroller576: 'Team is not assigned to this project',
  projectcontroller582: 'Team removed from project successfully',
  projectcontroller592: 'Unauthorized',
  projectcontroller605: 'Schema not found',
  projectcontroller610: 'Schema is already associated with this project',
  projectcontroller616: 'Schema associated successfully',
  projectcontroller626: 'Unauthorized',
  projectcontroller631: 'Schema is not associated with this project',
  projectcontroller637: 'Schema association removed successfully',
  projectcontroller649: 'Project not found',
  projectcontroller675: 'Project not found',
  projectcontroller724: 'Project not found',
  projectcontroller778: 'Insufficient permissions',
  projectcontroller788: 'User is not a member of this project',
  projectcontroller793: 'Cannot remove project owner',
  projectcontroller798: 'Only project owner can remove admins',
  projectcontroller814: 'Member removed successfully from project and all associated teams',
  projectcontroller828: 'Only project owner can change member roles',
  projectcontroller839: 'User is not a member of this project',
  projectcontroller844: 'Cannot change owner role',
  projectcontroller849: 'Member role updated successfully',
  projectcontroller861: 'Unauthorized',
  projectcontroller876: 'Project settings updated successfully',
  projectcontroller890: 'Unauthorized',
  projectcontroller907: 'Unauthorized',
  projectcontroller1000: 'Unauthorized',
  projectcontroller1026: 'Unauthorized',
  projectcontroller1033: 'Generation tree made regenerated successfully',

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php
  projectgenerationtreecontroller23: 'No generation tree found for this project',
  projectgenerationtreecontroller52: 'Missing ',
  projectgenerationtreecontroller61: 'No generation tree found for this project',

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller118: 'Schema not found',
  schemacontroller139: 'Unauthorized to edit this schema',
  schemacontroller173: '🚨 DELETE REQUEST RECEIVED',
  schemacontroller191: 'Unauthorized to delete this schema',
  schemacontroller206: 'Schema is being used by {$projectsCount} project(s). Use force delete to proceed.',
  schemacontroller215: '🗑️ Starting schema deletion',
  schemacontroller226: '🔥 Pre-emptive project association removal',
  schemacontroller228: '✅ Pre-removed {$deletedProjectAssociations} project associations',
  schemacontroller233: '✅ Eloquent detach completed',
  schemacontroller235: '⚠️ Eloquent detach failed: ',
  schemacontroller240: '🔥 Starting main deletion transaction for schema {$schema->id}',
  schemacontroller248: '🔍 Deletion scope',
  schemacontroller259: '✅ Removed {$deletedReferenceColumns} foreign key reference columns',
  schemacontroller264: '✅ Removed {$deletedReferences} foreign key references',
  schemacontroller269: '✅ Removed {$deletedConstraintColumns} constraint columns',
  schemacontroller274: '✅ Removed {$deletedConstraints} constraints',
  schemacontroller279: '✅ Removed {$deletedFields} schema fields',
  schemacontroller284: '✅ Removed {$deletedLayouts} schema designer layouts',
  schemacontroller288: '✅ Removed {$deletedTables} schema tables',
  schemacontroller293: '✅ Removed {$deletedVersions} schema versions',
  schemacontroller298: '🔍 Remaining project associations: {$remainingAssociations}',
  schemacontroller302: '✅ Force-removed remaining project associations',
  schemacontroller307: '✅ Removed schema itself',
  schemacontroller310: '🎉 Schema deletion completed successfully',
  schemacontroller316: 'Schema and all related data deleted successfully',
  schemacontroller323: '❌ Schema deletion failed',
  schemacontroller330: 'Failed to delete schema',
  schemacontroller345: 'Project not found',
  schemacontroller372: 'Schema not found',
  schemacontroller393: 'Schema version not found',
  schemacontroller431: 'Unauthorized to edit this schema',
  schemacontroller450: 'Layout saved successfully',
  schemacontroller452: 'Layout save error: ',
  schemacontroller453: 'Stack trace: ',
  schemacontroller455: 'Failed to save layout',
  schemacontroller470: 'Schema not found',
  schemacontroller489: 'Unauthorized to edit this schema',
  schemacontroller514: 'CreateTable Request Data:',
  schemacontroller617: 'Table created successfully',
  schemacontroller622: 'CreateTable Exception:',
  schemacontroller651: 'Unauthorized to edit this schema',
  schemacontroller657: 'Table does not belong to this schema version',
  schemacontroller684: 'UpdateTable Request Data:',
  schemacontroller804: 'Table updated successfully',
  schemacontroller810: 'Failed to update table',
  schemacontroller827: 'Unauthorized to edit this schema',
  schemacontroller833: 'Table does not belong to this schema version',
  schemacontroller840: 'Table deleted successfully',
  schemacontroller854: '🚨 ROUTE MODEL BINDING DEBUG: Method entry',
  schemacontroller880: 'This action requires a floating schema',
  schemacontroller885: 'Unauthorized to edit this schema',
  schemacontroller890: 'Table does not belong to this schema version',
  schemacontroller894: '🔍 API CALLED: deleteTableWithVersionCopy',
  schemacontroller911: '🔍 CRITICAL VERIFICATION: Checking table ownership',
  schemacontroller924: '🔍 DOUBLE CHECK: Table lookup by ID in version',
  schemacontroller935: 'Table deletion: {$table->table_name}',
  schemacontroller938: '✅ New version created',
  schemacontroller944: '🔍 BEFORE: Looking for table to delete in new version',
  schemacontroller953: '🔍 AFTER: Table lookup result in new version',
  schemacontroller966: '❌ Table not found in new version',
  schemacontroller970: ' not found in new version {$newVersion->version_number}',
  schemacontroller974: '🗑️ ABOUT TO DELETE: Final confirmation before deletion',
  schemacontroller990: '🗑️ Table relationships before deletion',
  schemacontroller999: '✅ Table deletion completed',
  schemacontroller1006: '✅ Table deleted successfully from new version',
  schemacontroller1010: 'New version created and table deleted',
  schemacontroller1030: 'Unauthorized to edit this schema',
  schemacontroller1048: 'Unauthorized to edit this schema',
  schemacontroller1087: 'Unauthorized to edit this schema',
  schemacontroller1110: 'New table: {$request->table_name}',
  schemacontroller1116: 'New table: {$request->table_name}',
  schemacontroller1125: 'A table with this name already exists in this schema version',
  schemacontroller1126: ' already exists',
  schemacontroller1158: 'New version created with table successfully',
  schemacontroller1165: 'Failed to create version and table',
  schemacontroller1182: 'Schema version not found',
  schemacontroller1249: 'This action requires a floating schema',
  schemacontroller1256: 'Unauthorized to edit this schema',
  schemacontroller1261: 'Only foreign key constraints can be deleted with this endpoint',
  schemacontroller1278: 'Delete FK: {$constraint->constraint_name}',
  schemacontroller1284: 'Failed to find table in new version',
  schemacontroller1293: 'Failed to find constraint in new version',
  schemacontroller1301: 'New version created and foreign key deleted',
  schemacontroller1314: 'Foreign key deleted successfully',
  schemacontroller1320: 'Constraint not found',
  schemacontroller1322: 'Delete FK Error:',
  schemacontroller1328: 'Failed to delete foreign key',
  schemacontroller1358: 'This action requires a floating schema',
  schemacontroller1365: 'Unauthorized to edit this schema',
  schemacontroller1370: 'Only foreign key constraints can be updated with this endpoint',
  schemacontroller1381: 'Update FK: {$constraint->constraint_name}',
  schemacontroller1387: 'Failed to find table in new version',
  schemacontroller1396: 'Failed to find constraint in new version',
  schemacontroller1404: 'New version created and foreign key updated',
  schemacontroller1416: 'Foreign key updated successfully',
  schemacontroller1422: 'Validation failed',
  schemacontroller1426: 'Constraint not found',
  schemacontroller1428: 'Update FK Error:',
  schemacontroller1434: 'Failed to update foreign key',
  schemacontroller1461: 'This action requires a floating schema',
  schemacontroller1468: 'Unauthorized to edit this schema',
  schemacontroller1479: 'Create FK on {$table->table_name}',
  schemacontroller1485: 'Failed to find table in new version',
  schemacontroller1493: 'New version created and foreign key created',
  schemacontroller1505: 'Foreign key created successfully',
  schemacontroller1511: 'Validation failed',
  schemacontroller1515: 'Table not found',
  schemacontroller1517: 'Create FK Error:',
  schemacontroller1523: 'Failed to create foreign key',

  // app\Http\Controllers\Api\SchemaTranslationController.php
  schematranslationcontroller71: 'Translation already exists for this item and language.',
  schematranslationcontroller102: 'Translation already exists for this item and language.',
  schematranslationcontroller115: 'Translation deleted successfully.',
  schematranslationcontroller144: 'Project not found or access denied',
  schematranslationcontroller188: 'Unknown',
  schematranslationcontroller263: 'Translations updated successfully.',

  // app\Http\Controllers\Api\SettingsController.php
  settingscontroller16: 'Unauthorized. System admin access required.',
  settingscontroller49: 'Settings updated successfully',

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller29: 'Unauthorized',
  templatecontroller92: 'Unauthorized to access this project',
  templatecontroller96: 'Cannot use this template',
  templatecontroller101: 'Template is already used by this project',
  templatecontroller108: 'Template linked successfully',
  templatecontroller129: 'Template name must be lowercase letters',
  templatecontroller141: 'Unauthorized to access this project',
  templatecontroller145: 'Cannot clone this template',
  templatecontroller156: 'Template cloned successfully',
  templatecontroller170: 'Unauthorized',
  templatecontroller245: 'Unauthorized to access this project',
  templatecontroller268: 'Successfully assigned {$assignedCount} template(s) to project',
  templatecontroller288: 'Project not found',
  templatecontroller292: 'Template not found',
  templatecontroller297: 'Unauthorized to access this project',
  templatecontroller307: 'Template is not assigned to this project',
  templatecontroller314: 'Template removed from project successfully',
  templatecontroller333: 'Unauthorized',
  templatecontroller338: 'Template usage removed successfully',
  templatecontroller422: 'Unauthorized',
  templatecontroller437: 'Unauthorized',
  templatecontroller522: 'System templates cannot be deleted',
  templatecontroller524: 'Public templates of other users cannot be deleted',
  templatecontroller526: 'You have no authorization',
  templatecontroller537: 'Template deleted successfully',
  templatecontroller550: 'System templates cannot be permanently deleted',
  templatecontroller552: 'Public templates of other users cannot be permanently deleted',
  templatecontroller554: 'You have no authorization',
  templatecontroller567: 'Template permanently deleted',
  templatecontroller580: 'System templates cannot be activated/deactivated',
  templatecontroller582: 'Public templates of other users cannot be changed',
  templatecontroller584: 'You have no authorization',
  templatecontroller591: 'Template deactivated successfully',
  templatecontroller620: 'You have no authorization',
  templatecontroller649: 'Template successfully cloned',
  templatecontroller682: 'You have no authorization',
  templatecontroller717: 'Failed to load template dependencies',
  templatecontroller731: 'You have no authorization',
  templatecontroller741: 'Validation failed for add DB schema dependency',
  templatecontroller749: 'Validation failed',
  templatecontroller763: 'This dependency already exists',
  templatecontroller777: 'DB Schema dependency added successfully',
  templatecontroller781: 'Failed to add DB schema dependency: ',
  templatecontroller789: 'Failed to add dependency: ',
  templatecontroller803: 'You have no authorization',
  templatecontroller814: 'Dependency not found',
  templatecontroller822: 'DB Schema dependency successfully removed',
  templatecontroller827: 'Failed to remove dependency',
  templatecontroller841: 'Unauthorized',
  templatecontroller856: 'Unauthorized',
  templatecontroller892: 'Unauthorized',
  templatecontroller927: 'Unauthorized',
  templatecontroller936: 'File deleted successfully',
  templatecontroller944: '🧪 [API-TEMPLATE-QUEUE] Starting job dispatch for template {$template->id} ({$template->name})',
  templatecontroller954: '🧪 [API-TEMPLATE-QUEUE] Found project IDs: ',
  templatecontroller957: '🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: No projects using this template yet',
  templatecontroller961: '🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: Dispatching regeneration for ',
  templatecontroller965: '🧪 [API-TEMPLATE-QUEUE] Jobs in queue before dispatch: {$jobsBefore}',
  templatecontroller970: '🧪 [API-TEMPLATE-QUEUE] Dispatching RegenerateProjectGenerationTree job for project {$projectId}',
  templatecontroller975: '🧪 [API-TEMPLATE-QUEUE] Successfully dispatched job for project {$projectId}',
  templatecontroller977: '🧪 [API-TEMPLATE-QUEUE] Failed to dispatch job for project {$projectId}: ',
  templatecontroller983: '🧪 [API-TEMPLATE-QUEUE] Jobs in queue after dispatch: {$jobsAfter}',
  templatecontroller984: '🧪 [API-TEMPLATE-QUEUE] Total dispatched jobs: {$dispatchedJobs}',
  templatecontroller985: '🧪 [API-TEMPLATE-QUEUE] Job dispatch completed for template {$template->id}',

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller30: 'Project ID required',
  translationexportcontroller34: 'At least one language required',
  translationexportcontroller48: 'Translations',
  translationexportcontroller51: 'Field',
  translationexportcontroller78: 'Table',
  translationexportcontroller103: 'Field',
  translationexportcontroller131: 'Y-m-d_H-i-s',
  translationexportcontroller175: 'Import headers:',
  translationexportcontroller197: 'Language columns to import:',
  translationexportcontroller223: 'Existing tables:',
  translationexportcontroller224: 'Existing fields:',
  translationexportcontroller273: 'Skipping item ',
  translationexportcontroller278: 'Processing row {$row}: type={$type}',
  translationexportcontroller312: 'Import successful! {$imported} new translations imported',
  translationexportcontroller331: 'Translation import error:',
  translationexportcontroller339: 'Import failed:',

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller42: 'Template not found',
  ultimatetemplatecontroller55: '🚀 Main processTemplate: templateId=$templateId',
  ultimatetemplatecontroller102: 'Ultimate Template Processing failed',
  ultimatetemplatecontroller151: 'constraints.constraintColumns.field',
  ultimatetemplatecontroller165: 'constraints.constraintColumns.field',
  ultimatetemplatecontroller174: 'Demo Schema',
  ultimatetemplatecontroller177: 'Demo Database Schema',
  ultimatetemplatecontroller196: '🌍 Languages Debug: Found ',
  ultimatetemplatecontroller216: 'Demo Project',
  ultimatetemplatecontroller241: 'Ultimate Scoriet Template Engine',
  ultimatetemplatecontroller270: 'Y-m-d H:i:s',
  ultimatetemplatecontroller271: 'Y-m-d H:i:s',
  ultimatetemplatecontroller272: 'Demo User',
  ultimatetemplatecontroller274: 'Demo Scoriet Project',
  ultimatetemplatecontroller295: 'General',
  ultimatetemplatecontroller300: 'Y-m-d H:i:s',
  ultimatetemplatecontroller301: 'System',
  ultimatetemplatecontroller308: 'd.m.Y',
  ultimatetemplatecontroller309: 'H:i:s',
  ultimatetemplatecontroller311: 'Europe/Vienna',
  ultimatetemplatecontroller359: 'PK not found in constraints for {$tableName}',
  ultimatetemplatecontroller535: 'PK not found in constraints for {$tableName}',
  ultimatetemplatecontroller563: '🐛 Extracted constraint fields for {$tableName}',
  ultimatetemplatecontroller770: 'Y-m-d',
  ultimatetemplatecontroller771: 'H-i-s',
  ultimatetemplatecontroller772: 'Y-m-d_H-i-s',
  ultimatetemplatecontroller804: '🔧 Backend Debug: tableName parameter received: ',
  ultimatetemplatecontroller815: '🔧 Backend Debug: gtree count: ',
  ultimatetemplatecontroller825: '🔧 Backend Debug: Found table at index $index: ',
  ultimatetemplatecontroller833: '🔧 Backend Debug: No tableName parameter provided',
  ultimatetemplatecontroller879: '// Generated files',
  ultimatetemplatecontroller881: '// File: {$file[',

  // app\Http\Controllers\AuthController.php
  authcontroller42: 'This email address is already registered. Would you like to log in?',
  authcontroller44: 'Please enter a valid email address.',
  authcontroller48: 'This username is already taken. Please choose a different one.',
  authcontroller50: 'The username must contain only lowercase letters',
  authcontroller54: 'The passwords do not match.',
  authcontroller56: 'The password must be at least 8 characters long.',
  authcontroller59: 'Please enter your name.',
  authcontroller61: 'Please check your entries.',
  authcontroller83: 'Registration with invitation token',
  authcontroller100: 'Pending invitation found for registration',
  authcontroller124: 'Failed to send admin notification: ',
  authcontroller128: 'User successfully registered. Please check your email for the confirmation link.',
  authcontroller147: 'Validation error',
  authcontroller156: 'Login failed',
  authcontroller165: 'Email address must be confirmed before logging in',
  authcontroller183: 'Personal Access Token',
  authcontroller190: 'Login successful',
  authcontroller209: 'Email address not found',
  authcontroller220: 'Reset link has been sent',
  authcontroller225: 'Error sending reset link',
  authcontroller242: 'Validation error',
  authcontroller260: 'Password successfully reset',
  authcontroller265: 'Error resetting password',
  authcontroller292: 'Validation error',
  authcontroller310: 'Profile successfully updated',
  authcontroller329: 'Validation error',
  authcontroller337: 'The current password is incorrect',
  authcontroller346: 'Password successfully changed',
  authcontroller359: 'Invalid confirmation link. The user does not exist or has been deleted.',
  authcontroller367: 'Invalid confirmation link. The link has expired or has been compromised.',
  authcontroller374: 'Personal Access Token',
  authcontroller378: 'Email address already confirmed',
  authcontroller389: 'Personal Access Token',
  authcontroller401: 'Auto-accepting invitation after email verification',
  authcontroller412: 'Invitation auto-accepted successfully',
  authcontroller418: 'Email address successfully confirmed',
  authcontroller429: 'Email confirmation error',
  authcontroller442: 'Email address already confirmed',
  authcontroller449: 'Confirmation email was sent again',
  authcontroller466: 'Validation error',
  authcontroller474: 'The password entered is incorrect',
  authcontroller488: 'Your account has been successfully deleted',
  authcontroller492: 'Error deleting account',
  authcontroller506: 'Successfully logged out',
  authcontroller521: 'Invalid language selection',
  authcontroller532: 'Language preference updated successfully',
  authcontroller537: 'Failed to update language preference',

  // app\Http\Controllers\Auth\PasswordResetLinkController.php
  passwordresetlinkcontroller39: 'A reset link will be sent if the account exists.',

  // app\Http\Controllers\CustomTokenController.php
  customtokencontroller51: 'The provided credentials are incorrect.',
  customtokencontroller58: 'Email address must be confirmed before logging in',
  customtokencontroller71: 'The provided credentials are incorrect.',
  customtokencontroller98: 'OAuth token error: ',
  customtokencontroller101: 'An error occurred while processing your request.',

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller59: 'latestVersion',
  dbschemacontroller66: 'Access denied to this schema',
  dbschemacontroller77: 'Schema not found',
  dbschemacontroller95: 'Access denied to this schema',
  dbschemacontroller111: 'Schema not found',
  dbschemacontroller129: 'Access denied to this schema',
  dbschemacontroller145: 'You cannot edit this template',
  dbschemacontroller157: 'Template is already linked to this DB schema',
  dbschemacontroller171: 'Template linked to DB schema successfully',
  dbschemacontroller195: 'You cannot edit this template',
  dbschemacontroller207: 'Template unlinked from DB schema successfully',
  dbschemacontroller212: 'Dependency not found',
  dbschemacontroller223: 'latestVersion',
  dbschemacontroller256: 'You can only copy your own schemas',
  dbschemacontroller264: 'Cannot copy an empty schema. The source schema must have at least one version with tables.',
  dbschemacontroller281: 'You already have a schema with this name. Please choose a different name.',
  dbschemacontroller288: ' (Copy)',
  dbschemacontroller305: 'Source schema has no valid versions to copy',
  dbschemacontroller310: 'tables.constraints.foreignKeyReference.referenceColumns',
  dbschemacontroller317: 'Copied from ',
  dbschemacontroller332: 'New schema ID is not set',
  dbschemacontroller335: 'New version ID is not set',
  dbschemacontroller460: 'Database schema copied successfully',
  dbschemacontroller472: 'Failed to copy schema: ',

  // app\Http\Controllers\PageController.php
  pagecontroller43: 'Help page not found for locale: {$locale}',
  pagecontroller46: 'CMSPage',
  pagecontroller67: 'Impressum page not found for locale: {$locale}',
  pagecontroller70: 'CMSPage',

  // app\Http\Controllers\ProjectApplicationController.php
  projectapplicationcontroller24: 'Validation error',
  projectapplicationcontroller36: 'Invalid join code or applications not allowed',
  projectapplicationcontroller49: 'You have already submitted an application for this project',
  projectapplicationcontroller64: 'Application successfully submitted',
  projectapplicationcontroller85: 'No authorization',
  projectapplicationcontroller106: '=== ReviewApplication METHOD CALLED ===',
  projectapplicationcontroller118: 'ReviewApplication: Validation failed',
  projectapplicationcontroller120: 'Validation error',
  projectapplicationcontroller130: 'applicationId',
  projectapplicationcontroller131: 'Application not found',
  projectapplicationcontroller137: 'ReviewApplication Debug',
  projectapplicationcontroller153: 'ReviewApplication: Permission denied',
  projectapplicationcontroller158: 'No permission - You are not the project owner',
  projectapplicationcontroller164: 'ReviewApplication: Already reviewed',
  projectapplicationcontroller166: 'This application has already been processed',
  projectapplicationcontroller173: 'Application was accepted',
  projectapplicationcontroller176: 'Application was rejected',
  projectapplicationcontroller179: 'ReviewApplication: Success',
  projectapplicationcontroller210: 'ProjectApplicationController: getProjectByJoinCode called',
  projectapplicationcontroller211: 'joinCode',
  projectapplicationcontroller220: 'ProjectApplicationController: Project lookup result',
  projectapplicationcontroller221: 'joinCode',
  projectapplicationcontroller231: 'Invalid join code. Please check the code.',
  projectapplicationcontroller237: 'This project is no longer active.',
  projectapplicationcontroller243: 'This project is not currently accepting membership requests.',

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller26: 'Unauthorized',
  projectinvitationcontroller37: 'Validation failed',
  projectinvitationcontroller50: 'User is already a member of this project',
  projectinvitationcontroller61: 'An invitation has already been sent to this email address',
  projectinvitationcontroller80: 'Failed to send project invitation email',
  projectinvitationcontroller88: 'Invitation sent successfully',
  projectinvitationcontroller89: 'invitedUser',
  projectinvitationcontroller103: 'Invalid invitation token',
  projectinvitationcontroller107: 'This invitation has expired',
  projectinvitationcontroller112: 'This invitation has already been accepted',
  projectinvitationcontroller113: 'This invitation has already been declined',
  projectinvitationcontroller114: 'This invitation has expired',
  projectinvitationcontroller115: 'This invitation is no longer valid',
  projectinvitationcontroller138: 'Invalid invitation token',
  projectinvitationcontroller143: 'Invitation is no longer valid',
  projectinvitationcontroller150: 'Failed to accept invitation',
  projectinvitationcontroller154: 'Invitation accepted successfully',
  projectinvitationcontroller167: 'Invalid invitation token',
  projectinvitationcontroller172: 'Invitation is no longer valid',
  projectinvitationcontroller179: 'Failed to decline invitation',
  projectinvitationcontroller187: 'Failed to send decline notification email',
  projectinvitationcontroller194: 'Invitation declined successfully',
  projectinvitationcontroller206: 'Unauthorized',
  projectinvitationcontroller210: 'invitedUser',
  projectinvitationcontroller240: '=== Cancel Invitation Request ===',
  projectinvitationcontroller250: 'Cancel invitation: Unauthorized',
  projectinvitationcontroller254: 'Unauthorized',
  projectinvitationcontroller258: 'Cancel invitation: Wrong project',
  projectinvitationcontroller262: 'Invitation does not belong to this project',
  projectinvitationcontroller266: 'Cancel invitation: Not pending',
  projectinvitationcontroller269: 'Can only cancel pending invitations',
  projectinvitationcontroller273: 'Invitation cancelled successfully',
  projectinvitationcontroller275: 'Invitation cancelled successfully',
  projectinvitationcontroller286: 'No pending invitation',
  projectinvitationcontroller296: 'No pending invitation',
  projectinvitationcontroller310: 'No pending invitation',
  projectinvitationcontroller316: 'No pending invitation',
  projectinvitationcontroller323: 'Failed to accept invitation',
  projectinvitationcontroller330: 'Invitation accepted successfully',
  projectinvitationcontroller343: 'No pending invitation',
  projectinvitationcontroller349: 'No pending invitation',
  projectinvitationcontroller358: 'Invitation declined',

  // app\Http\Controllers\QueueTestController.php
  queuetestcontroller61: '🧪 [TEST] Starting job dispatch test',
  queuetestcontroller65: 'No project found',
  queuetestcontroller69: '🧪 [TEST] Jobs before dispatch: {$jobsBefore}',
  queuetestcontroller77: '🧪 [TEST] Jobs after dispatch: {$jobsAfter}',
  queuetestcontroller86: 'Job dispatch failed',
  queuetestcontroller89: '🧪 [TEST] Job dispatch failed: ',
  queuetestcontroller102: '🧪 [TEST] Starting schema version creation test',
  queuetestcontroller106: 'No schema found',
  queuetestcontroller116: 'Schema is not connected to any projects',
  queuetestcontroller117: 'Connect the schema to a project first using project_schemas table',
  queuetestcontroller122: '🧪 [TEST] Jobs before schema version creation: {$jobsBefore}',
  queuetestcontroller126: 'Test version for queue testing',
  queuetestcontroller127: '🧪 [TEST] Created schema version: {$version->id}',
  queuetestcontroller130: '🧪 [TEST] Jobs after schema version creation: {$jobsAfter}',
  queuetestcontroller142: 'No jobs dispatched',
  queuetestcontroller145: '🧪 [TEST] Schema version creation failed: ',
  queuetestcontroller162: 'Project not found',
  queuetestcontroller173: '🧪 [MANUAL] Manually dispatched job for project {$projectId}',
  queuetestcontroller181: 'Job manually dispatched successfully',
  queuetestcontroller201: 'Log file not found',
  queuetestcontroller211: '🧪 [QUEUE-TEST]',
  queuetestcontroller212: '🧪 [TEST]',
  queuetestcontroller213: '🧪 [MANUAL]',

  // app\Http\Controllers\SchemaController.php
  schemacontroller21: 'templateDependencies.template',
  schemacontroller64: 'templateDependencies.template',
  schemacontroller71: 'Access denied to this schema',
  schemacontroller82: 'Schema not found',
  schemacontroller105: 'You need a premium account to create private schemas',
  schemacontroller117: 'You already have a schema with this name',
  schemacontroller132: 'Schema created successfully',
  schemacontroller155: 'You can only edit your own schemas',
  schemacontroller169: 'You need a premium account to make schemas private',
  schemacontroller183: 'You already have a schema with this name',
  schemacontroller193: 'Schema updated successfully',
  schemacontroller216: 'You can only delete your own schemas',
  schemacontroller225: 'Cannot delete schema. It is being used by {$dependentTemplates} template(s)',
  schemacontroller234: 'Schema deleted successfully',
  schemacontroller256: 'Access denied to this schema',
  schemacontroller272: 'Schema not found',
  schemacontroller290: 'Access denied to this schema',
  schemacontroller306: 'You cannot edit this template',
  schemacontroller318: 'Template is already linked to this schema',
  schemacontroller332: 'Template linked to schema successfully',
  schemacontroller356: 'You cannot edit this template',
  schemacontroller368: 'Template unlinked from schema successfully',
  schemacontroller373: 'Dependency not found',
  schemacontroller384: 'templateDependencies.template',

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller31: 'Access denied to this schema',
  schemaexportcontroller56: 'No version found for this schema',
  schemaexportcontroller66: 'constraints.constraintColumns.field',
  schemaexportcontroller67: 'constraints.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller125: 'Export failed: ',
  schemaexportcontroller144: 'Access denied to this schema',
  schemaexportcontroller169: 'No version found for this schema',
  schemaexportcontroller178: 'constraints.constraintColumns.field',
  schemaexportcontroller179: 'constraints.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller193: 'No tables found in this schema',
  schemaexportcontroller213: 'MySQL export failed: ',
  schemaexportcontroller224: '-- MySQL Database Export',
  schemaexportcontroller225: '-- Schema: ',
  schemaexportcontroller226: 'No description',
  schemaexportcontroller227: '-- Version: ',
  schemaexportcontroller228: '-- Generated: ',
  schemaexportcontroller229: '-- Table count: ',
  schemaexportcontroller237: '-- Table: ',
  schemaexportcontroller239: '-- Comment: ',
  schemaexportcontroller272: ' COMMENT',
  schemaexportcontroller283: 'Processing constraints for table: {$table->table_name}',
  schemaexportcontroller284: 'Constraint count: ',
  schemaexportcontroller286: 'Constraint: {$constraint->constraint_name} (type: {$constraint->constraint_type})',
  schemaexportcontroller287: 'ConstraintColumns count: ',
  schemaexportcontroller293: 'PRIMARY',
  schemaexportcontroller339: ' ON DELETE ',
  schemaexportcontroller358: ' COMMENT',
  schemaexportcontroller367: '-- Export completed successfully',
  schemaexportcontroller368: '-- Total tables exported: ',
  schemaexportcontroller386: 'Access denied to this schema',
  schemaexportcontroller402: 'Failed to get table count: ',
  schemaexportcontroller418: 'Schema not found',
  schemaexportcontroller437: 'No version found for this schema',
  schemaexportcontroller447: 'constraints.constraintColumns.field',
  schemaexportcontroller448: 'constraints.foreignKeyReference.referenceColumns.referencedField',
  schemaexportcontroller471: 'Schema relationship investigation - DEEP DIVE',
  schemaexportcontroller483: 'Schema → schema_versions → schema_tables (via schema_version_id)',
  schemaexportcontroller484: 'NULL (not used in this system)',
  schemaexportcontroller489: 'Debug failed: ',

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: 'SQL script is required',
  sqlparsercontroller72: 'SQL script is required',
  sqlparsercontroller79: 'Schema ID is required',
  sqlparsercontroller89: 'Schema not found',
  sqlparsercontroller98: 'You do not have permission to edit this schema',
  sqlparsercontroller151: 'SQL Import failed',
  sqlparsercontroller165: 'Syntax Error',
  sqlparsercontroller166: 'Please check your SQL syntax for missing semicolons',
  sqlparsercontroller171: 'Unsupported Feature',
  sqlparsercontroller172: 'This SQL feature is not yet supported by our parser. Please try simplifying your SQL.',
  sqlparsercontroller177: 'Table/Column Error',
  sqlparsercontroller178: 'Please check table and column definitions for correct syntax.',
  sqlparsercontroller182: 'Parsing Error',
  sqlparsercontroller183: 'Please check your SQL for common issues like missing semicolons',
  sqlparsercontroller236: '🐛 Breaking change debug',
  sqlparsercontroller262: '🐛 After system table filtering',
  sqlparsercontroller277: '🐛 Error message debug',
  sqlparsercontroller278: 'businessExistingTables',
  sqlparsercontroller279: 'businessNewTables',
  sqlparsercontroller280: 'existingBusinessCount',
  sqlparsercontroller281: 'newBusinessCount',
  sqlparsercontroller282: 'businessExistingTables_type',
  sqlparsercontroller283: 'businessNewTables_type',
  sqlparsercontroller294: '🛡️ BREAKING CHANGE DETECTED: This SQL import would create a completely new database structure with no table overlap.',
  sqlparsercontroller295: 'Current version has {$existingBusinessCount} business tables: {$existingTablesList}',
  sqlparsercontroller296: 'New import has {$newBusinessCount} business tables: {$newTablesList}',
  sqlparsercontroller297: '🚨 For data safety',
  sqlparsercontroller298: '✅ Solution: Create a new database/schema for this structure instead of versioning the existing one.',
  sqlparsercontroller299: '✅ Alternative: Ensure at least one business table name matches between versions.',
  sqlparsercontroller303: '✅ Breaking change validation passed',
  sqlparsercontroller320: 'Schema version not found',
  sqlparsercontroller361: 'Schema version not found',
  sqlparsercontroller395: 'SQL script is required',
  sqlparsercontroller405: 'SQL parsed successfully',
  sqlparsercontroller430: '🧪 [QUEUE-TEST] Starting job dispatch for schema {$schema->id} ({$schema->name})',
  sqlparsercontroller439: '🧪 [QUEUE-TEST] Found project IDs: ',
  sqlparsercontroller442: '🧪 [QUEUE-TEST] Schema {$schema->id}: No projects affected for queue regeneration',
  sqlparsercontroller446: '🧪 [QUEUE-TEST] Schema {$schema->id}: Dispatching regeneration for ',
  sqlparsercontroller450: '🧪 [QUEUE-TEST] Jobs in queue before dispatch: {$jobsBefore}',
  sqlparsercontroller455: '🧪 [QUEUE-TEST] Dispatching RegenerateProjectGenerationTree job for project {$projectId}',
  sqlparsercontroller460: '🧪 [QUEUE-TEST] Successfully dispatched job for project {$projectId}',
  sqlparsercontroller462: '🧪 [QUEUE-TEST] Failed to dispatch job for project {$projectId}: ',
  sqlparsercontroller468: '🧪 [QUEUE-TEST] Jobs in queue after dispatch: {$jobsAfter}',
  sqlparsercontroller469: '🧪 [QUEUE-TEST] Total dispatched jobs: {$dispatchedJobs}',
  sqlparsercontroller470: '🧪 [QUEUE-TEST] Job dispatch completed for schema {$schema->id}',

  // app\Http\Controllers\TeamController.php
  teamcontroller88: 'Validation failed',
  teamcontroller117: 'Team created successfully',
  teamcontroller131: 'Unauthorized',
  teamcontroller149: 'Insufficient permissions',
  teamcontroller169: 'Validation failed',
  teamcontroller191: 'Team updated successfully',
  teamcontroller205: 'Only team owner can delete the team',
  teamcontroller210: 'Team deleted successfully',
  teamcontroller223: 'Insufficient permissions',
  teamcontroller231: 'Member not found',
  teamcontroller236: 'Cannot remove team owner',
  teamcontroller241: 'Member removed successfully',
  teamcontroller254: 'Insufficient permissions',
  teamcontroller263: 'Validation failed',
  teamcontroller273: 'Member not found',
  teamcontroller278: 'Cannot change owner role',
  teamcontroller284: 'Member role updated successfully',
  teamcontroller298: 'Unauthorized',
  teamcontroller308: 'Validation failed',
  teamcontroller317: 'User is already a member of this team',
  teamcontroller330: 'Member added to team successfully',
  teamcontroller344: 'Unauthorized',

  // app\Http\Controllers\TeamInvitationController.php
  teaminvitationcontroller26: 'Insufficient permissions',
  teaminvitationcontroller38: 'Validation failed',
  teaminvitationcontroller46: 'User is already a team member',
  teaminvitationcontroller56: 'User already has a pending invitation',
  teaminvitationcontroller70: 'Invitation sent successfully',
  teaminvitationcontroller106: 'Insufficient permissions',
  teaminvitationcontroller124: 'Invalid invitation token',
  teaminvitationcontroller132: 'This invitation is not for you',
  teaminvitationcontroller137: 'Invitation has expired',
  teaminvitationcontroller139: 'Unable to accept invitation',
  teaminvitationcontroller143: 'Invitation accepted successfully',
  teaminvitationcontroller156: 'Invalid invitation token',
  teaminvitationcontroller164: 'This invitation is not for you',
  teaminvitationcontroller168: 'Unable to decline invitation',
  teaminvitationcontroller171: 'Invitation declined',
  teaminvitationcontroller184: 'Insufficient permissions',
  teaminvitationcontroller188: 'Can only cancel pending invitations',
  teaminvitationcontroller193: 'Invitation cancelled',
  teaminvitationcontroller206: 'Insufficient permissions',
  teaminvitationcontroller210: 'Can only resend pending or expired invitations',
  teaminvitationcontroller222: 'Invitation resent successfully',

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: 'All',
  templatecontroller98: 'Template not found',
  templatecontroller140: 'templates/{$template->id}/{$fileData[',
  templatecontroller154: 'Template created successfully',
  templatecontroller222: 'Template updated successfully',
  templatecontroller243: 'Template deleted successfully',
  templatecontroller306: 'Template assignment is currently simulated - database integration pending',
  templatecontroller328: 'Template removal simulated successfully',
  templatecontroller329: 'Template removal is currently simulated - database integration pending',
  templatecontroller334: 'Simulated removal failed',
  templatecontroller369: 'Scoriet Template Manager',
  templatecontroller382: 'Template not found',
  templatecontroller420: 'Template with this name already exists. Set overwrite_existing to true to replace it.',
  templatecontroller445: 'templates/{$template->id}/{$fileData[',
  templatecontroller455: 'Template successfully imported',
  templatecontroller481: 'Template not found',
  templatecontroller493: 'Add DB Schema Dependency Request',
  templatecontroller509: 'You cannot add dependencies to this template',
  templatecontroller523: 'Validation passed',
  templatecontroller525: 'Validation failed',
  templatecontroller533: 'Found schema',
  templatecontroller538: 'Schema access denied',
  templatecontroller544: 'Access denied to this DB schema',
  templatecontroller553: 'Dependency check',
  templatecontroller558: 'Dependency already exists',
  templatecontroller561: 'Template already depends on this DB schema',
  templatecontroller565: 'Creating dependency',
  templatecontroller579: 'Dependency created successfully',
  templatecontroller585: 'DB schema dependency added successfully',
  templatecontroller587: 'Exception in addDbSchemaDependency',
  templatecontroller616: 'You cannot remove dependencies from this template',
  templatecontroller628: 'DB schema dependency removed successfully',
  templatecontroller633: 'Dependency not found',
  templatecontroller654: 'You cannot update dependencies for this template',
  templatecontroller672: 'DB schema dependency updated successfully',
  templatecontroller677: 'Dependency not found',
  templatecontroller695: 'Access denied to this DB schema',
  templatecontroller713: 'DB schema not found',
  templatecontroller723: '🧪 [TEMPLATE-QUEUE] Starting job dispatch for template {$template->id} ({$template->name})',
  templatecontroller733: '🧪 [TEMPLATE-QUEUE] Found project IDs: ',
  templatecontroller736: '🧪 [TEMPLATE-QUEUE] Template {$template->id}: No projects using this template yet',
  templatecontroller740: '🧪 [TEMPLATE-QUEUE] Template {$template->id}: Dispatching regeneration for ',
  templatecontroller744: '🧪 [TEMPLATE-QUEUE] Jobs in queue before dispatch: {$jobsBefore}',
  templatecontroller750: '🧪 [TEMPLATE-QUEUE] Dispatching RegenerateProjectGenerationTree job for project {$projectId}',
  templatecontroller754: '🧪 [TEMPLATE-QUEUE] Successfully dispatched job for project {$projectId}',
  templatecontroller756: '🧪 [TEMPLATE-QUEUE] Failed to dispatch job for project {$projectId}: ',
  templatecontroller762: '🧪 [TEMPLATE-QUEUE] Jobs in queue after dispatch: {$jobsAfter}',
  templatecontroller764: '🧪 [TEMPLATE-QUEUE] Total dispatched jobs: {$dispatchedJobs}',
  templatecontroller765: '🧪 [TEMPLATE-QUEUE] Job dispatch completed for template {$template->id}',

  // app\Http\Controllers\UserController.php
  usercontroller25: 'User not authenticated.',
  usercontroller36: 'Login timestamp successfully updated.',

  // app\Http\Middleware\CheckSystemUser.php
  checksystemuser25: 'Access denied. System or Admin privileges required.',

  // app\Http\Middleware\EnsureUserIsAdmin.php
  ensureuserisadmin32: 'Admin Middleware Check',
  ensureuserisadmin42: 'Admin access denied: User not authenticated',
  ensureuserisadmin47: 'Unauthenticated. Please login first.',
  ensureuserisadmin52: 'Please log in',
  ensureuserisadmin58: 'Admin check result',
  ensureuserisadmin64: 'Admin access denied: User is not admin/system',
  ensureuserisadmin72: 'Forbidden. Administrator access required.',
  ensureuserisadmin77: 'Access denied. Only system administrators have access to this area.',
  ensureuserisadmin80: 'Admin access granted',

  // app\JobsegenerateProjectGenerationTree.php
  jobsegenerateprojectgenerationtree36: 'Project {$this->projectId} not found for generation tree regeneration',
  jobsegenerateprojectgenerationtree40: 'Regenerating generation tree for project: {$project->name} (ID: {$project->id})',
  jobsegenerateprojectgenerationtree45: 'Successfully regenerated generation tree for project {$project->id}. Total items: ',
  jobsegenerateprojectgenerationtree48: 'Failed to regenerate generation tree for project {$this->projectId}: ',

  // app\Jobs\RegenerateProjectGenerationTree.php
  regenerateprojectgenerationtree36: 'Project {$this->projectId} not found for generation tree regeneration',
  regenerateprojectgenerationtree40: 'Regenerating generation tree for project: {$project->name} (ID: {$project->id})',
  regenerateprojectgenerationtree45: 'Successfully regenerated generation tree for project {$project->id}. Total items: ',
  regenerateprojectgenerationtree48: 'Failed to regenerate generation tree for project {$this->projectId}: ',

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: 'You',

  // app\Models\FloatingSchema.php
  floatingschema180: ' (Clone)',

  // app\Models\ProjectApplication.php
  projectapplication96: 'Added via application approval',

  // app\Models\Project.php
  project430: 'No authenticated user to send invitation',

  // app\Models\SchemaVersion.php
  schemaversion50: 'Version {$nextVersion}',
  schemaversion81: '🔍 createNewVersionWithCopy start',
  schemaversion93: '✅ New empty version created',
  schemaversion101: '❌ Source version not found',
  schemaversion102: 'Source version {$fromVersionNumber} not found',
  schemaversion105: '✅ Source version found',
  schemaversion111: '🚀 Phase 1: Copying tables',
  schemaversion115: '📋 Copying table',
  schemaversion127: '✅ Table created',
  schemaversion134: '📝 Copying fields',
  schemaversion138: '🔤 Copying field',
  schemaversion156: '✅ Field copied successfully',
  schemaversion158: '❌ Failed to copy field',
  schemaversion168: '🔗 Phase 1: Copying non-FK constraints',
  schemaversion172: '🔒 Copying constraint',
  schemaversion182: '✅ Constraint created',
  schemaversion210: '🚨 Foreign Key SKIPPED - Referenced table not found',
  schemaversion238: '❌ Failed to copy constraint',
  schemaversion248: '🚀 Phase 2: Processing foreign key constraints',
  schemaversion254: '🔑 Processing FK constraints for table',
  schemaversion261: '🔒 Phase 2: Creating FK constraint',
  schemaversion273: '✅ FK Constraint created',
  schemaversion310: '✅ FK Reference created successfully',
  schemaversion312: '❌ Phase 2: Referenced table still not found',
  schemaversion319: '❌ Failed to copy FK constraint in Phase 2',
  schemaversion330: '📐 Copying layout data',
  schemaversion338: '📐 Found layout to copy',
  schemaversion351: '📐 Layout copied successfully',
  schemaversion353: '📐 No layout found to copy from version',
  schemaversion356: '❌ Failed to copy layout',
  schemaversion365: '🎉 createNewVersionWithCopy completed successfully',
  schemaversion381: 'j.n.Y',

  // app\Notifications\NewUserRegistered.php
  newuserregistered40: 'd.m.Y H:i:s',
  newuserregistered43: '?? New registration on Scoriet',
  newuserregistered44: 'Hello Admin!',
  newuserregistered45: 'A new user has registered on Scoriet:',
  newuserregistered47: '**User information:**',
  newuserregistered48: 'â€¢ **Name:** ',
  newuserregistered49: 'â€¢ **Username:** ',
  newuserregistered50: 'â€¢ **E-Mail:** ',
  newuserregistered51: 'â€¢ **User-ID:** ',
  newuserregistered52: '• **Registered on:**',
  newuserregistered54: '**E-Mail Status:** ',
  newuserregistered56: 'Show users in admin panel',
  newuserregistered57: 'This email was generated automatically.',
  newuserregistered58: 'Best regards from the Scoriet system',

  // app\Observers\ProjectGenerationTreeObserver.php
  projectgenerationtreeobserver17: '🌳 [GENERATION-TREE-OBSERVER] tree_data updated for project {$generationTree->project_id}',
  projectgenerationtreeobserver30: '🌳 [GENERATION-TREE-OBSERVER] saved event for project {$generationTree->project_id}',
  projectgenerationtreeobserver44: '🌳 [GENERATION-TREE-OBSERVER] Broadcasting update for project {$generationTree->project_id}',
  projectgenerationtreeobserver60: '🌳 [GENERATION-TREE-OBSERVER] Failed to broadcast tree update: ',

  // app\Observers\ProjectObserver.php
  projectobserver18: 'Project {$project->id} languages updated: Dispatching regeneration',

  // app\Observers\ProjectSchemaObserver.php
  projectschemaobserver23: '🔔 [PROJECT-SCHEMA-OBSERVER] Schema assigned to Project',
  projectschemaobserver33: '✅ [PROJECT-SCHEMA-OBSERVER] Generation Tree Job dispatched',
  projectschemaobserver37: '❌ [PROJECT-SCHEMA-OBSERVER] Failed to dispatch job',
  projectschemaobserver51: '🔔 [PROJECT-SCHEMA-OBSERVER] Schema removed from Project',
  projectschemaobserver61: '✅ [PROJECT-SCHEMA-OBSERVER] Generation Tree Job dispatched',
  projectschemaobserver65: '❌ [PROJECT-SCHEMA-OBSERVER] Failed to dispatch job',

  // app\Observers\ProjectTemplateUsageObserver.php
  projecttemplateusageobserver16: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] created event triggered for usage {$projectTemplateUsage->id} (project: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver27: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] is_active changed for usage {$projectTemplateUsage->id} (project: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver37: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] deleted event triggered for usage {$projectTemplateUsage->id} (project: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver48: 'ProjectTemplateUsage {$projectTemplateUsage->id} ({$action}): Dispatching regeneration for project {$projectId}',
  projecttemplateusageobserver52: 'Successfully dispatched regeneration job for project {$projectId}',
  projecttemplateusageobserver54: 'Failed to dispatch regeneration job for project {$projectId}: ',

  // app\Observers\SchemaTableObserver.php
  schematableobserver17: '📋 [SCHEMA-TABLE-OBSERVER] created event triggered for table {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver26: '📋 [SCHEMA-TABLE-OBSERVER] updated event triggered for table {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver35: '📋 [SCHEMA-TABLE-OBSERVER] deleted event triggered for table {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver52: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): No active projects found',
  schematableobserver56: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Dispatching regeneration for ALL ',
  schematableobserver66: '📋 [SCHEMA-TABLE-OBSERVER] Running regeneration job synchronously for project {$projectId}',
  schematableobserver72: 'Successfully dispatched regeneration job for project {$projectId}',
  schematableobserver75: 'Failed to dispatch/run regeneration job for project {$projectId}: ',

  // app\Observers\SchemaVersionObserver.php
  schemaversionobserver17: 'SchemaVersionObserver: created event triggered for schema version {$schemaVersion->id}',
  schemaversionobserver50: 'SchemaVersion {$schemaVersion->id} ({$action}): No active projects found',
  schemaversionobserver54: 'SchemaVersion {$schemaVersion->id} ({$action}): Dispatching regeneration for ALL ',
  schemaversionobserver64: 'SchemaVersion {$schemaVersion->id} ({$action}): Running regeneration job synchronously for project {$projectId}',
  schemaversionobserver70: 'Successfully dispatched regeneration job for project {$projectId}',
  schemaversionobserver73: 'Failed to dispatch/run regeneration job for project {$projectId}: ',

  // app\Observers\TemplateFileObserver.php
  templatefileobserver17: '📄 [TEMPLATE-FILE-OBSERVER] created event triggered for file {$templateFile->id} (template: {$templateFile->template_id})',
  templatefileobserver26: '📄 [TEMPLATE-FILE-OBSERVER] updated event triggered for file {$templateFile->id} (template: {$templateFile->template_id})',
  templatefileobserver35: '📄 [TEMPLATE-FILE-OBSERVER] deleted event triggered for file {$templateFile->id} (template: {$templateFile->template_id})',
  templatefileobserver53: 'TemplateFile {$templateFile->id} ({$action}): No projects affected',
  templatefileobserver57: 'TemplateFile {$templateFile->id} ({$action}): Dispatching regeneration for ',
  templatefileobserver63: 'Successfully dispatched regeneration job for project {$projectId}',
  templatefileobserver65: 'Failed to dispatch regeneration job for project {$projectId}: ',

  // app\Observers\TemplateObserver.php
  templateobserver17: '🧪 [TEMPLATE-OBSERVER] created event triggered for template {$template->id} ({$template->name})',
  templateobserver53: 'Template {$template->id} was force deleted',
  templateobserver70: 'Template {$template->id} ({$action}): No projects affected',
  templateobserver74: 'Template {$template->id} ({$action}): Dispatching regeneration for ',

  // appotificationsewUserRegistered.php
  appotificationsewuserregistered40: 'd.m.Y H:i:s',
  appotificationsewuserregistered43: '🎉 New registration on Scoriet',
  appotificationsewuserregistered44: 'Hallo Admin!',
  appotificationsewuserregistered45: 'A new user has registered on Scoriet:',
  appotificationsewuserregistered47: '**User information:**',
  appotificationsewuserregistered48: '• **Name:** ',
  appotificationsewuserregistered49: 'Not specified',
  appotificationsewuserregistered50: '• **E-Mail:** ',
  appotificationsewuserregistered51: '• **User-ID:** ',
  appotificationsewuserregistered52: '• **Registered on:**',
  appotificationsewuserregistered54: '⏳ Not yet confirmed',
  appotificationsewuserregistered56: 'Show users in admin panel',
  appotificationsewuserregistered57: 'This email was generated automatically.',
  appotificationsewuserregistered58: 'Best regards from the Scoriet system',

  // app\Services\MySQLParser.php
  mysqlparser18: 'Parsing error:',

  // app\Services\ProjectFileTreeGenerator.php
  projectfiletreegenerator120: '🧪 [TREE-GEN] Loaded tables from ALL schemas: ',
  projectfiletreegenerator193: 'Y-m-d',
  projectfiletreegenerator194: 'H-i-s',
  projectfiletreegenerator195: 'Y-m-d_H-i-s',
  projectfiletreegenerator226: '🧪 [TREE-GEN] Resolved path is empty for TemplateFile ID {$templateFile->id}',
  projectfiletreegenerator263: 'Y-m-d',
  projectfiletreegenerator264: 'H-i-s',
  projectfiletreegenerator265: 'Y-m-d_H-i-s',
  projectfiletreegenerator296: '🧪 [TREE-GEN] Resolved path is empty for TemplateFile ID {$templateFile->id}',
  projectfiletreegenerator331: 'Y-m-d',
  projectfiletreegenerator332: 'H-i-s',
  projectfiletreegenerator333: 'Y-m-d_H-i-s',
  projectfiletreegenerator364: '🧪 [TREE-GEN] Resolved path is empty for TemplateFile ID {$templateFile->id}',
  projectfiletreegenerator498: 'de_DE',
  projectfiletreegenerator500: 'fr_FR',
  projectfiletreegenerator502: 'it_IT',
  projectfiletreegenerator504: 'nl_NL',
  projectfiletreegenerator505: 'pl_PL',
  projectfiletreegenerator506: 'ru_RU',
  projectfiletreegenerator507: 'ja_JP',
  projectfiletreegenerator508: 'zh_CN',

  // app\Services\SchemaStorageService.php
  schemastorageservice226: 'Referenced table ',
  schemastorageservice394: '🔧 File key migrated',
  schemastorageservice413: '🔧 File name renamed migrated',
  schemastorageservice427: '🔧 File name short migrated',
  schemastorageservice436: '🔧 File name short auto-generated',

  // app\Services\SimpleFixedTemplateEngine.php
  simplefixedtemplateengine661: '✅ {filename} is correctly replaced with accounting_log',
  simplefixedtemplateengine662: '✅ No more ghosts in JavaScript',
  simplefixedtemplateengine663: '✅ Template constructs on their own lines',
  simplefixedtemplateengine664: '✅ Clean loop structures',
  simplefixedtemplateengine665: '✅ No regex - only string operations',

  // app\Services\SimpleTemplateEngine.php
  simpletemplateengine128: 'Unknown',
  simpletemplateengine129: 'Unknown',
  simpletemplateengine130: 'Unknown',
  simpletemplateengine153: 'Unknown',
  simpletemplateengine154: 'Unknown',

  // app\Services\SQLParser.php
  sqlparser71: 'SQL Syntax Error: Expected token ',
  sqlparser75: 'SQL Syntax Error: Expected ',
  sqlparser83: 'SQL Syntax Error: Unexpected end of SQL script{$context}. Missing semicolon or incomplete statement?',
  sqlparser96: ' at end of SQL',
  sqlparser130: ' (SQL line: {$currentLine}',
  sqlparser152: 'Expected table name',
  sqlparser237: 'Expected field name',
  sqlparser466: 'Expected table name',

  // app\Services\StepByStepTemplateEngine.php
  stepbysteptemplateengine392: 'Template constructs are split into individual lines',
  stepbysteptemplateengine394: '{for} and {if} are treated as separate blocks',
  stepbysteptemplateengine395: 'more in JavaScript',
  stepbysteptemplateengine396: 'Cleaner',

  // app\Services\UltimateTemplateEngine.php
  ultimatetemplateengine195: 'Maximum loop depth exceeded',
  ultimatetemplateengine656: '  // Unknown inline loop format: {$matchText}',
  ultimatetemplateengine968: '// Built-in Template Functions',

  // resources/js\app.tsx
  app48: 'EUR',
  app59: 'EUR',

  // resources/js\Components\AuthModals\AuthModalManager.tsx
  authmodalmanager3: './RegisterModal',
  authmodalmanager5: './ProfileModal',
  authmodalmanager7: './PlanModal',

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: 'Passwords do not match',
  authmodalsegistermodal84: 'Registration failed. Please try again.',
  authmodalsegistermodal94: 'Registration successful! Please check your email for a verification link before logging in.',
  authmodalsegistermodal109: 'An error occurred',
  authmodalsegistermodal203: 'Register',
  authmodalsegistermodal239: 'Your full name',
  authmodalsegistermodal293: 'Your password',
  authmodalsegistermodal312: 'Repeat password',
  authmodalsegistermodal335: 'Select Language',
  authmodalsegistermodal351: 'Select Language',
  authmodalsegistermodal366: 'Select Language',
  authmodalsegistermodal379: 'Register',
  authmodalsegistermodal388: 'Already have an account? Login',

  // resources/js\Components\AuthModalsesetPasswordModal.tsx
  authmodalsesetpasswordmodal73: 'This reset link is invalid or expired.',
  authmodalsesetpasswordmodal79: 'Error validating reset link.',
  authmodalsesetpasswordmodal122: 'Password error: ',
  authmodalsesetpasswordmodal124: 'Token error: ',
  authmodalsesetpasswordmodal127: 'An unknown error occurred. Please try again.',
  authmodalsesetpasswordmodal131: 'Network error - please try again later.',
  authmodalsesetpasswordmodal162: 'Close',
  authmodalsesetpasswordmodal265: 'Enter new password',
  authmodalsesetpasswordmodal287: 'Repeat password',
  authmodalsesetpasswordmodal319: 'Reset Password',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: 'Error sending email',
  forgotpasswordmodal46: 'A password reset link has been sent to your email address.',
  forgotpasswordmodal50: 'An error occurred',
  forgotpasswordmodal73: 'Forgot Password',

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal83: 'Enter your email address and we will send you a link to reset your password.',
  forgotpasswordmodal105: 'E-Mail',
  forgotpasswordmodal113: 'your.email@example.com',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: 'Reset-Link senden',
  forgotpasswordmodal131: 'Back to Login',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginPasswordHint: 'Your Password',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal46: 'languageChanged',
  loginmodal49: 'languageChanged',
  loginmodal88: 'Email address must be confirmed. Please check your emails.',
  loginmodal93: 'Login failed',
  loginmodal136: 'An error occurred',
  loginmodal139: 'Login failed',
  loginmodal140: 'Email/username or password is incorrect.',
  loginmodal142: 'Email address must be confirmed.',
  loginmodal184: 'Confirmation email has been sent again!',
  loginmodal189: 'Error sending email. Please try again later.',
  loginmodal212: 'Login',

  // resources/js/Components/AuthModals/LoginModal.tsx
  loginmodal241: 'Your email address has not yet been confirmed.',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal246: 'Resend confirmation email',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginDemoTextHeader: 'Demo mode available',
  LoginDemoDescription: 'Test Scoriet without registration with ready-made demo data:',
  LoginDemoAdmin: '- Full access, 2 teams, 3 projects',
  LoginDemoUser: '- Team member, assigned 1 project',
  LoginToolTip: 'Click cards above for instant demo or enter demo username manually (leave password empty) - Demo restarts every 20 minutes',
  LoginEmailOrUserName: 'E-Mail or Username',
  LoginEmailOrUserNameHint: 'demo-admin or demo-user',
  LoginPassword: 'Password',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal317: 'Leave empty for demo',
  loginmodal334: 'rememberMe',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: 'Stay logged in (30 days)',
  LoginStayLoggedInTooltip: 'You will remain logged in even after closing the browser',
  LoginDoLogin: 'Logging in...',
  LoginButton: 'Login',
  LoginRegister: 'Don\'t have an account? Register',
  LoginForgotPassword: 'Forgot password?',

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal26: 'EUR',
  planmodal43: 'Free',
  planmodal46: 'Perfect for personal projects',
  planmodal48: 'Up to 3 projects',
  planmodal49: 'Basic templates',
  planmodal50: 'SQL schema parsing',
  planmodal51: 'Community support',
  planmodal53: 'Current Plan',
  planmodal58: 'Premium',
  planmodal62: 'Best for professional developers',
  planmodal64: 'Unlimited projects',
  planmodal65: 'Advanced templates',
  planmodal66: 'Custom template creation',
  planmodal67: 'Priority support',
  planmodal68: 'Advanced SQL features',
  planmodal69: 'Team collaboration',
  planmodal71: 'Choose Premium',
  planmodal76: 'Business',
  planmodal80: 'Best for teams and agencies',
  planmodal82: 'All Premium features',
  planmodal83: 'Team collaboration tools',
  planmodal84: 'Google Translate API integration',
  planmodal85: 'Advanced analytics',
  planmodal86: 'Priority support with SLA',
  planmodal87: 'Custom branding options',
  planmodal89: 'Choose Business',
  planmodal94: 'Patron',
  planmodal97: 'Support the community',
  planmodal99: 'All Business features',
  planmodal100: 'Early access to features',
  planmodal101: 'Influence development',
  planmodal102: 'Community Discord access',
  planmodal103: 'Custom amount (€5-50+)',
  planmodal105: 'Choose Patron',
  planmodal116: 'Choose Your Plan',
  planmodal126: 'Current Plan',
  planmodal127: 'Free',
  planmodal130: 'Free plan',
  planmodal143: 'MOST POPULAR',
  planmodal147: 'Patron',
  planmodal151: 'Custom',
  planmodal173: 'Free',
  planmodal175: 'Free',
  planmodal177: 'Free',
  planmodal190: 'You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal42: 'languageChanged',
  profilemodal45: 'languageChanged',
  profilemodal115: 'Not logged in',
  profilemodal127: 'Error loading user data',
  profilemodal146: 'Error loading',
  profilemodal167: 'Not logged in',
  profilemodal186: 'Error updating',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: 'Profile updated successfully',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: 'Profile update error',
  profilemodal214: 'languageChanged',
  profilemodal246: 'New passwords do not match',
  profilemodal254: 'Not logged in',
  profilemodal273: 'Error changing password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: 'Password changed successfully',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal280: 'An error occurred',
  profilemodal305: 'DELETE',
  profilemodal306: 'You must enter DELETE to delete your account',
  profilemodal314: 'Not logged in',
  profilemodal318: 'DELETE',
  profilemodal331: 'Error deleting account',
  profilemodal334: 'Account successfully deleted. You will be automatically logged out.',
  profilemodal346: 'An error has occurred',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: 'Profile Settings',
  profileTab: 'Profile',
  profilemodal406: 'User ID',
  profilemodal421: 'Username',
  fullName: 'Full Name',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal447: 'Your full name',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  emailAddress: 'Email Address',
  profilemodal463: 'ihre.email@example.com',
  preferredLanguage: 'Preferred Language',
  languageDescription: 'Choose your preferred language for the application interface',

  // Email Notification Settings
  emailNotifications: 'Email Notifications',
  emailSystemNotifications: 'System Notifications',
  emailSystemNotificationsDesc: 'Important system messages, announcements and admin messages',
  emailUserNotifications: 'User Messages',
  emailUserNotificationsDesc: 'Messages from other users, teams and project notifications',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal498: 'Select Language',
  profilemodal510: 'The username cannot be changed after registration.',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  updating: 'Updating...',
  updateProfile: 'Update Profile',
  passwordTab: 'Change Password',
  currentPassword: 'Current Password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal555: 'Your current password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  newPassword: 'New Password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal573: 'Your new password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  confirmPassword: 'Confirm New Password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal591: 'Repeat new password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  changing: 'Changing...',
  changePassword: 'Change Password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal611: 'Plans & Billing',
  profilemodal616: 'Current Plan',
  profilemodal617: 'Free',
  profilemodal620: 'Free plan',
  profilemodal626: 'Available Plans',
  profilemodal632: 'Free',
  profilemodal635: '• Up to 3 projects',
  profilemodal636: '• Basic templates',
  profilemodal637: '• Community support',
  profilemodal640: 'Current',
  profilemodal648: 'Premium',
  profilemodal651: '• Unlimited projects',
  profilemodal652: '• Advanced templates',
  profilemodal653: '• Priority support',
  profilemodal654: '• Team collaboration',
  profilemodal658: 'Upgrade',
  profilemodal661: 'Upgrade to Premium - Coming Soon!',
  profilemodal670: 'Patron',
  profilemodal673: '• All Premium features',
  profilemodal674: '• Early access to features',
  profilemodal675: '• Community Discord access',
  profilemodal676: '• Custom amount (€5-50+)',
  profilemodal680: 'Become Patron',
  profilemodal683: 'Become Patron - Coming Soon!',
  profilemodal739: 'Warning: Delete account',
  profilemodal684: '• All premium features',
  profilemodal685: '• Tools for team collaboration',
  profilemodal686: '• Google Translate API-Integration',
  profilemodal687: '• Advanced Analyses',
  profilemodal688: '• Priority support with SLA',
  profilemodal689: '• Custom branding options',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleteTab: 'Delete Account',
  profilemodal714: 'This action cannot be undone. Your account and all associated data will be permanently deleted.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal718: 'All your projects and templates will be deleted',
  profilemodal719: 'Your team memberships will be terminated',
  profilemodal720: 'This action cannot be undone',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal725: 'Confirm current password',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal732: 'Your current password',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal743: 'Enter DELETE to confirm',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal744: 'DELETE',
  profilemodal750: 'confirmText',
  profilemodal751: 'DELETE',
  profilemodal757: 'DELETE',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: 'Deleting...',
  saving: 'Saving...',
  deleteAccount: 'Delete Account',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal766: 'DELETE',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: 'Passwords do not match',
  registermodal84: 'Registration failed. Please try again.',
  registermodal94: 'Registration successful! Please check your email for a verification link before logging in.',

  // resources\js\Components\AuthModals\RegisterModal.tsx
  registermodal102: 'Registration successful! ${userId ? `Your User ID is: ${userId}. ` : \'\'}You can now log in.',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: 'An error occurred',
  registermodal203: 'Register',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: 'Name',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal239: 'Your full name',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal244: 'Your full name',
  registermodal261: 'username123',
  registermodal274: 'E-Mail',
  registermodal282: 'your.email@example.com',
  registermodal291: 'password',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal293: 'Your password',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal298: 'Your password',
  registermodal310: 'Confirm password',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal312: 'Repeat password',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal317: 'Repeat password',
  registermodal329: 'Preferred Language',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal335: 'Select Language',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal340: 'Select Language',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal351: 'Select Language',
  registermodal366: 'Select Language',
  registermodal379: 'Registration in progress...',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal384: 'Register',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: 'Already have an account? Login',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal393: 'Already have an account? Login',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal59: 'XMLHttpRequest',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal73: 'This reset link is invalid or expired.',
  resetpasswordmodal79: 'Error validating reset link.',
  resetpasswordmodal122: 'Password error:',
  resetpasswordmodal124: 'Token error:',
  resetpasswordmodal127: 'An unknown error occurred. Please try again.',
  resetpasswordmodal131: 'Network error - please try again later.',
  resetpasswordmodal162: 'Close',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal191: 'Reset link is being validated...',
  resetpasswordmodal194: 'One moment please...',
  resetpasswordmodal208: 'You will be automatically redirected to login...',
  resetpasswordmodal219: 'Reset link invalid',
  resetpasswordmodal231: 'To Login',
  resetpasswordmodal234: 'Request a new reset link if you want to reset your password.',
  resetpasswordmodal243: 'E-Mail',
  resetpasswordmodal259: 'New Password',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal265: 'Enter new password',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal281: 'Confirm Password',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal287: 'Repeat password',
  resetpasswordmodal319: 'Reset Password',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal332: 'Continue to Login',
  resetpasswordmodal345: 'The reset link is invalid or expired.',
  resetpasswordmodal374: 'Login',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: 'Failed to load schemas',
  databaseexportmodal93: 'Failed to load schemas',
  databaseexportmodal114: 'Failed to load schema versions',
  databaseexportmodal141: 'Failed to load schema versions',
  databaseexportmodal169: 'No project selected. Please select a project first.',
  databaseexportmodal195: 'Please select a database and version to export',
  databaseexportmodal214: 'No tables found in this schema. The schema might be empty or the version doesn\'t exist.',
  databaseexportmodal216: 'Access denied to this schema. Please check your permissions.',
  databaseexportmodal225: 'Export failed',
  databaseexportmodal228: '-- No SQL generated',
  databaseexportmodal238: 'Export failed',
  databaseexportmodal269: ' (Current)',
  databaseexportmodal285: '📤 Export Database Schema',
  databaseexportmodal308: 'Export database schema as MySQL SQL script',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: 'Database Schema',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal329: 'Loading schemas...',
  databaseexportmodal338: 'Select database...',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal339: 'w-full custom-dropdown',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: 'No project selected',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal351: 'Version',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal355: 'Select database first',
  databaseexportmodal357: 'Loading versions...',
  databaseexportmodal363: 'Select version...',
  databaseexportmodal368: 'No versions found',
  databaseexportmodal380: '📥 Download .sql',
  databaseexportmodal388: '👁️ View SQL',
  databaseexportmodal403: 'Generated SQL Script',
  databaseexportmodal406: '📋 Copy',
  databaseexportmodal412: '💾 Download',

  // resources/js\Components\EmailVerification.tsx
  emailverification55: 'Email confirmation error',
  emailverification59: 'Network error - please try again later',
  emailverification68: 'Invalid confirmation link',
  emailverification107: 'Email confirmation',
  emailverification112: 'Email is confirmed...',

  // resources/js/Components/EmailVerification.tsx
  emailverification127: 'You are now logged in and will be redirected to the app automatically.',
  emailverification135: 'You can now start collaborating with your team.',

  // resources/js\Components\EmailVerification.tsx
  emailverification141: 'Go to App Now',

  // resources/js/Components/EmailVerification.tsx
  emailverification151: 'If you continue to have problems, please contact support.',

  // resources/js\Components\EmailVerification.tsx
  emailverification155: 'To the homepage',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: 'An unexpected error occurred. Don\'t worry—your data is safe.',
  errorfallback40: 'Error details:',
  errorfallback58: 'Try again',
  errorfallback65: 'Reload page & reset',
  errorfallback65_2: ' Button deletes all local data (layout, settings & logout!) and restarts the app.',
  errorfallback75: 'A notice:',

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: 'Tip: If the problem persists, please contact support.',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback78: 'Tip: If the problem persists',

  // resources/js\Components\LanguageSelector.tsx
  languageselector68: 'Select Language',
  languageselector69: 'Select Language',

  // resources/js/Components/LanguageSelector.tsx
  languageselector87: 'Choose Language',

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: 'Not authenticated',
  applicationsmodal78: 'Failed to load applications',
  applicationsmodal85: 'Error loading applications',
  applicationsmodal106: 'Not authenticated',
  applicationsmodal125: 'Failed to review application',
  applicationsmodal143: 'Error reviewing application',
  applicationsmodal200: 'No message',
  applicationsmodal228: 'Approve application',
  applicationsmodal234: 'Reject application',
  applicationsmodal252: 'Unknown',
  applicationsmodal301: 'No applications found',
  applicationsmodal313: 'Refresh',
  applicationsmodal322: 'Applicant',
  applicationsmodal329: 'Message',
  applicationsmodal335: 'Status',
  applicationsmodal342: 'Applied',
  applicationsmodal348: 'Reviewed By',
  applicationsmodal354: 'Actions',
  applicationsmodal363: 'Close',
  applicationsmodal374: 'Reject',
  applicationsmodal402: 'Message:',
  applicationsmodal412: 'Rejection Reason',
  applicationsmodal420: 'Welcome them to the project...',
  applicationsmodal421: 'Let them know why their application was rejected...',
  applicationsmodal432: 'Cancel',
  applicationsmodal439: 'Processing...',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: 'Table name is required',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal191: 'Table name is required',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: 'All fields must have a name',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal196: 'All fields must have a name',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: 'Field names must be unique',
  createtablemodal290: 'Table Name *',
  createtablemodal300: 'e.g., users, products, orders',
  createtablemodal306: 'File Key Name',
  createtablemodal316: 'Type or select a key name',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal318: 'Type or select a key name',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal330: 'File Name Renamed',
  createtablemodal339: 'e.g., CustomUser, ProductCatalog',
  createtablemodal348: 'File Name Short',
  createtablemodal370: 'Fields *',
  createtablemodal380: 'Add Field',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal382: 'Add Field',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal391: 'Name',
  createtablemodal398: 'field_name',
  createtablemodal428: 'Control',
  createtablemodal482: 'None',
  createtablemodal483: 'Primary Key',
  createtablemodal484: 'Index',
  createtablemodal485: 'Unique',
  createtablemodal497: 'Remove field',
  createtablemodal509: 'Link Table',
  createtablemodal516: '-- Select Table --',
  createtablemodal525: 'Value Field',
  createtablemodal532: '-- Value Field --',
  createtablemodal541: 'Display Field',
  createtablemodal548: '-- Display Field --',
  createtablemodal557: 'Order Field',
  createtablemodal564: '-- Order Field --',
  createtablemodal573: 'Direction',
  createtablemodal603: 'Cancel',
  createtablemodal614: 'Creating...',
  createtablemodal619: 'Create Table',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: 'Failed to create team',
  createteammodal52: 'Network error occurred',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal88: 'Team Name *',
  createteammodal97: 'e.g., Core Team, Quality Check',
  createteammodal103: 'Description',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: 'What does this team do?',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: 'Projects',
  createteammodal136: 'Select one or more projects for this team. Hold Ctrl/Cmd to select multiple.',
  createteammodal153: 'Cancel',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal164: 'Creating...',
  createteammodal169: 'Create Team',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal97: 'd.m.Y',
  editprojectmodal98: 'H:i:s',
  editprojectmodal100: 'Europe/Vienna',
  editprojectmodal131: 'd.m.Y',
  editprojectmodal132: 'H:i:s',
  editprojectmodal134: 'Europe/Vienna',
  editprojectmodal168: 'Not authenticated',
  editprojectmodal183: 'Failed to update project',
  editprojectmodal197: 'Error updating project',
  editprojectmodal215: 'Edit Project',
  editprojectmodal227: 'Project Settings',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal230: 'Project Name *',
  editprojectmodal240: 'my_project_name',
  editprojectmodal252: '✓ Allowed: Lowercase letters, numbers, underscores (e.g. my_project_123)',
  editprojectmodal258: 'Description',
  editprojectmodal569: 'Project names are later used for URLs (username/project_name)',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: 'Enter project description',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal266: 'Join Code',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: 'Enter join code (optional)',
  editprojectmodal280: 'PROJ-',
  editprojectmodal281: 'Generate random join code',
  editprojectmodal285: 'Users can join this project using this code',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal298: 'Public Project',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal302: 'Make this project visible to all users',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal307: 'Transfer Ownership',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal316: 'Keep current owner ({project.owner.name})',
  editprojectmodal332: 'Database Connection',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal335: 'Database Name',
  editprojectmodal345: 'Name of the database for this project',
  editprojectmodal351: 'Database Type',
  editprojectmodal370: 'Server',
  editprojectmodal383: 'Port',
  editprojectmodal397: 'Username',
  editprojectmodal410: 'Password',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: 'Project Properties',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal429: 'Project Directory',
  editprojectmodal439: 'Path where generated files should be saved',
  editprojectmodal445: 'Project URL',
  editprojectmodal455: 'URL for accessing the project',
  editprojectmodal461: 'Start Page',
  editprojectmodal477: 'Default Language',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: 'English',
  editprojectmodal485: 'German',
  editprojectmodal486: 'French',
  editprojectmodal487: 'Español',
  editprojectmodal488: 'Italian',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal493: 'Standard language for project generation',
  editprojectmodal499: 'Filename Short Length',
  editprojectmodal506: '2 characters',
  editprojectmodal507: '3 characters',
  editprojectmodal508: '4 characters',
  editprojectmodal509: '5 characters',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: 'Localization Settings',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal526: 'Decimal Separator',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal538: 'for 1.23 or',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal543: 'Thousands Separator',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal555: 'for 1,234 or',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal562: 'Date Format',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal568: 'd.m.Y',
  editprojectmodal573: 'for 31.12.2024 or',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal578: 'Time Format',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal584: 'H:i:s',
  editprojectmodal589: 'for 14:30:00 or',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal596: 'Currency Symbol',
  editprojectmodal602: '€',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: 'CHF',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: 'Timezone',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal620: 'Europe/Vienna',
  editprojectmodal621: 'Europe/Berlin',
  editprojectmodal622: 'Europe/Zurich',
  editprojectmodal623: 'Europe/London',
  editprojectmodal624: 'America/New_York',
  editprojectmodal625: 'America/Chicago',
  editprojectmodal626: 'America/Los_Angeles',
  editprojectmodal627: 'Asia/Tokyo',
  editprojectmodal628: 'Asia/Dubai',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal629: 'UTC',
  editprojectmodal634: 'Time zone for date/time operations',
  editprojectmodal641: 'Google Translate API Key',
  editprojectmodal652: 'API key for automatic translations via Google Translate',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal689: 'Cancel',
  editprojectmodal696: 'Save Changes',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal317: 'Table name is required',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal319: 'Table name is required',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal322: 'All fields must have a name',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal324: 'All fields must have a name',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal329: 'Field names must be unique',
  edittablemodal335: 'File key name is required',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal337: 'File key name is required',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: 'Selected file key name must be a primary key, unique key, or indexed field',
  edittablemodal397: 'Table Name *',
  edittablemodal407: 'e.g., users, products, orders',
  edittablemodal413: 'File Key Name *',
  edittablemodal422: 'Select key field...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal424: 'Select key field...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal425: '- Auto Inc',
  edittablemodal436: 'File Name Renamed',
  edittablemodal445: 'e.g., CustomUser, ProductCatalog',
  edittablemodal454: 'File Name Short',
  edittablemodal476: 'Fields *',
  edittablemodal486: 'Add Field',
  edittablemodal497: 'Name',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal499: 'Name',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal504: 'field_name',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: 'Type',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal534: 'Control',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal536: 'Control',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal614: 'Comment',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal616: 'Comment',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: 'Field description',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal623: 'Field description',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal632: 'Remove field',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal634: 'Remove field',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal644: 'Link Table',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal646: 'Link Table',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal651: '-- Select Table --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal653: '-- Select Table --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal660: 'Value Field',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal662: 'Value Field',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal667: '-- Value Field --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal669: '-- Value Field --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal676: 'Display Field',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal678: 'Display Field',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal683: '-- Display Field --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal685: '-- Display Field --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal692: 'Order Field',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal694: 'Order Field',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal699: '-- Order Field --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal701: '-- Order Field --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal708: 'Direction',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal710: 'Direction',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal739: 'Cancel',
  edittablemodal750: 'Updating...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal752: 'Updating...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal755: 'Update Table',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal757: 'Update Table',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: 'Please enter a join code',
  joincodemodal51: 'Not authenticated',
  joincodemodal63: 'We looked everywhere',
  joincodemodal66: 'Invalid join code',
  joincodemodal73: 'You have already applied to this project',
  joincodemodal80: 'Error looking up project',
  joincodemodal95: 'Not authenticated',
  joincodemodal113: 'Failed to submit application',
  joincodemodal117: 'Application submitted successfully! The project owner will review your request.',
  joincodemodal_toast_detail: 'Please wait until',
  joincodemodal_toast_detail2: 'has reviewed your application.',
  joincodemodal129: 'Error submitting application',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal147: ', month:',
  joincodemodal148: ', day:',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: 'Join Project',
  joincodemodal157: 'Apply to Project',
  joincodemodal158: 'Application Sent',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal181: 'Join Code',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: 'Enter',
  joincodemodal200: 'Lookup',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: 'Enter the project join code provided by the project owner.',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: 'Project Information',
  joincodemodal220: 'No description provided',
  joincodemodal226: 'Owner:',
  joincodemodal237: 'Created:',
  joincodemodal247: 'Teams',
  joincodemodal261: 'Tell the project owner why you\'d like to join this project...',
  joincodemodal277: 'Application Sent!',
  joincodemodal288: 'Cancel',
  joincodemodal299: 'Back',
  joincodemodal306: 'Submitting...',
  joincodemodal316: 'Done',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: 'Failed to send invitation',
  manageteammodal132: 'Network error occurred',
  manageteammodal139: 'Remove this member from the team?',
  manageteammodal144: 'DELETE',
  manageteammodal155: 'Failed to remove member',
  manageteammodal158: 'Failed to remove member',
  manageteammodal181: 'Failed to change role',
  manageteammodal184: 'Failed to change role',
  manageteammodal189: 'Cancel this invitation?',
  manageteammodal194: 'DELETE',
  manageteammodal206: 'Failed to cancel invitation',
  manageteammodal209: 'Failed to cancel invitation',
  manageteammodal244: 'Loading team...',
  manageteammodal283: 'Overview',
  manageteammodal284: 'Members (${team.members?.length || 0})',
  manageteammodal297: '{tab.label}',
  manageteammodal308: 'Team Information',
  manageteammodal312: 'Team Name',
  manageteammodal316: 'Project',
  manageteammodal320: 'Owner',
  manageteammodal321: 'Unknown',
  manageteammodal324: 'Status',
  manageteammodal328: 'Inactive',
  manageteammodal334: 'Description',
  manageteammodal347: 'Team Members',
  manageteammodal354: 'Invite Member',
  manageteammodal362: 'Invite New Member',
  manageteammodal366: 'Username (required) *',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal373: 'e.g., johndoe77',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal377: 'Email (optional)',
  manageteammodal383: 'Optional notification email',
  manageteammodal388: 'Role',
  manageteammodal394: 'Member',
  manageteammodal395: 'Admin',
  manageteammodal399: 'Message (optional)',
  manageteammodal404: 'Welcome message for the invitation',
  manageteammodal432: 'Sending...',
  manageteammodal437: 'Send Invitation',
  manageteammodal456: '{member.user.email}',
  manageteammodal469: 'Promote to Admin',
  manageteammodal477: 'Demote to Member',
  manageteammodal485: 'Remove Member',
  manageteammodal501: 'Pending Invitations',
  manageteammodal505: 'No pending invitations',
  manageteammodal534: 'Cancel Invitation',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal553: 'Close',

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal179: 'Not authenticated',
  membermodal191: 'Failed to load team details',
  membermodal244: 'Failed to load data',
  membermodal297: 'Not authenticated',
  membermodal316: 'Failed to add member to team',
  membermodal323: 'Success',
  membermodal335: 'Error',
  membermodal336: 'Failed to add member to team',
  membermodal348: 'Warning',
  membermodal349: 'Cannot remove team owner',
  membermodal357: 'Remove Member',
  membermodal365: 'Not authenticated',
  membermodal369: 'DELETE',
  membermodal378: 'Failed to remove member',
  membermodal383: 'Success',
  membermodal384: 'Member removed successfully',
  membermodal394: 'Error',
  membermodal395: 'Failed to remove member',
  membermodal407: 'Warning',
  membermodal408: 'Cannot change owner role',
  membermodal417: 'Not authenticated',
  membermodal432: 'Failed to update role',
  membermodal437: 'Success',
  membermodal438: 'Member role updated successfully',
  membermodal448: 'Error',
  membermodal449: 'Failed to update role',
  membermodal458: 'Member',
  membermodal459: 'Admin',
  membermodal479: 'Available',
  membermodal483: 'Available',
  membermodal509: 'de-DE',
  membermodal527: 'Owner',
  membermodal536: 'Remove from Team',
  membermodal549: 'Assign to Team',
  membermodal582: 'Available',
  membermodal590: 'No members found',
  membermodal597: 'Member',
  membermodal603: 'Role',
  membermodal609: 'Joined',
  membermodal614: 'Actions',
  membermodal625: 'Close',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal53: 'Not authenticated',
  pendinginvitationmodal70: 'Failed to load pending invitation',
  pendinginvitationmodal76: 'Error loading invitation',
  pendinginvitationmodal97: 'Not authenticated',
  pendinginvitationmodal112: 'Welcome to the team! 🎉',
  pendinginvitationmodal118: 'Failed to accept invitation',
  pendinginvitationmodal121: 'Error accepting invitation',
  pendinginvitationmodal136: 'Not authenticated',
  pendinginvitationmodal151: 'Invitation declined',
  pendinginvitationmodal157: 'Failed to decline invitation',
  pendinginvitationmodal160: 'Error declining invitation',
  pendinginvitationmodal169: '✅ Accept & Join Project',
  pendinginvitationmodal176: '❌ Decline',
  pendinginvitationmodal189: '🎉 Project Invitation',
  pendinginvitationmodal200: 'Loading invitation...',

  // resources/js/Components/Modals/PendingInvitationModal.tsx
  pendinginvitationmodal213: 'Complete your registration by accepting this invitation',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal234: 'Invited by:',
  pendinginvitationmodal244: 'Your Role:',
  pendinginvitationmodal251: 'Project Owner:',
  pendinginvitationmodal261: 'Expires:',
  pendinginvitationmodal270: 'Personal message:',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal45: 'Member',
  projectinvitationsmodal46: 'Admin',
  projectinvitationsmodal74: 'Not authenticated',
  projectinvitationsmodal86: 'Failed to load invitations',
  projectinvitationsmodal93: 'Error loading invitations',
  projectinvitationsmodal100: '=== useEffect triggered ===',
  projectinvitationsmodal102: 'Loading invitations...',
  projectinvitationsmodal113: '=== SEND INVITATION START ===',
  projectinvitationsmodal118: 'States cleared, about to fetch',
  projectinvitationsmodal122: 'Not authenticated',
  projectinvitationsmodal141: 'Response received:',
  projectinvitationsmodal144: 'Failed to send invitation',
  projectinvitationsmodal147: 'Setting success message...',
  projectinvitationsmodal148: '✅ Invitation sent successfully! Email delivered.',
  projectinvitationsmodal150: 'Clearing form...',
  projectinvitationsmodal153: 'SUCCESS MESSAGE IS NOW SET - Should be visible!',
  projectinvitationsmodal157: 'Adding invitation to list - raw data:',
  projectinvitationsmodal171: 'You',
  projectinvitationsmodal177: 'Adding enriched invitation:',
  projectinvitationsmodal182: 'Calling onSuccess callback...',
  projectinvitationsmodal187: 'Auto-clearing success message after 5 seconds',
  projectinvitationsmodal191: '=== SEND INVITATION END - SUCCESS ===',
  projectinvitationsmodal193: 'Error sending invitation',
  projectinvitationsmodal204: 'Cancel Invitation',
  projectinvitationsmodal212: 'DELETE',
  projectinvitationsmodal220: '✅ Invitation cancelled successfully',
  projectinvitationsmodal229: 'Failed to cancel invitation',
  projectinvitationsmodal232: 'Failed to cancel invitation',
  projectinvitationsmodal243: 'Resend Invitation',
  projectinvitationsmodal261: 'Resent invitation',
  projectinvitationsmodal266: '✅ Invitation resent successfully! Email delivered.',
  projectinvitationsmodal275: 'Failed to resend invitation',
  projectinvitationsmodal278: 'Failed to resend invitation',
  projectinvitationsmodal286: 'Pending',
  projectinvitationsmodal287: 'Accepted',
  projectinvitationsmodal288: 'Declined',
  projectinvitationsmodal289: 'Expired',
  projectinvitationsmodal305: 'Cancel invitation',
  projectinvitationsmodal314: 'Resend invitation',
  projectinvitationsmodal337: 'Close',
  projectinvitationsmodal360: 'Send New Invitation',
  projectinvitationsmodal364: 'Email Address *',

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: 'user@example.com',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal376: 'Role',
  projectinvitationsmodal387: 'Personal Message (Optional)',
  projectinvitationsmodal392: 'Add a personal message to the invitation...',
  projectinvitationsmodal398: 'Send Invitation',
  projectinvitationsmodal409: 'Existing Invitations',
  projectinvitationsmodal414: 'No invitations sent yet',
  projectinvitationsmodal420: 'Email',
  projectinvitationsmodal425: 'Role',
  projectinvitationsmodal433: 'Status',
  projectinvitationsmodal439: 'Sent',
  projectinvitationsmodal445: 'Expires',
  projectinvitationsmodal450: 'Actions',

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: 'Failed to load project members',
  projectmembersmodal63: 'Error loading project members',
  projectmembersmodal84: 'DELETE',
  projectmembersmodal95: 'Failed to remove member',
  projectmembersmodal98: 'Member removed successfully',
  projectmembersmodal101: 'Error removing member',
  projectmembersmodal128: 'Failed to update member role',
  projectmembersmodal131: 'Member role updated successfully',
  projectmembersmodal134: 'Error updating member role',
  projectmembersmodal141: 'Confirm Removal',
  projectmembersmodal176: 'Member',
  projectmembersmodal177: 'Admin',
  projectmembersmodal193: 'Owner',
  projectmembersmodal206: 'Select role',
  projectmembersmodal221: 'Remove member',
  projectmembersmodal238: 'Project Members - {project?.name}',
  projectmembersmodal264: 'No members found',
  projectmembersmodal270: 'User',
  projectmembersmodal276: 'Role',
  projectmembersmodal282: 'Joined',
  projectmembersmodal287: 'Actions',
  projectmembersmodal296: 'Close',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: 'Team name is required',
  teammodal108: 'Not authenticated',
  teammodal132: 'Failed to save team',
  teammodal137: 'Failed to save team',
  teammodal146: 'Select Project',
  teammodal155: 'Create New Team',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal169: 'Team Name *',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal176: 'Enter team name',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal182: 'Description',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: 'Enter team description (optional)',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal195: 'Projects',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: 'Select projects',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal222: 'Team is active',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal232: 'Cancel',
  teammodal240: 'Create',

  // resources/js\Components\Panels\AuthPanel.tsx
  authpanel3: './RegisterPanel',
  authpanel4: './ProfilePanel',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: 'English',
  cmsadminpanel41: 'German',
  cmsadminpanel42: 'French',
  cmsadminpanel43: 'Español',
  cmsadminpanel44: 'Italian',
  cmsadminpanel69: 'Failed to load pages:',
  cmsadminpanel106: 'Please fill in all required fields',
  cmsadminpanel122: 'Page updated successfully!',
  cmsadminpanel129: 'Page created successfully!',
  cmsadminpanel135: 'Failed to save page:',
  cmsadminpanel144: 'Confirm Deletion',
  cmsadminpanel150: 'DELETE',
  cmsadminpanel152: 'Page deleted successfully!',
  cmsadminpanel155: 'Failed to delete page:',
  cmsadminpanel170: 'Edit',
  cmsadminpanel178: 'Delete',
  cmsadminpanel186: 'View Page',
  cmsadminpanel195: 'Inactive',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel216: '📝 CMS Page Management',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: 'Create New Page',
  cmsadminpanel241: 'No pages found',
  cmsadminpanel244: 'Slug',
  cmsadminpanel245: 'Language',
  cmsadminpanel246: 'Title',
  cmsadminpanel247: 'Status',
  cmsadminpanel250: 'Last Updated',
  cmsadminpanel256: 'Actions',
  cmsadminpanel265: 'Create New Page',
  cmsadminpanel272: 'Cancel',
  cmsadminpanel279: 'Save',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel291: 'Slug *',
  cmsadminpanel298: 'help, impressum, privacy-policy...',
  cmsadminpanel309: 'Language *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: 'Select a language',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel328: 'Title *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: 'Page title...',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel342: 'Content *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: 'HTML Source',
  cmsadminpanel363: 'HTML source code with syntax highlighting',
  cmsadminpanel365: 'Formatting',
  cmsadminpanel402: 'Insert HTML code here...',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel72: 'Failed to generate code',
  codegenerationpanel75: 'Failed to generate code',
  codegenerationpanel86: 'No files found for selected table index',
  codegenerationpanel165: 'Could not parse JavaScript function',
  codegenerationpanel166: 'Raw content:',
  codegenerationpanel186: 'Starting batch execution of all 278 JavaScript functions...',
  codegenerationpanel280: 'No generated files to download. Please execute all functions first.',
  codegenerationpanel286: '# Generated Code Files from Template System',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: 'text/plain',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel327: 'Code Generation',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel332: 'Template ID',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel338: 'Enter template ID (e.g., 1)',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel344: 'Table Index',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel351: 'Select table',
  codegenerationpanel358: 'Generate Code',
  codegenerationpanel374: 'Generation Summary:',
  codegenerationpanel387: 'Clean JavaScript',
  codegenerationpanel395: 'Execution Result',
  codegenerationpanel399: 'Execute Single File',
  codegenerationpanel407: 'Execute All Files',
  codegenerationpanel416: 'Download ZIP',
  codegenerationpanel433: 'Click \'Execute Single File\' or \'Execute All Files\' to see results...',
  codegenerationpanel445: 'Performance:',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel131: 'Not authenticated',
  databasemanagementpanel145: 'Failed to load schemas',
  databasemanagementpanel152: 'Error loading schemas',
  databasemanagementpanel221: 'Please select at least one language',
  databasemanagementpanel231: 'Not authenticated',
  databasemanagementpanel245: 'Failed to export translations',
  databasemanagementpanel259: 'Translations exported successfully',
  databasemanagementpanel261: 'Error exporting translations',
  databasemanagementpanel277: 'Not authenticated',
  databasemanagementpanel294: 'Failed to import translations',
  databasemanagementpanel301: 'Error importing translations',
  databasemanagementpanel315: 'Not authenticated',
  databasemanagementpanel330: 'Failed to create schema',
  databasemanagementpanel336: 'Database schema created successfully',
  databasemanagementpanel339: 'Error creating schema',
  databasemanagementpanel367: 'Not authenticated',
  databasemanagementpanel382: 'Failed to update schema',
  databasemanagementpanel388: 'Schema updated successfully',
  databasemanagementpanel391: 'Error updating schema',
  databasemanagementpanel419: 'Not authenticated',
  databasemanagementpanel438: 'Failed to associate schema',
  databasemanagementpanel447: 'Error associating schema',
  databasemanagementpanel454: 'de-DE',
  databasemanagementpanel485: 'Not assigned',
  databasemanagementpanel516: 'Not authenticated',
  databasemanagementpanel520: 'DELETE',
  databasemanagementpanel529: 'Failed to remove schema from project',
  databasemanagementpanel536: 'Error removing schema',
  databasemanagementpanel551: ' (Copy)',
  databasemanagementpanel567: 'Not authenticated',
  databasemanagementpanel585: 'Failed to copy schema',
  databasemanagementpanel594: 'Error copying schema',
  databasemanagementpanel606: 'Schema name does not match. Please type the exact schema name to confirm deletion.',
  databasemanagementpanel616: 'Not authenticated',
  databasemanagementpanel621: 'DELETE',
  databasemanagementpanel651: 'DELETE',
  databasemanagementpanel683: 'Error deleting schema',
  databasemanagementpanel714: 'Link to project',
  databasemanagementpanel735: 'Associate to project',
  databasemanagementpanel743: 'Edit schema',
  databasemanagementpanel749: 'Copy database',
  databasemanagementpanel756: 'Open in Designer',
  databasemanagementpanel763: 'Delete schema',
  databasemanagementpanel771: 'Private',
  databasemanagementpanel772: 'Public',
  databasemanagementpanel776: 'Linked (Read-only reference)',
  databasemanagementpanel777: 'Cloned (Private copy)',
  databasemanagementpanel778: 'Imported (Merge into existing)',
  databasemanagementpanel786: 'Loading database schemas...',
  databasemanagementpanel798: 'Database Management',
  databasemanagementpanel803: 'New Database',
  databasemanagementpanel811: 'Refresh',
  databasemanagementpanel829: 'My Database Schemas',
  databasemanagementpanel833: 'No database schemas found. Create your first schema to get started.',
  databasemanagementpanel840: 'Schema Name',
  databasemanagementpanel841: 'Description',
  databasemanagementpanel843: 'Assigned Projects',
  databasemanagementpanel849: 'Visibility',
  databasemanagementpanel855: 'Owner',
  databasemanagementpanel861: 'Created',
  databasemanagementpanel867: 'Actions',
  databasemanagementpanel876: 'Translation Export/Import',
  databasemanagementpanel886: 'Export Translations',
  databasemanagementpanel893: 'Import Translations',
  databasemanagementpanel905: 'Create New Database Schema',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel917: 'Schema Name *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: 'Enter schema name',
  databasemanagementpanel937: 'Enter schema description (optional)',
  databasemanagementpanel952: 'Select visibility',
  databasemanagementpanel963: 'Cancel',
  databasemanagementpanel970: 'Create Schema',
  databasemanagementpanel981: 'Edit Database Schema',
  databasemanagementpanel999: 'Enter schema name',
  databasemanagementpanel1013: 'Enter schema description (optional)',
  databasemanagementpanel1028: 'Select visibility',
  databasemanagementpanel1036: 'Cancel',
  databasemanagementpanel1043: 'Update Schema',
  databasemanagementpanel1054: 'Link Schema to Project',
  databasemanagementpanel1070: 'No description',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1077: 'Select Project *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: 'Select a project',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1094: 'Link to Project:',
  databasemanagementpanel1104: 'Association Type',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: 'Custom name for this schema in the project',
  databasemanagementpanel1131: 'Cancel',
  databasemanagementpanel1138: 'Link Schema',
  databasemanagementpanel1163: 'Permanent Deletion Warning',
  databasemanagementpanel1166: 'ALL',
  databasemanagementpanel1174: '🎨 All schema designer layouts',
  databasemanagementpanel1175: '⚙️ All constraints and relationships',
  databasemanagementpanel1180: 'cannot be undone',
  databasemanagementpanel1210: 'Cancel',
  databasemanagementpanel1217: 'Delete Forever',
  databasemanagementpanel1229: 'Export Translations to Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1244: 'Select languages to include in the Excel export. The export will contain all tables and fields from linked databases.',
  databasemanagementpanel1250: 'Select Languages *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: 'Select languages to export',
  databasemanagementpanel1273: 'Cancel',
  databasemanagementpanel1280: 'Export to Excel',
  databasemanagementpanel1292: 'Import Translations from Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1307: 'Upload an Excel file with translations. The file must follow the export format.',
  databasemanagementpanel1313: 'Upload Excel File *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: 'Choose Excel File',
  databasemanagementpanel1338: 'Cancel',
  databasemanagementpanel1350: 'Copy Database Schema',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1365: 'This will create a complete copy of the database schema including all tables, fields, constraints, and designer layouts. The copy will be set to version 1.',
  databasemanagementpanel1371: 'New Schema Name *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: 'Enter name for the copied schema',
  databasemanagementpanel1395: 'Cancel',
  databasemanagementpanel1402: 'Copy Database',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel51: 'Fira Code',
  debugmanualgeneratorpanel127: 'Fira Code',
  debugmanualgeneratorpanel136: 'The generated JavaScript code appears here...',
  debugmanualgeneratorpanel162: 'Clipboard API not available. Please copy manually:',
  debugmanualgeneratorpanel165: 'Clipboard access not possible. Please check your browser settings.',

  debugmanualgeneratorpanel214:   ' Clipboard API not available. Please copy manually:',
  debugmanualgeneratorpanel217:   ' errors copying to the clipboard',
  debugmanualgeneratorpanel486:   ' No valid template files for template',
  debugmanualgeneratorpanel486a:  ' found',
  debugmanualgeneratorpanel490:   ' errors loading template files:',
  debugmanualgeneratorpanel990:   ' Backend template too extensive',
  debugmanualgeneratorpanel990a:  ' of max.',
  debugmanualgeneratorpanel990b:  ' Template contains too many tables or complex structures.',
  debugmanualgeneratorpanel1035:  ' ❌ File not found for selected configuration',
  debugmanualgeneratorpanel1036:  ' 🔍 Desired configuration:',
  debugmanualgeneratorpanel1037:  ' Template:',
  debugmanualgeneratorpanel1038:  ' File:',
  debugmanualgeneratorpanel1039:  ' Type:',
  debugmanualgeneratorpanel1047:  ' Language:',
  debugmanualgeneratorpanel1050:  '📋 Available files',
  debugmanualgeneratorpanel1056:  ' more',
  debugmanualgeneratorpanel1060:  '💡 Solution: Check template configuration and backend response.',
  debugmanualgeneratorpanel1092:  '⚠️ Memory warning:',
  debugmanualgeneratorpanel1092a: '% of memory is used. The template might be too complex for safe operation.',
  debugmanualgeneratorpanel1129:  'Function ',
  debugmanualgeneratorpanel1129a: ' not found in global scope',
  debugmanualgeneratorpanel1144:  '⚠️ WARNING: Template execution took',
  debugmanualgeneratorpanel1144a: ' ms (>5s). Consider template simplification.',
  debugmanualgeneratorpanel1148:  '📊 Performance: ',
  debugmanualgeneratorpanel1148a:  ' ms, memory:',
  debugmanualgeneratorpanel1155:  '❌ Execution failed!\n\nPlease check the',
  debugmanualgeneratorpanel1155a: 'Tab for details.\n\nError:',
  debugmanualgeneratorpanel1201:  '❌ JavaScript syntax error in the template',
  debugmanualgeneratorpanel1201a: '🔍 Problem: ',
  debugmanualgeneratorpanel1201b: '💡 Common causes:\n\n• Missing or extra quotation marks\n• Incomplete variables such as {item.\n• Incorrect parentheses in loops\n• Special characters that need to be escaped\n\n🛠️ Solution: Check template syntax and {variablename} placeholders.',
  debugmanualgeneratorpanel1208:  '❌ Template variable not found',
  debugmanualgeneratorpanel1208a: '🔍 Problem: Variable ',
  debugmanualgeneratorpanel1208b: 'is undefined\n\n📄 Details:',
  debugmanualgeneratorpanel1208c: '💡 Possible causes:\n• gtree was not loaded\n• Table/project not selected\n• Variable does not exist in the data structure\n• Typo in variable name\n\n🛠️ Solution: Check the',
  debugmanualgeneratorpanel1208d: ' Variable or select table/project.',
  debugmanualgeneratorpanel1211:  '❌ Template type error',
  debugmanualgeneratorpanel1211a: '🔍 Problem: ',
  debugmanualgeneratorpanel1211b: '💡 Common Causes:\n\n• Accessing undefined/null values\n• Incorrect array accesses such as tables[]\n• Missing lang arrays in gtree\n• Incorrect selectedlanguageindex\n\n🛠️ Solution: Check data structures and array accesses.',
  debugmanualgeneratorpanel1214:  '❌ Template execution error',
  debugmanualgeneratorpanel1214a: '🔍 Problem: ',
  debugmanualgeneratorpanel1214b: '📝 Type:',
  debugmanualgeneratorpanel1214c: '💡 Debug Tips:\n\n• Open the browser console (F12) for details\n• Check the generated JavaScript\n• Simplify the template for testing\n\n🛠️ If problems persist: Simplify the template syntax.',

  debugmanualgeneratorpanel352: 'No templates found. Please create templates first in Template Management.',
  debugmanualgeneratorpanel358: 'Error loading templates',
  debugmanualgeneratorpanel420: 'Error loading template files',
  debugmanualgeneratorpanel499: 'Unknown Table',
  debugmanualgeneratorpanel563: 'Unknown Table',
  debugmanualgeneratorpanel600: 'Demo Schema (Fallback)',
  debugmanualgeneratorpanel746: 'Please select template and file',
  debugmanualgeneratorpanel753: 'Please select project',
  debugmanualgeneratorpanel758: 'Please select table',
  debugmanualgeneratorpanel763: 'Please select language',
  debugmanualgeneratorpanel768: 'This file does not support code generation (static file)',
  debugmanualgeneratorpanel928: '❌ File for selected configuration not found',
  debugmanualgeneratorpanel936: 'Unknown',
  debugmanualgeneratorpanel940: 'Unknown',
  debugmanualgeneratorpanel946: 'Unknown',
  debugmanualgeneratorpanel953: '💡 Solution: Check template configuration and backend response.',
  debugmanualgeneratorpanel959: 'Error loading code',
  debugmanualgeneratorpanel962: 'Error loading code',
  debugmanualgeneratorpanel970: 'No code to execute',
  debugmanualgeneratorpanel1026: 'No function found in generated code',
  debugmanualgeneratorpanel1048: 'Debug Helper',
  debugmanualgeneratorpanel1093: 'SyntaxError',
  debugmanualgeneratorpanel1096: 'ReferenceError',
  debugmanualgeneratorpanel1107: 'Unknown',
  debugmanualgeneratorpanel1111: 'SyntaxError',
  debugmanualgeneratorpanel1174: 'Error: Could not parse JavaScript function',
  debugmanualgeneratorpanel1183: 'Unknown fallback error',
  debugmanualgeneratorpanel1203: 'Unknown',
  debugmanualgeneratorpanel1210: 'Unnamed (Unknown)',
  debugmanualgeneratorpanel1229: 'Unknown',
  debugmanualgeneratorpanel1259: '🔧 Debug Manual Generator',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1260: 'Template development and code debugging for individual files',
  debugmanualgeneratorpanel1270: '📄 Template',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1277: 'Choose template',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1284: '📝 Template File',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1293: 'Select file',
  debugmanualgeneratorpanel1302: '(not required)',
  debugmanualgeneratorpanel1310: 'Not required for this file type',
  debugmanualgeneratorpanel1319: '(required)',
  debugmanualgeneratorpanel1325: '❌ Template Syntax Errors',
  debugmanualgeneratorpanel1334: '(not required)',
  debugmanualgeneratorpanel1342: '🌐 Choose language',
  debugmanualgeneratorpanel1355: '🏗️ Project:',
  debugmanualgeneratorpanel1360: 'Include template source in code',
  debugmanualgeneratorpanel1369: 'Get code',
  debugmanualgeneratorpanel1377: 'Execute code',
  debugmanualgeneratorpanel1385: '🔍 Debug Helper',
  debugmanualgeneratorpanel1396: 'Not selected',
  debugmanualgeneratorpanel1397: 'Fix these syntax errors before generating code. The template will not work correctly!',
  debugmanualgeneratorpanel1398: 'Unknown',
  debugmanualgeneratorpanel1399: 'Not selected',
  debugmanualgeneratorpanel1400: '⚠️ Generated code may contain errors or invalid JavaScript!',
  debugmanualgeneratorpanel1473: '🔴 No project selected for project_file template',
  debugmanualgeneratorpanel1476: '🔴 No table selected for db_table_file template',
  debugmanualgeneratorpanel1479: '🟡 No language selected for language-enabled template',
  debugmanualgeneratorpanel1482: '🔴 Found tables[] - missing table index',
  debugmanualgeneratorpanel1531: '1. Prepared code',
  debugmanualgeneratorpanel1537: 'Copy GTree',
  debugmanualgeneratorpanel1564: 'GTree downloaden',
  debugmanualgeneratorpanel1583: 'Download failed. Please check the GTree data.',
  debugmanualgeneratorpanel1591: 'Copy code',
  debugmanualgeneratorpanel1621: 'Code Editor could not be loaded',
  debugmanualgeneratorpanel1622: 'Use a simple textarea as a fallback',
  debugmanualgeneratorpanel1628: 'Get code',
  debugmanualgeneratorpanel1679: '2. Executed result',
  debugmanualgeneratorpanel1683: 'Generierter PHP-Code',
  debugmanualgeneratorpanel1686: 'Copy code',
  debugmanualgeneratorpanel1724: 'Download failed.',
  debugmanualgeneratorpanel1739: '⚠️ Template Syntax Warnings',
  debugmanualgeneratorpanel1744: 'Click \'Run Code\' to see the result...',
  debugmanualgeneratorpanel1750: '3. 🔍 Debug Helper',
  debugmanualgeneratorpanel1755: 'These warnings won\'t break your code, but consider fixing them for better template quality.',
  debugmanualgeneratorpanel1760: 'Click on \'🔍 Debug Helper\' to see the debug information...',

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel31: 'Passwords do not match',
  panelsegisterpanel54: 'Registration failed',
  panelsegisterpanel57: 'Registration successful! You can now log in.',
  panelsegisterpanel75: 'An error has occurred',
  panelsegisterpanel90: 'Register',
  panelsegisterpanel123: 'Your full name',
  panelsegisterpanel154: 'At least 8 characters',
  panelsegisterpanel161: 'Enter password',
  panelsegisterpanel162: 'Weak',
  panelsegisterpanel163: 'Medium',
  panelsegisterpanel164: 'Stark',
  panelsegisterpanel176: 'Repeat password',
  panelsegisterpanel188: 'Register',
  panelsegisterpanel198: 'Already have an account? Sign in',

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: 'Back to Lobby',
  panelsewnavigationpanel120: 'Welcome',
  panelsewnavigationpanel128: 'Project',
  panelsewnavigationpanel133: 'Project Management',
  panelsewnavigationpanel138: 'Settings',
  panelsewnavigationpanel142: 'Project settings',
  panelsewnavigationpanel161: 'Teams',
  panelsewnavigationpanel165: 'Team Management',
  panelsewnavigationpanel170: 'Teams Assignment',
  panelsewnavigationpanel184: 'Templates',
  panelsewnavigationpanel188: 'Template management',
  panelsewnavigationpanel193: 'Template Assignment',
  panelsewnavigationpanel201: 'DB Schema Dependencies',
  panelsewnavigationpanel211: 'My Applications',
  panelsewnavigationpanel216: 'Public Projects',
  panelsewnavigationpanel223: 'Database',
  panelsewnavigationpanel228: 'Manage Databases',
  panelsewnavigationpanel233: 'Designer',
  panelsewnavigationpanel238: 'Schema Translation',
  panelsewnavigationpanel246: 'Schema Import',
  panelsewnavigationpanel251: 'Schema Export',
  panelsewnavigationpanel258: 'Generator',
  panelsewnavigationpanel263: 'Debug Manual Generator',
  panelsewnavigationpanel268: 'Code Generation',
  panelsewnavigationpanel273: 'Schema Migration',
  panelsewnavigationpanel281: 'Administration',
  panelsewnavigationpanel285: 'System Settings',
  panelsewnavigationpanel290: 'Language Management',
  panelsewnavigationpanel298: 'CMS Admin',
  panelsewnavigationpanel315: 'Profile',
  panelsewnavigationpanel320: 'Change Plan',
  panelsewnavigationpanel325: 'Back to Lobby',
  panelsewnavigationpanel333: 'Logout',
  panelsewnavigationpanel359: 'Account',
  panelsewnavigationpanel364: 'Login',
  panelsewnavigationpanel369: 'Register',
  panelsewnavigationpanel384: 'Collapse Menu',
  panelsewnavigationpanel394: 'Navigation',
  panelsewnavigationpanel413: 'Back to Lobby',
  panelsewnavigationpanel422: 'Welcome',
  panelsewnavigationpanel430: 'Project',
  panelsewnavigationpanel437: 'Project Management',
  panelsewnavigationpanel443: 'Settings',
  panelsewnavigationpanel459: 'Project settings',
  panelsewnavigationpanel469: 'Teams',
  panelsewnavigationpanel477: 'Team Management',
  panelsewnavigationpanel488: 'Teams Assignment',
  panelsewnavigationpanel496: 'Template Review',
  panelsewnavigationpanel504: 'Template management',
  panelsewnavigationpanel508: 'Template Assignment',
  panelsewnavigationpanel513: 'DB Schema Dependencies',
  panelsewnavigationpanel521: 'My Applications',
  panelsewnavigationpanel525: 'Public Projects',
  panelsewnavigationpanel533: 'Database',
  panelsewnavigationpanel540: 'Manage Databases',
  panelsewnavigationpanel544: 'Designer',
  panelsewnavigationpanel548: 'Schema Translation',
  panelsewnavigationpanel553: 'Schema Import',
  panelsewnavigationpanel557: 'Schema Export',
  panelsewnavigationpanel565: 'Generator',
  panelsewnavigationpanel572: 'Debug Manual Generator',
  panelsewnavigationpanel576: 'Code Generation',
  panelsewnavigationpanel580: 'Schema Migration',
  panelsewnavigationpanel589: 'Administration',
  panelsewnavigationpanel596: 'System Settings',
  panelsewnavigationpanel600: 'Language Management',
  panelsewnavigationpanel605: 'CMS Admin',
  panelsewnavigationpanel619: 'Account',
  panelsewnavigationpanel644: 'Profile',
  panelsewnavigationpanel648: 'Change Plan',
  panelsewnavigationpanel652: 'Back to Lobby',
  panelsewnavigationpanel672: 'Logout',
  panelsewnavigationpanel679: 'Login',
  panelsewnavigationpanel683: 'Register',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: 'Promise',
  filemodal95: 'Please select a ZIP file!',
  filemodal106: 'ZIP file removed',
  filemodal111: 'Add new file',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal124: 'File name *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: 'Please enter file name!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: 'e.g., Model.php, component.tsx, config.json',
  filemodal147: 'Template-Typ *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: 'Please select type!',
  filemodal160: 'Select type',
  filemodal182: 'Please enter the target directory!',
  filemodal185: 'Path:',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: 'e.g., /components/, /services/, /app/Http/Controllers/',
  filemodal202: 'Select content type:',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal208: 'Text input',
  filemodal215: 'ZIP-Upload',
  filemodal232: 'Please enter file contents!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal268: 'Upload ZIP file',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: 'Select ZIP file',
  filemodal287: 'Drop ZIP file here or click to select',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal288: '.zip files with template structures are supported',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: 'Remove',
  filemodal334: 'Cancel',
  filemodal340: 'Add',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: 'Enter email',
  forgotpasswordpanel30: 'Reset password',
  forgotpasswordpanel52: 'Reset link could not be sent',
  forgotpasswordpanel55: 'A reset link has been sent to your email address. Check your inbox.',
  forgotpasswordpanel59: 'An error has occurred',
  forgotpasswordpanel73: 'Passwords do not match',
  forgotpasswordpanel96: 'Password could not be reset',
  forgotpasswordpanel99: 'Password successfully reset! You can now log in with your new password.',
  forgotpasswordpanel109: 'An error has occurred',
  forgotpasswordpanel129: 'Forgot password',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel164: 'Enter your email address to receive a link to reset your password.',
  forgotpasswordpanel170: 'E-Mail',
  forgotpasswordpanel178: 'your.email@example.com',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: 'Send reset link',
  forgotpasswordpanel197: 'Back to Login',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel209: 'Enter the reset code from the email and your new password.',
  forgotpasswordpanel215: 'Reset-Code',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: 'Code from the email',
  forgotpasswordpanel237: 'New password',
  forgotpasswordpanel244: 'Enter password',
  forgotpasswordpanel245: 'Weak',
  forgotpasswordpanel246: 'Medium',
  forgotpasswordpanel247: 'Stark',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel252: 'Confirm password',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel259: 'Repeat password',
  forgotpasswordpanel272: 'Back',
  forgotpasswordpanel280: 'Reset password',
  forgotpasswordpanel291: 'Back to Login',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel76: 'Unauthorized. System admin access required.',
  languagemanagementpanel78: 'Failed to load languages:',
  languagemanagementpanel120: 'Are you sure you want to delete this language?',
  languagemanagementpanel121: 'Delete Language',
  languagemanagementpanel124: 'Yes',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel125: 'No',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel132: 'DELETE',
  languagemanagementpanel133: 'Language deleted successfully',
  languagemanagementpanel136: 'Failed to delete language:',
  languagemanagementpanel142: 'PATCH',
  languagemanagementpanel146: 'Failed to toggle language status:',
  languagemanagementpanel152: 'PATCH',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: 'Default language updated successfully',
  languagemanagementpanel156: 'Failed to set default language:',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: 'Language updated successfully',
  languagemanagementpanel173: 'Language created successfully',
  languagemanagementpanel178: 'Failed to save language:',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel183: '🇺🇸 United States',
  languagemanagementpanel184: '🇬🇧 United Kingdom',
  languagemanagementpanel185: '🇩🇪 Germany',
  languagemanagementpanel186: '🇫🇷 France',
  languagemanagementpanel187: '🇪🇸 Spain',
  languagemanagementpanel188: '🇮🇹 Italy',
  languagemanagementpanel189: '🇳🇱 Netherlands',
  languagemanagementpanel190: '🇵🇹 Portugal',
  languagemanagementpanel191: '🇷🇺 Russia',
  languagemanagementpanel192: '🇯🇵 Japan',
  languagemanagementpanel193: '🇰🇷 South Korea',
  languagemanagementpanel194: '🇨🇳 China',
  languagemanagementpanel195: '🇧🇷 Brazil',
  languagemanagementpanel196: '🇲🇽 Mexico',
  languagemanagementpanel197: '🇨🇦 Canada',
  languagemanagementpanel198: '🇦🇺 Australia',
  languagemanagementpanel199: '🇮🇳 India',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel214: 'Inactive',
  languagemanagementpanel223: 'System',
  languagemanagementpanel251: 'Activate',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: 'Set as Default',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: 'Cannot delete default language',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel291: 'Language Management',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: 'Add Language',
  languagemanagementpanel317: 'RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink',
  languagemanagementpanel324: 'No languages found',
  languagemanagementpanel326: 'Flag',
  languagemanagementpanel327: 'Code',
  languagemanagementpanel328: 'Name',
  languagemanagementpanel329: 'Native Name',
  languagemanagementpanel330: 'Status',
  languagemanagementpanel331: 'Sort Order',
  languagemanagementpanel332: 'Creator',
  languagemanagementpanel333: 'Description',
  languagemanagementpanel334: 'Actions',
  languagemanagementpanel340: 'Add New Language',
  languagemanagementpanel352: 'Cancel',
  languagemanagementpanel359: 'Create',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel371: 'Language Code *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: 'Please enter language code',
  languagemanagementpanel379: 'Code must be 5 characters or less',
  languagemanagementpanel380: 'Please enter valid language code (e.g.',
  languagemanagementpanel410: 'Select flag',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel423: 'English Name *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: 'Please enter language name',
  languagemanagementpanel431: 'Name must be 100 characters or less',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: 'e.g., English, German, French',
  languagemanagementpanel449: 'Native Name *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: 'Please enter native language name',
  languagemanagementpanel457: 'Native name must be 100 characters or less',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: 'e.g., English, Deutsch, Français',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: 'Description must be 1000 characters or less',
  languagemanagementpanel490: 'Optional description of the language',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel503: 'Sort Order *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: 'Please enter sort order',
  languagemanagementpanel511: 'Sort order must be 0 or greater',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel548: 'Default Language',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel44: 'Login failed',
  loginpanel74: 'An error occurred',
  loginpanel88: 'Login',

  // resources/js/Components/Panels/LoginPanel.tsx
  loginpanel106: 'E-Mail',
  loginpanel114: 'your.email@example.com',
  loginpanel122: 'Password',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel129: 'Your password',
  loginpanel141: 'Logging in...',
  loginpanel152: 'Don\'t have an account? Register',
  loginpanel160: 'Forgot password?',

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel61: 'Not authenticated',
  myapplicationspanel73: 'Failed to load applications',
  myapplicationspanel80: 'Error loading applications',
  myapplicationspanel87: 'de-DE',
  myapplicationspanel138: 'No message',
  myapplicationspanel164: 'View details',
  myapplicationspanel201: 'Loading applications...',
  myapplicationspanel213: 'My Applications',
  myapplicationspanel217: 'Refresh',
  myapplicationspanel228: 'Application History',
  myapplicationspanel232: 'No Applications',
  myapplicationspanel233: 'You haven\'t applied to any projects yet.',
  myapplicationspanel242: 'No applications found',
  myapplicationspanel248: 'Project',
  myapplicationspanel255: 'Message',
  myapplicationspanel261: 'Status',
  myapplicationspanel268: 'Applied',
  myapplicationspanel276: 'Response',
  myapplicationspanel282: 'Actions',
  myapplicationspanel292: 'Application Details',
  myapplicationspanel305: 'Project Information',
  myapplicationspanel322: 'Application Information',
  myapplicationspanel326: 'Status:',
  myapplicationspanel332: 'Applied:',
  myapplicationspanel338: 'Join Code:',
  myapplicationspanel348: 'Your Message:',
  myapplicationspanel358: 'Rejection',
  myapplicationspanel362: 'Reviewed by:',
  myapplicationspanel365: 'Date:',
  myapplicationspanel369: 'Response:',
  myapplicationspanel381: 'Close',

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel112: 'Back to Lobby',
  newnavigationpanel120: 'Welcome',
  newnavigationpanel128: 'Project',
  newnavigationpanel133: 'Project Management',
  newnavigationpanel138: 'Settings',
  newnavigationpanel142: 'Project settings',
  newnavigationpanel161: 'Teams',
  newnavigationpanel165: 'Team Management',
  newnavigationpanel170: 'Teams Assignment',
  newnavigationpanel184: 'Templates',
  newnavigationpanel188: 'Template management',
  newnavigationpanel193: 'Template Assignment',
  newnavigationpanel201: 'DB Schema Dependencies',
  newnavigationpanel211: 'My Applications',
  newnavigationpanel216: 'Public Projects',
  newnavigationpanel223: 'Database',
  newnavigationpanel228: 'Manage Databases',
  newnavigationpanel233: 'Designer',
  newnavigationpanel238: 'Schema Translation',
  newnavigationpanel246: 'Schema Import',
  newnavigationpanel251: 'Schema Export',
  newnavigationpanel258: 'Generator',
  newnavigationpanel263: 'Debug Manual Generator',
  newnavigationpanel268: 'Code Generation',
  newnavigationpanel273: 'Schema Migration',
  newnavigationpanel281: 'Administration',
  newnavigationpanel285: 'System Settings',
  newnavigationpanel290: 'Language Management',
  newnavigationpanel298: 'CMS Admin',
  newnavigationpanel315: 'Profile',
  newnavigationpanel320: 'Change Plan',
  newnavigationpanel325: 'Back to Lobby',
  newnavigationpanel333: 'Logout',
  newnavigationpanel357: 'Kanban Board 💰',
  newnavigationpanel359: 'Account',
  newnavigationpanel364: 'Login',
  newnavigationpanel369: 'Register',
  newnavigationpanel384: 'Collapse Menu',
  newnavigationpanel394: 'Navigation',
  newnavigationpanel413: 'Back to Lobby',
  newnavigationpanel422: 'Welcome',
  newnavigationpanel430: 'Project',
  newnavigationpanel437: 'Project Management',
  newnavigationpanel443: 'Settings',
  newnavigationpanel459: 'Project settings',
  newnavigationpanel469: 'Teams',
  newnavigationpanel477: 'Team Management',
  newnavigationpanel488: 'Teams Assignment',
  newnavigationpanel496: 'Templates',
  newnavigationpanel504: 'Template management',
  newnavigationpanel508: 'Template Assignment',
  newnavigationpanel513: 'DB Schema Dependencies',
  newnavigationpanel521: 'My Applications',
  newnavigationpanel525: 'Public Projects',
  newnavigationpanel533: 'Database',
  newnavigationpanel540: 'Manage Databases',
  newnavigationpanel544: 'Designer',
  newnavigationpanel548: 'Schema Translation',
  newnavigationpanel553: 'Schema Import',
  newnavigationpanel557: 'Schema Export',
  newnavigationpanel565: 'Generator',
  newnavigationpanel572: 'Debug Manual Generator',
  newnavigationpanel576: 'Code Generation',
  newnavigationpanel580: 'Schema Migration',
  newnavigationpanel589: 'Administration',
  newnavigationpanel596: 'System Settings',
  newnavigationpanel600: 'Language Management',
  newnavigationpanel605: 'CMS Admin',
  newnavigationpanel619: 'Account',
  newnavigationpanel635: '} text-gray-300`} title={isLoggedIn ? userName : ',
  newnavigationpanel644: 'Profile',
  newnavigationpanel648: 'Change Plan',
  newnavigationpanel652: 'Back to Lobby',
  newnavigationpanel672: 'Logout',
  newnavigationpanel679: 'Login',
  newnavigationpanel683: 'Register',

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: 'Unknown User',
  panelt1143: 'Databases',
  panelt1147: 'Databases',
  panelt1219: 'File Preview',
  panelt1222: 'File Preview',
  panelt1281: 'Error Loading Projects',
  panelt1287: 'Check Console for Errors',
  panelt1293: 'See browser console for details',
  panelt1416: 'File Preview',
  panelt1506: 'teamChanged',
  panelt1509: 'teamChanged',
  panelt1521: 'filePreviewUpdate',
  panelt1524: 'filePreviewUpdate',
  panelt1680: 'Project',
  panelt1696: 'Project',
  panelt1725: 'Table',
  panelt1786: '📁 Navigation',
  panelt1791: 'Expand All',
  panelt1798: 'Collapse All',
  panelt1809: 'Loading projects...',
  panelt1813: 'No projects found',
  panelt1833: 'Selected:',
  panelt1835: 'Name:',
  panelt1StandaloneTeams: 'Teams (unlinked)',
  panelt1StandaloneTemplates: 'Templates (unlinked)',
  panelt1StandaloneDatabases: 'Databases (unlinked)',
  panelt1MyTeams: 'My Teams',
  panelt1MyTemplates: 'My Templates',
  panelt1MyDatabases: 'My Databases',
  panelt1836: 'Type:',
  panelt1837: 'ID:',
  panelt1839: 'Path:',
  panelt1842: 'Project ID:',
  panelt1843: 'Path:',
  panelt1845: 'Team ID:',
  panelt1848: 'Role:',
  panelt1853: 'Template ID:',
  panelt1856: 'Table:',
  panelt1859: 'Language:',
  panelt1873: 'Total Items',
  panelt1879: 'Selected',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: 'Edit table',
  panelt2151: 'Delete table',
  panelt2179: 'No fields',
  panelt2405: 'Authentication required',
  panelt2439: 'Failed to load schemas',
  panelt2443: 'Authentication',
  panelt2551: 'Failed to load schema versions',
  panelt2602: 'Failed to load schema version',
  panelt2685: 'No version available. Please create a schema version first.',
  panelt2704: 'No version selected or version ID missing. Please select a schema version first.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: 'Failed to create table',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: 'No version selected or table to edit. Please select a schema version first.',
  panelt2806: 'Failed to update table',
  panelt2817: 'Failed to update table',
  panelt2826: 'No schema or version selected. Please select a schema first.',
  panelt2841: 'Failed to create new version',
  panelt2852: 'Failed to create new version',
  panelt2862: 'No schema or version selected. Please select a schema first.',
  panelt2877: 'Failed to create new version',
  panelt2888: 'Failed to create new version',
  panelt2898: 'No version selected. Please select a schema version first.',
  panelt2920: 'Failed to update version',
  panelt2930: 'No version selected. Please select a schema version first.',
  panelt2952: 'Failed to update version',
  panelt21001: 'Failed to delete table',
  panelt21010: 'Failed to delete table',
  panelt21030: 'No table selected for deletion',
  panelt21054: 'Failed to create version and delete table',
  panelt21075: 'Failed to create new version and delete table',
  panelt21101: 'No table selected for deletion',
  panelt21122: 'Failed to delete table',
  panelt21133: 'No schema selected',
  panelt21144: 'Create New Version',
  panelt21153: 'Not authenticated',
  panelt21170: 'Failed to create new version',
  panelt21185: 'Failed to create new version',
  panelt21231: 'Not authenticated',
  panelt21245: 'Failed to delete foreign key',
  panelt21270: 'Failed to delete foreign key',
  panelt21282: '🗃️ Database Designer',
  panelt21289: 'Loading schema versions...',
  panelt21291: 'No schema selected',
  panelt21292: 'No project selected',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: 'No Project Selected',
  panelt21350: '🔄 Refresh',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: 'Create a new version (copies current version)',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21359: '➕ New Version',
  panelt21375: '✨ New Table',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21402: 'Loading schema...',
  panelt21439: 'positionAbsolute',
  panelt21511: 'Authentication',
  panelt21515: 'Authentication Required',
  panelt21516: 'Your session has expired. Please login to access schema data.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21517: 'Use the navigation menu to log in again',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21525: 'No Schema Data',
  panelt21528: 'Select a project to view schemas',
  panelt21530: 'No schemas associated with this project',
  panelt21531: 'Select a schema to visualize database structure',
  panelt21549: '🔍 Table Details',
  panelt21552: 'Table:',
  panelt21556: 'Fields:',
  panelt21560: 'Constraints:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21564: 'Primary Keys:',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: 'create a new table',
  panelt21600: 'Current',
  panelt21629: 'Foreign Key Actions',
  panelt21635: 'From:',
  panelt21639: 'To:',
  panelt21654: 'Edit FK coming in Phase 2! 🚀',
  panelt21689: 'Delete Foreign Key',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21692: 'Are you sure you want to delete this foreign key constraint?',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21699: 'Constraint:',
  panelt21703: 'From:',
  panelt21707: 'To:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21714: '⚠️ A new version will be created for this change.',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21736: 'Delete Foreign Key',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesCategoryAll: 'All Categories',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt367: 'All',
  panelt375: 'Not authenticated',
  panelt390: 'Failed to load templates',
  panelt3103: 'Error loading templates',
  panelt3115: 'Not authenticated',
  panelt3148: 'Error loading project templates',
  panelt3158: 'languageChanged',
  panelt3161: 'languageChanged',
  panelt3201: 'Not authenticated',
  panelt3219: 'Failed to assign templates',
  panelt3231: 'Error assigning templates',
  panelt3245: 'Not authenticated',
  panelt3250: 'DELETE',
  panelt3272: 'Error removing template',
  panelt3287: 'All',
  panelt3295: 'All Categories',
  panelt3296: 'Web',
  panelt3297: 'Mobile',
  panelt3298: 'API',
  panelt3299: 'Desktop',
  panelt3300: 'Database',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesLoadingText: 'Loading templates...',
  templatesAssignmentTitle: 'Templates Assignment',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3323: 'by ',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesWorkingOn: 'by ',
  templatesSelectProjectHint: 'Please select a project from the navigation to manage templates',
  templatesSearchPlaceholder: 'Search templates...',
  templatesFilterCategory: 'Filter by category',
  templatesNoTemplatesFound: 'No templates found',
  templatesSelectedCount: 'selected',
  templatesRemoveFromProject: 'Remove from project',
  templatesColumnName: 'Template Name',
  templatesColumnDescription: 'Description',
  templatesColumnCategory: 'Category',
  templatesColumnLanguage: 'Language',
  templatesColumnStatus: 'Status',
  templatesStatusInactive: 'Inactive',
  templatesStatusActive: 'Active',
  templatesColumnCreated: 'Created',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3471: 'de-DE',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesClearSelection: 'Clear Selection',
  templatesAssignButton: 'Assign Templates',

  // resources/js\Components\Panels\PanelT5.tsx
  panelt538: 'Database',
  panelt544: 'Website Redesign',
  panelt555: 'Mobile App',
  panelt567: 'Modal.tsx',
  panelt572: 'README.md',
  panelt577: 'Documents',
  panelt582: 'Contract.docx',
  panelt585: 'Reports',
  panelt588: 'Q1-Report.xlsx',
  panelt589: 'Q2-Report.xlsx',
  panelt596: 'Assets',
  panelt5235: '📁 Database Explorer',
  panelt5240: 'Expand All',
  panelt5247: 'Collapse All',
  panelt5271: 'Selected:',
  panelt5273: 'Name:',
  panelt5274: 'Type:',
  panelt5275: 'ID:',
  panelt5286: 'Total Items',
  panelt5292: 'Selected',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel47: 'Not authenticated',
  profilepanel58: 'User data could not be loaded',
  profilepanel69: 'An error has occurred',
  profilepanel84: 'Not authenticated',
  profilepanel100: 'Profile could not be updated',
  profilepanel103: 'Profile successfully updated',
  profilepanel107: 'An error has occurred',
  profilepanel121: 'New passwords do not match',
  profilepanel129: 'Not authenticated',
  profilepanel145: 'Password could not be changed',
  profilepanel148: 'Password successfully changed',
  profilepanel156: 'An error has occurred',
  profilepanel181: '{user?.email}',
  profilepanel200: 'Edit profile',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel204: 'Name',
  profilepanel218: 'E-Mail',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel234: 'Update profile',
  profilepanel242: 'Change Password',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel246: 'Current Password',
  profilepanel263: 'New password',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel276: 'Enter password',
  profilepanel277: 'Weak',
  profilepanel278: 'Medium',
  profilepanel279: 'Stark',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel284: 'Confirm new password',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel302: 'Change...',
  profilepanel310: 'Account Info',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel314: 'User ID',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel317: '{user?.id}',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel321: 'Registered since',
  profilepanel330: 'Email verified',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel355: 'Never registered',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel118: 'd.m.Y',
  projectpanel119: 'Current: ',
  projectpanel121: 'Europe/Vienna',
  projectpanel224: 'Project names may only contain lowercase letters (a-z)',
  projectpanel232: 'Not authenticated',
  projectpanel253: 'Project names may only contain lowercase letters (a-z)',
  projectpanel258: 'Failed to create project',
  projectpanel293: 'd.m.Y',
  projectpanel294: 'H:i:s',
  projectpanel296: 'Europe/Vienna',
  projectpanel298: 'Project created successfully',
  projectpanel301: 'projectChanged',
  projectpanel304: 'Error creating project',
  projectpanel330: 'd.m.Y',
  projectpanel331: 'H:i:s',
  projectpanel333: 'Europe/Vienna',
  projectpanel348: 'Not authenticated',
  projectpanel352: 'DELETE',
  projectpanel361: 'Failed to delete project',
  projectpanel369: 'Project deleted successfully',
  projectpanel372: 'Error deleting project',
  projectpanel390: 'de-DE',
  projectpanel405: 'Not authenticated',
  projectpanel416: 'Failed to load teams',
  projectpanel451: 'Not authenticated',
  projectpanel462: 'Failed to load schemas',
  projectpanel492: 'Not authenticated',
  projectpanel539: 'Active',
  projectpanel562: 'Project Overview',
  projectpanel575: 'Manage members',
  projectpanel583: 'Edit project',
  projectpanel589: 'Delete project',
  projectpanel601: 'Loading projects...',
  projectpanel615: 'Project Management',
  projectpanel626: 'New Project',
  projectpanel634: 'Join Project',
  projectpanel642: 'Refresh',
  projectpanel671: 'Current Project',
  projectpanel678: 'Edit project',
  projectpanel692: 'No description provided',
  projectpanel698: 'Owner:',
  projectpanel706: 'Created:',
  projectpanel716: 'Join Code',
  projectpanel724: 'Copy join code',
  projectpanel730: 'Private',
  projectpanel742: 'Teams',
  projectpanel748: 'Members',
  projectpanel754: 'Templates',
  projectpanel760: 'Databases',
  projectpanel766: 'Applications',
  projectpanel773: 'No Active Project',
  projectpanel774: 'You don\'t have an active project yet.',
  projectpanel776: 'Create Project',
  projectpanel786: 'Quick Actions',
  projectpanel789: 'Applications',
  projectpanel796: 'Project Members',
  projectpanel803: 'Teams Management',
  projectpanel815: 'Invitations',
  projectpanelAttachments: 'Attachments',
  projectpanelKanban: 'Kanban Board',
  navAgileMethod: 'Agile Methods',
  projectExport: 'Export',
  projectImport: 'Import',
  projectpanel822: 'Templates',
  projectpanel838: 'Database',
  projectpanel850: 'All Projects',
  projectpanel854: 'No projects found',
  projectpanel859: 'Project',
  projectpanel862: 'Owner',
  projectpanel868: 'Created',
  projectpanel874: 'Status',
  projectpanel879: 'Actions',
  projectpanel892: 'Create New Project',
  projectpanel904: 'Project Settings',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel907: 'Project Name *',
  projectpanel931: 'Description',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: 'Enter project description (optional)',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel955: 'Public Project',
  projectpanel959: 'Public projects are visible to all users and can be discovered in the project gallery.',
  projectpanel972: 'Allow Join Requests',
  projectpanel976: 'Users can request to join this project using a join code.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel984: 'Database Connection',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel987: 'Database Name',
  projectpanel998: 'Name of the database for this project',
  projectpanel1004: 'Database Type',
  projectpanel1024: 'Server',
  projectpanel1038: 'Port',
  projectpanel1053: 'Username',
  projectpanel1067: 'Password',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1084: 'Project Properties',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1087: 'Project Directory',
  projectpanel1098: 'Path where generated files should be saved',
  projectpanel1104: 'Project URL',
  projectpanel1115: 'URL for accessing the project',
  projectpanel1121: 'Start Page',
  projectpanel1128: 'index.php',
  projectpanel1138: 'Default Language',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1146: 'English',
  projectpanel1147: 'German',
  projectpanel1148: 'French',
  projectpanel1149: 'Español',
  projectpanel1150: 'Italian',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1155: 'Standard language for project generation',
  projectpanel1161: 'Filename Short Length',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1185: 'Localization Settings',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1189: 'Decimal Separator',
  projectpanel1207: 'Thousands Separator',
  projectpanel1227: 'Date Format',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1234: 'd.m.Y',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1244: 'Time Format',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1251: 'H:i:s',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: 'Currency Symbol',
  projectpanel1281: 'Timezone',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1289: 'Europe/Vienna',
  projectpanel1290: 'Europe/Berlin',
  projectpanel1291: 'Europe/Zurich',
  projectpanel1292: 'Europe/London',
  projectpanel1293: 'Europe/Paris',
  projectpanel1294: 'America/New_York',
  projectpanel1295: 'America/Los_Angeles',
  projectpanel1296: 'Asia/Tokyo',
  projectpanel1297: 'Australia/Sydney',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1303: 'Default time zone for project',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1325: 'Cancel',
  projectpanel1332: 'Create Project',
  projectpanel1342: 'Delete Project',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: 'Are you sure you want to delete this project?',
  projectpanel1362: 'This action will permanently delete the project and all its data. This cannot be undone! Teams, templates, and databases associated with this project will remain intact.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1371: 'Cancel',
  projectpanel1378: 'Delete Project',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1434: '📋 Project Properties',
  projectpanel1437: 'Name:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1440: '📋 Project Properties',
  projectpanel1443: 'Name:',
  projectpanel1447: 'Owner:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: 'Join Code:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: 'Created:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: 'Description:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1455: 'Join Code:',
  projectpanel1459: 'Description:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1461: '👤 Project Members',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: '👤 Project Members',
  projectpanel1471: 'Loading members...',
  projectpanel1481: 'Unknown User',
  projectpanel1482: 'No email',
  projectpanel1491: 'Member',
  projectpanel1513: '👥 Teams & Members',
  projectpanel1517: 'Loading teams...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1529: '🗄️ Database Schemas',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: '🗄️ Database Schemas',
  projectpanel1539: 'Loading schemas...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1542: 'No database schemas linked to this project yet.',
  projectpanel1550: '📄 Linked Templates',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: '📄 Linked Templates',
  projectpanel1560: 'Loading templates...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1563: 'No templates linked to this project yet.',
  projectpanel1573: 'Close',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: 'Manage Project',
  projectpanel1585: 'Manage Project',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: 'd.m.Y',
  projectsettingspanel65: 'H:i:s',
  projectsettingspanel67: 'Europe/Vienna',
  projectsettingspanel143: 'd.m.Y',
  projectsettingspanel144: 'H:i:s',
  projectsettingspanel146: 'Europe/Vienna',
  projectsettingspanel151: 'Error loading project data',
  projectsettingspanel190: 'No project selected',
  projectsettingspanel209: 'Not authenticated',
  projectsettingspanel225: 'Failed to update project',
  projectsettingspanel243: 'Failed to save language settings',
  projectsettingspanel246: 'Project settings saved successfully',
  projectsettingspanel251: 'Error saving project settings',
  projectsettingspanel258: 'PROJ-',
  projectsettingspanel275: 'Please select a project',
  projectsettingspanel276: 'selectedProject is null',
  projectsettingspanel277: '🔍 ProjectSettingsPanel loaded but no project selected',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel295: 'Project settings',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: 'Save all changes',
  projectsettingspanel313: 'Common',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: 'Project name *',
  projectsettingspanel331: 'Description',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel338: 'Enter project description',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel344: 'Join code',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel351: 'Join code (optional)',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel359: 'Users can join this project with this code',
  projectsettingspanel375: 'Make this project visible to all users',
  projectsettingspanel382: 'Transfer ownership',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel405: 'Database',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel408: 'Database name',
  projectsettingspanel420: 'Database type',
  projectsettingspanel463: 'User name',
  projectsettingspanel475: 'Password',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel489: 'Characteristics',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel492: 'Project directory',
  projectsettingspanel501: 'Path where generated files should be saved',
  projectsettingspanel507: 'Project URL',
  projectsettingspanel516: 'URL for accessing the project',
  projectsettingspanel522: 'Home',
  projectsettingspanel537: 'Default language',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel544: 'English',
  projectsettingspanel545: 'German',
  projectsettingspanel546: 'French',
  projectsettingspanel547: 'Español',
  projectsettingspanel548: 'Italian',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: 'Standard language for project generation',
  projectsettingspanel558: 'File name short length',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel565: '2 characters',
  projectsettingspanel566: '3 characters',
  projectsettingspanel567: '4 characters',
  projectsettingspanel568: '5 characters',
  projectsettingspanel578: 'Localization',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: 'Decimal separator',
  projectsettingspanel592: 'e.g. \',\' for 1.23 or \'.\' for 1.23',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel593: 'for 1.23 or',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: 'Thousands separator',
  projectsettingspanel608: 'e.g. \'.\' for 1,234 or \',\' for 1,234',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel609: 'for 1,234 or',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: 'Date format',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel622: 'd.m.Y',
  projectsettingspanel626: 'd.m.Y',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: 'Time format',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel637: 'H:i:s',
  projectsettingspanel639: 'Current owner',
  projectsettingspanel641: 'H:i:s',
  projectsettingspanel644: '⚠️ Warning: You will lose your ownership rights after the transfer!',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel658: 'z.B. \'€\', \'$\', \'£\', \'CHF\'',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel659: 'CHF',
  projectsettingspanel671: 'Europe/Vienna',
  projectsettingspanel672: 'Europe/Berlin',
  projectsettingspanel673: 'Europe/Zurich',
  projectsettingspanel674: 'Europe/London',
  projectsettingspanel675: 'America/New_York',
  projectsettingspanel676: 'America/Chicago',
  projectsettingspanel677: 'America/Los_Angeles',
  projectsettingspanel678: 'Asia/Tokyo',
  projectsettingspanel679: 'Asia/Dubai',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel680: 'UTC',
  projectsettingspanel689: 'Google Translate API key',
  projectsettingspanel700: 'API key for automatic translations via Google Translate',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: 'Languages',
  projectsettingspanel727: 'Available languages',
  projectsettingspanel728: 'Activated languages',
  projectsettingspanel733: 'Seek...',
  projectsettingspanel734: 'Diagram Settings',
  projectsettingspanel738: 'Configure the default settings for automatic diagram layout. These values ​​will be used for the "Sort the Diagram" button.',
  projectsettingspanel739: 'Selected languages:',
  projectsettingspanel742: 'No languages selected',
  projectsettingspanel744: 'Max. tables per row',
  projectsettingspanel753:  'Maximum number of tables in one row',
  projectsettingspanel758:  'Table width (px)',
  projectsettingspanel767:  'Width of the table boxes in the diagram',
  projectsettingspanel772:  'Table height (px)',
  projectsettingspanel781:  'Maximum height of table boxes',
  projectsettingspanel786:  'Horizontal spacing (px)',
  projectsettingspanel795:  'Horizontal spacing between tables',
  projectsettingspanel800:  'Vertical spacing (px)',
  projectsettingspanel809:  'Vertical spacing between lines',
  projectsettingspanel814:  'Preview values:',
  projectsettingspanel816:  'Preview values:',
  projectsettingspanel817:  'Maximum tables per row:',
  projectsettingspanel818:  'Table size:',
  projectsettingspanel818a: 'horizontal',
  projectsettingspanel818b: 'vertical',
  projectsettingspanel866:  'Main entry file (e.g., index.php, main.py, app.js)',
  projectsettingspanel872:  'Standard language',
  projectsettingspanel893:  'Archive-Format',
  projectsettingspanel906:  'Format for generated code archives (ZIP for Windows, TAR.GZ/XZ for Linux)',
  projectsettingspanel926:  'Length of short filenames in the Database Designer (e.g., "us" for users)',
  projectsettingspanel946:  'e.g. "," for 1.23 or "." for 1.23',
  projectsettingspanel962:  'e.g. "." for 1.234 or "," for 1,234',
  projectsettingspanel979:  'PHP format (e.g. "d.m.Y" for 31.12.2024)',
  projectsettingspanel995:  'PHP format (e.g. "H:i:s" for 14:30:00)',
  projectsettingspanel1012: 'e.g. "€", "$", "£", "CHF"',
  projectsettingspanel1058: 'Google Cloud Console - Create API Key',
  projectsettingspanel1068: 'Select the languages to use for code generation in this project. Move the desired languages to the right and use the arrow keys to change their order.',
  projectsettingspanel1111: 'Here you can enter the values for custom template variables. These variables were defined by the template developer and can differ for each language.',
  projectsettingspanel1122: 'No template variables were found. Template developers can define custom variables in their templates.',
  projectsettingspanel1129: 'Language for variables',
  projectsettingspanel932: 'Localization',
  projectsettingspanel1108: 'Template variables',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel85: 'Not authenticated',
  publicprojectspanel97: 'Failed to load public projects',
  publicprojectspanel104: 'Error loading public projects',
  publicprojectspanel111: 'de-DE',
  publicprojectspanel183: 'Failed to clone project',
  publicprojectspanel186: 'Failed to clone project',
  publicprojectspanel210: 'Loading public projects...',
  publicprojectspanel222: 'Public Projects',
  publicprojectspanel227: 'Join with Code',
  publicprojectspanel234: 'Refresh',
  publicprojectspanel253: 'Search projects by name, description, or owner...',
  publicprojectspanel266: 'No public projects',
  publicprojectspanel270: 'Try adjusting your search terms.',
  publicprojectspanel271: 'There are no public projects available at the moment.',
  publicprojectspanel276: 'Clear Search',
  publicprojectspanel296: 'Public',
  publicprojectspanel316: 'No description provided.',
  publicprojectspanel338: 'Your Project',
  publicprojectspanel342: 'This is your own project. Use the Projects tab to duplicate it.',
  publicprojectspanel346: 'Clone Project',
  publicprojectspanel366: 'Total Projects',
  publicprojectspanel372: 'Accepting Members',
  publicprojectspanel378: 'Showing',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel411: 'Project Name *',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: 'Enter project name',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel426: 'Description',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel433: 'Enter project description',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: 'Public Project',
  publicprojectspanel452: 'Public projects are visible to all users and can be discovered in the project gallery.',
  publicprojectspanel455: '💡 Note: Private projects may require premium features.',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel463: 'Original Project:',
  publicprojectspanel474: 'Cancel',
  publicprojectspanel481: 'Clone Project',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel31: 'Passwords do not match',
  registerpanel54: 'Registration failed',
  registerpanel57: 'Registration successful! You can now log in.',
  registerpanel75: 'An error has occurred',
  registerpanel90: 'Register',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel115: 'Name',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel123: 'Your full name',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel131: 'E-Mail',
  registerpanel139: 'your.email@example.com',
  registerpanel147: 'password',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel154: 'At least 8 characters',
  registerpanel161: 'Enter password',
  registerpanel162: 'Weak',
  registerpanel163: 'Medium',
  registerpanel164: 'Stark',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel169: 'Confirm password',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel176: 'Repeat password',
  registerpanel188: 'Registration is in progress...',
  registerpanel198: 'Already have an account? Sign in',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel104: 'Failed to load languages:',
  schematranslationpanel133: 'Failed to load schema structure:',
  schematranslationpanel281: 'Please select at least one language',
  schematranslationpanel289: 'Not authenticated',
  schematranslationpanel303: 'Failed to export translations',
  schematranslationpanel317: 'Translations exported successfully',
  schematranslationpanel319: 'Unknown error',
  schematranslationpanel334: 'Please select a file and at least one language',
  schematranslationpanel342: 'Not authenticated',
  schematranslationpanel364: 'Failed to import translations',
  schematranslationpanel377: 'Failed to import:',
  schematranslationpanel385: 'No project selected',
  schematranslationpanel449: 'Please select at least one target language',
  schematranslationpanel459: 'Not authenticated',
  schematranslationpanel481: 'Auto-translate failed:',
  schematranslationpanel505: 'Translation failed',
  schematranslationpanel640: 'Table',
  schematranslationpanel648: 'Field',
  schematranslationpanel662: 'Select an item to translate',
  schematranslationpanel663: 'Choose a table or field from the schema tree to manage its translations',
  schematranslationpanel682: 'Manage translations for this {itemInfo.type.toLowerCase()}',
  schematranslationpanel688: 'Auto-saving...',
  schematranslationpanel701: '>No translations found for ',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel702: 'Enter translations below to create new entries. They will be auto-saved after 1 second of inactivity.',
  schematranslationpanel743: 'Schema Translation Manager',
  schematranslationpanel746: 'Translate database table and field names for internationalization',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: 'Export',
  schematranslationpanel762: 'Import',
  schematranslationpanel771: 'Auto-Translate',
  schematranslationpanel791: 'Database Schema',
  schematranslationpanel802: 'Expand All',
  schematranslationpanel812: 'Collapse All',
  schematranslationpanel818: 'Select tables and fields to translate',
  schematranslationpanel820: 'Project: ',
  schematranslationpanel827: 'Please select a project first',
  schematranslationpanel830: 'Loading schema...',
  schematranslationpanel834: 'No schema tables found',
  schematranslationpanel835: 'This project has no schema data to translate',
  schematranslationpanel908: 'Export Translations to Excel',
  schematranslationpanel922: 'Export for {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel923: 'Select languages to include in the Excel export. The export will contain all tables and fields from linked databases.',
  schematranslationpanel931: 'Select Languages *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel938: 'Select languages to export',
  schematranslationpanel950: 'Cancel',
  schematranslationpanel957: 'Export to Excel',
  schematranslationpanel969: 'Import Translations from Excel',
  schematranslationpanel986: 'Import for {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel987: 'Upload an Excel file with translations. Select which languages to import.',
  schematranslationpanel995: 'Upload Excel File *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1006: 'Choose Excel File',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1015: 'Select Languages to Import *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: 'Select languages to import',
  schematranslationpanel1034: 'Cancel',
  schematranslationpanel1044: 'Import Translations',
  schematranslationpanel1056: 'Auto-Translate with Google Translate',
  schematranslationpanel1074: 'Auto-Translate',
  schematranslationpanel1078: 'All tables and fields with the source language will be translated automatically.',
  schematranslationpanel1079: 'Select the source language (must already be filled in) and target languages for translation.',
  schematranslationpanel1090: 'translateAll',
  schematranslationpanel1103: '🚀 Translate all tables and fields',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1113: 'Source Language *',
  schematranslationpanel1139: 'Target Languages *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: 'Select target languages',
  schematranslationpanel1195: 'Cancel',
  schematranslationpanel1205: 'Translate Now',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel48: 'Failed to load settings:',
  systemsettingspanel67: 'Settings updated successfully!',
  systemsettingspanel69: 'Failed to update settings:',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel86: '⚙️ System Settings',
  systemsettingspanel89: 'Configure global system settings for Scoriet',
  systemsettingspanel99: '🌍 Google Translate API',
  systemsettingspanel102: 'Configure the global Google Translate API key for Business plan users',
  systemsettingspanel107: 'Global API Key',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: 'Enter Google Translate API key...',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel132: '💰 Subscription Pricing',
  systemsettingspanel135: 'Set monthly subscription prices for each plan tier',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel148: 'Please enter Premium price',
  systemsettingspanel149: 'Price must be positive',
  systemsettingspanel157: 'USD',
  systemsettingspanel180: 'Please enter Business price',
  systemsettingspanel181: 'Price must be positive',
  systemsettingspanel189: 'USD',
  systemsettingspanel212: 'Please enter Patron minimum price',
  systemsettingspanel213: 'Price must be positive',
  systemsettingspanel221: 'USD',
  systemsettingspanel242: 'Reset',
  systemsettingspanel251: 'Save Settings',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel105: 'Not authenticated',
  teammanagementpanel143: 'Not authenticated',
  teammanagementpanel155: 'Failed to load teams',
  teammanagementpanel174: 'Error',
  teammanagementpanel175: 'Failed to load teams',
  teammanagementpanel200: 'Delete Team',
  teammanagementpanel208: 'Not authenticated',
  teammanagementpanel212: 'DELETE',
  teammanagementpanel221: 'Failed to delete team',
  teammanagementpanel226: 'Success',
  teammanagementpanel227: 'Team deleted successfully',
  teammanagementpanel234: 'teamChanged',
  teammanagementpanel239: 'Error',
  teammanagementpanel240: 'Failed to delete team',
  teammanagementpanel258: 'Success',
  teammanagementpanel259: 'Team created successfully',
  teammanagementpanel264: 'teamChanged',
  teammanagementpanel277: 'New Team',
  teammanagementpanel291: 'Search teams here...',
  teammanagementpanel316: 'Unknown',
  teammanagementpanel334: 'Inactive',
  teammanagementpanel361: 'No Projects',
  teammanagementpanel368: 'de-DE',
  teammanagementpanel386: 'Manage Members',
  teammanagementpanel394: 'Edit Team',
  teammanagementpanel400: 'Delete Team',
  teammanagementpanel416: 'Team Management',

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: 'Create, manage, and organize your teams. Assign team members and control access permissions.',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: 'No teams found',
  teammanagementpanel451: 'Team Name',
  teammanagementpanel458: 'Owner',
  teammanagementpanel465: 'Members',
  teammanagementpanel471: 'Status',
  teammanagementpanel478: 'Projects',
  teammanagementpanel485: 'Created',
  teammanagementpanel491: 'Actions',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old97: 'No authentication token found',
  teamspanel_old147: 'An error occurred',
  teamspanel_old192: 'Failed to accept invitation',
  teamspanel_old216: 'Failed to decline invitation',
  teamspanel_old225: 'Loading teams...',
  teamspanel_old236: 'Error Loading Teams',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old241: 'Retry',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old263: 'Create Team',
  teamspanel_old270: 'Owned Teams',
  teamspanel_old271: 'Member Of',
  teamspanel_old272: 'Invitations',
  teamspanel_old297: 'No Teams Yet',
  teamspanel_old298: 'Create your first team to start collaborating',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old316: 'Owner',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old360: 'Not a Member of Any Teams',
  teamspanel_old361: 'You\'ll see teams you\'re invited to join here',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old373: 'Member',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old415: 'No Pending Invitations',
  teamspanel_old416: 'Team invitations will appear here',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel91: 'Not authenticated',
  teamspanel128: 'Error loading data',
  teamspanel172: 'Error loading project teams',
  teamspanel182: 'Not authenticated',
  teamspanel193: 'Failed to load projects',
  teamspanel199: 'Error loading projects',
  teamspanel227: 'Not authenticated',
  teamspanel238: 'Failed to load teams',
  teamspanel255: 'Error loading teams',
  teamspanel270: 'Not authenticated',
  teamspanel295: 'Failed to assign teams',
  teamspanel347: 'teamChanged',
  teamspanel349: '  teams assigned to projects successfully',
  teamspanel350: 'Error assigning teams',
  teamspanel364: 'Not authenticated',
  teamspanel368: 'DELETE',
  teamspanel420: 'teamChanged',
  teamspanel425: 'Error removing team',
  teamspanel430: 'removed from project successfully',
  teamspanel451: 'Loading teams...',
  teamspanel457: 'Project Teams',
  teamspanel487: 'Search projects or teams...',

  // resources/js/Components/Panels/TeamsPanel.tsx
  teamspanel494: 'No projects found',
  teamspanel527: 'No teams available for this project',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel544: 'Unknown',
  teamspanel552: 'Unassigned',
  teamspanel557: 'Assigned',
  teamspanel563: 'Remove from project',
  teamspanel608: 'Clear Selection',
  teamspanel619: 'Assign Team(s) to Projects',
  teamspanel630: 'No teams found',
  teamspanel675: 'Remove from project',
  teamspanel697: 'Team Name',
  teamspanel698: 'Description',
  teamspanel701: 'Owner',
  teamspanel705: 'Unknown',
  teamspanel711: 'Members',
  teamspanel721: 'Status',
  teamspanel726: 'Inactive',
  teamspanel732: 'Created',
  teamspanel733: 'de-DE',
  teamspanel745: 'Clear Selection',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: 'Failed to load DB schemas',
  templatedbschemadependenciespanel123: 'DB schema dependency added successfully',
  templatedbschemadependenciespanel128: 'Failed to add dependency',
  templatedbschemadependenciespanel132: 'Failed to add dependency',
  templatedbschemadependenciespanel144: 'Add DB Schema Dependency',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel158: 'Database Schema *',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: 'Please select a database schema',
  templatedbschemadependenciespanel176: 'Select a database schema',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel203: 'Required Dependency',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: 'Enter an alias for this DB schema in the template',
  templatedbschemadependenciespanel242: 'Cancel',
  templatedbschemadependenciespanel248: 'Add Dependency',
  templatedbschemadependenciespanel324: 'Failed to load templates',
  templatedbschemadependenciespanel346: 'Failed to load template dependencies',
  templatedbschemadependenciespanel350: 'Failed to load template dependencies',
  templatedbschemadependenciespanel364: 'DELETE',
  templatedbschemadependenciespanel367: 'Dependency removed successfully',
  templatedbschemadependenciespanel372: 'Failed to remove dependency',
  templatedbschemadependenciespanel376: 'Failed to remove dependency',
  templatedbschemadependenciespanel390: 'Inactive',
  templatedbschemadependenciespanel404: 'View Only',
  templatedbschemadependenciespanel405: 'You can only edit your own templates',
  templatedbschemadependenciespanel415: 'Manage',
  templatedbschemadependenciespanel440: 'Required',
  templatedbschemadependenciespanel442: 'Optional',
  templatedbschemadependenciespanel457: 'Read-only template',
  templatedbschemadependenciespanel469: 'Remove Dependency',
  templatedbschemadependenciespanel483: 'Template - DB Schema Dependencies',
  templatedbschemadependenciespanel496: 'Templates',
  templatedbschemadependenciespanel504: 'All',
  templatedbschemadependenciespanel505: 'System',
  templatedbschemadependenciespanel506: 'Public',
  templatedbschemadependenciespanel507: 'Project',
  templatedbschemadependenciespanel517: 'Search templates...',
  templatedbschemadependenciespanel527: 'No templates available',
  templatedbschemadependenciespanel536: 'Template',
  templatedbschemadependenciespanel541: 'Actions',
  templatedbschemadependenciespanel559: 'Add',
  templatedbschemadependenciespanel570: 'No DB schema dependencies',
  templatedbschemadependenciespanel578: 'Database Schema',
  templatedbschemadependenciespanel583: 'Status',
  templatedbschemadependenciespanel588: 'Actions',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel595: 'Select a template to view its DB schema dependencies',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager108: 'Create',
  templatefilemanager116: 'File successfully deleted',
  templatefilemanager120: 'Error deleting file',
  templatefilemanager131: 'Error moving file',
  templatefilemanager137: 'Are you sure you want to delete this file?',
  templatefilemanager138: 'Delete file?',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager141: 'And',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: 'No',
  templatefilemanager175: 'Up',
  templatefilemanager185: 'Downward',
  templatefilemanager195: 'Edit',
  templatefilemanager205: 'Delete',
  templatefilemanager216: 'Manage template files',
  templatefilemanager220: 'New file',
  templatefilemanager227: 'Close',
  templatefilemanager241: 'No files available',
  templatefilemanager243: 'Name',
  templatefilemanager244: 'Typ',
  templatefilemanager245: 'Series',
  templatefilemanager246: 'Size',
  templatefilemanager247: 'Actions',
  templatefilemanager252: 'Create new file',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager265: 'File name *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager271: 'Please enter file name!',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: 'e.g., Model.php, component.tsx',
  templatefilemanager288: 'Type *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager294: 'Please select type!',
  templatefilemanager301: 'Select type',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager335: 'File content *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager341: 'Please enter file contents!',
  templatefilemanager347: 'Enter template code here...',
  templatefilemanager361: 'Cancel',
  templatefilemanager368: 'Create',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: 'All',
  templatemanagementpanel113: 'Database',
  templatemanagementpanel115: 'Static File',
  templatemanagementpanel116: 'Static directory as ZIP archive',
  templatemanagementpanel117: 'Project-specific file with placeholders',
  templatemanagementpanel118: 'DB Table File',
  templatemanagementpanel119: 'Project-specific file with language support',
  templatemanagementpanel120: 'File per database table with language support',
  templatemanagementpanel135: 'Template management',
  templatemanagementpanel150: 'Error loading templates. Please log in first.',
  templatemanagementpanel202: 'Error loading template details',
  templatemanagementpanel211: 'Template permanently deleted',
  templatemanagementpanel216: 'Error while permanently deleting the template',
  templatemanagementpanel230: 'Error changing template status',
  templatemanagementpanel286: 'Template successfully cloned',
  templatemanagementpanel291: 'Error cloning template',
  templatemanagementpanel335: 'Create',
  templatemanagementpanel340: 'Save',
  templatemanagementpanel359: 'Template saved successfully',
  templatemanagementpanel395: 'Error saving template',
  templatemanagementpanel410: 'Template successfully imported',
  templatemanagementpanel413: 'Error importing template',
  templatemanagementpanel419: 'A template with this name already exists. Do you want to overwrite it?',
  templatemanagementpanel420: 'Template already exists',
  templatemanagementpanel428: 'Template successfully imported and overwritten',
  templatemanagementpanel433: 'Error overwriting the template',
  templatemanagementpanel436: 'Ja',
  templatemanagementpanel437: 'Cancel',
  templatemanagementpanel441: 'Error importing template',
  templatemanagementpanel464: 'Template successfully exported',
  templatemanagementpanel467: 'Error exporting template',
  templatemanagementpanel485: 'No template selected',
  templatemanagementpanel517: 'Error deleting file',
  templatemanagementpanel521: 'Error deleting file:',
  templatemanagementpanel527: 'No template selected',
  templatemanagementpanel595: 'added',
  templatemanagementpanel597: 'Error saving file',
  templatemanagementpanel601: 'Error saving file:',
  templatemanagementpanel613: 'Template management',
  templatemanagementpanel618: 'New template',
  templatemanagementpanel624: 'Import',
  templatemanagementpanel646: 'Search templates...',
  templatemanagementpanel653: 'Kategorie',
  templatemanagementpanel667: 'No templates found',
  templatemanagementpanel669: '{first} to {last} of {totalRecords} templates',
  templatemanagementpanel672: 'Name',
  templatemanagementpanel675: 'Kategorie',
  templatemanagementpanel684: 'Language',
  templatemanagementpanel693: 'Tags',
  templatemanagementpanel706: 'Files',
  templatemanagementpanel711: 'Status',
  templatemanagementpanel716: 'Aktiv',
  templatemanagementpanel721: 'Typ',
  templatemanagementpanel736: 'Private',
  templatemanagementpanel743: 'Created',
  templatemanagementpanel744: 'de-DE',
  templatemanagementpanel747: 'Actions',
  templatemanagementpanel757: 'Show',
  templatemanagementpanel764: 'Edit',
  templatemanagementpanel771: 'Export',
  templatemanagementpanel777: 'Clone',
  templatemanagementpanel785: 'Activate',
  templatemanagementpanel791: 'Permanently delete the template? This action cannot be undone!',
  templatemanagementpanel795: 'Permanently delete',
  templatemanagementpanel859: 'Description:',
  templatemanagementpanel862: 'Kategorie:',
  templatemanagementpanel865: 'Language:',
  templatemanagementpanel868: 'Tags:',
  templatemanagementpanel876: 'Dateien ({viewingTemplate.files?.length || 0}):',
  templatemanagementpanel893: 'No files available',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel933: 'New template name',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: 'Enter template name...',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel944: '🔍 Prüfe Verfügbarkeit...',
  templatemanagementpanel949: '❌ Name may not be assigned twice',
  templatemanagementpanel954: '✅ Name is available',
  templatemanagementpanel961: 'visibility',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel970: 'Public (visible to everyone)',
  templatemanagementpanel971: 'Private (just for you)',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel976: 'Those:',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel977: 'Typ:',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal15: 'Promise',
  templatemodal16: 'Promise',
  templatemodal147: 'Create new template',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal159: 'Name *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: 'Please enter template name!',
  templatemodal169: 'Template name must contain only lowercase letters',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal195: 'Description',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal206: 'Template description (optional)',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal186: 'Edit template',
  templatemodal199: 'Name *',
  templatemodal208: 'Template names are later used for URLs (username/template_name)',
  templatemodal228: 'Template names may only contain lowercase letters, numbers, and underscores (e.g., my_template_123).',
  templatemodal281: 'Select or enter a category (e.g., Backend, API, Web)',
  templatemodal293: 'Any categories allowed - suggestions:',
  templatemodal322: 'Select or enter a language (e.g., PHP, JavaScript, Python)',
  templatemodal334: 'Any language allowed - suggestions:',
  templatemodal366: 'Visibility *',
  templatemodal399: 'System Template',
  templatemodal438: 'Add file',
  templatemodal444: 'Please save the template; only then can you add files to the template.',
  templatemodal450: 'Note: Files are immediately assigned to the template. Changes to template details (name, description, etc.) must be saved separately.',
  templatemodal513: 'No files added. Click on t.templatemodal449 to begin.',
  templatemodal521: 'Custom Variables',
  templatemodal535: 'Add variable',
  templatemodal541: 'Please save the template; only then can you add custom variables to the template.',
  templatemodal547: 'Note: Custom variables allow you to define placeholders such as {copyright} or {company_name} that do not exist in the database. These can then be filled in by the user for each project and language.',
  templatemodal580: 'Necessary',
  templatemodal584: 'Optional',
  templatemodal625: 'No custom variables defined. Click "Add variable" to begin.',
  templatemodal646: 'Template is active',
  templatemodal655: 'Cancel',
  templatemodal667: 'Saved ✓Category *',
  templatemodal480: 'Characters',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal220: 'Category *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal226: 'Please select a category!',
  templatemodal235: 'All',
  templatemodal236: 'Select category',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: 'Language *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: 'Please enter language!',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal259: 'e.g., PHP, JavaScript, TypeScript',
  templatemodal276: 'Tags',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: 'Add tags (press Enter)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal301: 'Visibility *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: 'Please select visibility!',
  templatemodal317: 'Public',
  templatemodal318: 'Private',
  templatemodal320: 'Select visibility',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal333: 'System Template',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: 'Template files',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal379: 'Please save the template, only then can you add files to the template',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal395: 'Name',
  templatemodal396: 'Typ',
  templatemodal397: 'Size',
  templatemodal398: 'Actions',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal448: 'No files added. Click Add File to begin.',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal449: 'Add file',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal469: 'Template is active',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal491: 'Save',
  templatemodal502: 'No changes',
  templatemodal503: 'Create',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal65: 'Not authenticated',
  sqlimportmodal76: 'Failed to load schemas',
  sqlimportmodal87: 'Error loading schemas',
  sqlimportmodal106: 'No project selected. Please select a project first.',
  sqlimportmodal129: 'SQL script is required',
  sqlimportmodal134: 'Please select a target schema',
  sqlimportmodal139: 'No project selected',
  sqlimportmodal144: 'No schema selected',
  sqlimportmodal154: 'Authentication required',
  sqlimportmodal177: 'Failed to import SQL',
  sqlimportmodal203: 'Import failed',
  sqlimportmodal211: '📥 Import Database Schema',
  sqlimportmodal234: 'Import database schema from SQL script',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal277: 'Target Schema',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal286: 'Loading schemas...',
  sqlimportmodal301: 'No editable schemas in project',
  sqlimportmodal313: 'Brief description...',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal322: 'SQL Script',
  sqlimportmodal328: 'Paste your SQL CREATE TABLE statements here...',
  sqlimportmodal332: 'Supports MySQL CREATE TABLE, ALTER TABLE statements and constraints',
  sqlimportmodal338: 'Upload SQL File',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal353: 'File loaded successfully!',
  sqlimportmodal368: 'Click to select SQL file',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal369: 'Supports .sql and .txt files',
  sqlimportmodal405: 'Cancel',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: '📥 Import Database Schema',

  // resources/js\Components\TopBar.tsx
  topbar57: 'applicationsUpdated',
  topbar60: 'applicationsUpdated',
  topbar71: 'Scoriet',
  topbar75: 'Enterprise Code Generator',
  topbar98: 'Select Project',
  topbar102: 'No projects found',
  topbar122: 'openApplicationsModal',

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: 'instrumentSans',
  fontprovider29: 'instrumentSans',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal19: 'Current',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal29: '💡 Create a new version?',
  versionconfirmationmodal51:  'You\'re about to ',
  versionconfirmationmodal56:  '⚠️ WARNING: Table ',
  versionconfirmationmodal56a: 'will be deleted!',
  versionconfirmationmodal90:  'No, continue working on ',
  versionconfirmationmodal90a: '!',
  versionconfirmationmodal53: 'Would you like to create a new version for this?',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal67: 'Yes, create new version',
  versionconfirmationmodal83: 'No',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: 'Change directly without a new version',
  versionconfirmationmodal92: 'ℹ️ You can always create a new version later by clicking \'Save as new version\'.',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal93: 'Save as new version',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: 'Cancel',

  // resources/js\contexts\ProjectContext.tsx
  projectcontext196: 'useProject must be used within a ProjectProvider',

  // resources/js\contexts\ToastContext.tsx
  toastcontext19: 'Success',
  toastcontext28: 'Mistake',
  toastcontext37: 'Info',
  toastcontext46: 'warning',
  toastcontext63: 'useToast must be used within a ToastProvider',

  // resources/js\i18n\index.ts
  indexts26: 'localStorage',
  indexts28: 'localStorage',

  // resources/js\lib\api.ts
  apits104: 'Authentication required - please login',
  apits119: 'Authentication expired - please log in again',
  apits152: 'All',
  apits201: 'Unknown error',
  apits219: 'Unknown error',
  apits235: 'Unknown error',
  apits251: 'Unknown error',
  apits268: 'Unknown error',
  apits286: 'Unknown error',
  apits314: 'Unknown error',
  apits329: 'Unknown error',
  apits350: 'Unknown error',
  apits518: 'Failed to fetch pricing:',
  apits527: 'EUR',
  apits553: 'EUR',

  // resources/js\pages\CMSPage.tsx
  cmspage45: 'Upgrade to unlock more features and support the project!',
  cmspage194: 'BETA',
  cmspage208: 'Home',
  cmspage352: 'Scoriet',

  // resources/js/pages/CMSPage.tsx
  cmspage353: 'The future of code generation. Built by developers, for developers.',

  // resources/js\pages\CMSPage.tsx
  cmspage387: 'You\'re currently on the ',
  cmspage412: 'Choose Your Plan',
  cmspage422: 'Current Plan',
  cmspage423: 'Free',
  cmspage426: 'Free plan',
  cmspage435: 'Premium',
  cmspage440: 'Best for professional developers',
  cmspage462: 'Choose Premium',
  cmspage473: 'MOST POPULAR',
  cmspage474: 'Business',
  cmspage479: 'Best for teams and agencies',
  cmspage501: 'Choose Business',
  cmspage520: 'Support the community',
  cmspage542: 'Become Patron',
  cmspage553: 'You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.',

  // resources/js\pages\EmailVerification.tsx
  emailverification13: 'Confirm email - Scoriet',

  // resources/js\pages\Index.tsx
  index133: 'Loading panel...',
  index258: 'Administration Team',

  // resources/js/pages/Index.tsx
  index265: 'card custom',

  // resources/js\pages\Index.tsx
  index293: 'Template management',
  index333: 'Database Management',
  index378: 'Debug Manual Generator',
  index400: 'Welcome',
  index413: 'Database Designer',
  index426: 'Templates',
  index439: 'Database Explorer',
  index476: 'Teams',
  index495: 'Project Management',
  index508: 'My Applications',
  index521: 'Public Projects',
  index534: 'Protect',
  index539: 'Removal of this tab will be rejected',
  index540: 'This is done in the onLayoutChange callback',
  index542: 'Try Alt+P to update this tab',
  index543: 'Try Alt+M to maximize this tab',
  index544: 'Try Alt+L to log current layout',
  index545: 'Try Alt+C to copy layout to clipboard',
  index556: 'Login',
  index590: 'Template management',
  index625: 'Database Management',
  index662: 'Administration Team',
  index676: 'Template - DB Schema Dependencies',
  index689: '🔧 Debug Manual Generator',
  index711: 'Code Generation',
  index724: 'Language Management',
  index737: 'Schema Translation',
  index750: 'System Settings',
  index763: 'Project Settings',
  index776: 'CMS Admin',
  index792: 'Auth Modal',
  index796: '📋 Information',
  index797: 'Authentication is now handled via modal windows.',
  index798: 'Use the navigation menu to access Login, Register, or Profile.',
  index835: '🔧 Debug Manual Generator',
  index861: 'Project',
  index917: '⚠️ Unknown Tab: {id}',
  index918: 'This tab ID is not defined in loadTab function.',
  index919: 'Available tabs: t2, t3, t5, protect1, login, register, profile, forgot',
  index921: 'Check your loadTab function!',
  index1415: 'Close All Tabs',
  index1621: 'openApplicationsModalInPanel',
  index1636: 'openApplicationsModal',
  index1639: 'openApplicationsModal',

  // resources/js/pages/Index.tsx
  index1759: 'Clear saved layout and reset to default?',

  // resources/js\pages\Index.tsx
  index1771: 'Layout was copied to clipboard!',
  index1784: 'Layout was copied to clipboard!',
  index1788: 'See console for manual copying.',
  index1851: 'INPUT',
  index1856: 'Removal of this tab is rejected!',
  index1928: 'Scoriet - Enterprise Code Generator',
  index2009: 'Loading...',
  index2020: 'Loading...',
  index2058: 'Registration Successful',
  index2070: 'Loading...',

  // resources/js/pages/LandingPage.tsx
  statusLink: 'Status',

  // resources/js\pages\LandingPage.tsx
  landingpage69: 'EUR',
  landingpage110: 'Error loading user data:',

  // resources/js/pages/LandingPage.tsx
  sqlParserTitle: 'SQL Parser',
  sqlParserDesc: 'Intelligent MySQL database schema parsing with support for complex relationships and constraints.',
  templateSystemTitle: 'Template System',
  templateSystemDesc: 'Powerful templating engine with JavaScript execution for dynamic code generation.',
  multiLanguageTitle: 'Multi-Language Support',
  multiLanguageDesc: 'Generate code for PHP, JavaScript, TypeScript, Python and more with customizable templates.',
  modernInterfaceTitle: 'Modern Interface',
  modernInterfaceDesc: 'Intuitive dock-based MDI interface with tab stacking and floating panels.',

  // resources/js\pages\LandingPage.tsx
  landingpage151: ' forever',
  landingpage152: 'Perfect for personal projects',
  landingpage154: 'Up to 3 projects',
  landingpage155: 'Basic templates',
  landingpage156: 'SQL schema parsing',
  landingpage157: 'Community support',
  landingpage158: 'Advertising-funded',

  // resources/js/pages/LandingPage.tsx
  goStartFree: 'Start Free',
  premiumLabel: 'Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage168: 'Best for professional developers',
  landingpage170: 'Unlimited projects',
  landingpage171: 'Advanced templates',
  landingpage172: 'Custom template creation',
  landingpage173: 'Priority support',
  landingpage174: 'Advanced SQL features',
  landingpage175: 'Team collaboration',

  // resources/js/pages/LandingPage.tsx
  goPremium: 'Go Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage182: 'Business',
  landingpage186: 'Best for teams and agencies',
  landingpage188: 'All Premium features',
  landingpage189: 'Team collaboration tools',
  landingpage190: 'Google Translate API integration',
  landingpage191: 'Advanced analytics',
  landingpage192: 'Priority support with SLA',
  landingpage193: 'Custom branding options',
  landingpage195: 'Go Business',

  // resources/js/pages/LandingPage.tsx
  patronLabel: 'Patron',

  // resources/js\pages\LandingPage.tsx
  landingpage203: 'Support the community',
  landingpage205: 'All Business features',
  landingpage206: 'Early access to features',
  landingpage207: 'Influence development',
  landingpage208: 'Community Discord access',
  landingpage209: 'Custom amount from (',

  // resources/js/pages/LandingPage.tsx
  becomePatron: 'Become Patron',

  // resources/js\pages\LandingPage.tsx
  landingpage288: 'Scoriet - Enterprise Code Generator',
  landingpage304: 'Welcome Tab',
  landingpage307: 'openHomeOnStart',
  landingpage311: 'Open this tab on app start',

  // resources/js/pages/LandingPage.tsx
  landingpage316: 'Close this tab to focus on your projects',

  // resources/js\pages\LandingPage.tsx
  landingpage336: 'BETA',

  // resources/js/pages/LandingPage.tsx
  login: 'Login',
  register: 'Register',
  profile: 'Profile',
  changePlan: 'Change Plan',
  logout: 'Logout',
  gotoApp: 'Goto App',
  title: 'Enterprise Code Generator',
  subtitle: 'Transform your database schemas into production-ready code with intelligent templates. Reduce development time by 80% with automated code generation.',
  startFree: 'Start Free',
  tryDemo: 'Try Demo',
  watchDemo: 'Watch Demo',
  featuresTitle: 'Powerful Features for Modern Development',
  pricingTitle: 'Choose Your Plan',
  pricingSubtitle: 'Start free, upgrade when you\'re ready to scale',

  // resources/js\pages\LandingPage.tsx
  landingpage479: 'MOST POPULAR',
  landingpage486: 'Patreon',
  landingpage514: 'Free',

  // resources/js/pages/LandingPage.tsx
  ctaTitle: 'Ready to 10x Your Development Speed?',
  ctaSubtitle: 'Join thousands of developers who are already using Scoriet to build better software faster.',
  startFreeTrial: 'Start Free Trial',
  tryDemoNow: 'Try Demo Now',
  contactSales: 'Contact Sales',
  goToApp: 'Go to App',
  welcomeBack: 'User',

  // resources/js\pages\LandingPage.tsx
  landingpage573: 'Welcome back ',

  // resources/js/pages/LandingPage.tsx
  currentPlan: 'Your Plan: ',
  freeLabel: 'Free',
  freeTier: 'Free Tier',
  registerFirst: 'Register & Choose Plan',

  // resources/js\pages\LandingPage.tsx
  landingpage589: 'MOST POPULAR',
  landingpage594: 'Custom',

  // resources/js/pages/LandingPage.tsx
  upgradeTo: 'Upgrade to',
  currentPlanButton: 'Current Plan',
  landingpage629: 'Scoriet',
  landingpage630: 'The future of code generation. Built by developers, for developers.',
  productLabel: 'Product',
  featuresLink: 'Features',
  pricingLink: 'Pricing',
  templatesLink: 'Templates',
  examplesLink: 'Examples',
  resourcesLabel: 'Resources',
  documentationLink: 'Documentation',
  apiReferenceLink: 'API Reference',
  tutorialsLink: 'Tutorials',
  downloadsLink: 'Downloads',
  supportLabel: 'Support',
  helpCenterLink: 'Help Center',

  // resources/js\pages\LandingPage.tsx
  landingpage664: 'imprint',

  // resources/js/pages/LandingPage.tsx
  contactUsLink: 'Contact Us',
  communityLink: 'Community',
  allRightsReserved: '© 2026 Scoriet, all rights reserved',

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',

  // resources/js\pages\LandingPage.tsx
  landingpage716: 'Choose Your Plan',
  landingpage726: 'Current Plan',
  landingpage727: 'Free',
  landingpage730: 'Free plan',
  landingpage743: 'MOST POPULAR',
  landingpage748: 'Custom',
  landingpage764: 'Current Plan',
  landingpage765: 'Free',
  landingpage767: 'Free',
  landingpage769: 'Free',
  landingpage782: 'You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.',
  landingpage801: 'Registration Successful',
  landingpage762:  'You\'re currently on the ',
  landingpage762a: 'Upgrade to unlock more features and support the project!',
  landingpage814:  'You can change or cancel your plan at any time. All plans include a 30-day money-back guarantee.',
  landingpage796:  'Choose ',
  landingpage802:  'Upgrading to ',
  landingpage802a: ' - Payment integration coming soon!',
  landingpage738:  'Your browser does not support the video element.',
  landingpage647:  ' - Coming Soon!',
  landingpage627:  '/month',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse70: 'Invalid or expired invitation',
  projectinvitationresponse77: 'Failed to load invitation',
  projectinvitationresponse133: 'Please fill in all required fields',
  projectinvitationresponse138: 'Passwords do not match',
  projectinvitationresponse161: 'Registration successful! Please check your email to verify your account.',
  projectinvitationresponse167: 'Registration failed',
  projectinvitationresponse170: 'Error during registration',
  projectinvitationresponse181: 'Loading invitation...',
  projectinvitationresponse192: '🚀 Scoriet',
  projectinvitationresponse193: 'Enterprise Code Generator',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse223: 'You\'ve been invited to join a project, but first you need to create an account',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse233: 'Decline',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse235: 'You\'ve been invited to join a project on Scoriet',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse256: 'Invited by:',
  projectinvitationresponse266: 'Role:',
  projectinvitationresponse273: 'Project Owner:',
  projectinvitationresponse283: 'Expires:',
  projectinvitationresponse292: 'Personal message:',
  projectinvitationresponse307: '🚀 Create Account & Join Project',
  projectinvitationresponse334: '✅ Accept Invitation',
  projectinvitationresponse348: '❌ Decline Invitation',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse355: 'You can decline this invitation if you\'re not interested in joining this project.',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse373: 'Welcome to the team!',
  projectinvitationresponse374: 'Invitation declined',
  projectinvitationresponse379: 'You can now access the project and start collaborating with your team.',
  projectinvitationresponse380: 'The project owner has been notified of your decision.',
  projectinvitationresponse386: 'Go to Scoriet App',
  projectinvitationresponse399: 'This is an automated message from Scoriet - Enterprise Code Generator',
  projectinvitationresponse407: 'Create Your Scoriet Account',
  projectinvitationresponse417: 'Full Name *',
  projectinvitationresponse428: 'Username *',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse433: 'johndoe',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse436: 'Only lowercase letters, numbers, hyphens and underscores',
  projectinvitationresponse440: 'Email Address *',
  projectinvitationresponse449: 'Pre-filled from invitation',
  projectinvitationresponse453: 'Password *',
  projectinvitationresponse458: 'Enter your password',
  projectinvitationresponse466: 'Confirm Password *',
  projectinvitationresponse471: 'Confirm your password',
  projectinvitationresponse480: 'Cancel',
  projectinvitationresponse487: 'Create Account',

  // resources/views\admin\pages\create.blade.php
  createblade60: 'Enter your page content here. HTML is supported.',

  // resources/views\emails\project-invitation.blade.php
  projectinvitationblade116: 'If you have any questions',
  projectinvitationblade151: 'Decline',

  // resources/views\layouts\static.blade.php
  staticblade37: 'Help',

  // resources/views\pages\help.blade.php
  helpblade3: 'Help',
  helpblade8: 'Help Center',
  helpblade13: 'Welcome to the Scoriet Help Center',
  helpblade16: 'Getting Started',
  helpblade18: 'Learn how to get started with Scoriet',
  helpblade21: 'Create Your First Project',
  helpblade24: 'Step 1',
  helpblade25: 'Step 2',
  helpblade26: 'Step 3',
  helpblade27: 'Step 4',
  helpblade31: 'Features',
  helpblade34: 'Feature 1',
  helpblade35: 'Feature 2',
  helpblade36: 'Feature 3',
  helpblade37: 'Feature 4',
  helpblade41: 'Support',
  helpblade43: 'Contact our support team',

  // resources/views\pages\impressum.blade.php
  impressumblade3: 'imprint',
  impressumblade8: 'imprint',
  impressumblade14: 'Information according to \' 5 TMG',
  impressumblade17: 'Company name',
  impressumblade18: 'Address',
  impressumblade22: 'Contact information',
  impressumblade25: 'Geschäftsführer',
  impressumblade28: 'Commercial Register',
  impressumblade31: 'VAT ID No.',

  // routes\api.php
  api36: 'No schema version found',
  api47: 'Created test table with ID: ',
  api85: 'This password reset token is invalid.',
  api126: 'Failed to fetch pricing information',
  api180: 'This shows how the template should be processed correctly',
  api181: 'The loop was not properly closed and variables not replaced',
  api183: 'Loop properly processes all items',
  api184: 'Variables are correctly replaced',
  api185: 'Syntax is clean and valid PHP',
  api194: 'Simple Template Engine - NO REGEX',
  api197: 'No nested constructs in one line',
  api198: 'Loops are closed cleanly',
  api199: 'No regex - just simple string operations',
  api202: 'Line-by-line processing',
  api203: 'Einfache Variable-Replacement',
  api204: 'Maintainable code without regex',
  api205: 'Secure JavaScript escaping',
  api300: 'Teams debug endpoint works',
  api416: 'Test route works',
  api427: 'All projects in database',
  api452: 'Schema version not found',
  api509: 'Debug failed: ',
  api528: 'No constraints found',
  api745: 'No version found for this schema',
  api761: 'Loading tables for schema_version_id: {$schemaVersion->id} (version_number: {$schemaVersion->version_number})',
  api765: 'First table: {$firstTable->table_name}',
  api771: 'First constraint has {$testColumns} columns in database',
  api777: 'No tables found in this schema',
  api803: '-- MySQL Database Export',
  api804: '-- Schema: ',
  api805: '-- Version: ',
  api806: 'Y-m-d H:i:s',
  api810: '-- WARNING: Data integrity issues detected!',
  api812: '-- These constraints will be skipped from export',
  api813: '-- Consider re-parsing this schema version or contact support',
  api823: '-- Table structure for table `',
  api860: 'Processing constraint ID {$constraint->id} for table {$table->table_name}',
  api869: 'Found {$constraintColumns->count()} columns for constraint {$constraint->id}',
  api872: 'Skipping constraint {$constraint->id} - no columns found',
  api913: '-- Export completed successfully',
  api914: '-- Total tables exported: ',
  api915: '-- Total constraints exported: ',
  api939: 'Export failed: ',
  api954: 'No constraints found',
  api998: 'No version found for this schema',
  api1026: 'No tables found in this schema',
  api1050: '-- MySQL Database Export',
  api1051: '-- Schema: ',
  api1052: '-- Version: ',
  api1053: 'Y-m-d H:i:s',
  api1059: '-- Table structure for table `',
  api1142: '-- Export completed successfully',
  api1143: '-- Total tables exported: ',
  api1161: 'Export failed: ',
  api1276: 'Global gtree[] for client-side caching',
  api1285: 'Exception occurred',
  api1300: 'Debug join code lookup',
  api1330: 'Template not found',
  api1358: 'Exception occurred',
  api1379: 'Template not found',
  api1386: 'Template processing with project filter: {$projectId}',
  api1388: 'Template processing without project filter (demo mode)',
  api1393: 'Template processing with table filter: {$tableName}',
  api1431: 'Loading schemas for project: {$project->name}',
  api1438: 'Found {$linkedSchemas->count()} linked schemas for project {$projectId}',
  api1454: ' (version {$latestVersion->id})',
  api1458: 'Total project-linked tables: {$schemaTables->count()}',
  api1465: 'Project {$projectId} has no linked schemas - this is normal if no databases are connected to the project',
  api1469: ' for project {$projectId} because table_name was specified',
  api1498: 'Created dummy table with {$dummyFields->count()} fields',
  api1502: 'No project specified',
  api1532: 'Demo project database',
  api1676: '🔍 Checking override for file ',
  api1682: ' as table-specific due to table_name parameter: {$tableName}',
  api1684: '❌ Override NOT triggered for ',
  api1707: 'Table not found',
  api1760: ': table_index={$tableIndex}',
  api1809: 'All files in one JSON response',
  api1810: 'No multiple HTTP requests needed',
  api1814: 'Receive complete gtree[] + all generated files in single request',
  api1815: 'Store gtree[] in browser for future use',
  api1816: 'Process generated files (download/display)',
  api1817: 'Optional: Create ZIP from generated_files array',
  api1824: 'Exception occurred',

  // routes\gtree-ultimate.php
  gtreeultimate26: 'Template not found',
  gtreeultimate85: 'Y-m-d H:i:s',
  gtreeultimate86: 'Y-m-d',
  gtreeultimate90: 'Y-m-d H:i:s',
  gtreeultimate91: 'Demo User',
  gtreeultimate95: 'User',
  gtreeultimate105: 'Demo Scoriet Project',
  gtreeultimate120: 'Demo project database',
  gtreeultimate149: 'Y-m-d H:i:s',
  gtreeultimate160: 'Y-m-d',
  gtreeultimate161: 'H:i:s',
  gtreeultimate163: 'Y-m-d H:i:s',
  gtreeultimate409: 'Exception occurred in Ultimate Template Engine',

  // routes\web.php
  web50: 'Demo mode activated! Data is reset every 20 minutes.',

  //js/components/AuthModals/CreditPurchaseModal.tsx
  creditpurchasemodal72: '💳 Buy Credits',

  // resources/js/pages/PublicProjectPage.tsx
  publicProjectBy: 'by',
  publicProjectPoweredBy: 'Powered by',
  publicProjectTagline: 'Enterprise Code Generator',
  projectSettings: 'Project Settings',
  languages: 'Languages',
  dateFormat: 'Date Format',
  timeFormat: 'Time Format',
  currency: 'Currency',
  timezone: 'Timezone',
  teams: 'Teams',
  templates: 'Templates',
  databases: 'Databases',
  created: 'Created',
  lastUpdated: 'Last updated',

  // resources/js/Components/Panels/ProjectPanel.tsx - Public Link
  copyPublicLink: 'Copy Public Link',
  publicLinkCopied: 'Public link copied to clipboard!',
  projectNotPublic: 'Project is private - make it public to share',

  //resources/js/Components/Panels/FormDesignerPanel.tsx
  formdesignerpanel555: 'Access check failed',

};
