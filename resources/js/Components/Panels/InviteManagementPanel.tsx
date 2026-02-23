import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { api } from '@/lib/api';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface Invite {
  id: number;
  email: string;
  name: string | null;
  note: string | null;
  token: string;
  registration_url: string;
  status: 'pending' | 'used' | 'expired';
  sent_at: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
  inviter: {
    id: number;
    name: string;
    username: string;
  } | null;
  used_by: {
    id: number;
    name: string;
    email: string;
    username: string;
  } | null;
}

interface InviteStats {
  total: number;
  pending: number;
  used: number;
  expired: number;
}

interface InviteFormData {
  email: string;
  name: string;
  note: string;
  send_email: boolean;
  expires_days: number;
}

export default function InviteManagementPanel() {
  // i18n setup
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({
    defaultValues: {
      email: '',
      name: '',
      note: '',
      send_email: true,
      expires_days: 7
    }
  });

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.request('/invites');
      setInvites(response.invites || []);
      setStats(response.stats || null);
      setRegistrationOpen(response.registration_open || false);
      setUnauthorized(false);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setUnauthorized(true);
        // Don't show toast - we'll display inline message
      } else {
        toast.showError(t.invitemanagementpanel96 + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreate = () => {
    reset({
      email: '',
      name: '',
      note: '',
      send_email: true,
      expires_days: 7
    });
    setModalVisible(true);
  };

  const confirmDelete = (invite: Invite) => {
    confirmDialog({
      group: 'invite-management',
      message: `${t.invitemanagementpanel120}"${invite.email}"?`,
      header: t.invitemanagementpanel121,
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDelete(invite),
      acceptLabel: t.invitemanagementpanel124,
      rejectLabel: t.invitemanagementpanel125,
      acceptClassName: 'p-button-danger'
    });
  };

  const handleDelete = async (invite: Invite) => {
    try {
      await api.request(`/invites/${invite.id}`, { method: 'DELETE' });
      toast.showSuccess(t.invitemanagementpanel133);
      fetchInvites();
    } catch (error: any) {
      toast.showError(t.invitemanagementpanel136 + (error.response?.data?.message || error.message));
    }
  };

  const handleResend = async (invite: Invite) => {
    try {
      await api.request(`/invites/${invite.id}/resend`, { method: 'POST' });
      toast.showSuccess(t.invitemanagementpanel143);
      fetchInvites();
    } catch (error: any) {
      toast.showError(t.invitemanagementpanel146 + (error.response?.data?.message || error.message));
    }
  };

  const copyToClipboard = async (text: string, inviteId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(inviteId);
      toast.showSuccess(t.invitemanagementpanel154);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.showError(t.invitemanagementpanel157);
    }
  };

  const onSubmit = async (values: InviteFormData) => {
    try {
      await api.request('/invites', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      toast.showSuccess(t.invitemanagementpanel167);
      setModalVisible(false);
      fetchInvites();
    } catch (error: any) {
      toast.showError(t.invitemanagementpanel171 + (error.response?.data?.message || error.message));
    }
  };

  const statusBodyTemplate = (rowData: Invite) => {
    const severityMap: Record<string, 'success' | 'danger' | 'warning'> = {
      'pending': 'warning',
      'used': 'success',
      'expired': 'danger'
    };
    return (
      <Tag
        value={rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1)}
        severity={severityMap[rowData.status]}
      />
    );
  };

  const emailBodyTemplate = (rowData: Invite) => {
    return (
      <div>
        <div className="font-medium">{rowData.email}</div>
        {rowData.name && (
          <div className="text-sm" style={{ color: colors.textSecondary }}>{rowData.name}</div>
        )}
      </div>
    );
  };

  const dateBodyTemplate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const usedByBodyTemplate = (rowData: Invite) => {
    if (!rowData.used_by) return '-';
    return (
      <div>
        <div className="font-medium">{rowData.used_by.name}</div>
        <div className="text-sm" style={{ color: colors.textSecondary }}>@{rowData.used_by.username}</div>
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Invite) => {
    const isPending = rowData.status === 'pending';

    return (
      <div className="flex gap-1">
        {/* Copy Link */}
        <Button
          icon={copiedToken === rowData.token ? "pi pi-check" : "pi pi-copy"}
          rounded
          text
          size="small"
          severity={copiedToken === rowData.token ? "success" : "info"}
          onClick={() => copyToClipboard(rowData.registration_url, rowData.token)}
          tooltip={t.invitemanagementpanel234}
          tooltipOptions={{ position: 'top' }}
        />

        {/* Resend Email */}
        {isPending && (
          <Button
            icon="pi pi-envelope"
            rounded
            text
            size="small"
            severity="info"
            onClick={() => handleResend(rowData)}
            tooltip={t.invitemanagementpanel247}
            tooltipOptions={{ position: 'top' }}
          />
        )}

        {/* Delete */}
        {!rowData.used_at && (
          <Button
            icon="pi pi-trash"
            rounded
            text
            size="small"
            severity="danger"
            onClick={() => confirmDelete(rowData)}
            tooltip={t.invitemanagementpanel261}
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  // Show unauthorized message if user doesn't have permission
  if (unauthorized) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
        <div className="text-center max-w-md">
          <i className="pi pi-lock text-6xl mb-4" style={{ color: colors.errorText }}></i>
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            {t.invitemanagementpanel276}
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            {t.invitemanagementpanel279}
            {t.invitemanagementpanel280}
          </p>
          <Tag value={t.invitemanagementpanel282} severity="danger" icon="pi pi-times-circle" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      <ConfirmDialog group="invite-management" />
      <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgPrimary }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              {t.invitemanagementpanel295}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {t.invitemanagementpanel298}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Registration Status Badge */}
            <Tag
              value={registrationOpen ? t.invitemanagementpanel304 : t.invitemanagementpanel304_2}
              severity={registrationOpen ? 'success' : 'warning'}
              icon={registrationOpen ? 'pi pi-lock-open' : 'pi pi-lock'}
            />
            <Button
              icon="pi pi-plus"
              label={t.invitemanagementpanel310}
              size="small"
              severity="info"
              onClick={handleCreate}
            />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>{t.invitemanagementpanel322}</span>
              <Tag value={stats.total.toString()} severity="info" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>{t.invitemanagementpanel326}</span>
              <Tag value={stats.pending.toString()} severity="warning" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>{t.invitemanagementpanel330}</span>
              <Tag value={stats.used.toString()} severity="success" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>{t.invitemanagementpanel334}</span>
              <Tag value={stats.expired.toString()} severity="danger" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
          <DataTable
            value={invites}
            dataKey="id"
            loading={loading}
            paginator
            rows={20}
            rowsPerPageOptions={[10, 20, 50]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
            currentPageReportTemplate={`{first}-{last}${t.invitemanagementpanel351}{totalRecords}${t.invitemanagementpanel351_2}`}
            size="small"
            stripedRows
            showGridlines
            scrollable
            scrollHeight="calc(100vh - 350px)"
            emptyMessage={t.invitemanagementpanel357}
          >
            <Column field="email" header={t.invitemanagementpanel359} body={emailBodyTemplate} sortable style={{ width: '200px' }} />
            <Column header={t.invitemanagementpanel360} body={statusBodyTemplate} style={{ width: '100px' }} />
            <Column header={t.invitemanagementpanel361} body={(rowData) => dateBodyTemplate(rowData.sent_at)} sortable style={{ width: '150px' }} />
            <Column header={t.invitemanagementpanel362} body={(rowData) => dateBodyTemplate(rowData.expires_at)} sortable style={{ width: '150px' }} />
            <Column header={t.invitemanagementpanel363} body={usedByBodyTemplate} style={{ width: '150px' }} />
            <Column header={t.invitemanagementpanel364} body={(rowData) => dateBodyTemplate(rowData.used_at)} style={{ width: '150px' }} />
            <Column field="note" header={t.invitemanagementpanel365} style={{ minWidth: '150px' }} />
            <Column header={t.invitemanagementpanel366} body={actionsBodyTemplate} style={{ width: '140px' }} />
          </DataTable>
        </div>
      </div>

      {/* Create Invite Modal */}
      <Dialog
        header={t.invitemanagementpanel373}
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        style={{ width: '500px' }}
        modal
        closable
        draggable
        resizable
        className="themed-dialog"
        contentStyle={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.bgTertiary, color: colors.textPrimary }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label={t.invitemanagementpanel388}
              icon="pi pi-times"
              severity="info"
              outlined
              onClick={() => setModalVisible(false)}
            />
            <Button
              type="button"
              label={t.invitemanagementpanel396}
              icon="pi pi-check"
              severity="success"
              onClick={handleSubmit(onSubmit)}
            />
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.invitemanagementpanel408}
            </label>
            <Controller
              name="email"
              control={control}
              rules={{
                required: t.invitemanagementpanel414,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t.invitemanagementpanel417
                }
              }}
              render={({ field }) => (
                <InputText
                  id="email"
                  {...field}
                  placeholder={t.invitemanagementpanel424}
                  className="w-full"
                />
              )}
            />
            {errors.email && (
              <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.email.message}</small>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.invitemanagementpanel437}
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                maxLength: { value: 255, message: t.invitemanagementpanel443 }
              }}
              render={({ field }) => (
                <InputText
                  id="name"
                  {...field}
                  placeholder={t.invitemanagementpanel449}
                  className="w-full"
                />
              )}
            />
            {errors.name && (
              <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.name.message}</small>
            )}
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.invitemanagementpanel462}
            </label>
            <Controller
              name="note"
              control={control}
              rules={{
                maxLength: { value: 1000, message: t.invitemanagementpanel468 }
              }}
              render={({ field }) => (
                <InputTextarea
                  id="note"
                  {...field}
                  rows={3}
                  placeholder={t.invitemanagementpanel475}
                  className="w-full"
                />
              )}
            />
            {errors.note && (
              <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.note.message}</small>
            )}
          </div>

          {/* Expires Days */}
          <div>
            <label htmlFor="expires_days" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              {t.invitemanagementpanel488}
            </label>
            <Controller
              name="expires_days"
              control={control}
              rules={{
                required: t.invitemanagementpanel494,
                min: { value: 1, message: t.invitemanagementpanel495 },
                max: { value: 30, message: t.invitemanagementpanel496 }
              }}
              render={({ field }) => (
                <InputNumber
                  id="expires_days"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  min={1}
                  max={30}
                  suffix={t.invitemanagementpanel505_2}
                  inputStyle={{ width: '120px' }}
                />
              )}
            />
            {errors.expires_days && (
              <small className="mt-1 block" style={{ color: colors.errorText }}>{errors.expires_days.message}</small>
            )}
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Controller
              name="send_email"
              control={control}
              render={({ field }) => (
                <Checkbox
                  inputId="send_email"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.checked)}
                />
              )}
            />
            <label htmlFor="send_email" className="text-sm font-medium cursor-pointer" style={{ color: colors.textPrimary }}>
              {t.invitemanagementpanel529}
            </label>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
