'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Wifi, Search, Clock, Shield, AlertCircle, RefreshCw, Ban, CheckCircle2, Download, TimerOff } from 'lucide-react';

interface PortalSession {
  id: string;
  macAddress: string;
  ipAddress: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  expiresAt: string | null;
  renewalCount?: number;
  branch?: {
    name: string;
  } | null;
  accessPoint?: {
    name: string;
    identifier: string;
  } | null;
  statusDetail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [apFilter, setApFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadSessions();
    }
  }, [status, router]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      setActionLoading(`revoke-${sessionId}`);
      await fetch('/api/portal/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      await loadSessions();
    } finally {
      setActionLoading(null);
    }
  };

  const handleAuthorize = async (sessionId: string) => {
    try {
      setActionLoading(`authorize-${sessionId}`);
      await fetch('/api/portal/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      await loadSessions();
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpireSweep = async () => {
    try {
      setActionLoading('expire-sweep');
      await fetch('/api/portal/expire', { method: 'POST' });
      await loadSessions();
    } finally {
      setActionLoading(null);
    }
  };

  const exportCsv = () => {
    const header = ['MAC', 'IP', 'Cliente', 'Email', 'Telefono', 'Sucursal', 'AP', 'Estado', 'Renovaciones', 'Creada', 'Expira'];
    const rows = filteredSessions.map((s) => [
      s.macAddress,
      s.ipAddress || '',
      s.name || '',
      s.email || '',
      s.phone || '',
      s.branch?.name || '',
      s.accessPoint?.name || '',
      s.status,
      String(s.renewalCount || 0),
      s.createdAt,
      s.expiresAt || '',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-portal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter((s) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search ||
      s.macAddress.toLowerCase().includes(search) ||
      (s.ipAddress || '').toLowerCase().includes(search) ||
      (s.branch?.name || '').toLowerCase().includes(search) ||
      (s.accessPoint?.name || '').toLowerCase().includes(search) ||
      (s.name || '').toLowerCase().includes(search) ||
      (s.email || '').toLowerCase().includes(search) ||
      (s.phone || '').toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesBranch = branchFilter === 'ALL' || (s.branch?.name || '-') === branchFilter;
    const matchesAp = apFilter === 'ALL' || (s.accessPoint?.name || '-') === apFilter;

    return matchesSearch && matchesStatus && matchesBranch && matchesAp;
  });

  const branchOptions = Array.from(new Set(sessions.map((s) => s.branch?.name || '-'))).sort();
  const apOptions = Array.from(new Set(sessions.map((s) => s.accessPoint?.name || '-'))).sort();

  const counters = {
    total: sessions.length,
    authorized: sessions.filter((s) => s.status === 'AUTHORIZED').length,
    pending: sessions.filter((s) => s.status === 'PENDING').length,
    revoked: sessions.filter((s) => s.status === 'REVOKED').length,
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AUTHORIZED':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">Autorizado</span>;
      case 'EXPIRED':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-200">Expirado</span>;
      case 'REVOKED':
        return <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-orange-200">Revocado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Usuarios Conectados" subtitle="Monitoreo de conexiones al Portal Cautivo WiFi" />
        <main className="flex-1 overflow-y-auto p-6">

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Administracion de Clientes Portal</h2>
                  <p className="text-sm text-gray-500">{filteredSessions.length} resultados de {sessions.length} sesiones registradas</p>
                </div>
              </div>

              <div className="flex w-full md:w-auto gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por MAC, IP o Sucursal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none text-sm"
                  />
                </div>
                <button
                  onClick={loadSessions}
                  className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Refrescar"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleExpireSweep}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-amber-700 text-sm font-bold"
                  title="Marcar vencidas"
                  disabled={actionLoading === 'expire-sweep'}
                >
                  <TimerOff className="w-4 h-4" /> Expirar
                </button>
                <button
                  onClick={exportCsv}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-blue-700 text-sm font-bold"
                  title="Exportar CSV"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total</p>
                <p className="text-xl font-black text-gray-900">{counters.total}</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-green-600">Autorizados</p>
                <p className="text-xl font-black text-green-700">{counters.authorized}</p>
              </div>
              <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700">Pendientes</p>
                <p className="text-xl font-black text-yellow-800">{counters.pending}</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-600">Revocados</p>
                <p className="text-xl font-black text-red-700">{counters.revoked}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700"
              >
                <option value="ALL">Todos los estados</option>
                <option value="AUTHORIZED">Autorizados</option>
                <option value="PENDING">Pendientes</option>
                <option value="EXPIRED">Expirados</option>
                <option value="REVOKED">Revocados</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700"
              >
                <option value="ALL">Todas las sucursales</option>
                {branchOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select
                value={apFilter}
                onChange={(e) => setApFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700"
              >
                <option value="ALL">Todos los AP</option>
                {apOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Dispositivo / MAC</th>
                    <th className="px-6 py-4">Dirección IP</th>
                    <th className="px-6 py-4">Sucursal</th>
                    <th className="px-6 py-4">AP</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Desde</th>
                    <th className="px-6 py-4">Expiración</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 opacity-20" />
                          <p>No hay sesiones activas registradas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800">{s.name || 'Invitado'}</div>
                          <div className="text-[11px] text-gray-500">{s.email || 'Sin correo'}</div>
                          <div className="text-[11px] text-gray-400">{s.phone || 'Sin telefono'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-[#003478]" />
                            </div>
                            <span className="font-mono text-xs font-bold text-gray-700">{s.macAddress}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {s.ipAddress || '---.---.---.---'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-semibold">{s.branch?.name || 'Invitado Global'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700 font-semibold">{s.accessPoint?.name || 'Default'}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{s.accessPoint?.identifier || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {getStatusBadge(s.status)}
                            {s.statusDetail ? <p className="text-[11px] text-gray-400 max-w-[220px]">{s.statusDetail}</p> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(s.createdAt).toLocaleString('es-HN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          <div className="font-semibold">
                            {s.expiresAt ? new Date(s.expiresAt).toLocaleString('es-HN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Indefinido'}
                          </div>
                          <div className="text-[11px] text-gray-400">Renovaciones: {s.renewalCount || 0}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {s.status === 'AUTHORIZED' ? (
                              <button
                                onClick={() => handleRevoke(s.id)}
                                disabled={actionLoading === `revoke-${s.id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                              >
                                <Ban className="w-3.5 h-3.5" /> Revocar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAuthorize(s.id)}
                                disabled={actionLoading === `authorize-${s.id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 disabled:opacity-60"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Autorizar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
