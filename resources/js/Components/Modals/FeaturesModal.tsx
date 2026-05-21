import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import {
  CodeBracketIcon as CodeIcon,
  CircleStackIcon as DatabaseIcon,
  DocumentTextIcon as TemplateIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { Translations } from '@/i18n/types';

interface FeaturesModalProps {
  visible: boolean;
  onHide: () => void;
  onStartFree?: () => void;
  t: Translations;
}

interface FeatureItem {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

export default function FeaturesModal({ visible, onHide, onStartFree, t }: FeaturesModalProps) {
  const { colors } = useTheme();

  const features: FeatureItem[] = [
    {
      icon: <DatabaseIcon className="w-10 h-10" />,
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconColor: '#3b82f6',
      title: t.sqlParserTitle,
      description: t.sqlParserDesc,
    },
    {
      icon: <TemplateIcon className="w-10 h-10" />,
      iconBg: 'rgba(34, 197, 94, 0.12)',
      iconColor: '#22c55e',
      title: t.templateSystemTitle,
      description: t.templateSystemDesc,
    },
    {
      icon: <CodeIcon className="w-10 h-10" />,
      iconBg: 'rgba(168, 85, 247, 0.12)',
      iconColor: '#a855f7',
      title: t.multiLanguageTitle,
      description: t.multiLanguageDesc,
    },
    {
      icon: <SparklesIcon className="w-10 h-10" />,
      iconBg: 'rgba(234, 179, 8, 0.12)',
      iconColor: '#eab308',
      title: t.modernInterfaceTitle,
      description: t.modernInterfaceDesc,
    },
  ];

  const headerNode = (
    <div
      style={{
        background: `linear-gradient(135deg, ${colors.accent} 0%, #2563eb 60%, #7c3aed 100%)`,
        color: '#ffffff',
        padding: '2rem 2rem 1.75rem 2rem',
        width: '100%',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <SparklesIcon className="w-8 h-8" />
        <h2 className="text-3xl font-bold m-0" style={{ color: '#ffffff' }}>
          {t.featuresTitle}
        </h2>
      </div>
      <p className="text-base m-0 max-w-3xl" style={{ color: '#ffffff', opacity: 0.92 }}>
        {t.subtitle}
      </p>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      header={headerNode}
      style={{ width: '90vw', maxWidth: '1100px' }}
      contentStyle={{
        padding: 0,
        backgroundColor: colors.bgPrimary,
      }}
      headerStyle={{ padding: 0, border: 'none' }}
      className="features-modal"
    >
      <div className="grid md:grid-cols-2 gap-6 px-8 py-10">
        {features.map((feature, i) => (
          <div
            key={i}
            className="rounded-lg p-6 transition-transform features-modal-card"
            style={{
              backgroundColor: colors.bgSecondary,
              border: `1px solid ${colors.borderSecondary}`,
            }}
          >
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: feature.iconBg, color: feature.iconColor }}
            >
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
              {feature.title}
            </h3>
            <p className="leading-relaxed m-0" style={{ color: colors.textSecondary }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {onStartFree && (
        <div
          className="px-8 py-6 text-center"
          style={{
            backgroundColor: colors.bgSecondary,
            borderTop: `1px solid ${colors.borderSecondary}`,
          }}
        >
          <Button
            label={t.startFreeTrial}
            icon="pi pi-flag"
            className="p-button-primary p-button-lg"
            style={{ borderRadius: '8px' }}
            onClick={() => {
              onHide();
              onStartFree();
            }}
          />
        </div>
      )}

      <style>{`
        .features-modal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .features-modal .p-dialog-header {
          padding: 0 !important;
          border-bottom: none !important;
        }
        .features-modal .p-dialog-content {
          padding: 0 !important;
        }
        .features-modal .p-dialog-header-icons {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
        }
        .features-modal .p-dialog-header-close {
          color: #ffffff !important;
          opacity: 0.85;
        }
        .features-modal .p-dialog-header-close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </Dialog>
  );
}
