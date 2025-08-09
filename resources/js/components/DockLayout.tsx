// resources/js/components/DockLayout.tsx
import { useState, useRef } from 'react';
import { DockLayout as RCDockLayout, LayoutBase, TabData, DockLayoutRef } from 'rc-dock';
import 'rc-dock/dist/rc-dock.css';
import StatsCards from './StatsCards';
import LoginTable from './LoginTable';
import { Link, usePage } from '@inertiajs/react';
import { 
  Home, 
  Users, 
  Activity, 
  Shield, 
  Database, 
  Settings,
  Palette,
  Menu
} from 'lucide-react';
import React from 'react';

// Navigation Component mit deinem Builder.io Design
function Navigation({ onOpenModal }: { onOpenModal: () => void }) {
  const { url } = usePage();
  
  const menuItems = [
    { name: 'Dashboard', href: '/', icon: Home, action: 'navigate' },
    { name: 'Users', href: '/users', icon: Users, action: 'modal' }, // Modal öffnen
    { name: 'Activity', href: '/activity', icon: Activity, action: 'navigate' },
    { name: 'Security', href: '/security', icon: Shield, action: 'navigate' },
    { name: 'Database', href: '/database', icon: Database, action: 'navigate' },
    { name: 'Database Designer', href: '/database-designer', icon: Palette, action: 'navigate' },
    { name: 'Settings', href: '/admin-settings', icon: Settings, action: 'navigate' },
  ];

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Scoriet Admin
        </h2>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = url === item.href;
          
          const handleClick = (e: React.MouseEvent) => {
            if (item.action === 'modal') {
              e.preventDefault();
              onOpenModal();
            }
          };
          
          return item.action === 'modal' ? (
            <button
              key={item.name}
              onClick={handleClick}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </button>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// Modal Content Component
function UserModal({ onClose }: { onClose: () => void }) {
  
  // ESC Key zum Schließen
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Hallo User!</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>
      <div className="space-y-4">
        <p className="text-gray-600">
          Dies ist jetzt ein echtes Modal, das unabhängig von RC Dock funktioniert!
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Echtes Modal (nicht RC Dock abhängig)</li>
            <li>• Backdrop zum Schließen</li>
            <li>• ESC-Taste zum Schließen</li>
            <li>• Bleibt offen bei Navigation</li>
            <li>• z-index: 50 (über allem)</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            OK, Verstanden
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              alert('Weitere Aktion ausgeführt!');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent() {
  return (
    <div className="h-full overflow-auto bg-white">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Übersicht über System-Aktivitäten und Benutzer-Logins</p>
      </div>
      <StatsCards />
      <div className="px-4 pb-4">
        <LoginTable />
      </div>
    </div>
  );
}

// Placeholder für andere Inhalte
function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">Hier wird der Inhalt für {title} angezeigt</p>
      </div>
    </div>
  );
}

export default function DockLayout() {
  const { url } = usePage();
  const dockRef = useRef<DockLayoutRef>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Modal öffnen/schließen
  const openUserModal = () => setIsUserModalOpen(true);
  const closeUserModal = () => setIsUserModalOpen(false);
  
  // Bestimme den aktiven Content basierend auf der URL
  const getActiveContent = () => {
    switch (url) {
      case '/':
        return <DashboardContent />;
      case '/users':
        return <PlaceholderContent title="Users" />;
      case '/activity':
        return <PlaceholderContent title="Activity" />;
      case '/security':
        return <PlaceholderContent title="Security" />;
      case '/database':
        return <PlaceholderContent title="Database" />;
      case '/database-designer':
        return <PlaceholderContent title="Database Designer" />;
      case '/admin-settings':
        return <PlaceholderContent title="Settings" />;
      default:
        return <DashboardContent />;
    }
  };

  const defaultLayout: LayoutBase = {
    dockbox: {
      mode: 'horizontal',
      children: [
        {
          mode: 'vertical',
          size: 60,
          children: [
            {
              tabs: [
                {
                  id: 'navigation',
                  title: 'Navigation',
                  content: <Navigation onOpenModal={openUserModal} />,
                  closable: false,
                  cached: true
                }
              ]
            }
          ]
        },
        {
          mode: 'vertical',
          size: 340,
          children: [
            {
              tabs: [
                {
                  id: 'main-content',
                  title: 'Main',
                  content: getActiveContent(),
                  closable: false,
                  cached: true
                }
              ]
            }
          ]
        }
      ]
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <RCDockLayout
        ref={dockRef}
        defaultLayout={defaultLayout}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* Echtes Modal Overlay */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 backdrop-blur-sm transition-opacity"
            style={{
              backgroundColor: 'rgba(75, 85, 99, 0.2)' // gray-600 mit 30% opacity
            }}
            onClick={closeUserModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
            <UserModal onClose={closeUserModal} />
          </div>
        </div>
      )}
    </div>
  );
}