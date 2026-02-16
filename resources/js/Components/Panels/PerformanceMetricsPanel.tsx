import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Chart } from 'primereact/chart';
import { TabView, TabPanel } from 'primereact/tabview';
import { apiClient as api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';

interface OperationStats {
  operation: string;
  label: string;
  total_count: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  avg_memory_mb: number;
  cache_hit_rate: number;
}

interface OverviewData {
  generation: OperationStats;
  schema_load: OperationStats;
  gtree_build: OperationStats;
  diff_compute: OperationStats;
  translation_load: OperationStats;
  _totals: {
    total_operations: number;
    unique_users: number;
    total_duration_ms: number;
  };
}

interface SlowOperation {
  id: number;
  operation: string;
  operation_label: string;
  operation_detail: string | null;
  duration_ms: number;
  formatted_duration: string;
  memory_mb: number | null;
  tables_count: number | null;
  fields_count: number | null;
  from_cache: boolean;
  subscription_type: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
}

interface DailyDataOperation {
  count: number;
  avg_duration: number;
  max_duration: number;
  cache_hits: number;
}

interface VisitorSummary {
  today: number;
  yesterday: number;
  this_week: number;
  this_month: number;
  overall: number;
  today_authenticated: number;
  today_anonymous: number;
}

interface VisitorChartDay {
  date: string;
  label: string;
  total: number;
  authenticated: number;
  anonymous: number;
}

interface VisitorReferrer {
  referrer: string;
  count: number;
}

interface VisitorStats {
  summary: VisitorSummary;
  chart: VisitorChartDay[];
  top_referrers: VisitorReferrer[];
}

interface DailyData {
  date: string;
  generation?: DailyDataOperation;
  schema_load?: DailyDataOperation;
  gtree_build?: DailyDataOperation;
  diff_compute?: DailyDataOperation;
  translation_load?: DailyDataOperation;
}

const OPERATION_OPTIONS = [
  { label: 'Alle Operationen', value: '' },
  { label: 'Code Generation', value: 'generation' },
  { label: 'Schema Loading', value: 'schema_load' },
  { label: 'Gtree Building', value: 'gtree_build' },
  { label: 'Diff Computation', value: 'diff_compute' },
  { label: 'Translation Loading', value: 'translation_load' },
];

const OPERATION_COLORS: Record<string, string> = {
  generation: '#60a5fa',
  schema_load: '#34d399',
  gtree_build: '#f472b6',
  diff_compute: '#fbbf24',
  translation_load: '#a78bfa',
};

export default function PerformanceMetricsPanel() {
  const toast = useToast();
  const { colors } = useTheme();

  const [dateFrom, setDateFrom] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [dateTo, setDateTo] = useState<Date | null>(() => new Date());
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [slowOperations, setSlowOperations] = useState<SlowOperation[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  const formatDateForApi = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const loadOverview = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('from', formatDateForApi(dateFrom));
      params.append('to', formatDateForApi(dateTo));

      const response = await api.request(`/admin/performance/overview?${params.toString()}`);
      setOverview(response.data || null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.showError('Fehler beim Laden der Übersicht: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, toast]);

  const loadDailyStats = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    try {
      const params = new URLSearchParams();
      params.append('from', formatDateForApi(dateFrom));
      params.append('to', formatDateForApi(dateTo));

      const response = await api.request(`/admin/performance/daily?${params.toString()}`);
      setDailyData(response.data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.showError('Fehler beim Laden der Tagesstatistiken: ' + errorMessage);
    }
  }, [dateFrom, dateTo, toast]);

  const loadSlowOperations = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    try {
      const params = new URLSearchParams();
      params.append('from', formatDateForApi(dateFrom));
      params.append('to', formatDateForApi(dateTo));
      params.append('limit', '50');

      const response = await api.request(`/admin/performance/slow?${params.toString()}`);
      setSlowOperations(response.data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.showError('Fehler beim Laden langsamer Operationen: ' + errorMessage);
    }
  }, [dateFrom, dateTo, toast]);

  const loadVisitorStats = useCallback(async () => {
    setLoadingVisitors(true);
    try {
      const response = await api.request('/admin/visitors/stats');
      setVisitorStats(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.showError('Fehler beim Laden der Besucherstatistiken: ' + errorMessage);
    } finally {
      setLoadingVisitors(false);
    }
  }, [toast]);

  const loadAllData = useCallback(() => {
    loadOverview();
    loadDailyStats();
    loadSlowOperations();
    loadVisitorStats();
  }, [loadOverview, loadDailyStats, loadSlowOperations, loadVisitorStats]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const formatDuration = (ms: number): string => {
    if (ms >= 1000) {
      return (ms / 1000).toFixed(2) + 's';
    }
    return ms + 'ms';
  };

  const getDailyChartData = () => {
    const labels = dailyData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });

    const operations = ['generation', 'schema_load', 'gtree_build', 'diff_compute', 'translation_load'] as const;

    const datasets = operations.map(op => ({
      label: OPERATION_OPTIONS.find(o => o.value === op)?.label || op,
      data: dailyData.map(d => {
        const opData = d[op];
        return opData?.count || 0;
      }),
      borderColor: OPERATION_COLORS[op],
      backgroundColor: OPERATION_COLORS[op] + '20',
      fill: true,
      tension: 0.4,
    }));

    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colors.textSecondary,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textSecondary },
        grid: { color: colors.borderPrimary },
      },
      y: {
        ticks: { color: colors.textSecondary },
        grid: { color: colors.borderPrimary },
      },
    },
  };

  const operationBadge = (operation: string) => {
    const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      generation: 'info',
      schema_load: 'success',
      gtree_build: 'warning',
      diff_compute: 'secondary',
      translation_load: 'secondary',
    };
    const label = OPERATION_OPTIONS.find(o => o.value === operation)?.label || operation;
    return <Tag value={label} severity={severityMap[operation] || 'info'} />;
  };

  const subscriptionBadge = (type: string | null) => {
    if (!type) return <Tag value="Unknown" severity="secondary" />;
    const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      free: 'secondary',
      patron_monthly: 'success',
      patron_annual: 'info',
    };
    return <Tag value={type} severity={severityMap[type] || 'info'} />;
  };

  const renderOverviewCards = () => {
    if (!overview) return null;

    const operations = [
      overview.generation,
      overview.schema_load,
      overview.gtree_build,
      overview.diff_compute,
      overview.translation_load,
    ].filter(Boolean);

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {operations.map(op => (
          <Card key={op.operation} style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.textSecondary }}>{op.label}</p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{op.total_count.toLocaleString()}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                <span style={{ color: colors.infoText }}>{formatDuration(op.avg_duration_ms)}</span> avg
              </p>
              {op.cache_hit_rate > 0 && (
                <p className="text-xs" style={{ color: colors.successText }}>{op.cache_hit_rate}% cache</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTotalSummary = () => {
    if (!overview?._totals) return null;

    return (
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="text-center">
            <p className="text-sm" style={{ color: colors.textSecondary }}>Operationen gesamt</p>
            <p className="text-3xl font-bold" style={{ color: colors.infoText }}>{overview._totals.total_operations.toLocaleString()}</p>
          </div>
        </Card>
        <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="text-center">
            <p className="text-sm" style={{ color: colors.textSecondary }}>Eindeutige User</p>
            <p className="text-3xl font-bold" style={{ color: colors.successText }}>{overview._totals.unique_users.toLocaleString()}</p>
          </div>
        </Card>
        <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
          <div className="text-center">
            <p className="text-sm" style={{ color: colors.textSecondary }}>Gesamtdauer</p>
            <p className="text-3xl font-bold" style={{ color: colors.accent }}>{formatDuration(overview._totals.total_duration_ms)}</p>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4 h-full overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <i className="pi pi-chart-line" style={{ color: colors.infoText }}></i>
        Performance Metrics
      </h1>

      <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Von</label>
            <Calendar
              value={dateFrom}
              onChange={(e) => setDateFrom(e.value as Date)}
              dateFormat="dd.mm.yy"
              showIcon
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Bis</label>
            <Calendar
              value={dateTo}
              onChange={(e) => setDateTo(e.value as Date)}
              dateFormat="dd.mm.yy"
              showIcon
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Operation</label>
            <Dropdown
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.value)}
              options={OPERATION_OPTIONS}
              className="w-48"
            />
          </div>
          <Button
            icon="pi pi-refresh"
            label="Aktualisieren"
            onClick={loadAllData}
            loading={loading}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center p-8">
          <ProgressSpinner />
        </div>
      ) : (
        <TabView>
          <TabPanel header="Übersicht" leftIcon="pi pi-chart-bar mr-2">
            {renderTotalSummary()}
            {renderOverviewCards()}

            {dailyData.length > 0 && (
              <Card className="mt-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>Tägliche Operationen</h3>
                <div style={{ height: '300px' }}>
                  <Chart type="line" data={getDailyChartData()} options={chartOptions} />
                </div>
              </Card>
            )}
          </TabPanel>

          <TabPanel header="Langsame Operationen" leftIcon="pi pi-exclamation-triangle mr-2">
            <DataTable
              value={slowOperations}
              paginator
              rows={20}
              rowsPerPageOptions={[10, 20, 50]}
              stripedRows
              size="small"
              emptyMessage="Keine langsamen Operationen gefunden."
            >
              <Column
                header="Operation"
                body={(row: SlowOperation) => operationBadge(row.operation)}
                style={{ width: '140px' }}
              />
              <Column
                field="operation_detail"
                header="Details"
                body={(row: SlowOperation) => row.operation_detail || '-'}
              />
              <Column
                header="Dauer"
                body={(row: SlowOperation) => (
                  <span style={{ color: row.duration_ms > 5000 ? colors.errorText : colors.warningText, fontWeight: row.duration_ms > 5000 ? 'bold' : 'normal' }}>
                    {row.formatted_duration}
                  </span>
                )}
                style={{ width: '100px' }}
              />
              <Column
                header="Memory"
                body={(row: SlowOperation) => row.memory_mb ? `${row.memory_mb} MB` : '-'}
                style={{ width: '80px' }}
              />
              <Column
                header="Tabellen"
                body={(row: SlowOperation) => row.tables_count ?? '-'}
                style={{ width: '80px' }}
              />
              <Column
                header="User"
                body={(row: SlowOperation) => row.user?.name || '-'}
              />
              <Column
                header="Typ"
                body={(row: SlowOperation) => subscriptionBadge(row.subscription_type)}
                style={{ width: '120px' }}
              />
              <Column
                header="Cache"
                body={(row: SlowOperation) => (
                  <Tag
                    value={row.from_cache ? 'Hit' : 'Miss'}
                    severity={row.from_cache ? 'success' : 'warning'}
                  />
                )}
                style={{ width: '80px' }}
              />
              <Column
                header="Zeit"
                body={(row: SlowOperation) => new Date(row.created_at).toLocaleString('de-DE')}
                style={{ width: '150px' }}
              />
            </DataTable>
          </TabPanel>

          <TabPanel header="Besucher" leftIcon="pi pi-users mr-2">
            {loadingVisitors ? (
              <div className="flex justify-center p-8">
                <ProgressSpinner />
              </div>
            ) : visitorStats ? (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                  <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.textSecondary }}>Heute</p>
                      <p className="text-3xl font-bold" style={{ color: colors.infoText }}>{visitorStats.summary.today}</p>
                      <div className="flex justify-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: colors.successText }}>{visitorStats.summary.today_authenticated} angemeldet</span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>{visitorStats.summary.today_anonymous} anonym</span>
                      </div>
                    </div>
                  </Card>
                  <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.textSecondary }}>Gestern</p>
                      <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{visitorStats.summary.yesterday}</p>
                    </div>
                  </Card>
                  <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.textSecondary }}>Diese Woche</p>
                      <p className="text-3xl font-bold" style={{ color: colors.accent }}>{visitorStats.summary.this_week}</p>
                    </div>
                  </Card>
                  <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.textSecondary }}>Dieser Monat</p>
                      <p className="text-3xl font-bold" style={{ color: colors.warningText }}>{visitorStats.summary.this_month}</p>
                    </div>
                  </Card>
                  <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.textSecondary }}>Gesamt</p>
                      <p className="text-3xl font-bold" style={{ color: colors.successText }}>{visitorStats.summary.overall.toLocaleString()}</p>
                    </div>
                  </Card>
                </div>

                {/* Visitor Chart - Last 30 Days */}
                {visitorStats.chart.length > 0 && (
                  <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>Besucher der letzten 30 Tage</h3>
                    <div style={{ height: '350px' }}>
                      <Chart
                        type="bar"
                        data={{
                          labels: visitorStats.chart.map(d => d.label),
                          datasets: [
                            {
                              label: 'Angemeldet',
                              data: visitorStats.chart.map(d => d.authenticated),
                              backgroundColor: '#34d399',
                              borderRadius: 3,
                              stack: 'visitors',
                            },
                            {
                              label: 'Anonym',
                              data: visitorStats.chart.map(d => d.anonymous),
                              backgroundColor: '#60a5fa',
                              borderRadius: 3,
                              stack: 'visitors',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                              labels: { color: colors.textSecondary },
                            },
                            tooltip: {
                              callbacks: {
                                footer: (items: any[]) => {
                                  const dayIndex = items[0]?.dataIndex;
                                  if (dayIndex !== undefined && visitorStats.chart[dayIndex]) {
                                    return 'Gesamt: ' + visitorStats.chart[dayIndex].total;
                                  }
                                  return '';
                                },
                              },
                            },
                          },
                          scales: {
                            x: {
                              stacked: true,
                              ticks: { color: colors.textSecondary },
                              grid: { color: colors.borderPrimary },
                            },
                            y: {
                              stacked: true,
                              ticks: { color: colors.textSecondary, stepSize: 1 },
                              grid: { color: colors.borderPrimary },
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>
                  </Card>
                )}

                {/* Top Referrers */}
                {visitorStats.top_referrers.length > 0 && (
                  <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>Top Referrer (letzte 30 Tage)</h3>
                    <DataTable
                      value={visitorStats.top_referrers}
                      size="small"
                      stripedRows
                    >
                      <Column
                        field="referrer"
                        header="Referrer"
                        body={(row: VisitorReferrer) => (
                          <span className="text-sm" style={{ color: colors.infoText, wordBreak: 'break-all' }}>{row.referrer}</span>
                        )}
                      />
                      <Column
                        field="count"
                        header="Besuche"
                        style={{ width: '100px', textAlign: 'right' }}
                        body={(row: VisitorReferrer) => (
                          <span className="font-bold" style={{ color: colors.textPrimary }}>{row.count}</span>
                        )}
                      />
                    </DataTable>
                  </Card>
                )}
              </div>
            ) : (
              <p style={{ color: colors.textSecondary }}>Keine Besucherdaten vorhanden.</p>
            )}
          </TabPanel>

          <TabPanel header="Details" leftIcon="pi pi-list mr-2">
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  overview.generation,
                  overview.schema_load,
                  overview.gtree_build,
                  overview.diff_compute,
                  overview.translation_load,
                ].filter(Boolean).map(op => (
                  <Card key={op.operation} style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>{op.label}</h3>
                      {operationBadge(op.operation)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p style={{ color: colors.textSecondary }}>Anzahl</p>
                        <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>{op.total_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p style={{ color: colors.textSecondary }}>Cache Hit Rate</p>
                        <p className="text-xl font-bold" style={{ color: colors.successText }}>{op.cache_hit_rate}%</p>
                      </div>
                      <div>
                        <p style={{ color: colors.textSecondary }}>Avg Dauer</p>
                        <p className="text-xl font-bold" style={{ color: colors.infoText }}>{formatDuration(op.avg_duration_ms)}</p>
                      </div>
                      <div>
                        <p style={{ color: colors.textSecondary }}>Max Dauer</p>
                        <p className="text-xl font-bold" style={{ color: colors.errorText }}>{formatDuration(op.max_duration_ms)}</p>
                      </div>
                      <div>
                        <p style={{ color: colors.textSecondary }}>Min Dauer</p>
                        <p className="text-xl font-bold" style={{ color: colors.successText }}>{formatDuration(op.min_duration_ms)}</p>
                      </div>
                      <div>
                        <p style={{ color: colors.textSecondary }}>Avg Memory</p>
                        <p className="text-xl font-bold" style={{ color: colors.accent }}>{op.avg_memory_mb} MB</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabPanel>
        </TabView>
      )}
    </div>
  );
}
