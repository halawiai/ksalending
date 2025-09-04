'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  Home, 
  Users, 
  Building2, 
  University, 
  Settings, 
  LogOut,
  Bell,
  Search,
  User,
  CreditCard,
  BarChart3,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavigationProps {
  entityType?: 'individual' | 'company' | 'institution';
  userName?: string;
  notifications?: number;
}

export function MobileNavigation({ entityType, userName, notifications = 0 }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { href: '/', icon: Home, label: 'Home', active: pathname === '/' },
    { href: '/individual', icon: Users, label: 'Individual', active: pathname === '/individual' },
    { href: '/company', icon: Building2, label: 'Company', active: pathname === '/company' },
    { href: '/institution', icon: University, label: 'Institution', active: pathname === '/institution' },
    { href: '/fraud', icon: Shield, label: 'Fraud Detection', active: pathname === '/fraud' },
    { href: '/portal', icon: BarChart3, label: 'Partner Portal', active: pathname === '/portal' },
  ];

  const quickActions = [
    { href: '/onboarding/individual', icon: CreditCard, label: 'New Assessment' },
    { href: '/individual', icon: User, label: 'My Profile' },
    { href: '/portal', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-emerald-700">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{userName || 'User'}</h3>
                      <p className="text-xs text-emerald-100 capitalize">{entityType || 'Individual'}</p>
                    </div>
                  </div>
                  {notifications > 0 && (
                    <Badge className="bg-white/20 text-white">
                      {notifications} notifications
                    </Badge>
                  )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Main Navigation
                    </div>
                    {navigationItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={item.active ? 'default' : 'ghost'}
                          className={`w-full justify-start ${
                            item.active 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : 'text-gray-700 hover:bg-emerald-50'
                          }`}
                        >
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Quick Actions
                    </div>
                    <div className="space-y-2">
                      {quickActions.map((action) => (
                        <Link key={action.href} href={action.href} onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <action.icon className="w-4 h-4 mr-3" />
                            {action.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t space-y-2">
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
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-emerald-900">KSA Lending</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-emerald-700 relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="text-emerald-700">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-emerald-200 z-40">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full h-16 flex flex-col gap-1 ${
                  item.active 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}