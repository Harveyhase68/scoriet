import type { Translations } from '../types';

export const es: Translations = {

  // app\Console\Commands\DebugSchemas.php
  debugschemas22: 'Depurar todos los esquemas y sus tablas',
  debugschemas29: '🔍 Depuración de todos los esquemas y tablas',
  debugschemas38: 'Encontró ',
  debugschemas49: 'Últimas versiones por esquema:',
  debugschemas56: 'ID de esquema: {$schemaId}',
  debugschemas70: 'esquemas con {$totalTables} tablas totales',

  // app\Console\Commands\DemoReset.php
  demoreset16: 'demo:reset {--backup : Crear copia de seguridad antes de reiniciar}',
  demoreset23: 'Restablecer la base de datos de demostración al estado inicial con datos de demostración nuevos',
  demoreset31: '¡El reinicio de demostración solo se puede ejecutar en un entorno local o de demostración!',
  demoreset35: '🚀 Iniciando reinicio de base de datos de demostración...',
  demoreset45: '✅ ¡La base de datos de demostración se ha restablecido correctamente!',
  demoreset46: '📊 Usuarios de demostración disponibles: demo-admin',
  demoreset53: '📦 Creando copia de seguridad de la base de datos...',
  demoreset60: 'Y-m-d_H-i-s',
  demoreset65: '✅ Copia de seguridad creada: {$filename}',
  demoreset70: '🗄️ Eliminando todas las mesas...',
  demoreset89: '🔄 Ejecutando migraciones...',
  demoreset92: '🌱Sembrando datos de demostración...',

  // app\Console\Commands\FixTemplateFilePaths.php
  fixtemplatefilepaths23: 'Corregir valores vacíos de file_path en la tabla template_files',
  fixtemplatefilepaths30: 'Comprobando si hay archivos de plantilla con file_path vacío...',
  fixtemplatefilepaths43: 'Se encontraron {$emptyCount} archivos con file_path vacío de un total de {$totalFiles} archivos',
  fixtemplatefilepaths46: '¡Todos los archivos de plantilla ya tienen valores file_path!',
  fixtemplatefilepaths50: 'Arreglando valores de file_path vacíos...',
  fixtemplatefilepaths70: 'ID de archivo fijo {$file->id}: {$file->file_name} -> {$path}',
  fixtemplatefilepaths74: '¡Se repararon exitosamente {$fixedCount} rutas de archivos de plantilla!',

  // app\Console\Commands\TestObservers.php
  testobservers28: 'Pruebe la funcionalidad del observador activando varios eventos del modelo',
  testobservers37: '🧪 Prueba de la funcionalidad del observador',
  testobservers42: 'Trabajos en cola antes de la prueba: {$jobsBefore}',
  testobservers68: 'Trabajos en cola después de la prueba: {$jobsAfter}',
  testobservers69: 'Nuevos trabajos enviados: {$newJobs}',
  testobservers71: '✅ ¡Prueba de observador completada!',
  testobservers72: 'Consulte los registros para conocer la actividad detallada del observador.',
  testobservers77: '📋 Plantilla de prueba Observer...',
  testobservers83: 'Plantilla de prueba para la funcionalidad del observador',
  testobservers92: '✅ Plantilla creada: {$template->id}',
  testobservers98: 'Hola Mundo',
  testobservers103: '✅ Archivo añadido a la plantilla',
  testobservers106: 'Descripción actualizada',
  testobservers107: '✅ Plantilla actualizada',
  testobservers111: '✅ Plantilla eliminada',
  testobservers114: '❌ La prueba del observador de plantillas falló:',
  testobservers120: '📄 Probando el observador de TemplateFile...',
  testobservers126: 'Plantilla de prueba para el observador de archivos',
  testobservers139: 'Archivo de prueba',
  testobservers144: '✅ Archivo de plantilla creado: {$file->id}',
  testobservers147: 'Contenido actualizado',
  testobservers148: '✅ Archivo de plantilla actualizado',
  testobservers152: '✅ Archivo de plantilla eliminado',
  testobservers158: '❌ La prueba del observador de TemplateFile falló:',
  testobservers164: '🗄️ Probando el observador de SchemaVersion...',
  testobservers174: '⚠️ No se encontró ninguna versión del esquema para el proyecto {$projectId}',
  testobservers183: 'Versión de prueba para el observador',
  testobservers187: '✅ Versión del esquema creado: {$newVersion->id}',
  testobservers191: '✅ Versión del esquema eliminada',
  testobservers194: '❌ La prueba del observador de SchemaVersion falló:',
  testobservers200: '📋 Probando el observador de SchemaTable...',
  testobservers210: '⚠️ No se encontró ninguna versión del esquema para el proyecto {$projectId}',
  testobservers218: 'Tabla de pruebas para el observador',
  testobservers224: '✅ Tabla de esquema creada: {$table->id}',
  testobservers227: 'Comentario actualizado',
  testobservers228: '✅ Tabla de esquema actualizada',
  testobservers232: '✅ Tabla de esquema eliminada',
  testobservers235: '❌ La prueba del observador de SchemaTable falló:',
  testobservers241: '🔗 Proyecto de prueba TemplateUsage Observer...',
  testobservers247: '⚠️ No se encontró ninguna plantilla',
  testobservers260: '✅ Uso de la plantilla de proyecto creada: {$usage->id}',
  testobservers264: '✅ Uso de plantilla de proyecto actualizado',
  testobservers268: '✅ Uso de plantilla de proyecto desactivado',
  testobservers272: '✅ Se eliminó el uso de la plantilla de proyecto',
  testobservers275: '❌ La prueba del observador ProjectTemplateUsage falló:',

  // app\Console\Commands\TestProjectSchemas.php
  testprojectschemas23: 'Probar conexiones de esquema para un proyecto',
  testprojectschemas32: '🔍 Probando conexiones de esquema para el proyecto {$projectId}',
  testprojectschemas37: 'Todos los esquemas disponibles:',
  testprojectschemas47: 'Esquemas de proyecto para el proyecto {$projectId}:',
  testprojectschemas50: 'Desconocido',
  testprojectschemas54: 'Tablas de esquemas conectados:',
  testprojectschemas59: 'Desconocido',
  testprojectschemas73: 'Esquema',
  testprojectschemas79: ':No se encontraron versiones',
  testprojectschemas83: 'Total de tablas de todos los esquemas conectados: {$totalTables}',

  // app\Console\Commands\TestTreeGenerator.php
  testtreegenerator25: 'Prueba la funcionalidad de ProjectFileTreeGenerator',
  testtreegenerator34: '🌳 Proyecto de pruebaFileTreeGenerator',
  testtreegenerator40: 'Proyecto {$projectId} no encontrado',
  testtreegenerator44: 'Proyecto: {$project->name} (ID: {$project->id})',
  testtreegenerator52: 'Usos de plantillas activas:',
  testtreegenerator62: 'Nodos del árbol generados:',
  testtreegenerator71: 'Archivos de plantilla {$usage->template_id} ({$template->name}):',
  testtreegenerator81: '    Niños: ',
  testtreegenerator95: '¡Sin niños!',
  testtreegenerator101: 'ID del árbol de generación guardado: {$generationTree->id}',
  testtreegenerator102: 'Elementos de datos del árbol:',
  testtreegenerator103: 'No',

  // app\Console\Commands\TestTreeUpdate.php
  testtreeupdate23: 'Actualización del árbol de pruebas para un proyecto',
  testtreeupdate32: '🌳 Actualización del árbol de pruebas para el proyecto {$projectId}',
  testtreeupdate37: 'Proyecto {$projectId} no encontrado',
  testtreeupdate44: 'Árbol guardado con ID: {$tree->id}',
  testtreeupdate45: 'El árbol tiene',
  testtreeupdate48: 'Plantilla: {$templateGroup[',
  testtreeupdate50: 'Archivos: {$fileCount}',

  // app\Http\Controllers\Admin\PageController.php
  pagecontroller50: 'Ya existe una página con este slug para el idioma seleccionado.',
  pagecontroller89: 'Página eliminada exitosamente',

  // app\Http\Controllers\Api\AutoTranslateController.php
  autotranslatecontroller36: 'Proyecto no encontrado',
  autotranslatecontroller41: 'No autorizado',
  autotranslatecontroller49: 'La clave API de Google Translate no está configurada para este proyecto. Añade tu clave API en Configuración del proyecto → Configuración de localización.',
  autotranslatecontroller57: 'Solicitud de traducción automática',
  autotranslatecontroller74: 'Respuesta de la API de Google Translate',
  autotranslatecontroller83: 'Traducción fallida',
  autotranslatecontroller91: 'Texto traducido',
  autotranslatecontroller94: 'Texto traducido',
  autotranslatecontroller99: 'No se ha devuelto ninguna traducción',
  autotranslatecontroller114: 'La traducción falló en todos los idiomas',

  // app\Http\Controllers\Api\LanguageController.php
  languagecontroller17: 'No autorizado. Se requiere acceso de administrador del sistema.',
  languagecontroller102: 'Idioma eliminado exitosamente',

  // app\Http\Controllers\Api\ProjectController.php
  projectcontroller155: 'Los proyectos privados solo están disponibles para usuarios premium',
  projectcontroller187: 'd.m.Y',
  projectcontroller188: 'Su',
  projectcontroller190: 'Europa/Viena',
  projectcontroller230: 'No autorizado',
  projectcontroller246: 'No autorizado',
  projectcontroller294: 'Sólo el propietario del proyecto puede transferir la propiedad',
  projectcontroller300: 'El nuevo propietario debe ser miembro del proyecto',
  projectcontroller361: 'No autorizado',
  projectcontroller367: 'Proyecto eliminado exitosamente',
  projectcontroller377: 'No autorizado',
  projectcontroller382: 'Proyecto eliminado permanentemente',
  projectcontroller392: 'No autorizado',
  projectcontroller397: 'Proyecto restaurado exitosamente',
  projectcontroller407: 'No autorizado',
  projectcontroller429: 'No autorizado',
  projectcontroller451: 'No autorizado',
  projectcontroller523: 'No autorizado',
  projectcontroller540: 'Algunos equipos no te pertenecen',
  projectcontroller556: 'Equipos asignados con éxito',
  projectcontroller566: 'No autorizado',
  projectcontroller571: 'El equipo no te pertenece',
  projectcontroller576: 'El equipo no está asignado a este proyecto.',
  projectcontroller582: 'Equipo eliminado del proyecto exitosamente',
  projectcontroller592: 'No autorizado',
  projectcontroller605: 'Esquema no encontrado',
  projectcontroller610: 'El esquema ya está asociado a este proyecto.',
  projectcontroller616: 'Esquema asociado exitosamente',
  projectcontroller626: 'No autorizado',
  projectcontroller631: 'El esquema no está asociado con este proyecto',
  projectcontroller637: 'Asociación de esquema eliminada exitosamente',
  projectcontroller649: 'Proyecto no encontrado',
  projectcontroller675: 'Proyecto no encontrado',
  projectcontroller724: 'Proyecto no encontrado',
  projectcontroller778: 'Permisos insuficientes',
  projectcontroller788: 'El usuario no es miembro de este proyecto',
  projectcontroller793: 'No se puede eliminar al propietario del proyecto',
  projectcontroller798: 'Sólo el propietario del proyecto puede eliminar administradores',
  projectcontroller814: 'Miembro eliminado exitosamente del proyecto y de todos los equipos asociados',
  projectcontroller828: 'Sólo el propietario del proyecto puede cambiar los roles de los miembros',
  projectcontroller839: 'El usuario no es miembro de este proyecto',
  projectcontroller844: 'No se puede cambiar el rol del propietario',
  projectcontroller849: 'El rol de miembro se actualizó correctamente',
  projectcontroller861: 'No autorizado',
  projectcontroller876: 'La configuración del proyecto se actualizó correctamente',
  projectcontroller890: 'No autorizado',
  projectcontroller907: 'No autorizado',
  projectcontroller1000: 'No autorizado',
  projectcontroller1026: 'No autorizado',
  projectcontroller1033: 'Árbol de generación regenerado con éxito',

  // app\Http\Controllers\Api\ProjectGenerationTreeController.php
  projectgenerationtreecontroller23: 'No se encontró ningún árbol generacional para este proyecto',
  projectgenerationtreecontroller52: 'Desaparecido ',
  projectgenerationtreecontroller61: 'No se encontró ningún árbol generacional para este proyecto',

  // app\Http\Controllers\Api\SchemaController.php
  schemacontroller118: 'Esquema no encontrado',
  schemacontroller139: 'No autorizado para editar este esquema',
  schemacontroller173: '🚨 SOLICITUD DE ELIMINACIÓN RECIBIDA',
  schemacontroller191: 'No autorizado para eliminar este esquema',
  schemacontroller206: 'El esquema está siendo utilizado por {$projectsCount} proyectos. Utilice la función de eliminación forzada para continuar.',
  schemacontroller215: '🗑️ Iniciando la eliminación del esquema',
  schemacontroller226: '🔥 Eliminación preventiva de la asociación de proyectos',
  schemacontroller228: '✅ Asociaciones de proyectos {$deletedProjectAssociations} eliminadas previamente',
  schemacontroller233: '✅ Elocuente desprendimiento completado',
  schemacontroller235: '⚠️ Error en la separación de Eloquent:',
  schemacontroller240: '🔥 Iniciando transacción de eliminación principal para el esquema {$schema->id}',
  schemacontroller248: '🔍 Ámbito de eliminación',
  schemacontroller259: '✅ Se eliminaron {$deletedReferenceColumns} columnas de referencia de clave externa',
  schemacontroller264: '✅ Se eliminaron {$deletedReferences} referencias de clave externa',
  schemacontroller269: '✅ Se eliminaron las columnas de restricción {$deletedConstraintColumns}',
  schemacontroller274: '✅ Se eliminaron las restricciones {$deletedConstraints}',
  schemacontroller279: '✅ Se eliminaron los campos de esquema {$deletedFields}',
  schemacontroller284: '✅ Se eliminaron los diseños del diseñador de esquemas {$deletedLayouts}',
  schemacontroller288: '✅ Se eliminaron {$deletedTables} tablas de esquema',
  schemacontroller293: '✅ Se eliminaron {$deletedVersions} versiones del esquema',
  schemacontroller298: '🔍 Asociaciones de proyectos restantes: {$remainingAssociations}',
  schemacontroller302: '✅ Se eliminaron por la fuerza las asociaciones de proyectos restantes',
  schemacontroller307: '✅ Se eliminó el esquema en sí',
  schemacontroller310: '🎉 La eliminación del esquema se completó correctamente',
  schemacontroller316: 'El esquema y todos los datos relacionados se eliminaron correctamente',
  schemacontroller323: '❌ Error en la eliminación del esquema',
  schemacontroller330: 'No se pudo eliminar el esquema',
  schemacontroller345: 'Proyecto no encontrado',
  schemacontroller372: 'Esquema no encontrado',
  schemacontroller393: 'Versión del esquema no encontrada',
  schemacontroller431: 'No autorizado para editar este esquema',
  schemacontroller450: 'Diseño guardado exitosamente',
  schemacontroller452: 'Error al guardar el diseño:',
  schemacontroller453: 'Rastreo de pila:',
  schemacontroller455: 'No se pudo guardar el diseño',
  schemacontroller470: 'Esquema no encontrado',
  schemacontroller489: 'No autorizado para editar este esquema',
  schemacontroller514: 'Datos de la solicitud CreateTable:',
  schemacontroller617: 'Tabla creada exitosamente',
  schemacontroller622: 'Excepción de CreateTable:',
  schemacontroller651: 'No autorizado para editar este esquema',
  schemacontroller657: 'La tabla no pertenece a esta versión del esquema',
  schemacontroller684: 'Datos de solicitud de actualización de tabla:',
  schemacontroller804: 'Tabla actualizada exitosamente',
  schemacontroller810: 'No se pudo actualizar la tabla',
  schemacontroller827: 'No autorizado para editar este esquema',
  schemacontroller833: 'La tabla no pertenece a esta versión del esquema',
  schemacontroller840: 'Tabla eliminada exitosamente',
  schemacontroller854: 'DEPURACIÓN DE ENLACE DE MODELO DE RUTA: Entrada de método',
  schemacontroller880: 'Esta acción requiere un esquema flotante',
  schemacontroller885: 'No autorizado para editar este esquema',
  schemacontroller890: 'La tabla no pertenece a esta versión del esquema',
  schemacontroller894: '🔍 API LLAMADA: deleteTableWithVersionCopy',
  schemacontroller911: '🔍 VERIFICACIÓN CRÍTICA: Comprobación de la propiedad de la tabla',
  schemacontroller924: '🔍DOBLE VERIFICACIÓN: Búsqueda de tabla por ID en la versión',
  schemacontroller935: 'Eliminación de tabla: {$table->table_name}',
  schemacontroller938: '✅Nueva versión creada',
  schemacontroller944: 'ANTES: Buscando tabla para eliminar en nueva versión',
  schemacontroller953: '🔍 DESPUÉS: Resultado de la búsqueda de tabla en la nueva versión',
  schemacontroller966: '❌ Tabla no encontrada en la nueva versión',
  schemacontroller970: 'no encontrado en la nueva versión {$newVersion->version_number}',
  schemacontroller974: '🗑️ A PUNTO DE ELIMINAR: Confirmación final antes de la eliminación',
  schemacontroller990: 'Relaciones de tablas antes de la eliminación',
  schemacontroller999: '✅ Eliminación de tabla completada',
  schemacontroller1006: '✅ Tabla eliminada exitosamente de la nueva versión',
  schemacontroller1010: 'Nueva versión creada y tabla eliminada',
  schemacontroller1030: 'No autorizado para editar este esquema',
  schemacontroller1048: 'No autorizado para editar este esquema',
  schemacontroller1087: 'No autorizado para editar este esquema',
  schemacontroller1110: 'Nueva tabla: {$request->table_name}',
  schemacontroller1116: 'Nueva tabla: {$request->table_name}',
  schemacontroller1125: 'Ya existe una tabla con este nombre en esta versión del esquema',
  schemacontroller1126: 'ya existe',
  schemacontroller1158: 'Nueva versión creada con la tabla exitosamente',
  schemacontroller1165: 'No se pudo crear la versión ni la tabla',
  schemacontroller1182: 'Versión del esquema no encontrada',
  schemacontroller1249: 'Esta acción requiere un esquema flotante',
  schemacontroller1256: 'No autorizado para editar este esquema',
  schemacontroller1261: 'Solo se pueden eliminar restricciones de clave externa con este punto final',
  schemacontroller1278: 'Eliminar FK: {$constraint->constraint_name}',
  schemacontroller1284: 'No se pudo encontrar la tabla en la nueva versión',
  schemacontroller1293: 'No se pudo encontrar la restricción en la nueva versión',
  schemacontroller1301: 'Nueva versión creada y clave externa eliminada',
  schemacontroller1314: 'Clave externa eliminada exitosamente',
  schemacontroller1320: 'Restricción no encontrada',
  schemacontroller1322: 'Eliminar error FK:',
  schemacontroller1328: 'No se pudo eliminar la clave externa',
  schemacontroller1358: 'Esta acción requiere un esquema flotante',
  schemacontroller1365: 'No autorizado para editar este esquema',
  schemacontroller1370: 'Solo se pueden actualizar las restricciones de clave externa con este punto final',
  schemacontroller1381: 'Actualizar FK: {$constraint->constraint_name}',
  schemacontroller1387: 'No se pudo encontrar la tabla en la nueva versión',
  schemacontroller1396: 'No se pudo encontrar la restricción en la nueva versión',
  schemacontroller1404: 'Nueva versión creada y clave externa actualizada',
  schemacontroller1416: 'Clave externa actualizada exitosamente',
  schemacontroller1422: 'La validación falló',
  schemacontroller1426: 'Restricción no encontrada',
  schemacontroller1428: 'Error de actualización de FK:',
  schemacontroller1434: 'No se pudo actualizar la clave externa',
  schemacontroller1461: 'Esta acción requiere un esquema flotante',
  schemacontroller1468: 'No autorizado para editar este esquema',
  schemacontroller1479: 'Crear FK en {$table->table_name}',
  schemacontroller1485: 'No se pudo encontrar la tabla en la nueva versión',
  schemacontroller1493: 'Nueva versión creada y clave externa creada',
  schemacontroller1505: 'Clave externa creada exitosamente',
  schemacontroller1511: 'La validación falló',
  schemacontroller1515: 'Tabla no encontrada',
  schemacontroller1517: 'Error al crear FK:',
  schemacontroller1523: 'No se pudo crear la clave externa',

  // app\Http\Controllers\Api\SchemaTranslationController.php
  schematranslationcontroller71: 'Ya existe traducción para este artículo e idioma.',
  schematranslationcontroller102: 'Ya existe traducción para este artículo e idioma.',
  schematranslationcontroller115: 'Traducción eliminada exitosamente',
  schematranslationcontroller144: 'Proyecto no encontrado o acceso denegado',
  schematranslationcontroller188: 'Desconocido',
  schematranslationcontroller263: 'Traducciones actualizadas exitosamente.',

  // app\Http\Controllers\Api\SettingsController.php
  settingscontroller16: 'No autorizado. Se requiere acceso de administrador del sistema.',
  settingscontroller49: 'Configuración actualizada exitosamente',

  // app\Http\Controllers\Api\TemplateController.php
  templatecontroller29: 'No autorizado',
  templatecontroller92: 'No autorizado para acceder a este proyecto',
  templatecontroller96: 'No se puede utilizar esta plantilla',
  templatecontroller101: 'La plantilla ya está utilizada en este proyecto.',
  templatecontroller108: 'Plantilla vinculada exitosamente',
  templatecontroller129: 'El nombre de la plantilla debe estar en minúsculas.',
  templatecontroller141: 'No autorizado para acceder a este proyecto',
  templatecontroller145: 'No se puede clonar esta plantilla',
  templatecontroller156: 'Plantilla clonada exitosamente',
  templatecontroller170: 'No autorizado',
  templatecontroller245: 'No autorizado para acceder a este proyecto',
  templatecontroller268: 'Se asignaron correctamente {$assignedCount} plantillas al proyecto',
  templatecontroller288: 'Proyecto no encontrado',
  templatecontroller292: 'Plantilla no encontrada',
  templatecontroller297: 'No autorizado para acceder a este proyecto',
  templatecontroller307: 'La plantilla no está asignada a este proyecto',
  templatecontroller314: 'Plantilla eliminada del proyecto exitosamente',
  templatecontroller333: 'No autorizado',
  templatecontroller338: 'Uso de plantilla eliminado exitosamente',
  templatecontroller422: 'No autorizado',
  templatecontroller437: 'No autorizado',
  templatecontroller522: 'Las plantillas del sistema no se pueden eliminar',
  templatecontroller524: 'Las plantillas públicas de otros usuarios no se pueden eliminar',
  templatecontroller526: 'No tienes autorización',
  templatecontroller537: 'Plantilla eliminada exitosamente',
  templatecontroller550: 'Las plantillas del sistema no se pueden eliminar de forma permanente',
  templatecontroller552: 'Las plantillas públicas de otros usuarios no se pueden eliminar de forma permanente',
  templatecontroller554: 'No tienes autorización',
  templatecontroller567: 'Plantilla eliminada permanentemente',
  templatecontroller580: 'Las plantillas del sistema no se pueden activar/desactivar',
  templatecontroller582: 'Las plantillas públicas de otros usuarios no se pueden cambiar',
  templatecontroller584: 'No tienes autorización',
  templatecontroller591: 'Plantilla desactivada correctamente',
  templatecontroller620: 'No tienes autorización',
  templatecontroller649: 'Plantilla clonada exitosamente',
  templatecontroller682: 'No tienes autorización',
  templatecontroller717: 'No se pudieron cargar las dependencias de la plantilla',
  templatecontroller731: 'No tienes autorización',
  templatecontroller741: 'Error en la validación al agregar dependencia del esquema de base de datos',
  templatecontroller749: 'La validación falló',
  templatecontroller763: 'Esta dependencia ya existe',
  templatecontroller777: 'Dependencia del esquema de base de datos agregada con éxito',
  templatecontroller781: 'No se pudo agregar la dependencia del esquema de base de datos:',
  templatecontroller789: 'No se pudo agregar la dependencia:',
  templatecontroller803: 'No tienes autorización',
  templatecontroller814: 'Dependencia no encontrada',
  templatecontroller822: 'Dependencia del esquema de base de datos eliminada con éxito',
  templatecontroller827: 'No se pudo eliminar la dependencia',
  templatecontroller841: 'No autorizado',
  templatecontroller856: 'No autorizado',
  templatecontroller892: 'No autorizado',
  templatecontroller927: 'No autorizado',
  templatecontroller936: 'Archivo eliminado exitosamente',
  templatecontroller944: '🧪 [API-TEMPLATE-QUEUE] Iniciando despacho de trabajo para la plantilla {$template->id} ({$template->name})',
  templatecontroller954: '🧪 [API-TEMPLATE-QUEUE] Se encontraron los siguientes ID de proyecto:',
  templatecontroller957: '🧪 [API-TEMPLATE-QUEUE] Plantilla {$template->id}: Todavía no hay proyectos que usen esta plantilla',
  templatecontroller961: '🧪 [API-TEMPLATE-QUEUE] Plantilla {$template->id}: Despachando regeneración para',
  templatecontroller965: '🧪 [API-TEMPLATE-QUEUE] Trabajos en cola antes del envío: {$jobsBefore}',
  templatecontroller970: '🧪 [API-TEMPLATE-QUEUE] Enviando el trabajo RegenerateProjectGenerationTree para el proyecto {$projectId}',
  templatecontroller975: '🧪 [API-TEMPLATE-QUEUE] Trabajo enviado exitosamente para el proyecto {$projectId}',
  templatecontroller977: '🧪 [API-TEMPLATE-QUEUE] No se pudo enviar el trabajo para el proyecto {$projectId}:',
  templatecontroller983: '🧪 [API-TEMPLATE-QUEUE] Trabajos en cola después del envío: {$jobsAfter}',
  templatecontroller984: '🧪 [API-TEMPLATE-QUEUE] Total de trabajos enviados: {$dispatchedJobs}',
  templatecontroller985: '🧪 [API-TEMPLATE-QUEUE] Envío de trabajo completado para la plantilla {$template->id}',

  // app\Http\Controllers\Api\TranslationExportController.php
  translationexportcontroller30: 'Se requiere identificación del proyecto',
  translationexportcontroller34: 'Se requiere al menos un idioma',
  translationexportcontroller48: 'Traducciones',
  translationexportcontroller51: 'Campo',
  translationexportcontroller78: 'Mesa',
  translationexportcontroller103: 'Campo',
  translationexportcontroller131: 'Y-m-d_H-i-s',
  translationexportcontroller175: 'Encabezados de importación:',
  translationexportcontroller197: 'Columnas de idioma a importar:',
  translationexportcontroller223: 'Tablas existentes:',
  translationexportcontroller224: 'Campos existentes:',
  translationexportcontroller273: 'Saltar elemento',
  translationexportcontroller278: 'Procesando fila {$row}: tipo={$type}',
  translationexportcontroller312: '¡Importación exitosa! {$imported} nuevas traducciones importadas',
  translationexportcontroller331: 'Error de importación de traducción:',
  translationexportcontroller339: 'Error en la importación:',

  // app\Http\Controllers\Api\UltimateTemplateController.php
  ultimatetemplatecontroller42: 'Plantilla no encontrada',
  ultimatetemplatecontroller55: 'Proceso principalPlantilla: templateId=$templateId',
  ultimatetemplatecontroller102: 'Error en el procesamiento de la plantilla definitiva',
  ultimatetemplatecontroller151: 'restricciones.columnasderestricción.campo',
  ultimatetemplatecontroller165: 'restricciones.columnasderestricción.campo',
  ultimatetemplatecontroller174: 'Esquema de demostración',
  ultimatetemplatecontroller177: 'Esquema de base de datos de demostración',
  ultimatetemplatecontroller196: '🌍 Depuración de idiomas: encontrado',
  ultimatetemplatecontroller216: 'Proyecto de demostración',
  ultimatetemplatecontroller241: 'Motor de plantillas Ultimate Scoriet',
  ultimatetemplatecontroller270: 'Y-m-d H:i:s',
  ultimatetemplatecontroller271: 'Y-m-d H:i:s',
  ultimatetemplatecontroller272: 'Usuario de demostración',
  ultimatetemplatecontroller274: 'Proyecto de puntuación de demostración',
  ultimatetemplatecontroller295: 'General',
  ultimatetemplatecontroller300: 'Y-m-d H:i:s',
  ultimatetemplatecontroller301: 'Sistema',
  ultimatetemplatecontroller308: 'd.m.Y',
  ultimatetemplatecontroller309: 'Su',
  ultimatetemplatecontroller311: 'Europa/Viena',
  ultimatetemplatecontroller359: 'PK no encontrado en las restricciones para {$tableName}',
  ultimatetemplatecontroller535: 'PK no encontrado en las restricciones para {$tableName}',
  ultimatetemplatecontroller563: '🐛 Campos de restricción extraídos para {$tableName}',
  ultimatetemplatecontroller770: 'Año-mes-día',
  ultimatetemplatecontroller771: 'Su',
  ultimatetemplatecontroller772: 'Y-m-d_H-i-s',
  ultimatetemplatecontroller804: '🔧 Depuración del backend: parámetro tableName recibido:',
  ultimatetemplatecontroller815: '🔧 Depuración de backend: recuento de gtree:',
  ultimatetemplatecontroller825: 'Depuración del backend: se encontró la tabla en el índice $index:',
  ultimatetemplatecontroller833: 'Depuración de backend: no se proporcionó el parámetro tableName',
  ultimatetemplatecontroller879: '// Archivos generados',
  ultimatetemplatecontroller881: '// Archivo: {$file[',

  // app\Http\Controllers\AuthController.php
  authcontroller42: 'Esta dirección de correo electrónico ya está registrada. ¿Quieres iniciar sesión?',
  authcontroller44: 'Por favor, introduce una dirección de correo electrónico válida.',
  authcontroller48: 'Este nombre de usuario ya está en uso. Elige uno diferente.',
  authcontroller50: 'El nombre de usuario debe contener solo letras minúsculas',
  authcontroller54: 'Las contraseñas no coinciden.',
  authcontroller56: 'La contraseña debe tener al menos 8 caracteres.',
  authcontroller59: 'Por favor, introduzca su nombre.',
  authcontroller61: 'Por favor revise sus entradas.',
  authcontroller83: 'Registro con token de invitación',
  authcontroller100: 'Invitación pendiente encontrada para registro',
  authcontroller124: 'No se pudo enviar la notificación de administrador:',
  authcontroller128: 'Usuario registrado correctamente. Por favor, revise su correo electrónico para ver el enlace de confirmación.',
  authcontroller147: 'Error de validación',
  authcontroller156: 'error de inicio de sesion',
  authcontroller165: 'La dirección de correo electrónico debe confirmarse antes de iniciar sesión',
  authcontroller183: 'Token de acceso personal',
  authcontroller190: 'Inicio de sesión exitoso',
  authcontroller209: 'Dirección de correo electrónico no encontrada',
  authcontroller220: 'Se ha enviado el enlace de restablecimiento',
  authcontroller225: 'Error al enviar el enlace de restablecimiento',
  authcontroller242: 'Error de validación',
  authcontroller260: 'Contraseña restablecida exitosamente',
  authcontroller265: 'Error al restablecer la contraseña',
  authcontroller292: 'Error de validación',
  authcontroller310: 'Perfil actualizado exitosamente',
  authcontroller329: 'Error de validación',
  authcontroller337: 'La contraseña actual es incorrecta',
  authcontroller346: 'Contraseña cambiada exitosamente',
  authcontroller359: 'Enlace de confirmación no válido. El usuario no existe o ha sido eliminado.',
  authcontroller367: 'Enlace de confirmación no válido. El enlace ha expirado o ha sido comprometido.',
  authcontroller374: 'Token de acceso personal',
  authcontroller378: 'Dirección de correo electrónico ya confirmada',
  authcontroller389: 'Token de acceso personal',
  authcontroller401: 'Invitación de aceptación automática después de la verificación del correo electrónico',
  authcontroller412: 'Invitación aceptada automáticamente con éxito',
  authcontroller418: 'Dirección de correo electrónico confirmada correctamente',
  authcontroller429: 'Error de confirmación de correo electrónico',
  authcontroller442: 'Dirección de correo electrónico ya confirmada',
  authcontroller449: 'Se envió nuevamente un correo electrónico de confirmación',
  authcontroller466: 'Error de validación',
  authcontroller474: 'La contraseña ingresada es incorrecta',
  authcontroller488: 'Su cuenta ha sido eliminada exitosamente',
  authcontroller492: 'Error al eliminar la cuenta',
  authcontroller506: 'Se ha cerrado la sesión correctamente',
  authcontroller521: 'Selección de idioma no válida',
  authcontroller532: 'La preferencia de idioma se actualizó correctamente',
  authcontroller537: 'No se pudo actualizar la preferencia de idioma',

  // app\Http\Controllers\Auth\PasswordResetLinkController.php
  passwordresetlinkcontroller39: 'Se enviará un enlace de restablecimiento si la cuenta existe.',

  // app\Http\Controllers\CustomTokenController.php
  customtokencontroller51: 'Las credenciales proporcionadas son incorrectas.',
  customtokencontroller58: 'La dirección de correo electrónico debe confirmarse antes de iniciar sesión',
  customtokencontroller71: 'Las credenciales proporcionadas son incorrectas.',
  customtokencontroller98: 'Error de token de OAuth:',
  customtokencontroller101: 'Se produjo un error al procesar su solicitud.',

  // app\Http\Controllers\DbSchemaController.php
  dbschemacontroller59: 'última versión',
  dbschemacontroller66: 'Acceso denegado a este esquema',
  dbschemacontroller77: 'Esquema no encontrado',
  dbschemacontroller95: 'Acceso denegado a este esquema',
  dbschemacontroller111: 'Esquema no encontrado',
  dbschemacontroller129: 'Acceso denegado a este esquema',
  dbschemacontroller145: 'No puedes editar esta plantilla',
  dbschemacontroller157: 'La plantilla ya está vinculada a este esquema de base de datos',
  dbschemacontroller171: 'Plantilla vinculada al esquema de base de datos correctamente',
  dbschemacontroller195: 'No puedes editar esta plantilla',
  dbschemacontroller207: 'La plantilla se desvinculó del esquema de base de datos correctamente',
  dbschemacontroller212: 'Dependencia no encontrada',
  dbschemacontroller223: 'última versión',
  dbschemacontroller256: 'Sólo puedes copiar tus propios esquemas',
  dbschemacontroller264: 'No se puede copiar un esquema vacío. El esquema de origen debe tener al menos una versión con tablas.',
  dbschemacontroller281: 'Ya tienes un esquema con este nombre. Elige otro.',
  dbschemacontroller288: ' (Copiar)',
  dbschemacontroller305: 'El esquema de origen no tiene versiones válidas para copiar',
  dbschemacontroller310: 'tablas.restricciones.referenciadeclaveexterna.columnasdereferencia',
  dbschemacontroller317: 'Copiado de',
  dbschemacontroller332: 'No se ha establecido el nuevo ID de esquema',
  dbschemacontroller335: 'El ID de la nueva versión no está configurado',
  dbschemacontroller460: 'Esquema de base de datos copiado exitosamente',
  dbschemacontroller472: 'No se pudo copiar el esquema:',

  // app\Http\Controllers\PageController.php
  pagecontroller43: 'Página de ayuda no encontrada para la configuración regional: {$locale}',
  pagecontroller46: 'Página CMS',
  pagecontroller67: 'Página de pie de imprenta no encontrada para la configuración regional: {$locale}',
  pagecontroller70: 'Página CMS',

  // app\Http\Controllers\ProjectApplicationController.php
  projectapplicationcontroller24: 'Error de validación',
  projectapplicationcontroller36: 'Código de registro no válido o aplicaciones no permitidas',
  projectapplicationcontroller49: 'Ya has enviado una solicitud para este proyecto.',
  projectapplicationcontroller64: 'Solicitud enviada exitosamente',
  projectapplicationcontroller85: 'Sin autorización',
  projectapplicationcontroller106: '=== MÉTODO LLAMADO ReviewApplication ===',
  projectapplicationcontroller118: 'Revisión de la aplicación: Error en la validación',
  projectapplicationcontroller120: 'Error de validación',
  projectapplicationcontroller130: 'ID de aplicación',
  projectapplicationcontroller131: 'Aplicación no encontrada',
  projectapplicationcontroller137: 'Revisión de depuración de aplicaciones',
  projectapplicationcontroller153: 'Solicitud de revisión: Permiso denegado',
  projectapplicationcontroller158: 'Sin permiso - No eres el propietario del proyecto',
  projectapplicationcontroller164: 'Aplicación de revisión: Ya revisada',
  projectapplicationcontroller166: 'Esta solicitud ya ha sido procesada',
  projectapplicationcontroller173: 'La solicitud fue aceptada',
  projectapplicationcontroller176: 'La solicitud fue rechazada',
  projectapplicationcontroller179: 'Revisión de la aplicación: éxito',
  projectapplicationcontroller210: 'ProjectApplicationController: se llama a getProjectByJoinCode',
  projectapplicationcontroller211: 'código de unión',
  projectapplicationcontroller220: 'ProjectApplicationController: resultado de la búsqueda del proyecto',
  projectapplicationcontroller221: 'código de unión',
  projectapplicationcontroller231: 'Código de registro no válido. Por favor, compruébelo.',
  projectapplicationcontroller237: 'Este proyecto ya no está activo.',
  projectapplicationcontroller243: 'Este proyecto no acepta solicitudes de membresía actualmente.',

  // app\Http\Controllers\ProjectInvitationController.php
  projectinvitationcontroller26: 'No autorizado',
  projectinvitationcontroller37: 'La validación falló',
  projectinvitationcontroller50: 'El usuario ya es miembro de este proyecto.',
  projectinvitationcontroller61: 'Ya se ha enviado una invitación a esta dirección de correo electrónico.',
  projectinvitationcontroller80: 'No se pudo enviar el correo electrónico de invitación al proyecto',
  projectinvitationcontroller88: 'Invitación enviada exitosamente',
  projectinvitationcontroller89: 'usuario invitado',
  projectinvitationcontroller103: 'Token de invitación no válido',
  projectinvitationcontroller107: 'Esta invitación ha expirado',
  projectinvitationcontroller112: 'Esta invitación ya ha sido aceptada',
  projectinvitationcontroller113: 'Esta invitación ya ha sido rechazada',
  projectinvitationcontroller114: 'Esta invitación ha expirado',
  projectinvitationcontroller115: 'Esta invitación ya no es válida',
  projectinvitationcontroller138: 'Token de invitación no válido',
  projectinvitationcontroller143: 'La invitación ya no es válida',
  projectinvitationcontroller150: 'No se pudo aceptar la invitación',
  projectinvitationcontroller154: 'Invitación aceptada con éxito',
  projectinvitationcontroller167: 'Token de invitación no válido',
  projectinvitationcontroller172: 'La invitación ya no es válida',
  projectinvitationcontroller179: 'No se pudo rechazar la invitación',
  projectinvitationcontroller187: 'No se pudo enviar el correo electrónico de notificación de rechazo',
  projectinvitationcontroller194: 'Invitación rechazada exitosamente',
  projectinvitationcontroller206: 'No autorizado',
  projectinvitationcontroller210: 'usuario invitado',
  projectinvitationcontroller240: '=== Cancelar solicitud de invitación ===',
  projectinvitationcontroller250: 'Cancelar invitación: No autorizado',
  projectinvitationcontroller254: 'No autorizado',
  projectinvitationcontroller258: 'Cancelar invitación: Proyecto equivocado',
  projectinvitationcontroller262: 'La invitación no pertenece a este proyecto.',
  projectinvitationcontroller266: 'Cancelar invitación: No pendiente',
  projectinvitationcontroller269: 'Sólo se pueden cancelar invitaciones pendientes',
  projectinvitationcontroller273: 'Invitación cancelada exitosamente',
  projectinvitationcontroller275: 'Invitación cancelada exitosamente',
  projectinvitationcontroller286: 'No hay invitación pendiente',
  projectinvitationcontroller296: 'No hay invitación pendiente',
  projectinvitationcontroller310: 'No hay invitación pendiente',
  projectinvitationcontroller316: 'No hay invitación pendiente',
  projectinvitationcontroller323: 'No se pudo aceptar la invitación',
  projectinvitationcontroller330: 'Invitación aceptada con éxito',
  projectinvitationcontroller343: 'No hay invitación pendiente',
  projectinvitationcontroller349: 'No hay invitación pendiente',
  projectinvitationcontroller358: 'Invitación rechazada',

  // app\Http\Controllers\QueueTestController.php
  queuetestcontroller61: '🧪 [TEST] Iniciando prueba de despacho de trabajo',
  queuetestcontroller65: 'No se encontró ningún proyecto',
  queuetestcontroller69: '🧪 [PRUEBA] Trabajos antes del envío: {$jobsBefore}',
  queuetestcontroller77: '🧪 [PRUEBA] Trabajos después del envío: {$jobsAfter}',
  queuetestcontroller86: 'El envío del trabajo falló',
  queuetestcontroller89: '🧪 [PRUEBA] Error en el envío del trabajo:',
  queuetestcontroller102: '🧪 [TEST] Iniciando prueba de creación de versión de esquema',
  queuetestcontroller106: 'No se encontró ningún esquema',
  queuetestcontroller116: 'El esquema no está conectado a ningún proyecto',
  queuetestcontroller117: 'Primero conecte el esquema a un proyecto usando la tabla project_schemas',
  queuetestcontroller122: '🧪 [PRUEBA] Trabajos antes de la creación de la versión del esquema: {$jobsBefore}',
  queuetestcontroller126: 'Versión de prueba para pruebas de cola',
  queuetestcontroller127: '🧪 [TEST] Versión del esquema creada: {$version->id}',
  queuetestcontroller130: '🧪 [PRUEBA] Trabajos después de la creación de la versión del esquema: {$jobsAfter}',
  queuetestcontroller142: 'No se enviaron trabajos',
  queuetestcontroller145: '🧪 [PRUEBA] Error en la creación de la versión del esquema:',
  queuetestcontroller162: 'Proyecto no encontrado',
  queuetestcontroller173: '🧪 [MANUAL] Trabajo enviado manualmente para el proyecto {$projectId}',
  queuetestcontroller181: 'Trabajo enviado manualmente con éxito',
  queuetestcontroller201: 'Archivo de registro no encontrado',
  queuetestcontroller211: '🧪 [PRUEBA DE COLA]',
  queuetestcontroller212: '🧪 [PRUEBA]',
  queuetestcontroller213: '🧪 [MANUAL]',

  // app\Http\Controllers\SchemaController.php
  schemacontroller21: 'Dependencias de plantilla.plantilla',
  schemacontroller64: 'Dependencias de plantilla.plantilla',
  schemacontroller71: 'Acceso denegado a este esquema',
  schemacontroller82: 'Esquema no encontrado',
  schemacontroller105: 'Necesita una cuenta premium para crear esquemas privados',
  schemacontroller117: 'Ya tienes un esquema con este nombre',
  schemacontroller132: 'Esquema creado exitosamente',
  schemacontroller155: 'Sólo puedes editar tus propios esquemas',
  schemacontroller169: 'Necesita una cuenta premium para hacer que los esquemas sean privados',
  schemacontroller183: 'Ya tienes un esquema con este nombre',
  schemacontroller193: 'Esquema actualizado exitosamente',
  schemacontroller216: 'Sólo puedes eliminar tus propios esquemas',
  schemacontroller225: 'No se puede eliminar el esquema. Está siendo utilizado por {$dependentTemplates} plantillas.',
  schemacontroller234: 'Esquema eliminado exitosamente',
  schemacontroller256: 'Acceso denegado a este esquema',
  schemacontroller272: 'Esquema no encontrado',
  schemacontroller290: 'Acceso denegado a este esquema',
  schemacontroller306: 'No puedes editar esta plantilla',
  schemacontroller318: 'La plantilla ya está vinculada a este esquema',
  schemacontroller332: 'Plantilla vinculada al esquema correctamente',
  schemacontroller356: 'No puedes editar esta plantilla',
  schemacontroller368: 'Plantilla desvinculada del esquema correctamente',
  schemacontroller373: 'Dependencia no encontrada',
  schemacontroller384: 'Dependencias de plantilla.plantilla',

  // app\Http\Controllers\SchemaExportController.php
  schemaexportcontroller31: 'Acceso denegado a este esquema',
  schemaexportcontroller56: 'No se encontró ninguna versión para este esquema',
  schemaexportcontroller66: 'restricciones.columnasderestricción.campo',
  schemaexportcontroller67: 'restricciones.referenciadeclaveexterna.columnasdereferencia.camporeferenciado',
  schemaexportcontroller125: 'Exportación fallida:',
  schemaexportcontroller144: 'Acceso denegado a este esquema',
  schemaexportcontroller169: 'No se encontró ninguna versión para este esquema',
  schemaexportcontroller178: 'restricciones.columnasderestricción.campo',
  schemaexportcontroller179: 'restricciones.referenciadeclaveexterna.columnasdereferencia.camporeferenciado',
  schemaexportcontroller193: 'No se encontraron tablas en este esquema',
  schemaexportcontroller213: 'Error en la exportación de MySQL:',
  schemaexportcontroller224: '-- Exportación de base de datos MySQL',
  schemaexportcontroller225: '-- Esquema:',
  schemaexportcontroller226: 'Sin descripción',
  schemaexportcontroller227: '-- Versión: ',
  schemaexportcontroller228: '-- Generado:',
  schemaexportcontroller229: '-- Número de mesas:',
  schemaexportcontroller237: '-- Mesa: ',
  schemaexportcontroller239: '-- Comentario: ',
  schemaexportcontroller272: ' COMENTARIO',
  schemaexportcontroller283: 'Restricciones de procesamiento para la tabla: {$table->table_name}',
  schemaexportcontroller284: 'Recuento de restricciones:',
  schemaexportcontroller286: 'Restricción: {$constraint->constraint_name} (tipo: {$constraint->constraint_type})',
  schemaexportcontroller287: 'Número de columnas de restricción:',
  schemaexportcontroller293: 'PRIMARIO',
  schemaexportcontroller339: 'AL BORRAR',
  schemaexportcontroller358: ' COMENTARIO',
  schemaexportcontroller367: '-- Exportación completada exitosamente',
  schemaexportcontroller368: '--Total de tablas exportadas:',
  schemaexportcontroller386: 'Acceso denegado a este esquema',
  schemaexportcontroller402: 'No se pudo obtener el recuento de la tabla:',
  schemaexportcontroller418: 'Esquema no encontrado',
  schemaexportcontroller437: 'No se encontró ninguna versión para este esquema',
  schemaexportcontroller447: 'restricciones.columnasderestricción.campo',
  schemaexportcontroller448: 'restricciones.referenciadeclaveexterna.columnasdereferencia.camporeferenciado',
  schemaexportcontroller471: 'Investigación de la relación entre esquemas - INVESTIGACIÓN PROFUNDA',
  schemaexportcontroller483: 'Esquema → versiones_de_schema → tablas_de_schema (a través de id_de_versión_de_schema)',
  schemaexportcontroller484: 'NULL (no se utiliza en este sistema)',
  schemaexportcontroller489: 'Error de depuración:',

  // app\Http\Controllers\SqlParserController.php
  sqlparsercontroller29: 'Se requiere un script SQL',
  sqlparsercontroller72: 'Se requiere un script SQL',
  sqlparsercontroller79: 'Se requiere ID de esquema',
  sqlparsercontroller89: 'Esquema no encontrado',
  sqlparsercontroller98: 'No tienes permiso para editar este esquema',
  sqlparsercontroller151: 'Error en la importación de SQL',
  sqlparsercontroller165: 'Error de sintaxis',
  sqlparsercontroller166: 'Por favor, revise su sintaxis SQL para ver si faltan puntos y comas.',
  sqlparsercontroller171: 'Función no compatible',
  sqlparsercontroller172: 'Nuestro analizador aún no admite esta función SQL. Intente simplificar su SQL.',
  sqlparsercontroller177: 'Error de tabla/columna',
  sqlparsercontroller178: 'Verifique las definiciones de tablas y columnas para verificar la sintaxis correcta.',
  sqlparsercontroller182: 'Error de análisis',
  sqlparsercontroller183: 'Revise su SQL para detectar problemas comunes como puntos y comas faltantes.',
  sqlparsercontroller236: '🐛 Depuración de cambios importantes',
  sqlparsercontroller262: '🐛 Después del filtrado de la tabla del sistema',
  sqlparsercontroller277: '🐛 Depuración de mensajes de error',
  sqlparsercontroller278: 'Tablas existentes de negocios',
  sqlparsercontroller279: 'BusinessNewTables',
  sqlparsercontroller280: 'Número de negocios existente',
  sqlparsercontroller281: 'nuevoBusinessCount',
  sqlparsercontroller282: 'tipo_de_tablas_existentes_de_negocio',
  sqlparsercontroller283: 'tipo_de_tablas_de_negocio',
  sqlparsercontroller294: '🛡️ CAMBIO IMPORTANTE DETECTADO: Esta importación de SQL crearía una estructura de base de datos completamente nueva sin superposición de tablas.',
  sqlparsercontroller295: 'La versión actual tiene {$existingBusinessCount} tablas de negocios: {$existingTablesList}',
  sqlparsercontroller296: 'La nueva importación tiene {$newBusinessCount} tablas de negocio: {$newTablesList}',
  sqlparsercontroller297: '🚨 Por la seguridad de los datos',
  sqlparsercontroller298: '✅ Solución: crear una nueva base de datos/esquema para esta estructura en lugar de versionar el existente.',
  sqlparsercontroller299: '✅ Alternativa: asegúrese de que al menos un nombre de tabla comercial coincida entre las versiones.',
  sqlparsercontroller303: '✅ Validación de cambio importante aprobada',
  sqlparsercontroller320: 'Versión del esquema no encontrada',
  sqlparsercontroller361: 'Versión del esquema no encontrada',
  sqlparsercontroller395: 'Se requiere un script SQL',
  sqlparsercontroller405: 'SQL analizado correctamente',
  sqlparsercontroller430: '🧪 [QUEUE-TEST] Iniciando despacho de trabajo para el esquema {$schema->id} ({$schema->name})',
  sqlparsercontroller439: '🧪 [QUEUE-TEST] Se encontraron los siguientes ID de proyecto:',
  sqlparsercontroller442: '🧪 [QUEUE-TEST] Esquema {$schema->id}: No hay proyectos afectados para la regeneración de la cola',
  sqlparsercontroller446: '🧪 [QUEUE-TEST] Esquema {$schema->id}: Despachando regeneración para',
  sqlparsercontroller450: '🧪 [QUEUE-TEST] Trabajos en cola antes del envío: {$jobsBefore}',
  sqlparsercontroller455: '🧪 [QUEUE-TEST] Enviando el trabajo RegenerateProjectGenerationTree para el proyecto {$projectId}',
  sqlparsercontroller460: '🧪 [QUEUE-TEST] Trabajo enviado exitosamente para el proyecto {$projectId}',
  sqlparsercontroller462: '🧪 [QUEUE-TEST] No se pudo enviar el trabajo para el proyecto {$projectId}:',
  sqlparsercontroller468: '🧪 [QUEUE-TEST] Trabajos en cola después del envío: {$jobsAfter}',
  sqlparsercontroller469: '🧪 [QUEUE-TEST] Total de trabajos enviados: {$dispatchedJobs}',
  sqlparsercontroller470: '🧪 [QUEUE-TEST] Envío de trabajo completado para el esquema {$schema->id}',

  // app\Http\Controllers\TeamController.php
  teamcontroller88: 'La validación falló',
  teamcontroller117: 'Equipo creado exitosamente',
  teamcontroller131: 'No autorizado',
  teamcontroller149: 'Permisos insuficientes',
  teamcontroller169: 'La validación falló',
  teamcontroller191: 'Equipo actualizado exitosamente',
  teamcontroller205: 'Sólo el propietario del equipo puede eliminar el equipo.',
  teamcontroller210: 'Equipo eliminado exitosamente',
  teamcontroller223: 'Permisos insuficientes',
  teamcontroller231: 'Miembro no encontrado',
  teamcontroller236: 'No se puede eliminar al propietario del equipo',
  teamcontroller241: 'Miembro eliminado exitosamente',
  teamcontroller254: 'Permisos insuficientes',
  teamcontroller263: 'La validación falló',
  teamcontroller273: 'Miembro no encontrado',
  teamcontroller278: 'No se puede cambiar el rol del propietario',
  teamcontroller284: 'El rol de miembro se actualizó correctamente',
  teamcontroller298: 'No autorizado',
  teamcontroller308: 'La validación falló',
  teamcontroller317: 'El usuario ya es miembro de este equipo',
  teamcontroller330: 'Miembro añadido al equipo exitosamente',
  teamcontroller344: 'No autorizado',

  // app\Http\Controllers\TeamInvitationController.php
  teaminvitationcontroller26: 'Permisos insuficientes',
  teaminvitationcontroller38: 'La validación falló',
  teaminvitationcontroller46: 'El usuario ya es miembro del equipo',
  teaminvitationcontroller56: 'El usuario ya tiene una invitación pendiente',
  teaminvitationcontroller70: 'Invitación enviada exitosamente',
  teaminvitationcontroller106: 'Permisos insuficientes',
  teaminvitationcontroller124: 'Token de invitación no válido',
  teaminvitationcontroller132: 'Esta invitación no es para ti',
  teaminvitationcontroller137: 'La invitación ha expirado',
  teaminvitationcontroller139: 'No se puede aceptar la invitación',
  teaminvitationcontroller143: 'Invitación aceptada con éxito',
  teaminvitationcontroller156: 'Token de invitación no válido',
  teaminvitationcontroller164: 'Esta invitación no es para ti',
  teaminvitationcontroller168: 'No se puede rechazar la invitación',
  teaminvitationcontroller171: 'Invitación rechazada',
  teaminvitationcontroller184: 'Permisos insuficientes',
  teaminvitationcontroller188: 'Sólo se pueden cancelar invitaciones pendientes',
  teaminvitationcontroller193: 'Invitación cancelada',
  teaminvitationcontroller206: 'Permisos insuficientes',
  teaminvitationcontroller210: 'Sólo se pueden reenviar invitaciones pendientes o vencidas',
  teaminvitationcontroller222: 'Invitación reenviada exitosamente',

  // app\Http\Controllers\TemplateController.php
  templatecontroller22: 'Todo',
  templatecontroller98: 'Plantilla no encontrada',
  templatecontroller140: 'plantillas/{$template->id}/{$fileData[',
  templatecontroller154: 'Plantilla creada exitosamente',
  templatecontroller222: 'Plantilla actualizada exitosamente',
  templatecontroller243: 'Plantilla eliminada exitosamente',
  templatecontroller306: 'La asignación de plantilla está actualmente simulada: integración de la base de datos pendiente',
  templatecontroller328: 'Eliminación de plantilla simulada con éxito',
  templatecontroller329: 'Actualmente se está simulando la eliminación de la plantilla (integración de la base de datos pendiente)',
  templatecontroller334: 'Eliminación simulada fallida',
  templatecontroller369: 'Administrador de plantillas de Scoriet',
  templatecontroller382: 'Plantilla no encontrada',
  templatecontroller420: 'Ya existe una plantilla con este nombre. Establezca overwrite_existing en verdadero para reemplazarla.',
  templatecontroller445: 'plantillas/{$template->id}/{$fileData[',
  templatecontroller455: 'Plantilla importada exitosamente',
  templatecontroller481: 'Plantilla no encontrada',
  templatecontroller493: 'Solicitud de agregar dependencia del esquema de base de datos',
  templatecontroller509: 'No puedes agregar dependencias a esta plantilla',
  templatecontroller523: 'Validación aprobada',
  templatecontroller525: 'La validación falló',
  templatecontroller533: 'Esquema encontrado',
  templatecontroller538: 'Acceso al esquema denegado',
  templatecontroller544: 'Acceso denegado a este esquema de base de datos',
  templatecontroller553: 'Comprobación de dependencia',
  templatecontroller558: 'La dependencia ya existe',
  templatecontroller561: 'La plantilla ya depende de este esquema de base de datos',
  templatecontroller565: 'Creando dependencia',
  templatecontroller579: 'Dependencia creada exitosamente',
  templatecontroller585: 'Dependencia del esquema de base de datos agregada exitosamente',
  templatecontroller587: 'Excepción en addDbSchemaDependency',
  templatecontroller616: 'No puedes eliminar dependencias de esta plantilla',
  templatecontroller628: 'Dependencia del esquema de base de datos eliminada correctamente',
  templatecontroller633: 'Dependencia no encontrada',
  templatecontroller654: 'No puedes actualizar las dependencias de esta plantilla',
  templatecontroller672: 'La dependencia del esquema de base de datos se actualizó correctamente',
  templatecontroller677: 'Dependencia no encontrada',
  templatecontroller695: 'Acceso denegado a este esquema de base de datos',
  templatecontroller713: 'Esquema de base de datos no encontrado',
  templatecontroller723: '🧪 [TEMPLATE-QUEUE] Iniciando despacho de trabajo para la plantilla {$template->id} ({$template->name})',
  templatecontroller733: '🧪 [TEMPLATE-QUEUE] ID de proyectos encontrados:',
  templatecontroller736: '🧪 [TEMPLATE-QUEUE] Plantilla {$template->id}: Todavía no hay proyectos que usen esta plantilla',
  templatecontroller740: '🧪 [TEMPLATE-QUEUE] Plantilla {$template->id}: Enviando regeneración para',
  templatecontroller744: '🧪 [TEMPLATE-QUEUE] Trabajos en cola antes del envío: {$jobsBefore}',
  templatecontroller750: '🧪 [TEMPLATE-QUEUE] Enviando el trabajo RegenerateProjectGenerationTree para el proyecto {$projectId}',
  templatecontroller754: '🧪 [TEMPLATE-QUEUE] Trabajo enviado exitosamente para el proyecto {$projectId}',
  templatecontroller756: '🧪 [TEMPLATE-QUEUE] No se pudo enviar el trabajo para el proyecto {$projectId}:',
  templatecontroller762: '🧪 [TEMPLATE-QUEUE] Trabajos en cola después del envío: {$jobsAfter}',
  templatecontroller764: '🧪 [TEMPLATE-QUEUE] Total de trabajos enviados: {$dispatchedJobs}',
  templatecontroller765: '🧪 [TEMPLATE-QUEUE] Envío de trabajo completado para la plantilla {$template->id}',

  // app\Http\Controllers\UserController.php
  usercontroller25: 'Usuario no autenticado.',
  usercontroller36: 'La marca de tiempo de inicio de sesión se actualizó correctamente.',

  // app\Http\Middleware\CheckSystemUser.php
  checksystemuser25: 'Acceso denegado. Se requieren privilegios de sistema o administrador.',

  // app\Http\Middleware\EnsureUserIsAdmin.php
  ensureuserisadmin32: 'Comprobación del middleware de administración',
  ensureuserisadmin42: 'Acceso de administrador denegado: Usuario no autenticado',
  ensureuserisadmin47: 'No autenticado. Por favor, inicia sesión primero.',
  ensureuserisadmin52: 'Por favor inicia sesión',
  ensureuserisadmin58: 'Resultado de la comprobación de administración',
  ensureuserisadmin64: 'Acceso de administrador denegado: el usuario no es administrador/sistema',
  ensureuserisadmin72: 'Prohibido. Se requiere acceso de administrador.',
  ensureuserisadmin77: 'Acceso denegado. Solo los administradores del sistema tienen acceso a esta área.',
  ensureuserisadmin80: 'Acceso de administrador concedido',

  // app\JobsegenerateProjectGenerationTree.php
  jobsegenerateprojectgenerationtree36: 'Proyecto {$this->projectId} no encontrado para la regeneración del árbol de generación',
  jobsegenerateprojectgenerationtree40: 'Regenerando árbol generacional para el proyecto: {$project->name} (ID: {$project->id})',
  jobsegenerateprojectgenerationtree45: 'Árbol de generación regenerado correctamente para el proyecto {$project->id}. Total de elementos:',
  jobsegenerateprojectgenerationtree48: 'No se pudo regenerar el árbol de generación para el proyecto {$this->projectId}:',

  // app\Jobs\RegenerateProjectGenerationTree.php
  regenerateprojectgenerationtree36: 'Proyecto {$this->projectId} no encontrado para la regeneración del árbol de generación',
  regenerateprojectgenerationtree40: 'Regenerando árbol generacional para el proyecto: {$project->name} (ID: {$project->id})',
  regenerateprojectgenerationtree45: 'Árbol de generación regenerado correctamente para el proyecto {$project->id}. Total de elementos:',
  regenerateprojectgenerationtree48: 'No se pudo regenerar el árbol de generación para el proyecto {$this->projectId}:',

  // app\Mail\ProjectInvitationMail.php
  projectinvitationmail33: 'Tú',

  // app\Models\FloatingSchema.php
  floatingschema180: '(Clon)',

  // app\Models\ProjectApplication.php
  projectapplication96: 'Agregado mediante aprobación de la aplicación',

  // app\Models\Project.php
  project430: 'No hay ningún usuario autenticado para enviar invitación',

  // app\Models\SchemaVersion.php
  schemaversion50: 'Versión {$nextVersion}',
  schemaversion81: '🔍crearNuevaVersiónConCopiar inicio',
  schemaversion93: '✅ Nueva versión vacía creada',
  schemaversion101: '❌ Versión fuente no encontrada',
  schemaversion102: 'No se encontró la versión de origen {$fromVersionNumber}',
  schemaversion105: '✅ Versión fuente encontrada',
  schemaversion111: '🚀 Fase 1: Copiar tablas',
  schemaversion115: '📋 Copiar tabla',
  schemaversion127: '✅ Tabla creada',
  schemaversion134: '📝 Copiar campos',
  schemaversion138: '🔤 Copiando campo',
  schemaversion156: '✅ Campo copiado exitosamente',
  schemaversion158: '❌ Error al copiar el campo',
  schemaversion168: '🔗 Fase 1: Copia de restricciones que no son FK',
  schemaversion172: '🔒 Restricción de copia',
  schemaversion182: '✅ Restricción creada',
  schemaversion210: '🚨 Clave externa OMITIDA - Tabla referenciada no encontrada',
  schemaversion238: '❌ Error al copiar la restricción',
  schemaversion248: '🚀 Fase 2: Procesamiento de restricciones de clave externa',
  schemaversion254: '🔑 Procesamiento de restricciones FK para la tabla',
  schemaversion261: '🔒 Fase 2: Creación de la restricción FK',
  schemaversion273: '✅ Restricción FK creada',
  schemaversion310: '✅ Referencia FK creada con éxito',
  schemaversion312: '❌ Fase 2: La tabla referenciada aún no se encuentra',
  schemaversion319: '❌ No se pudo copiar la restricción FK en la Fase 2',
  schemaversion330: '📐 Copiar datos de diseño',
  schemaversion338: '📐 Se encontró un diseño para copiar',
  schemaversion351: '📐 Diseño copiado exitosamente',
  schemaversion353: '📐 No se encontró ningún diseño para copiar de la versión',
  schemaversion356: '❌ Error al copiar el diseño',
  schemaversion365: '🎉 createNewVersionWithCopy se completó correctamente',
  schemaversion381: 'j.n.Y',

  // app\Notifications\NewUserRegistered.php
  newuserregistered40: 'd.m.Y H:i:s',
  newuserregistered43: '?? Nuevo registro en Scoriet',
  newuserregistered44: '¡Hola administrador!',
  newuserregistered45: 'Un nuevo usuario se ha registrado en Scoriet:',
  newuserregistered47: '**Información del usuario:**',
  newuserregistered48: '• **Nombre:** ',
  newuserregistered49: '• **Nombre de usuario:** ',
  newuserregistered50: '• **Correo electrónico:**',
  newuserregistered51: '• **ID de usuario:**',
  newuserregistered52: '• **Registrado el:**',
  newuserregistered54: '**Estado del correo electrónico:**',
  newuserregistered56: 'Mostrar usuarios en el panel de administración',
  newuserregistered57: 'Este correo electrónico se generó automáticamente.',
  newuserregistered58: 'Un cordial saludo desde el sistema Scoriet.',

  // app\Observers\ProjectGenerationTreeObserver.php
  projectgenerationtreeobserver17: '🌳 [GENERATION-TREE-OBSERVER] datos del árbol actualizados para el proyecto {$generationTree->project_id}',
  projectgenerationtreeobserver30: '🌳 [GENERATION-TREE-OBSERVER] evento guardado para el proyecto {$generationTree->project_id}',
  projectgenerationtreeobserver44: '🌳 [GENERATION-TREE-OBSERVER] Actualización de transmisión para el proyecto {$generationTree->project_id}',
  projectgenerationtreeobserver60: '🌳 [GENERATION-TREE-OBSERVER] Error al transmitir la actualización del árbol:',

  // app\Observers\ProjectObserver.php
  projectobserver18: 'Proyecto {$project->id} idiomas actualizados: Despachando regeneración',

  // app\Observers\ProjectSchemaObserver.php
  projectschemaobserver23: '🔔 [PROYECTO-ESQUEMA-OBSERVADOR] Esquema asignado al Proyecto',
  projectschemaobserver33: '✅ [PROYECTO-ESQUEMA-OBSERVADOR] Trabajo de árbol de generación enviado',
  projectschemaobserver37: '❌ [PROYECTO-ESQUEMA-OBSERVADOR] No se pudo enviar el trabajo',
  projectschemaobserver51: '🔔 [PROYECTO-ESQUEMA-OBSERVADOR] Esquema eliminado del Proyecto',
  projectschemaobserver61: '✅ [PROYECTO-ESQUEMA-OBSERVADOR] Trabajo de árbol de generación enviado',
  projectschemaobserver65: '❌ [PROYECTO-ESQUEMA-OBSERVADOR] No se pudo enviar el trabajo',

  // app\Observers\ProjectTemplateUsageObserver.php
  projecttemplateusageobserver16: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] evento creado activado para el uso {$projectTemplateUsage->id} (proyecto: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver27: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] is_active cambió para el uso {$projectTemplateUsage->id} (proyecto: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver37: '🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] evento eliminado activado para el uso {$projectTemplateUsage->id} (proyecto: {$projectTemplateUsage->project_id}',
  projecttemplateusageobserver48: 'ProjectTemplateUsage {$projectTemplateUsage->id} ({$action}): Despachando regeneración para el proyecto {$projectId}',
  projecttemplateusageobserver52: 'Trabajo de regeneración enviado con éxito para el proyecto {$projectId}',
  projecttemplateusageobserver54: 'No se pudo enviar el trabajo de regeneración para el proyecto {$projectId}:',

  // app\Observers\SchemaTableObserver.php
  schematableobserver17: '📋 [SCHEMA-TABLE-OBSERVER] evento creado activado para la tabla {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver26: '📋 [SCHEMA-TABLE-OBSERVER] evento actualizado activado para la tabla {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver35: '📋 [SCHEMA-TABLE-OBSERVER] Se activó el evento eliminado para la tabla {$schemaTable->id} ({$schemaTable->table_name})',
  schematableobserver52: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): No se encontraron proyectos activos',
  schematableobserver56: '📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Despachando regeneración para TODOS',
  schematableobserver66: '📋 [SCHEMA-TABLE-OBSERVER] Se está ejecutando un trabajo de regeneración de forma sincrónica para el proyecto {$projectId}',
  schematableobserver72: 'Trabajo de regeneración enviado con éxito para el proyecto {$projectId}',
  schematableobserver75: 'No se pudo enviar/ejecutar el trabajo de regeneración para el proyecto {$projectId}:',

  // app\Observers\SchemaVersionObserver.php
  schemaversionobserver17: 'SchemaVersionObserver: evento creado activado para la versión del esquema {$schemaVersion->id}',
  schemaversionobserver50: 'SchemaVersion {$schemaVersion->id} ({$action}): No se encontraron proyectos activos',
  schemaversionobserver54: 'SchemaVersion {$schemaVersion->id} ({$action}): Despachando regeneración para TODOS',
  schemaversionobserver64: 'SchemaVersion {$schemaVersion->id} ({$action}): Ejecutando un trabajo de regeneración sincrónicamente para el proyecto {$projectId}',
  schemaversionobserver70: 'Trabajo de regeneración enviado con éxito para el proyecto {$projectId}',
  schemaversionobserver73: 'No se pudo enviar/ejecutar el trabajo de regeneración para el proyecto {$projectId}:',

  // app\Observers\TemplateFileObserver.php
  templatefileobserver17: '📄 [TEMPLATE-FILE-OBSERVER] evento creado activado para el archivo {$templateFile->id} (plantilla: {$templateFile->template_id})',
  templatefileobserver26: '📄 [TEMPLATE-FILE-OBSERVER] evento actualizado activado para el archivo {$templateFile->id} (plantilla: {$templateFile->template_id})',
  templatefileobserver35: '📄 [TEMPLATE-FILE-OBSERVER] Se activó el evento eliminado para el archivo {$templateFile->id} (plantilla: {$templateFile->template_id})',
  templatefileobserver53: 'TemplateFile {$templateFile->id} ({$action}): No hay proyectos afectados',
  templatefileobserver57: 'TemplateFile {$templateFile->id} ({$action}): Despachando regeneración para',
  templatefileobserver63: 'Trabajo de regeneración enviado con éxito para el proyecto {$projectId}',
  templatefileobserver65: 'No se pudo enviar el trabajo de regeneración para el proyecto {$projectId}:',

  // app\Observers\TemplateObserver.php
  templateobserver17: '🧪 [TEMPLATE-OBSERVER] creó un evento activado para la plantilla {$template->id} ({$template->name})',
  templateobserver53: 'La plantilla {$template->id} fue eliminada a la fuerza',
  templateobserver70: 'Plantilla {$template->id} ({$action}): No hay proyectos afectados',
  templateobserver74: 'Plantilla {$template->id} ({$action}): Despachando regeneración para',

  // appotificationsewUserRegistered.php
  appotificationsewuserregistered40: 'd.m.Y H:i:s',
  appotificationsewuserregistered43: '🎉 Nuevo registro en Scoriet',
  appotificationsewuserregistered44: '¡Hola administrador!',
  appotificationsewuserregistered45: 'Un nuevo usuario se ha registrado en Scoriet:',
  appotificationsewuserregistered47: '**Información del usuario:**',
  appotificationsewuserregistered48: '• **Nombre:** ',
  appotificationsewuserregistered49: 'No especificado',
  appotificationsewuserregistered50: '• **Correo electrónico:**',
  appotificationsewuserregistered51: '• **ID de usuario:**',
  appotificationsewuserregistered52: '• **Registrado el:**',
  appotificationsewuserregistered54: '⏳ Aún no confirmado',
  appotificationsewuserregistered56: 'Mostrar usuarios en el panel de administración',
  appotificationsewuserregistered57: 'Este correo electrónico se generó automáticamente.',
  appotificationsewuserregistered58: 'Un cordial saludo desde el sistema Scoriet.',

  // app\Services\MySQLParser.php
  mysqlparser18: 'Error de análisis:',

  // app\Services\ProjectFileTreeGenerator.php
  projectfiletreegenerator120: '🧪 [TREE-GEN] Tablas cargadas de TODOS los esquemas:',
  projectfiletreegenerator193: 'Año-mes-día',
  projectfiletreegenerator194: 'Su',
  projectfiletreegenerator195: 'Y-m-d_H-i-s',
  projectfiletreegenerator226: '🧪 [TREE-GEN] La ruta resuelta está vacía para el ID de TemplateFile {$templateFile->id}',
  projectfiletreegenerator263: 'Año-mes-día',
  projectfiletreegenerator264: 'Su',
  projectfiletreegenerator265: 'Y-m-d_H-i-s',
  projectfiletreegenerator296: '🧪 [TREE-GEN] La ruta resuelta está vacía para el ID de TemplateFile {$templateFile->id}',
  projectfiletreegenerator331: 'Año-mes-día',
  projectfiletreegenerator332: 'Su',
  projectfiletreegenerator333: 'Y-m-d_H-i-s',
  projectfiletreegenerator364: '🧪 [TREE-GEN] La ruta resuelta está vacía para el ID de TemplateFile {$templateFile->id}',
  projectfiletreegenerator498: 'de_DE',
  projectfiletreegenerator500: 'de_FR',
  projectfiletreegenerator502: 'es_ES',
  projectfiletreegenerator504: 'nl_NL',
  projectfiletreegenerator505: 'pl_PL',
  projectfiletreegenerator506: 'ru_RU',
  projectfiletreegenerator507: 'ja_JP',
  projectfiletreegenerator508: 'zh_CN',

  // app\Services\SchemaStorageService.php
  schemastorageservice226: 'Tabla referenciada',
  schemastorageservice394: '🔧 Clave de archivo migrada',
  schemastorageservice413: '🔧 Nombre de archivo renombrado migrado',
  schemastorageservice427: '🔧 Nombre de archivo corto migrado',
  schemastorageservice436: '🔧 Nombre de archivo corto generado automáticamente',

  // app\Services\SimpleFixedTemplateEngine.php
  simplefixedtemplateengine661: '✅ {filename} se reemplaza correctamente con accounting_log',
  simplefixedtemplateengine662: '✅ No más fantasmas en JavaScript',
  simplefixedtemplateengine663: '✅ Las plantillas se construyen en sus propias líneas',
  simplefixedtemplateengine664: '✅ Estructuras de bucle limpio',
  simplefixedtemplateengine665: '✅ Sin expresiones regulares, solo operaciones con cadenas',

  // app\Services\SimpleTemplateEngine.php
  simpletemplateengine128: 'Desconocido',
  simpletemplateengine129: 'Desconocido',
  simpletemplateengine130: 'Desconocido',
  simpletemplateengine153: 'Desconocido',
  simpletemplateengine154: 'Desconocido',

  // app\Services\SQLParser.php
  sqlparser71: 'Error de sintaxis SQL: Token esperado',
  sqlparser75: 'Error de sintaxis SQL: esperado',
  sqlparser83: 'Error de sintaxis SQL: Fin inesperado del script SQL {$context}. ¿Falta un punto y coma o la instrucción está incompleta?',
  sqlparser96: 'al final de SQL',
  sqlparser130: '(Línea SQL: {$currentLine}',
  sqlparser152: 'Nombre de tabla esperado',
  sqlparser237: 'Nombre de campo esperado',
  sqlparser466: 'Nombre de tabla esperado',

  // app\Services\StepByStepTemplateEngine.php
  stepbysteptemplateengine392: 'Las construcciones de plantillas se dividen en líneas individuales',
  stepbysteptemplateengine394: '{for} y {if} se tratan como bloques separados',
  stepbysteptemplateengine395: 'más en JavaScript',
  stepbysteptemplateengine396: 'Limpiador',

  // app\Services\UltimateTemplateEngine.php
  ultimatetemplateengine195: 'Se superó la profundidad máxima del bucle',
  ultimatetemplateengine656: '// Formato de bucle en línea desconocido: {$matchText}',
  ultimatetemplateengine968: '// Funciones de plantilla integradas',

  // resources/js\app.tsx
  app48: 'euros',
  app59: 'euros',

  // resources/js\Components\AuthModals\AuthModalManager.tsx
  authmodalmanager3: './RegisterModal',
  authmodalmanager5: './PerfilModal',
  authmodalmanager7: './PlanModal',

  // resources/js\Components\AuthModalsegisterModal.tsx
  authmodalsegistermodal58: 'Las contraseñas no coinciden',
  authmodalsegistermodal84: 'Error en el registro. Inténtalo de nuevo.',
  authmodalsegistermodal94: '¡Registro exitoso! Por favor, revise su correo electrónico para ver si hay un enlace de verificación antes de iniciar sesión.',
  authmodalsegistermodal109: 'Se produjo un error',
  authmodalsegistermodal203: 'Registro',
  authmodalsegistermodal239: 'Tu nombre completo',
  authmodalsegistermodal293: 'Tu contraseña',
  authmodalsegistermodal312: 'Repita la contraseña',
  authmodalsegistermodal335: 'Seleccionar idioma',
  authmodalsegistermodal351: 'Seleccionar idioma',
  authmodalsegistermodal366: 'Seleccionar idioma',
  authmodalsegistermodal379: 'Registro',
  authmodalsegistermodal388: '¿Ya tienes una cuenta? Iniciar sesión',

  // resources/js\Components\AuthModalsesetPasswordModal.tsx
  authmodalsesetpasswordmodal73: 'Este enlace de restablecimiento no es válido o ha expirado.',
  authmodalsesetpasswordmodal79: 'Error al validar el enlace de restablecimiento.',
  authmodalsesetpasswordmodal122: 'Error de contraseña:',
  authmodalsesetpasswordmodal124: 'Error de token:',
  authmodalsesetpasswordmodal127: 'Se ha producido un error desconocido. Inténtalo de nuevo.',
  authmodalsesetpasswordmodal131: 'Error de red: inténtelo de nuevo más tarde.',
  authmodalsesetpasswordmodal162: 'Cerca',
  authmodalsesetpasswordmodal265: 'Introduzca nueva contraseña',
  authmodalsesetpasswordmodal287: 'Repita la contraseña',
  authmodalsesetpasswordmodal319: 'Restablecer contraseña',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal43: 'Error al enviar el correo electrónico',
  forgotpasswordmodal46: 'Se ha enviado un enlace de restablecimiento de contraseña a su dirección de correo electrónico.',
  forgotpasswordmodal50: 'Se produjo un error',
  forgotpasswordmodal73: 'Has olvidado tu contraseña',

  // resources/js/Components/AuthModals/ForgotPasswordModal.tsx
  forgotpasswordmodal83: 'Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecer su contraseña.',
  forgotpasswordmodal105: 'Correo electrónico',
  forgotpasswordmodal113: 'tu.email@ejemplo.com',

  // resources/js\Components\AuthModals\ForgotPasswordModal.tsx
  forgotpasswordmodal122: 'Restablecer enlace Enviar',
  forgotpasswordmodal131: 'Volver al inicio de sesión',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginPasswordHint: 'Tu contraseña',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal46: 'idioma cambiado',
  loginmodal49: 'idioma cambiado',
  loginmodal88: 'Debe confirmar su dirección de correo electrónico. Por favor, revise sus correos electrónicos.',
  loginmodal93: 'error de inicio de sesion',
  loginmodal136: 'Se produjo un error',
  loginmodal139: 'error de inicio de sesion',
  loginmodal140: 'El correo electrónico/nombre de usuario o contraseña son incorrectos.',
  loginmodal142: 'La dirección de correo electrónico debe ser confirmada.',
  loginmodal184: '¡Se ha enviado nuevamente el correo electrónico de confirmación!',
  loginmodal189: 'Error al enviar el correo electrónico. Inténtalo de nuevo más tarde.',
  loginmodal212: 'Acceso',

  // resources/js/Components/AuthModals/LoginModal.tsx
  loginmodal241: 'Su dirección de correo electrónico aún no ha sido confirmada.',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal246: 'Reenviar correo electrónico de confirmación',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginDemoTextHeader: 'Modo de demostración disponible',
  LoginDemoDescription: 'Pruebe Scoriet sin registro con datos de demostración listos para usar:',
  LoginDemoAdmin: '- Acceso completo, 2 equipos, 3 proyectos',
  LoginDemoUser: '- Miembro del equipo, asignado 1 proyecto',
  LoginToolTip: 'Haga clic en las tarjetas de arriba para obtener una demostración instantánea o ingrese el nombre de usuario de la demostración manualmente (deje la contraseña vacía). La demostración se reinicia cada 20 minutos.',
  LoginEmailOrUserName: 'Correo electrónico o nombre de usuario',
  LoginEmailOrUserNameHint: 'demo-admin o demo-user',
  LoginPassword: 'Contraseña',

  // resources/js\Components\AuthModals\LoginModal.tsx
  loginmodal317: 'Déjelo en blanco para demostración',
  loginmodal334: 'Acuérdate de mí',

  // resources/js/Components/AuthModals/LoginModal.tsx
  LoginStayLoggedIn: 'Mantener la sesión iniciada (30 días)',
  LoginStayLoggedInTooltip: 'Permanecerá conectado incluso después de cerrar el navegador.',
  LoginDoLogin: 'Iniciando sesión...',
  LoginButton: 'Acceso',
  LoginRegister: '¿No tienes una cuenta? Regístrate',
  LoginForgotPassword: '¿Has olvidado tu contraseña?',

  // resources/js\Components\AuthModals\PlanModal.tsx
  planmodal26: 'euros',
  planmodal43: 'Gratis',
  planmodal46: 'Perfecto para proyectos personales.',
  planmodal48: 'Hasta 3 proyectos',
  planmodal49: 'Plantillas básicas',
  planmodal50: 'Análisis de esquemas SQL',
  planmodal51: 'Apoyo comunitario',
  planmodal53: 'Plan actual',
  planmodal58: 'De primera calidad',
  planmodal62: 'Ideal para desarrolladores profesionales',
  planmodal64: 'Proyectos ilimitados',
  planmodal65: 'Plantillas avanzadas',
  planmodal66: 'Creación de plantillas personalizadas',
  planmodal67: 'Soporte prioritario',
  planmodal68: 'Funciones avanzadas de SQL',
  planmodal69: 'Colaboración en equipo',
  planmodal71: 'Elige Premium',
  planmodal76: 'Negocio',
  planmodal80: 'Ideal para equipos y agencias',
  planmodal82: 'Todas las funciones Premium',
  planmodal83: 'Herramientas de colaboración en equipo',
  planmodal84: 'Integración de la API de Google Translate',
  planmodal85: 'Análisis avanzado',
  planmodal86: 'Soporte prioritario con SLA',
  planmodal87: 'Opciones de marca personalizadas',
  planmodal89: 'Elija Negocio',
  planmodal94: 'Patrón',
  planmodal97: 'Apoya a la comunidad',
  planmodal99: 'Todas las funciones de Business',
  planmodal100: 'Acceso anticipado a las funciones',
  planmodal101: 'Desarrollo de influencia',
  planmodal102: 'Acceso a Discord de la comunidad',
  planmodal103: 'Importe personalizado (5-50€+)',
  planmodal105: 'Elige un mecenas',
  planmodal116: 'Elige tu plan',
  planmodal126: 'Plan actual',
  planmodal127: 'Gratis',
  planmodal130: 'Plan gratuito',
  planmodal143: 'MÁS POPULAR',
  planmodal147: 'Patrón',
  planmodal151: 'Costumbre',
  planmodal173: 'Gratis',
  planmodal175: 'Gratis',
  planmodal177: 'Gratis',
  planmodal190: 'Puedes cambiar o cancelar tu plan en cualquier momento. Todos los planes incluyen una garantía de reembolso de 30 días.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal42: 'idioma cambiado',
  profilemodal45: 'idioma cambiado',
  profilemodal115: 'No has iniciado sesión',
  profilemodal127: 'Error al cargar los datos del usuario',
  profilemodal146: 'Error al cargar',
  profilemodal167: 'No has iniciado sesión',
  profilemodal186: 'Error al actualizar',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileUpdateSuccess: 'Perfil actualizado exitosamente',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal197: 'Error de actualización de perfil',
  profilemodal214: 'idioma cambiado',
  profilemodal246: 'Las nuevas contraseñas no coinciden',
  profilemodal254: 'No has iniciado sesión',
  profilemodal273: 'Error al cambiar la contraseña',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  passwordChangeSuccess: 'Contraseña cambiada exitosamente',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal280: 'Se produjo un error',
  profilemodal305: 'BORRAR',
  profilemodal306: 'Debes ingresar DELETE para eliminar tu cuenta',
  profilemodal314: 'No has iniciado sesión',
  profilemodal318: 'BORRAR',
  profilemodal331: 'Error al eliminar la cuenta',
  profilemodal334: 'Cuenta eliminada correctamente. Se cerrará sesión automáticamente.',
  profilemodal346: 'Se ha producido un error.',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profileTitle: 'Configuración del perfil',
  profileTab: 'Perfil',
  profilemodal406: 'ID de usuario',
  profilemodal421: 'Nombre de usuario',
  fullName: 'Nombre completo',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal447: 'Tu nombre completo',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  emailAddress: 'Dirección de correo',
  profilemodal463: 'ihre.email@ejemplo.com',
  preferredLanguage: 'Idioma preferido',
  languageDescription: 'Elija su idioma preferido para la interfaz de la aplicación',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal498: 'Seleccionar idioma',
  profilemodal510: 'Seleccionar idioma',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  updating: 'Actualizando...',
  updateProfile: 'Actualizar perfil',
  passwordTab: 'Cambiar contraseña',
  currentPassword: 'Contraseña actual',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal555: 'Su contraseña actual',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  newPassword: 'Nueva contraseña',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal573: 'Su nueva contraseña',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  confirmPassword: 'Confirmar nueva contraseña',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal591: 'Repetir nueva contraseña',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  changing: 'Cambiando...',
  changePassword: 'Cambiar contraseña',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal611: 'Planes y facturación',
  profilemodal616: 'Plan actual',
  profilemodal617: 'Gratis',
  profilemodal620: 'Plan gratuito',
  profilemodal626: 'Planes disponibles',
  profilemodal632: 'Gratis',
  profilemodal635: '• Hasta 3 proyectos',
  profilemodal636: '• Plantillas básicas',
  profilemodal637: '• Apoyo comunitario',
  profilemodal640: 'Actual',
  profilemodal648: 'De primera calidad',
  profilemodal651: '• Proyectos ilimitados',
  profilemodal652: '• Plantillas avanzadas',
  profilemodal653: '• Soporte prioritario',
  profilemodal654: '• Colaboración en equipo',
  profilemodal658: 'Mejora',
  profilemodal661: 'Actualice a Premium: ¡Próximamente!',
  profilemodal670: 'Patrón',
  profilemodal673: '• Todas las funciones Premium',
  profilemodal674: '• Acceso anticipado a las funciones',
  profilemodal675: '• Acceso a Discord de la comunidad',
  profilemodal676: '• Importe personalizado (5-50€+)',
  profilemodal680: 'Conviértete en mecenas',
  profilemodal683: 'Conviértete en mecenas - ¡Próximamente!',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleteTab: 'Eliminar cuenta',
  profilemodal714: 'Esta acción no se puede deshacer. Su cuenta y todos los datos asociados se eliminarán permanentemente.',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal718: 'Todos tus proyectos y plantillas serán eliminados',
  profilemodal719: 'Sus membresías de equipo serán canceladas',
  profilemodal720: 'Esta acción no se puede deshacer',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal725: 'Confirmar contraseña actual',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal732: 'Su contraseña actual',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  profilemodal743: 'Introduce DELETE para confirmar',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal744: 'BORRAR',
  profilemodal750: 'confirmarTexto',
  profilemodal751: 'BORRAR',
  profilemodal757: 'BORRAR',

  // resources/js/Components/AuthModals/ProfileModal.tsx
  deleting: 'Eliminando...',
  saving: 'Guardando...',
  deleteAccount: 'Eliminar cuenta',

  // resources/js\Components\AuthModals\ProfileModal.tsx
  profilemodal766: 'BORRAR',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal58: 'Las contraseñas no coinciden',
  registermodal84: 'Error en el registro. Inténtalo de nuevo.',
  registermodal94: '¡Registro exitoso! Por favor, revise su correo electrónico para ver si hay un enlace de verificación antes de iniciar sesión.',

  // resources\js\Components\AuthModals\RegisterModal.tsx
  registermodal102: '¡Registro exitoso! ${userId ? `Tu ID de usuario es: ${userId}. ` : \'\'}Ya puedes iniciar sesión.',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal109: 'Se produjo un error',
  registermodal203: 'Registro',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal236: 'Nombre',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal239: 'Tu nombre completo',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal244: 'Tu nombre completo',
  registermodal261: 'nombredeusuario123',
  registermodal274: 'Correo electrónico',
  registermodal282: 'tu.email@ejemplo.com',
  registermodal291: 'contraseña',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal293: 'Tu contraseña',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal298: 'Tu contraseña',
  registermodal310: 'Confirmar Contraseña',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal312: 'Repita la contraseña',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal317: 'Repita la contraseña',
  registermodal329: 'Idioma preferido',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal335: 'Seleccionar idioma',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal340: 'Seleccionar idioma',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal351: 'Seleccionar idioma',
  registermodal366: 'Seleccionar idioma',
  registermodal379: 'Inscripción en proceso...',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal384: 'Registro',

  // resources/js\Components\AuthModals\RegisterModal.tsx
  registermodal388: '¿Ya tienes una cuenta? Iniciar sesión',

  // resources/js/Components/AuthModals/RegisterModal.tsx
  registermodal393: '¿Ya tienes una cuenta? Iniciar sesión',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal59: 'Solicitud XMLHttp',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal73: 'Este enlace de restablecimiento no es válido o ha expirado.',
  resetpasswordmodal79: 'Error al validar el enlace de restablecimiento.',
  resetpasswordmodal122: 'Error de contraseña:',
  resetpasswordmodal124: 'Error de token:',
  resetpasswordmodal127: 'Se ha producido un error desconocido. Inténtalo de nuevo.',
  resetpasswordmodal131: 'Error de red: inténtelo de nuevo más tarde.',
  resetpasswordmodal162: 'Cerca',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal191: 'El enlace de reinicio está siendo validado...',
  resetpasswordmodal194: 'Un momento por favor...',
  resetpasswordmodal208: 'Serás redirigido automáticamente para iniciar sesión...',
  resetpasswordmodal219: 'Restablecer enlace no válido',
  resetpasswordmodal231: 'Para iniciar sesión',
  resetpasswordmodal234: 'Solicite un nuevo enlace de restablecimiento si desea restablecer su contraseña.',
  resetpasswordmodal243: 'Correo electrónico',
  resetpasswordmodal259: 'Nueva contraseña',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal265: 'Introduzca nueva contraseña',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal281: 'confirmar Contraseña',

  // resources/js\Components\AuthModals\ResetPasswordModal.tsx
  resetpasswordmodal287: 'Repita la contraseña',
  resetpasswordmodal319: 'Restablecer contraseña',

  // resources/js/Components/AuthModals/ResetPasswordModal.tsx
  resetpasswordmodal332: 'Continuar para iniciar sesión',
  resetpasswordmodal345: 'El enlace de restablecimiento no es válido o ha expirado.',
  resetpasswordmodal374: 'Acceso',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal71: 'No se pudieron cargar los esquemas',
  databaseexportmodal93: 'No se pudieron cargar los esquemas',
  databaseexportmodal114: 'No se pudieron cargar las versiones del esquema',
  databaseexportmodal141: 'No se pudieron cargar las versiones del esquema',
  databaseexportmodal169: 'No hay ningún proyecto seleccionado. Seleccione primero un proyecto.',
  databaseexportmodal195: 'Seleccione una base de datos y una versión para exportar',
  databaseexportmodal214: 'No se encontraron tablas en este esquema. Es posible que el esquema esté vacío o que la versión no exista.',
  databaseexportmodal216: 'Acceso denegado a este esquema. Por favor, revise sus permisos.',
  databaseexportmodal225: 'Exportación fallida',
  databaseexportmodal228: '-- No se generó SQL',
  databaseexportmodal238: 'Exportación fallida',
  databaseexportmodal269: ' (Actual)',
  databaseexportmodal285: '📤 Exportar esquema de base de datos',
  databaseexportmodal308: 'Exportar el esquema de la base de datos como script SQL de MySQL',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal325: 'Esquema de base de datos',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal329: 'Cargando esquemas...',
  databaseexportmodal338: 'Seleccionar base de datos...',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal339: 'w-menú desplegable personalizado completo',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal344: 'No hay ningún proyecto seleccionado',

  // resources/js/Components/DatabaseExportModal.tsx
  databaseexportmodal351: 'Versión',

  // resources/js\Components\DatabaseExportModal.tsx
  databaseexportmodal355: 'Seleccione la base de datos primero',
  databaseexportmodal357: 'Cargando versiones...',
  databaseexportmodal363: 'Seleccionar versión...',
  databaseexportmodal368: 'No se encontraron versiones',
  databaseexportmodal380: '📥 Descargar .sql',
  databaseexportmodal388: '👁️ Ver SQL',
  databaseexportmodal403: 'Script SQL generado',
  databaseexportmodal406: '📋 Copiar',
  databaseexportmodal412: '💾 Descargar',

  // resources/js\Components\EmailVerification.tsx
  emailverification55: 'Error de confirmación de correo electrónico',
  emailverification59: 'Error de red: inténtelo de nuevo más tarde',
  emailverification68: 'Enlace de confirmación no válido',
  emailverification107: 'Confirmación por correo electrónico',
  emailverification112: 'El correo electrónico está confirmado...',

  // resources/js/Components/EmailVerification.tsx
  emailverification127: 'Ahora has iniciado sesión y serás redirigido a la aplicación automáticamente.',
  emailverification135: 'Ahora puedes empezar a colaborar con tu equipo.',

  // resources/js\Components\EmailVerification.tsx
  emailverification141: 'Ir a la aplicación ahora',

  // resources/js/Components/EmailVerification.tsx
  emailverification151: 'Si continúa teniendo problemas, comuníquese con el soporte técnico.',

  // resources/js\Components\EmailVerification.tsx
  emailverification155: 'A la página de inicio',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback34: 'Se produjo un error inesperado. No se preocupe, sus datos están seguros.',
  errorfallback40: 'Detalles del error:',
  errorfallback58: 'Intentar otra vez',
  errorfallback65: 'Recargar página y reiniciar',
  errorfallback65_2: ' El botón elimina todos los datos locales (diseño, configuración y cierre de sesión) y reinicia la aplicación.',
  errorfallback75: 'Un aviso:',

  // resources/js/Components/ErrorFallback.tsx
  errorfallback77: 'Consejo: Si el problema persiste, comuníquese con el soporte técnico.',

  // resources/js\Components\ErrorFallback.tsx
  errorfallback78: 'Consejo: Si el problema persiste',

  // resources/js\Components\LanguageSelector.tsx
  languageselector68: 'Seleccionar idioma',
  languageselector69: 'Seleccionar idioma',

  // resources/js/Components/LanguageSelector.tsx
  languageselector87: 'Elija el idioma',

  // resources/js\Components\Modals\ApplicationsModal.tsx
  applicationsmodal66: 'No autenticado',
  applicationsmodal78: 'No se pudieron cargar las aplicaciones',
  applicationsmodal85: 'Error al cargar aplicaciones',
  applicationsmodal106: 'No autenticado',
  applicationsmodal125: 'No se pudo revisar la solicitud',
  applicationsmodal143: 'Error al revisar la aplicación',
  applicationsmodal200: 'No hay mensaje',
  applicationsmodal228: 'Aprobar solicitud',
  applicationsmodal234: 'Rechazar solicitud',
  applicationsmodal252: 'Desconocido',
  applicationsmodal301: 'No se encontraron aplicaciones',
  applicationsmodal313: 'Refrescar',
  applicationsmodal322: 'Solicitante',
  applicationsmodal329: 'Mensaje',
  applicationsmodal335: 'Estado',
  applicationsmodal342: 'Aplicado',
  applicationsmodal348: 'Revisado por',
  applicationsmodal354: 'Comportamiento',
  applicationsmodal363: 'Cerca',
  applicationsmodal374: 'Rechazar',
  applicationsmodal402: 'Mensaje:',
  applicationsmodal412: 'Motivo del rechazo',
  applicationsmodal420: '¡Démosles la bienvenida al proyecto...!',
  applicationsmodal421: 'Hazles saber por qué su solicitud fue rechazada...',
  applicationsmodal432: 'Cancelar',
  applicationsmodal439: 'Tratamiento...',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal189: 'El nombre de la tabla es obligatorio',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal191: 'El nombre de la tabla es obligatorio',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal194: 'Todos los campos deben tener un nombre',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal196: 'Todos los campos deben tener un nombre',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal201: 'Los nombres de los campos deben ser únicos',
  createtablemodal290: 'Nombre de la tabla *',
  createtablemodal300: 'p. ej., usuarios, productos, pedidos',
  createtablemodal306: 'Nombre de la clave del archivo',
  createtablemodal316: 'Escriba o seleccione un nombre de clave',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal318: 'Escriba o seleccione un nombre de clave',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal330: 'Nombre de archivo renombrado',
  createtablemodal339: 'p. ej., CustomUser, Catálogo de productos',
  createtablemodal348: 'Nombre de archivo corto',
  createtablemodal370: 'Campos *',
  createtablemodal380: 'Agregar campo',

  // resources/js\Components\Modals\CreateTableModal.tsx
  createtablemodal382: 'Agregar campo',

  // resources/js/Components/Modals/CreateTableModal.tsx
  createtablemodal391: 'Nombre',
  createtablemodal398: 'nombre_del_campo',
  createtablemodal428: 'Control',
  createtablemodal482: 'Ninguno',
  createtablemodal483: 'Clave principal',
  createtablemodal484: 'Índice',
  createtablemodal485: 'Único',
  createtablemodal497: 'Eliminar campo',
  createtablemodal509: 'Tabla de enlaces',
  createtablemodal516: '-- Seleccionar tabla --',
  createtablemodal525: 'Campo de valor',
  createtablemodal532: '-- Campo de valor --',
  createtablemodal541: 'Campo de visualización',
  createtablemodal548: '-- Campo de visualización --',
  createtablemodal557: 'Campo de orden',
  createtablemodal564: '-- Campo de pedido --',
  createtablemodal573: 'Dirección',
  createtablemodal603: 'Cancelar',
  createtablemodal614: 'Creando...',
  createtablemodal619: 'Crear tabla',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal49: 'No se pudo crear el equipo',
  createteammodal52: 'Se produjo un error de red',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal88: 'Nombre del equipo *',
  createteammodal97: 'p. ej., Equipo central, Control de calidad',
  createteammodal103: 'Descripción',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal110: '¿Qué hace este equipo?',

  // resources/js/Components/Modals/CreateTeamModal.tsx
  createteammodal117: 'Proyectos',
  createteammodal136: 'Seleccione uno o más proyectos para este equipo. Mantenga presionada la tecla Ctrl/Cmd para seleccionar varios.',
  createteammodal153: 'Cancelar',

  // resources/js\Components\Modals\CreateTeamModal.tsx
  createteammodal164: 'Creando...',
  createteammodal169: 'Crear equipo',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal97: 'd.m.Y',
  editprojectmodal98: 'Su',
  editprojectmodal100: 'Europa/Viena',
  editprojectmodal131: 'd.m.Y',
  editprojectmodal132: 'Su',
  editprojectmodal134: 'Europa/Viena',
  editprojectmodal168: 'No autenticado',
  editprojectmodal183: 'No se pudo actualizar el proyecto',
  editprojectmodal197: 'Error al actualizar el proyecto',
  editprojectmodal215: 'Editar proyecto',
  editprojectmodal227: 'Configuración del proyecto',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal230: 'Nombre del proyecto *',
  editprojectmodal240: 'mi_nombre_del_proyecto',
  editprojectmodal252: 'Descripción',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal260: 'Introduzca la descripción del proyecto',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal266: 'Código de unión',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal274: 'Introduzca el código de registro (opcional)',
  editprojectmodal280: 'PROY-',
  editprojectmodal281: 'Generar código de unión aleatorio',
  editprojectmodal285: 'Los usuarios pueden unirse a este proyecto usando este código',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal298: 'Proyecto Público',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal302: 'Hacer que este proyecto sea visible para todos los usuarios',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal307: 'Transferencia de propiedad',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal316: 'Mantener al propietario actual ({project.owner.name})',
  editprojectmodal332: 'Conexión a la base de datos',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal335: 'Nombre de la base de datos',
  editprojectmodal345: 'Nombre de la base de datos para este proyecto',
  editprojectmodal351: 'Tipo de base de datos',
  editprojectmodal370: 'Servidor',
  editprojectmodal383: 'Puerto',
  editprojectmodal397: 'Nombre de usuario',
  editprojectmodal410: 'Contraseña',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal426: 'Propiedades del proyecto',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal429: 'Directorio de proyectos',
  editprojectmodal439: 'Ruta donde se deben guardar los archivos generados',
  editprojectmodal445: 'URL del proyecto',
  editprojectmodal455: 'URL para acceder al proyecto',
  editprojectmodal461: 'Página de inicio',
  editprojectmodal477: 'Idioma predeterminado',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal484: 'Inglés',
  editprojectmodal485: 'Alemán',
  editprojectmodal486: 'Francés',
  editprojectmodal487: 'Español',
  editprojectmodal488: 'italiano',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal493: 'Lenguaje estándar para la generación de proyectos',
  editprojectmodal499: 'Nombre de archivo Longitud corta',
  editprojectmodal506: '2 personajes',
  editprojectmodal507: '3 caracteres',
  editprojectmodal508: '4 caracteres',
  editprojectmodal509: '5 caracteres',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal522: 'Configuración de localización',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal526: 'Separador decimal',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal538: 'por 1,23 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal543: 'Separador de miles',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal555: 'por 1.234 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal562: 'Formato de fecha',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal568: 'd.m.Y',
  editprojectmodal573: 'para el 31.12.2024 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal578: 'Formato de hora',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal584: 'Su',
  editprojectmodal589: 'para las 14:30:00 o',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal596: 'Símbolo de moneda',
  editprojectmodal602: '€',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal608: 'franco suizo',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal613: 'Zona horaria',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal620: 'Europa/Viena',
  editprojectmodal621: 'Europa/Berlín',
  editprojectmodal622: 'Europa/Zúrich',
  editprojectmodal623: 'Europa/Londres',
  editprojectmodal624: 'América/Nueva_York',
  editprojectmodal625: 'Estados Unidos/Chicago',
  editprojectmodal626: 'America/Los_Angeles',
  editprojectmodal627: 'Asia/Tokio',
  editprojectmodal628: 'Asia/Dubai',

  // resources/js/Components/Modals/EditProjectModal.tsx
  editprojectmodal629: 'UTC',
  editprojectmodal634: 'Zona horaria para operaciones de fecha/hora',
  editprojectmodal641: 'Clave API del Traductor de Google',
  editprojectmodal652: 'Clave API para traducciones automáticas a través de Google Translate',

  // resources/js\Components\Modals\EditProjectModal.tsx
  editprojectmodal689: 'Cancelar',
  editprojectmodal696: 'Guardar cambios',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal317: 'El nombre de la tabla es obligatorio',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal319: 'El nombre de la tabla es obligatorio',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal322: 'Todos los campos deben tener un nombre',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal324: 'Todos los campos deben tener un nombre',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal329: 'Los nombres de los campos deben ser únicos',
  edittablemodal335: 'Se requiere el nombre de la clave del archivo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal337: 'Se requiere el nombre de la clave del archivo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal342: 'El nombre de la clave del archivo seleccionado debe ser una clave principal, una clave única o un campo indexado',
  edittablemodal397: 'Nombre de la tabla *',
  edittablemodal407: 'p. ej., usuarios, productos, pedidos',
  edittablemodal413: 'Nombre de la clave del archivo *',
  edittablemodal422: 'Seleccionar campo clave...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal424: 'Seleccionar campo clave...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal425: '- Auto Inc',
  edittablemodal436: 'Nombre de archivo renombrado',
  edittablemodal445: 'p. ej., CustomUser, Catálogo de productos',
  edittablemodal454: 'Nombre de archivo corto',
  edittablemodal476: 'Campos *',
  edittablemodal486: 'Agregar campo',
  edittablemodal497: 'Nombre',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal499: 'Nombre',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal504: 'nombre_del_campo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal512: 'Tipo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal534: 'Control',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal536: 'Control',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal614: 'Comentario',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal616: 'Comentario',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal621: 'Descripción del campo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal623: 'Descripción del campo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal632: 'Eliminar campo',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal634: 'Eliminar campo',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal644: 'Tabla de enlaces',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal646: 'Tabla de enlaces',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal651: '-- Seleccionar tabla --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal653: '-- Seleccionar tabla --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal660: 'Campo de valor',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal662: 'Campo de valor',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal667: '-- Campo de valor --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal669: '-- Campo de valor --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal676: 'Campo de visualización',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal678: 'Campo de visualización',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal683: '-- Campo de visualización --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal685: '-- Campo de visualización --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal692: 'Campo de orden',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal694: 'Campo de orden',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal699: '-- Campo de pedido --',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal701: '-- Campo de pedido --',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal708: 'Dirección',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal710: 'Dirección',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal739: 'Cancelar',
  edittablemodal750: 'Actualizando...',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal752: 'Actualizando...',

  // resources/js/Components/Modals/EditTableModal.tsx
  edittablemodal755: 'Actualizar tabla',

  // resources/js\Components\Modals\EditTableModal.tsx
  edittablemodal757: 'Actualizar tabla',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal40: 'Por favor, introduzca un código de registro',
  joincodemodal51: 'No autenticado',
  joincodemodal63: 'Buscamos por todas partes',
  joincodemodal66: 'Código de registro no válido',
  joincodemodal73: 'Ya has aplicado a este proyecto',
  joincodemodal80: 'Error al buscar el proyecto',
  joincodemodal95: 'No autenticado',
  joincodemodal113: 'No se pudo enviar la solicitud',
  joincodemodal117: '¡Solicitud enviada correctamente! El propietario del proyecto revisará su solicitud.',
  joincodemodal129: 'Error al enviar la solicitud',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal147: ', mes:',
  joincodemodal148: ', día:',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal156: 'Unirse al proyecto',
  joincodemodal157: 'Aplicar al Proyecto',
  joincodemodal158: 'Solicitud enviada',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal181: 'Código de unión',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal194: 'Ingresar',
  joincodemodal200: 'Buscar',

  // resources/js/Components/Modals/JoinCodeModal.tsx
  joincodemodal206: 'Introduzca el código de unión del proyecto proporcionado por el propietario del proyecto.',

  // resources/js\Components\Modals\JoinCodeModal.tsx
  joincodemodal215: 'Información del proyecto',
  joincodemodal220: 'No se proporcionó ninguna descripción',
  joincodemodal226: 'Dueño:',
  joincodemodal237: 'Creado:',
  joincodemodal247: 'Equipos',
  joincodemodal261: 'Dígale al propietario del proyecto por qué le gustaría unirse a este proyecto...',
  joincodemodal277: '¡Solicitud enviada!',
  joincodemodal288: 'Cancelar',
  joincodemodal299: 'Atrás',
  joincodemodal306: 'Sumisión...',
  joincodemodal316: 'Hecho',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal129: 'No se pudo enviar la invitación',
  manageteammodal132: 'Se produjo un error de red',
  manageteammodal139: '¿Eliminar a este miembro del equipo?',
  manageteammodal144: 'BORRAR',
  manageteammodal155: 'No se pudo eliminar el miembro',
  manageteammodal158: 'No se pudo eliminar el miembro',
  manageteammodal181: 'No se pudo cambiar el rol',
  manageteammodal184: 'No se pudo cambiar el rol',
  manageteammodal189: '¿Cancelar esta invitación?',
  manageteammodal194: 'BORRAR',
  manageteammodal206: 'No se pudo cancelar la invitación',
  manageteammodal209: 'No se pudo cancelar la invitación',
  manageteammodal244: 'Cargando equipo...',
  manageteammodal283: 'Descripción general',
  manageteammodal284: 'Miembros (${team.members?.length || 0})',
  manageteammodal297: '{tab.etiqueta}',
  manageteammodal308: 'Información del equipo',
  manageteammodal312: 'Nombre del equipo',
  manageteammodal316: 'Proyecto',
  manageteammodal320: 'Dueño',
  manageteammodal321: 'Desconocido',
  manageteammodal324: 'Estado',
  manageteammodal328: 'Inactivo',
  manageteammodal334: 'Descripción',
  manageteammodal347: 'Miembros del equipo',
  manageteammodal354: 'Invitar a un miembro',
  manageteammodal362: 'Invitar a un nuevo miembro',
  manageteammodal366: 'Nombre de usuario (obligatorio) *',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal373: 'p. ej., unión77',

  // resources/js\Components\Modals\ManageTeamModal.tsx
  manageteammodal377: 'Correo electrónico (opcional)',
  manageteammodal383: 'Correo electrónico de notificación opcional',
  manageteammodal388: 'Role',
  manageteammodal394: 'Miembro',
  manageteammodal395: 'Administración',
  manageteammodal399: 'Mensaje (opcional)',
  manageteammodal404: 'Mensaje de bienvenida para la invitación.',
  manageteammodal432: 'Envío...',
  manageteammodal437: 'Enviar invitación',
  manageteammodal456: '{miembro.usuario.correo electrónico}',
  manageteammodal469: 'Promocionar a administrador',
  manageteammodal477: 'Degradar a miembro',
  manageteammodal485: 'Eliminar miembro',
  manageteammodal501: 'Invitaciones pendientes',
  manageteammodal505: 'No hay invitaciones pendientes',
  manageteammodal534: 'Cancelar invitación',

  // resources/js/Components/Modals/ManageTeamModal.tsx
  manageteammodal553: 'Cerca',

  // resources/js\Components\Modals\MemberModal.tsx
  membermodal179: 'No autenticado',
  membermodal191: 'No se pudieron cargar los detalles del equipo',
  membermodal244: 'No se pudieron cargar los datos',
  membermodal297: 'No autenticado',
  membermodal316: 'No se pudo agregar miembro al equipo',
  membermodal323: 'Éxito',
  membermodal335: 'Error',
  membermodal336: 'No se pudo agregar miembro al equipo',
  membermodal348: 'Advertencia',
  membermodal349: 'No se puede eliminar al propietario del equipo',
  membermodal357: 'Eliminar miembro',
  membermodal365: 'No autenticado',
  membermodal369: 'BORRAR',
  membermodal378: 'No se pudo eliminar el miembro',
  membermodal383: 'Éxito',
  membermodal384: 'Miembro eliminado exitosamente',
  membermodal394: 'Error',
  membermodal395: 'No se pudo eliminar el miembro',
  membermodal407: 'Advertencia',
  membermodal408: 'No se puede cambiar el rol del propietario',
  membermodal417: 'No autenticado',
  membermodal432: 'No se pudo actualizar el rol',
  membermodal437: 'Éxito',
  membermodal438: 'El rol de miembro se actualizó correctamente',
  membermodal448: 'Error',
  membermodal449: 'No se pudo actualizar el rol',
  membermodal458: 'Miembro',
  membermodal459: 'Administración',
  membermodal479: 'Disponible',
  membermodal483: 'Disponible',
  membermodal509: 'Esa es la',
  membermodal527: 'Dueño',
  membermodal536: 'Eliminar del equipo',
  membermodal549: 'Asignar al equipo',
  membermodal582: 'Disponible',
  membermodal590: 'No se encontraron miembros',
  membermodal597: 'Miembro',
  membermodal603: 'Role',
  membermodal609: 'Unido',
  membermodal614: 'Comportamiento',
  membermodal625: 'Cerca',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal53: 'No autenticado',
  pendinginvitationmodal70: 'No se pudo cargar la invitación pendiente',
  pendinginvitationmodal76: 'Error al cargar la invitación',
  pendinginvitationmodal97: 'No autenticado',
  pendinginvitationmodal112: '¡Bienvenido al equipo! 🎉',
  pendinginvitationmodal118: 'No se pudo aceptar la invitación',
  pendinginvitationmodal121: 'Error al aceptar la invitación',
  pendinginvitationmodal136: 'No autenticado',
  pendinginvitationmodal151: 'Invitación rechazada',
  pendinginvitationmodal157: 'No se pudo rechazar la invitación',
  pendinginvitationmodal160: 'Error al rechazar la invitación',
  pendinginvitationmodal169: '✅ Aceptar y unirse al proyecto',
  pendinginvitationmodal176: '❌ Rechazar',
  pendinginvitationmodal189: '🎉 Invitación al proyecto',
  pendinginvitationmodal200: 'Cargando invitación...',

  // resources/js/Components/Modals/PendingInvitationModal.tsx
  pendinginvitationmodal213: 'Completa tu registro aceptando esta invitación',

  // resources/js\Components\Modals\PendingInvitationModal.tsx
  pendinginvitationmodal234: 'Invitado por:',
  pendinginvitationmodal244: 'Tu rol:',
  pendinginvitationmodal251: 'Propietario del proyecto:',
  pendinginvitationmodal261: 'Caduca:',
  pendinginvitationmodal270: 'Mensaje personal:',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal45: 'Miembro',
  projectinvitationsmodal46: 'Administración',
  projectinvitationsmodal74: 'No autenticado',
  projectinvitationsmodal86: 'No se pudieron cargar las invitaciones',
  projectinvitationsmodal93: 'Error al cargar las invitaciones',
  projectinvitationsmodal100: '=== useEffect activado ===',
  projectinvitationsmodal102: 'Cargando invitaciones...',
  projectinvitationsmodal113: '=== ENVIAR INVITACIÓN INICIO ===',
  projectinvitationsmodal118: 'Estados despejados, a punto de recuperar',
  projectinvitationsmodal122: 'No autenticado',
  projectinvitationsmodal141: 'Respuesta recibida:',
  projectinvitationsmodal144: 'No se pudo enviar la invitación',
  projectinvitationsmodal147: 'Configurando mensaje de éxito...',
  projectinvitationsmodal148: '✅ ¡Invitación enviada correctamente! Correo electrónico entregado.',
  projectinvitationsmodal150: 'Limpiando formulario...',
  projectinvitationsmodal153: 'EL MENSAJE DE ÉXITO YA ESTÁ ESTABLECIDO. ¡Debería estar visible!',
  projectinvitationsmodal157: 'Agregar invitación a la lista - datos sin procesar:',
  projectinvitationsmodal171: 'Tú',
  projectinvitationsmodal177: 'Añadiendo invitación enriquecida:',
  projectinvitationsmodal182: 'Llamando a devolución de llamada exitosa...',
  projectinvitationsmodal187: 'Mensaje de éxito de borrado automático después de 5 segundos',
  projectinvitationsmodal191: '=== ENVIAR INVITACIÓN FIN - ÉXITO ===',
  projectinvitationsmodal193: 'Error al enviar la invitación',
  projectinvitationsmodal204: 'Cancelar invitación',
  projectinvitationsmodal212: 'BORRAR',
  projectinvitationsmodal220: '✅ Invitación cancelada exitosamente',
  projectinvitationsmodal229: 'No se pudo cancelar la invitación',
  projectinvitationsmodal232: 'No se pudo cancelar la invitación',
  projectinvitationsmodal243: 'Reenviar invitación',
  projectinvitationsmodal261: 'Reenviar invitación',
  projectinvitationsmodal266: '✅ ¡Invitación reenviada correctamente! Correo electrónico entregado.',
  projectinvitationsmodal275: 'No se pudo reenviar la invitación',
  projectinvitationsmodal278: 'No se pudo reenviar la invitación',
  projectinvitationsmodal286: 'Pendiente',
  projectinvitationsmodal287: 'Aceptado',
  projectinvitationsmodal288: 'Rechazado',
  projectinvitationsmodal289: 'Venció',
  projectinvitationsmodal305: 'Cancelar invitación',
  projectinvitationsmodal314: 'Reenviar invitación',
  projectinvitationsmodal337: 'Cerca',
  projectinvitationsmodal360: 'Enviar nueva invitación',
  projectinvitationsmodal364: 'Dirección de correo electrónico *',

  // resources/js/Components/Modals/ProjectInvitationsModal.tsx
  projectinvitationsmodal370: 'usuario@ejemplo.com',

  // resources/js\Components\Modals\ProjectInvitationsModal.tsx
  projectinvitationsmodal376: 'Role',
  projectinvitationsmodal387: 'Mensaje personal (opcional)',
  projectinvitationsmodal392: 'Añade un mensaje personal a la invitación...',
  projectinvitationsmodal398: 'Enviar invitación',
  projectinvitationsmodal409: 'Invitaciones existentes',
  projectinvitationsmodal414: 'Aún no se han enviado invitaciones',
  projectinvitationsmodal420: 'Correo electrónico',
  projectinvitationsmodal425: 'Role',
  projectinvitationsmodal433: 'Estado',
  projectinvitationsmodal439: 'Enviado',
  projectinvitationsmodal445: 'Caduca',
  projectinvitationsmodal450: 'Comportamiento',

  // resources/js\Components\Modals\ProjectMembersModal.tsx
  projectmembersmodal56: 'No se pudieron cargar los miembros del proyecto',
  projectmembersmodal63: 'Error al cargar miembros del proyecto',
  projectmembersmodal84: 'BORRAR',
  projectmembersmodal95: 'No se pudo eliminar el miembro',
  projectmembersmodal98: 'Miembro eliminado exitosamente',
  projectmembersmodal101: 'Error al eliminar miembro',
  projectmembersmodal128: 'No se pudo actualizar el rol del miembro',
  projectmembersmodal131: 'El rol de miembro se actualizó correctamente',
  projectmembersmodal134: 'Error al actualizar el rol del miembro',
  projectmembersmodal141: 'Confirmar eliminación',
  projectmembersmodal176: 'Miembro',
  projectmembersmodal177: 'Administración',
  projectmembersmodal193: 'Dueño',
  projectmembersmodal206: 'Seleccionar rol',
  projectmembersmodal221: 'Eliminar miembro',
  projectmembersmodal238: 'Miembros del proyecto - {proyecto?.nombre}',
  projectmembersmodal264: 'No se encontraron miembros',
  projectmembersmodal270: 'Usuario',
  projectmembersmodal276: 'Role',
  projectmembersmodal282: 'Unido',
  projectmembersmodal287: 'Comportamiento',
  projectmembersmodal296: 'Cerca',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal98: 'El nombre del equipo es obligatorio',
  teammodal108: 'No autenticado',
  teammodal132: 'No se pudo guardar el equipo',
  teammodal137: 'No se pudo guardar el equipo',
  teammodal146: 'Seleccionar proyecto',
  teammodal155: 'Crear nuevo equipo',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal169: 'Nombre del equipo *',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal176: 'Introduzca el nombre del equipo',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal182: 'Descripción',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal189: 'Ingrese la descripción del equipo (opcional)',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal195: 'Proyectos',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal206: 'Seleccionar proyectos',

  // resources/js/Components/Modals/TeamModal.tsx
  teammodal222: 'El equipo está activo',

  // resources/js\Components\Modals\TeamModal.tsx
  teammodal232: 'Cancelar',
  teammodal240: 'Crear',

  // resources/js\Components\Panels\AuthPanel.tsx
  authpanel3: './Panel de registro',
  authpanel4: './Panel de perfil',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel40: 'Inglés',
  cmsadminpanel41: 'Alemán',
  cmsadminpanel42: 'Francés',
  cmsadminpanel43: 'Español',
  cmsadminpanel44: 'italiano',
  cmsadminpanel69: 'Error al cargar páginas:',
  cmsadminpanel106: 'Por favor, rellene todos los campos obligatorios',
  cmsadminpanel122: '¡Página actualizada exitosamente!',
  cmsadminpanel129: '¡Página creada exitosamente!',
  cmsadminpanel135: 'No se pudo guardar la página:',
  cmsadminpanel144: 'Confirmar eliminación',
  cmsadminpanel150: 'BORRAR',
  cmsadminpanel152: '¡Página eliminada exitosamente!',
  cmsadminpanel155: 'No se pudo eliminar la página:',
  cmsadminpanel170: 'Editar',
  cmsadminpanel178: 'Borrar',
  cmsadminpanel186: 'Ver página',
  cmsadminpanel195: 'Inactivo',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel216: 'Gestión de páginas CMS',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel224: 'Crear nueva página',
  cmsadminpanel241: 'No se encontraron páginas',
  cmsadminpanel244: 'Babosa',
  cmsadminpanel245: 'Idioma',
  cmsadminpanel246: 'Título',
  cmsadminpanel247: 'Estado',
  cmsadminpanel250: 'Última actualización',
  cmsadminpanel256: 'Comportamiento',
  cmsadminpanel265: 'Crear nueva página',
  cmsadminpanel272: 'Cancelar',
  cmsadminpanel279: 'Ahorrar',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel291: 'Babosa *',
  cmsadminpanel298: 'Ayuda, aviso legal, política de privacidad...',
  cmsadminpanel309: 'Idioma *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel317: 'Seleccione un idioma',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel328: 'Título *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel335: 'Título de la página...',

  // resources/js/Components/Panels/CMSAdminPanel.tsx
  cmsadminpanel342: 'Contenido *',

  // resources/js\Components\Panels\CMSAdminPanel.tsx
  cmsadminpanel360: 'Código fuente HTML',
  cmsadminpanel363: 'Código fuente HTML con resaltado de sintaxis',
  cmsadminpanel365: 'Formato',
  cmsadminpanel402: 'Insertar código HTML aquí...',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel72: 'No se pudo generar el código',
  codegenerationpanel75: 'No se pudo generar el código',
  codegenerationpanel86: 'No se encontraron archivos para el índice de la tabla seleccionada',
  codegenerationpanel165: 'No se pudo analizar la función JavaScript',
  codegenerationpanel166: 'Contenido sin procesar:',
  codegenerationpanel186: 'Iniciando la ejecución por lotes de las 278 funciones de JavaScript...',
  codegenerationpanel280: 'No se han generado archivos para descargar. Ejecute todas las funciones primero.',
  codegenerationpanel286: '# Archivos de código generados desde el sistema de plantillas',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel300: 'texto/sin formato',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel327: 'Generación de código',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel332: 'ID de plantilla',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel338: 'Introduzca el ID de la plantilla (p. ej., 1)',

  // resources/js/Components/Panels/CodeGenerationPanel.tsx
  codegenerationpanel344: 'Índice de la tabla',

  // resources/js\Components\Panels\CodeGenerationPanel.tsx
  codegenerationpanel351: 'Seleccionar tabla',
  codegenerationpanel358: 'Generar código',
  codegenerationpanel374: 'Resumen de la generación:',
  codegenerationpanel387: 'JavaScript limpio',
  codegenerationpanel395: 'Resultado de la ejecución',
  codegenerationpanel399: 'Ejecutar un solo archivo',
  codegenerationpanel407: 'Ejecutar todos los archivos',
  codegenerationpanel416: 'Descargar ZIP',
  codegenerationpanel433: 'Haga clic en "Ejecutar un solo archivo" o "Ejecutar todos los archivos" para ver los resultados...',
  codegenerationpanel445: 'Actuación:',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel131: 'No autenticado',
  databasemanagementpanel145: 'No se pudieron cargar los esquemas',
  databasemanagementpanel152: 'Error al cargar esquemas',
  databasemanagementpanel221: 'Por favor seleccione al menos un idioma',
  databasemanagementpanel231: 'No autenticado',
  databasemanagementpanel245: 'No se pudieron exportar las traducciones',
  databasemanagementpanel259: 'Traducciones exportadas exitosamente',
  databasemanagementpanel261: 'Error al exportar traducciones',
  databasemanagementpanel277: 'No autenticado',
  databasemanagementpanel294: 'No se pudieron importar las traducciones',
  databasemanagementpanel301: 'Error al importar traducciones',
  databasemanagementpanel315: 'No autenticado',
  databasemanagementpanel330: 'No se pudo crear el esquema',
  databasemanagementpanel336: 'Esquema de base de datos creado exitosamente',
  databasemanagementpanel339: 'Error al crear el esquema',
  databasemanagementpanel367: 'No autenticado',
  databasemanagementpanel382: 'No se pudo actualizar el esquema',
  databasemanagementpanel388: 'Esquema actualizado exitosamente',
  databasemanagementpanel391: 'Error al actualizar el esquema',
  databasemanagementpanel419: 'No autenticado',
  databasemanagementpanel438: 'No se pudo asociar el esquema',
  databasemanagementpanel447: 'Error al asociar el esquema',
  databasemanagementpanel454: 'Esa es la',
  databasemanagementpanel485: 'No asignado',
  databasemanagementpanel516: 'No autenticado',
  databasemanagementpanel520: 'BORRAR',
  databasemanagementpanel529: 'No se pudo eliminar el esquema del proyecto',
  databasemanagementpanel536: 'Error al eliminar el esquema',
  databasemanagementpanel551: ' (Copiar)',
  databasemanagementpanel567: 'No autenticado',
  databasemanagementpanel585: 'No se pudo copiar el esquema',
  databasemanagementpanel594: 'Error al copiar el esquema',
  databasemanagementpanel606: 'El nombre del esquema no coincide. Escriba el nombre exacto del esquema para confirmar la eliminación.',
  databasemanagementpanel616: 'No autenticado',
  databasemanagementpanel621: 'BORRAR',
  databasemanagementpanel651: 'BORRAR',
  databasemanagementpanel683: 'Error al eliminar el esquema',
  databasemanagementpanel714: 'Enlace al proyecto',
  databasemanagementpanel735: 'Asociado al proyecto',
  databasemanagementpanel743: 'Editar esquema',
  databasemanagementpanel749: 'Copiar base de datos',
  databasemanagementpanel756: 'Abrir en el diseñador',
  databasemanagementpanel763: 'Eliminar esquema',
  databasemanagementpanel771: 'Privado',
  databasemanagementpanel772: 'Público',
  databasemanagementpanel776: 'Vinculado (referencia de solo lectura)',
  databasemanagementpanel777: 'Clonado (Copia privada)',
  databasemanagementpanel778: 'Importado (Fusionar con existente)',
  databasemanagementpanel786: 'Cargando esquemas de base de datos...',
  databasemanagementpanel798: 'Gestión de bases de datos',
  databasemanagementpanel803: 'Nueva base de datos',
  databasemanagementpanel811: 'Refrescar',
  databasemanagementpanel829: 'Mis esquemas de base de datos',
  databasemanagementpanel833: 'No se encontraron esquemas de base de datos. Crea tu primer esquema para empezar.',
  databasemanagementpanel840: 'Nombre del esquema',
  databasemanagementpanel841: 'Descripción',
  databasemanagementpanel843: 'Proyectos asignados',
  databasemanagementpanel849: 'Visibilidad',
  databasemanagementpanel855: 'Dueño',
  databasemanagementpanel861: 'Creado',
  databasemanagementpanel867: 'Comportamiento',
  databasemanagementpanel876: 'Exportación/importación de traducciones',
  databasemanagementpanel886: 'Exportar traducciones',
  databasemanagementpanel893: 'Importar traducciones',
  databasemanagementpanel905: 'Crear nuevo esquema de base de datos',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel917: 'Nombre del esquema *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel923: 'Introduzca el nombre del esquema',
  databasemanagementpanel937: 'Ingrese la descripción del esquema (opcional)',
  databasemanagementpanel952: 'Seleccionar visibilidad',
  databasemanagementpanel963: 'Cancelar',
  databasemanagementpanel970: 'Crear esquema',
  databasemanagementpanel981: 'Editar el esquema de la base de datos',
  databasemanagementpanel999: 'Introduzca el nombre del esquema',
  databasemanagementpanel1013: 'Ingrese la descripción del esquema (opcional)',
  databasemanagementpanel1028: 'Seleccionar visibilidad',
  databasemanagementpanel1036: 'Cancelar',
  databasemanagementpanel1043: 'Actualizar esquema',
  databasemanagementpanel1054: 'Vincular esquema al proyecto',
  databasemanagementpanel1070: 'Sin descripción',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1077: 'Seleccionar Proyecto *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1084: 'Seleccione un proyecto',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1094: 'Enlace al proyecto:',
  databasemanagementpanel1104: 'Tipo de asociación',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1123: 'Nombre personalizado para este esquema en el proyecto',
  databasemanagementpanel1131: 'Cancelar',
  databasemanagementpanel1138: 'Esquema de enlace',
  databasemanagementpanel1163: '⚠️ Advertencia de eliminación permanente',
  databasemanagementpanel1166: 'TODO',
  databasemanagementpanel1174: '🎨 Todos los diseños del diseñador de esquemas',
  databasemanagementpanel1175: '⚙️ Todas las restricciones y relaciones',
  databasemanagementpanel1180: 'no se puede deshacer',
  databasemanagementpanel1210: 'Cancelar',
  databasemanagementpanel1217: '🗑️ Eliminar para siempre',
  databasemanagementpanel1229: 'Exportar traducciones a Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1244: 'Seleccione los idiomas que se incluirán en la exportación de Excel. La exportación contendrá todas las tablas y campos de las bases de datos vinculadas.',
  databasemanagementpanel1250: 'Seleccionar idiomas *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1257: 'Seleccione los idiomas para exportar',
  databasemanagementpanel1273: 'Cancelar',
  databasemanagementpanel1280: 'Exportar a Excel',
  databasemanagementpanel1292: 'Importar traducciones desde Excel',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1307: 'Sube un archivo Excel con las traducciones. El archivo debe seguir el formato de exportación.',
  databasemanagementpanel1313: 'Subir archivo Excel *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1324: 'Elija un archivo de Excel',
  databasemanagementpanel1338: 'Cancelar',
  databasemanagementpanel1350: 'Copiar esquema de base de datos',

  // resources/js/Components/Panels/DatabaseManagementPanel.tsx
  databasemanagementpanel1365: 'Esto creará una copia completa del esquema de la base de datos, incluyendo todas las tablas, campos, restricciones y diseños del diseñador. La copia se establecerá en la versión 1.',
  databasemanagementpanel1371: 'Nuevo nombre de esquema *',

  // resources/js\Components\Panels\DatabaseManagementPanel.tsx
  databasemanagementpanel1377: 'Introduzca el nombre del esquema copiado',
  databasemanagementpanel1395: 'Cancelar',
  databasemanagementpanel1402: 'Copiar base de datos',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel51: 'Código Fira',
  debugmanualgeneratorpanel127: 'Código Fira',
  debugmanualgeneratorpanel136: 'El código JavaScript generado aparece aquí...',
  debugmanualgeneratorpanel162: 'La API del portapapeles no está disponible. Copiar manualmente:',
  debugmanualgeneratorpanel165: 'No es posible acceder al portapapeles. Por favor, revise la configuración de su navegador.',
  debugmanualgeneratorpanel352: 'No se encontraron plantillas. Cree plantillas primero en la Gestión de Plantillas.',
  debugmanualgeneratorpanel358: 'Error al cargar plantillas',
  debugmanualgeneratorpanel420: 'Error al cargar los archivos de plantilla',
  debugmanualgeneratorpanel499: 'Tabla desconocida',
  debugmanualgeneratorpanel563: 'Tabla desconocida',
  debugmanualgeneratorpanel600: 'Esquema de demostración (respaldo)',
  debugmanualgeneratorpanel746: 'Por favor seleccione plantilla y archivo',
  debugmanualgeneratorpanel753: 'Por favor seleccione el proyecto',
  debugmanualgeneratorpanel758: 'Por favor seleccione la tabla',
  debugmanualgeneratorpanel763: 'Por favor seleccione idioma',
  debugmanualgeneratorpanel768: 'Este archivo no admite la generación de código (archivo estático)',
  debugmanualgeneratorpanel928: '❌ No se encontró el archivo para la configuración seleccionada',
  debugmanualgeneratorpanel936: 'Desconocido',
  debugmanualgeneratorpanel940: 'Desconocido',
  debugmanualgeneratorpanel946: 'Desconocido',
  debugmanualgeneratorpanel953: '💡Solución: Verifique la configuración de la plantilla y la respuesta del backend.',
  debugmanualgeneratorpanel959: 'Error al cargar el código',
  debugmanualgeneratorpanel962: 'Error al cargar el código',
  debugmanualgeneratorpanel970: 'No hay código para ejecutar',
  debugmanualgeneratorpanel1026: 'No se encontró ninguna función en el código generado',
  debugmanualgeneratorpanel1048: 'Asistente de depuración',
  debugmanualgeneratorpanel1093: 'Error de sintaxis',
  debugmanualgeneratorpanel1096: 'Error de referencia',
  debugmanualgeneratorpanel1107: 'Desconocido',
  debugmanualgeneratorpanel1111: 'Error de sintaxis',
  debugmanualgeneratorpanel1174: 'Error: No se pudo analizar la función de JavaScript',
  debugmanualgeneratorpanel1183: 'Error de reserva desconocido',
  debugmanualgeneratorpanel1203: 'Desconocido',
  debugmanualgeneratorpanel1210: 'Sin nombre (desconocido)',
  debugmanualgeneratorpanel1229: 'Desconocido',
  debugmanualgeneratorpanel1259: '🔧 Generador de manuales de depuración',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1260: 'Desarrollo de plantillas y depuración de código para archivos individuales',
  debugmanualgeneratorpanel1270: '📄 Plantilla',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1277: 'Elija una plantilla',

  // resources/js/Components/Panels/DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1284: '📝 Archivo de plantilla',

  // resources/js\Components\Panels\DebugManualGeneratorPanel.tsx
  debugmanualgeneratorpanel1293: 'Seleccionar archivo',
  debugmanualgeneratorpanel1302: '(no requerido)',
  debugmanualgeneratorpanel1310: 'No es necesario para este tipo de archivo',
  debugmanualgeneratorpanel1319: '(no requerido)',
  debugmanualgeneratorpanel1325: 'No es necesario para este tipo de archivo',
  debugmanualgeneratorpanel1334: '(no requerido)',
  debugmanualgeneratorpanel1342: 'Elija el idioma',
  debugmanualgeneratorpanel1355: 'incluirFuenteDePlantilla',
  debugmanualgeneratorpanel1360: 'Incluir la fuente de la plantilla en el código',
  debugmanualgeneratorpanel1369: 'Obtener código',
  debugmanualgeneratorpanel1377: 'Ejecutar código',
  debugmanualgeneratorpanel1385: '🔍 Asistente de depuración',
  debugmanualgeneratorpanel1396: 'No seleccionado',
  debugmanualgeneratorpanel1397: 'No seleccionado',
  debugmanualgeneratorpanel1398: 'Desconocido',
  debugmanualgeneratorpanel1399: 'No seleccionado',
  debugmanualgeneratorpanel1400: 'No seleccionado',
  debugmanualgeneratorpanel1473: '🔴 No hay ningún proyecto seleccionado para la plantilla project_file',
  debugmanualgeneratorpanel1476: '🔴 No hay ninguna tabla seleccionada para la plantilla db_table_file',
  debugmanualgeneratorpanel1479: '🟡 No se seleccionó ningún idioma para la plantilla con idioma habilitado',
  debugmanualgeneratorpanel1482: '🔴 Tablas encontradas[] - índice de tabla faltante',
  debugmanualgeneratorpanel1531: '1. Código preparado',
  debugmanualgeneratorpanel1537: 'Copiar GTree',
  debugmanualgeneratorpanel1564: 'Descarga de GTree',
  debugmanualgeneratorpanel1583: 'Descarga fallida. Por favor, revise los datos de GTree.',
  debugmanualgeneratorpanel1591: 'Copiar código',
  debugmanualgeneratorpanel1621: 'No se pudo cargar el editor de código',
  debugmanualgeneratorpanel1622: 'Utilice un área de texto simple como alternativa',
  debugmanualgeneratorpanel1628: 'Obtener código',
  debugmanualgeneratorpanel1679: '2. Resultado ejecutado',
  debugmanualgeneratorpanel1683: 'Código PHP generado',
  debugmanualgeneratorpanel1686: 'Copiar código',
  debugmanualgeneratorpanel1724: 'La descarga falló.',
  debugmanualgeneratorpanel1739: 'Courier Nuevo',
  debugmanualgeneratorpanel1744: 'Haga clic en "Ejecutar código" para ver el resultado...',
  debugmanualgeneratorpanel1750: '3. 🔍 Asistente de depuración',
  debugmanualgeneratorpanel1755: 'Courier Nuevo',
  debugmanualgeneratorpanel1760: 'Haga clic en \'🔍Ayudante de depuración\' para ver la información de depuración...',

  // resources/js\Components\PanelsegisterPanel.tsx
  panelsegisterpanel31: 'Las contraseñas no coinciden',
  panelsegisterpanel54: 'El registro falló',
  panelsegisterpanel57: '¡Registro exitoso! Ya puedes iniciar sesión.',
  panelsegisterpanel75: 'Se ha producido un error.',
  panelsegisterpanel90: 'Registro',
  panelsegisterpanel123: 'Tu nombre completo',
  panelsegisterpanel154: 'Al menos 8 caracteres',
  panelsegisterpanel161: 'Introducir contraseña',
  panelsegisterpanel162: 'Débil',
  panelsegisterpanel163: 'Medio',
  panelsegisterpanel164: 'Rígido',
  panelsegisterpanel176: 'Repita la contraseña',
  panelsegisterpanel188: 'Registro',
  panelsegisterpanel198: '¿Ya tienes una cuenta? Iniciar sesión',

  // resources/js\Components\PanelsewNavigationPanel.tsx
  panelsewnavigationpanel112: 'Volver al vestíbulo',
  panelsewnavigationpanel120: 'Bienvenido',
  panelsewnavigationpanel128: 'Proyecto',
  panelsewnavigationpanel133: 'Gestión de proyectos',
  panelsewnavigationpanel138: 'Ajustes',
  panelsewnavigationpanel142: 'Configuración del proyecto',
  panelsewnavigationpanel161: 'Equipos',
  panelsewnavigationpanel165: 'Gestión de equipos',
  panelsewnavigationpanel170: 'Asignación de equipos',
  panelsewnavigationpanel184: 'Plantillas',
  panelsewnavigationpanel188: 'Gestión de plantillas',
  panelsewnavigationpanel193: 'Asignación de plantilla',
  panelsewnavigationpanel201: 'Dependencias del esquema de base de datos',
  panelsewnavigationpanel211: 'Mis aplicaciones',
  panelsewnavigationpanel216: 'Proyectos públicos',
  panelsewnavigationpanel223: 'Base de datos',
  panelsewnavigationpanel228: 'Administrar bases de datos',
  panelsewnavigationpanel233: 'Diseñador',
  panelsewnavigationpanel238: 'Traducción de esquemas',
  panelsewnavigationpanel246: 'Importar SQL',
  panelsewnavigationpanel251: 'Exportar SQL',
  panelsewnavigationpanel258: 'Generador',
  panelsewnavigationpanel263: 'Generador de manuales de depuración',
  panelsewnavigationpanel268: 'Generación de código',
  panelsewnavigationpanel273: 'Generador de consultas',
  panelsewnavigationpanel281: 'Administración',
  panelsewnavigationpanel285: 'Configuración del sistema',
  panelsewnavigationpanel290: 'Gestión del lenguaje',
  panelsewnavigationpanel298: 'Administrador de CMS',
  panelsewnavigationpanel315: 'Perfil',
  panelsewnavigationpanel320: 'Plan de cambio',
  panelsewnavigationpanel325: 'Volver al vestíbulo',
  panelsewnavigationpanel333: 'Cerrar sesión',
  panelsewnavigationpanel359: 'Cuenta',
  panelsewnavigationpanel364: 'Acceso',
  panelsewnavigationpanel369: 'Registro',
  panelsewnavigationpanel384: 'Contraer menú',
  panelsewnavigationpanel394: 'Navegación',
  panelsewnavigationpanel413: 'Volver al vestíbulo',
  panelsewnavigationpanel422: 'Bienvenido',
  panelsewnavigationpanel430: 'Proyecto',
  panelsewnavigationpanel437: 'Gestión de proyectos',
  panelsewnavigationpanel443: 'Ajustes',
  panelsewnavigationpanel459: 'Configuración del proyecto',
  panelsewnavigationpanel469: 'Equipos',
  panelsewnavigationpanel477: 'Gestión de equipos',
  panelsewnavigationpanel488: 'Asignación de equipos',
  panelsewnavigationpanel496: 'Plantillas',
  panelsewnavigationpanel504: 'Gestión de plantillas',
  panelsewnavigationpanel508: 'Asignación de plantilla',
  panelsewnavigationpanel513: 'Dependencias del esquema de base de datos',
  panelsewnavigationpanel521: 'Mis aplicaciones',
  panelsewnavigationpanel525: 'Proyectos públicos',
  panelsewnavigationpanel533: 'Base de datos',
  panelsewnavigationpanel540: 'Administrar bases de datos',
  panelsewnavigationpanel544: 'Diseñador',
  panelsewnavigationpanel548: 'Traducción de esquemas',
  panelsewnavigationpanel553: 'Importar SQL',
  panelsewnavigationpanel557: 'Exportar SQL',
  panelsewnavigationpanel565: 'Generador',
  panelsewnavigationpanel572: 'Generador de manuales de depuración',
  panelsewnavigationpanel576: 'Generación de código',
  panelsewnavigationpanel580: 'Generador de consultas',
  panelsewnavigationpanel589: 'Administración',
  panelsewnavigationpanel596: 'Configuración del sistema',
  panelsewnavigationpanel600: 'Gestión del lenguaje',
  panelsewnavigationpanel605: 'Administrador de CMS',
  panelsewnavigationpanel619: 'Cuenta',
  panelsewnavigationpanel644: 'Perfil',
  panelsewnavigationpanel648: 'Plan de cambio',
  panelsewnavigationpanel652: 'Volver al vestíbulo',
  panelsewnavigationpanel672: 'Cerrar sesión',
  panelsewnavigationpanel679: 'Acceso',
  panelsewnavigationpanel683: 'Registro',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal14: 'Promesa',
  filemodal95: '¡Por favor seleccione un archivo ZIP!',
  filemodal106: 'Archivo ZIP eliminado',
  filemodal111: 'Agregar nuevo archivo',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal124: 'Nombre del archivo *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal130: '¡Por favor introduzca el nombre del archivo!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal135: 'p. ej., Model.php, component.tsx, config.json',
  filemodal147: 'Tipo de plantilla *',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal153: '¡Por favor seleccione el tipo!',
  filemodal160: 'Seleccionar tipo',
  filemodal182: '¡Por favor ingrese al directorio de destino!',
  filemodal185: 'Camino:',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal189: 'p. ej., /componentes/, /servicios/, /app/Http/Controllers/',
  filemodal202: 'Seleccione el tipo de contenido:',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal208: 'Entrada de texto',
  filemodal215: 'Cargar ZIP',
  filemodal232: '¡Por favor introduzca el contenido del archivo!',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal268: 'Subir archivo ZIP',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal278: 'Seleccionar archivo ZIP',
  filemodal287: 'Suelte el archivo ZIP aquí o haga clic para seleccionarlo',

  // resources/js/Components/Panels/FileModal.tsx
  filemodal288: 'Se admiten archivos .zip con estructuras de plantilla',

  // resources/js\Components\Panels\FileModal.tsx
  filemodal307: 'Eliminar',
  filemodal334: 'Cancelar',
  filemodal340: 'Agregar',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel29: 'Introducir correo electrónico',
  forgotpasswordpanel30: 'Restablecer contraseña',
  forgotpasswordpanel52: 'No se pudo enviar el enlace de restablecimiento',
  forgotpasswordpanel55: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico. Revisa tu bandeja de entrada.',
  forgotpasswordpanel59: 'Se ha producido un error.',
  forgotpasswordpanel73: 'Las contraseñas no coinciden',
  forgotpasswordpanel96: 'No se pudo restablecer la contraseña',
  forgotpasswordpanel99: '¡Contraseña restablecida correctamente! Ya puedes iniciar sesión con tu nueva contraseña.',
  forgotpasswordpanel109: 'Se ha producido un error.',
  forgotpasswordpanel129: 'Has olvidado tu contraseña',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel164: 'Introduzca su dirección de correo electrónico para recibir un enlace para restablecer su contraseña.',
  forgotpasswordpanel170: 'Correo electrónico',
  forgotpasswordpanel178: 'tu.email@ejemplo.com',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel187: 'Enviar enlace de restablecimiento',
  forgotpasswordpanel197: 'Volver al inicio de sesión',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel209: 'Ingrese el código de restablecimiento del correo electrónico y su nueva contraseña.',
  forgotpasswordpanel215: 'Código de reinicio',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel222: 'Código del correo electrónico',
  forgotpasswordpanel237: 'Nueva contraseña',
  forgotpasswordpanel244: 'Introducir contraseña',
  forgotpasswordpanel245: 'Débil',
  forgotpasswordpanel246: 'Medio',
  forgotpasswordpanel247: 'Rígido',

  // resources/js/Components/Panels/ForgotPasswordPanel.tsx
  forgotpasswordpanel252: 'Confirmar Contraseña',

  // resources/js\Components\Panels\ForgotPasswordPanel.tsx
  forgotpasswordpanel259: 'Repita la contraseña',
  forgotpasswordpanel272: 'Atrás',
  forgotpasswordpanel280: 'Restablecer contraseña',
  forgotpasswordpanel291: 'Volver al inicio de sesión',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel76: 'No autorizado. Se requiere acceso de administrador del sistema.',
  languagemanagementpanel78: 'Error al cargar los idiomas:',
  languagemanagementpanel120: '¿Estás seguro que deseas eliminar este idioma?',
  languagemanagementpanel121: 'Eliminar idioma',
  languagemanagementpanel124: 'Sí',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel125: 'No',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel132: 'BORRAR',
  languagemanagementpanel133: 'Idioma eliminado exitosamente',
  languagemanagementpanel136: 'No se pudo eliminar el idioma:',
  languagemanagementpanel142: 'PARCHE',
  languagemanagementpanel146: 'No se pudo cambiar el estado del idioma:',
  languagemanagementpanel152: 'PARCHE',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel153: 'Idioma predeterminado actualizado exitosamente',
  languagemanagementpanel156: 'No se pudo establecer el idioma predeterminado:',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel167: 'Idioma actualizado exitosamente',
  languagemanagementpanel173: 'Idioma creado exitosamente',
  languagemanagementpanel178: 'No se pudo guardar el idioma:',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel183: '🇺🇸 Estados Unidos',
  languagemanagementpanel184: '🇬🇧 Reino Unido',
  languagemanagementpanel185: '🇩🇪 Alemania',
  languagemanagementpanel186: '🇫🇷 Francia',
  languagemanagementpanel187: '🇪🇸 España',
  languagemanagementpanel188: '🇮🇹 Italia',
  languagemanagementpanel189: '🇳🇱 Países Bajos',
  languagemanagementpanel190: '🇵🇹 Portugal',
  languagemanagementpanel191: '🇷🇺 Rusia',
  languagemanagementpanel192: '🇯🇵 Japón',
  languagemanagementpanel193: '🇰🇷 Corea del Sur',
  languagemanagementpanel194: '🇨🇳 China',
  languagemanagementpanel195: '🇧🇷 Brasil',
  languagemanagementpanel196: '🇲🇽 México',
  languagemanagementpanel197: '🇨🇦 Canadá',
  languagemanagementpanel198: '🇦🇺 Australia',
  languagemanagementpanel199: '🇮🇳 India',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel214: 'Inactivo',
  languagemanagementpanel223: 'Sistema',
  languagemanagementpanel251: 'Activar',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel264: 'Establecer como predeterminado',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel277: 'No se puede eliminar el idioma predeterminado',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel291: 'Gestión del lenguaje',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel300: 'Agregar idioma',
  languagemanagementpanel317: 'FilasPorPáginaDesplegableEnlacePrimeraPáginaEnlacePáginaAnteriorInformePáginaActualEnlacePáginaSiguienteEnlaceÚltimaPáginaEnlace',
  languagemanagementpanel324: 'No se encontraron idiomas',
  languagemanagementpanel326: 'Bandera',
  languagemanagementpanel327: 'Código',
  languagemanagementpanel328: 'Nombre',
  languagemanagementpanel329: 'Nombre nativo',
  languagemanagementpanel330: 'Estado',
  languagemanagementpanel331: 'Orden de clasificación',
  languagemanagementpanel332: 'Creador',
  languagemanagementpanel333: 'Descripción',
  languagemanagementpanel334: 'Comportamiento',
  languagemanagementpanel340: 'Agregar nuevo idioma',
  languagemanagementpanel352: 'Cancelar',
  languagemanagementpanel359: 'Crear',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel371: 'Código de idioma *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel378: 'Por favor, introduzca el código de idioma',
  languagemanagementpanel379: 'El código debe tener 5 caracteres o menos',
  languagemanagementpanel380: 'Introduzca un código de idioma válido (p. ej.',
  languagemanagementpanel410: 'Seleccionar bandera',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel423: 'Nombre en inglés *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel430: 'Por favor, introduzca el nombre del idioma',
  languagemanagementpanel431: 'El nombre debe tener 100 caracteres o menos',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel437: 'p. ej., inglés, alemán, francés',
  languagemanagementpanel449: 'Nombre nativo *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel456: 'Por favor ingrese el nombre en su idioma nativo',
  languagemanagementpanel457: 'El nombre nativo debe tener 100 caracteres o menos',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel463: 'p. ej., inglés, alemán, francés',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel483: 'La descripción debe tener 1000 caracteres o menos.',
  languagemanagementpanel490: 'Descripción opcional del idioma',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel503: 'Orden de clasificación *',

  // resources/js\Components\Panels\LanguageManagementPanel.tsx
  languagemanagementpanel510: 'Por favor, introduzca el orden de clasificación',
  languagemanagementpanel511: 'El orden de clasificación debe ser 0 o mayor',

  // resources/js/Components/Panels/LanguageManagementPanel.tsx
  languagemanagementpanel548: 'Idioma predeterminado',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel44: 'error de inicio de sesion',
  loginpanel74: 'Se produjo un error',
  loginpanel88: 'Acceso',

  // resources/js/Components/Panels/LoginPanel.tsx
  loginpanel106: 'Correo electrónico',
  loginpanel114: 'tu.email@ejemplo.com',
  loginpanel122: 'Contraseña',

  // resources/js\Components\Panels\LoginPanel.tsx
  loginpanel129: 'Tu contraseña',
  loginpanel141: 'Iniciando sesión...',
  loginpanel152: '¿No tienes una cuenta? Regístrate',
  loginpanel160: '¿Has olvidado tu contraseña?',

  // resources/js\Components\Panels\MyApplicationsPanel.tsx
  myapplicationspanel61: 'No autenticado',
  myapplicationspanel73: 'No se pudieron cargar las aplicaciones',
  myapplicationspanel80: 'Error al cargar aplicaciones',
  myapplicationspanel87: 'Esa es la',
  myapplicationspanel138: 'No hay mensaje',
  myapplicationspanel164: 'Ver detalles',
  myapplicationspanel201: 'Cargando aplicaciones...',
  myapplicationspanel213: 'Mis aplicaciones',
  myapplicationspanel217: 'Refrescar',
  myapplicationspanel228: 'Historial de aplicaciones',
  myapplicationspanel232: 'No hay aplicaciones',
  myapplicationspanel233: 'Aún no has aplicado a ningún proyecto.',
  myapplicationspanel242: 'No se encontraron aplicaciones',
  myapplicationspanel248: 'Proyecto',
  myapplicationspanel255: 'Mensaje',
  myapplicationspanel261: 'Estado',
  myapplicationspanel268: 'Aplicado',
  myapplicationspanel276: 'Respuesta',
  myapplicationspanel282: 'Comportamiento',
  myapplicationspanel292: 'Detalles de la aplicación',
  myapplicationspanel305: 'Información del proyecto',
  myapplicationspanel322: 'Información de la aplicación',
  myapplicationspanel326: 'Estado:',
  myapplicationspanel332: 'Aplicado:',
  myapplicationspanel338: 'Código de ingreso:',
  myapplicationspanel348: 'Su mensaje:',
  myapplicationspanel358: 'Rechazo',
  myapplicationspanel362: 'Revisado por:',
  myapplicationspanel365: 'Fecha:',
  myapplicationspanel369: 'Respuesta:',
  myapplicationspanel381: 'Cerca',

  // resources/js\Components\Panels\NewNavigationPanel.tsx
  newnavigationpanel112: 'Volver al vestíbulo',
  newnavigationpanel120: 'Bienvenido',
  newnavigationpanel128: 'Proyecto',
  newnavigationpanel133: 'Gestión de proyectos',
  newnavigationpanel138: 'Ajustes',
  newnavigationpanel142: 'Configuración del proyecto',
  newnavigationpanel161: 'Equipos',
  newnavigationpanel165: 'Gestión de equipos',
  newnavigationpanel170: 'Asignación de equipos',
  newnavigationpanel184: 'Plantillas',
  newnavigationpanel188: 'Gestión de plantillas',
  newnavigationpanel193: 'Asignación de plantilla',
  newnavigationpanel201: 'Dependencias del esquema de base de datos',
  newnavigationpanel211: 'Mis aplicaciones',
  newnavigationpanel216: 'Proyectos públicos',
  newnavigationpanel223: 'Base de datos',
  newnavigationpanel228: 'Administrar bases de datos',
  newnavigationpanel233: 'Diseñador',
  newnavigationpanel238: 'Traducción de esquemas',
  newnavigationpanel246: 'Importar SQL',
  newnavigationpanel251: 'Exportar SQL',
  newnavigationpanel258: 'Generador',
  newnavigationpanel263: 'Generador de manuales de depuración',
  newnavigationpanel268: 'Generación de código',
  newnavigationpanel273: 'Generador de consultas',
  newnavigationpanel281: 'Administración',
  newnavigationpanel285: 'Configuración del sistema',
  newnavigationpanel290: 'Gestión del lenguaje',
  newnavigationpanel298: 'Administrador de CMS',
  newnavigationpanel315: 'Perfil',
  newnavigationpanel320: 'Plan de cambio',
  newnavigationpanel325: 'Volver al vestíbulo',
  newnavigationpanel333: 'Cerrar sesión',
  newnavigationpanel359: 'Cuenta',
  newnavigationpanel364: 'Acceso',
  newnavigationpanel369: 'Registro',
  newnavigationpanel384: 'Contraer menú',
  newnavigationpanel394: 'Navegación',
  newnavigationpanel413: 'Volver al vestíbulo',
  newnavigationpanel422: 'Bienvenido',
  newnavigationpanel430: 'Proyecto',
  newnavigationpanel437: 'Gestión de proyectos',
  newnavigationpanel443: 'Ajustes',
  newnavigationpanel459: 'Configuración del proyecto',
  newnavigationpanel469: 'Equipos',
  newnavigationpanel477: 'Gestión de equipos',
  newnavigationpanel488: 'Asignación de equipos',
  newnavigationpanel496: 'Plantillas',
  newnavigationpanel504: 'Gestión de plantillas',
  newnavigationpanel508: 'Asignación de plantilla',
  newnavigationpanel513: 'Dependencias del esquema de base de datos',
  newnavigationpanel521: 'Mis aplicaciones',
  newnavigationpanel525: 'Proyectos públicos',
  newnavigationpanel533: 'Base de datos',
  newnavigationpanel540: 'Administrar bases de datos',
  newnavigationpanel544: 'Diseñador',
  newnavigationpanel548: 'Traducción de esquemas',
  newnavigationpanel553: 'Importar SQL',
  newnavigationpanel557: 'Exportar SQL',
  newnavigationpanel565: 'Generador',
  newnavigationpanel572: 'Generador de manuales de depuración',
  newnavigationpanel576: 'Generación de código',
  newnavigationpanel580: 'Generador de consultas',
  newnavigationpanel589: 'Administración',
  newnavigationpanel596: 'Configuración del sistema',
  newnavigationpanel600: 'Gestión del lenguaje',
  newnavigationpanel605: 'Administrador de CMS',
  newnavigationpanel619: 'Cuenta',
  newnavigationpanel635: '} texto-gris-300`} título={isLoggedIn ? nombreDeUsuario :',
  newnavigationpanel644: 'Perfil',
  newnavigationpanel648: 'Plan de cambio',
  newnavigationpanel652: 'Volver al vestíbulo',
  newnavigationpanel672: 'Cerrar sesión',
  newnavigationpanel679: 'Acceso',
  newnavigationpanel683: 'Registro',

  // resources/js\Components\Panels\PanelT1.tsx
  panelt1103: 'Usuario desconocido',
  panelt1143: 'Bases de datos',
  panelt1147: 'Bases de datos',
  panelt1219: 'Vista previa del archivo',
  panelt1222: 'Vista previa del archivo',
  panelt1281: 'Error al cargar proyectos',
  panelt1287: 'Comprobar errores en la consola',
  panelt1293: 'Consulte la consola del navegador para obtener más detalles.',
  panelt1416: 'Vista previa del archivo',
  panelt1506: 'equipo cambiado',
  panelt1509: 'equipo cambiado',
  panelt1521: 'Actualización de vista previa del archivo',
  panelt1524: 'Actualización de vista previa del archivo',
  panelt1680: 'Proyecto',
  panelt1696: 'Proyecto',
  panelt1725: 'Mesa',
  panelt1786: '📁 Navegación',
  panelt1791: 'Expandir todo',
  panelt1798: 'Contraer todo',
  panelt1809: 'Cargando proyectos...',
  panelt1813: 'No se encontraron proyectos',
  panelt1833: 'Seleccionado:',
  panelt1835: 'Nombre:',
  panelt1836: 'Tipo:',
  panelt1837: 'IDENTIFICACIÓN:',
  panelt1839: 'Camino:',
  panelt1842: 'ID del proyecto:',
  panelt1843: 'Camino:',
  panelt1845: 'ID del equipo:',
  panelt1848: 'Role:',
  panelt1853: 'ID de plantilla:',
  panelt1856: 'Mesa:',
  panelt1859: 'Idioma:',
  panelt1873: 'Total de artículos',
  panelt1879: 'Seleccionado',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2139: 'Editar tabla',
  panelt2151: 'Eliminar tabla',
  panelt2179: 'Sin campos',
  panelt2405: 'Se requiere autenticación',
  panelt2439: 'No se pudieron cargar los esquemas',
  panelt2443: 'Autenticación',
  panelt2551: 'No se pudieron cargar las versiones del esquema',
  panelt2602: 'No se pudo cargar la versión del esquema',
  panelt2685: 'No hay ninguna versión disponible. Cree primero una versión del esquema.',
  panelt2704: 'No se ha seleccionado ninguna versión o falta el ID de la versión. Seleccione primero una versión del esquema.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt2745: 'No se pudo crear la tabla',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt2764: 'No hay ninguna versión seleccionada ni tabla para editar. Seleccione primero una versión del esquema.',
  panelt2806: 'No se pudo actualizar la tabla',
  panelt2817: 'No se pudo actualizar la tabla',
  panelt2826: 'No se ha seleccionado ningún esquema ni versión. Seleccione primero un esquema.',
  panelt2841: 'No se pudo crear una nueva versión',
  panelt2852: 'No se pudo crear una nueva versión',
  panelt2862: 'No se ha seleccionado ningún esquema ni versión. Seleccione primero un esquema.',
  panelt2877: 'No se pudo crear una nueva versión',
  panelt2888: 'No se pudo crear una nueva versión',
  panelt2898: 'No se ha seleccionado ninguna versión. Seleccione primero una versión del esquema.',
  panelt2920: 'No se pudo actualizar la versión',
  panelt2930: 'No se ha seleccionado ninguna versión. Seleccione primero una versión del esquema.',
  panelt2952: 'No se pudo actualizar la versión',
  panelt21001: 'No se pudo eliminar la tabla',
  panelt21010: 'No se pudo eliminar la tabla',
  panelt21030: 'No hay ninguna tabla seleccionada para eliminar',
  panelt21054: 'No se pudo crear la versión ni eliminar la tabla',
  panelt21075: 'No se pudo crear una nueva versión ni eliminar la tabla',
  panelt21101: 'No hay ninguna tabla seleccionada para eliminar',
  panelt21122: 'No se pudo eliminar la tabla',
  panelt21133: 'No se ha seleccionado ningún esquema',
  panelt21144: 'Crear nueva versión',
  panelt21153: 'No autenticado',
  panelt21170: 'No se pudo crear una nueva versión',
  panelt21185: 'No se pudo crear una nueva versión',
  panelt21231: 'No autenticado',
  panelt21245: 'No se pudo eliminar la clave externa',
  panelt21270: 'No se pudo eliminar la clave externa',
  panelt21282: '🗃️ Diseñador de bases de datos',
  panelt21289: 'Cargando versiones del esquema...',
  panelt21291: 'No se ha seleccionado ningún esquema',
  panelt21292: 'No hay ningún proyecto seleccionado',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21308: 'Ningún proyecto seleccionado',
  panelt21350: '🔄 Actualizar',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21358: 'Crear una nueva versión (copia la versión actual)',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21359: '➕ Nueva versión',
  panelt21375: '✨ Nueva mesa',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21402: 'Cargando esquema...',
  panelt21439: 'posiciónAbsoluta',
  panelt21511: 'Autenticación',
  panelt21515: 'Se requiere autenticación',
  panelt21516: 'Su sesión ha expirado. Inicie sesión para acceder a los datos del esquema.',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21517: 'Utilice el menú de navegación para iniciar sesión nuevamente',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21525: 'Sin datos de esquema',
  panelt21528: 'Seleccione un proyecto para ver los esquemas',
  panelt21530: 'No hay esquemas asociados a este proyecto',
  panelt21531: 'Seleccione un esquema para visualizar la estructura de la base de datos',
  panelt21549: '🔍 Detalles de la mesa',
  panelt21552: 'Mesa:',
  panelt21556: 'Campos:',
  panelt21560: 'Restricciones:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21564: 'Claves primarias:',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21595: 'crear una nueva tabla',
  panelt21600: 'Actual',
  panelt21629: 'Acciones de clave externa',
  panelt21635: 'De:',
  panelt21639: 'A:',
  panelt21654: '¡Edit FK llega en la Fase 2! 🚀',
  panelt21689: 'Eliminar clave externa',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21692: '¿Está seguro de que desea eliminar esta restricción de clave externa?',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21699: 'Restricción:',
  panelt21703: 'De:',
  panelt21707: 'A:',

  // resources/js/Components/Panels/PanelT2.tsx
  panelt21714: '⚠️Se creará una nueva versión para este cambio.',

  // resources/js\Components\Panels\PanelT2.tsx
  panelt21736: 'Eliminar clave externa',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesCategoryAll: 'Todas las categorías',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt367: 'Todo',
  panelt375: 'No autenticado',
  panelt390: 'No se pudieron cargar las plantillas',
  panelt3103: 'Error al cargar plantillas',
  panelt3115: 'No autenticado',
  panelt3148: 'Error al cargar las plantillas de proyecto',
  panelt3158: 'idioma cambiado',
  panelt3161: 'idioma cambiado',
  panelt3201: 'No autenticado',
  panelt3219: 'No se pudieron asignar plantillas',
  panelt3231: 'Error al asignar plantillas',
  panelt3245: 'No autenticado',
  panelt3250: 'BORRAR',
  panelt3272: 'Error al eliminar la plantilla',
  panelt3287: 'Todo',
  panelt3295: 'Todas las categorías',
  panelt3296: 'Web',
  panelt3297: 'Móvil',
  panelt3298: 'API',
  panelt3299: 'De oficina',
  panelt3300: 'Base de datos',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesLoadingText: 'Cargando plantillas...',
  templatesAssignmentTitle: 'Asignación de plantillas',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3323: 'por ',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesWorkingOn: 'por {selectedProject.owner.name}',
  templatesSelectProjectHint: 'Seleccione un proyecto de la navegación para gestionar plantillas',
  templatesSearchPlaceholder: 'Buscar plantillas...',
  templatesFilterCategory: 'Filtrar por categoría',
  templatesNoTemplatesFound: 'No se encontraron plantillas',
  templatesSelectedCount: 'seleccionado',
  templatesRemoveFromProject: 'Eliminar del proyecto',
  templatesColumnName: 'Nombre de plantilla',
  templatesColumnDescription: 'Descripción',
  templatesColumnCategory: 'Categoría',
  templatesColumnLanguage: 'Idioma',
  templatesColumnStatus: 'Estado',
  templatesStatusInactive: 'Inactivo',
  templatesStatusActive: 'Activo',
  templatesColumnCreated: 'Creado',

  // resources/js\Components\Panels\PanelT3.tsx
  panelt3471: 'Esa es la',

  // resources/js/Components/Panels/PanelT3.tsx
  templatesClearSelection: 'Limpiar selección',
  templatesAssignButton: 'Asignar plantillas',

  // resources/js\Components\Panels\PanelT5.tsx
  panelt538: 'Base de datos',
  panelt544: 'Rediseño del sitio web',
  panelt555: 'Aplicación móvil',
  panelt567: 'Modal.tsx',
  panelt572: 'LÉAME.md',
  panelt577: 'Documentos',
  panelt582: 'Contrato.docx',
  panelt585: 'Informes',
  panelt588: 'Informe del primer trimestre.xlsx',
  panelt589: 'Informe del segundo trimestre.xlsx',
  panelt596: 'Activos',
  panelt5235: 'Explorador de bases de datos',
  panelt5240: 'Expandir todo',
  panelt5247: 'Contraer todo',
  panelt5271: 'Seleccionado:',
  panelt5273: 'Nombre:',
  panelt5274: 'Tipo:',
  panelt5275: 'IDENTIFICACIÓN:',
  panelt5286: 'Total de artículos',
  panelt5292: 'Seleccionado',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel47: 'No autenticado',
  profilepanel58: 'No se pudieron cargar los datos del usuario',
  profilepanel69: 'Se ha producido un error.',
  profilepanel84: 'No autenticado',
  profilepanel100: 'No se pudo actualizar el perfil',
  profilepanel103: 'Perfil actualizado exitosamente',
  profilepanel107: 'Se ha producido un error.',
  profilepanel121: 'Las nuevas contraseñas no coinciden',
  profilepanel129: 'No autenticado',
  profilepanel145: 'No se pudo cambiar la contraseña',
  profilepanel148: 'Contraseña cambiada exitosamente',
  profilepanel156: 'Se ha producido un error.',
  profilepanel181: '{usuario?.correo electrónico}',
  profilepanel200: 'Editar perfil',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel204: 'Nombre',
  profilepanel218: 'Correo electrónico',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel234: 'Actualizar perfil',
  profilepanel242: 'Cambiar la contraseña',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel246: 'Contraseña actual',
  profilepanel263: 'Nueva contraseña',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel276: 'Introducir contraseña',
  profilepanel277: 'Débil',
  profilepanel278: 'Medio',
  profilepanel279: 'Rígido',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel284: 'Confirmar nueva contraseña',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel302: 'Cambiar...',
  profilepanel310: 'Información de la cuenta',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel314: 'ID de usuario',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel317: '{usuario?.id}',

  // resources/js/Components/Panels/ProfilePanel.tsx
  profilepanel321: 'Registrado desde',
  profilepanel330: 'Correo electrónico verificado',

  // resources/js\Components\Panels\ProfilePanel.tsx
  profilepanel355: 'Nunca registrado',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel118: 'd.m.Y',
  projectpanel119: 'Su',
  projectpanel121: 'Europa/Viena',
  projectpanel224: 'Los nombres de los proyectos solo pueden contener letras minúsculas (a-z)',
  projectpanel232: 'No autenticado',
  projectpanel253: 'Los nombres de los proyectos solo pueden contener letras minúsculas (a-z)',
  projectpanel258: 'No se pudo crear el proyecto',
  projectpanel293: 'd.m.Y',
  projectpanel294: 'Su',
  projectpanel296: 'Europa/Viena',
  projectpanel298: 'Proyecto creado exitosamente',
  projectpanel301: 'proyectoCambiado',
  projectpanel304: 'Error al crear el proyecto',
  projectpanel330: 'd.m.Y',
  projectpanel331: 'Su',
  projectpanel333: 'Europa/Viena',
  projectpanel348: 'No autenticado',
  projectpanel352: 'BORRAR',
  projectpanel361: 'No se pudo eliminar el proyecto',
  projectpanel369: 'Proyecto eliminado exitosamente',
  projectpanel372: 'Error al eliminar el proyecto',
  projectpanel390: 'Esa es la',
  projectpanel405: 'No autenticado',
  projectpanel416: 'No se pudieron cargar los equipos',
  projectpanel451: 'No autenticado',
  projectpanel462: 'No se pudieron cargar los esquemas',
  projectpanel492: 'No autenticado',
  projectpanel539: 'Activo',
  projectpanel562: 'Descripción general del proyecto',
  projectpanel575: 'Administrar miembros',
  projectpanel583: 'Editar proyecto',
  projectpanel589: 'Eliminar proyecto',
  projectpanel601: 'Cargando proyectos...',
  projectpanel615: 'Gestión de proyectos',
  projectpanel626: 'Nuevo proyecto',
  projectpanel634: 'Unirse al proyecto',
  projectpanel642: 'Refrescar',
  projectpanel671: 'Proyecto actual',
  projectpanel678: 'Editar proyecto',
  projectpanel692: 'No se proporcionó ninguna descripción',
  projectpanel698: 'Dueño:',
  projectpanel706: 'Creado:',
  projectpanel716: 'Código de unión',
  projectpanel724: 'Copiar código de unión',
  projectpanel730: 'Privado',
  projectpanel742: 'Equipos',
  projectpanel748: 'Miembros',
  projectpanel754: 'Plantillas',
  projectpanel760: 'Bases de datos',
  projectpanel766: 'Aplicaciones',
  projectpanel773: 'No hay ningún proyecto activo',
  projectpanel774: 'Aún no tienes un proyecto activo',
  projectpanel776: 'Crear proyecto',
  projectpanel786: 'Acciones rápidas',
  projectpanel789: 'Aplicaciones',
  projectpanel796: 'Miembros del proyecto',
  projectpanel803: 'Gestión de equipos',
  projectpanel815: 'Invitaciones',
  projectpanel822: 'Plantillas',
  projectpanel838: 'Base de datos',
  projectpanel850: 'Todos los proyectos',
  projectpanel854: 'No se encontraron proyectos',
  projectpanel859: 'Proyecto',
  projectpanel862: 'Dueño',
  projectpanel868: 'Creado',
  projectpanel874: 'Estado',
  projectpanel879: 'Comportamiento',
  projectpanel892: 'Crear nuevo proyecto',
  projectpanel904: 'Configuración del proyecto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel907: 'Nombre del proyecto *',
  projectpanel931: 'Descripción',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel938: 'Ingrese la descripción del proyecto (opcional)',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel955: 'Proyecto Público',
  projectpanel959: 'Los proyectos públicos son visibles para todos los usuarios y se pueden descubrir en la galería de proyectos.',
  projectpanel972: 'Permitir solicitudes de unión',
  projectpanel976: 'Los usuarios pueden solicitar unirse a este proyecto utilizando un código de unión.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel984: 'Conexión a la base de datos',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel987: 'Nombre de la base de datos',
  projectpanel998: 'Nombre de la base de datos para este proyecto',
  projectpanel1004: 'Tipo de base de datos',
  projectpanel1024: 'Servidor',
  projectpanel1038: 'Puerto',
  projectpanel1053: 'Nombre de usuario',
  projectpanel1067: 'Contraseña',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1084: 'Propiedades del proyecto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1087: 'Directorio de proyectos',
  projectpanel1098: 'Ruta donde se deben guardar los archivos generados',
  projectpanel1104: 'URL del proyecto',
  projectpanel1115: 'URL para acceder al proyecto',
  projectpanel1121: 'Página de inicio',
  projectpanel1128: 'índice.php',
  projectpanel1138: 'Idioma predeterminado',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1146: 'Inglés',
  projectpanel1147: 'Alemán',
  projectpanel1148: 'Francés',
  projectpanel1149: 'Español',
  projectpanel1150: 'italiano',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1155: 'Lenguaje estándar para la generación de proyectos',
  projectpanel1161: 'Nombre de archivo Longitud corta',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1185: 'Configuración de localización',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1189: 'Separador decimal',
  projectpanel1207: 'Separador de miles',
  projectpanel1227: 'Formato de fecha',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1234: 'd.m.Y',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1244: 'Formato de hora',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1251: 'Su',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1263: 'Símbolo de moneda',
  projectpanel1281: 'Zona horaria',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1289: 'Europa/Viena',
  projectpanel1290: 'Europa/Berlín',
  projectpanel1291: 'Europa/Zúrich',
  projectpanel1292: 'Europa/Londres',
  projectpanel1293: 'Europa/París',
  projectpanel1294: 'América/Nueva_York',
  projectpanel1295: 'America/Los_Angeles',
  projectpanel1296: 'Asia/Tokio',
  projectpanel1297: 'Australia/Sídney',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1303: 'Zona horaria predeterminada para el proyecto',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1325: 'Cancelar',
  projectpanel1332: 'Crear proyecto',
  projectpanel1342: 'Eliminar proyecto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1356: '¿Estás seguro que deseas eliminar este proyecto?',
  projectpanel1362: 'Esta acción eliminará PERMANENTEMENTE el proyecto y todos sus datos. ¡Esto no se puede deshacer! Los equipos, las plantillas y las bases de datos asociados a este proyecto permanecerán intactos.',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1371: 'Cancelar',
  projectpanel1378: 'Eliminar proyecto',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1434: '📋 Propiedades del proyecto',
  projectpanel1437: 'Nombre:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1440: '📋 Propiedades del proyecto',
  projectpanel1443: 'Nombre:',
  projectpanel1447: 'Dueño:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1449: 'Código de ingreso:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1451: 'Creado:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1453: 'Descripción:',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1455: 'Código de ingreso:',
  projectpanel1459: 'Descripción:',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1461: '👤 Miembros del proyecto',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1467: '👤 Miembros del proyecto',
  projectpanel1471: 'Cargando miembros...',
  projectpanel1481: 'Usuario desconocido',
  projectpanel1482: 'Sin correo electrónico',
  projectpanel1491: 'Miembro',
  projectpanel1513: '👥 Equipos y miembros',
  projectpanel1517: 'Cargando equipos...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1529: '🗄️ Esquemas de base de datos',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1535: '🗄️ Esquemas de base de datos',
  projectpanel1539: 'Cargando esquemas...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1542: 'Todavía no hay esquemas de base de datos vinculados a este proyecto.',
  projectpanel1550: '📄 Plantillas vinculadas',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1556: '📄 Plantillas vinculadas',
  projectpanel1560: 'Cargando plantillas...',

  // resources/js/Components/Panels/ProjectPanel.tsx
  projectpanel1563: 'Todavía no hay plantillas vinculadas a este proyecto.',
  projectpanel1573: 'Cerca',

  // resources/js\Components\Panels\ProjectPanel.tsx
  projectpanel1579: 'Administrar proyecto',
  projectpanel1585: 'Administrar proyecto',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel64: 'd.m.Y',
  projectsettingspanel65: 'Su',
  projectsettingspanel67: 'Europa/Viena',
  projectsettingspanel143: 'd.m.Y',
  projectsettingspanel144: 'Su',
  projectsettingspanel146: 'Europa/Viena',
  projectsettingspanel151: 'Error al cargar los datos del proyecto',
  projectsettingspanel190: 'No hay ningún proyecto seleccionado',
  projectsettingspanel209: 'No autenticado',
  projectsettingspanel225: 'No se pudo actualizar el proyecto',
  projectsettingspanel243: 'No se pudo guardar la configuración de idioma',
  projectsettingspanel246: 'La configuración del proyecto se guardó correctamente',
  projectsettingspanel251: 'Error al guardar la configuración del proyecto',
  projectsettingspanel258: 'PROY-',
  projectsettingspanel275: 'Por favor seleccione un proyecto',
  projectsettingspanel276: 'selectedProject es nulo',
  projectsettingspanel277: '🔍 ProjectSettingsPanel cargado pero no se seleccionó ningún proyecto',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel295: 'Configuración del proyecto',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel304: 'Guardar todos los cambios',
  projectsettingspanel313: 'Generalmente',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel316: 'Nombre del proyecto *',
  projectsettingspanel331: 'Descripción',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel338: 'Introduzca la descripción del proyecto',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel344: 'Código de unión',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel351: 'Código de ingreso (opcional)',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel359: 'Los usuarios pueden unirse a este proyecto con este código',
  projectsettingspanel375: 'Hacer que este proyecto sea visible para todos los usuarios',
  projectsettingspanel382: 'Transferencia de propiedad',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel405: 'base de datos',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel408: 'Nombre de la base de datos',
  projectsettingspanel420: 'Tipo de base de datos',
  projectsettingspanel463: 'nombre de usuario',
  projectsettingspanel475: 'contraseña',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel489: 'Características',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel492: 'Directorio de proyectos',
  projectsettingspanel501: 'Ruta donde se deben guardar los archivos generados',
  projectsettingspanel507: 'URL del proyecto',
  projectsettingspanel516: 'URL para acceder al proyecto',
  projectsettingspanel522: 'Hogar',
  projectsettingspanel537: 'Idioma predeterminado',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel544: 'Inglés',
  projectsettingspanel545: 'Alemán',
  projectsettingspanel546: 'Francés',
  projectsettingspanel547: 'Español',
  projectsettingspanel548: 'italiano',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel552: 'Lenguaje estándar para la generación de proyectos',
  projectsettingspanel558: 'Nombre de archivo de longitud corta',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel565: '2 personajes',
  projectsettingspanel566: '3 caracteres',
  projectsettingspanel567: '4 caracteres',
  projectsettingspanel568: '5 caracteres',
  projectsettingspanel578: 'Localización',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel582: 'Separador decimal',
  projectsettingspanel592: 'p. ej. \',\' para 1.23 o \'.\' para 1.23',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel593: 'por 1,23 o',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel598: 'Separador de miles',
  projectsettingspanel608: 'p. ej. \'.\' para 1,234 o "," para 1,234',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel609: 'por 1.234 o',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel616: 'Formato de fecha',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel622: 'd.m.Y',
  projectsettingspanel626: 'd.m.Y',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel631: 'Formato de hora',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel637: 'Su',
  projectsettingspanel641: 'Su',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel658: 'por ejemplo, \'€\', \'$\', \'£\', \'CHF\'',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel659: 'franco suizo',
  projectsettingspanel671: 'Europa/Viena',
  projectsettingspanel672: 'Europa/Berlín',
  projectsettingspanel673: 'Europa/Zúrich',
  projectsettingspanel674: 'Europa/Londres',
  projectsettingspanel675: 'América/Nueva_York',
  projectsettingspanel676: 'Estados Unidos/Chicago',
  projectsettingspanel677: 'America/Los_Angeles',
  projectsettingspanel678: 'Asia/Tokio',
  projectsettingspanel679: 'Asia/Dubai',

  // resources/js/Components/Panels/ProjectSettingsPanel.tsx
  projectsettingspanel680: 'UTC',
  projectsettingspanel689: 'Clave API de Google Translate',
  projectsettingspanel700: 'Clave API para traducciones automáticas a través de Google Translate',

  // resources/js\Components\Panels\ProjectSettingsPanel.tsx
  projectsettingspanel711: 'Idiomas',
  projectsettingspanel727: 'Idiomas disponibles',
  projectsettingspanel728: 'Idiomas activados',
  projectsettingspanel733: 'Buscar...',
  projectsettingspanel734: 'Buscar...',
  projectsettingspanel739: 'Idiomas seleccionados:',
  projectsettingspanel742: 'No hay idiomas seleccionados',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel85: 'No autenticado',
  publicprojectspanel97: 'No se pudieron cargar los proyectos públicos',
  publicprojectspanel104: 'Error al cargar proyectos públicos',
  publicprojectspanel111: 'Esa es la',
  publicprojectspanel183: 'No se pudo clonar el proyecto',
  publicprojectspanel186: 'No se pudo clonar el proyecto',
  publicprojectspanel210: 'Cargando proyectos públicos...',
  publicprojectspanel222: 'Proyectos públicos',
  publicprojectspanel227: 'Únete con código',
  publicprojectspanel234: 'Refrescar',
  publicprojectspanel253: 'Buscar proyectos por nombre, descripción o propietario...',
  publicprojectspanel266: 'No hay proyectos públicos',
  publicprojectspanel270: 'Intente ajustar sus términos de búsqueda.',
  publicprojectspanel271: 'No hay proyectos públicos disponibles en este momento.',
  publicprojectspanel276: 'Borrar búsqueda',
  publicprojectspanel296: 'Público',
  publicprojectspanel316: 'No se proporcionó descripción.',
  publicprojectspanel338: 'Tu proyecto',
  publicprojectspanel342: 'Este es tu propio proyecto. Usa la pestaña Proyectos para duplicarlo.',
  publicprojectspanel346: 'Proyecto Clon',
  publicprojectspanel366: 'Proyectos totales',
  publicprojectspanel372: 'Aceptando miembros',
  publicprojectspanel378: 'Demostración',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel411: 'Nombre del proyecto *',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel418: 'Introduzca el nombre del proyecto',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel426: 'Descripción',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel433: 'Introduzca la descripción del proyecto',

  // resources/js/Components/Panels/PublicProjectsPanel.tsx
  publicprojectspanel448: 'Proyecto Público',
  publicprojectspanel452: 'Los proyectos públicos son visibles para todos los usuarios y se pueden descubrir en la galería de proyectos.',
  publicprojectspanel455: '💡 Nota: Los proyectos privados pueden requerir funciones premium.',

  // resources/js\Components\Panels\PublicProjectsPanel.tsx
  publicprojectspanel463: 'Proyecto original:',
  publicprojectspanel474: 'Cancelar',
  publicprojectspanel481: 'Proyecto Clon',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel31: 'Las contraseñas no coinciden',
  registerpanel54: 'El registro falló',
  registerpanel57: '¡Registro exitoso! Ya puedes iniciar sesión.',
  registerpanel75: 'Se ha producido un error.',
  registerpanel90: 'Registro',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel115: 'Nombre',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel123: 'Tu nombre completo',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel131: 'Correo electrónico',
  registerpanel139: 'tu.email@ejemplo.com',
  registerpanel147: 'contraseña',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel154: 'Al menos 8 caracteres',
  registerpanel161: 'Introducir contraseña',
  registerpanel162: 'Débil',
  registerpanel163: 'Medio',
  registerpanel164: 'Rígido',

  // resources/js/Components/Panels/RegisterPanel.tsx
  registerpanel169: 'Confirmar Contraseña',

  // resources/js\Components\Panels\RegisterPanel.tsx
  registerpanel176: 'Repita la contraseña',
  registerpanel188: 'El registro está en proceso...',
  registerpanel198: '¿Ya tienes una cuenta? Iniciar sesión',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel104: 'Error al cargar los idiomas:',
  schematranslationpanel133: 'No se pudo cargar la estructura del esquema:',
  schematranslationpanel281: 'Por favor seleccione al menos un idioma',
  schematranslationpanel289: 'No autenticado',
  schematranslationpanel303: 'No se pudieron exportar las traducciones',
  schematranslationpanel317: 'Traducciones exportadas exitosamente',
  schematranslationpanel319: 'Error desconocido',
  schematranslationpanel334: 'Por favor seleccione un archivo y al menos un idioma',
  schematranslationpanel342: 'No autenticado',
  schematranslationpanel364: 'No se pudieron importar las traducciones',
  schematranslationpanel377: 'Error al importar:',
  schematranslationpanel385: 'No hay ningún proyecto seleccionado',
  schematranslationpanel449: 'Por favor seleccione al menos un idioma de destino',
  schematranslationpanel459: 'No autenticado',
  schematranslationpanel481: 'Traducción automática fallida:',
  schematranslationpanel505: 'Traducción fallida',
  schematranslationpanel640: 'Mesa',
  schematranslationpanel648: 'Campo',
  schematranslationpanel662: 'Seleccione un elemento para traducir',
  schematranslationpanel663: 'Elija una tabla o campo del árbol de esquema para administrar sus traducciones',
  schematranslationpanel682: 'Administrar traducciones para este {itemInfo.type.toLowerCase()}',
  schematranslationpanel688: 'Guardado automático...',
  schematranslationpanel701: '>No se encontraron traducciones para',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel702: 'Introduce las traducciones a continuación para crear nuevas entradas. Se guardarán automáticamente tras un segundo de inactividad.',
  schematranslationpanel743: 'Administrador de traducción de esquemas',
  schematranslationpanel746: 'Traducir nombres de tablas y campos de bases de datos para la internacionalización',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel753: 'Exportar',
  schematranslationpanel762: 'Importar',
  schematranslationpanel771: 'Traducción automática',
  schematranslationpanel791: 'Esquema de base de datos',
  schematranslationpanel802: 'Expandir todo',
  schematranslationpanel812: 'Contraer todo',
  schematranslationpanel818: 'Seleccionar tablas y campos para traducir',
  schematranslationpanel820: 'Proyecto: {selectedProject.name}',
  schematranslationpanel827: 'Por favor seleccione un proyecto primero',
  schematranslationpanel830: 'Cargando esquema...',
  schematranslationpanel834: 'No se encontraron tablas de esquema',
  schematranslationpanel835: 'Este proyecto no tiene datos de esquema para traducir',
  schematranslationpanel908: 'Exportar traducciones a Excel',
  schematranslationpanel922: 'Exportar para {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel923: 'Seleccione los idiomas que se incluirán en la exportación de Excel. La exportación contendrá todas las tablas y campos de las bases de datos vinculadas.',
  schematranslationpanel931: 'Seleccionar idiomas *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel938: 'Seleccione los idiomas para exportar',
  schematranslationpanel950: 'Cancelar',
  schematranslationpanel957: 'Exportar a Excel',
  schematranslationpanel969: 'Importar traducciones desde Excel',
  schematranslationpanel986: 'Importar para {selectedProject?.name}',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel987: 'Sube un archivo de Excel con las traducciones. Selecciona los idiomas que quieres importar.',
  schematranslationpanel995: 'Subir archivo Excel *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1006: 'Seleccione un archivo de Excel',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1015: 'Seleccione los idiomas que desea importar *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1022: 'Seleccione los idiomas que desea importar',
  schematranslationpanel1034: 'Cancelar',
  schematranslationpanel1044: 'Importar traducciones',
  schematranslationpanel1056: 'Traducir automáticamente con Google Translate',
  schematranslationpanel1074: 'Traducción automática',
  schematranslationpanel1078: 'Todas las tablas y campos con el idioma de origen se traducirán automáticamente.',
  schematranslationpanel1079: 'Seleccione el idioma de origen (debe estar ya completado) y los idiomas de destino para la traducción.',
  schematranslationpanel1090: 'traducirTodo',
  schematranslationpanel1103: '🚀 Traducir todas las tablas y campos',

  // resources/js/Components/Panels/SchemaTranslationPanel.tsx
  schematranslationpanel1113: 'Idioma de origen *',
  schematranslationpanel1139: 'Idiomas de destino *',

  // resources/js\Components\Panels\SchemaTranslationPanel.tsx
  schematranslationpanel1148: 'Seleccionar idiomas de destino',
  schematranslationpanel1195: 'Cancelar',
  schematranslationpanel1205: 'Traducir ahora',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel48: 'Error al cargar la configuración:',
  systemsettingspanel67: '¡Configuración actualizada exitosamente!',
  systemsettingspanel69: 'No se pudo actualizar la configuración:',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel86: '⚙️ Configuración del sistema',
  systemsettingspanel89: 'Configurar los ajustes globales del sistema para Scoriet',
  systemsettingspanel99: '🌍 API del Traductor de Google',
  systemsettingspanel102: 'Configurar la clave API global de Google Translate para los usuarios del plan Business',
  systemsettingspanel107: 'Clave API global',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel117: 'Introduzca la clave API de Google Translate...',

  // resources/js/Components/Panels/SystemSettingsPanel.tsx
  systemsettingspanel132: '💰 Precios de suscripción',
  systemsettingspanel135: 'Establecer precios de suscripción mensuales para cada nivel de plan',

  // resources/js\Components\Panels\SystemSettingsPanel.tsx
  systemsettingspanel148: 'Por favor, introduzca el precio Premium',
  systemsettingspanel149: 'El precio debe ser positivo',
  systemsettingspanel157: 'Dólar estadounidense',
  systemsettingspanel180: 'Por favor, introduzca el precio de empresa',
  systemsettingspanel181: 'El precio debe ser positivo',
  systemsettingspanel189: 'Dólar estadounidense',
  systemsettingspanel212: 'Por favor, introduzca el precio mínimo para el patrocinador',
  systemsettingspanel213: 'El precio debe ser positivo',
  systemsettingspanel221: 'Dólar estadounidense',
  systemsettingspanel242: 'Reiniciar',
  systemsettingspanel251: 'Guardar configuración',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel105: 'No autenticado',
  teammanagementpanel143: 'No autenticado',
  teammanagementpanel155: 'No se pudieron cargar los equipos',
  teammanagementpanel174: 'Error',
  teammanagementpanel175: 'No se pudieron cargar los equipos',
  teammanagementpanel200: 'Eliminar equipo',
  teammanagementpanel208: 'No autenticado',
  teammanagementpanel212: 'BORRAR',
  teammanagementpanel221: 'No se pudo eliminar el equipo',
  teammanagementpanel226: 'Éxito',
  teammanagementpanel227: 'Equipo eliminado exitosamente',
  teammanagementpanel234: 'equipo cambiado',
  teammanagementpanel239: 'Error',
  teammanagementpanel240: 'No se pudo eliminar el equipo',
  teammanagementpanel258: 'Éxito',
  teammanagementpanel259: 'Equipo creado exitosamente',
  teammanagementpanel264: 'equipo cambiado',
  teammanagementpanel277: 'Nuevo equipo',
  teammanagementpanel291: 'Busca equipos aquí...',
  teammanagementpanel316: 'Desconocido',
  teammanagementpanel334: 'Inactivo',
  teammanagementpanel361: 'Sin proyectos',
  teammanagementpanel368: 'Esa es la',
  teammanagementpanel386: 'Administrar miembros',
  teammanagementpanel394: 'Equipo de edición',
  teammanagementpanel400: 'Eliminar equipo',
  teammanagementpanel416: 'Gestión de equipos',

  // resources/js/Components/Panels/TeamManagementPanel.tsx
  teammanagementpanel417: 'Crea, gestiona y organiza tus equipos. Asigna miembros y controla los permisos de acceso.',

  // resources/js\Components\Panels\TeamManagementPanel.tsx
  teammanagementpanel439: 'No se encontraron equipos',
  teammanagementpanel451: 'Nombre del equipo',
  teammanagementpanel458: 'Dueño',
  teammanagementpanel465: 'Miembros',
  teammanagementpanel471: 'Estado',
  teammanagementpanel478: 'Proyectos',
  teammanagementpanel485: 'Creado',
  teammanagementpanel491: 'Comportamiento',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old97: 'No se encontró ningún token de autenticación',
  teamspanel_old147: 'Se produjo un error',
  teamspanel_old192: 'No se pudo aceptar la invitación',
  teamspanel_old216: 'No se pudo rechazar la invitación',
  teamspanel_old225: 'Cargando equipos...',
  teamspanel_old236: 'Error al cargar equipos',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old241: 'Rever',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old263: 'Crear equipo',
  teamspanel_old270: 'Equipos propios',
  teamspanel_old271: 'Miembro de',
  teamspanel_old272: 'Invitaciones',
  teamspanel_old297: 'Aún no hay equipos',
  teamspanel_old298: 'Crea tu primer equipo para empezar a colaborar',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old316: 'Dueño',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old360: 'No es miembro de ningún equipo',
  teamspanel_old361: 'Aquí verás los equipos a los que estás invitado a unirte.',

  // resources/js/Components/Panels/TeamsPanel_Old.tsx
  teamspanel_old373: 'Miembro',

  // resources/js\Components\Panels\TeamsPanel_Old.tsx
  teamspanel_old415: 'No hay invitaciones pendientes',
  teamspanel_old416: 'Las invitaciones del equipo aparecerán aquí',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel91: 'No autenticado',
  teamspanel128: 'Error al cargar datos',
  teamspanel172: 'Error al cargar los equipos del proyecto',
  teamspanel182: 'No autenticado',
  teamspanel193: 'No se pudieron cargar los proyectos',
  teamspanel199: 'Error al cargar proyectos',
  teamspanel227: 'No autenticado',
  teamspanel238: 'No se pudieron cargar los equipos',
  teamspanel255: 'Error al cargar equipos',
  teamspanel270: 'No autenticado',
  teamspanel295: 'No se pudieron asignar equipos',
  teamspanel347: 'equipo cambiado',
  teamspanel349: ' equipos asignados a proyectos con éxito',
  teamspanel350: 'Error al asignar equipos',
  teamspanel364: 'No autenticado',
  teamspanel368: 'BORRAR',
  teamspanel420: 'equipo cambiado',
  teamspanel425: 'Error al eliminar el equipo',
  teamspanel430: 'eliminado del proyecto exitosamente',
  teamspanel451: 'Cargando equipos...',
  teamspanel457: 'Equipos de proyecto',
  teamspanel487: 'Buscar proyectos o equipos...',

  // resources/js/Components/Panels/TeamsPanel.tsx
  teamspanel494: 'No se encontraron proyectos',
  teamspanel527: 'No hay equipos disponibles para este proyecto',

  // resources/js\Components\Panels\TeamsPanel.tsx
  teamspanel544: 'Desconocido',
  teamspanel552: 'Sin asignar',
  teamspanel557: 'Asignado',
  teamspanel563: 'Eliminar del proyecto',
  teamspanel608: 'Borrar selección',
  teamspanel619: 'Asignar equipo(s) a proyectos',
  teamspanel630: 'No se encontraron equipos',
  teamspanel675: 'Eliminar del proyecto',
  teamspanel697: 'Nombre del equipo',
  teamspanel698: 'Descripción',
  teamspanel701: 'Dueño',
  teamspanel705: 'Desconocido',
  teamspanel711: 'Miembros',
  teamspanel721: 'Estado',
  teamspanel726: 'Inactivo',
  teamspanel732: 'Creado',
  teamspanel733: 'Esa es la',
  teamspanel745: 'Borrar selección',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel102: 'No se pudieron cargar los esquemas de la base de datos',
  templatedbschemadependenciespanel123: 'Dependencia del esquema de base de datos agregada exitosamente',
  templatedbschemadependenciespanel128: 'No se pudo agregar la dependencia',
  templatedbschemadependenciespanel132: 'No se pudo agregar la dependencia',
  templatedbschemadependenciespanel144: 'Agregar dependencia del esquema de base de datos',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel158: 'Esquema de base de datos *',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel164: 'Seleccione un esquema de base de datos',
  templatedbschemadependenciespanel176: 'Seleccionar un esquema de base de datos',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel203: 'Dependencia requerida',

  // resources/js\Components\Panels\TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel231: 'Introduzca un alias para este esquema de base de datos en la plantilla',
  templatedbschemadependenciespanel242: 'Cancelar',
  templatedbschemadependenciespanel248: 'Agregar dependencia',
  templatedbschemadependenciespanel324: 'No se pudieron cargar las plantillas',
  templatedbschemadependenciespanel346: 'No se pudieron cargar las dependencias de la plantilla',
  templatedbschemadependenciespanel350: 'No se pudieron cargar las dependencias de la plantilla',
  templatedbschemadependenciespanel364: 'BORRAR',
  templatedbschemadependenciespanel367: 'Dependencia eliminada exitosamente',
  templatedbschemadependenciespanel372: 'No se pudo eliminar la dependencia',
  templatedbschemadependenciespanel376: 'No se pudo eliminar la dependencia',
  templatedbschemadependenciespanel390: 'Inactivo',
  templatedbschemadependenciespanel404: 'Sólo lectura',
  templatedbschemadependenciespanel405: 'Sólo puedes editar tus propias plantillas',
  templatedbschemadependenciespanel415: 'Administrar',
  templatedbschemadependenciespanel440: 'Requerido',
  templatedbschemadependenciespanel442: 'Opcional',
  templatedbschemadependenciespanel457: 'Plantilla de solo lectura',
  templatedbschemadependenciespanel469: 'Eliminar dependencia',
  templatedbschemadependenciespanel483: 'Plantilla - Dependencias del esquema de base de datos',
  templatedbschemadependenciespanel496: 'Plantillas',
  templatedbschemadependenciespanel504: 'Todo',
  templatedbschemadependenciespanel505: 'Sistema',
  templatedbschemadependenciespanel506: 'Público',
  templatedbschemadependenciespanel507: 'Proyecto',
  templatedbschemadependenciespanel517: 'Buscar plantillas...',
  templatedbschemadependenciespanel527: 'No hay plantillas disponibles',
  templatedbschemadependenciespanel536: 'Plantilla',
  templatedbschemadependenciespanel541: 'Comportamiento',
  templatedbschemadependenciespanel559: 'Agregar',
  templatedbschemadependenciespanel570: 'Sin dependencias del esquema de base de datos',
  templatedbschemadependenciespanel578: 'Esquema de base de datos',
  templatedbschemadependenciespanel583: 'Estado',
  templatedbschemadependenciespanel588: 'Comportamiento',

  // resources/js/Components/Panels/TemplateDbSchemaDependenciesPanel.tsx
  templatedbschemadependenciespanel595: 'Seleccione una plantilla para ver sus dependencias del esquema de base de datos',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager108: 'Crear',
  templatefilemanager116: 'Archivo eliminado exitosamente',
  templatefilemanager120: 'Error al eliminar el archivo',
  templatefilemanager131: 'Error al mover el archivo',
  templatefilemanager137: '¿Estás seguro que deseas eliminar este archivo?',
  templatefilemanager138: '¿Borrar archivo?',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager141: 'Y',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager142: 'No',
  templatefilemanager175: 'Arriba',
  templatefilemanager185: 'Hacia abajo',
  templatefilemanager195: 'Editar',
  templatefilemanager205: 'Borrar',
  templatefilemanager216: 'Administrar archivos de plantilla',
  templatefilemanager220: 'Nuevo archivo',
  templatefilemanager227: 'Cerca',
  templatefilemanager241: 'No hay archivos disponibles',
  templatefilemanager243: 'Nombre',
  templatefilemanager244: 'Tipo',
  templatefilemanager245: 'Serie',
  templatefilemanager246: 'Tamaño',
  templatefilemanager247: 'Comportamiento',
  templatefilemanager252: 'Crear nuevo archivo',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager265: 'Nombre del archivo *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager271: '¡Por favor introduzca el nombre del archivo!',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager276: 'p. ej., Model.php, component.tsx',
  templatefilemanager288: 'Tipo *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager294: '¡Por favor seleccione el tipo!',
  templatefilemanager301: 'Seleccionar tipo',

  // resources/js/Components/Panels/TemplateFileManager.tsx
  templatefilemanager335: 'Contenido del archivo *',

  // resources/js\Components\Panels\TemplateFileManager.tsx
  templatefilemanager341: '¡Por favor introduzca el contenido del archivo!',
  templatefilemanager347: 'Introduzca el código de plantilla aquí...',
  templatefilemanager361: 'Cancelar',
  templatefilemanager368: 'Crear',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel96: 'Todo',
  templatemanagementpanel113: 'Base de datos',
  templatemanagementpanel115: 'Archivo estático',
  templatemanagementpanel116: 'Directorio estático como archivo ZIP',
  templatemanagementpanel117: 'Archivo específico del proyecto con marcadores de posición',
  templatemanagementpanel118: 'Archivo de tabla de base de datos',
  templatemanagementpanel119: 'Archivo específico del proyecto con soporte de idiomas',
  templatemanagementpanel120: 'Archivo por tabla de base de datos con soporte de idiomas',
  templatemanagementpanel135: 'Gestión de plantillas',
  templatemanagementpanel150: 'Error al cargar las plantillas. Inicia sesión primero.',
  templatemanagementpanel202: 'Error al cargar los detalles de la plantilla',
  templatemanagementpanel211: 'Plantilla eliminada permanentemente',
  templatemanagementpanel216: 'Error al eliminar permanentemente la plantilla',
  templatemanagementpanel230: 'Error al cambiar el estado de la plantilla',
  templatemanagementpanel286: 'Plantilla clonada exitosamente',
  templatemanagementpanel291: 'Error al clonar la plantilla',
  templatemanagementpanel335: 'Crear',
  templatemanagementpanel340: 'Ahorrar',
  templatemanagementpanel359: 'Plantilla guardada exitosamente',
  templatemanagementpanel395: 'Error al guardar la plantilla',
  templatemanagementpanel410: 'Plantilla importada exitosamente',
  templatemanagementpanel413: 'Error al importar la plantilla',
  templatemanagementpanel419: 'Ya existe una plantilla con este nombre. ¿Quieres sobrescribirla?',
  templatemanagementpanel420: 'La plantilla ya existe',
  templatemanagementpanel428: 'Plantilla importada y sobrescrita exitosamente',
  templatemanagementpanel433: 'Error al sobrescribir la plantilla',
  templatemanagementpanel436: 'Y',
  templatemanagementpanel437: 'Cancelar',
  templatemanagementpanel441: 'Error al importar la plantilla',
  templatemanagementpanel464: 'Plantilla exportada exitosamente',
  templatemanagementpanel467: 'Error al exportar la plantilla',
  templatemanagementpanel485: 'No hay ninguna plantilla seleccionada',
  templatemanagementpanel517: 'Error al eliminar el archivo',
  templatemanagementpanel521: 'Error al eliminar el archivo:',
  templatemanagementpanel527: 'No hay ninguna plantilla seleccionada',
  templatemanagementpanel595: 'agregado',
  templatemanagementpanel597: 'Error al guardar el archivo',
  templatemanagementpanel601: 'Error al guardar el archivo:',
  templatemanagementpanel613: 'Gestión de plantillas',
  templatemanagementpanel618: 'Nueva plantilla',
  templatemanagementpanel624: 'Importar',
  templatemanagementpanel646: 'Buscar plantillas...',
  templatemanagementpanel653: 'Categoría',
  templatemanagementpanel667: 'No se encontraron plantillas',
  templatemanagementpanel669: '{first} a {last} de {totalRecords} plantillas',
  templatemanagementpanel672: 'Nombre',
  templatemanagementpanel675: 'Categoría',
  templatemanagementpanel684: 'Idioma',
  templatemanagementpanel693: 'Etiquetas',
  templatemanagementpanel706: 'Archivos',
  templatemanagementpanel711: 'Estado',
  templatemanagementpanel716: 'Activo',
  templatemanagementpanel721: 'Tipo',
  templatemanagementpanel736: 'Privado',
  templatemanagementpanel743: 'Creado',
  templatemanagementpanel744: 'Esa es la',
  templatemanagementpanel747: 'Comportamiento',
  templatemanagementpanel757: 'Espectáculo',
  templatemanagementpanel764: 'Editar',
  templatemanagementpanel771: 'Exportar',
  templatemanagementpanel777: 'Clon',
  templatemanagementpanel785: 'Activar',
  templatemanagementpanel791: '¿Eliminar la plantilla permanentemente? ¡Esta acción no se puede deshacer!',
  templatemanagementpanel795: 'Eliminar permanentemente',
  templatemanagementpanel859: 'Descripción:',
  templatemanagementpanel862: 'Categoría:',
  templatemanagementpanel865: 'Idioma:',
  templatemanagementpanel868: 'Etiquetas:',
  templatemanagementpanel876: 'Archivos ({viewingTemplate.files?.length || 0}):',
  templatemanagementpanel893: 'No hay archivos disponibles',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel933: 'Nuevo nombre de plantilla',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel939: 'Introduzca el nombre de la plantilla...',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel944: '🔍Consultar disponibilidad...',
  templatemanagementpanel949: '❌ El nombre no puede asignarse dos veces',
  templatemanagementpanel954: '✅ El nombre está disponible',
  templatemanagementpanel961: 'visibilidad',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel970: 'Público (visible para todos)',
  templatemanagementpanel971: 'Privado (solo para ti)',

  // resources/js/Components/Panels/TemplateManagementPanel.tsx
  templatemanagementpanel976: 'Aquellos:',

  // resources/js\Components\Panels\TemplateManagementPanel.tsx
  templatemanagementpanel977: 'Tipo:',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal15: 'Promesa',
  templatemodal16: 'Promesa',
  templatemodal147: 'Crear nueva plantilla',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal159: 'Nombre *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal166: '¡Por favor ingrese el nombre de la plantilla!',
  templatemodal169: 'El nombre de la plantilla debe contener solo letras minúsculas',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal195: 'Descripción',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal206: 'Descripción de la plantilla (opcional)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal220: 'Categoría *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal226: '¡Por favor seleccione una categoría!',
  templatemodal235: 'Todo',
  templatemodal236: 'Seleccionar categoría',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal248: 'Idioma *',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal254: '¡Por favor, introduzca el idioma!',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal259: 'p. ej., PHP, JavaScript, TypeScript',
  templatemodal276: 'Etiquetas',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal290: 'Agregar etiquetas (presione Enter)',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal301: 'Visibilidad*',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal307: '¡Por favor seleccione visibilidad!',
  templatemodal317: 'Público',
  templatemodal318: 'Privado',
  templatemodal320: 'Seleccionar visibilidad',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal333: 'Plantilla del sistema',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal362: 'Archivos de plantilla',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal379: 'Guarde la plantilla, solo así podrá agregar archivos a la plantilla',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal395: 'Nombre',
  templatemodal396: 'Tipo',
  templatemodal397: 'Tamaño',
  templatemodal398: 'Comportamiento',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal448: 'No se han añadido archivos. Haz clic en "Añadir archivo" para empezar.',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal449: 'Agregar archivo',

  // resources/js/Components/Panels/TemplateModal.tsx
  templatemodal469: 'La plantilla está activa',

  // resources/js\Components\Panels\TemplateModal.tsx
  templatemodal491: 'Ahorrar',
  templatemodal502: 'Sin cambios',
  templatemodal503: 'Crear',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal65: 'No autenticado',
  sqlimportmodal76: 'No se pudieron cargar los esquemas',
  sqlimportmodal87: 'Error al cargar esquemas',
  sqlimportmodal106: 'No hay ningún proyecto seleccionado. Seleccione primero un proyecto.',
  sqlimportmodal129: 'Se requiere un script SQL',
  sqlimportmodal134: 'Seleccione un esquema de destino',
  sqlimportmodal139: 'No hay ningún proyecto seleccionado',
  sqlimportmodal144: 'No se ha seleccionado ningún esquema',
  sqlimportmodal154: 'Se requiere autenticación',
  sqlimportmodal177: 'Error al importar SQL',
  sqlimportmodal203: 'Error en la importación',
  sqlimportmodal211: '📥 Importar esquema SQL',
  sqlimportmodal234: 'Importar el esquema de la base de datos desde un script SQL',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal277: 'Esquema de destino',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal286: 'Cargando esquemas...',
  sqlimportmodal301: 'No hay esquemas editables en el proyecto',
  sqlimportmodal313: 'Breve descripción...',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal322: 'Script SQL',
  sqlimportmodal328: 'Pegue sus declaraciones SQL CREATE TABLE aquí...',
  sqlimportmodal332: 'Admite declaraciones CREATE TABLE, ALTER TABLE y restricciones de MySQL',
  sqlimportmodal338: 'Subir archivo SQL',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal353: '¡Archivo cargado exitosamente!',
  sqlimportmodal368: 'Haga clic para seleccionar el archivo SQL',

  // resources/js/Components/SqlImportModal.tsx
  sqlimportmodal369: 'Admite archivos .sql y .txt',
  sqlimportmodal405: 'Cancelar',

  // resources/js\Components\SqlImportModal.tsx
  sqlimportmodal423: '📥 Esquema de importación',

  // resources/js\Components\TopBar.tsx
  topbar57: 'Aplicaciones actualizadas',
  topbar60: 'Aplicaciones actualizadas',
  topbar71: 'La escoria',
  topbar75: 'Generador de código empresarial',
  topbar98: 'Seleccionar proyecto',
  topbar102: 'No se encontraron proyectos',
  topbar122: 'abrirAplicacionesModal',

  // resources/js\Components\Utils\FontProvider.tsx
  fontprovider16: 'instrumentoSans',
  fontprovider29: 'instrumentoSans',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal19: 'Actual',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal29: '💡¿Crear una nueva versión?',
  versionconfirmationmodal53: '¿Te gustaría crear una nueva versión para esto?',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal67: 'Sí, crear nueva versión',
  versionconfirmationmodal83: 'No',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal84: 'Cambiar directamente sin una nueva versión',
  versionconfirmationmodal92: 'ℹ️ Siempre puedes crear una nueva versión más tarde haciendo clic en "Guardar como nueva versión".',

  // resources/js\Components\VersionConfirmationModal.tsx
  versionconfirmationmodal93: 'Guardar como nueva versión',

  // resources/js/Components/VersionConfirmationModal.tsx
  versionconfirmationmodal102: 'Cancelar',

  // resources/js\contexts\ProjectContext.tsx
  projectcontext196: 'useProject debe usarse dentro de un ProjectProvider',

  // resources/js\contexts\ToastContext.tsx
  toastcontext19: 'Éxito',
  toastcontext28: 'Error',
  toastcontext37: 'Información',
  toastcontext46: 'advertencia',
  toastcontext63: 'useToast debe usarse dentro de un ToastProvider',

  // resources/js\i18n\index.ts
  indexts26: 'almacenamiento local',
  indexts28: 'almacenamiento local',

  // resources/js\lib\api.ts
  apits104: 'Se requiere autenticación: inicie sesión',
  apits119: 'La autenticación ha expirado. Por favor, inicie sesión nuevamente.',
  apits152: 'Todo',
  apits201: 'Error desconocido',
  apits219: 'Error desconocido',
  apits235: 'Error desconocido',
  apits251: 'Error desconocido',
  apits268: 'Error desconocido',
  apits286: 'Error desconocido',
  apits314: 'Error desconocido',
  apits329: 'Error desconocido',
  apits350: 'Error desconocido',
  apits518: 'No se pudo obtener el precio:',
  apits527: 'euros',
  apits553: 'euros',

  // resources/js\pages\CMSPage.tsx
  cmspage45: 'idioma cambiado',
  cmspage194: 'BETA',
  cmspage208: 'Hogar',
  cmspage352: 'La escoria',

  // resources/js/pages/CMSPage.tsx
  cmspage353: 'El futuro de la generación de código. Creado por desarrolladores, para desarrolladores.',

  // resources/js\pages\CMSPage.tsx
  cmspage387: 'imprimir',
  cmspage412: 'Elige tu plan',
  cmspage422: 'Plan actual',
  cmspage423: 'Gratis',
  cmspage426: 'Plan gratuito',
  cmspage435: 'De primera calidad',
  cmspage440: 'Ideal para desarrolladores profesionales',
  cmspage462: 'Elige Premium',
  cmspage473: 'MÁS POPULAR',
  cmspage474: 'Negocio',
  cmspage479: 'Ideal para equipos y agencias',
  cmspage501: 'Elija Negocio',
  cmspage520: 'Apoya a la comunidad',
  cmspage542: 'Conviértete en mecenas',
  cmspage553: 'Puedes cambiar o cancelar tu plan en cualquier momento. Todos los planes incluyen una garantía de reembolso de 30 días.',

  // resources/js\pages\EmailVerification.tsx
  emailverification13: 'Confirmar correo electrónico - Scoriet',

  // resources/js\pages\Index.tsx
  index133: 'Panel de carga...',
  index258: 'Equipo de administración',

  // resources/js/pages/Index.tsx
  index265: 'tarjeta personalizada',

  // resources/js\pages\Index.tsx
  index293: 'Gestión de plantillas',
  index333: 'Gestión de bases de datos',
  index378: 'Generador de manuales de depuración',
  index400: 'Bienvenido',
  index413: 'Diseñador de bases de datos',
  index426: 'Plantillas',
  index439: 'Explorador de bases de datos',
  index476: 'Equipos',
  index495: 'Gestión de proyectos',
  index508: 'Mis aplicaciones',
  index521: 'Proyectos públicos',
  index534: 'Proteger',
  index539: 'Se rechazará la eliminación de esta pestaña.',
  index540: 'Esto se hace en la devolución de llamada onLayoutChange',
  index542: 'Prueba Alt+P para actualizar esta pestaña',
  index543: 'Prueba Alt+M para maximizar esta pestaña',
  index544: 'Pruebe Alt+L para registrar el diseño actual',
  index545: 'Prueba Alt+C para copiar el diseño al portapapeles',
  index556: 'Acceso',
  index590: 'Gestión de plantillas',
  index625: 'Gestión de bases de datos',
  index662: 'Equipo de administración',
  index676: 'Plantilla - Dependencias del esquema de base de datos',
  index689: '🔧 Generador de manuales de depuración',
  index711: 'Generación de código',
  index724: 'Gestión del lenguaje',
  index737: 'Traducción de esquemas',
  index750: 'Configuración del sistema',
  index763: 'Configuración del proyecto',
  index776: 'Administrador de CMS',
  index792: 'Modal de autorización',
  index796: '📋 Información',
  index797: 'La autenticación ahora se gestiona a través de ventanas modales.',
  index798: 'Utilice el menú de navegación para acceder a Iniciar sesión, Registrarse o Perfil.',
  index835: '🔧 Generador de manuales de depuración',
  index861: 'Proyecto',
  index917: '⚠️ Pestaña desconocida: {id}',
  index918: 'Esta ID de pestaña no está definida en la función loadTab.',
  index919: 'Pestañas disponibles: t2, t3, t5, proteger1, iniciar sesión, registrarse, perfil, olvidé',
  index921: '¡Comprueba tu función loadTab!',
  index1415: 'Cerrar todas las pestañas',
  index1621: 'abrirAplicacionesModalEnPanel',
  index1636: 'abrirAplicacionesModal',
  index1639: 'abrirAplicacionesModal',

  // resources/js/pages/Index.tsx
  index1759: '¿Borrar el diseño guardado y restablecer al valor predeterminado?',

  // resources/js\pages\Index.tsx
  index1771: '¡El diseño fue copiado al portapapeles!',
  index1784: '¡El diseño fue copiado al portapapeles!',
  index1788: 'Consulte la consola para realizar la copia manual.',
  index1851: 'APORTE',
  index1856: '¡Se rechaza la eliminación de esta pestaña!',
  index1928: 'Scoriet - Generador de código empresarial',
  index2009: 'Cargando...',
  index2020: 'Cargando...',
  index2058: 'Registro exitoso',
  index2070: 'Cargando...',

  // resources/js/pages/LandingPage.tsx
  statusLink: 'Estado',

  // resources/js\pages\LandingPage.tsx
  landingpage69: 'euros',
  landingpage110: 'Error al cargar datos del usuario:',

  // resources/js/pages/LandingPage.tsx
  sqlParserTitle: 'Analizador SQL',
  sqlParserDesc: 'Análisis inteligente de esquemas de base de datos MySQL con soporte para relaciones complejas y restricciones.',
  templateSystemTitle: 'Sistema de Plantillas',
  templateSystemDesc: 'Motor de plantillas potente con ejecución de JavaScript para generación dinámica de código.',
  multiLanguageTitle: 'Soporte Multi-Idioma',
  multiLanguageDesc: 'Genere código para PHP, JavaScript, TypeScript, Python y más con plantillas personalizables.',
  modernInterfaceTitle: 'Interfaz Moderna',
  modernInterfaceDesc: 'Interfaz MDI intuitiva basada en muelles con apilamiento de pestañas y paneles flotantes.',

  // resources/js\pages\LandingPage.tsx
  landingpage151: ' Para siempre',
  landingpage152: 'Perfecto para proyectos personales.',
  landingpage154: 'Hasta 3 proyectos',
  landingpage155: 'Plantillas básicas',
  landingpage156: 'Análisis de esquemas SQL',
  landingpage157: 'Apoyo comunitario',
  landingpage158: 'Financiado por publicidad',

  // resources/js/pages/LandingPage.tsx
  goStartFree: 'Empezar gratis',
  premiumLabel: 'Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage168: 'Ideal para desarrolladores profesionales',
  landingpage170: 'Proyectos ilimitados',
  landingpage171: 'Plantillas avanzadas',
  landingpage172: 'Creación de plantillas personalizadas',
  landingpage173: 'Soporte prioritario',
  landingpage174: 'Funciones avanzadas de SQL',
  landingpage175: 'Colaboración en equipo',

  // resources/js/pages/LandingPage.tsx
  goPremium: 'Ir Premium',

  // resources/js\pages\LandingPage.tsx
  landingpage182: 'Negocio',
  landingpage186: 'Ideal para equipos y agencias',
  landingpage188: 'Todas las funciones Premium',
  landingpage189: 'Herramientas de colaboración en equipo',
  landingpage190: 'Integración de la API de Google Translate',
  landingpage191: 'Análisis avanzado',
  landingpage192: 'Soporte prioritario con SLA',
  landingpage193: 'Opciones de marca personalizadas',
  landingpage195: 'Ir a negocios',

  // resources/js/pages/LandingPage.tsx
  patronLabel: 'Patrón',

  // resources/js\pages\LandingPage.tsx
  landingpage203: 'Apoya a la comunidad',
  landingpage205: 'Todas las funciones de Business',
  landingpage206: 'Acceso anticipado a las funciones',
  landingpage207: 'Desarrollo de influencia',
  landingpage208: 'Acceso a Discord de la comunidad',
  landingpage209: 'Importe personalizado (5-50€+)',

  // resources/js/pages/LandingPage.tsx
  becomePatron: 'Convertirse en Patrón',

  // resources/js\pages\LandingPage.tsx
  landingpage288: 'Scoriet - Generador de código empresarial',
  landingpage304: 'Pestaña de bienvenida',
  landingpage307: 'openHomeOnStart',
  landingpage311: 'Abra esta pestaña al iniciar la aplicación',

  // resources/js/pages/LandingPage.tsx
  landingpage316: 'Cierra esta pestaña para concentrarte en tus proyectos',

  // resources/js\pages\LandingPage.tsx
  landingpage336: 'BETA',

  // resources/js/pages/LandingPage.tsx
  login: 'Iniciar sesión',
  register: 'Registrarse',
  profile: 'Perfil',
  changePlan: 'Cambiar plan',
  logout: 'Cerrar sesión',
  gotoApp: 'Ir a la app',
  title: 'Generador de Código Enterprise',
  subtitle: 'Transforme sus esquemas de base de datos en código listo para producción con plantillas inteligentes. Reduzca el tiempo de desarrollo en un 80% con generación automatizada de código.',
  startFree: 'Empezar gratis',
  tryDemo: 'Probar demo',
  watchDemo: 'Ver demo',
  featuresTitle: 'Características potentes para desarrollo moderno',
  pricingTitle: 'Elija su plan',
  pricingSubtitle: 'Empiece gratis, actualice cuando esté listo para escalar',

  // resources/js\pages\LandingPage.tsx
  landingpage479: 'MÁS POPULAR',
  landingpage486: 'Patreon',
  landingpage514: 'Gratis',

  // resources/js/pages/LandingPage.tsx
  ctaTitle: '¿Listo para multiplicar por 10 su velocidad de desarrollo?',
  ctaSubtitle: 'Únase a miles de desarrolladores que ya están usando Scoriet para construir mejor software más rápido.',
  startFreeTrial: 'Iniciar prueba gratuita',
  tryDemoNow: 'Probar demo ahora',
  contactSales: 'Contactar ventas',
  welcomeBack: 'Usuario',

  // resources/js\pages\LandingPage.tsx
  landingpage573: 'Usuario',

  // resources/js/pages/LandingPage.tsx
  currentPlan: 'Plan {t.freeLabel}',
  freeLabel: 'Gratis',
  freeTier: 'Plan Gratuito',

  // resources/js\pages\LandingPage.tsx
  landingpage589: 'MÁS POPULAR',
  landingpage594: 'Costumbre',

  // resources/js/pages/LandingPage.tsx
  upgradeTo: 'Actualizar a',
  currentPlanButton: 'Plan Actual',
  landingpage629: 'La escoria',
  landingpage630: 'El futuro de la generación de código. Creado por desarrolladores, para desarrolladores.',
  productLabel: 'Producto',
  featuresLink: 'Características',
  pricingLink: 'Precios',
  templatesLink: 'Plantillas',
  examplesLink: 'Ejemplos',
  resourcesLabel: 'Recursos',
  documentationLink: 'Documentación',
  apiReferenceLink: 'Referencia API',
  tutorialsLink: 'Tutoriales',
  blogLink: 'Blog',
  supportLabel: 'Soporte',
  helpCenterLink: 'Centro de ayuda',

  // resources/js\pages\LandingPage.tsx
  landingpage664: 'imprimir',

  // resources/js/pages/LandingPage.tsx
  contactUsLink: 'Contáctenos',
  communityLink: 'Comunidad',
  allRightsReserved: '© 2025 Scoriet, todos los derechos reservados',

  // resources/js/pages/LandingPage.tsx
  privacyPolicy: 'Política de privacidad',
  termsOfService: 'Términos de servicio',

  // resources/js\pages\LandingPage.tsx
  landingpage716: 'Elige tu plan',
  landingpage726: 'Plan actual',
  landingpage727: 'Gratis',
  landingpage730: 'Plan gratuito',
  landingpage743: 'MÁS POPULAR',
  landingpage748: 'Costumbre',
  landingpage764: 'Plan actual',
  landingpage765: 'Gratis',
  landingpage767: 'Gratis',
  landingpage769: 'Gratis',
  landingpage782: 'Puedes cambiar o cancelar tu plan en cualquier momento. Todos los planes incluyen una garantía de reembolso de 30 días.',
  landingpage801: 'Registro exitoso',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse70: 'Invitación no válida o vencida',
  projectinvitationresponse77: 'No se pudo cargar la invitación',
  projectinvitationresponse133: 'Por favor, rellene todos los campos obligatorios',
  projectinvitationresponse138: 'Las contraseñas no coinciden',
  projectinvitationresponse161: '¡Registro exitoso! Por favor, revise su correo electrónico para verificar su cuenta.',
  projectinvitationresponse167: 'El registro falló',
  projectinvitationresponse170: 'Error durante el registro',
  projectinvitationresponse181: 'Cargando invitación...',
  projectinvitationresponse192: '🚀 La escoria',
  projectinvitationresponse193: 'Generador de código empresarial',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse223: 'Te han invitado a unirte a un proyecto, pero primero necesitas crear una cuenta',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse233: 'Rechazar',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse235: 'Te han invitado a unirte a un proyecto en Scoriet',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse256: 'Invitado por:',
  projectinvitationresponse266: 'Role:',
  projectinvitationresponse273: 'Propietario del proyecto:',
  projectinvitationresponse283: 'Caduca:',
  projectinvitationresponse292: 'Mensaje personal:',
  projectinvitationresponse307: '🚀 Crea una cuenta y únete al proyecto',
  projectinvitationresponse334: '✅ Aceptar invitación',
  projectinvitationresponse348: '❌ Rechazar invitación',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse355: 'Puedes rechazar esta invitación si no estás interesado en unirte a este proyecto.',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse373: '¡Bienvenido al equipo!',
  projectinvitationresponse374: 'Invitación rechazada',
  projectinvitationresponse379: 'Ahora puedes acceder al proyecto y comenzar a colaborar con tu equipo.',
  projectinvitationresponse380: 'El propietario del proyecto ha sido notificado de su decisión.',
  projectinvitationresponse386: 'Ir a la aplicación Scoriet',
  projectinvitationresponse399: 'Este es un mensaje automatizado de Scoriet - Generador de código empresarial',
  projectinvitationresponse407: 'Crea tu cuenta Scoriet',
  projectinvitationresponse417: 'Nombre completo *',
  projectinvitationresponse428: 'Nombre de usuario *',

  // resources/js/pages/ProjectInvitationResponse.tsx
  projectinvitationresponse433: 'JohnDoe',

  // resources/js\pages\ProjectInvitationResponse.tsx
  projectinvitationresponse436: 'Sólo letras minúsculas, números, guiones y guiones bajos',
  projectinvitationresponse440: 'Dirección de correo electrónico *',
  projectinvitationresponse449: 'Prellenado a partir de la invitación',
  projectinvitationresponse453: 'Contraseña *',
  projectinvitationresponse458: 'Ingrese su contraseña',
  projectinvitationresponse466: 'Confirmar Contraseña *',
  projectinvitationresponse471: 'Confirma tu contraseña',
  projectinvitationresponse480: 'Cancelar',
  projectinvitationresponse487: 'Crear una cuenta',

  // resources/views\admin\pages\create.blade.php
  createblade60: 'Introduzca aquí el contenido de su página. Se admite HTML.',

  // resources/views\emails\project-invitation.blade.php
  projectinvitationblade116: 'Si tienes alguna pregunta',
  projectinvitationblade151: 'Rechazar',

  // resources/views\layouts\static.blade.php
  staticblade37: 'Ayuda',

  // resources/views\pages\help.blade.php
  helpblade3: 'Ayuda',
  helpblade8: 'Centro de ayuda',
  helpblade13: 'Bienvenido al Centro de ayuda de Scoriet',
  helpblade16: 'Empezando',
  helpblade18: 'Descubra cómo empezar a utilizar Scoriet',
  helpblade21: 'Crea tu primer proyecto',
  helpblade24: 'Paso 1',
  helpblade25: 'Paso 2',
  helpblade26: 'Paso 3',
  helpblade27: 'Paso 4',
  helpblade31: 'Características',
  helpblade34: 'Característica 1',
  helpblade35: 'Característica 2',
  helpblade36: 'Característica 3',
  helpblade37: 'Característica 4',
  helpblade41: 'Apoyo',
  helpblade43: 'Contacte con nuestro equipo de soporte',

  // resources/views\pages\impressum.blade.php
  impressumblade3: 'imprimir',
  impressumblade8: 'imprimir',
  impressumblade14: 'Información según el \' 5 TMG',
  impressumblade17: 'Nombre de empresa',
  impressumblade18: 'DIRECCIÓN',
  impressumblade22: 'Información del contacto',
  impressumblade25: 'Director general',
  impressumblade28: 'Registro Mercantil',
  impressumblade31: 'N.º de identificación del IVA.',

  // routes\api.php
  api36: 'No se encontró ninguna versión del esquema',
  api47: 'Se creó una tabla de prueba con ID:',
  api85: 'Este token de restablecimiento de contraseña no es válido.',
  api126: 'No se pudo obtener la información de precios',
  api180: 'Esto muestra cómo se debe procesar correctamente la plantilla.',
  api181: 'El bucle no se cerró correctamente y las variables no se reemplazaron',
  api183: 'Loop procesa correctamente todos los elementos',
  api184: 'Las variables se reemplazan correctamente',
  api185: 'La sintaxis es limpia y válida en PHP.',
  api194: 'Motor de plantillas simple - SIN REGEX',
  api197: 'No hay construcciones anidadas en una línea',
  api198: 'Los bucles se cierran limpiamente',
  api199: 'Sin expresiones regulares: solo operaciones de cadena simples',
  api202: 'Procesamiento línea por línea',
  api203: 'Reemplazo de variable simple',
  api204: 'Código mantenible sin expresiones regulares',
  api205: 'Escape seguro de JavaScript',
  api300: 'Los equipos de depuración de puntos finales funcionan',
  api416: 'La ruta de prueba funciona',
  api427: 'Todos los proyectos en la base de datos',
  api452: 'Versión del esquema no encontrada',
  api509: 'Error de depuración:',
  api528: 'No se encontraron restricciones',
  api745: 'No se encontró ninguna versión para este esquema',
  api761: 'Cargando tablas para schema_version_id: {$schemaVersion->id} (version_number: {$schemaVersion->version_number})',
  api765: 'Primera tabla: {$firstTable->table_name}',
  api771: 'La primera restricción tiene {$testColumns} columnas en la base de datos',
  api777: 'No se encontraron tablas en este esquema',
  api803: '-- Exportación de base de datos MySQL',
  api804: '-- Esquema:',
  api805: '-- Versión: ',
  api806: 'Y-m-d H:i:s',
  api810: '--ADVERTENCIA: ¡Se detectaron problemas de integridad de datos!',
  api812: '-- Estas restricciones se omitirán en la exportación.',
  api813: '-- Considere volver a analizar esta versión del esquema o comunicarse con el soporte técnico',
  api823: '-- Estructura de tabla para la tabla `',
  api860: 'Procesando el ID de restricción {$constraint->id} para la tabla {$table->table_name}',
  api869: 'Se encontraron {$constraintColumns->count()} columnas para la restricción {$constraint->id}',
  api872: 'Omitiendo la restricción {$constraint->id} - no se encontraron columnas',
  api913: '-- Exportación completada exitosamente',
  api914: '--Total de tablas exportadas:',
  api915: '-- Restricciones totales exportadas:',
  api939: 'Exportación fallida:',
  api954: 'No se encontraron restricciones',
  api998: 'No se encontró ninguna versión para este esquema',
  api1026: 'No se encontraron tablas en este esquema',
  api1050: '-- Exportación de base de datos MySQL',
  api1051: '-- Esquema:',
  api1052: '-- Versión: ',
  api1053: 'Y-m-d H:i:s',
  api1059: '-- Estructura de tabla para la tabla `',
  api1142: '-- Exportación completada exitosamente',
  api1143: '--Total de tablas exportadas:',
  api1161: 'Exportación fallida:',
  api1276: 'gtree[] global para el almacenamiento en caché del lado del cliente',
  api1285: 'Se produjo una excepción',
  api1300: 'Búsqueda de código de unión de depuración',
  api1330: 'Plantilla no encontrada',
  api1358: 'Se produjo una excepción',
  api1379: 'Plantilla no encontrada',
  api1386: 'Procesamiento de plantillas con filtro de proyecto: {$projectId}',
  api1388: 'Procesamiento de plantillas sin filtro de proyecto (modo de demostración)',
  api1393: 'Procesamiento de plantillas con filtro de tabla: {$tableName}',
  api1431: 'Cargando esquemas para el proyecto: {$project->name}',
  api1438: 'Se encontraron {$linkedSchemas->count()} esquemas vinculados para el proyecto {$projectId}',
  api1454: '(versión {$latestVersion->id})',
  api1458: 'Total de tablas vinculadas al proyecto: {$schemaTables->count()}',
  api1465: 'El proyecto {$projectId} no tiene esquemas vinculados: esto es normal si no hay bases de datos conectadas al proyecto',
  api1469: 'para el proyecto {$projectId} porque se especificó table_name',
  api1498: 'Se creó una tabla ficticia con {$dummyFields->count()} campos',
  api1502: 'No hay ningún proyecto especificado',
  api1532: 'Base de datos del proyecto de demostración',
  api1676: '🔍 Comprobando anulación de archivo',
  api1682: 'como específico de la tabla debido al parámetro table_name: {$tableName}',
  api1684: '❌ Anulación NO activada para',
  api1707: 'Tabla no encontrada',
  api1760: ': índice_de_tabla={$índice_de_tabla}',
  api1809: 'Todos los archivos en una respuesta JSON',
  api1810: 'No se necesitan múltiples solicitudes HTTP',
  api1814: 'Recibir gtree[] completo + todos los archivos generados en una sola solicitud',
  api1815: 'Almacene gtree[] en el navegador para uso futuro',
  api1816: 'Procesar archivos generados (descargar/mostrar)',
  api1817: 'Opcional: crear ZIP a partir de la matriz generated_files',
  api1824: 'Se produjo una excepción',

  // routes\gtree-ultimate.php
  gtreeultimate26: 'Plantilla no encontrada',
  gtreeultimate85: 'Y-m-d H:i:s',
  gtreeultimate86: 'Año-mes-día',
  gtreeultimate90: 'Y-m-d H:i:s',
  gtreeultimate91: 'Usuario de demostración',
  gtreeultimate95: 'Usuario',
  gtreeultimate105: 'Proyecto de puntuación de demostración',
  gtreeultimate120: 'Base de datos del proyecto de demostración',
  gtreeultimate149: 'Y-m-d H:i:s',
  gtreeultimate160: 'Año-mes-día',
  gtreeultimate161: 'Su',
  gtreeultimate163: 'Y-m-d H:i:s',
  gtreeultimate409: 'Se produjo una excepción en Ultimate Template Engine',

  // routes\web.php
  web50: '¡Modo demo activado! Los datos se reinician cada 20 minutos.',
};
