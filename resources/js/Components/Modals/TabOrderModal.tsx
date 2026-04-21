// resources/js/Components/Modals/TabOrderModal.tsx - Edit Tab Order of Form Elements
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useTranslation, SupportedLanguage, getStoredLanguage } from '@/i18n';

interface FormElementLite {
    id?: number;
    element_type: string;
    x_position: number;
    y_position: number;
    button_label?: string;
    tab_label?: string;
    tab_order?: number;
}

interface TabOrderModalProps {
    visible: boolean;
    elements: FormElementLite[];
    onCancel: () => void;
    // activeIds get tab_order 1..N (in array order), excludedIds get -1
    onApply: (activeIds: number[], excludedIds: number[]) => void;
}

const TabOrderModal: React.FC<TabOrderModalProps> = ({ visible, elements, onCancel, onApply }) => {
    const [currentLanguage] = useState<SupportedLanguage>(getStoredLanguage());
    const { t } = useTranslation(currentLanguage);

    // Two ordered lists: active (will get 1..N) and excluded (will get -1)
    const [activeIds, setActiveIds] = useState<number[]>([]);
    const [excludedIds, setExcludedIds] = useState<number[]>([]);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    // Initialize working copy from props each time the modal opens
    useEffect(() => {
        if (!visible) return;
        const valid = elements.filter(el => typeof el.id === 'number');
        const active = valid
            .filter(el => (el.tab_order ?? 0) !== -1)
            .sort((a, b) => {
                const ao = a.tab_order ?? 0;
                const bo = b.tab_order ?? 0;
                if (ao !== bo) return ao - bo;
                return (a.id ?? 0) - (b.id ?? 0);
            })
            .map(el => el.id as number);
        const excluded = valid
            .filter(el => (el.tab_order ?? 0) === -1)
            .map(el => el.id as number);
        setActiveIds(active);
        setExcludedIds(excluded);
        setHighlightedId(active[0] ?? excluded[0] ?? null);
    }, [visible, elements]);

    const elementsById = useMemo(() => {
        const map = new Map<number, FormElementLite>();
        elements.forEach(el => { if (typeof el.id === 'number') map.set(el.id, el); });
        return map;
    }, [elements]);

    const isExcluded = (id: number) => excludedIds.includes(id);

    const moveTop = () => {
        if (highlightedId == null || isExcluded(highlightedId)) return;
        setActiveIds(prev => {
            const idx = prev.indexOf(highlightedId);
            if (idx <= 0) return prev;
            const next = [...prev];
            next.splice(idx, 1);
            next.unshift(highlightedId);
            return next;
        });
    };

    const moveUp = () => {
        if (highlightedId == null || isExcluded(highlightedId)) return;
        setActiveIds(prev => {
            const idx = prev.indexOf(highlightedId);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    };

    const moveDown = () => {
        if (highlightedId == null || isExcluded(highlightedId)) return;
        setActiveIds(prev => {
            const idx = prev.indexOf(highlightedId);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
            return next;
        });
    };

    const moveBottom = () => {
        if (highlightedId == null || isExcluded(highlightedId)) return;
        setActiveIds(prev => {
            const idx = prev.indexOf(highlightedId);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const next = [...prev];
            next.splice(idx, 1);
            next.push(highlightedId);
            return next;
        });
    };

    // Toggle between excluded (-1) and active. New active items are appended at the end.
    const toggleStop = () => {
        if (highlightedId == null) return;
        if (isExcluded(highlightedId)) {
            // Re-enable: move from excluded → end of active
            setExcludedIds(prev => prev.filter(id => id !== highlightedId));
            setActiveIds(prev => [...prev, highlightedId]);
        } else {
            // Remove tab stop: move from active → excluded
            setActiveIds(prev => prev.filter(id => id !== highlightedId));
            setExcludedIds(prev => [...prev, highlightedId]);
        }
    };

    const labelFor = (el: FormElementLite): string => {
        const typed = el.button_label || el.tab_label || '';
        return typed ? `${el.element_type} — ${typed}` : el.element_type;
    };

    const handleApply = () => {
        onApply(activeIds, excludedIds);
    };

    const highlightedIsExcluded = highlightedId != null && isExcluded(highlightedId);

    const footer = (
        <div className="flex justify-end gap-2">
            <Button
                label={t.tabordermodal_cancel || 'Cancel'}
                icon="pi pi-times"
                className="p-button-text"
                onClick={onCancel}
            />
            <Button
                label={t.tabordermodal_apply || 'Apply'}
                icon="pi pi-check"
                className="p-button-success"
                onClick={handleApply}
            />
        </div>
    );

    const renderRow = (id: number, displayNumber: string, excluded: boolean) => {
        const el = elementsById.get(id);
        if (!el) return null;
        const isHighlighted = id === highlightedId;
        return (
            <div
                key={id}
                onClick={() => setHighlightedId(id)}
                className={`px-3 py-2 cursor-pointer text-sm border-b ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900' : ''} ${excluded ? 'opacity-50 italic' : ''}`}
            >
                <span className="inline-block w-12 font-mono">{displayNumber}</span>
                <span>{labelFor(el)}</span>
                <span className="ml-2 text-xs text-gray-500">({el.x_position}, {el.y_position})</span>
            </div>
        );
    };

    return (
        <Dialog
            header={t.tabordermodal_header || 'Edit Tab Order'}
            visible={visible}
            onHide={onCancel}
            style={{ width: '680px' }}
            modal
            closable
            draggable
            resizable
            footer={footer}
        >
            <div className="flex gap-3" style={{ minHeight: '380px' }}>
                {/* Ordered list */}
                <div className="flex-1 border rounded overflow-y-auto" style={{ maxHeight: '440px' }}>
                    {activeIds.length === 0 && excludedIds.length === 0 && (
                        <div className="p-3 text-sm text-gray-500">
                            {t.tabordermodal_empty || 'No elements'}
                        </div>
                    )}
                    {activeIds.map((id, index) => renderRow(id, `#${index + 1}`, false))}
                    {excludedIds.length > 0 && (
                        <div className="px-3 py-1 text-xs uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-500 border-b">
                            {t.tabordermodal_no_stop_label || 'no stop'}
                        </div>
                    )}
                    {excludedIds.map(id => renderRow(id, '—', true))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 justify-start" style={{ minWidth: '170px' }}>
                    <Button
                        icon="pi pi-angle-double-up"
                        label={t.tabordermodal_top || 'Top'}
                        className="p-button-sm"
                        onClick={moveTop}
                        disabled={highlightedId == null || highlightedIsExcluded}
                    />
                    <Button
                        icon="pi pi-angle-up"
                        label={t.tabordermodal_up || 'Up'}
                        className="p-button-sm"
                        onClick={moveUp}
                        disabled={highlightedId == null || highlightedIsExcluded}
                    />
                    <Button
                        icon="pi pi-angle-down"
                        label={t.tabordermodal_down || 'Down'}
                        className="p-button-sm"
                        onClick={moveDown}
                        disabled={highlightedId == null || highlightedIsExcluded}
                    />
                    <Button
                        icon="pi pi-angle-double-down"
                        label={t.tabordermodal_bottom || 'Bottom'}
                        className="p-button-sm"
                        onClick={moveBottom}
                        disabled={highlightedId == null || highlightedIsExcluded}
                    />
                    <div className="border-t my-1"></div>
                    <Button
                        icon={highlightedIsExcluded ? 'pi pi-check-circle' : 'pi pi-ban'}
                        label={highlightedIsExcluded
                            ? (t.tabordermodal_enable_stop || 'Enable Tab Stop')
                            : (t.tabordermodal_remove_stop || 'Remove Tab Stop')}
                        className={`p-button-sm ${highlightedIsExcluded ? 'p-button-success' : 'p-button-warning'}`}
                        onClick={toggleStop}
                        disabled={highlightedId == null}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default TabOrderModal;
