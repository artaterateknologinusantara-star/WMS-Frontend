'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard, Boxes, TruckIcon, BarChart3, Database, Settings,
  ChevronDown, ChevronRight, Search, Headphones, Circle,
  ArrowDownToLine, LogOut, X,
} from 'lucide-react';

interface NavChild {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavChild[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Warehouse',
    icon: <ArrowDownToLine size={18} />,
    badge: 2,
    children: [
      { label: 'Receiving', href: '/', icon: <Circle size={8} /> },
      { label: 'Putaway', href: '/putaway', icon: <Circle size={8} /> },
    ],
  },
  {
    label: 'Inventory',
    icon: <Boxes size={18} />,
    children: [
      { label: 'Stock On Hand', href: '/inventory/stock-on-hand', icon: <Circle size={8} /> },
      { label: 'Inventory Adjustment', href: '/inventory/adjustment', icon: <Circle size={8} /> },
    ],
  },
  {
    label: 'Outbound',
    icon: <TruckIcon size={18} />,
    children: [
      { label: 'Picking List', href: '/outbound/picking', icon: <Circle size={8} /> },
      { label: 'Packing', href: '/outbound/packing', icon: <Circle size={8} /> },
      { label: 'Dispatch', href: '/outbound/dispatch', icon: <Circle size={8} /> },
    ],
  },
  {
    label: 'Reports',
    icon: <BarChart3 size={18} />,
    children: [
      { label: 'Receiving Report', href: '#', icon: <Circle size={8} /> },
      { label: 'Putaway Report', href: '#', icon: <Circle size={8} /> },
      { label: 'Stock Movement', href: '#', icon: <Circle size={8} /> },
    ],
  },
  {
    label: 'Master Data',
    icon: <Database size={18} />,
    children: [
      { label: 'SKU Master', href: '#', icon: <Circle size={8} /> },
      { label: 'Supplier List', href: '#', icon: <Circle size={8} /> },
      { label: 'Bin Locations', href: '#', icon: <Circle size={8} /> },
    ],
  },
  {
    label: 'Settings',
    icon: <Settings size={18} />,
    children: [
      { label: 'Users & Roles', href: '#', icon: <Circle size={8} /> },
      { label: 'Warehouse Config', href: '#', icon: <Circle size={8} /> },
    ],
  },
];

function getActiveParent(pathname: string): string | null {
  for (const item of navItems) {
    if (item.children) {
      const hasActive = item.children.some(
        c => c.href === pathname || (c.href === '/' && pathname === '/')
      );
      if (hasActive) return item.label;
    }
  }
  return null;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'SA';

  useEffect(() => {
    const active = getActiveParent(pathname);
    if (active) setExpandedItem(active);
  }, [pathname]);

  // Close sidebar on mobile when navigating
  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const toggleExpand = (label: string) => {
    setExpandedItem(prev => (prev === label ? null : label));
  };

  const isChildActive = (item: NavItem) =>
    item.children?.some(c => c.href === pathname || (c.href === '/' && pathname === '/'));

  const filteredNav = searchQuery
    ? navItems.filter(
        item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.children?.some(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : navItems;

  return (
    <aside
      className={[
        'sidebar-bg flex flex-col h-full w-[260px] min-w-[260px] border-r sidebar-border overflow-hidden',
        // Mobile: fixed drawer sliding in from left
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        // Desktop: always visible, relative positioning
        'lg:relative lg:translate-x-0 lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Logo + mobile close button */}
      <div className="flex items-center gap-3 px-4 py-4 border-b sidebar-border">
        <div className="flex items-center gap-2 flex-1">
          <AppLogo size={40} />
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-sm tracking-tight">DARING MANDIRI</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-accent">SYNTERA WMS</span>
            </div>
            <span className="text-xs sidebar-text" style={{ fontSize: '10px' }}>Warehouse Management System</span>
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded transition-colors sidebar-text hover:text-white flex-shrink-0"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Profile */}
      <div className="px-4 py-3 border-b sidebar-border">
        <p className="text-xs font-semibold sidebar-text uppercase tracking-widest mb-2">Profile</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.fullName ?? 'Loading...'}</p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              <span className="text-xs sidebar-text">Online</span>
            </div>
            <p className="text-xs sidebar-text truncate">{user?.role ?? ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex-shrink-0 p-1 rounded transition-colors sidebar-text hover:text-red-400"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b sidebar-border">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 sidebar-text" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded border sidebar-border text-white placeholder:sidebar-text outline-none focus:border-primary"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text)' }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {filteredNav.map(item => {
          const hasChildren = !!item.children;
          const isExpanded = expandedItem === item.label;
          const isActive = item.href
            ? item.href === '/' ? pathname === '/' : pathname === item.href
            : false;
          const childActive = isChildActive(item);

          if (!hasChildren) {
            return (
              <Link
                key={`nav-${item.label}`}
                href={item.href!}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150 mb-0.5 ${
                  isActive
                    ? 'sidebar-active-bg sidebar-text-active'
                    : 'sidebar-text hover:sidebar-hover hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <div key={`nav-${item.label}`}>
              <button
                onClick={() => toggleExpand(item.label)}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150 mb-0.5 w-full text-left ${
                  childActive
                    ? 'sidebar-active-bg sidebar-text-active'
                    : 'sidebar-text hover:sidebar-hover hover:text-white'
                }`}
                style={{ background: childActive ? 'var(--sidebar-active)' : undefined }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full mr-1">
                    {item.badge}
                  </span>
                )}
                <span
                  className="flex-shrink-0 transition-transform duration-200"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <ChevronDown size={14} />
                </span>
              </button>

              <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{
                  maxHeight: isExpanded ? `${(item.children?.length ?? 0) * 44}px` : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="ml-4 mr-2 mb-1">
                  {item.children!.map(child => {
                    const childIsActive =
                      child.href === '/' ? pathname === '/' : pathname === child.href;
                    return (
                      <Link
                        key={`child-${item.label}-${child.label}`}
                        href={child.href}
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 px-4 py-2 rounded text-sm transition-all duration-150 mb-0.5 ${
                          childIsActive
                            ? 'text-white font-semibold'
                            : 'sidebar-text hover:text-white font-medium'
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5">{child.icon}</span>
                        <span>{child.label}</span>
                        {childIsActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-success" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Help */}
      <div className="p-3 border-t sidebar-border">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded transition-all duration-150 hover:sidebar-hover group">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Headphones size={14} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-xs font-semibold">Need Help?</p>
            <p className="text-xs sidebar-text">Contact Support</p>
          </div>
          <ChevronRight size={14} className="sidebar-text group-hover:text-white" />
        </button>
      </div>
    </aside>
  );
}
