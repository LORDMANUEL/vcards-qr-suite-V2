'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Users, QrCode, MapPin, MousePointerClick, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardData {
  kpis: {
    totalScans: number;
    totalVCards: number;
    totalBranches: number;
    totalUsers: number;
  };
  charts: {
    trend: { date: string; count: number }[];
    devices: { type: string; count: number }[];
  };
  topAdvisors: { name: string; totalScans: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  // Charts Config
  const trendData = {
    labels: data?.charts.trend.map(t => new Date(t.date).toLocaleDateString('es-HN')) || [],
    datasets: [
      {
        label: 'Escaneos Diarios',
        data: data?.charts.trend.map(t => t.count) || [],
        borderColor: '#003478',
        backgroundColor: 'rgba(0, 52, 120, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const deviceData = {
    labels: data?.charts.devices.map(d => d.type) || [],
    datasets: [
      {
        data: data?.charts.devices.map(d => d.count) || [],
        backgroundColor: ['#003478', '#10B981', '#F59E0B', '#6B7280'],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard Analytics" subtitle="Métricas y rendimiento de vCards" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mr-4">
                <MousePointerClick className="w-7 h-7 text-[#003478]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Escaneos</p>
                <h3 className="text-2xl font-bold text-gray-900">{data?.kpis.totalScans || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mr-4">
                <QrCode className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">vCards Activas</p>
                <h3 className="text-2xl font-bold text-gray-900">{data?.kpis.totalVCards || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mr-4">
                <MapPin className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Sucursales</p>
                <h3 className="text-2xl font-bold text-gray-900">{data?.kpis.totalBranches || 0}</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mr-4">
                <Users className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Usuarios Asesores</p>
                <h3 className="text-2xl font-bold text-gray-900">{data?.kpis.totalUsers || 0}</h3>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  Tendencia de Escaneos (7 Días)
                </h3>
              </div>
              <div className="h-72 w-full">
                {data?.charts.trend.length ? (
                  <Line data={trendData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">No hay datos recientes</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Dispositivos</h3>
              <div className="h-64 w-full flex justify-center">
                {data?.charts.devices.length ? (
                  <Doughnut data={deviceData} options={{ maintainAspectRatio: false }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Advisors */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Top 5 Asesores (Más escaneados)
            </h3>
            <div className="space-y-4">
              {data?.topAdvisors.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay datos suficientes.</p>
              ) : (
                data?.topAdvisors.map((advisor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#003478] text-white flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-900">{advisor.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#003478] bg-blue-50 px-3 py-1 rounded-full">
                      {advisor.totalScans} vistas
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
