// resources/js/Components/Panels/CacheDebugPanel.tsx - Cache Debug & Management Panel
import React, { useRef, useState, useEffect } from 'react';
import { TabContentProps } from '@/types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';

const TabContent: React.FC<TabContentProps> = ({ children, style = {}, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFocus = () => ref.current?.focus();

  return (
    <div
      {...rest}
      ref={ref}
      tabIndex={-1}
      style={{
        flex: 1,
        padding: '5px 10px',
        maxHeight: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        ...style
      }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
      className="bg-gray-800 text-gray-100"
    >
      {children}
    </div>
  );
};

interface CacheEntry {
  key: string;
  type: 'test' | 'compiled' | 'schema' | 'gtree';
  size_bytes: number;
  size_kb: number;
  ttl_seconds: number;
  ttl_hours: number | null;
  expires_at: string | null;
}

interface CacheStats {
  enabled: boolean;
  ttl_hours: number;
  total_entries: number;
  test_entries: number;
  compiled_entries: number;
  schema_entries: number;
  gtree_entries: number;
  entries: CacheEntry[];
}

interface TestGenerationResult {
  template_id: number;
  cache_enabled: boolean;
  use_cache_requested: boolean;
  was_cached: boolean;
  cache_key: string;
  timestamp: string;
  source: 'cache' | 'compilation';
  execution_time_ms: number;
  compiled_size_bytes: number;
  compiled_size_kb: number;
  cached_for_hours?: number;
}

const CacheDebugPanel: React.FC = () => {
  // Check if user is system admin (only system users can see this panel)
  const userType = localStorage.getItem('user_type') || 'free';

  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Test generation state
  const [testTemplateId, setTestTemplateId] = useState<number>(1);
  const [useCache, setUseCache] = useState(true);
  const [testResult, setTestResult] = useState<TestGenerationResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Inspector state
  const [inspectorData, setInspectorData] = useState<any>(null);
  const [showInspector, setShowInspector] = useState(false);

  // Key content viewer state
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyContent, setKeyContent] = useState<any>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const getToken = () => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  };

  const fetchStats = React.useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/cache/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch cache stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = async (type: 'all' | 'template') => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.post('/api/cache/clear',
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(response.data.message);
      // Refresh stats after clearing
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const cleanupCache = async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.post('/api/cache/cleanup',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(response.data.message);
      // Refresh stats after cleanup
      await fetchStats();
      // Refresh inspector if open
      if (showInspector) {
        await fetchInspector();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cleanup cache');
    } finally {
      setLoading(false);
    }
  };

  const testGeneration = async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    setTestLoading(true);
    setError(null);
    setTestResult(null);
    try {
      const response = await axios.post('/api/cache/test-generation',
        { template_id: testTemplateId, use_cache: useCache },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResult(response.data);
      // Refresh stats to show new cache entry
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Test generation failed');
    } finally {
      setTestLoading(false);
    }
  };

  const fetchInspector = async () => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/cache/inspect', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInspectorData(response.data);
      setShowInspector(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to inspect cache');
    } finally {
      setLoading(false);
    }
  };

  const viewKeyContent = async (key: string) => {
    const token = getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    setSelectedKey(key);
    setLoadingContent(true);
    setShowContentDialog(true);
    setKeyContent(null);

    try {
      const response = await axios.post('/api/cache/get-content',
        { key },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKeyContent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get key content');
      setShowContentDialog(false);
    } finally {
      setLoadingContent(false);
    }
  };

  // Shorten key for dialog header
  const getShortenedKey = (key: string | null) => {
    if (!key) return '';
    // Remove prefix to make it shorter
    const redisPrefix = inspectorData?.redis_prefix || '';
    const cachePrefix = inspectorData?.cache_prefix || '';
    const fullPrefix = redisPrefix + cachePrefix;
    const cleanKey = key.replace(fullPrefix, '');

    // If still too long, show last 60 chars with ...
    if (cleanKey.length > 60) {
      return '...' + cleanKey.slice(-60);
    }
    return cleanKey;
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh interval (only when enabled)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  // Hide panel for non-system users
  if (userType !== 'system') {
    return (
      <TabContent>
        <div className="p-4 text-center">
          <div className="p-8 bg-gray-800 rounded">
            <i className="pi pi-lock text-6xl text-yellow-400 mb-4"></i>
            <h3 className="text-2xl text-white mb-2">System Access Required</h3>
            <p className="text-gray-400">
              This panel is only available to system administrators.
            </p>
          </div>
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Cache Debug & Management</h2>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {success && (
          <Message severity="success" text={success} className="mb-4" />
        )}

        {/* Cache Statistics */}
        <Card title="Cache Statistics" className="mb-4 bg-gray-900">
          {loading && !stats ? (
            <div className="flex justify-center p-4">
              <ProgressSpinner />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">Cache Enabled</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.enabled ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">TTL Hours</div>
                  <div className="text-2xl font-bold text-white">{stats.ttl_hours}h</div>
                </div>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="text-sm text-gray-400">Total Entries</div>
                  <div className="text-2xl font-bold text-white">{stats.total_entries}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-700 rounded border border-blue-600">
                  <div className="text-sm text-gray-300">🗄️ Schema Caches</div>
                  <div className="text-xl font-bold text-blue-400">{stats.schema_entries}</div>
                  <div className="text-xs text-gray-400 mt-1">Database schemas (tables + fields)</div>
                </div>
                <div className="p-4 bg-gray-700 rounded border border-green-600">
                  <div className="text-sm text-gray-300">🌳 Gtree Caches</div>
                  <div className="text-xl font-bold text-green-400">{stats.gtree_entries}</div>
                  <div className="text-xs text-gray-400 mt-1">Generation trees (project × template)</div>
                </div>
                <div className="p-4 bg-gray-700 rounded border border-yellow-600">
                  <div className="text-sm text-gray-300">🧪 Test Caches</div>
                  <div className="text-xl font-bold text-yellow-400">{stats.test_entries}</div>
                  <div className="text-xs text-gray-400 mt-1">From "Run Test" button</div>
                </div>
                <div className="p-4 bg-gray-700 rounded border border-gray-600">
                  <div className="text-sm text-gray-300">📦 Template Caches</div>
                  <div className="text-xl font-bold text-gray-400">{stats.compiled_entries}</div>
                  <div className="text-xs text-gray-400 mt-1">Old system (deprecated)</div>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        {/* Cache Actions */}
        <Card title="Cache Actions" className="mb-4 bg-gray-900">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                label="Refresh Stats"
                icon="pi pi-refresh"
                onClick={fetchStats}
                disabled={loading}
                className="p-button-info"
              />
              <Button
                label="Redis Inspector"
                icon="pi pi-search"
                onClick={fetchInspector}
                disabled={loading}
                className="p-button-help"
              />
              <Button
                label="Clear Template Cache"
                icon="pi pi-trash"
                onClick={() => clearCache('template')}
                disabled={loading}
                className="p-button-warning"
              />
              <Button
                label="Clear All Cache"
                icon="pi pi-times"
                onClick={() => clearCache('all')}
                disabled={loading}
                className="p-button-danger"
              />
              <Button
                label="Cleanup Dead Keys"
                icon="pi pi-filter-slash"
                onClick={cleanupCache}
                disabled={loading}
                className="p-button-secondary"
                tooltip="Remove expired/dead keys from Redis"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.checked || false)}
              />
              <label htmlFor="autoRefresh" className="text-white text-sm">
                Auto-Refresh (every 10s)
              </label>
            </div>
          </div>
        </Card>

        {/* Test Template Generation */}
        <Card title="Test Template Generation" className="mb-4 bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Template ID</label>
              <InputNumber
                value={testTemplateId}
                onValueChange={(e) => setTestTemplateId(e.value || 1)}
                min={1}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center">
                <Checkbox
                  inputId="useCache"
                  checked={useCache}
                  onChange={(e) => setUseCache(e.checked || false)}
                />
                <label htmlFor="useCache" className="ml-2 text-white">Use Cache</label>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                label="Run Test"
                icon="pi pi-play"
                onClick={testGeneration}
                disabled={testLoading}
                className="p-button-success"
              />
            </div>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded">
              <h3 className="font-bold mb-2 text-white">Test Result:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Source:</span>{' '}
                  <span className={`font-bold ${testResult.source === 'cache' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {testResult.source.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Execution Time:</span>{' '}
                  <span className="text-white">{testResult.execution_time_ms}ms</span>
                </div>
                <div>
                  <span className="text-gray-400">Was Cached:</span>{' '}
                  <span className="text-white">{testResult.was_cached ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Size:</span>{' '}
                  <span className="text-white">{testResult.compiled_size_kb} KB</span>
                </div>
                <div>
                  <span className="text-gray-400">Cache Key:</span>{' '}
                  <span className="text-white text-xs">{testResult.cache_key}</span>
                </div>
                <div>
                  <span className="text-gray-400">Timestamp:</span>{' '}
                  <span className="text-white text-xs">{testResult.timestamp}</span>
                </div>
                {testResult.cached_for_hours && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Cached For:</span>{' '}
                    <span className="text-white">{testResult.cached_for_hours} hours</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Cache Entries Table */}
        {stats && stats.entries.length > 0 && (
          <Card title="Cache Entries" className="bg-gray-900">
            <DataTable
              value={stats.entries}
              paginator
              rows={10}
              className="text-white"
            >
              <Column
                field="type"
                header="Type"
                sortable
                body={(row) => {
                  const typeConfig = {
                    test: { label: '🧪 TEST', class: 'bg-yellow-900 text-yellow-200 border border-yellow-600' },
                    compiled: { label: '📦 TEMPLATE', class: 'bg-gray-700 text-gray-300 border border-gray-500' },
                    schema: { label: '🗄️ SCHEMA', class: 'bg-blue-900 text-blue-200 border border-blue-600' },
                    gtree: { label: '🌳 GTREE', class: 'bg-green-900 text-green-200 border border-green-600' }
                  };
                  const config = typeConfig[row.type as keyof typeof typeConfig] || { label: row.type.toUpperCase(), class: 'bg-gray-700' };
                  return (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${config.class}`}>
                      {config.label}
                    </span>
                  );
                }}
              />
              <Column field="key" header="Cache Key" sortable style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }} />
              <Column
                field="size_kb"
                header="Size (KB)"
                sortable
                body={(row) => row.size_kb.toFixed(2)}
              />
              <Column
                field="ttl_hours"
                header="TTL (hours)"
                sortable
                body={(row) => row.ttl_hours?.toFixed(2) || 'N/A'}
              />
              <Column
                field="expires_at"
                header="Expires At"
                sortable
                body={(row) => row.expires_at || 'Never'}
              />
            </DataTable>
          </Card>
        )}

        {/* Redis Inspector */}
        {showInspector && inspectorData && (
          <Card title="Redis Inspector - RAW Keys" className="bg-gray-900 mb-4">
            <div className="mb-4 p-4 bg-gray-800 rounded">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Cache Driver:</span>{' '}
                  <span className="text-white font-bold">{inspectorData.cache_driver}</span>
                </div>
                <div>
                  <span className="text-gray-400">Redis Database:</span>{' '}
                  <span className="text-white font-bold">#{inspectorData.redis_database}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Redis Keys:</span>{' '}
                  <span className={`font-bold ${inspectorData.total_redis_keys === 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {inspectorData.total_redis_keys}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Redis Prefix:</span>{' '}
                  <span className="text-white font-mono text-xs">{inspectorData.redis_prefix || 'none'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Cache Prefix:</span>{' '}
                  <span className="text-white font-mono text-xs">{inspectorData.cache_prefix}</span>
                </div>
                <div>
                  <span className="text-gray-400">Full Prefix:</span>{' '}
                  <span className="text-yellow-400 font-mono text-xs font-bold">{inspectorData.full_prefix}</span>
                </div>
              </div>
            </div>

            {inspectorData.total_redis_keys === 0 ? (
              <div className="p-8 text-center bg-gray-800 rounded">
                <i className="pi pi-info-circle text-4xl text-yellow-400 mb-4"></i>
                <h3 className="text-xl text-white mb-2">Redis is Empty!</h3>
                <p className="text-gray-400">
                  No keys found in Redis. Try running a test or clearing cache to populate it.
                </p>
              </div>
            ) : (
              <DataTable
                value={inspectorData.keys}
                paginator
                rows={20}
                className="text-white"
              >
                <Column
                  field="raw_key"
                  header="Raw Redis Key"
                  sortable
                  style={{ fontFamily: 'monospace', fontSize: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
                <Column
                  field="has_prefix"
                  header="Has Prefix"
                  sortable
                  body={(row) => (
                    <span className={row.has_prefix ? 'text-green-400' : 'text-red-400'}>
                      {row.has_prefix ? 'Yes' : 'No'}
                    </span>
                  )}
                />
                <Column
                  field="type"
                  header="Type"
                  sortable
                />
                <Column
                  field="size_bytes"
                  header="Size (bytes)"
                  sortable
                  body={(row) => row.size_bytes.toLocaleString()}
                />
                <Column
                  field="ttl"
                  header="TTL"
                  sortable
                  body={(row) => (
                    <div>
                      <div className="text-white">{row.ttl_human || 'Unknown'}</div>
                      {row.ttl > 0 && <div className="text-xs text-gray-400">{row.ttl}s</div>}
                    </div>
                  )}
                />
                <Column
                  header="Actions"
                  body={(row) => (
                    <Button
                      icon="pi pi-eye"
                      label="View"
                      size="small"
                      onClick={() => viewKeyContent(row.raw_key)}
                      className="p-button-sm p-button-info"
                      tooltip="View key content"
                    />
                  )}
                />
              </DataTable>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                label="Close Inspector"
                icon="pi pi-times"
                onClick={() => setShowInspector(false)}
                className="p-button-secondary"
              />
            </div>
          </Card>
        )}

        {/* Key Content Dialog */}
        <Dialog
          header={
            <div className="flex flex-col">
              <span className="text-sm font-bold">Key Content</span>
              <span className="text-xs font-mono text-gray-400 break-all mt-1">
                {getShortenedKey(selectedKey)}
              </span>
            </div>
          }
          visible={showContentDialog}
          style={{ width: '90vw', maxWidth: '1400px', height: '85vh' }}
          onHide={() => setShowContentDialog(false)}
          className="bg-gray-900"
          contentStyle={{ height: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column' }}
        >
          {loadingContent ? (
            <div className="flex justify-center items-center p-8">
              <ProgressSpinner />
            </div>
          ) : keyContent && keyContent.found ? (
            <div className="flex flex-col h-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-800 rounded flex-shrink-0">
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  <span className="text-white font-bold">{keyContent.type}</span>
                </div>
                <div>
                  <span className="text-gray-400">TTL:</span>{' '}
                  <span className="text-white font-bold">
                    {keyContent.ttl > 0 ? `${keyContent.ttl}s` : (keyContent.ttl === -1 ? 'No Expiry' : 'Expired')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Size:</span>{' '}
                  <span className="text-white font-bold">{keyContent.size_bytes} bytes</span>
                </div>
                <div>
                  <span className="text-gray-400">Size (KB):</span>{' '}
                  <span className="text-white font-bold">{(keyContent.size_bytes / 1024).toFixed(2)} KB</span>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded flex-1 flex flex-col min-h-0">
                <h4 className="text-gray-400 mb-2 flex-shrink-0">Content:</h4>
                <pre className="bg-gray-900 p-3 rounded text-xs text-white overflow-auto flex-1">
                  {keyContent.content}
                </pre>
              </div>

              <div className="mt-4 flex justify-end flex-shrink-0">
                <Button
                  label="Close"
                  icon="pi pi-times"
                  onClick={() => setShowContentDialog(false)}
                  className="p-button-secondary"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <i className="pi pi-info-circle text-4xl text-yellow-400 mb-4"></i>
              <p className="text-gray-400">Key not found or has no content</p>
              <div className="mt-4">
                <Button
                  label="Close"
                  icon="pi pi-times"
                  onClick={() => setShowContentDialog(false)}
                  className="p-button-secondary"
                />
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </TabContent>
  );
};

export default CacheDebugPanel;
