---
sidebar_position: 5
---

# Template Store

## Overview

The Template Store is a marketplace for buying, selling, and sharing code generation templates. Users can browse templates by category, read reviews, purchase with credits or euros, and track their purchases. Sellers earn credits through sales and manage payouts.

## Key Features

- **Template Marketplace** - Browse and search templates
- **Flexible Pricing** - Credits or Euro pricing per template
- **Purchase Tracking** - Know which templates you own
- **Reviews & Ratings** - Community feedback on templates
- **Seller Earnings** - Track revenue from template sales
- **Plagiarism Detection** - Fingerprint-based duplicate checking
- **Media Management** - Logos, images, and video support
- **Multi-language** - Templates for different languages

## Core Data Structures

```typescript
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
  review_score: number;           // 1-5 stars
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

interface TemplateMedia {
  id: number;
  media_type: 'logo' | 'image' | 'video';
  file_path?: string;
  video_url?: string;
  title?: string;
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

interface TemplateReview {
  id: number;
  template_id: number;
  reviewer: User;
  rating: number;           // 1-5
  comment: string;
  helpful_count: number;
  created_at: string;
}
```

## Template Categories

Browsable categories for organization:
- Web Applications
- Mobile Apps
- APIs
- Utilities
- Admin Panels
- E-commerce
- CRM Systems
- Reporting Tools
- Content Management
- Database Schemas

## Pricing Models

### Credit-Based Pricing

```typescript
// Price in application credits
price_type: 'credits',
price_credits: 500,  // 500 credits

// User must have sufficient balance
const userCredits = 1000;
const canPurchase = userCredits >= template.price_credits;
```

### Euro-Based Pricing

```typescript
// Price in euros
price_type: 'euros',
price_euros: 9.99,  // 9.99 EUR

// Integration with payment processor (Stripe/PayPal)
const payment = await processPayment({
  amount: template.price_euros,
  currency: 'EUR',
  method: selectedPaymentMethod
});
```

### Free Templates

```typescript
// No pricing (free)
price_type: 'free',
// Directly available to download
```

## Purchase Flow

### 1. Browse Templates

```
Store → Search/Category → View template details
See price, reviews, seller info
```

### 2. Check Access

```typescript
// Can user purchase?
const canPurchase = 
  template.can_purchase && 
  !template.is_purchased &&
  !template.is_own;

// Show purchase button if true
```

### 3. Select Payment Method

```typescript
// For euro pricing, choose payment
const paymentOptions = ['stripe', 'paypal'];

// For credit pricing, deduct from balance
```

### 4. Complete Purchase

