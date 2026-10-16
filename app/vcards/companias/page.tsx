'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { ArrowLeft, ArrowRight, Building2, Edit2, Loader2, MapPin, Palette, Plus, Trash2, Upload, X } from 'lucide-react';
import { VCardsGuidedTour } from '../../components/vcards-guided-tour';

interface Theme {
  id: string;
  name: string;
  category: 'VCARD' | 'PORTAL' | 'ADMIN' | 'CARD';
}

interface Company {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  defaultVcardThemeId?: string | null;
  seasonalVcardThemeId?: string | null;
  branches?: Array<{
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
    country?: string | null;
    uniqueSlug?: string | null;
    sortOrder?: number;
  }>;
  _count?: { branches: number };
}

export default function VcardCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [draggingBranch, setDraggingBranch] = useState<{ companyId: string; branchId: string } | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'ok' } | null>(null);

  const showToast = (msg: string, type: 'error' | 'ok' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [formData, setFormData] = useState({ name: '', slug: '', logoUrl: '', primaryColor: '#003478', secondaryColor: '#FFFFFF', defaultVcardThemeId: '', seasonalVcardThemeId: '', baseCity: 'San Pedro Sula', baseAddress: '', country: 'Honduras', branches: [{ city: 'Tegucigalpa', address: '', uniqueSlug: '' }] as Array<{ city: string; address: string; uniqueSlug: string }> });
  const [branchForm, setBranchForm] = useState({ city: '', address: '', uniqueSlug: '' });

  const loadData = async () => {
    const [companiesRes, themesRes] = await Promise.all([
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/themes?category=VCARD').then((r) => r.json()),
    ]);
    setCompanies(companiesRes.companies || []);
    setThemes(themesRes.themes || []);
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (company?: Company) => {
    if (company) {
      setEditing(company);
      setFormData({
        name: company.name,
        slug: company.slug || '',
        logoUrl: company.logoUrl || '',
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor,
        defaultVcardThemeId: company.defaultVcardThemeId || '',
        seasonalVcardThemeId: company.seasonalVcardThemeId || '',
        baseCity: company.branches?.[0]?.city || 'San Pedro Sula',
        baseAddress: company.branches?.[0]?.address || '',
        country: company.branches?.[0]?.country || 'Honduras',
        branches: company.branches?.slice(1).map((branch) => ({ city: branch.city || '', address: branch.address || '', uniqueSlug: branch.uniqueSlug || '' })) || [{ city: 'Tegucigalpa', address: '', uniqueSlug: '' }],
      });
    } else {
      setEditing(null);
      setFormData({ name: '', slug: '', logoUrl: '', primaryColor: '#003478', secondaryColor: '#FFFFFF', defaultVcardThemeId: '', seasonalVcardThemeId: '', baseCity: 'San Pedro Sula', baseAddress: '', country: 'Honduras', branches: [{ city: 'Tegucigalpa', address: '', uniqueSlug: '' }] });
    }
    setWizardStep(1);
    setShowModal(true);
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const logoDataUrl = reader.result;
        setFormData((prev) => ({ ...prev, logoUrl: logoDataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const updateDraftBranch = (index: number, patch: Partial<{ city: string; address: string; uniqueSlug: string }>) => {
    setFormData((prev) => ({
      ...prev,
      branches: prev.branches.map((branch, branchIndex) => branchIndex === index ? { ...branch, ...patch } : branch),
    }));
  };

  const addDraftBranch = () => {
    setFormData((prev) => ({ ...prev, branches: [...prev.branches, { city: '', address: '', uniqueSlug: '' }] }));
  };

  const removeDraftBranch = (index: number) => {
    setFormData((prev) => ({ ...prev, branches: prev.branches.filter((_, branchIndex) => branchIndex !== index) }));
  };

  const saveCompany = async () => {
    if (!formData.name.trim()) {
      showToast('El nombre de la empresa es obligatorio.');
      setWizardStep(1);
      return;
    }
    const url = editing ? `/api/companies/${editing.id}` : '/api/companies';
    const method = editing ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast(data?.error || 'No se pudo guardar la empresa.');
      return;
    }
    setShowModal(false);
    showToast(editing ? 'Empresa actualizada.' : 'Empresa creada.', 'ok');
    await loadData();
  };

  const deleteCompany = async (id: string) => {
    if (!confirm('Eliminar empresa vCard?')) return;
    const response = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast(data?.error || 'No se pudo eliminar la empresa.');
      return;
    }
    showToast('Empresa eliminada.', 'ok');
    await loadData();
  };

  const openBranchModal = (company: Company) => {
    setSelectedCompany(company);
    setBranchForm({ city: '', address: '', uniqueSlug: '' });
    setShowBranchModal(true);
  };

  const createBranch = async () => {
    if (!selectedCompany || !branchForm.city) return;
    const branchName = `${selectedCompany.name} - ${branchForm.city}`;
    const response = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        name: branchName,
        city: branchForm.city,
        address: branchForm.address,
        uniqueSlug: branchForm.uniqueSlug || `${selectedCompany.slug || selectedCompany.name.toLowerCase()}-${branchForm.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast(data?.error || 'No se pudo crear la sucursal.');
      return;
    }
    setShowBranchModal(false);
    showToast('Sucursal creada.', 'ok');
    await loadData();
  };

  const deleteBranch = async (branchId: string, branchName: string) => {
    if (!confirm(`Eliminar sucursal "${branchName}"?`)) return;
    setDeletingBranchId(branchId);
    try {
      const response = await fetch(`/api/branches/${branchId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data?.error || 'No se pudo borrar la sucursal');
        return;
      }
      showToast('Sucursal eliminada.', 'ok');
      await loadData();
    } catch {
      showToast('Error de red al borrar la sucursal.');
    } finally {
      setDeletingBranchId(null);
    }
  };

  const moveBranch = async (company: Company, branchId: string, direction: -1 | 1) => {
    const branches = [...(company.branches || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = branches.findIndex((branch) => branch.id === branchId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= branches.length) return;
    [branches[index], branches[target]] = [branches[target], branches[index]];
    await Promise.all(branches.map((branch, sortOrder) => fetch(`/api/branches/${branch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortOrder }),
    })));
    await loadData();
  };

  const dropBranch = async (company: Company, targetBranchId: string) => {
    if (!draggingBranch || draggingBranch.companyId !== company.id || draggingBranch.branchId === targetBranchId) {
      setDraggingBranch(null);
      return;
    }
    const branches = [...(company.branches || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const fromIdx = branches.findIndex((branch) => branch.id === draggingBranch.branchId);
    const toIdx = branches.findIndex((branch) => branch.id === targetBranchId);
    if (fromIdx < 0 || toIdx < 0) {
      setDraggingBranch(null);
      return;
    }
    const [moved] = branches.splice(fromIdx, 1);
    branches.splice(toIdx, 0, moved);
    await Promise.all(branches.map((branch, sortOrder) => fetch(`/api/branches/${branch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortOrder }),
    })));
    setDraggingBranch(null);
    await loadData();
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Empresas vCard" subtitle="Crea empresas, asigna temas vCard base y temas de temporada" />
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg ${
              toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#003478]">Empresas y branding</h2>
              <p className="text-sm text-gray-500">Cada empresa puede manejar sucursales y temas independientes para vCard.</p>
            </div>
            <button onClick={() => openModal()} data-tour-id="companias-create" className="flex items-center gap-2 rounded-2xl bg-[#003478] px-6 py-3 font-bold text-white shadow-lg shadow-blue-100">
              <Plus className="w-4 h-4" /> Nueva Empresa
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <div key={company.id} data-tour-id="companias-card" className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${company.primaryColor}18`, color: company.primaryColor }}>
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{company.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{company.slug || 'sin-slug'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(company)} className="rounded-xl p-2 text-blue-600 hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteCompany(company.id)} className="rounded-xl p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sucursales</p>
                    <p className="mt-2 text-lg font-black text-gray-900">{company._count?.branches || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branding</p>
                    <div className="mt-3 flex gap-2">
                      <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: company.primaryColor }} />
                      <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: company.secondaryColor }} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sucursales por ciudad</p>
                    <button onClick={() => openBranchModal(company)} data-tour-id="companias-add-branch" className="rounded-xl bg-[#003478] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                      <Plus className="mr-1 inline w-3 h-3" /> Crear sucursal
                    </button>
                  </div>
                  <div className="space-y-2">
                    {company.branches?.length ? company.branches.map((branch) => (
                      <div
                        key={branch.id}
                        draggable
                        onDragStart={() => setDraggingBranch({ companyId: company.id, branchId: branch.id })}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => dropBranch(company, branch.id)}
                        className={`flex items-center justify-between rounded-xl bg-white px-3 py-3 transition ${draggingBranch?.branchId === branch.id ? 'opacity-60 ring-2 ring-[#003478]' : 'hover:ring-2 hover:ring-blue-200'}`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#003478]" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{branch.city || branch.name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400">{branch.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Drag</span>
                          <button onClick={() => moveBranch(company, branch.id, -1)} className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-500">Subir</button>
                          <button onClick={() => moveBranch(company, branch.id, 1)} className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-500">Bajar</button>
                          <button onClick={() => deleteBranch(branch.id, branch.name)} disabled={deletingBranchId === branch.id} className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 disabled:opacity-50">{deletingBranchId === branch.id ? <Loader2 size={11} className="animate-spin" /> : null}Borrar</button>
                          <Link href="/vcards/sucursales" className="text-xs font-bold text-[#003478]">Administrar</Link>
                        </div>
                      </div>
                    )) : <p className="text-xs text-gray-400">No hay sucursales creadas.</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <VCardsGuidedTour
          tourId="companias-v1"
          title="Guia de Empresas"
          steps={[
            {
              id: 'create-company',
              selector: '[data-tour-id="companias-create"]',
              title: 'Crear empresa',
              description: 'Primero crea la empresa para centralizar branding y tema global.',
            },
            {
              id: 'company-card',
              selector: '[data-tour-id="companias-card"]',
              title: 'Ficha de empresa',
              description: 'Aqui veras sucursales y controles de administracion de la empresa.',
            },
            {
              id: 'add-branch',
              selector: '[data-tour-id="companias-add-branch"]',
              title: 'Agregar sucursal',
              description: 'Crea las sucursales para que luego usuarios y vCards queden bien ordenados.',
            },
          ]}
        />
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
              <div>
                <h3 className="text-xl font-black text-[#003478]">{editing ? 'Editar Empresa vCard' : 'Nueva Empresa vCard'}</h3>
                <p className="text-xs text-gray-500">Administra branding y temas por empresa</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="border-b border-gray-100 px-8 py-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((step) => (
                  <div key={step} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${wizardStep === step ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <span>{step}</span>
                    <span>{step === 1 ? 'Branding' : step === 2 ? 'Temas' : 'Sucursales'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-2">
              {wizardStep === 1 ? (
                <>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre empresa" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2" />
                  <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="slug" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                  <input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="Logo URL" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                  <label className="md:col-span-2 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-bold text-gray-600 hover:bg-white">
                    <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Subir logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <span className="text-xs text-gray-400">PNG / JPG / SVG</span>
                  </label>
                  {formData.logoUrl ? (
                    <div className="md:col-span-2 flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <img src={formData.logoUrl} alt="Logo preview" className="h-14 w-14 rounded-2xl object-contain bg-white p-2" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Logo cargado</p>
                        <p className="text-xs text-gray-400">Se usara para la empresa y sus sucursales.</p>
                      </div>
                    </div>
                  ) : null}
                  <input value={formData.baseCity} onChange={(e) => setFormData({ ...formData, baseCity: e.target.value })} placeholder="Ciudad base" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2" />
                  <input value={formData.baseAddress} onChange={(e) => setFormData({ ...formData, baseAddress: e.target.value })} placeholder="Direccion sucursal principal" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2" />
                  <input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Pais" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2" />
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <Palette className="w-4 h-4 text-gray-400" />
                    <input type="color" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} />
                    <span className="text-xs font-bold text-gray-500">Color primario</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <Palette className="w-4 h-4 text-gray-400" />
                    <input type="color" value={formData.secondaryColor} onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })} />
                    <span className="text-xs font-bold text-gray-500">Color secundario</span>
                  </div>
                </>
              ) : null}

              {wizardStep === 2 ? (
                <>
                  <select value={formData.defaultVcardThemeId} onChange={(e) => setFormData({ ...formData, defaultVcardThemeId: e.target.value })} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2">
                    <option value="">Tema vCard base</option>
                    {themes.filter((theme) => theme.category === 'VCARD').map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                  </select>
                  <select value={formData.seasonalVcardThemeId} onChange={(e) => setFormData({ ...formData, seasonalVcardThemeId: e.target.value })} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478] md:col-span-2">
                    <option value="">Tema estacional</option>
                    {themes.filter((theme) => theme.category === 'VCARD').map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                  </select>
                </>
              ) : null}

              {wizardStep === 3 ? (
                <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-gray-900">Sucursales adicionales por ciudad</p>
                      <p className="text-xs text-gray-400">La empresa tambien se crea como sucursal principal automaticamente.</p>
                    </div>
                    <button type="button" onClick={addDraftBranch} className="rounded-xl bg-[#003478] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                      <Plus className="mr-1 inline w-3 h-3" /> Agregar ciudad
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.branches.map((branch, index) => (
                      <div key={`draft-branch-${index}`} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_1.2fr_1fr_auto]">
                        <input value={branch.city} onChange={(e) => updateDraftBranch(index, { city: e.target.value })} placeholder="Ciudad" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                        <input value={branch.address} onChange={(e) => updateDraftBranch(index, { address: e.target.value })} placeholder="Direccion" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                        <input value={branch.uniqueSlug} onChange={(e) => updateDraftBranch(index, { uniqueSlug: e.target.value })} placeholder="slug sucursal" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
                        <button type="button" onClick={() => removeDraftBranch(index)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-500">Quitar</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-8 py-6 bg-[#F8FAFC]">
              <button onClick={() => setShowModal(false)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cancelar</button>
              <div className="ml-auto flex gap-3">
                {wizardStep > 1 ? <button onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500"><ArrowLeft className="mr-1 inline w-3 h-3" />Anterior</button> : null}
                {wizardStep < 3 ? <button onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3)} className="rounded-2xl bg-[#003478] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-100">Siguiente<ArrowRight className="ml-1 inline w-3 h-3" /></button> : <button onClick={saveCompany} className="rounded-2xl bg-[#003478] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-100">Guardar Empresa</button>}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showBranchModal && selectedCompany ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
              <div>
                <h3 className="text-xl font-black text-[#003478]">Nueva sucursal por ciudad</h3>
                <p className="text-xs text-gray-500">{selectedCompany.name}</p>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="rounded-full p-2 hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-8">
              <input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} placeholder="Ciudad" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
              <input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Direccion" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
              <input value={branchForm.uniqueSlug} onChange={(e) => setBranchForm({ ...branchForm, uniqueSlug: e.target.value })} placeholder="slug de sucursal" className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-8 py-6 bg-[#F8FAFC]">
              <button onClick={() => setShowBranchModal(false)} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cancelar</button>
              <button onClick={createBranch} className="rounded-2xl bg-[#003478] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-100">Crear sucursal</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
