'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Palette,
  Megaphone,
  QrCode,
  Link as LinkIcon,
  CheckCircle,
  Globe,
  Eye,
  Edit,
  BarChart3,
  Image as ImageIcon,
  Wifi,
  Database,
  UserCog,
  MapPin,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  History,
  Printer,
  Building2,
} from 'lucide-react';

const menuGroups = [
  {
    name: 'General',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    name: 'vCards',
    items: [
      { name: 'Generador QR/vCards', icon: QrCode, href: '/vcards' },
      { name: 'Empresas vCard', icon: Building2, href: '/vcards/companias' },
      { name: 'Theme Builder', icon: Edit, href: '/vcards/theme-builder' },
      { name: 'Editor Temas vCard', icon: Palette, href: '/vcards/temas' },
      { name: 'Editor de Tarjetas', icon: Printer, href: '/vcards/editor' },
      { name: 'Reportes de Escaneo', icon: BarChart3, href: '/reportes?tab=vcards' },
    ]
  },
  {
    name: 'Portales Cautivos',
      items: [
        { name: 'Usuarios Conectados', icon: Wifi, href: '/usuarios' },
        { name: 'Temas Portales', icon: Palette, href: '/temas-portal' },
        { name: 'Sucursales Portal', icon: MapPin, href: '/portales/sucursales' },
        { name: 'Links Portales', icon: LinkIcon, href: '/links' },
        { name: 'Promociones', icon: Megaphone, href: '/promociones' },
        { name: 'Reportes Portal', icon: BarChart3, href: '/reportes?tab=portal' },
      ]
  },
  {
    name: 'Sistema',
    items: [
      { name: 'Gestión Usuarios', icon: UserCog, href: '/usuarios-admin' },
      { name: 'Temas Admin', icon: Palette, href: '/temas-admin' },
      { name: 'BD Manager', icon: Database, href: '/backup' },
      { name: 'Configuración', icon: Settings, href: '/configuraciones' },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  const user = session?.user;
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
        <h1 className="text-xl font-bold text-[#003478]">Ford Admin</h1>
        <p className="text-sm text-gray-600 mt-1">Portal Cautivo</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <div className="px-4 space-y-6">
          {menuGroups.map((group) => (
            <div key={group.name} className="space-y-2">
              <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {group.name}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

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
          ))}
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