```typescript
const handlePurchase = async (templateId: number, paymentMethod?: string) => {
  const response = await fetch(`/api/store/purchase`, {
    method: 'POST',
    body: JSON.stringify({
      template_id: templateId,
      payment_method: paymentMethod
    }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

### 5. Download & Import

```typescript
// After purchase, download template
const downloadTemplate = async (templateId: number) => {
  const response = await fetch(`/api/store/templates/${templateId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-${templateId}.zip`;
  a.click();
};
```

## Reviews & Ratings

### View Reviews

```typescript
interface TemplateReview {
  rating: number;          // 1-5 stars
  comment: string;
  helpful_count: number;   // Votes
  reviewer: User;
}

const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
const ratingDistribution = {
  '5stars': reviews.filter(r => r.rating === 5).length,
  '4stars': reviews.filter(r => r.rating === 4).length,
  // ...
};
```

### Write Review

```typescript
const submitReview = async (templateId: number, rating: number, comment: string) => {
  await fetch(`/api/store/templates/${templateId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

## Seller Dashboard

### My Templates

```
Dashboard → My Templates → View all templates you created
Edit details, pricing, manage reviews
```

### Sales Tracking

```typescript
interface SellerMetrics {
  total_sales: number;
  total_revenue_credits: number;
  total_revenue_euros: number;
  pending_payout: number;
  completed_payouts: number;
}

const metrics = {
  total_sales: 150,
  total_revenue_euros: 149.85,
  pending_payout: 49.95,      // 2 pending sales
  completed_payouts: 99.90    // Already received
};
```

### Earnings Management

```typescript
// View by template
const templateEarnings = templates.map(t => ({
  template: t.name,
  sales: t.sales_count,
  revenue: t.price_euros * t.sales_count,
  average_rating: t.review_score
}));

// Pending payouts
const pendingPayouts = earnings
  .filter(e => e.status === 'pending')
  .reduce((sum, e) => sum + e.amount, 0);
```

### Payout Processing

```typescript
// Request payout
const requestPayout = async (amount: number) => {
  await fetch('/api/seller/payouts', {
    method: 'POST',
    body: JSON.stringify({ amount }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Minimum threshold (e.g., EUR 20)
const minimumPayoutAmount = 20;
const canRequestPayout = availableFunds >= minimumPayoutAmount;
```

## Template Media

### Upload Media

```typescript
interface MediaUpload {
  media_type: 'logo' | 'image' | 'video';
  file_path: string;      // For images/logos
  video_url: string;      // For videos
  title?: string;
}

const handleMediaUpload = async (templateId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('media_type', file.type.startsWith('video') ? 'video' : 'image');
  
  await fetch(`/api/store/templates/${templateId}/media`, {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

### Lightbox Display

```typescript
// View images/videos in lightbox
const [lightboxVisible, setLightboxVisible] = useState(false);
const [selectedMedia, setSelectedMedia] = useState<TemplateMedia | null>(null);

<Dialog visible={lightboxVisible} onHide={() => setLightboxVisible(false)}>
  {selectedMedia?.media_type === 'video' ? (
    <video src={selectedMedia.video_url} controls width="100%" />
  ) : (
    <img src={selectedMedia?.file_path} alt="" style={{ width: '100%' }} />
  )}
</Dialog>
```

## Plagiarism Detection

Fingerprint-based system to detect duplicate/similar templates:

```typescript
interface PlagiarismCheck {
  is_duplicate: boolean;
  similarity_score: number;   // 0-100%
  similar_templates: number[];
  checked_at: string;
}

// Check before publishing
const performPlagiarismCheck = async (templateId: number) => {
  const response = await fetch(`/api/store/plagiarism-check`, {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.similarity_score > 80) {
    alert('This template is too similar to existing templates');
  }
};
```

## Search & Filtering

### Search Templates

```typescript
const searchTemplates = async (options: {
  query?: string;
  category?: string;
  language?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'sales_count' | 'rating' | 'newest';
  page?: number;
  rows?: number;
}) => {
  const params = new URLSearchParams();
  if (options.query) params.append('q', options.query);
  if (options.category) params.append('category', options.category);
  if (options.language) params.append('language', options.language);
  if (options.priceMin) params.append('price_min', options.priceMin.toString());
  if (options.priceMax) params.append('price_max', options.priceMax.toString());
  if (options.sortBy) params.append('sort', options.sortBy);
  params.append('page', (options.page || 1).toString());
  params.append('rows', (options.rows || 12).toString());
  
  const response = await fetch(`/api/store/templates?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

## API Endpoints

```
# Store Browsing
GET    /api/store/templates              # List all templates
GET    /api/store/templates/{id}         # Get template details
GET    /api/store/categories             # Get categories
GET    /api/store/languages              # Get languages

# Purchase & Downloads
POST   /api/store/purchase                # Buy template
GET    /api/store/templates/{id}/download # Download purchased
GET    /api/store/purchases              # View my purchases

# Reviews
POST   /api/store/templates/{id}/reviews  # Write review
GET    /api/store/templates/{id}/reviews  # Get reviews
POST   /api/reviews/{id}/vote            # Vote helpful

# Seller Operations
POST   /api/store/templates              # Create template
PUT    /api/store/templates/{id}         # Update template
DELETE /api/store/templates/{id}         # Delete template
POST   /api/store/templates/{id}/publish # Publish to store
POST   /api/store/templates/{id}/media   # Upload media
GET    /api/seller/analytics             # Sales metrics
POST   /api/seller/payouts               # Request payout
GET    /api/seller/payouts               # View payouts

# Admin (plagiarism check)
POST   /api/store/plagiarism-check       # Check for duplicates
```

## Best Practices

1. **Clear Descriptions** - Help buyers understand what they get
2. **Quality Screenshots** - Show template in action
3. **Competitive Pricing** - Research similar templates
4. **Regular Updates** - Keep templates current
5. **Responsive to Reviews** - Address feedback
6. **Unique Value** - Differentiate from competitors
7. **Test Before Selling** - Ensure it works
8. **Document Usage** - Include README or guide

## Troubleshooting

### Purchase Failed
- Check account balance or payment method
- Verify template is still available
- Confirm internet connection

### Download Not Working
- Check purchase status
- Try alternative browser
- Contact support

### Template Not Appearing
- Verify publish status
- Check plagiarism detection passed
- Ensure all required fields filled

## Next Steps

- [Code Generation](deployment.md) - Generate from templates
- [Deployment](deployment.md) - Deploy generated code
- [Messaging](messaging.md) - Contact template creators
