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
      toast.showError('Fehler beim Laden: ' + (error.message || 'Unbekannter Fehler'));
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
      toast.showSuccess(`Auszahlung an ${seller.name} erfolgreich verarbeitet`);
      loadPendingPayouts();
    } catch (error: any) {
      toast.showError('Fehler: ' + (error.message || 'Unbekannter Fehler'));
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
      toast.showSuccess(`${paypalSellers.length} PayPal-Auszahlungen erfolgreich verarbeitet`);
      loadPendingPayouts();
    } catch (error: any) {
      toast.showError('Fehler: ' + (error.message || 'Unbekannter Fehler'));
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
          throw new Error(error.error || 'Export fehlgeschlagen');
        }
        throw new Error(`Export fehlgeschlagen (${response.status})`);
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

      toast.showSuccess('SEPA XML exportiert');
    } catch (error: any) {
      toast.showError('Export-Fehler: ' + (error.message || 'Unbekannter Fehler'));
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
          throw new Error(error.error || 'Export fehlgeschlagen');
        }
        throw new Error(`Export fehlgeschlagen (${response.status})`);
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

      toast.showSuccess('CSV exportiert');
    } catch (error: any) {
      toast.showError('Export-Fehler: ' + (error.message || 'Unbekannter Fehler'));
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
      'at_business': { label: 'AT Unternehmen', severity: 'success' },
      'eu_vat': { label: 'EU + UID', severity: 'info' },
      'eu_private': { label: 'EU Privat', severity: 'warning' },
      'non_eu_business': { label: 'Non-EU Business', severity: 'info' },
      'non_eu_private': { label: 'Non-EU Privat', severity: 'danger' },
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
        label="Auszahlen"
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
        Auszahlungen verwalten
      </h1>

      {/* Date Range Filter */}
      <Card className="mb-4" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Von</label>
            <Calendar
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.value as Date)}
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
          <Button
            icon="pi pi-refresh"
            label="Aktualisieren"
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
              <p className="text-sm" style={{ color: colors.textSecondary }}>Brutto-Umsatz</p>
              <p className="text-2xl font-bold" style={{ color: colors.infoText }}>{formatCurrency(summary.total_gross)}</p>
            </div>
          </Card>
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>Platform Fee (20%)</p>
              <p className="text-2xl font-bold" style={{ color: colors.accent }}>{formatCurrency(summary.total_platform_fee)}</p>
            </div>
          </Card>
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>MwSt abgezogen</p>
              <p className="text-2xl font-bold" style={{ color: colors.warningText }}>{formatCurrency(summary.total_vat)}</p>
            </div>
          </Card>
          <Card style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="text-center">
              <p className="text-sm" style={{ color: colors.textSecondary }}>Auszuzahlen</p>
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
          text={`Kontrolle: Brutto ${formatCurrency(summary.total_gross)} - Platform ${formatCurrency(summary.total_platform_fee)} - MwSt ${formatCurrency(summary.total_vat)} = ${formatCurrency(summary.total_net)} (Bank: ${formatCurrency(summary.bank_transfer_total)} + PayPal: ${formatCurrency(summary.paypal_total)})`}
        />
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <ProgressSpinner />
        </div>
      ) : sellers.length === 0 ? (
        <Message
          severity="info"
          text="Keine ausstehenden Auszahlungen im gewählten Zeitraum."
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
                  Banküberweisung ({bankTransferSellers.length})
                </span>
                <Tag
                  value={formatCurrency(summary?.bank_transfer_total || 0)}
                  severity="success"
                />
              </div>
            }
          >
            {bankTransferSellers.length === 0 ? (
              <p className="text-center py-4" style={{ color: colors.textSecondary }}>Keine Überweisungs-Kunden</p>
            ) : (
              <>
                <DataTable
                  value={bankTransferSellers}
                  size="small"
                  stripedRows
                  className="text-sm"
                >
                  <Column field="name" header="Name" />
                  <Column field="company_name" header="Firma" />
                  <Column
                    header="Typ"
                    body={(row) => sellerTypeBadge(row.seller_type)}
                  />
                  <Column
                    header="IBAN"
                    body={destinationTemplate}
                  />
                  <Column
                    header="Betrag"
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
                    tooltip="SEPA XML für ELBA Business exportieren"
                  />
                  <Button
                    icon="pi pi-file"
                    label="CSV"
                    severity="secondary"
                    size="small"
                    onClick={exportCsv}
                    tooltip="CSV für manuellen Import exportieren"
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
                  label={`Alle ${paypalSellers.length} PayPal-Auszahlungen`}
                  severity="info"
                  className="w-full"
                  loading={processingAllPaypal}
                  onClick={() => setConfirmDialog({ visible: true, type: 'all_paypal' })}
                />
              </div>
            )}
            {paypalSellers.length === 0 ? (
              <p className="text-center py-4" style={{ color: colors.textSecondary }}>Keine PayPal-Kunden</p>
            ) : (
              <DataTable
                value={paypalSellers}
                size="small"
                stripedRows
                className="text-sm"
              >
                <Column field="name" header="Name" />
                <Column
                  header="Typ"
                  body={(row) => sellerTypeBadge(row.seller_type)}
                />
                <Column
                  header="PayPal"
                  body={destinationTemplate}
                />
                <Column
                  header="Betrag"
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
        header="Auszahlung bestätigen"
        visible={confirmDialog.visible}
        onHide={() => setConfirmDialog({ visible: false, type: 'single' })}
        style={{ width: '450px' }}
        className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Abbrechen"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setConfirmDialog({ visible: false, type: 'single' })}
            />
            <Button
              label="Auszahlen"
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
            <p style={{ color: colors.textPrimary }}>Möchten Sie die Auszahlung an <strong>{confirmDialog.seller.name}</strong> durchführen?</p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span style={{ color: colors.textSecondary }}>Methode:</span>
                <span style={{ color: colors.textPrimary }}>{confirmDialog.seller.payout_method === 'paypal' ? 'PayPal' : 'Überweisung'}</span>
                <span style={{ color: colors.textSecondary }}>Ziel:</span>
                <span className="font-mono" style={{ color: colors.textPrimary }}>{confirmDialog.seller.payout_destination}</span>
                <span style={{ color: colors.textSecondary }}>Brutto:</span>
                <span style={{ color: colors.textPrimary }}>{formatCurrency(confirmDialog.seller.gross_amount)}</span>
                <span style={{ color: colors.textSecondary }}>Platform Fee:</span>
                <span style={{ color: colors.textPrimary }}>{formatCurrency(confirmDialog.seller.platform_fee)}</span>
                {confirmDialog.seller.vat_amount > 0 && (
                  <>
                    <span style={{ color: colors.textSecondary }}>MwSt:</span>
                    <span style={{ color: colors.textPrimary }}>{formatCurrency(confirmDialog.seller.vat_amount)}</span>
                  </>
                )}
                <Divider className="col-span-2 my-2" />
                <span className="font-bold" style={{ color: colors.textSecondary }}>Auszahlung:</span>
                <span className="font-bold" style={{ color: colors.successText }}>{formatCurrency(confirmDialog.seller.net_amount)}</span>
              </div>
            </div>
          </div>
        )}
        {confirmDialog.type === 'all_paypal' && (
          <div className="space-y-4">
            <p style={{ color: colors.textPrimary }}>Möchten Sie <strong>alle {paypalSellers.length} PayPal-Auszahlungen</strong> durchführen?</p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgTertiary }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span style={{ color: colors.textSecondary }}>Anzahl Empfänger:</span>
                <span style={{ color: colors.textPrimary }}>{paypalSellers.length}</span>
                <span style={{ color: colors.textSecondary }}>Gesamtbetrag:</span>
                <span className="font-bold" style={{ color: colors.successText }}>{formatCurrency(summary?.paypal_total || 0)}</span>
              </div>
            </div>
            <Message
              severity="warn"
              text="PayPal Batch-Auszahlung wird gestartet. Dies kann nicht rückgängig gemacht werden."
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
