// resources/js/pages/Index.tsx
import DockLayout from '@/components/DockLayout';

export default function Index() {
  return <DockLayout />;
}

// Kein Layout verwenden, da RC Dock das komplette Layout übernimmt
Index.layout = (page: React.ReactNode) => page;