'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { ShieldAlert, Search, DatabaseBackup, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export default function LogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (!['ADMIN', 'IT'].includes(session?.user?.role || '')) {
        router.push('/dashboard'); // Kick out normal users
      } else {
        fetchLogs();
      }
    }
  }, [status, router, session]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = logs.filter(l =>
      l.user.name.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entityName.toLowerCase().includes(q) ||
      (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=300'); // Let's keep recent memory for UI speed
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETED': return 'bg-red-100 text-red-800 border-red-200';
      case 'FAILED_LOGIN': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOGIN': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Auditoría ISO 27001" subtitle="Trazabilidad estricta de acciones administrativas" />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
          <div className="mb-6 flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 shadow-sm">
            <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-bold text-base mb-1">Registro de Cumplimiento (Compliance Log)</h4>
              <p>Este tablero es inmutable. Registra cualquier alteración en el sistema para garantizar la trazabilidad según los lineamientos de la ISO 27001/9001. Las modificaciones a las VCards, roles de usuario, o esquemas, quedarán permanently marcados con la Autoridad (Usuario) en curso y la IP Origen.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm flex flex-col flex-1 border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filtrar por usuario, acción (CREATED, DELETED), IP o módulo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none transition-shadow"
                />
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Mostrando: <b>{filteredLogs.length}</b> eventos
              </div>
            </div>

            {/* Logs Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                    <th className="px-6 py-4 font-bold">Autor / Empleado</th>
                    <th className="px-6 py-4 font-bold">Acción</th>
                    <th className="px-6 py-4 font-bold">Módulo Afectado</th>
                    <th className="px-6 py-4 font-bold">IP Origen</th>
                    <th className="px-6 py-4 font-bold">ID Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <DatabaseBackup className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No se encontraron registros de auditoría.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const dateObj = new Date(log.createdAt);
                      return (
                        <tr key={log.id} className="bg-white hover:bg-gray-50 transition-colors font-mono">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{dateObj.toLocaleDateString('es-HN')}</div>
                            <div className="text-xs text-gray-500">{dateObj.toLocaleTimeString('es-HN')}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[#003478]">{log.user.name}</div>
                            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{log.user.role}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {log.entityName}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {log.ipAddress || 'Internal/Backend'}
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-400 select-all truncate max-w-[120px]" title={log.entityId}>
                            {log.entityId}
                          </td>
                        </tr>
                      );
                    })
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
