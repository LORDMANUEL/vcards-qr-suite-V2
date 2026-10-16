'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Palette,
  QrCode,
  Globe,
  Edit,
  BarChart3,
  Database,
  UserCog,
  Settings,
  LogOut,
  Printer,
  Building2,
} from 'lucide-react';
import {
  canBulkImportVcards,
  canManageCompanies,
  canManageSystemUsers,
  canManageThemes,
  canViewVcards,
} from '@/lib/permissions';

type MenuItem = {
  name: string;
  icon: typeof LayoutDashboard;
  href: string;
  canView: (role: string | undefined) => boolean;
};

const isSystemRole = (role: string | undefined) => Boolean(role);
const isSuperAdmin = (role: string | undefined) => role === 'SUPER_ADMIN';

const menuGroups = [
  {
    name: 'General',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', canView: isSystemRole },
    ]
  },
  {
    name: 'vCards',
    items: [
      { name: 'Generador QR/vCards', icon: QrCode, href: '/vcards', canView: canViewVcards },
      { name: 'Empresas vCard', icon: Building2, href: '/vcards/companias', canView: canManageCompanies },
      { name: 'Theme Builder', icon: Edit, href: '/vcards/theme-builder', canView: canManageThemes },
      { name: 'Editor Temas vCard', icon: Palette, href: '/vcards/temas', canView: canManageThemes },
      { name: 'Editor de Tarjetas', icon: Printer, href: '/vcards/editor', canView: canBulkImportVcards },
      { name: 'Reportes de Escaneo', icon: BarChart3, href: '/reportes?tab=vcards', canView: canViewVcards },
    ]
  },
  {
    name: 'Sistema',
    items: [
      { name: 'Administración de portales', icon: Globe, href: '/portales', canView: canManageCompanies },
      { name: 'Gestión Usuarios', icon: UserCog, href: '/usuarios-admin', canView: canManageSystemUsers },
      { name: 'Temas Admin', icon: Palette, href: '/temas-admin', canView: canManageThemes },
      { name: 'BD Manager', icon: Database, href: '/backup', canView: isSuperAdmin },
      { name: 'Configuración', icon: Settings, href: '/configuraciones', canView: canManageThemes },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  const user = session?.user;
  const role = user?.role;
  const initials = user?.name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? 'U';

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-[#003478]">YUDE VCards</h1>
        <p className="text-sm text-gray-600 mt-1">Administración empresarial</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <div className="px-4 space-y-6">
          {menuGroups.map((group) => {
            const visibleItems = (group.items as MenuItem[]).filter((item) => item.canView(role));
            if (visibleItems.length === 0) return null;

            return (
            <div key={group.name} className="space-y-2">
              <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {group.name}
              </h3>
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const itemPath = item.href.split('?')[0];
                  const isActive = pathname === itemPath || pathname.startsWith(`${itemPath}/`);

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-[#003478] text-white shadow-lg shadow-blue-100'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#003478]'}`} />
                          <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                        </div>
                        {isActive && <div className="w-1.5 h-6 bg-white rounded-full translate-x-3" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#003478] flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-600 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
