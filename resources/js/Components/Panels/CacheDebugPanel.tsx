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
import { useTranslation, SupportedLanguage, getStoredLanguage} from '@/i18n';

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

interface ConfigEnvValue {
  value: any;
  is_set?: boolean;
  env_key: string;
  default?: any;
}

interface CacheConfig {
  template_cache: {
    enabled: ConfigEnvValue;
    ttl_hours: ConfigEnvValue;
    auto_precompile: ConfigEnvValue;
    precompile_batch_size: ConfigEnvValue;
  };
  cache_store: {
    driver: ConfigEnvValue;
    prefix: ConfigEnvValue;
    write_read_test: string;
    write_read_error: string | null;
  };
  redis: {
    client: ConfigEnvValue;
    host: ConfigEnvValue;
    port: ConfigEnvValue;
    password_set: boolean;
    database_default: string;
    database_cache: string;
    status: string;
    ping_ms: number | null;
    error: string | null;
    version: string | null;
    memory_used: string | null;
    uptime: string | null;
  };
}

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
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Check if user is system admin (only system users can see this panel)
  const userType = localStorage.getItem('user_type') || 'free';

  const [stats, setStats] = useState<CacheStats | null>(null);
  const [cacheConfig, setCacheConfig] = useState<CacheConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
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
      setError(t.cachedebugpanel154);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cache/stats', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw { response: { data: err } }; }
      setStats(await response.json());
    } catch (err: any) {
      setError(err.response?.data?.message || t.cachedebugpanel166);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setConfigLoading(true);
    try {
      const response = await fetch('/api/cache/config', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to load config');
      setCacheConfig(await response.json());
    } catch (err: any) {
      console.error(t.cachedebugpanel183, err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const clearCache = async (type: 'all' | 'template') => {
    const token = getToken();
    if (!token) {
      setError(t.cachedebugpanel192);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type })
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw { response: { data: err } }; }
      const data = await response.json();
      setSuccess(data.message);
      // Refresh stats after clearing
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || t.cachedebugpanel208);
    } finally {
      setLoading(false);
    }
  };

  const cleanupCache = async () => {
    const token = getToken();
    if (!token) {
      setError(t.cachedebugpanel217);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/cache/cleanup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw { response: { data: err } }; }
      const data = await response.json();
      setSuccess(data.message);
      // Refresh stats after cleanup
      await fetchStats();
      // Refresh inspector if open
      if (showInspector) {
        await fetchInspector();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t.cachedebugpanel237);
    } finally {
      setLoading(false);
    }
  };

  const testGeneration = async () => {
    const token = getToken();
    if (!token) {
      setError(t.cachedebugpanel246);
      return;
    }

    setTestLoading(true);
    setError(null);
    setTestResult(null);
    try {
      const response = await fetch('/api/cache/test-generation', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ template_id: testTemplateId, use_cache: useCache })
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw { response: { data: err } }; }
      setTestResult(await response.json());
      // Refresh stats to show new cache entry
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || t.cachedebugpanel262);
    } finally {
      setTestLoading(false);
    }
  };

  const fetchInspector = async () => {
    const token = getToken();
    if (!token) {
      setError(t.cachedebugpanel271);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cache/inspect', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw { response: { data: err } }; }
      setInspectorData(await response.json());
      setShowInspector(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t.cachedebugpanel284);
    } finally {
      setLoading(false);
    }
  };

  const viewKeyContent = async (key: string) => {
    const token = getToken();
    if (!token) {
      setError(t.cachedebugpanel293);
      return;
    }

    setSelectedKey(key);
    setLoadingContent(true);
    setShowContentDialog(true);
    setKeyContent(null);

    try {
      const response = await fetch('/api/cache/get-content', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ key })
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw { response: { data: err } }; }
      setKeyContent(await response.json());
    } catch (err: any) {
      setError(err.response?.data?.message || t.cachedebugpanel309);
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
    fetchConfig();
  }, [fetchStats, fetchConfig]);

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
            <h3 className="text-2xl mb-2" style={{ color: colors.textPrimary }}>{t.cachedebugpanel353}</h3>
            <p style={{ color: colors.textMuted }}>
              {t.cachedebugpanel355}
            </p>
          </div>
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent colors={colors}>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>{t.cachedebugpanel366}</h2>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {success && (
          <Message severity="success" text={success} className="mb-4" />
        )}

        {/* Environment Configuration */}
        <Card title={t.cachedebugpanel377} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          {configLoading && !cacheConfig ? (
            <div className="flex justify-center p-4">
              <ProgressSpinner />
            </div>
          ) : cacheConfig ? (
            <div className="flex flex-col gap-4">
              {/* Redis Connectivity Status */}
              <div className="p-4 rounded" style={{
                backgroundColor: cacheConfig.redis.status === 'connected' ? colors.successBg : colors.errorBg,
                border: `1px solid ${cacheConfig.redis.status === 'connected' ? colors.successBorder : colors.errorBorder}`
              }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{cacheConfig.redis.status === 'connected' ? '\u2705' : '\u274C'}</span>
                  <div>
                    <div className="text-lg font-bold" style={{ color: cacheConfig.redis.status === 'connected' ? colors.successText : colors.errorText }}>
                      Redis: {cacheConfig.redis.status === 'connected' ? t.cachedebugpanel393_2 : cacheConfig.redis.status === 'error' ? t.cachedebugpanel393 : cacheConfig.redis.status}
                    </div>
                    {cacheConfig.redis.status === 'connected' && cacheConfig.redis.ping_ms !== null && (
                      <span className="text-sm" style={{ color: colors.textMuted }}>
                        {t.cachedebugpanel397}{cacheConfig.redis.ping_ms}ms
                        {cacheConfig.redis.version ? ` | Version: ${cacheConfig.redis.version}` : ''}
                        {cacheConfig.redis.memory_used ? ` | Memory: ${cacheConfig.redis.memory_used}` : ''}
                        {cacheConfig.redis.uptime ? ` | Uptime: ${cacheConfig.redis.uptime}` : ''}
                      </span>
                    )}
                    {cacheConfig.redis.error && (
                      <div className="text-sm mt-1" style={{ color: colors.errorText }}>{cacheConfig.redis.error}</div>
                    )}
                  </div>
                </div>
                {/* Cache Write/Read Test */}
                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${cacheConfig.cache_store.write_read_test === 'ok' ? colors.successBorder : colors.errorBorder}` }}>
                  <span>{cacheConfig.cache_store.write_read_test === 'ok' ? '\u2705' : '\u274C'}</span>
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    Cache Write/Read Test: <strong style={{ color: cacheConfig.cache_store.write_read_test === 'ok' ? colors.successText : colors.errorText }}>
                      {cacheConfig.cache_store.write_read_test === 'ok' ? 'Passed' : cacheConfig.cache_store.write_read_test}
                    </strong>
                  </span>
                  {cacheConfig.cache_store.write_read_error && (
                    <span className="text-xs" style={{ color: colors.errorText }}>({cacheConfig.cache_store.write_read_error})</span>
                  )}
                </div>
              </div>

              {/* Template Cache Settings */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: colors.textSecondary }}>{t.cachedebugpanel424}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(cacheConfig.template_cache).map(([key, item]) => {
                    const isUsingDefault = !item.is_set;
                    const isCritical = key === 'enabled' && !item.value;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded" style={{
                        backgroundColor: colors.bgTertiary,
                        border: `1px solid ${isCritical ? colors.errorBorder : colors.borderPrimary}`
                      }}>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono" style={{ color: colors.textMuted }}>{item.env_key}</span>
                          <span className="font-bold" style={{ color: isCritical ? colors.errorText : colors.textPrimary }}>
                            {String(item.value)}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded" style={{
                          backgroundColor: isUsingDefault ? colors.warningBg : colors.successBg,
                          color: isUsingDefault ? colors.warningText : colors.successText,
                          border: `1px solid ${isUsingDefault ? colors.warningBorder : colors.successBorder}`
                        }}>
                          {isUsingDefault ? 'DEFAULT' : 'SET'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {!cacheConfig.template_cache.enabled.value && (
                  <div className="mt-2 p-3 rounded text-sm" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorText }}>
                    {t.cachedebugpanel453_2}<strong>disabled</strong>{t.cachedebugpanel453_3}<code className="font-mono px-1 rounded" style={{ backgroundColor: colors.bgTertiary }}>TEMPLATE_CACHE_ENABLED=true</code>{t.cachedebugpanel453}
                  </div>
                )}
              </div>

              {/* Cache Store Settings */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: colors.textSecondary }}>{t.cachedebugpanel460}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-3 rounded" style={{
                    backgroundColor: colors.bgTertiary,
                    border: `1px solid ${cacheConfig.cache_store.driver.value !== 'redis' ? colors.warningBorder : colors.borderPrimary}`
                  }}>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono" style={{ color: colors.textMuted }}>{cacheConfig.cache_store.driver.env_key}</span>
                      <span className="font-bold" style={{ color: cacheConfig.cache_store.driver.value !== 'redis' ? colors.warningText : colors.textPrimary }}>
                        {cacheConfig.cache_store.driver.value}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded" style={{
                      backgroundColor: cacheConfig.cache_store.driver.is_set ? colors.successBg : colors.warningBg,
                      color: cacheConfig.cache_store.driver.is_set ? colors.successText : colors.warningText,
                      border: `1px solid ${cacheConfig.cache_store.driver.is_set ? colors.successBorder : colors.warningBorder}`
                    }}>
                      {cacheConfig.cache_store.driver.is_set ? 'SET' : 'DEFAULT'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono" style={{ color: colors.textMuted }}>{cacheConfig.cache_store.prefix.env_key}</span>
                      <span className="font-bold font-mono text-xs" style={{ color: colors.textPrimary }}>
                        {cacheConfig.cache_store.prefix.value}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded" style={{
                      backgroundColor: cacheConfig.cache_store.prefix.is_set ? colors.successBg : colors.warningBg,
                      color: cacheConfig.cache_store.prefix.is_set ? colors.successText : colors.warningText,
                      border: `1px solid ${cacheConfig.cache_store.prefix.is_set ? colors.successBorder : colors.warningBorder}`
                    }}>
                      {cacheConfig.cache_store.prefix.is_set ? 'SET' : 'DEFAULT'}
                    </span>
                  </div>
                </div>
                {cacheConfig.cache_store.driver.value !== 'redis' && (
                  <div className="mt-2 p-3 rounded text-sm" style={{ backgroundColor: colors.warningBg, border: `1px solid ${colors.warningBorder}`, color: colors.warningText }}>
                    {t.cachedebugpanel498}<strong>{cacheConfig.cache_store.driver.value}</strong>{t.cachedebugpanel498_2}<code className="font-mono px-1 rounded" style={{ backgroundColor: colors.bgTertiary }}>CACHE_STORE=redis</code>{t.cachedebugpanel498_3}
                  </div>
                )}
              </div>

              {/* Redis Connection Settings */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: colors.textSecondary }}>{t.cachedebugpanel505}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <span className="text-xs font-mono block" style={{ color: colors.textMuted }}>REDIS_CLIENT</span>
                    <span className="font-bold" style={{ color: colors.textPrimary }}>{cacheConfig.redis.client.value}</span>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <span className="text-xs font-mono block" style={{ color: colors.textMuted }}>REDIS_HOST</span>
                    <span className="font-bold font-mono" style={{ color: colors.textPrimary }}>{cacheConfig.redis.host.value}</span>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <span className="text-xs font-mono block" style={{ color: colors.textMuted }}>REDIS_PORT</span>
                    <span className="font-bold font-mono" style={{ color: colors.textPrimary }}>{cacheConfig.redis.port.value}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <span className="text-xs font-mono block" style={{ color: colors.textMuted }}>REDIS_PASSWORD</span>
                    <span className="font-bold" style={{ color: cacheConfig.redis.password_set ? colors.successText : colors.warningText }}>
                      {cacheConfig.redis.password_set ? '\u2022\u2022\u2022\u2022\u2022\u2022 (set)' : 'not set'}
                    </span>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <span className="text-xs font-mono block" style={{ color: colors.textMuted }}>DB Default</span>
                    <span className="font-bold font-mono" style={{ color: colors.textPrimary }}>{cacheConfig.redis.database_default}</span>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                    <span className="text-xs font-mono block" style={{ color: colors.textMuted }}>DB Cache</span>
                    <span className="font-bold font-mono" style={{ color: colors.textPrimary }}>{cacheConfig.redis.database_cache}</span>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button
                  label={t.cachedebugpanel541}
                  icon="pi pi-refresh"
                  onClick={fetchConfig}
                  disabled={configLoading}
                  severity="info"
                  size="small"
                />
              </div>
            </div>
          ) : null}
        </Card>

        {/* Cache Statistics */}
        <Card title={t.cachedebugpanel554} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          {loading && !stats ? (
            <div className="flex justify-center p-4">
              <ProgressSpinner />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="text-sm" style={{ color: colors.textMuted }}>{t.cachedebugpanel563}</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {stats.enabled ? t.cachedebugpanel565 : t.cachedebugpanel565_2}
                  </div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="text-sm" style={{ color: colors.textMuted }}>{t.cachedebugpanel569}</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.ttl_hours}h</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
                  <div className="text-sm" style={{ color: colors.textMuted }}>{t.cachedebugpanel573}</div>
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{stats.total_entries}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.infoBorder}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>{t.cachedebugpanel579}</div>
                  <div className="text-xl font-bold" style={{ color: colors.infoText }}>{stats.schema_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.cachedebugpanel581}</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.successBorder}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>{t.cachedebugpanel584}</div>
                  <div className="text-xl font-bold" style={{ color: colors.successText }}>{stats.gtree_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.cachedebugpanel586}</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.warningBorder}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>🧪 Test Caches</div>
                  <div className="text-xl font-bold" style={{ color: colors.warningText }}>{stats.test_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.cachedebugpanel591}</div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>{t.cachedebugpanel594}</div>
                  <div className="text-xl font-bold" style={{ color: colors.textMuted }}>{stats.compiled_entries}</div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>{t.cachedebugpanel596}</div>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        {/* Cache Actions */}
        <Card title={t.cachedebugpanel604_2} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                label={t.cachedebugpanel608}
                icon="pi pi-refresh"
                onClick={fetchStats}
                disabled={loading}
                severity="info"
              />
              <Button
                label={t.cachedebugpanel615}
                icon="pi pi-search"
                onClick={fetchInspector}
                disabled={loading}
                severity="help"
              />
              <Button
                label={t.cachedebugpanel622}
                icon="pi pi-trash"
                onClick={() => clearCache('template')}
                disabled={loading}
                severity="warning"
                //className={`p-button-text p-button-sm topbar-icon-btn`}
              />
              <Button
                label={t.cachedebugpanel630}
                icon="pi pi-times"
                onClick={() => clearCache('all')}
                disabled={loading}
                severity="danger"
              />
              <Button
                label={t.cachedebugpanel637}
                icon="pi pi-filter-slash"
                onClick={cleanupCache}
                disabled={loading}
                severity="secondary"
                tooltip={t.cachedebugpanel406}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.checked || false)}
              />
              <label htmlFor="autoRefresh" className="text-sm" style={{ color: colors.textPrimary }}>
                {t.cachedebugpanel652}
              </label>
            </div>
          </div>
        </Card>

        {/* Test Template Generation */}
        <Card title="Test Template Generation" className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: colors.textMuted }}>{t.cachedebugpanel662}</label>
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
                <label htmlFor="useCache" className="ml-2" style={{ color: colors.textPrimary }}>{t.cachedebugpanel677}</label>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                label={t.cachedebugpanel682}
                icon="pi pi-play"
                onClick={testGeneration}
                disabled={testLoading}
                severity="success"
              />
            </div>
          </div>

          {testResult && (
            <div className="mt-4 p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
              <h3 className="font-bold mb-2" style={{ color: colors.textPrimary }}>{t.cachedebugpanel693}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span style={{ color: colors.textMuted }}>Source:</span>{' '}
                  <span className="font-bold" style={{ color: testResult.source === 'cache' ? colors.successText : colors.warningText }}>
                    {testResult.source.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel702}</span>{' '}
                  <span style={{ color: colors.textPrimary }}>{testResult.execution_time_ms}ms</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel706}</span>{' '}
                  <span style={{ color: colors.textPrimary }}>{testResult.was_cached ? t.cachedebugpanel707 : t.cachedebugpanel707_2}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel710}</span>{' '}
                  <span style={{ color: colors.textPrimary }}>{testResult.compiled_size_kb} KB</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel714}</span>{' '}
                  <span className="text-xs" style={{ color: colors.textPrimary }}>{testResult.cache_key}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel718}</span>{' '}
                  <span className="text-xs" style={{ color: colors.textPrimary }}>{testResult.timestamp}</span>
                </div>
                {testResult.cached_for_hours && (
                  <div className="col-span-2">
                    <span style={{ color: colors.textMuted }}>{t.cachedebugpanel723}</span>{' '}
                    <span style={{ color: colors.textPrimary }}>{testResult.cached_for_hours}{t.cachedebugpanel724}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Cache Entries Table */}
        {stats && stats.entries.length > 0 && (
          <Card title={t.cachedebugpanel734} style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <DataTable
              value={stats.entries}
              paginator
              rows={10}
            >
              <Column
                field="type"
                header={t.cachedebugpanel742}
                sortable
                body={(row) => {
                  const typeConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
                    test: { label: t.cachedebugpanel746, bgColor: colors.warningBg, textColor: colors.warningText, borderColor: colors.warningBorder },
                    compiled: { label: t.cachedebugpanel747, bgColor: colors.bgTertiary, textColor: colors.textSecondary, borderColor: colors.borderPrimary },
                    schema: { label: t.cachedebugpanel748, bgColor: colors.infoBg, textColor: colors.infoText, borderColor: colors.infoBorder },
                    gtree: { label: t.cachedebugpanel749, bgColor: colors.successBg, textColor: colors.successText, borderColor: colors.successBorder }
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
                header={t.cachedebugpanel765}
                sortable
                body={(row) => row.size_kb.toFixed(2)}
              />
              <Column
                field="ttl_hours"
                header={t.cachedebugpanel771}
                sortable
                body={(row) => row.ttl_hours?.toFixed(2) || t.cachedebugpanel773}
              />
              <Column
                field="expires_at"
                header={t.cachedebugpanel777}
                sortable
                body={(row) => row.expires_at || t.cachedebugpanel779}
              />
            </DataTable>
          </Card>
        )}

        {/* Redis Inspector */}
        {showInspector && inspectorData && (
          <Card title={t.cachedebugpanel787} className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="mb-4 p-4 rounded" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel791}</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{inspectorData.cache_driver}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel795}</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>#{inspectorData.redis_database}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel799}</span>{' '}
                  <span className="font-bold" style={{ color: inspectorData.total_redis_keys === 0 ? colors.errorText : colors.successText }}>
                    {inspectorData.total_redis_keys}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel807}</span>{' '}
                  <span className="font-mono text-xs" style={{ color: colors.textPrimary }}>{inspectorData.redis_prefix || 'none'}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel811}</span>{' '}
                  <span className="font-mono text-xs" style={{ color: colors.textPrimary }}>{inspectorData.cache_prefix}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel815}</span>{' '}
                  <span className="font-mono text-xs font-bold" style={{ color: colors.warningText }}>{inspectorData.full_prefix}</span>
                </div>
              </div>
            </div>

            {inspectorData.total_redis_keys === 0 ? (
              <div className="p-8 text-center rounded" style={{ backgroundColor: colors.bgTertiary }}>
                <i className="pi pi-info-circle text-4xl mb-4" style={{ color: colors.warningText }}></i>
                <h3 className="text-xl mb-2" style={{ color: colors.textPrimary }}>{t.cachedebugpanel824}</h3>
                <p style={{ color: colors.textMuted }}>
                  {t.cachedebugpanel826}
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
                  header={t.cachedebugpanel837}
                  sortable
                  style={{ fontFamily: 'monospace', fontSize: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
                <Column
                  field="has_prefix"
                  header="Has Prefix"
                  sortable
                  body={(row) => (
                    <span style={{ color: row.has_prefix ? colors.successText : colors.errorText }}>
                      {row.has_prefix ? t.cachedebugpanel847 : t.cachedebugpanel847_2}
                    </span>
                  )}
                />
                <Column
                  field="type"
                  header={t.cachedebugpanel853}
                  sortable
                />
                <Column
                  field="size_bytes"
                  header={t.cachedebugpanel858}
                  sortable
                  body={(row) => row.size_bytes.toLocaleString()}
                />
                <Column
                  field="ttl"
                  header={t.cachedebugpanel864}
                  sortable
                  body={(row) => (
                    <div>
                      <div style={{ color: colors.textPrimary }}>{row.ttl_human || t.cachedebugpanel868}</div>
                      {row.ttl > 0 && <div className="text-xs" style={{ color: colors.textMuted }}>{row.ttl}s</div>}
                    </div>
                  )}
                />
                <Column
                  header={t.cachedebugpanel874}
                  body={(row) => (
                    <Button
                      icon="pi pi-eye"
                      label={t.cachedebugpanel878}
                      size="small"
                      onClick={() => viewKeyContent(row.raw_key)}
                      severity="info"
                      tooltip={t.cachedebugpanel646}
                    />
                  )}
                />
              </DataTable>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                label={t.cachedebugpanel891}
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
              <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>{t.cachedebugpanel904}</span>
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
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel925}</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{keyContent.type}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel929}</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>
                    {keyContent.ttl > 0 ? `${keyContent.ttl}s` : (keyContent.ttl === -1 ? t.cachedebugpanel931 : t.cachedebugpanel931_2)}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel935}</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{keyContent.size_bytes}{t.cachedebugpanel936}</span>
                </div>
                <div>
                  <span style={{ color: colors.textMuted }}>{t.cachedebugpanel939}</span>{' '}
                  <span className="font-bold" style={{ color: colors.textPrimary }}>{(keyContent.size_bytes / 1024).toFixed(2)} KB</span>
                </div>
              </div>

              <div className="p-4 rounded flex-1 flex flex-col min-h-0" style={{ backgroundColor: colors.bgTertiary }}>
                <h4 className="mb-2 flex-shrink-0" style={{ color: colors.textMuted }}>{t.cachedebugpanel945}</h4>
                <pre className="p-3 rounded text-xs overflow-auto flex-1" style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}` }}>
                  {keyContent.content}
                </pre>
              </div>

              <div className="mt-4 flex justify-end flex-shrink-0">
                <Button
                  label={t.cachedebugpanel953}
                  icon="pi pi-times"
                  onClick={() => setShowContentDialog(false)}
                  severity="secondary"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <i className="pi pi-info-circle text-4xl mb-4" style={{ color: colors.warningText }}></i>
              <p style={{ color: colors.textMuted }}>{t.cachedebugpanel963}</p>
              <div className="mt-4">
                <Button
                  label={t.cachedebugpanel966}
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
