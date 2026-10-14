'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { ArrowLeft, Building2, Download, Loader2, Palette, Save, Sparkles, Trash2, Upload, Users } from 'lucide-react';
import { VCardsGuidedTour } from '../../components/vcards-guided-tour';

interface Theme {
  id: string;
  name: string;
  type?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

interface Branch {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  vcardTheme?: Theme | null;
  seasonalVcardTheme?: Theme | null;
  vcardThemeId?: string | null;
  seasonalVcardThemeId?: string | null;
  vcardPositionThemeRules?: Array<{
    positionGroup: string;
    themeId?: string | null;
    isEnabled: boolean;
  }>;
}

interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  position?: string | null;
  branchId?: string | null;
}

const ORG_BUCKETS = [
  { id: 'management', label: 'Gerencias', matcher: (employee: Employee) => /gerente|manager/i.test(employee.position || '') || employee.role === 'ADMIN' || employee.role === 'IT' || employee.role === 'SALES_MANAGER' },
  { id: 'sales', label: 'Ventas', matcher: (employee: Employee) => /venta|sales|comercial/i.test(employee.position || '') },
  { id: 'service', label: 'Asesores de servicio', matcher: (employee: Employee) => /servicio|service/i.test(employee.position || '') || employee.role === 'ADVISOR' },
  { id: 'other', label: 'Otros', matcher: () => true },
];

const POSITION_GROUPS = [
  { key: 'MANAGEMENT', label: 'Gerentes / Jefes / Encargados' },
  { key: 'SALES', label: 'Asesores de ventas' },
  { key: 'SERVICE', label: 'Asesores de servicio' },
  { key: 'OTHER', label: 'Otros puestos' },
];

const EMPTY_RULES = {
  MANAGEMENT: { isEnabled: false, themeId: '' },
  SALES: { isEnabled: false, themeId: '' },
  SERVICE: { isEnabled: false, themeId: '' },
  OTHER: { isEnabled: false, themeId: '' },
};

function formatSchedule(theme?: Theme | null) {
  if (!theme) return 'Sin calendario';
  if (!theme.validFrom && !theme.validTo) return 'Sin calendario';
  return `${theme.validFrom ? new Date(theme.validFrom).toLocaleDateString('es-HN') : 'inicio libre'} - ${theme.validTo ? new Date(theme.validTo).toLocaleDateString('es-HN') : 'sin fin'}`;
}

