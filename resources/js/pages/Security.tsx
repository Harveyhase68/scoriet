import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';

// WICHTIG: In deinem echten Code musst du das so importieren:
// import DockLayout from 'rc-dock';
// Hier simuliere ich es nur für die Demo

const RealRCDockImplementation = () => {
  // State für die Komponenten
  const [selectedTool, setSelectedTool] = useState('select');
  const [elementName, setElementName] = useState('Element 1');
  const [elementWidth, setElementWidth] = useState('100');
  const [elementHeight, setElementHeight] = useState('50');
  
  // Beispiel-Daten für DataTable
  const [products] = useState([
    { id: 1, name: 'Component A', type: 'Button', status: 'Active' },
    { id: 2, name: 'Component B', type: 'Input', status: 'Inactive' },
    { id: 3, name: 'Component C', type: 'Panel', status: 'Active' },
    { id: 4, name: 'Component D', type: 'Table', status: 'Active' }
  ]);

  const toolOptions = [
    { label: 'Select', value: 'select', icon: 'pi pi-cursor' },
    { label: 'Rectangle', value: 'rectangle', icon: 'pi pi-stop' },
    { label: 'Circle', value: 'circle', icon: 'pi pi-circle' },
    { label: 'Text', value: 'text', icon: 'pi pi-font' }
  ];

  // Panel-Komponenten definieren
  const ToolsPanel = () => (
    <div style={{ padding: '15px', height: '100%' }}>
      <Panel header="Werkzeuge" toggleable>
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="toolSelect">Aktives Werkzeug</label>
            <Dropdown
              id="toolSelect"
              value={selectedTool}
              options={toolOptions}
              onChange={(e) => setSelectedTool(e.value)}
              optionLabel="label"
              placeholder="Werkzeug wählen"
            />
          </div>
          
          <div className="grid mt-3">
            {toolOptions.map((tool) => (
              <div key={tool.value} className="col-6 p-1">
                <Button
                  icon={tool.icon}
                  label={tool.label}
                  className={`w-full p-button-sm ${
                    selectedTool === tool.value 
                      ? 'p-button-info' 
                      : 'p-button-outlined'
                  }`}
                  onClick={() => setSelectedTool(tool.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );

  const PropertiesPanel = () => (
    <div style={{ padding: '15px', height: '100%' }}>
      <Panel header="Eigenschaften" toggleable>
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="elementName">Name</label>
            <InputText
              id="elementName"
              value={elementName}
              onChange={(e) => setElementName(e.target.value)}
            />
          </div>
          
          <div className="field">
            <label htmlFor="elementWidth">Breite (px)</label>
            <InputText
              id="elementWidth"
              value={elementWidth}
              onChange={(e) => setElementWidth(e.target.value)}
              keyfilter="pint"
            />
          </div>
          
          <div className="field">
            <label htmlFor="elementHeight">Höhe (px)</label>
            <InputText
              id="elementHeight"
              value={elementHeight}
              onChange={(e) => setElementHeight(e.target.value)}
              keyfilter="pint"
            />
          </div>
          
          <div className="field">
            <Button
              label="Eigenschaften anwenden"
              icon="pi pi-check"
              className="p-button-success"
              onClick={() => {
                console.log('Eigenschaften angewendet:', {
                  name: elementName,
                  width: elementWidth,
                  height: elementHeight
                });
              }}
            />
          </div>
          
          <div className="field">
            <Button
              label="Zurücksetzen"
              icon="pi pi-refresh"
              className="p-button-secondary p-button-outlined"
              onClick={() => {
                setElementName('Element 1');
                setElementWidth('100');
                setElementHeight('50');
              }}
            />
          </div>
        </div>
      </Panel>
    </div>
  );

  const DataPanel = () => (
    <div style={{ padding: '15px', height: '100%' }}>
      <Card title="Projekt Komponenten" className="h-full">
        <DataTable
          value={products}
          size="small"
          stripedRows
          paginator
          rows={5}
          className="p-datatable-sm"
        >
          <Column field="name" header="Name" sortable />
          <Column field="type" header="Typ" sortable />
          <Column 
            field="status" 
            header="Status" 
            body={(rowData) => (
              <span className={`inline-flex align-items-center px-2 py-1 text-xs font-medium rounded-full ${
                rowData.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {rowData.status}
              </span>
            )}
          />
        </DataTable>
        
        <div className="mt-3">
          <Button
            label="Komponente hinzufügen"
            icon="pi pi-plus"
            className="p-button-sm"
            onClick={() => console.log('Neue Komponente hinzufügen')}
          />
        </div>
      </Card>
    </div>
  );

  const MainCanvas = () => (
    <div style={{ padding: '20px', height: '100%' }}>
      <Card title={`Arbeitsbereich - ${toolOptions.find(t => t.value === selectedTool)?.label || 'Select'} Tool`} className="h-full">
        <div
          style={{
            height: '450px',
            border: '2px dashed var(--surface-border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface-ground)',
            position: 'relative',
            cursor: selectedTool === 'select' ? 'default' : 'crosshair'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log(`${selectedTool} tool clicked at:`, { x, y });
          }}
        >
          <div className="text-center">
            <i 
              className={toolOptions.find(t => t.value === selectedTool)?.icon || 'pi pi-image'} 
              style={{ fontSize: '4rem', color: 'var(--text-color-secondary)' }}
            />
            <h3 className="mt-3 text-color-secondary">
              {selectedTool === 'select' ? 'Klicke um zu beginnen' : `${toolOptions.find(t => t.value === selectedTool)?.label} Modus`}
            </h3>
            <p className="text-sm text-color-secondary mb-3">
              Aktuelle Größe: {elementWidth} x {elementHeight}px
            </p>
            
            <div className="flex gap-2 justify-content-center">
              <Button
                label="Beispiel Element"
                icon="pi pi-plus"
                className="p-button-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Beispiel Element erstellt');
                }}
              />
              <Button
                label="Canvas leeren"
                icon="pi pi-trash"
                className="p-button-sm p-button-outlined p-button-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Canvas geleert');
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // RC Dock Layout Definition - das ist das wichtige!
  const dockLayout = {
    dockbox: {
      mode: 'horizontal',
      children: [
        {
          mode: 'vertical',
          size: 280,
          children: [
            {
              tabs: [
                {
                  id: 'tools',
                  title: 'Werkzeuge',
                  content: <ToolsPanel />,
                  cached: true
                }
              ]
            }
          ]
        },
        {
          size: 600,
          tabs: [
            {
              id: 'canvas',
              title: 'Arbeitsbereich',
              content: <MainCanvas />,
              cached: true
            }
          ]
        },
        {
          mode: 'vertical',
          size: 320,
          children: [
            {
              size: 300,
              tabs: [
                {
                  id: 'properties',
                  title: 'Eigenschaften',
                  content: <PropertiesPanel />,
                  cached: true
                }
              ]
            },
            {
              tabs: [
                {
                  id: 'data',
                  title: 'Komponenten',
                  content: <DataPanel />,
                  cached: true
                }
              ]
            }
          ]
        }
      ]
    }
  };

  const [layout, setLayout] = useState(dockLayout);

  // Simuliere DockLayout für Demo (du ersetzt das durch echtes RC Dock)
  const MockDockLayout = () => {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex',
        fontFamily: 'var(--font-family)'
      }}>
        {/* Links: Tools */}
        <div style={{ 
          width: '280px', 
          borderRight: '1px solid var(--surface-border)',
          backgroundColor: 'var(--surface-card)'
        }}>
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: 'var(--surface-section)',
            borderBottom: '1px solid var(--surface-border)',
            fontWeight: '500'
          }}>
            Werkzeuge
          </div>
          <ToolsPanel />
        </div>
        
        {/* Mitte: Canvas */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: 'var(--surface-section)',
            borderBottom: '1px solid var(--surface-border)',
            fontWeight: '500'
          }}>
            Arbeitsbereich
          </div>
          <MainCanvas />
        </div>
        
        {/* Rechts: Properties + Data */}
        <div style={{ 
          width: '320px', 
          borderLeft: '1px solid var(--surface-border)',
          backgroundColor: 'var(--surface-card)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Properties */}
          <div style={{ height: '300px' }}>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'var(--surface-section)',
              borderBottom: '1px solid var(--surface-border)',
              fontWeight: '500'
            }}>
              Eigenschaften
            </div>
            <PropertiesPanel />
          </div>
          
          {/* Data */}
          <div style={{ flex: 1, borderTop: '1px solid var(--surface-border)' }}>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'var(--surface-section)',
              borderBottom: '1px solid var(--surface-border)',
              fontWeight: '500'
            }}>
              Komponenten
            </div>
            <DataPanel />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rc-dock-app">
      <style>{`
        /* PrimeReact Theme CSS - das gehört in deine app.js */
        @import url('https://cdn.jsdelivr.net/npm/primereact@10/resources/themes/lara-light-blue/theme.css');
        @import url('https://cdn.jsdelivr.net/npm/primereact@10/resources/primereact.min.css');
        @import url('https://cdn.jsdelivr.net/npm/primeicons@6/primeicons.css');
        
        .field {
          margin-bottom: 1rem;
        }
        
        .mt-3 {
          margin-top: 1rem;
        }
        
        .text-sm {
          font-size: 0.875rem;
        }
        
        .bg-green-100 {
          background-color: #dcfce7;
        }
        
        .text-green-800 {
          color: #166534;
        }
        
        .bg-gray-100 {
          background-color: #f3f4f6;
        }
        
        .text-gray-800 {
          color: #1f2937;
        }
        
        .inline-flex {
          display: inline-flex;
        }
        
        .align-items-center {
          align-items: center;
        }
        
        .px-2 {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .py-1 {
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
        }
        
        .text-xs {
          font-size: 0.75rem;
        }
        
        .font-medium {
          font-weight: 500;
        }
        
        .rounded-full {
          border-radius: 9999px;
        }
      `}</style>

      {/* 
        WICHTIG: Ersetze MockDockLayout() durch:
        
        <DockLayout 
          layout={layout}
          onLayoutChange={setLayout}
          style={{ height: '100vh' }}
        />
      */}
      <MockDockLayout />
      
      {/* Info Box für echte Implementation */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'var(--blue-50)',
        border: '1px solid var(--blue-200)',
        borderRadius: '6px',
        padding: '12px',
        maxWidth: '300px',
        fontSize: '0.85rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--blue-700)' }}>
          💡 Für echte RC Dock Implementation:
        </div>
        <code style={{ 
          display: 'block', 
          backgroundColor: 'var(--surface-ground)', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          {`// In Security.tsx
import DockLayout from 'rc-dock';

<DockLayout 
  layout={layout}
  onLayoutChange={setLayout}
  style={{ height: '100vh' }}
/>`}
        </code>
      </div>
    </div>
  );
};

export default RealRCDockImplementation;