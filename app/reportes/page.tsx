'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, MapPin, Download, Calendar } from 'lucide-react';

export default function ReportesPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ReportesContent />
    </Suspense>
  );
}

function ReportesContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'vcards';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#003478', '#e31837', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
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
        <Topbar
          title={tab === 'vcards' ? "Reportes de vCards" : "Reportes de Portal Cautivo"}
          subtitle={tab === 'vcards' ? "Analítica de escaneos de tarjetas" : "Métricas de conexiones WiFi"}
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#003478]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Escaneos (7d)</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {data?.scansByDay?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-[#e31837]">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Sucursales Activas</p>
                <h3 className="text-2xl font-bold text-gray-900">{data?.branchData?.length || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Top Asesores</p>
                <h3 className="text-2xl font-bold text-gray-900">{data?.advisorData?.length || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Promedio Diario</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {Math.round((data?.scansByDay?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0) / 7)}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scans Timeline */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#003478]" />
                Tendencia de Escaneos (Últimos 7 días)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.scansByDay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#003478" strokeWidth={4} dot={{ r: 6, fill: '#003478', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} name="Escaneos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scans by Branch */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-[#003478]">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Participación por Sucursal
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.branchData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {data?.branchData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Advisors Performance */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#e31837]" />
              Rendimiento de Asesores
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.advisorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="scans" radius={[0, 4, 4, 0]} name="Escaneos Totales">
                    {data?.advisorData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#003478' : '#e31837'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
