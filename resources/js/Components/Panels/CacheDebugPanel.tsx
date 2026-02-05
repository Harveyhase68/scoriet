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
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';

const TabContent: React.FC<TabContentProps & { colors: any }> = ({ children, style = {}, colors, ...rest }) => {
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
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
        ...style
      }}
      onMouseDownCapture={setFocus}
      onTouchStartCapture={setFocus}
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
  const { colors } = useTheme();

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
      <TabContent colors={colors}>
        <div className="p-4 text-center">
          <div className="p-8 rounded" style={{ backgroundColor: colors.bgSecondary }}>
            <i className="pi pi-lock text-6xl mb-4" style={{ color: colors.warningText }}></i>
            <h3 className="text-2xl mb-2" style={{ color: colors.textPrimary }}>System Access Required</h3>
            <p style={{ color: colors.textMuted }}>
              This panel is only available to system administrators.
            </p>
          </div>
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent colors={colors}>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>Cache Debug & Management</h2>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {success && (
          <Message severity="success" text={success} className="mb-4" />
        )}

        {/* Cache Statistics */}
        <Card title="Cache Statistics" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          {loading && !stats ? (
            <div className="flex justify-center p-4">
              <ProgressSpinner />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="text-sm" style={{ color: colors.textMuted }}>Cache Enabled</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {stats.enabled ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="text-sm" style={{ color: colors.textMuted }}>TTL Hours</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.ttl_hours}h</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="text-sm" style={{ color: colors.textMuted }}>Total Entries</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.total_entries}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.infoBorder}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>🗄️ Schema Caches</div>
                  <div className="text-xl font-bold" style={{ color: colors.infoText }}>{stats.schema_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Database schemas (tables + fields)</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.successBorder}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>🌳 Gtree Caches</div>
                  <div className="text-xl font-bold" style={{ color: colors.successText }}>{stats.gtree_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Generation trees (project × template)</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.warningBorder}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>🧪 Test Caches</div>
                  <div className="text-xl font-bold" style={{ color: colors.warningText }}>{stats.test_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>From "Run Test" button</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>📦 Template Caches</div>
                  <div className="text-xl font-bold" style={{ color: colors.textMuted }}>{stats.compiled_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Old system (deprecated)</div>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        {/* Cache Actions */}
        <Card title="Cache Actions" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                label="Refresh Stats"
                icon="pi pi-refresh"
                onClick={fetchStats}
                disabled={loading}
                severity="info"
              />
              <Button
                label="Redis Inspector"
                icon="pi pi-search"
                onClick={fetchInspector}
                disabled={loading}
                severity="help"
              />
              <Button
                label="A Clear Template Cache"
                icon="pi pi-trash"
                onClick={() => clearCache('template')}
                disabled={loading}
                severity="warning"
                //className={`p-button-text p-button-sm topbar-icon-btn`}
              />
              <Button
                label="Clear All Cache"
                icon="pi pi-times"
                onClick={() => clearCache('all')}
                disabled={loading}
                severity="danger"
              />
              <Button
                label="Cleanup Dead Keys"
                icon="pi pi-filter-slash"
                onClick={cleanupCache}
                disabled={loading}
                severity="secondary"
                tooltip="Remove expired/dead keys from Redis"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.checked || false)}
              />
              <label htmlFor="autoRefresh" className="text-sm" style={{ color: colors.textPrimary }}>
                Auto-Refresh (every 10s)
              </label>
            </div>
          </div>
        </Card>

        {/* Test Template Generation */}
        <Card title="Test Template Generation" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: colors.textMuted }}>Template ID</label>
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
                <label htmlFor="useCache" className="ml-2" style={{ color: colors.textPrimary }}>Use Cache</label>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                label="Run Test"
                icon="pi pi-play"
                onClick={testGeneration}
                disabled={testLoading}
                severity="success"
              />
            </div>
          </div>

          {testResult && (
            <div className="mt-4 p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
              <h3 className="font-bold mb-2" style={{ color: colors.textPrimary }}>Test Result:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span style={{ color: colors.textMuted }}>Source:</span>{' '}
                  <span className="font-bold" style={{ color: testResult.source === 'cache' ? colors.successText : colors.warningText }}>
                    {testResult.source.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Execution Time:</span>{' '}
                  <span style={{ color: colors.textPrimary }}>{testResult.execution_time_ms}ms</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Was Cached:</span>{' '}
                  <span style={{ color: colors.textPrimary }}>{testResult.was_cached ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Size:</span>{' '}
                  <span style={{ color: colors.textPrimary }}>{testResult.compiled_size_kb} KB</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Cache Key:</span>{' '}
                  <span className="text-xs" style={{ color: colors.textPrimary }}>{testResult.cache_key}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Timestamp:</span>{' '}
                  <span className="text-xs" style={{ color: colors.textPrimary }}>{testResult.timestamp}</span>
                </div>
                {testResult.cached_for_hours && (
                  <div className="col-span-2">
                    <span style={{ color: colors.textMuted }}>Cached For:</span>{' '}
                    <span style={{ color: colors.textPrimary }}>{testResult.cached_for_hours} hours</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Cache Entries Table */}
        {stats && stats.entries.length > 0 && (
          <Card title="Cache Entries" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <DataTable
              value={stats.entries}
              paginator
              rows={10}
            >
              <Column
                field="type"
                header="Type"
                sortable
                body={(row) => {
                  const typeConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
                    test: { label: '🧪 TEST', bgColor: colors.warningBg, textColor: colors.warningText, borderColor: colors.warningBorder },
                    compiled: { label: '📦 TEMPLATE', bgColor: colors.bgTertiary, textColor: colors.textSecondary, borderColor: colors.borderPrimary },
                    schema: { label: '🗄️ SCHEMA', bgColor: colors.infoBg, textColor: colors.infoText, borderColor: colors.infoBorder },
                    gtree: { label: '🌳 GTREE', bgColor: colors.successBg, textColor: colors.successText, borderColor: colors.successBorder }
                  };
                  const config = typeConfig[row.type] || { label: row.type.toUpperCase(), bgColor: colors.bgTertiary, textColor: colors.textSecondary, borderColor: colors.borderPrimary };
                  return (
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: config.bgColor, color: config.textColor, border: `1px solid ${config.borderColor}` }}
                    >
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
          <Card title="Redis Inspector - RAW Keys" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="mb-4 p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span style={{ color: colors.textMuted }}>Cache Driver:</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{inspectorData.cache_driver}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Redis Database:</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>#{inspectorData.redis_database}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Total Redis Keys:</span>{' '}
                  <span className="font-bold" style={{ color: inspectorData.total_redis_keys === 0 ? colors.errorText : colors.successText }}>
                    {inspectorData.total_redis_keys}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span style={{ color: colors.textMuted }}>Redis Prefix:</span>{' '}
                  <span className="font-mono text-xs" style={{ color: colors.textPrimary }}>{inspectorData.redis_prefix || 'none'}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Cache Prefix:</span>{' '}
                  <span className="font-mono text-xs" style={{ color: colors.textPrimary }}>{inspectorData.cache_prefix}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Full Prefix:</span>{' '}
                  <span className="font-mono text-xs font-bold" style={{ color: colors.warningText }}>{inspectorData.full_prefix}</span>
                </div>
              </div>
            </div>

            {inspectorData.total_redis_keys === 0 ? (
              <div className="p-8 text-center rounded" style={{ backgroundColor: colors.bgTertiary }}>
                <i className="pi pi-info-circle text-4xl mb-4" style={{ color: colors.warningText }}></i>
                <h3 className="text-xl mb-2" style={{ color: colors.textPrimary }}>Redis is Empty!</h3>
                <p style={{ color: colors.textMuted }}>
                  No keys found in Redis. Try running a test or clearing cache to populate it.
                </p>
              </div>
            ) : (
              <DataTable
                value={inspectorData.keys}
                paginator
                rows={20}
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
                    <span style={{ color: row.has_prefix ? colors.successText : colors.errorText }}>
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
                      <div style={{ color: colors.textPrimary }}>{row.ttl_human || 'Unknown'}</div>
                      {row.ttl > 0 && <div className="text-xs" style={{ color: colors.textMuted }}>{row.ttl}s</div>}
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
                      severity="info"
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
                severity="secondary"
              />
            </div>
          </Card>
        )}

        {/* Key Content Dialog */}
        <Dialog
          header={
            <div className="flex flex-col">
              <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>Key Content</span>
              <span className="text-xs font-mono break-all mt-1" style={{ color: colors.textMuted }}>
                {getShortenedKey(selectedKey)}
              </span>
            </div>
          }
          visible={showContentDialog}
          style={{ width: '90vw', maxWidth: '1400px', height: '85vh' }}
          onHide={() => setShowContentDialog(false)}
          className="themed-dialog"
          headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderPrimary}` }}
          contentStyle={{ height: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column', backgroundColor: colors.dialogContent, color: colors.textPrimary }}
        >
          {loadingContent ? (
            <div className="flex justify-center items-center p-8">
              <ProgressSpinner />
            </div>
          ) : keyContent && keyContent.found ? (
            <div className="flex flex-col h-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 rounded flex-shrink-0" style={{ backgroundColor: colors.bgTertiary }}>
                <div>
                  <span style={{ color: colors.textMuted }}>Type:</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{keyContent.type}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>TTL:</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>
                    {keyContent.ttl > 0 ? `${keyContent.ttl}s` : (keyContent.ttl === -1 ? 'No Expiry' : 'Expired')}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Size:</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{keyContent.size_bytes} bytes</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>Size (KB):</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{(keyContent.size_bytes / 1024).toFixed(2)} KB</span>
                </div>
              </div>

              <div className="p-4 rounded flex-1 flex flex-col min-h-0" style={{ backgroundColor: colors.bgTertiary }}>
                <h4 className="mb-2 flex-shrink-0" style={{ color: colors.textMuted }}>Content:</h4>
                <pre className="p-3 rounded text-xs overflow-auto flex-1" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}>
                  {keyContent.content}
                </pre>
              </div>

              <div className="mt-4 flex justify-end flex-shrink-0">
                <Button
                  label="Close"
                  icon="pi pi-times"
                  onClick={() => setShowContentDialog(false)}
                  severity="secondary"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <i className="pi pi-info-circle text-4xl mb-4" style={{ color: colors.warningText }}></i>
              <p style={{ color: colors.textMuted }}>Key not found or has no content</p>
              <div className="mt-4">
                <Button
                  label="Close"
                  icon="pi pi-times"
                  onClick={() => setShowContentDialog(false)}
                  severity="secondary"
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
