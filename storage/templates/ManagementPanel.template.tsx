{:code:}
// ============================================================
// SCORIET MANAGEMENT PANEL TEMPLATE
// Generates a complete CRUD management panel for any table
// Template file name: %10ManagementPanel.tsx
// Output path: resources/js/Components/Panels/
// Generation type: db_table_file
// ============================================================

var table = gtree[0].project[0].tables[tableIdx];
var fields = table.fields || [];
var nFields = table.nmaxitems || 0;
var pkField = table.primarykey || (fields[0] ? fields[0].name : 'id');
var tableName = table.filename || table.tablename || '';
var nForeignKeys = table.nmaxforeignkeys || 0;
var selLangIdx = gtree[0].project[0].selectedlanguageindex || 0;

// ---- Naming Helpers ----
function toPascalCase(s) {
    return s.split('_').map(function(p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join('');
}
function toCamelCase(s) {
    var parts = s.split('_');
    return parts[0] + parts.slice(1).map(function(p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join('');
}
function toSingular(s) {
    if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
    if (s.endsWith('ses') || s.endsWith('xes') || s.endsWith('zes') || s.endsWith('shes') || s.endsWith('ches')) return s.slice(0, -2);
    if (s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('us') && !s.endsWith('is')) return s.slice(0, -1);
    return s;
}
function fieldLabel(f) {
    if (f.lang && f.lang[selLangIdx] && f.lang[selLangIdx].caption) return f.lang[selLangIdx].caption;
    if (f.caption) return f.caption;
    return f.name.split('_').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}
function tsType(f) {
    if (f.phptype === 'int' || f.phptype === 'float') return 'number';
    if (f.phptype === 'bool') return 'boolean';
    return 'string';
}
function defaultVal(f) {
    if (f.phptype === 'bool') return 'false';
    if (f.phptype === 'int' || f.phptype === 'float') return '0';
    var ft = (f.type || '').toUpperCase();
    if (ft.indexOf('DATETIME') >= 0 || ft.indexOf('TIMESTAMP') >= 0) return "new Date().toISOString().slice(0, 16)";
    if (ft.indexOf('DATE') >= 0) return "new Date().toISOString().slice(0, 10)";
    return "''";
}

var sing = toSingular(tableName);
var PascalSing = toPascalCase(sing);
var camelSing = toCamelCase(sing);
var PascalPlural = toPascalCase(tableName);
var camelPlural = toCamelCase(tableName);

// ---- Collect field groups ----
var nonPkFields = [];
for (var fi = 0; fi < nFields; fi++) {
    if (fields[fi].name !== pkField && !fields[fi].istimestamp) nonPkFields.push(fields[fi]);
}

var fkFields = [];
for (var fi = 0; fi < nFields; fi++) {
    if (fields[fi].isforeign && fields[fi].linktable) fkFields.push(fields[fi]);
}

// Unique FK tables for state/fetch
var fkTables = {};
for (var fi = 0; fi < fkFields.length; fi++) {
    var fk = fkFields[fi];
    if (!fkTables[fk.linktable]) {
        fkTables[fk.linktable] = {
            table: fk.linktable,
            linkfield: fk.linkfield || fk.name,
            displayfield: fk.linkdisplayfield || fk.linkfield || fk.name,
            pascalCase: toPascalCase(fk.linktable),
            camelCase: toCamelCase(fk.linktable)
        };
    }
}

// ============================================================
// IMPORTS
// ============================================================
sContentResult += "import React, { useState, useEffect } from 'react';\n";
sContentResult += "import { useForm, Controller } from 'react-hook-form';\n";
sContentResult += "import { useToast } from '@/contexts/ToastContext';\n";
sContentResult += "import { useTheme } from '@/contexts/ThemeContext';\n";
sContentResult += "import { Button } from 'primereact/button';\n";
sContentResult += "import { Tag } from 'primereact/tag';\n";
sContentResult += "import { DataTable } from 'primereact/datatable';\n";
sContentResult += "import { Column } from 'primereact/column';\n";
sContentResult += "import { confirmDialog } from 'primereact/confirmdialog';\n";
sContentResult += "import { ConfirmDialog } from 'primereact/confirmdialog';\n";
sContentResult += "import { Dialog } from 'primereact/dialog';\n";
sContentResult += "import { InputText } from 'primereact/inputtext';\n";
sContentResult += "import { InputTextarea } from 'primereact/inputtextarea';\n";
sContentResult += "import { InputNumber } from 'primereact/inputnumber';\n";
sContentResult += "import { Checkbox } from 'primereact/checkbox';\n";
sContentResult += "import { Dropdown } from 'primereact/dropdown';\n";
sContentResult += "import { api } from '@/lib/api';\n";
sContentResult += "import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';\n";
sContentResult += "\n";

// ============================================================
// INTERFACES
// ============================================================
sContentResult += "interface " + PascalSing + " {\n";
for (var fi = 0; fi < nFields; fi++) {
    sContentResult += "  " + fields[fi].name + ": " + tsType(fields[fi]) + ";\n";
}
for (var fkTable in fkTables) {
    sContentResult += "  " + fkTables[fkTable].camelCase + "?: any;\n";
}
sContentResult += "}\n\n";

sContentResult += "interface " + PascalSing + "FormData {\n";
for (var fi = 0; fi < nonPkFields.length; fi++) {
    sContentResult += "  " + nonPkFields[fi].name + ": " + tsType(nonPkFields[fi]) + ";\n";
}
sContentResult += "}\n\n";

// ============================================================
// COMPONENT START
// ============================================================
sContentResult += "export default function " + PascalSing + "ManagementPanel() {\n";
sContentResult += "  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());\n";
sContentResult += "  const { t } = useTranslation(currentLanguage);\n";
sContentResult += "  const toast = useToast();\n";
sContentResult += "  const { colors } = useTheme();\n";
sContentResult += "  const [" + camelPlural + ", set" + PascalPlural + "] = useState<" + PascalSing + "[]>([]);\n";

// FK state
for (var fkTable in fkTables) {
    var fki = fkTables[fkTable];
    sContentResult += "  const [" + fki.camelCase + "Options, set" + fki.pascalCase + "Options] = useState<any[]>([]);\n";
}

sContentResult += "  const [loading, setLoading] = useState(false);\n";
sContentResult += "  const [modalVisible, setModalVisible] = useState(false);\n";
sContentResult += "  const [viewModalVisible, setViewModalVisible] = useState(false);\n";
sContentResult += "  const [editing, setEditing] = useState<" + PascalSing + " | null>(null);\n";
sContentResult += "  const [viewing, setViewing] = useState<" + PascalSing + " | null>(null);\n";
sContentResult += "\n";

// Default values
sContentResult += "  const defaultValues: " + PascalSing + "FormData = {\n";
for (var fi = 0; fi < nonPkFields.length; fi++) {
    sContentResult += "    " + nonPkFields[fi].name + ": " + defaultVal(nonPkFields[fi]) + ",\n";
}
sContentResult += "  };\n\n";

sContentResult += "  const { control, handleSubmit, " + "reset, formState: { errors } } = useForm<" + PascalSing + "FormData>({ defaultValues });\n\n";

// ============================================================
// FETCH FUNCTIONS
// ============================================================
sContentResult += "  const fetchData = async () => {\n";
sContentResult += "    setLoading(true);\n";
sContentResult += "    try {\n";
sContentResult += "      const data = await api.get('/" + tableName + "');\n";
sContentResult += "      set" + PascalPlural + "(data);\n";
sContentResult += "    } catch (error: any) {\n";
sContentResult += "      toast.showError('Failed to load data: ' + (error.message || error));\n";
sContentResult += "    } finally {\n";
sContentResult += "      setLoading(false);\n";
sContentResult += "    }\n";
sContentResult += "  };\n\n";

for (var fkTable in fkTables) {
    var fki = fkTables[fkTable];
    sContentResult += "  const fetch" + fki.pascalCase + " = async () => {\n";
    sContentResult += "    try {\n";
    sContentResult += "      const data = await api.get('/" + fki.table + "');\n";
    sContentResult += "      set" + fki.pascalCase + "Options(data);\n";
    sContentResult += "    } catch (error: any) {\n";
    sContentResult += "      toast.showError('Failed to load " + fki.table + ": ' + (error.message || error));\n";
    sContentResult += "    }\n";
    sContentResult += "  };\n\n";
}

sContentResult += "  useEffect(() => {\n";
sContentResult += "    fetchData();\n";
for (var fkTable in fkTables) {
    sContentResult += "    fetch" + fkTables[fkTable].pascalCase + "();\n";
}
sContentResult += "  }, []);\n\n";

// ============================================================
// CRUD HANDLERS
// ============================================================
sContentResult += "  const handleCreate = () => {\n";
sContentResult += "    setEditing(null);\n";
sContentResult += "    " + "reset(defaultValues);\n";
sContentResult += "    setModalVisible(true);\n";
sContentResult += "  };\n\n";

sContentResult += "  const handleEdit = (record: " + PascalSing + ") => {\n";
sContentResult += "    setEditing(record);\n";
sContentResult += "    " + "reset({\n";
for (var fi = 0; fi < nonPkFields.length; fi++) {
    var f = nonPkFields[fi];
    var ft = (f.type || '').toUpperCase();
    if (ft.indexOf('DATETIME') >= 0 || ft.indexOf('TIMESTAMP') >= 0) {
        sContentResult += "      " + f.name + ": record." + f.name + " ? record." + f.name + ".slice(0, 16) : '',\n";
    } else if (ft.indexOf('DATE') >= 0) {
        sContentResult += "      " + f.name + ": record." + f.name + " ? record." + f.name + ".slice(0, 10) : '',\n";
    } else {
        sContentResult += "      " + f.name + ": record." + f.name + ",\n";
    }
}
sContentResult += "    });\n";
sContentResult += "    setModalVisible(true);\n";
sContentResult += "  };\n\n";

sContentResult += "  const handleView = (record: " + PascalSing + ") => {\n";
sContentResult += "    setViewing(record);\n";
sContentResult += "    setViewModalVisible(true);\n";
sContentResult += "  };\n\n";

sContentResult += "  const confirmDelete = (record: " + PascalSing + ") => {\n";
sContentResult += "    confirmDialog({\n";
sContentResult += "      group: '" + tableName + "-management',\n";
sContentResult += "      message: 'Are you sure you want to delete this record?',\n";
sContentResult += "      header: 'Confirm Deletion',\n";
sContentResult += "      icon: 'pi pi-exclamation-triangle',\n";
sContentResult += "      accept: () => handleDelete(record),\n";
sContentResult += "      acceptLabel: 'Delete',\n";
sContentResult += "      rejectLabel: 'Cancel',\n";
sContentResult += "      acceptClassName: 'p-button-danger'\n";
sContentResult += "    });\n";
sContentResult += "  };\n\n";

sContentResult += "  const handleDelete = async (record: " + PascalSing + ") => {\n";
sContentResult += "    try {\n";
sContentResult += "      await api.delete('/" + tableName + "/' + record." + pkField + ");\n";
sContentResult += "      toast.showSuccess('Record deleted successfully.');\n";
sContentResult += "      fetchData();\n";
sContentResult += "    } catch (error: any) {\n";
sContentResult += "      toast.showError('Failed to delete: ' + (error.message || error));\n";
sContentResult += "    }\n";
sContentResult += "  };\n\n";

sContentResult += "  const onSubmit = async (values: " + PascalSing + "FormData) => {\n";
sContentResult += "    try {\n";
sContentResult += "      if (editing) {\n";
sContentResult += "        await api.put('/" + tableName + "/' + editing." + pkField + ", values);\n";
sContentResult += "        toast.showSuccess('Record updated successfully.');\n";
sContentResult += "      } else {\n";
sContentResult += "        await api.post('/" + tableName + "', values);\n";
sContentResult += "        toast.showSuccess('Record created successfully.');\n";
sContentResult += "      }\n";
sContentResult += "      setModalVisible(false);\n";
sContentResult += "      await fetchData();\n";
sContentResult += "    } catch (error: any) {\n";
sContentResult += "      toast.showError('Failed to save: ' + (error.message || error));\n";
sContentResult += "    }\n";
sContentResult += "  };\n\n";

// ============================================================
// PRINT HANDLER
// ============================================================
sContentResult += "  const handlePrint = async (record: " + PascalSing + ") => {\n";
sContentResult += "    try {\n";
sContentResult += "      const data = await api.get('/" + tableName + "/' + record." + pkField + ");\n";
sContentResult += "      const printWindow = window.open('', '_blank', 'width=800,height=600');\n";
sContentResult += "      if (printWindow) {\n";
sContentResult += "        printWindow.document.write('<html><head><title>' + data." + (nonPkFields.length > 0 ? nonPkFields[0].name : pkField) + " + '</title>');\n";
sContentResult += "        printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{border-bottom:2px solid #333;padding-bottom:10px}.field{margin:12px 0}.label{font-weight:bold;color:#555;min-width:160px;display:inline-block}</style></head><body>');\n";
sContentResult += "        printWindow.document.write('<h1>' + data." + (nonPkFields.length > 0 ? nonPkFields[0].name : pkField) + " + '</h1>');\n";

for (var fi = 0; fi < nFields; fi++) {
    var f = fields[fi];
    if (f.istimestamp) continue;
    var lbl = fieldLabel(f);
    if (f.phptype === 'bool') {
        sContentResult += "        printWindow.document.write('<div class=\"field\"><span class=\"label\">" + lbl + ":</span> ' + (data." + f.name + " ? 'Yes' : 'No') + '</div>');\n";
    } else if ((f.type || '').toUpperCase().indexOf('DATE') >= 0) {
        var isDt = (f.type || '').toUpperCase().indexOf('TIME') >= 0;
        if (isDt) {
            sContentResult += "        printWindow.document.write('<div class=\"field\"><span class=\"label\">" + lbl + ":</span> ' + (data." + f.name + " ? new Date(data." + f.name + ").toLocaleString() : '-') + '</div>');\n";
        } else {
            sContentResult += "        printWindow.document.write('<div class=\"field\"><span class=\"label\">" + lbl + ":</span> ' + (data." + f.name + " ? new Date(data." + f.name + ").toLocaleDateString() : '-') + '</div>');\n";
        }
    } else if (f.isforeign && fkTables[f.linktable]) {
        var fki2 = fkTables[f.linktable];
        sContentResult += "        printWindow.document.write('<div class=\"field\"><span class=\"label\">" + lbl + ":</span> ' + (data." + fki2.camelCase + "?." + fki2.displayfield + " || data." + f.name + " || '-') + '</div>');\n";
    } else {
        sContentResult += "        printWindow.document.write('<div class=\"field\"><span class=\"label\">" + lbl + ":</span> ' + (data." + f.name + " || '-') + '</div>');\n";
    }
}

sContentResult += "        printWindow.document.write('<script>window.print();<\\/script></body></html>');\n";
sContentResult += "        printWindow.document.close();\n";
sContentResult += "      }\n";
sContentResult += "    } catch (error: any) {\n";
sContentResult += "      toast.showError('Failed to load data: ' + (error.message || error));\n";
sContentResult += "    }\n";
sContentResult += "  };\n\n";

// ============================================================
// COLUMN BODY TEMPLATES
// ============================================================
sContentResult += "  const actionsBodyTemplate = (rowData: " + PascalSing + ") => (\n";
sContentResult += "    <div className=\"flex gap-1\">\n";
sContentResult += "      <Button icon=\"pi pi-eye\" rounded text size=\"small\" severity=\"info\" onClick={() => handleView(rowData)} tooltip=\"View\" tooltipOptions={{ position: 'top' }} />\n";
sContentResult += "      <Button icon=\"pi pi-pencil\" rounded text size=\"small\" severity=\"warning\" onClick={() => handleEdit(rowData)} tooltip=\"Edit\" tooltipOptions={{ position: 'top' }} />\n";
sContentResult += "      <Button icon=\"pi pi-print\" rounded text size=\"small\" severity=\"help\" onClick={() => handlePrint(rowData)} tooltip=\"Print\" tooltipOptions={{ position: 'top' }} />\n";
sContentResult += "      <Button icon=\"pi pi-trash\" rounded text size=\"small\" severity=\"danger\" onClick={() => confirmDelete(rowData)} tooltip=\"Delete\" tooltipOptions={{ position: 'top' }} />\n";
sContentResult += "    </div>\n";
sContentResult += "  );\n\n";

// Boolean column templates
for (var fi = 0; fi < nFields; fi++) {
    if (fields[fi].phptype === 'bool' && fields[fi].name !== pkField) {
        var bf = fields[fi];
        sContentResult += "  const " + toCamelCase(bf.name) + "Body = (rowData: " + PascalSing + ") => (\n";
        sContentResult += "    <Tag value={rowData." + bf.name + " ? 'Yes' : 'No'} severity={rowData." + bf.name + " ? 'success' : 'danger'} />\n";
        sContentResult += "  );\n\n";
    }
}

// FK column templates
for (var fi = 0; fi < fkFields.length; fi++) {
    var fk = fkFields[fi];
    var fki3 = fkTables[fk.linktable];
    sContentResult += "  const " + toCamelCase(fk.name) + "Body = (rowData: " + PascalSing + ") => (\n";
    sContentResult += "    <span>{rowData." + fki3.camelCase + "?." + fki3.displayfield + " || '-'}</span>\n";
    sContentResult += "  );\n\n";
}

// Date column templates
for (var fi = 0; fi < nFields; fi++) {
    var f = fields[fi];
    var ft = (f.type || '').toUpperCase();
    if ((ft.indexOf('DATE') >= 0 || ft.indexOf('TIMESTAMP') >= 0) && f.name !== pkField && !f.istimestamp) {
        var isDt = ft.indexOf('TIME') >= 0;
        sContentResult += "  const " + toCamelCase(f.name) + "Body = (rowData: " + PascalSing + ") => (\n";
        if (isDt) {
            sContentResult += "    <span>{rowData." + f.name + " ? new Date(rowData." + f.name + ").toLocaleString() : '-'}</span>\n";
        } else {
            sContentResult += "    <span>{rowData." + f.name + " ? new Date(rowData." + f.name + ").toLocaleDateString() : '-'}</span>\n";
        }
        sContentResult += "  );\n\n";
    }
}

// ============================================================
// JSX RETURN
// ============================================================
sContentResult += "  return (\n";
sContentResult += "    <div className=\"h-full flex flex-col\" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>\n";
sContentResult += "      <ConfirmDialog group=\"" + tableName + "-management\" />\n\n";

// ---- Header ----
sContentResult += "      {/* Header */}\n";
sContentResult += "      <div className=\"flex-shrink-0 p-4\" style={{ borderBottom: '1px solid ' + colors.borderPrimary, backgroundColor: colors.bgPrimary }}>\n";
sContentResult += "        <div className=\"flex justify-between items-center\">\n";
sContentResult += "          <div>\n";
sContentResult += "            <h3 className=\"text-lg font-semibold\" style={{ color: colors.textPrimary }}>\n";
sContentResult += "              " + PascalSing + " Management\n";
sContentResult += "            </h3>\n";
sContentResult += "            <p className=\"text-sm\" style={{ color: colors.textSecondary }}>\n";
sContentResult += "              Manage your " + tableName.split('_').join(' ') + "\n";
sContentResult += "            </p>\n";
sContentResult += "          </div>\n";
sContentResult += "          <Button icon=\"pi pi-plus\" label=\"+ Add record\" size=\"small\" severity=\"info\" onClick={handleCreate} />\n";
sContentResult += "        </div>\n";
sContentResult += "      </div>\n\n";

// ---- DataTable ----
sContentResult += "      {/* DataTable */}\n";
sContentResult += "      <div className=\"flex-1 p-4 overflow-auto\" style={{ backgroundColor: colors.bgPrimary }}>\n";
sContentResult += "        <div className=\"rounded-lg shadow-sm overflow-hidden\" style={{ backgroundColor: colors.bgSecondary }}>\n";
sContentResult += "          <DataTable\n";
sContentResult += "            value={" + camelPlural + "}\n";
sContentResult += "            dataKey=\"" + pkField + "\"\n";
sContentResult += "            loading={loading}\n";
sContentResult += "            paginator\n";
sContentResult += "            rows={20}\n";
sContentResult += "            rowsPerPageOptions={[10, 20, 50]}\n";
sContentResult += "            currentPageReportTemplate=\"{first}-{last} of {totalRecords}\"\n";
sContentResult += "            size=\"small\"\n";
sContentResult += "            stripedRows\n";
sContentResult += "            showGridlines\n";
sContentResult += "            scrollable\n";
sContentResult += "            scrollHeight=\"calc(100vh - 300px)\"\n";
sContentResult += "            emptyMessage=\"No records found.\"\n";
sContentResult += "          >\n";

// Dynamic columns
for (var fi = 0; fi < nFields; fi++) {
    var f = fields[fi];
    if (f.istimestamp) continue;
    var lbl = fieldLabel(f);

    if (f.name === pkField) {
        sContentResult += "            <Column field=\"" + f.name + "\" header=\"" + lbl + "\" body={(rowData: any) => <Tag value={String(rowData." + f.name + ")} severity=\"info\" />} sortable style={{ width: '100px' }} />\n";
    } else if (f.phptype === 'bool') {
        sContentResult += "            <Column field=\"" + f.name + "\" header=\"" + lbl + "\" body={" + toCamelCase(f.name) + "Body} sortable style={{ width: '120px' }} />\n";
    } else if (f.isforeign && fkTables[f.linktable]) {
        sContentResult += "            <Column field=\"" + f.name + "\" header=\"" + lbl + "\" body={" + toCamelCase(f.name) + "Body} sortable style={{ width: '150px' }} />\n";
    } else if ((f.type || '').toUpperCase().indexOf('TEXT') >= 0) {
        sContentResult += "            <Column field=\"" + f.name + "\" header=\"" + lbl + "\" body={(rowData: any) => { const v = rowData." + f.name + " || '-'; return v.length > 60 ? v.substring(0, 60) + '...' : v; }} />\n";
    } else if ((f.type || '').toUpperCase().indexOf('DATE') >= 0 || (f.type || '').toUpperCase().indexOf('TIMESTAMP') >= 0) {
        sContentResult += "            <Column field=\"" + f.name + "\" header=\"" + lbl + "\" body={" + toCamelCase(f.name) + "Body} sortable style={{ width: '160px' }} />\n";
    } else {
        sContentResult += "            <Column field=\"" + f.name + "\" header=\"" + lbl + "\" sortable />\n";
    }
}

sContentResult += "            <Column header=\"Actions\" body={actionsBodyTemplate} style={{ width: '200px' }} />\n";
sContentResult += "          </DataTable>\n";
sContentResult += "        </div>\n";
sContentResult += "      </div>\n\n";

// ============================================================
// EDIT/CREATE DIALOG
// ============================================================
sContentResult += "      {/* Add/Edit Dialog */}\n";
sContentResult += "      <Dialog\n";
sContentResult += "        header={editing ? 'Edit record' : 'Add new record'}\n";
sContentResult += "        visible={modalVisible}\n";
sContentResult += "        onHide={() => setModalVisible(false)}\n";
sContentResult += "        style={{ width: '600px' }}\n";
sContentResult += "        modal closable draggable\n";
sContentResult += "        className=\"themed-dialog\"\n";
sContentResult += "        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}\n";
sContentResult += "        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}\n";
sContentResult += "        footer={\n";
sContentResult += "          <div className=\"flex justify-end gap-2\">\n";
sContentResult += "            <Button type=\"button\" label=\"Cancel\" icon=\"pi pi-times\" severity=\"info\" outlined onClick={() => setModalVisible(false)} />\n";
sContentResult += "            <Button type=\"button\" label={editing ? 'Save Changes' : 'Create'} icon=\"pi pi-check\" severity=\"success\" onClick={handleSubmit(onSubmit)} />\n";
sContentResult += "          </div>\n";
sContentResult += "        }\n";
sContentResult += "      >\n";
sContentResult += "        <form onSubmit={handleSubmit(onSubmit)} className=\"space-y-4\">\n";

// Dynamic form fields
for (var fi = 0; fi < nonPkFields.length; fi++) {
    var f = nonPkFields[fi];
    var lbl = fieldLabel(f);
    var ft = (f.type || '').toUpperCase();

    sContentResult += "          <div>\n";
    sContentResult += "            <label htmlFor=\"" + f.name + "\" className=\"block text-sm font-medium mb-2\" style={{ color: colors.textPrimary }}>\n";
    sContentResult += "              " + lbl + "\n";
    sContentResult += "            </label>\n";

    if (f.phptype === 'bool') {
        sContentResult += "            <div className=\"flex items-center gap-2\">\n";
        sContentResult += "              <Controller name=\"" + f.name + "\" control={control}\n";
        sContentResult += "                render={({ field }) => <Checkbox inputId=\"" + f.name + "\" checked={field.value} onChange={(e) => field.onChange(e.checked)} />}\n";
        sContentResult += "              />\n";
        sContentResult += "              <label htmlFor=\"" + f.name + "\" className=\"text-sm cursor-pointer\" style={{ color: colors.textPrimary }}>" + lbl + "</label>\n";
        sContentResult += "            </div>\n";
    } else if (f.isforeign && fkTables[f.linktable]) {
        var fki4 = fkTables[f.linktable];
        sContentResult += "            <Controller name=\"" + f.name + "\" control={control}\n";
        sContentResult += "              rules={{ required: 'This field is required.' }}\n";
        sContentResult += "              render={({ field }) => (\n";
        sContentResult += "                <Dropdown id=\"" + f.name + "\" value={field.value} onChange={(e) => field.onChange(e.value)}\n";
        sContentResult += "                  options={" + fki4.camelCase + "Options} optionLabel=\"" + fki4.displayfield + "\" optionValue=\"" + fki4.linkfield + "\"\n";
        sContentResult += "                  placeholder=\"Select...\" filter className=\"w-full\" />\n";
        sContentResult += "              )}\n";
        sContentResult += "            />\n";
    } else if (f.phptype === 'int' || f.phptype === 'float') {
        sContentResult += "            <Controller name=\"" + f.name + "\" control={control}\n";
        sContentResult += "              rules={{ required: 'This field is required.' }}\n";
        sContentResult += "              render={({ field }) => (\n";
        sContentResult += "                <InputNumber id=\"" + f.name + "\" value={field.value} onValueChange={(e) => field.onChange(e.value)}\n";
        if (f.phptype === 'float') {
            sContentResult += "                  mode=\"decimal\" minFractionDigits={2}\n";
        }
        sContentResult += "                  useGrouping={false} className=\"w-full\" />\n";
        sContentResult += "              )}\n";
        sContentResult += "            />\n";
    } else if (ft.indexOf('TEXT') >= 0 || ft.indexOf('LONGTEXT') >= 0 || ft.indexOf('MEDIUMTEXT') >= 0) {
        sContentResult += "            <Controller name=\"" + f.name + "\" control={control}\n";
        sContentResult += "              render={({ field }) => <InputTextarea id=\"" + f.name + "\" {...field} rows={3} className=\"w-full\" />}\n";
        sContentResult += "            />\n";
    } else if (ft.indexOf('DATETIME') >= 0 || ft.indexOf('TIMESTAMP') >= 0) {
        sContentResult += "            <Controller name=\"" + f.name + "\" control={control}\n";
        if (f.notnull) {
            sContentResult += "              rules={{ required: 'This field is required.' }}\n";
        }
        sContentResult += "              render={({ field }) => <InputText id=\"" + f.name + "\" type=\"datetime-local\" {...field} className=\"w-full\" />}\n";
        sContentResult += "            />\n";
    } else if (ft.indexOf('DATE') >= 0) {
        sContentResult += "            <Controller name=\"" + f.name + "\" control={control}\n";
        if (f.notnull) {
            sContentResult += "              rules={{ required: 'This field is required.' }}\n";
        }
        sContentResult += "              render={({ field }) => <InputText id=\"" + f.name + "\" type=\"date\" {...field} className=\"w-full\" />}\n";
        sContentResult += "            />\n";
    } else {
        sContentResult += "            <Controller name=\"" + f.name + "\" control={control}\n";
        if (f.notnull) {
            var maxLen = f.length || 255;
            sContentResult += "              rules={{ required: 'This field is required.', maxLength: { value: " + maxLen + ", message: 'Maximum length exceeded.' } }}\n";
        }
        sContentResult += "              render={({ field }) => <InputText id=\"" + f.name + "\" {...field} className=\"w-full\" />}\n";
        sContentResult += "            />\n";
    }

    if (f.phptype !== 'bool') {
        sContentResult += "            {errors." + f.name + " && <small className=\"mt-1 block\" style={{ color: colors.errorText }}>{errors." + f.name + ".message}</small>}\n";
    }
    sContentResult += "          </div>\n";
}

sContentResult += "        </form>\n";
sContentResult += "      </Dialog>\n\n";

// ============================================================
// VIEW DIALOG
// ============================================================
sContentResult += "      {/* View Dialog */}\n";
sContentResult += "      <Dialog\n";
sContentResult += "        header=\"View record\"\n";
sContentResult += "        visible={viewModalVisible}\n";
sContentResult += "        onHide={() => setViewModalVisible(false)}\n";
sContentResult += "        style={{ width: '600px' }}\n";
sContentResult += "        modal closable draggable\n";
sContentResult += "        className=\"themed-dialog\"\n";
sContentResult += "        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}\n";
sContentResult += "        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}\n";
sContentResult += "      >\n";
sContentResult += "        {viewing && (\n";
sContentResult += "          <div className=\"space-y-3\">\n";

for (var fi = 0; fi < nFields; fi++) {
    var f = fields[fi];
    if (f.istimestamp) continue;
    var lbl = fieldLabel(f);

    sContentResult += "            <div>\n";
    sContentResult += "              <span className=\"text-sm font-medium block\" style={{ color: colors.textMuted }}>" + lbl + "</span>\n";

    if (f.phptype === 'bool') {
        sContentResult += "              <Tag value={viewing." + f.name + " ? 'Yes' : 'No'} severity={viewing." + f.name + " ? 'success' : 'danger'} />\n";
    } else if (f.isforeign && fkTables[f.linktable]) {
        var fki5 = fkTables[f.linktable];
        sContentResult += "              <span style={{ color: colors.textPrimary }}>{viewing." + fki5.camelCase + "?." + fki5.displayfield + " || viewing." + f.name + " || '-'}</span>\n";
    } else if ((f.type || '').toUpperCase().indexOf('DATE') >= 0) {
        var isDt = (f.type || '').toUpperCase().indexOf('TIME') >= 0;
        if (isDt) {
            sContentResult += "              <span style={{ color: colors.textPrimary }}>{viewing." + f.name + " ? new Date(viewing." + f.name + ").toLocaleString() : '-'}</span>\n";
        } else {
            sContentResult += "              <span style={{ color: colors.textPrimary }}>{viewing." + f.name + " ? new Date(viewing." + f.name + ").toLocaleDateString() : '-'}</span>\n";
        }
    } else if (f.name === pkField) {
        sContentResult += "              <Tag value={String(viewing." + f.name + ")} severity=\"info\" />\n";
    } else {
        sContentResult += "              <span style={{ color: colors.textPrimary }}>{viewing." + f.name + " != null ? String(viewing." + f.name + ") : '-'}</span>\n";
    }

    sContentResult += "            </div>\n";
}

sContentResult += "          </div>\n";
sContentResult += "        )}\n";
sContentResult += "      </Dialog>\n";

// Close component
sContentResult += "    </div>\n";
sContentResult += "  );\n";
sContentResult += "}\n";
{:codeend:}