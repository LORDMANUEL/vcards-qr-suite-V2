'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { VCardsGuidedTour } from '../../components/vcards-guided-tour';
import {
  Smartphone, Clock, Search, Download,
  TrendingUp, Eye, ChevronLeft, ChevronRight,
  Monitor, Tablet, ArrowLeft, Loader2, CheckCircle,
  MapPin,
} from 'lucide-react';

interface Scan {
  id: string;
  ipAddress: string | null;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  userAgent: string | null;
  scanMethod: string | null;
  scannedAt: string;
}

interface Stats {
  totalScans: number;
  totalFiltered: number;
  byDevice: { deviceType: string; count: number }[];
  byDate: { date: string; count: number }[];
}

function VCardScansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vcardId = searchParams.get('vcardId');

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    totalFiltered: 0,
    byDevice: [],
    byDate: [],
  });
  const [textFilter, setTextFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const itemsPerPage = 20;

  const fetchScans = useCallback(async (currentPage = 0) => {
    if (!vcardId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        vcardId,
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`/api/vcards/scans?${params}`);
      const data = await res.json();
      setScans(data.scans || []);
      setStats({
        totalScans: data.totalScans || 0,
        totalFiltered: data.totalFiltered ?? data.totalScans ?? 0,
        byDevice: data.byDevice || [],
        byDate: data.byDate || [],
      });
    } catch (e) {
      console.error('Error fetching scans:', e);
    } finally {
      setLoading(false);
    }
  }, [vcardId, dateFrom, dateTo]);

  useEffect(() => {
    setPage(0);
    fetchScans(0);
  }, [vcardId, dateFrom, dateTo]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchScans(newPage);
  };

  // Client-side text filter over current page records
  const filteredScans = scans.filter(scan => {
    if (!textFilter) return true;
    const q = textFilter.toLowerCase();
    return (
      scan.ipAddress?.toLowerCase().includes(q) ||
      scan.deviceType?.toLowerCase().includes(q) ||
      scan.userAgent?.toLowerCase().includes(q) ||
      scan.country?.toLowerCase().includes(q) ||
      scan.city?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(stats.totalFiltered / itemsPerPage);

  const getDeviceIcon = (device: string | null) => {
    if (device === 'mobile') return <Smartphone size={16} className="text-blue-500" />;
    if (device === 'tablet') return <Tablet size={16} className="text-purple-500" />;
    return <Monitor size={16} className="text-gray-500" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportScansToCsv = async () => {
    if (!vcardId) return;
    setExporting(true);
    try {
      // Fetch all records for export (no server pagination limit)
      const params = new URLSearchParams({ vcardId, page: '0', limit: '10000' });
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`/api/vcards/scans?${params}`);
      const data = await res.json();
      const allScans: Scan[] = data.scans || [];
      if (!allScans.length) {
        alert('No hay datos para exportar');
        return;
      }

      const headers = ['Fecha', 'Dispositivo', 'IP', 'Pais', 'Ciudad', 'Navegador', 'Metodo'];
      const rows = allScans.map((scan) => [
        formatDate(scan.scannedAt),
        scan.deviceType || 'unknown',
        scan.ipAddress || '',
        scan.country || '',
        scan.city || '',
        scan.userAgent || '',
        scan.scanMethod || 'QR',
      ]);

      const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
      const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `vcard-scans-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } finally {
      setExporting(false);
    }
  };

  const thisWeekCount = stats.byDate.slice(0, 7).reduce((sum, d) => sum + Number(d.count), 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Registro de Escaneos" subtitle="Tracking de visitantes del vCard QR" />

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Registro de Escaneos</h1>
                <p className="text-gray-500">Tracking de visitantes del vCard QR</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/vcards')}
                  data-tour-id="scans-back"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <ArrowLeft size={18} />
                  Volver a vCards
                </button>
                <button
                  onClick={exportScansToCsv}
                  disabled={exporting}
                  data-tour-id="scans-export"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {exporting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : exportDone ? (
                    <CheckCircle size={18} className="text-green-300" />
                  ) : (
                    <Download size={18} />
                  )}
                  {exportDone ? 'Descargado ✓' : 'Exportar CSV'}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Eye className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Escaneos</p>
                    <p className="text-2xl font-bold">{stats.totalScans}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Smartphone className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Móviles</p>
                    <p className="text-2xl font-bold">
                      {stats.byDevice.find(d => d.deviceType === 'mobile')?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Monitor className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Escritorio</p>
                    <p className="text-2xl font-bold">
                      {stats.byDevice.find(d => d.deviceType === 'desktop')?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Esta Semana</p>
                    <p className="text-2xl font-bold">{thisWeekCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div data-tour-id="scans-filters" className="p-4 border-b flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por IP, país, ciudad o navegador..."
                    value={textFilter}
                    onChange={(e) => setTextFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Desde</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Hasta</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Limpiar fechas
                  </button>
                )}
              </div>

              {/* Table */}
              <div data-tour-id="scans-table" className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispositivo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">País / Ciudad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Navegador</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          <Loader2 className="animate-spin inline mr-2" size={18} />
                          Cargando...
                        </td>
                      </tr>
                    ) : filteredScans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No hay escaneos registrados
                        </td>
                      </tr>
                    ) : (
                      filteredScans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-sm">{formatDate(scan.scannedAt)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(scan.deviceType)}
                              <span className="text-sm capitalize">{scan.deviceType || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-gray-600">{scan.ipAddress || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {scan.country || scan.city ? (
                              <div className="flex items-center gap-1">
                                <MapPin size={13} className="text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-700">
                                  {[scan.country, scan.city].filter(Boolean).join(' / ')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500 max-w-xs truncate block">
                              {scan.userAgent ? scan.userAgent.slice(0, 55) + '…' : 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {scan.scanMethod || 'QR'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Página {page + 1} de {totalPages} · {stats.totalFiltered} resultado{stats.totalFiltered !== 1 ? 's' : ''}
                    {(dateFrom || dateTo) ? ' (filtrados)' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(0, page - 1))}
                      disabled={page === 0 || loading}
                      title="Página anterior"
                      aria-label="Página anterior"
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-semibold">{page + 1} / {totalPages}</span>
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1 || loading}
                      title="Página siguiente"
                      aria-label="Página siguiente"
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <VCardsGuidedTour
              tourId="scans-v1"
              title="Guia premium de escaneos"
              steps={[
                {
                  id: 'scans-export-step',
                  selector: '[data-tour-id="scans-export"]',
                  title: 'Descarga el reporte en un clic',
                  description: 'Este boton baja el historial en CSV. Ideal para enviar resultados a gerencia o mercadeo.',
                },
                {
                  id: 'scans-filters-step',
                  selector: '[data-tour-id="scans-filters"]',
                  title: 'Filtra por fecha y texto',
                  description: 'Primero escribe IP, pais o ciudad. Luego ajusta Desde y Hasta para ver solo el periodo que necesitas.',
                },
                {
                  id: 'scans-table-step',
                  selector: '[data-tour-id="scans-table"]',
                  title: 'Lee el detalle del visitante',
                  description: 'Aqui ves hora, dispositivo, ubicacion y navegador para entender de donde llegan tus escaneos.',
                },
                {
                  id: 'scans-back-step',
                  selector: '[data-tour-id="scans-back"]',
                  title: 'Regresa rapido al modulo vCards',
                  description: 'Cuando termines de revisar analitica, vuelve aqui para seguir creando o editando tarjetas.',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VCardScansPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin mr-2" size={24} />Cargando...</div>}>
      <VCardScansContent />
    </Suspense>
  );
}
