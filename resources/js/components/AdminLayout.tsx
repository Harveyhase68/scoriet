import { ReactNode } from "react";
import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Activity,
  Database,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Benutzer", href: "/users", icon: Users },
  { name: "Aktivität", href: "/activity", icon: Activity },
  { name: "Sicherheit", href: "/security", icon: Shield },
  { name: "Datenbank", href: "/database", icon: Database },
  { name: "Einstellungen", href: "/admin-settings", icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { url } = usePage(); // Hier oben aufrufen!

  // Debug Mode (einfach auf true setzen wenn du debuggen willst)
  const DEBUG = true;
  
  if (DEBUG) {
    console.log('=== DEBUG INFO ===');
    console.log('Current URL:', url);
    console.log('Navigation array:', navigation);
  }
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AdminPanel</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = url === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@example.com</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
