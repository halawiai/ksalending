'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Home, 
  Users, 
  Building2, 
  University, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  entityType: 'individual' | 'company' | 'institution';
}

export function DashboardLayout({ children, entityType }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/individual', icon: Users, label: 'Individual', active: entityType === 'individual' },
    { href: '/company', icon: Building2, label: 'Company', active: entityType === 'company' },
    { href: '/institution', icon: University, label: 'Institution', active: entityType === 'institution' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-green-900">KSA Lending</h2>
          <p className="text-sm text-gray-600">Nervous System</p>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    item.active 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-4 left-3 right-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-gray-700">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-600">
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold">KSA Lending System</h1>
        </div>

        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}