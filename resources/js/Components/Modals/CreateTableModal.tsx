import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TableField {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  comment: string;
}

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: (tableName: string, comment: string, fields: TableField[]) => void;
  loading?: boolean;
}

const DATA_TYPES = [
  'bigint', 'int', 'smallint', 'tinyint',
  'varchar', 'char', 'text', 'longtext',
  'decimal', 'float', 'double',
  'date', 'datetime', 'timestamp', 'time',
  'boolean', 'json', 'enum'
];

export default function CreateTableModal({ isOpen, onClose, onTableCreated, loading = false }: CreateTableModalProps) {
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [fields, setFields] = useState<TableField[]>([
    {
      id: '1',
      name: 'id',
      type: 'bigint',
      nullable: false,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Primary key'
    }
  ]);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    const newField: TableField = {
      id: Date.now().toString(),
      name: '',
      type: 'varchar',
      nullable: true,
      primaryKey: false,
      autoIncrement: false,
      comment: ''
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(field => field.id !== id));
    }
  };

  const updateField = (id: string, updates: Partial<TableField>) => {
    setFields(fields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }

    if (fields.some(field => !field.name.trim())) {
      setError('All fields must have a name');
      return;
    }

    // Check for duplicate field names
    const fieldNames = fields.map(f => f.name.toLowerCase());
    if (fieldNames.length !== new Set(fieldNames).size) {
      setError('Field names must be unique');
      return;
    }

    onTableCreated(tableName, tableComment, fields);
  };

  const resetForm = () => {
    setTableName('');
    setTableComment('');
    setFields([
      {
        id: '1',
        name: 'id',
        type: 'bigint',
        nullable: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Primary key'
      }
    ]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleClose}
    >
      <div
        className="portal-modal-content rounded-lg p-6 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="portal-modal-header flex justify-between items-center">
          <h2 className="flex items-center">
            <i className="pi pi-table mr-2"></i>
            Create New Table
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Table Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Table Name *
              </label>
              <input
                type="text"
                required
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., users, products, orders"
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comment
              </label>
              <input
                type="text"
                value={tableComment}
                onChange={(e) => setTableComment(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Description of this table"
                maxLength={255}
              />
            </div>
          </div>

          {/* Fields Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Fields *
              </label>
              <button
                type="button"
                onClick={addField}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-1 rounded text-white text-sm flex items-center space-x-1"
              >
                <i className="pi pi-plus"></i>
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {fields.map((field) => (
                <div key={field.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                    {/* Field Name */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        disabled={loading}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="field_name"
                      />
                    </div>

                    {/* Data Type */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value })}
                        disabled={loading}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {DATA_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col space-y-1">
                      <label className="flex items-center text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={field.nullable}
                          onChange={(e) => updateField(field.id, { nullable: e.target.checked })}
                          disabled={loading}
                          className="mr-1"
                        />
                        Nullable
                      </label>
                      <label className="flex items-center text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={field.primaryKey}
                          onChange={(e) => updateField(field.id, { primaryKey: e.target.checked })}
                          disabled={loading}
                          className="mr-1"
                        />
                        Primary Key
                      </label>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="flex items-center text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={field.autoIncrement}
                          onChange={(e) => updateField(field.id, { autoIncrement: e.target.checked })}
                          disabled={loading}
                          className="mr-1"
                        />
                        Auto Inc.
                      </label>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Comment</label>
                      <input
                        type="text"
                        value={field.comment}
                        onChange={(e) => updateField(field.id, { comment: e.target.value })}
                        disabled={loading}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Field description"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        disabled={loading || fields.length <= 1}
                        className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        title="Remove field"
                      >
                        <i className="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tableName.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded text-white transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <i className="pi pi-check"></i>
                  <span>Create Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}