function VcardBranchesContent() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [savingBranchId, setSavingBranchId] = useState<string | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [importingBranchId, setImportingBranchId] = useState<string | null>(null);
  const [uploadTargetBranchId, setUploadTargetBranchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'ok' } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; city: string; address: string; vcardThemeId: string; seasonalVcardThemeId: string; positionRules: Record<string, { isEnabled: boolean; themeId: string }> }>>({});
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string, type: 'error' | 'ok' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const [branchData, companyData, themeData, userData] = await Promise.all([
        fetch('/api/branches').then((r) => r.json()),
        fetch('/api/companies').then((r) => r.json()),
        fetch('/api/vcard-themes').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
      ]);
      const branchList: Branch[] = branchData.branches || [];
      setBranches(branchList);
      setCompanies(companyData.companies || []);
      setThemes(themeData.themes || []);
      setEmployees(userData.users || []);
      setDrafts(Object.fromEntries(branchList.map((branch) => [branch.id, {
        positionRules: POSITION_GROUPS.reduce((acc, group) => {
          const existing = (branch.vcardPositionThemeRules || []).find((rule) => rule.positionGroup === group.key);
          acc[group.key] = { isEnabled: Boolean(existing?.isEnabled), themeId: existing?.themeId || '' };
          return acc;
        }, { ...EMPTY_RULES } as Record<string, { isEnabled: boolean; themeId: string }>),
        name: branch.name || '',
        city: branch.city || '',
        address: branch.address || '',
        vcardThemeId: branch.vcardThemeId || '',
        seasonalVcardThemeId: branch.seasonalVcardThemeId || '',
      }])));
    } catch {
      showToast('Error al cargar datos. Recarga la página.');
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const filteredBranches = useMemo(() => branches.filter((branch) => companyFilter === 'all' || branch.companyId === companyFilter), [branches, companyFilter]);

  const groupedEmployees = (branchId: string) => {
    const branchEmployees = employees.filter((employee) => employee.branchId === branchId);
    const used = new Set<string>();
    return ORG_BUCKETS.map((bucket) => {
      const members = branchEmployees.filter((employee) => {
        if (used.has(employee.id)) return false;
        const match = bucket.matcher(employee);
        if (match) used.add(employee.id);
        return match;
      });
      return { ...bucket, members };
    }).filter((bucket) => bucket.members.length > 0);
  };

  const updateDraft = (branchId: string, patch: Partial<{ name: string; city: string; address: string; vcardThemeId: string; seasonalVcardThemeId: string; positionRules: Record<string, { isEnabled: boolean; themeId: string }> }>) => {
    setDrafts((prev) => ({ ...prev, [branchId]: { ...prev[branchId], ...patch } }));
  };

  const updatePositionRule = (branchId: string, groupKey: string, patch: Partial<{ isEnabled: boolean; themeId: string }>) => {
    setDrafts((prev) => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        positionRules: {
          ...(prev[branchId]?.positionRules || EMPTY_RULES),
          [groupKey]: {
            ...(prev[branchId]?.positionRules?.[groupKey] || { isEnabled: false, themeId: '' }),
            ...patch,
          },
        },
      },
    }));
  };

  const saveBranch = async (branchId: string) => {
    const draft = drafts[branchId];
    if (!draft) return;
    setSavingBranchId(branchId);
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          city: draft.city || null,
          address: draft.address || null,
          vcardThemeId: draft.vcardThemeId || null,
          seasonalVcardThemeId: draft.seasonalVcardThemeId || null,
          vcardPositionThemeRules: POSITION_GROUPS.map((group) => ({
            positionGroup: group.key,
            isEnabled: Boolean(draft.positionRules?.[group.key]?.isEnabled),
            themeId: draft.positionRules?.[group.key]?.themeId || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'No se pudo guardar la sucursal');
      }
      showToast('Sucursal actualizada correctamente.', 'ok');
      await loadData();
    } catch (error: any) {
      showToast(error?.message || 'Error actualizando sucursal.');
    } finally {
      setSavingBranchId(null);
    }
  };

  const downloadBranchTemplate = (branchId: string) => {
    window.open(`/api/users/template?branchId=${branchId}`, '_blank');
  };

  const downloadCompanyTemplate = () => {
    if (companyFilter === 'all') {
      window.open('/api/users/template', '_blank');
      return;
    }
    window.open(`/api/users/template?companyId=${companyFilter}`, '_blank');
  };

  const openBranchImporter = (branchId: string) => {
    setUploadTargetBranchId(branchId);
    const input = document.getElementById('branch-import-input') as HTMLInputElement | null;
    input?.click();
  };

  const handleBranchImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const branchId = uploadTargetBranchId;
    if (!file || !branchId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('defaultBranchId', branchId);

    setImportingBranchId(branchId);
    try {
      const res = await fetch('/api/users/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error importando usuarios');
      showToast(`Importacion completa. Usuarios: ${data.createdUsers}, vCards: ${data.createdVCards}`, 'ok');
      await loadData();
    } catch (error: any) {
      showToast(error?.message || 'Error importando archivo');
    } finally {
      setImportingBranchId(null);
      setUploadTargetBranchId(null);
      if (e.target) e.target.value = '';
    }
  };

  const deleteBranch = async (branch: Branch) => {
    if (!confirm(`Eliminar sucursal vCard "${branch.name}"? Esta accion no se puede deshacer.`)) return;

    setDeletingBranchId(branch.id);
    try {
      const response = await fetch(`/api/branches/${branch.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data?.error || 'No se pudo borrar la sucursal');
        return;
      }
      showToast('Sucursal eliminada correctamente.', 'ok');
      await loadData();
    } catch {
      showToast('Error de red al borrar la sucursal.');
    } finally {
      setDeletingBranchId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Sucursales vCard" subtitle="Nombre, direccion, tema predefinido, calendario y organigrama por sucursal" />
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition-all ${
            toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.msg}
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#003478]">Sucursales y organigrama vCard</h2>
              <p className="text-sm text-gray-500">Solo capa vCard: direccion, tema, calendario y empleados amarrados.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCompanyTemplate}
                data-tour-id="sucursales-template-company"
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                {companyFilter === 'all' ? 'Plantilla global' : 'Plantilla empresa'}
              </button>
              <button
                onClick={() => router.push('/vcards')}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a vCards
              </button>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Filtrar sucursales por empresa"
                title="Filtrar sucursales por empresa"
                data-tour-id="sucursales-company-filter"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#003478]"
              >
                <option value="all">Todas las empresas</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-bold text-gray-500">Cargando sucursales vCard...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {filteredBranches.map((branch) => {
                const branchDraft = drafts[branch.id] || { name: branch.name || '', city: branch.city || '', address: branch.address || '', vcardThemeId: '', seasonalVcardThemeId: '', positionRules: { ...EMPTY_RULES } };
                const org = groupedEmployees(branch.id);
                return (
                  <section key={branch.id} data-tour-id="sucursales-card" className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#003478]">
                          <Building2 className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900">{branch.name}</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{branch.companyName || 'Empresa'} · {branch.city || 'Ciudad no definida'}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Direccion</p>
                        <p className="mt-1 text-sm font-bold text-gray-800">{branchDraft.address || 'Sin direccion'}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <label className="text-xs font-bold text-gray-600">Nombre sucursal
                        <input
                          value={branchDraft.name}
                          onChange={(e) => updateDraft(branch.id, { name: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#003478]"
                        />
                      </label>
                      <label className="text-xs font-bold text-gray-600">Ciudad
                        <input
                          value={branchDraft.city}
                          onChange={(e) => updateDraft(branch.id, { city: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#003478]"
                        />
                      </label>
                      <label className="text-xs font-bold text-gray-600">Direccion
                        <input
                          value={branchDraft.address}
                          onChange={(e) => updateDraft(branch.id, { address: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#003478]"
                        />
                      </label>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Palette className="h-4 w-4" /> Tema predefinido</div>
                        <select
                          value={branchDraft.vcardThemeId}
                          onChange={(e) => updateDraft(branch.id, { vcardThemeId: e.target.value })}
                          aria-label={`Tema predefinido de ${branch.name}`}
                          title={`Tema predefinido de ${branch.name}`}
                          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#003478]"
                        >
                          <option value="">Sin tema base</option>
                          {themes.filter((theme) => (theme.type || 'CORPORATE') === 'CORPORATE').map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                        </select>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400"><Sparkles className="h-4 w-4" /> Calendario de temporada</div>
                        <select
                          value={branchDraft.seasonalVcardThemeId}
                          onChange={(e) => updateDraft(branch.id, { seasonalVcardThemeId: e.target.value })}
                          aria-label={`Calendario estacional de ${branch.name}`}
                          title={`Calendario estacional de ${branch.name}`}
                          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#003478]"
                        >
                          <option value="">Sin tema estacional</option>
                          {themes.filter((theme) => (theme.type || 'CORPORATE') !== 'CORPORATE').map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                        </select>
                        <p className="mt-3 text-xs text-gray-500">{formatSchedule(themes.find((theme) => theme.id === branchDraft.seasonalVcardThemeId) || branch.seasonalVcardTheme)}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Temas por puesto (landing vCard cliente)</p>
                      <p className="mt-1 text-xs text-indigo-700">Activa una regla por grupo o deja desactivado para usar la predeterminada global de la empresa.</p>
                      <div className="mt-4 space-y-3">
                        {POSITION_GROUPS.map((group) => {
                          const rule = branchDraft.positionRules?.[group.key] || { isEnabled: false, themeId: '' };
                          return (
                            <div key={group.key} className="rounded-xl bg-white p-3 border border-indigo-100">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={rule.isEnabled}
                                    onChange={(e) => updatePositionRule(branch.id, group.key, { isEnabled: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-[#003478]"
                                  />
                                  {group.label}
                                </label>
                                <select
                                  value={rule.themeId}
                                  onChange={(e) => updatePositionRule(branch.id, group.key, { themeId: e.target.value })}
                                  disabled={!rule.isEnabled}
                                  aria-label={`Tema para ${group.label} en ${branch.name}`}
                                  title={`Tema para ${group.label} en ${branch.name}`}
                                  className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#003478] disabled:opacity-60"
                                >
                                  <option value="">Usar predeterminada global empresa</option>
                                  {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        onClick={() => downloadBranchTemplate(branch.id)}
                        data-tour-id="sucursales-template-branch"
                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-700"
                      >
                        <Download className="h-4 w-4" /> Bajar plantilla
                      </button>
                      <button
                        onClick={() => openBranchImporter(branch.id)}
                        data-tour-id="sucursales-import-branch"
                        disabled={importingBranchId === branch.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-700 disabled:opacity-60"
                      >
                        {importingBranchId === branch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {importingBranchId === branch.id ? 'Subiendo...' : 'Subir plantilla'}
                      </button>
                      <button
                        onClick={() => deleteBranch(branch)}
                        disabled={deletingBranchId === branch.id || savingBranchId === branch.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-700 disabled:opacity-60"
                      >
                        {deletingBranchId === branch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {deletingBranchId === branch.id ? 'Borrando...' : 'Borrar sucursal'}
                      </button>
                      <button onClick={() => saveBranch(branch.id)} disabled={savingBranchId === branch.id} className="inline-flex items-center gap-2 rounded-2xl bg-[#003478] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 disabled:opacity-60">
                        <Save className="h-4 w-4" /> {savingBranchId === branch.id ? 'Guardando...' : 'Guardar sucursal'}
                      </button>
                    </div>

                    <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-5">
                      <div className="mb-4 flex items-center gap-2 text-sm font-black text-gray-900"><Users className="h-4 w-4 text-[#003478]" /> Organigrama y empleados amarrados</div>
                      <div className="space-y-4">
                        {org.length ? org.map((group) => (
                          <div key={group.id} className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">{group.label}</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {group.members.map((employee) => (
                                <div key={employee.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                  <p className="text-sm font-black text-gray-900">{employee.name}</p>
                                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">{employee.position || employee.role}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )) : <p className="text-sm text-gray-400">No hay empleados asociados a esta sucursal.</p>}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                      Aqui la sucursal vCard queda reducida a lo necesario: nombre, direccion, tema predefinido, calendario estacional, empleados amarrados y organigrama comercial/servicio/gerencia.
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
        <input id="branch-import-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleBranchImportFile} aria-label="Subir plantilla por sucursal" title="Subir plantilla por sucursal" />

        <VCardsGuidedTour
          tourId="sucursales-v1"
          title="Guia de Sucursales"
          steps={[
            {
              id: 'company-filter',
              selector: '[data-tour-id="sucursales-company-filter"]',
              title: 'Filtra por empresa',
              description: 'Primero elige la empresa para ver solo sus sucursales y evitar confusiones.',
            },
            {
              id: 'company-template',
              selector: '[data-tour-id="sucursales-template-company"]',
              title: 'Plantilla por empresa',
              description: 'Este boton descarga plantilla de carga masiva para la empresa filtrada.',
            },
            {
              id: 'branch-card',
              selector: '[data-tour-id="sucursales-card"]',
              title: 'Ficha de sucursal',
              description: 'Aqui editas direccion, temas base y temas estacionales por cada sucursal.',
            },
            {
              id: 'branch-template',
              selector: '[data-tour-id="sucursales-template-branch"]',
              title: 'Plantilla por sucursal',
              description: 'Descarga plantilla exacta para una sola sucursal y minimiza errores.',
            },
            {
              id: 'branch-import',
              selector: '[data-tour-id="sucursales-import-branch"]',
              title: 'Subir plantilla sucursal',
              description: 'Sube el Excel de esa sucursal para crear usuarios y vCards en lote.',
            },
          ]}
        />
      </div>
    </div>
  );
}

export default function VcardBranchesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <VcardBranchesContent />
    </Suspense>
  );
}
