import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { apiClient as api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';

interface TemplateMedia {
  id: number;
  media_type: 'logo' | 'image' | 'video';
  file_path?: string;
  video_url?: string;
  title?: string;
}

interface StoreTemplate {
  id: number;
  name: string;
  full_name?: string;
  description?: string;
  category: string;
  language: string;
  price_type: 'credits' | 'euros';
  price_credits?: number;
  price_euros?: number;
  sales_count: number;
  review_score: number;
  creator: {
    id: number;
    username: string;
    name: string;
  };
  logo?: TemplateMedia;
  images?: TemplateMedia[];
  media?: TemplateMedia[];
  is_purchased?: boolean;
  is_own?: boolean;
  can_purchase?: boolean;
  created_at?: string;
}

interface Purchase {
  id: number;
  template: StoreTemplate;
  seller: {
    id: number;
    username: string;
    name: string;
  };
  payment_type: 'credits' | 'euros';
  price_credits?: number;
  price_euros?: number;
  created_at: string;
}

const TemplateStorePanel: React.FC = () => {
  const [currentLanguage] = React.useState<SupportedLanguage>(getStoredLanguage());
  const { t: t } = useTranslation(currentLanguage);
  const toast = useToast();
  const { colors } = useTheme();

  // Store state
  const [templates, setTemplates] = useState<StoreTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [rows] = useState(12);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState('sales_count');

  // Categories and languages
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [languages, setLanguages] = useState<Array<{ language: string; count: number }>>([]);

  // Detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StoreTemplate | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Lightbox for media
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<TemplateMedia | null>(null);

  // Payment method selection
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, _setSelectedPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  // My Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'purchases'>('browse');

  // Current user
  const currentCredits = parseInt(localStorage.getItem('user_credits') || '0');

  // Load store templates
  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', rows.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (languageFilter) params.append('language', languageFilter);
      params.append('sort_by', sortBy);

      const response = await api.request(`/store/templates?${params.toString()}`);
      setTemplates(response.data || []);
      setTotalRecords(response.total || 0);
    } catch (err: any) {
      console.error(t.templatestorepanel124, err);
      setError(t.templatestorepanel125);
    } finally {
      setLoading(false);
    }
  };

  // Load categories and languages
  const loadFilters = async () => {
    try {
      const [catResponse, langResponse] = await Promise.all([
        api.request('/store/categories'),
        api.request('/store/languages'),
      ]);
      setCategories(catResponse || []);
      setLanguages(langResponse || []);
    } catch (err) {
      console.error(t.templatestorepanel141, err);
    }
  };

  // Load purchases
  const loadPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const response = await api.request('/store/my-purchases');
      setPurchases(response.data || []);
    } catch (err) {
      console.error(t.templatestorepanel152, err);
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      loadTemplates();
    } else if (activeTab === 'purchases') {
      loadPurchases();
    }
  }, [activeTab, page, searchTerm, categoryFilter, languageFilter, sortBy]);

  // Handle purchase button click
  const handlePurchaseClick = () => {
    if (!selectedTemplate) return;

    // For euro payments, show payment method selection
    if (selectedTemplate.price_type === 'euros') {
      setPaymentModalVisible(true);
    } else {
      // Credit payment - process directly
      handlePurchase();
    }
  };

  // Process the actual purchase
  const handlePurchase = async (paymentMethod?: 'stripe' | 'paypal') => {
    if (!selectedTemplate) return;

    setPurchasing(true);
    setPaymentModalVisible(false);

    try {
      // Check if this is an euro payment
      if (selectedTemplate.price_type === 'euros') {
        const method = paymentMethod || selectedPaymentMethod;

        if (method === 'stripe') {
          // Redirect to Stripe checkout
          const stripeResponse = await api.request('/stripe/checkout/template', {
            method: 'POST',
            body: JSON.stringify({
              template_id: selectedTemplate.id,
            }),
          });

          if (stripeResponse.success && stripeResponse.url) {
            window.location.href = stripeResponse.url;
            return;
          } else {
            toast.showError(stripeResponse.error || t.templatestorepanel208);
            setPurchasing(false);
            return;
          }
        } else {
          // Redirect to PayPal checkout
          const paypalResponse = await api.request('/paypal/order/template', {
            method: 'POST',
            body: JSON.stringify({
              template_id: selectedTemplate.id,
            }),
          });

          if (paypalResponse.success && paypalResponse.url) {
            window.location.href = paypalResponse.url;
            return;
          } else {
            toast.showError(paypalResponse.error || t.templatestorepanel225);
            setPurchasing(false);
            return;
          }
        }
      }

      // Credit payment - use existing flow
      const response = await api.request(`/store/templates/${selectedTemplate.id}/purchase`, {
        method: 'POST',
      });

      if (response.success) {
        toast.showSuccess(response.message || t.templatestorepanel238);
        setDetailModalVisible(false);

        if (response.credits_remaining !== undefined) {
          localStorage.setItem('user_credits', response.credits_remaining.toString());
          window.dispatchEvent(new Event('storage'));
        }

        loadTemplates();
      } else if (response.requires_payment) {
        // Fallback for euro payments (shouldn't reach here now)
        toast.showInfo(t.templatestorepanel249);
      }
    } catch (err: any) {
      // Show specific backend error message if available
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message || t.templatestorepanel253;
      console.error(t.templatestorepanel254, err);
      toast.showError(errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  // Open template details
  const openTemplateDetail = async (template: StoreTemplate) => {
    try {
      const response = await api.request(`/store/templates/${template.id}`);
      setSelectedTemplate(response);
      setDetailModalVisible(true);
    } catch (_err) {
      toast.showError(t.templatestorepanel268);
    }
  };

  // Get price display
  const getPriceDisplay = (template: StoreTemplate) => {
    if (template.price_type === 'credits') {
      return `${template.price_credits || 0} Credits`;
    }
    const price = typeof template.price_euros === 'string'
      ? parseFloat(template.price_euros)
      : (template.price_euros || 0);
    return `€${price.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort options
  const sortOptions = [
    { label: t.templatestorepanel295, value: 'sales_count' },
    { label: t.templatestorepanel296, value: 'review_score' },
    { label: t.templatestorepanel297, value: 'created_at' },
    { label: t.templatestorepanel298, value: 'name' },
  ];

  // Loading state
  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-4" style={{ color: colors.accent }}></i>
          <p style={{ color: colors.textMuted }}>{t.templatestorepanel307}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-store-panel flex flex-col h-full p-6" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-shopping-cart text-2xl" style={{ color: colors.accent }}></i>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{t.templatestorepanel319}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Tag
            value={`${currentCredits}${t.templatestorepanel323}`}
            severity="warning"
            icon="pi pi-wallet"
          />
          <Button
            icon="pi pi-refresh"
            label={t.templatestorepanel329}
            className="p-button-outlined p-button-sm"
            onClick={() => activeTab === 'browse' ? loadTemplates() : loadPurchases()}
            disabled={loading || purchasesLoading}
          />
        </div>
      </div>

      {error && (
        <Message severity="error" text={error} className="mb-4" />
      )}

      {/* Tab Buttons */}
      <div className="flex space-x-2 mb-6">
        <Button
          label={t.templatestorepanel344}
          icon="pi pi-shopping-cart"
          className={`p-button-sm ${activeTab === 'browse' ? '' : 'p-button-outlined'}`}
          onClick={() => setActiveTab('browse')}
        />
        <Button
          label={t.templatestorepanel350}
          icon="pi pi-check-circle"
          className={`p-button-sm ${activeTab === 'purchases' ? '' : 'p-button-outlined'}`}
          onClick={() => setActiveTab('purchases')}
        />
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center space-x-2 flex-1" style={{ minWidth: '200px' }}>
              <i className="pi pi-search" style={{ color: colors.textMuted }}></i>
              <InputText
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.templatestorepanel366}
                className="flex-1"
                disabled={loading}
              />
            </div>
            <Dropdown
              value={categoryFilter}
              options={[
                { label: t.templatestorepanel374, value: '' },
                ...categories.map(c => ({ label: `${c.category} (${c.count})`, value: c.category }))
              ]}
              onChange={(e) => setCategoryFilter(e.value)}
              placeholder={t.templatestorepanel378}
              className="p-dropdown-sm"
              panelClassName="template-store-dropdown-panel"
              style={{ minWidth: '150px' }}
            />
            <Dropdown
              value={languageFilter}
              options={[
                { label: t.templatestorepanel386, value: '' },
                ...languages.map(l => ({ label: `${l.language} (${l.count})`, value: l.language }))
              ]}
              onChange={(e) => setLanguageFilter(e.value)}
              placeholder={t.templatestorepanel390}
              className="p-dropdown-sm"
              panelClassName="template-store-dropdown-panel"
              style={{ minWidth: '150px' }}
            />
            <Dropdown
              value={sortBy}
              options={sortOptions}
              onChange={(e) => setSortBy(e.value)}
              placeholder={t.templatestorepanel399}
              className="p-dropdown-sm"
              panelClassName="template-store-dropdown-panel"
              style={{ minWidth: '140px' }}
            />
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <i className="pi pi-inbox text-6xl mb-4" style={{ color: colors.textMuted }}></i>
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>{t.templatestorepanel411}</h3>
                <p style={{ color: colors.textMuted }}>
                  {searchTerm ? t.templatestorepanel413 : t.templatestorepanel413_2}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="h-fit hover:shadow-lg transition-shadow cursor-pointer"
                    style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}
                    onClick={() => openTemplateDetail(template)}
                    header={
                      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                        <div className="flex items-center justify-between">
                          {/* Left: Name + Developer */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                              {template.name}
                            </h3>
                            <div className="flex items-center text-xs" style={{ color: colors.textMuted }}>
                              <i className="pi pi-user text-xs mr-1"></i>
                              <span className="truncate">{template.creator?.username || t.templatestorepanel434}</span>
                            </div>
                          </div>
                          {/* Right: Price */}
                          {!template.is_purchased && !template.is_own ? (
                            <span className="text-sm font-semibold flex-shrink-0" style={{ color: colors.warningText }}>
                              {getPriceDisplay(template)}
                            </span>
                          ) : template.is_purchased ? (
                            <Tag value={t.templatestorepanel443} severity="success" className="text-xs" />
                          ) : (
                            <Tag value={t.templatestorepanel445} severity="info" className="text-xs" />
                          )}
                        </div>
                      </div>
                    }
                  >
                    <div className="px-3 py-2" style={{ backgroundColor: colors.bgSecondary }}>
                      {/* Middle: Logo + Tags/Stats */}
                      <div className="flex items-start gap-3 mb-2">
                        {/* Tags & Stats left */}
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {template.category && (
                              <Tag value={template.category} severity="info" className="text-xs px-1 py-0" />
                            )}
                            {template.language && (
                              <Tag value={template.language} severity="success" className="text-xs px-1 py-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: colors.textMuted }}>
                            <span className="flex items-center gap-1">
                              <i className="pi pi-shopping-cart text-xs"></i>
                              {template.sales_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="pi pi-star text-xs" style={{ color: colors.warningText }}></i>
                              {template.review_score || 0}
                            </span>
                          </div>
                        </div>
                        {/* Logo right */}
                        {template.logo?.id ? (
                          <img
                            src={`/api/media/${template.logo.id}/serve`}
                            alt={template.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            style={{ backgroundColor: colors.bgTertiary }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: colors.bgTertiary }}
                          >
                            <i className="pi pi-box text-sm" style={{ color: colors.textMuted }}></i>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Description */}
                      <p className="text-xs line-clamp-1 pt-2" style={{ color: colors.textMuted, borderTop: `1px solid ${colors.borderPrimary}` }}>
                        {template.description || t.templatestorepanel495}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalRecords > rows && (
              <div className="flex justify-center items-center gap-4 mt-6 py-4">
                <Button
                  icon="pi pi-chevron-left"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-button-outlined p-button-sm"
                />
                <span style={{ color: colors.textMuted }}>
                  {t.templatestorepanel513}{page}{t.templatestorepanel513_2}{Math.ceil(totalRecords / rows)}
                </span>
                <Button
                  icon="pi pi-chevron-right"
                  disabled={page >= Math.ceil(totalRecords / rows)}
                  onClick={() => setPage(p => p + 1)}
                  className="p-button-outlined p-button-sm"
                />
              </div>
            )}
          </div>

          {/* Statistics Footer */}
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: colors.accent }}>{totalRecords}</div>
                <div className="text-sm" style={{ color: colors.textMuted }}>{t.templatestorepanel530}</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: colors.infoText }}>{categories.length}</div>
                <div className="text-sm" style={{ color: colors.textMuted }}>{t.templatestorepanel534}</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: colors.successText }}>{templates.length}</div>
                <div className="text-sm" style={{ color: colors.textMuted }}>{t.templatestorepanel538}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'purchases' && (
        <div className="flex-1 overflow-y-auto">
          {purchasesLoading ? (
            <div className="flex items-center justify-center py-12">
              <i className="pi pi-spinner pi-spin text-3xl" style={{ color: colors.accent }}></i>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <i className="pi pi-shopping-bag text-6xl mb-4" style={{ color: colors.textMuted }}></i>
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>{t.templatestorepanel554}</h3>
              <p className="mb-4" style={{ color: colors.textMuted }}>{t.templatestorepanel555}</p>
              <Button
                label={t.templatestorepanel557}
                icon="pi pi-shopping-cart"
                onClick={() => setActiveTab('browse')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((purchase) => (
                <Card
                  key={purchase.id}
                  className="h-fit"
                  style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}
                  header={
                    <div className="p-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgSecondary }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold truncate" style={{ color: colors.textPrimary }}>
                          {purchase.template?.name}
                        </h3>
                        <Tag value={t.templatestorepanel575} severity="success" className="text-xs" />
                      </div>
                    </div>
                  }
                >
                  <div className="p-4 space-y-2" style={{ backgroundColor: colors.bgSecondary }}>
                    <div className="flex items-center text-sm" style={{ color: colors.textMuted }}>
                      <i className="pi pi-user mr-2"></i>
                      <span>{t.templatestorepanel583}{purchase.seller?.username}</span>
                    </div>
                    <div className="flex items-center text-sm" style={{ color: colors.textMuted }}>
                      <i className="pi pi-wallet mr-2"></i>
                      <span>
                        {t.templatestorepanel588}{purchase.payment_type === 'credits'
                          ? `${purchase.price_credits || 0} Credits`
                          : `€${(typeof purchase.price_euros === 'string' ? parseFloat(purchase.price_euros) : (purchase.price_euros || 0)).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm" style={{ color: colors.textMuted }}>
                      <i className="pi pi-calendar mr-2"></i>
                      <span>{formatDate(purchase.created_at)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog
        visible={detailModalVisible}
        onHide={() => setDetailModalVisible(false)}
        header={
          <div className="flex items-center gap-3">
            <i className="pi pi-box" style={{ color: colors.accent }}></i>
            <span>{selectedTemplate?.name}</span>
          </div>
        }
        style={{ width: '700px', maxWidth: '95vw' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        closable
        draggable
        resizable
        className="template-store-detail-modal"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {/* Template Info - TOP */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="flex items-start gap-4">
                {/* Logo */}
                {selectedTemplate.logo?.id ? (
                  <img
                    src={`/api/media/${selectedTemplate.logo.id}/serve`}
                    alt={selectedTemplate.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colors.bgTertiary }}
                    onClick={() => {
                      setLightboxMedia(selectedTemplate.logo!);
                      setLightboxVisible(true);
                    }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.bgTertiary }}
                  >
                    <i className="pi pi-box text-2xl" style={{ color: colors.textMuted }}></i>
                  </div>
                )}

                {/* Title, Creator, Tags */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold m-0" style={{ color: colors.textPrimary }}>{selectedTemplate.name}</h3>
                      <p className="text-sm m-0" style={{ color: colors.textMuted }}>
                        <i className="pi pi-user mr-1"></i>
                        {t.templatestorepanel657}{selectedTemplate.creator?.username}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {selectedTemplate.category && <Tag value={selectedTemplate.category} severity="info" />}
                      {selectedTemplate.language && <Tag value={selectedTemplate.language} severity="success" />}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1" style={{ color: colors.textMuted }}>
                      <i className="pi pi-shopping-cart"></i>
                      <span>{selectedTemplate.sales_count || 0}{t.templatestorepanel670}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: colors.textMuted }}>
                      <i className="pi pi-star" style={{ color: colors.warningText }}></i>
                      <span>{selectedTemplate.review_score || 0}/10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTemplate.description && (
                <p className="text-sm mt-3 mb-0" style={{ color: colors.textSecondary }}>{selectedTemplate.description}</p>
              )}
            </div>

            {/* Purchase Section */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm" style={{ color: colors.textMuted }}>{t.templatestorepanel690}</span>
                  <div className="text-2xl font-bold" style={{ color: colors.warningText }}>{getPriceDisplay(selectedTemplate)}</div>
                </div>

                {selectedTemplate.is_purchased ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: colors.successBg, border: `1px solid ${colors.successBorder}` }}>
                    <i className="pi pi-check-circle" style={{ color: colors.successText }}></i>
                    <span className="font-medium" style={{ color: colors.successText }}>{t.templatestorepanel697}</span>
                  </div>
                ) : selectedTemplate.is_own ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: colors.infoBg, border: `1px solid ${colors.infoBorder}` }}>
                    <i className="pi pi-user" style={{ color: colors.infoText }}></i>
                    <span className="font-medium" style={{ color: colors.infoText }}>{t.templatestorepanel702}</span>
                  </div>
                ) : (
                  <Button
                    label={purchasing ? t.templatestorepanel706 : t.templatestorepanel706_2}
                    icon={purchasing ? 'pi pi-spinner pi-spin' : 'pi pi-shopping-cart'}
                    onClick={handlePurchaseClick}
                    disabled={purchasing || !selectedTemplate.can_purchase}
                    className="p-button-success"
                  />
                )}
              </div>

              {/* Credit warning */}
              {selectedTemplate.price_type === 'credits' &&
               selectedTemplate.price_credits &&
               currentCredits < selectedTemplate.price_credits &&
               !selectedTemplate.is_purchased &&
               !selectedTemplate.is_own && (
                <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}` }}>
                  <i className="pi pi-exclamation-triangle" style={{ color: colors.errorText }}></i>
                  <span className="text-sm" style={{ color: colors.errorText }}>
                    {t.templatestorepanel724_2}<strong>{selectedTemplate.price_credits}</strong>{t.templatestorepanel724}<strong>{currentCredits}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Media Section - BOTTOM (Thumbnails) */}
            {(() => {
              const allMedia: TemplateMedia[] = [];
              if (selectedTemplate.media) {
                selectedTemplate.media.filter(m => m.media_type === 'image').forEach(m => allMedia.push(m));
                selectedTemplate.media.filter(m => m.media_type === 'video').forEach(m => allMedia.push(m));
              } else if (selectedTemplate.images) {
                selectedTemplate.images.forEach(m => allMedia.push(m));
              }

              if (allMedia.length === 0) return null;

              return (
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgSecondary, border: `1px solid ${colors.borderPrimary}` }}>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: colors.textMuted }}>
                    <i className="pi pi-images"></i>
                    {t.templatestorepanel746}({allMedia.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allMedia.map((item) => {
                      // Get video thumbnail URL
                      let videoThumbnail: string | null = null;
                      if (item.media_type === 'video' && item.video_url) {
                        const ytMatch = item.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                        if (ytMatch) {
                          videoThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
                        }
                        const vimeoMatch = item.video_url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                        if (vimeoMatch) {
                          // Vimeo thumbnails require API call, use placeholder with play icon
                          videoThumbnail = null;
                        }
                      }

                      return (
                        <div
                          key={item.id}
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setLightboxMedia(item);
                            setLightboxVisible(true);
                          }}
                        >
                          {item.media_type === 'video' ? (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: colors.bgTertiary }}>
                              {videoThumbnail ? (
                                <img
                                  src={videoThumbnail}
                                  alt={item.title || 'Video'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="pi pi-video text-xl" style={{ color: colors.textMuted }}></i>
                                </div>
                              )}
                              {/* Play overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <i className="pi pi-play-circle text-2xl text-white drop-shadow-lg"></i>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={`/api/media/${item.id}/serve`}
                              alt={item.title || t.templatestorepanel794}
                              className="w-20 h-20 rounded-lg object-cover"
                              style={{ backgroundColor: colors.bgTertiary }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Dialog>

      {/* Lightbox Modal */}
      <Dialog
        visible={lightboxVisible}
        onHide={() => {
          setLightboxVisible(false);
          setLightboxMedia(null);
        }}
        header={lightboxMedia?.title || t.templatestorepanel817}
        style={{ width: '90vw', maxWidth: '1200px' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        closable
        draggable={false}
        className="template-store-lightbox-modal"
      >
        {lightboxMedia && (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            {lightboxMedia.media_type === 'video' && lightboxMedia.video_url ? (
              (() => {
                let embedUrl = lightboxMedia.video_url;
                const ytMatch = lightboxMedia.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
                const vimeoMatch = lightboxMedia.video_url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

                return (
                  <iframe
                    src={embedUrl}
                    className="w-full rounded-lg"
                    style={{ height: '70vh', maxHeight: '600px' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                );
              })()
            ) : (
              <img
                src={`/api/media/${lightboxMedia.id}/serve`}
                alt={lightboxMedia.title || 'Full size image'}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        )}
      </Dialog>

      {/* Payment Method Selection Modal */}
      <Dialog
        visible={paymentModalVisible}
        onHide={() => setPaymentModalVisible(false)}
        header={
          <div className="flex items-center gap-3">
            <i className="pi pi-credit-card" style={{ color: colors.successText }}></i>
            <span>{t.templatestorepanel865}</span>
          </div>
        }
        style={{ width: '400px', maxWidth: '95vw' }}
        contentStyle={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        headerStyle={{ backgroundColor: colors.dialogHeader, color: colors.textPrimary }}
        modal
        closable
        className="template-store-payment-modal"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {t.templatestorepanel877}{' '}
            <strong style={{ color: colors.textPrimary }}>{selectedTemplate?.name}</strong>
          </p>

          <div className="text-center mb-4">
            <span className="text-2xl font-bold" style={{ color: colors.warningText }}>
              {selectedTemplate && getPriceDisplay(selectedTemplate)}
            </span>
          </div>

          {/* Payment Method Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handlePurchase('stripe')}
              disabled={purchasing}
              className="w-full p-4 rounded-lg transition-all flex items-center justify-between group"
              style={{
                backgroundColor: colors.bgSecondary,
                border: `2px solid ${colors.borderPrimary}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <i className="pi pi-credit-card text-white text-lg"></i>
                </div>
                <div className="text-left">
                  <div className="font-medium" style={{ color: colors.textPrimary }}>{t.templatestorepanel903}</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>{t.templatestorepanel904}</div>
                </div>
              </div>
              <i className="pi pi-chevron-right" style={{ color: colors.textMuted }}></i>
            </button>

            <button
              onClick={() => handlePurchase('paypal')}
              disabled={purchasing}
              className="w-full p-4 rounded-lg transition-all flex items-center justify-between group"
              style={{
                backgroundColor: colors.bgSecondary,
                border: `2px solid ${colors.borderPrimary}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <i className="pi pi-paypal text-white text-lg"></i>
                </div>
                <div className="text-left">
                  <div className="font-medium" style={{ color: colors.textPrimary }}>{t.templatestorepanel924}</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>{t.templatestorepanel925}</div>
                </div>
              </div>
              <i className="pi pi-chevron-right" style={{ color: colors.textMuted }}></i>
            </button>
          </div>

          {purchasing && (
            <div className="text-center py-2">
              <i className="pi pi-spinner pi-spin mr-2" style={{ color: colors.accent }}></i>
              <span style={{ color: colors.textMuted }}>{t.templatestorepanel935}</span>
            </div>
          )}

          <p className="text-xs text-center mt-4" style={{ color: colors.textMuted }}>
            <i className="pi pi-lock mr-1"></i>
            {t.templatestorepanel941}
          </p>
        </div>
      </Dialog>

      {/* Theme-aware styles for PrimeReact components */}
      <style>{`
        .template-store-panel .p-inputtext {
          background-color: var(--theme-bg-secondary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .template-store-panel .p-inputtext:hover {
          border-color: var(--theme-accent);
        }
        .template-store-panel .p-inputtext:focus {
          border-color: var(--theme-accent);
          box-shadow: 0 0 0 1px var(--theme-accent);
        }
        .template-store-panel .p-inputtext::placeholder {
          color: var(--theme-text-muted);
        }
        .template-store-panel .p-dropdown {
          background-color: var(--theme-bg-secondary);
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .template-store-panel .p-dropdown:hover {
          border-color: var(--theme-accent);
        }
        .template-store-panel .p-dropdown .p-dropdown-label {
          color: var(--theme-text-primary);
        }
        .template-store-panel .p-dropdown .p-dropdown-trigger {
          color: var(--theme-text-muted);
        }
        /* Dropdown Panel - rendered as portal outside component */
        .template-store-dropdown-panel {
          background-color: var(--theme-bg-secondary) !important;
          border-color: var(--theme-border-primary) !important;
        }
        .template-store-dropdown-panel .p-dropdown-items {
          background-color: var(--theme-bg-secondary) !important;
        }
        .template-store-dropdown-panel .p-dropdown-item {
          color: var(--theme-text-primary) !important;
        }
        .template-store-dropdown-panel .p-dropdown-item:hover {
          background-color: var(--theme-bg-tertiary) !important;
        }
        .template-store-dropdown-panel .p-dropdown-item.p-highlight {
          background-color: var(--theme-accent) !important;
          color: white !important;
        }
        .template-store-panel .p-button-outlined {
          border-color: var(--theme-border-primary);
          color: var(--theme-text-primary);
        }
        .template-store-panel .p-button-outlined:hover {
          background-color: var(--theme-bg-tertiary);
          border-color: var(--theme-accent);
        }
        .template-store-panel .p-card {
          border: 1px solid var(--theme-border-primary);
        }
        .template-store-panel .p-card:hover {
          border-color: var(--theme-accent);
        }
        .template-store-panel .p-card .p-card-body {
          padding: 0;
        }
        .template-store-panel .p-card .p-card-content {
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default TemplateStorePanel;
