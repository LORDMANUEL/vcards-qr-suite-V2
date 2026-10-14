'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { Building2, Palette, Router, Wifi } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  city?: string | null;
  companyName?: string | null;
  portalTheme?: { id: string; name: string } | null;
}

interface AccessPoint {
  id: string;
  name: string;
  branchId: string;
  themeId?: string | null;
  themeName?: string | null;
  activeSessions?: number;
}

function PortalBranchDashboard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/branches').then((r) => r.json()),
      fetch('/api/access-points').then((r) => r.json()),
    ]).then(([branchData, apData]) => {
      setBranches(branchData.branches || []);
      setAccessPoints(apData.accessPoints || []);
    }).finally(() => setLoading(false));
  }, []);

  const cards = useMemo(() => branches.map((branch) => {
    const aps = accessPoints.filter((ap) => ap.branchId === branch.id);
    const overrides = aps.filter((ap) => ap.themeId);
    const activeSessions = aps.reduce((acc, ap) => acc + (ap.activeSessions || 0), 0);
    return { branch, aps, overrides, activeSessions };
  }), [branches, accessPoints]);

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Sucursales Portal" subtitle="Resumen de sucursales, temas efectivos y Access Points" />
        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-bold text-gray-500">Cargando sucursales portal...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {cards.map(({ branch, aps, overrides, activeSessions }) => (
                <section key={branch.id} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#003478]">
                        <Building2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-gray-900">{branch.city || branch.name}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{branch.companyName || 'Portal'}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tema sucursal</p>
                      <p className="mt-1 text-sm font-black text-gray-800">{branch.portalTheme?.name || 'Global default'}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <Router className="mx-auto mb-2 h-5 w-5 text-gray-400" />
                      <p className="text-lg font-black text-gray-900">{aps.length}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">APs</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <Palette className="mx-auto mb-2 h-5 w-5 text-gray-400" />
                      <p className="text-lg font-black text-gray-900">{overrides.length}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Overrides</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-center">
                      <Wifi className="mx-auto mb-2 h-5 w-5 text-gray-400" />
                      <p className="text-lg font-black text-gray-900">{activeSessions}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sesiones</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Access Points de la sucursal</p>
                    {aps.length ? aps.map((ap) => (
                      <div key={ap.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{ap.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400">Tema efectivo: {ap.themeName || branch.portalTheme?.name || 'Global default'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-800">{ap.activeSessions || 0}</p>
                          <p className="text-[10px] text-gray-400">activos</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-400">Sin Access Points registrados.</p>}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function PortalBranchesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <PortalBranchDashboard />
    </Suspense>
  );
}
