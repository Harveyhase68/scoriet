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
  const { t: _t } = useTranslation(currentLanguage);
  const toast = useToast();

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
      console.error('Error loading store templates:', err);
      setError('Failed to load store templates');
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
      console.error('Error loading filters:', err);
    }
  };

  // Load purchases
  const loadPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const response = await api.request('/store/my-purchases');
      setPurchases(response.data || []);
    } catch (err) {
      console.error('Error loading purchases:', err);
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
            toast.showError(stripeResponse.error || 'Failed to initialize Stripe payment');
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
            toast.showError(paypalResponse.error || 'Failed to initialize PayPal payment');
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
        toast.showSuccess(response.message || 'Purchase successful');
        setDetailModalVisible(false);

        if (response.credits_remaining !== undefined) {
          localStorage.setItem('user_credits', response.credits_remaining.toString());
          window.dispatchEvent(new Event('storage'));
        }

        loadTemplates();
      } else if (response.requires_payment) {
        // Fallback for euro payments (shouldn't reach here now)
        toast.showInfo('Redirecting to payment processor...');
      }
    } catch (err: any) {
      // Show specific backend error message if available
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Failed to purchase template';
      console.error('Purchase error:', err);
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
      toast.showError('Failed to load template details');
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
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort options
  const sortOptions = [
    { label: 'Best Selling', value: 'sales_count' },
    { label: 'Highest Rated', value: 'review_score' },
    { label: 'Newest', value: 'created_at' },
    { label: 'Name', value: 'name' },
  ];

  // Loading state
  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <i className="pi pi-shopping-cart text-2xl text-purple-500"></i>
          <h1 className="text-2xl font-bold text-white">Template Store</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Tag
            value={`${currentCredits} Credits`}
            severity="warning"
            icon="pi pi-wallet"
          />
          <Button
            icon="pi pi-refresh"
            label="Refresh"
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
          label="Browse Store"
          icon="pi pi-shopping-cart"
          className={`p-button-sm ${activeTab === 'browse' ? '' : 'p-button-outlined'}`}
          onClick={() => setActiveTab('browse')}
        />
        <Button
          label="My Purchases"
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
              <i className="pi pi-search text-gray-400"></i>
              <InputText
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="flex-1"
                disabled={loading}
              />
            </div>
            <Dropdown
              value={categoryFilter}
              options={[
                { label: 'All Categories', value: '' },
                ...categories.map(c => ({ label: `${c.category} (${c.count})`, value: c.category }))
              ]}
              onChange={(e) => setCategoryFilter(e.value)}
              placeholder="Category"
              className="p-dropdown-sm"
              style={{ minWidth: '150px' }}
            />
            <Dropdown
              value={languageFilter}
              options={[
                { label: 'All Languages', value: '' },
                ...languages.map(l => ({ label: `${l.language} (${l.count})`, value: l.language }))
              ]}
              onChange={(e) => setLanguageFilter(e.value)}
              placeholder="Language"
              className="p-dropdown-sm"
              style={{ minWidth: '150px' }}
            />
            <Dropdown
              value={sortBy}
              options={sortOptions}
              onChange={(e) => setSortBy(e.value)}
              placeholder="Sort By"
              className="p-dropdown-sm"
              style={{ minWidth: '140px' }}
            />
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <i className="pi pi-inbox text-6xl text-gray-600 mb-4"></i>
                <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search or filters' : 'No templates available in the store yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="h-fit hover:shadow-lg transition-shadow bg-gray-800 border-gray-700 cursor-pointer"
                    onClick={() => openTemplateDetail(template)}
                    header={
                      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800">
                        <div className="flex items-center justify-between">
                          {/* Left: Name + Developer */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {template.name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-400">
                              <i className="pi pi-user text-xs mr-1"></i>
                              <span className="truncate">{template.creator?.username || 'Unknown'}</span>
                            </div>
                          </div>
                          {/* Right: Price */}
                          {!template.is_purchased && !template.is_own ? (
                            <span className="text-sm font-semibold text-yellow-400 flex-shrink-0">
                              {getPriceDisplay(template)}
                            </span>
                          ) : template.is_purchased ? (
                            <Tag value="Purchased" severity="success" className="text-xs" />
                          ) : (
                            <Tag value="Yours" severity="info" className="text-xs" />
                          )}
                        </div>
                      </div>
                    }
                  >
                    <div className="px-3 py-2 bg-gray-800">
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
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <i className="pi pi-shopping-cart text-xs"></i>
                              {template.sales_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="pi pi-star text-yellow-500 text-xs"></i>
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
                            style={{ backgroundColor: '#374151' }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#374151' }}
                          >
                            <i className="pi pi-box text-sm text-gray-500"></i>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Description */}
                      <p className="text-xs text-gray-400 line-clamp-1 border-t border-gray-700 pt-2">
                        {template.description || 'No description available'}
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
                <span className="text-gray-400">
                  Page {page} of {Math.ceil(totalRecords / rows)}
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
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">{totalRecords}</div>
                <div className="text-sm text-gray-400">Templates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{categories.length}</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{templates.length}</div>
                <div className="text-sm text-gray-400">Showing</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'purchases' && (
        <div className="flex-1 overflow-y-auto">
          {purchasesLoading ? (
            <div className="flex items-center justify-center py-12">
              <i className="pi pi-spinner pi-spin text-3xl text-blue-500"></i>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <i className="pi pi-shopping-bag text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-lg font-medium text-white mb-2">No purchases yet</h3>
              <p className="text-gray-400 mb-4">You haven't purchased any templates yet</p>
              <Button
                label="Browse Store"
                icon="pi pi-shopping-cart"
                onClick={() => setActiveTab('browse')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((purchase) => (
                <Card
                  key={purchase.id}
                  className="h-fit bg-gray-800 border-gray-700"
                  header={
                    <div className="p-4 border-b border-gray-700 bg-gray-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white truncate">
                          {purchase.template?.name}
                        </h3>
                        <Tag value="Purchased" severity="success" className="text-xs" />
                      </div>
                    </div>
                  }
                >
                  <div className="p-4 space-y-2 bg-gray-800">
                    <div className="flex items-center text-sm text-gray-400">
                      <i className="pi pi-user mr-2"></i>
                      <span>Sold by: {purchase.seller?.username}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <i className="pi pi-wallet mr-2"></i>
                      <span>
                        Paid: {purchase.payment_type === 'credits'
                          ? `${purchase.price_credits || 0} Credits`
                          : `€${(typeof purchase.price_euros === 'string' ? parseFloat(purchase.price_euros) : (purchase.price_euros || 0)).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
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
            <i className="pi pi-box text-purple-500"></i>
            <span>{selectedTemplate?.name}</span>
          </div>
        }
        style={{ width: '700px', maxWidth: '95vw' }}
        modal
        closable
        draggable
        resizable
        className="p-dialog-custom"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {/* Template Info - TOP */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-start gap-4">
                {/* Logo */}
                {selectedTemplate.logo?.id ? (
                  <img
                    src={`/api/media/${selectedTemplate.logo.id}/serve`}
                    alt={selectedTemplate.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: '#374151' }}
                    onClick={() => {
                      setLightboxMedia(selectedTemplate.logo!);
                      setLightboxVisible(true);
                    }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#374151' }}
                  >
                    <i className="pi pi-box text-2xl text-gray-500"></i>
                  </div>
                )}

                {/* Title, Creator, Tags */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-white m-0">{selectedTemplate.name}</h3>
                      <p className="text-gray-400 text-sm m-0">
                        <i className="pi pi-user mr-1"></i>
                        by {selectedTemplate.creator?.username}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {selectedTemplate.category && <Tag value={selectedTemplate.category} severity="info" />}
                      {selectedTemplate.language && <Tag value={selectedTemplate.language} severity="success" />}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <i className="pi pi-shopping-cart"></i>
                      <span>{selectedTemplate.sales_count || 0} sales</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <i className="pi pi-star text-yellow-500"></i>
                      <span>{selectedTemplate.review_score || 0}/10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTemplate.description && (
                <p className="text-gray-300 text-sm mt-3 mb-0">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Purchase Section */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-sm">Price</span>
                  <div className="text-2xl font-bold text-yellow-400">{getPriceDisplay(selectedTemplate)}</div>
                </div>

                {selectedTemplate.is_purchased ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 rounded-lg border border-green-700">
                    <i className="pi pi-check-circle text-green-500"></i>
                    <span className="text-green-400 font-medium">Already Purchased</span>
                  </div>
                ) : selectedTemplate.is_own ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-700">
                    <i className="pi pi-user text-blue-500"></i>
                    <span className="text-blue-400 font-medium">Your Template</span>
                  </div>
                ) : (
                  <Button
                    label={purchasing ? 'Processing...' : 'Purchase Now'}
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
                <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-800 flex items-center gap-2">
                  <i className="pi pi-exclamation-triangle text-red-500"></i>
                  <span className="text-sm text-red-300">
                    You need <strong>{selectedTemplate.price_credits}</strong> credits but only have <strong>{currentCredits}</strong>.
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
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <i className="pi pi-images"></i>
                    Media ({allMedia.length})
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
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: '#374151' }}>
                              {videoThumbnail ? (
                                <img
                                  src={videoThumbnail}
                                  alt={item.title || 'Video'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="pi pi-video text-xl text-gray-500"></i>
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
                              alt={item.title || 'Media'}
                              className="w-20 h-20 rounded-lg object-cover"
                              style={{ backgroundColor: '#374151' }}
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
        header={lightboxMedia?.title || 'Media Preview'}
        style={{ width: '90vw', maxWidth: '1200px' }}
        modal
        closable
        draggable={false}
        className="p-dialog-custom"
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
            <i className="pi pi-credit-card text-green-500"></i>
            <span>Payment Method</span>
          </div>
        }
        style={{ width: '400px', maxWidth: '95vw' }}
        modal
        closable
        className="p-dialog-custom"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Choose your preferred payment method for{' '}
            <strong className="text-white">{selectedTemplate?.name}</strong>
          </p>

          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-yellow-400">
              {selectedTemplate && getPriceDisplay(selectedTemplate)}
            </span>
          </div>

          {/* Payment Method Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handlePurchase('stripe')}
              disabled={purchasing}
              className="w-full p-4 rounded-lg border-2 border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <i className="pi pi-credit-card text-white text-lg"></i>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">Credit Card</div>
                  <div className="text-xs text-gray-400">Powered by Stripe</div>
                </div>
              </div>
              <i className="pi pi-chevron-right text-gray-400 group-hover:text-blue-400"></i>
            </button>

            <button
              onClick={() => handlePurchase('paypal')}
              disabled={purchasing}
              className="w-full p-4 rounded-lg border-2 border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <i className="pi pi-paypal text-white text-lg"></i>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">PayPal</div>
                  <div className="text-xs text-gray-400">Pay with PayPal account</div>
                </div>
              </div>
              <i className="pi pi-chevron-right text-gray-400 group-hover:text-blue-400"></i>
            </button>
          </div>

          {purchasing && (
            <div className="text-center py-2">
              <i className="pi pi-spinner pi-spin text-blue-500 mr-2"></i>
              <span className="text-gray-400">Initializing payment...</span>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            <i className="pi pi-lock mr-1"></i>
            Your payment is secure and encrypted
          </p>
        </div>
      </Dialog>
    </div>
  );
};

export default TemplateStorePanel;
