import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { apiClient as api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface SellerPayout {
  user_id: number;
  username: string;
  name: string;
  email: string;
  company_name: string;
  company_country: string;
  seller_type: string;
  payout_method: 'bank_transfer' | 'paypal';
  payout_destination: string; // IBAN or PayPal email
  sales_count: number;
  gross_amount: number;
  platform_fee: number;
  vat_amount: number;
  net_amount: number;
}

interface PayoutSummary {
  total_gross: number;
  total_platform_fee: number;
  total_vat: number;
  total_net: number;
  bank_transfer_count: number;
  bank_transfer_total: number;
  paypal_count: number;
  paypal_total: number;
}

export default function PayoutAdminPanel() {
  const toast = useToast();
  const { colors } = useTheme();
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);

  // Date range state
  const [dateFrom, setDateFrom] = useState<Date | null>(() => {
    // Default to first day of previous month
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    return date;
  });
  const [dateTo, setDateTo] = useState<Date | null>(() => {
    // Default to last day of previous month
    const date = new Date();
    date.setDate(0); // Last day of previous month
    return date;
  });

  // Handle "Von" date change - automatically set "Bis" to end of same month
  const handleDateFromChange = (newDate: Date | null) => {
    setDateFrom(newDate);
    if (newDate) {
      // Set "Bis" to last day of the same month
      const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
      setDateTo(endOfMonth);
    }
  };

  // Data state
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<SellerPayout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);

  // Payout state
  const [processingPayout, setProcessingPayout] = useState<number | null>(null);
  const [processingAllPaypal, setProcessingAllPaypal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    type: 'single' | 'all_paypal' | 'all_bank';
    seller?: SellerPayout;
  }>({ visible: false, type: 'single' });

  // Split sellers by payout method
  const bankTransferSellers = sellers.filter(s => s.payout_method === 'bank_transfer');
  const paypalSellers = sellers.filter(s => s.payout_method === 'paypal');

  // Load pending payouts
  const loadPendingPayouts = useCallback(async () => {
    if (!dateFrom || !dateTo) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('from', dateFrom.toISOString().split('T')[0]);
      params.append('to', dateTo.toISOString().split('T')[0]);

      const response = await api.request(`/admin/payouts/pending?${params.toString()}`);
      setSellers(response.sellers || []);
      setSummary(response.summary || null);
    } catch (error: any) {
      toast.showError(t.payoutadminpanel105 + (error.message || t.payoutadminpanel105_2));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, toast]);

  useEffect(() => {
    loadPendingPayouts();
  }, [loadPendingPayouts]);

  // Process single payout
  const processSinglePayout = async (seller: SellerPayout) => {
    setProcessingPayout(seller.user_id);
    try {
      await api.request(`/admin/payouts/process/${seller.user_id}`, {
        method: 'POST',
        body: JSON.stringify({
          from: dateFrom?.toISOString().split('T')[0],
          to: dateTo?.toISOString().split('T')[0],
        }),
      });
      toast.showSuccess(`${t.payoutadminpanel126}${seller.name}${t.payoutadminpanel126_2}`);
      loadPendingPayouts();
    } catch (error: any) {
      toast.showError(t.payoutadminpanel129 + (error.message || t.payoutadminpanel129_2));
    } finally {
      setProcessingPayout(null);
      setConfirmDialog({ visible: false, type: 'single' });
    }
  };

  // Process all PayPal payouts
  const processAllPaypalPayouts = async () => {
    setProcessingAllPaypal(true);
    try {
      await api.request('/admin/payouts/process-paypal-batch', {
        method: 'POST',
        body: JSON.stringify({
          from: dateFrom?.toISOString().split('T')[0],
          to: dateTo?.toISOString().split('T')[0],
        }),
      });
      toast.showSuccess(`${paypalSellers.length}${t.payoutadminpanel147}`);
      loadPendingPayouts();
    } catch (error: any) {
      toast.showError(t.payoutadminpanel150 + (error.message || t.payoutadminpanel150_2));
    } finally {
      setProcessingAllPaypal(false);
      setConfirmDialog({ visible: false, type: 'all_paypal' });
    }
  };

  // Export SEPA XML
  const exportSepaXml = async () => {
    if (!dateFrom || !dateTo) return;

    try {
      const params = new URLSearchParams();
      params.append('from', dateFrom.toISOString().split('T')[0]);
      params.append('to', dateTo.toISOString().split('T')[0]);

      // Get token for authenticated download
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/admin/payouts/export-sepa?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Check if response is JSON error
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || t.payoutadminpanel179);
        }
        throw new Error(`${t.payoutadminpanel181}(${response.status})`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sepa-payouts-${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.showSuccess(t.payoutadminpanel195);
    } catch (error: any) {
      toast.showError(t.payoutadminpanel197 + (error.message || t.payoutadminpanel197_2));
    }
  };

  // Export CSV
  const exportCsv = async () => {
    if (!dateFrom || !dateTo) return;

    try {
      const params = new URLSearchParams();
      params.append('from', dateFrom.toISOString().split('T')[0]);
      params.append('to', dateTo.toISOString().split('T')[0]);

      // Get token for authenticated download
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/admin/payouts/export-csv?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Check if response is JSON error
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || t.payoutadminpanel223);
        }
        throw new Error(`${t.payoutadminpanel225}(${response.status})`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sepa-payouts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.showSuccess(t.payoutadminpanel239);
    } catch (error: any) {
      toast.showError(t.payoutadminpanel241 + (error.message || t.payoutadminpanel241_2));
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  // Seller type badge
  const sellerTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; severity: 'success' | 'info' | 'warning' | 'danger' }> = {
      'at_business': { label: t.payoutadminpanel256, severity: 'success' },
      'eu_vat': { label: t.payoutadminpanel257, severity: 'info' },
      'eu_private': { label: t.payoutadminpanel258, severity: 'warning' },
      'non_eu_business': { label: t.payoutadminpanel259, severity: 'info' },
      'non_eu_private': { label: t.payoutadminpanel260, severity: 'danger' },
    };
    const config = typeMap[type] || { label: type, severity: 'info' as const };
    return <Tag value={config.label} severity={config.severity} />;
  };

  // Amount template for DataTable
  const amountTemplate = (rowData: SellerPayout, field: keyof SellerPayout) => {
    const value = rowData[field] as number;
    return <span className="font-semibold" style={{ color: colors.textPrimary }}>{formatCurrency(value)}</span>;
  };

  // Action template for DataTable
  const actionTemplate = (rowData: SellerPayout) => {
    return (
      <Button
        icon="pi pi-send"
        label={t.payoutadminpanel277}
        size="small"
        severity={rowData.payout_method === 'paypal' ? 'info' : 'success'}
        loading={processingPayout === rowData.user_id}
        onClick={() => setConfirmDialog({ visible: true, type: 'single', seller: rowData })}
      />
    );
  };

  // Payout destination template
  const destinationTemplate = (rowData: SellerPayout) => {
    if (rowData.payout_method === 'paypal') {
      return (
        <div className="flex items-center gap-2">
          <i className="pi pi-paypal" style={{ color: colors.infoText }}></i>
          <span style={{ color: colors.textPrimary }}>{rowData.payout_destination}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <i className="pi pi-building" style={{ color: colors.successText }}></i>
        <span className="font-mono text-sm" style={{ color: colors.textPrimary }}>{rowData.payout_destination}</span>
      </div>
    );
  };

  return (
    <div className="p-4 h-full overflow-auto" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <i className="pi pi-wallet" style={{ color: colors.successText }}></i>
        {t.payoutadminpanel308}
      </h1>

      {/* Date Range Filter */}
      <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.payoutadminpanel315}</label>
            <Calendar
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.value as Date)}
              dateFormat="dd.mm.yy"
              showIcon
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>{t.payoutadminpanel325}</label>
            <Calendar
              value={dateTo}
              onChange={(e) => setDateTo(e.value as Date)}
              dateFormat="dd.mm.yy"
              showIcon
              className="w-40"
            />
          </div>
          <Button
            icon="pi pi-refresh"
            label={t.payoutadminpanel336}
            onClick={loadPendingPayouts}
            loading={loading}
          />
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>{t.payoutadminpanel348}</p>
              <p className="text-2xl font-bold" style={{ color: colors.infoText }}>{formatCurrency(summary.total_gross)}</p>
            </div>
          </Card>
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>{t.payoutadminpanel354}</p>
              <p className="text-2xl font-bold" style={{ color: colors.accent }}>{formatCurrency(summary.total_platform_fee)}</p>
            </div>
          </Card>
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>{t.payoutadminpanel360}</p>
              <p className="text-2xl font-bold" style={{ color: colors.warningText }}>{formatCurrency(summary.total_vat)}</p>
            </div>
          </Card>
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>{t.payoutadminpanel366}</p>
              <p className="text-2xl font-bold" style={{ color: colors.successText }}>{formatCurrency(summary.total_net)}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Verification Info */}
      {summary && (
        <Message
          severity="info"
          className="w-full mb-4"
          text={`${t.payoutadminpanel378}${formatCurrency(summary.total_gross)}${t.payoutadminpanel378_2}${formatCurrency(summary.total_platform_fee)}${t.payoutadminpanel378_4}${formatCurrency(summary.total_vat)} = ${formatCurrency(summary.total_net)} (${t.payoutadminpanel378_5}${formatCurrency(summary.bank_transfer_total)} + PayPal: ${formatCurrency(summary.paypal_total)})`}
        />
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <ProgressSpinner />
        </div>
      ) : sellers.length === 0 ? (
        <Message
          severity="info"
          text={t.payoutadminpanel389}
          className="w-full"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bank Transfer Section */}
          <Card
            style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
            title={
              <div className="flex items-center justify-between" style={{ color: colors.textPrimary }}>
                <span className="flex items-center gap-2">
                  <i className="pi pi-building" style={{ color: colors.successText }}></i>
                  {t.payoutadminpanel401}({bankTransferSellers.length})
                </span>
                <Tag
                  value={formatCurrency(summary?.bank_transfer_total || 0)}
                  severity="success"
                />
              </div>
            }
          >
            {bankTransferSellers.length === 0 ? (
              <p className="text-center py-4" style={{ color: colors.textSecondary }}>{t.payoutadminpanel411}</p>
            ) : (
              <>
                <DataTable
                  value={bankTransferSellers}
                  size="small"
                  stripedRows
                  className="text-sm"
                >
                  <Column field="name" header={t.payoutadminpanel420} />
                  <Column field="company_name" header={t.payoutadminpanel421} />
                  <Column
                    header={t.payoutadminpanel427}
                    body={(row) => sellerTypeBadge(row.seller_type)}
                  />
                  <Column
                    header="IBAN"
                    body={destinationTemplate}
                  />
                  <Column
                    header={t.payoutadminpanel431}
                    body={(row) => amountTemplate(row, 'net_amount')}
                    style={{ textAlign: 'right' }}
                  />
                  <Column
                    header=""
                    body={actionTemplate}
                    style={{ width: '120px' }}
                  />
                </DataTable>

                {/* Export Buttons */}
                <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.borderPrimary}` }}>
                  <Button
                    icon="pi pi-file-excel"
                    label="SEPA XML"
                    severity="success"
                    size="small"
                    onClick={exportSepaXml}
                    tooltip={t.payoutadminpanel450}
                  />
                  <Button
                    icon="pi pi-file"
                    label="CSV"
                    severity="secondary"
                    size="small"
                    onClick={exportCsv}
                    tooltip={t.payoutadminpanel458}
                  />
                </div>
              </>
            )}
          </Card>

          {/* PayPal Section */}
          <Card
            style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}
            title={
              <div className="flex items-center justify-between" style={{ color: colors.textPrimary }}>
                <span className="flex items-center gap-2">
                  <i className="pi pi-paypal" style={{ color: colors.infoText }}></i>
                  PayPal ({paypalSellers.length})
                </span>
                <Tag
                  value={formatCurrency(summary?.paypal_total || 0)}
                  severity="info"
                />
              </div>
            }
          >
            {paypalSellers.length > 0 && (
              <div className="mb-4">
                <Button
                  icon="pi pi-send"
                  label={`${t.payoutadminpanel489}${paypalSellers.length}${t.payoutadminpanel485}`}
                  severity="info"
                  className="w-full"
                  loading={processingAllPaypal}
                  onClick={() => setConfirmDialog({ visible: true, type: 'all_paypal' })}
                />
              </div>
            )}
            {paypalSellers.length === 0 ? (
              <p className="text-center py-4" style={{ color: colors.textSecondary }}>{t.payoutadminpanel494}</p>
            ) : (
              <DataTable
                value={paypalSellers}
                size="small"
                stripedRows
                className="text-sm"
              >
                <Column field="name" header={t.payoutadminpanel506} />
                <Column
                  header={t.payoutadminpanel504}
                  body={(row) => sellerTypeBadge(row.seller_type)}
                />
                <Column
                  header="PayPal"
                  body={destinationTemplate}
                />
                <Column
                  header={t.payoutadminpanel512}
                  body={(row) => amountTemplate(row, 'net_amount')}
                  style={{ textAlign: 'right' }}
                />
                <Column
                  header=""
                  body={actionTemplate}
                  style={{ width: '120px' }}
                />
              </DataTable>
            )}
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        header={t.payoutadminpanel529}
        visible={confirmDialog.visible}
        onHide={() => setConfirmDialog({ visible: false, type: 'single' })}
        style={{ width: '450px' }}
        className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label={t.payoutadminpanel539}
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setConfirmDialog({ visible: false, type: 'single' })}
            />
            <Button
              label={t.payoutadminpanel545}
              icon="pi pi-check"
              severity="success"
              loading={processingPayout !== null || processingAllPaypal}
              onClick={() => {
                if (confirmDialog.type === 'single' && confirmDialog.seller) {
                  processSinglePayout(confirmDialog.seller);
                } else if (confirmDialog.type === 'all_paypal') {
                  processAllPaypalPayouts();
                }
              }}
            />
          </div>
        }
      >
        {confirmDialog.type === 'single' && confirmDialog.seller && (
          <div className="space-y-4">
            <p style={{ color: colors.textPrimary }}>{t.payoutadminpanel562}<strong>{confirmDialog.seller.name}</strong>{t.payoutadminpanel562_2}</p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel565}</span>
                <span style={{ color: colors.textPrimary }}>{confirmDialog.seller.payout_method === 'paypal' ? 'PayPal' : t.payoutadminpanel566}</span>
                <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel567}</span>
                <span className="font-mono" style={{ color: colors.textPrimary }}>{confirmDialog.seller.payout_destination}</span>
                <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel569}</span>
                <span style={{ color: colors.textPrimary }}>{formatCurrency(confirmDialog.seller.gross_amount)}</span>
                <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel571}</span>
                <span style={{ color: colors.textPrimary }}>{formatCurrency(confirmDialog.seller.platform_fee)}</span>
                {confirmDialog.seller.vat_amount > 0 && (
                  <>
                    <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel575}</span>
                    <span style={{ color: colors.textPrimary }}>{formatCurrency(confirmDialog.seller.vat_amount)}</span>
                  </>
                )}
                <Divider className="col-span-2 my-2" />
                <span className="font-bold" style={{ color: colors.textSecondary }}>{t.payoutadminpanel580}</span>
                <span className="font-bold" style={{ color: colors.successText }}>{formatCurrency(confirmDialog.seller.net_amount)}</span>
              </div>
            </div>
          </div>
        )}
        {confirmDialog.type === 'all_paypal' && (
          <div className="space-y-4">
            <p style={{ color: colors.textPrimary }}>{t.payoutadminpanel588_3}<strong>alle {paypalSellers.length}{t.payoutadminpanel588}</strong>{t.payoutadminpanel588_2}</p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel591}</span>
                <span style={{ color: colors.textPrimary }}>{paypalSellers.length}</span>
                <span style={{ color: colors.textSecondary }}>{t.payoutadminpanel593}</span>
                <span className="font-bold" style={{ color: colors.successText }}>{formatCurrency(summary?.paypal_total || 0)}</span>
              </div>
            </div>
            <Message
              severity="warn"
              text={t.payoutadminpanel599}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
