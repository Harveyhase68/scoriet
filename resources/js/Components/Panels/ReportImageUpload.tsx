// resources/js/Components/Panels/ReportImageUpload.tsx
// Per-element image upload for Report Pattern/Layout Designer
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ReportImageMeta {
    id: number;
    name: string;
    language: string | null;
    mime_type: string;
    filename: string;
    file_size: number;
    width: number | null;
    height: number | null;
}

interface ImageUploadSectionProps {
    patternId: number;
    elementId?: number; // Pattern element ID or layout element ID — links images to this specific control
    selectedLanguage: string | null;
    enabledLanguages: Array<{ label: string; value: string }>;
    onImageIdsChange: (imageIds: Record<string, number>) => void; // { "all": 5, "de": 7, "en": 8 }
    imageIds: Record<string, number>; // Current assignments from element content
    colors: any;
}

const getToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
    patternId, elementId, selectedLanguage, enabledLanguages, onImageIdsChange, imageIds, colors,
}) => {
    const [images, setImages] = useState<ReportImageMeta[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadLang, setUploadLang] = useState<string>(selectedLanguage || 'all');

    // Load images for THIS element only
    const loadImages = useCallback(async () => {
        if (!elementId) return;
        try {
            const res = await fetch(`/api/report-patterns/${patternId}/images?element_id=${elementId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setImages(data.data || []);
            }
        } catch { /* silent */ }
    }, [patternId, elementId]);

    useEffect(() => { loadImages(); }, [loadImages]);

    // Upload = immediate assignment
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !elementId) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('name', file.name.replace(/\.[^.]+$/, ''));
            formData.append('element_id', String(elementId));
            if (uploadLang !== 'all') formData.append('language', uploadLang);

            const res = await fetch(`/api/report-patterns/${patternId}/images`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                const newId = data.data.id;
                // Auto-assign: if "all", set for all languages; if specific, set for that language
                const updated = { ...imageIds };
                if (uploadLang === 'all') {
                    updated['all'] = newId;
                    // Remove specific language overrides
                    for (const lang of enabledLanguages) delete updated[lang.value];
                } else {
                    updated[uploadLang] = newId;
                    delete updated['all']; // Specific overrides the "all"
                }
                onImageIdsChange(updated);
                loadImages();
            }
        } catch { /* silent */ }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (imageId: number) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await fetch(`/api/report-images/${imageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
            });
            // Remove from assignments
            const updated = { ...imageIds };
            for (const [key, val] of Object.entries(updated)) {
                if (val === imageId) delete updated[key];
            }
            onImageIdsChange(updated);
            loadImages();
        } catch { /* silent */ }
    };

    // Current image for selected language
    const currentImageId = imageIds[selectedLanguage || 'all'] || imageIds['all'] || null;

    return (
        <>
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, margin: '4px 0' }} />
            <label style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                Image / Logo
            </label>

            {/* Current image preview */}
            {currentImageId && (
                <div style={{
                    padding: 4, borderRadius: 4, border: `1px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgTertiary, textAlign: 'center',
                }}>
                    <img
                        src={`/api/report-images/${currentImageId}/data`}
                        alt="Current"
                        style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
                        {selectedLanguage ? selectedLanguage.toUpperCase() : 'All'}
                    </div>
                </div>
            )}

            {/* Images per language */}
            {images.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {images.map(img => (
                        <div key={img.id} style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px',
                            borderRadius: 3, fontSize: 8,
                            backgroundColor: img.id === currentImageId ? 'rgba(59,130,246,0.15)' : 'transparent',
                            border: img.id === currentImageId ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                        }}>
                            <img src={`/api/report-images/${img.id}/data`} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                            <span style={{ flex: 1, color: colors.textSecondary }}>
                                {img.language ? img.language.toUpperCase() : 'ALL'} — {img.filename}
                            </span>
                            <span style={{ color: colors.textMuted }}>{Math.round(img.file_size / 1024)}KB</span>
                            <button onClick={() => handleDelete(img.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 9, padding: 0 }}>
                                <i className="pi pi-times" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload row */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <select
                    value={uploadLang}
                    onChange={(e) => setUploadLang(e.target.value)}
                    style={{ fontSize: 9, padding: '2px 3px', borderRadius: 3, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary, color: colors.textPrimary, width: 45 }}
                >
                    <option value="all">All</option>
                    {enabledLanguages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !elementId}
                    style={{
                        flex: 1, fontSize: 9, padding: '3px 6px', borderRadius: 3,
                        border: `1px solid ${colors.borderPrimary}`, cursor: elementId ? 'pointer' : 'not-allowed',
                        backgroundColor: colors.bgTertiary, color: colors.textPrimary,
                    }}
                >
                    <i className="pi pi-upload" style={{ marginRight: 3, fontSize: 8 }} />
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
            </div>
            {!elementId && (
                <div style={{ fontSize: 8, color: '#f59e0b' }}>Save the element first to enable upload.</div>
            )}
        </>
    );
};

export default ImageUploadSection;
