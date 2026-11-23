// resources/js/Components/Panels/LanguageField.tsx - shared per-language text
// field (Caption/Display Name/...) used by WindowDesignerPanel AND
// TableColumnDesignerModal. Extracted into its own module (2026-09-07,
// item a) specifically so TableColumnDesignerModal can import it without a
// circular dependency - it's already imported BY WindowDesignerPanel.tsx,
// so defining LanguageField there and importing it back would create one.
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

export interface LanguageFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onCopyToAll: () => void;
    copyTooltip: string;
    multiline?: boolean;
    // Renders an extra small icon button next to the copy-to-all one that
    // opens a real multi-line editor for THIS field - the plain single-line
    // `InputText` below is left untouched for every other field/control
    // type that uses this same shared component; a caret/paragraph icon
    // opts a specific caller (currently only static_text's Caption) into
    // line breaks without switching every OTHER caller to a multi-row
    // textarea it never needed.
    onOpenMultilineEditor?: () => void;
    multilineEditorTooltip?: string;
    // Renders one more icon button, all the way to the right (2026-09-07
    // follow-up - "einen button ganz rechts neben der Caption bzw. Display
    // Name"), that opens a dedicated translation popup instead of relying
    // purely on a toolbar's own language dropdown - a focused place to go
    // through every project language one at a time for THIS one field
    // while still watching a live canvas/preview update behind it.
    onOpenTranslate?: () => void;
    translateTooltip?: string;
}

export const LanguageField: React.FC<LanguageFieldProps> = ({ label: labelText, value, onChange, onCopyToAll, copyTooltip, multiline, onOpenMultilineEditor, multilineEditorTooltip, onOpenTranslate, translateTooltip }) => (
    <div>
        <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">{labelText}</label>
            <div className="flex items-center gap-1">
                {onOpenMultilineEditor && (
                    <Button
                        icon="pi pi-align-left"
                        className="p-button-text p-button-sm"
                        style={{ width: 20, height: 20, minWidth: 20 }}
                        onClick={onOpenMultilineEditor}
                        tooltip={multilineEditorTooltip}
                        tooltipOptions={{ position: 'left' }}
                    />
                )}
                <Button
                    icon="pi pi-copy"
                    className="p-button-text p-button-sm"
                    style={{ width: 20, height: 20, minWidth: 20 }}
                    onClick={onCopyToAll}
                    tooltip={copyTooltip}
                    tooltipOptions={{ position: 'left' }}
                />
                {onOpenTranslate && (
                    <Button
                        icon="pi pi-globe"
                        className="p-button-text p-button-sm"
                        style={{ width: 20, height: 20, minWidth: 20 }}
                        onClick={onOpenTranslate}
                        tooltip={translateTooltip}
                        tooltipOptions={{ position: 'left' }}
                    />
                )}
            </div>
        </div>
        {multiline ? (
            <InputTextarea className="w-full p-inputtext-sm" rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
            <InputText className="w-full p-inputtext-sm" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
    </div>
);

export default LanguageField;
