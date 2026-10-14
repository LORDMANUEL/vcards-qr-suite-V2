'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Wifi,
  QrCode,
  Settings,
  Users,
  BarChart3,
  ChevronRight,
  Monitor,
  CheckCircle2,
  X,
  Copy,
  Terminal,
  ExternalLink,
  Printer,
  Download
} from 'lucide-react';

interface Branch {
  id: string;
  companyName: string | null;
  companyId?: string | null;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  routerSerial: string | null;
  ssidTarget: string | null;
  setupGuide: string | null;
  uniqueSlug: string | null;
  portalThemeId: string | null;
  vcardThemeId: string | null;
  seasonalVcardThemeId: string | null;
  portalConfig?: {
    collectName: boolean;
    collectEmail: boolean;
    collectPhone: boolean;
    collectCarModel: boolean;
    collectVehicleYear: boolean;
    collectLicensePlate: boolean;
    requiredFields: string[];
  };
  _count?: {
    users: number;
    vcards: number;
  };
}

interface Theme {
  id: string;
  name: string;
  category: 'VCARD' | 'PORTAL';
}

interface Company {
  id: string;
  name: string;
  defaultVcardThemeId?: string | null;
  seasonalVcardThemeId?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
}

export default function UbicacionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    companyName: 'Ford Yude Canahuati',
    companyId: '',
    name: '',
    address: '',
    city: '',
    country: '',
    primaryColor: '#003478',
    secondaryColor: '#FFFFFF',
    logoUrl: '',
    routerSerial: '',
    ssidTarget: 'Ford_Guest_WiFi',
    setupGuide: '',
    uniqueSlug: '',
    portalThemeId: '',
    vcardThemeId: '',
    seasonalVcardThemeId: '',
    portalConfig: {
      collectName: true,
      collectEmail: true,
      collectPhone: true,
      collectCarModel: false,
      collectVehicleYear: false,
      collectLicensePlate: false,
      requiredFields: [] as string[]
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadBranches();
      loadThemes();
      loadCompanies();
    }
  }, [status, router]);

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (e) {
      console.error('Error loading companies:', e);
    }
  };

  const loadThemes = async () => {
    try {
      const res = await fetch('/api/themes');
      if (res.ok) {
        const data = await res.json();
        setThemes(data.themes || []);
      }
    } catch (e) {
      console.error('Error loading themes:', e);
    }
  };

  useEffect(() => {
    const filtered = branches.filter((branch: Branch) =>
      (companyFilter === 'all' || branch.companyId === companyFilter) &&
      (branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (branch.city && branch.city.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    setFilteredBranches(filtered);
  }, [searchQuery, branches, companyFilter]);

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
        setFilteredBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        companyName: branch.companyName || 'Ford Yude Canahuati',
        companyId: branch.companyId || '',
        address: branch.address || '',
        city: branch.city || '',
        country: branch.country || '',
        primaryColor: branch.primaryColor || '#003478',
        secondaryColor: branch.secondaryColor || '#FFFFFF',
        logoUrl: branch.logoUrl || '',
        routerSerial: branch.routerSerial || '',
        ssidTarget: branch.ssidTarget || 'Ford_Guest_WiFi',
        setupGuide: branch.setupGuide || '',
        uniqueSlug: branch.uniqueSlug || branch.name.toLowerCase().replace(/\s+/g, '-'),
        portalThemeId: branch.portalThemeId || '',
        vcardThemeId: branch.vcardThemeId || '',
        seasonalVcardThemeId: branch.seasonalVcardThemeId || '',
        portalConfig: branch.portalConfig || {
          collectName: true,
          collectEmail: true,
          collectPhone: true,
          collectCarModel: false,
          collectVehicleYear: false,
          collectLicensePlate: false,
          requiredFields: [] as string[]
        }
      });
    } else {
      setEditingBranch(null);
      setFormData({
        companyName: 'Ford Yude Canahuati',
        companyId: '',
        name: '',
        address: '',
        city: '',
        country: '',
        primaryColor: '#003478',
        secondaryColor: '#FFFFFF',
        logoUrl: '',
        routerSerial: '',
        ssidTarget: 'Ford_Guest_WiFi',
        setupGuide: '',
        uniqueSlug: '',
        portalThemeId: '',
        vcardThemeId: '',
        seasonalVcardThemeId: '',
        portalConfig: {
          collectName: true,
          collectEmail: true,
          collectPhone: true,
          collectCarModel: false,
          collectVehicleYear: false,
          collectLicensePlate: false,
          requiredFields: []
        }
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await loadBranches();
        setShowModal(false);
      } else {
        alert('Error al guardar la sucursal');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      if (res.ok) await loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
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
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Ubicaciones & Routers" subtitle="Gestión estratégica de puntos de acceso y sucursales" />
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">

          {/* Action Navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#003478] tracking-tight">Panel de Sucursales</h2>
              <p className="text-sm text-gray-500 font-medium font-inter">Control de nodos de red y presencia física</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-[#003478]"
              >
                <option value="all">Todas las empresas</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre o ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#003478] transition-all font-medium text-sm"
                />
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="bg-[#003478] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
              >
                <Plus className="w-5 h-5" /> Nueva Sucursal
              </button>
            </div>
          </div>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredBranches.map((branch: Branch) => (
              <div key={branch.id} className="group bg-white rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col">
                {/* Card Header */}
                <div className="p-6 pb-0 flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#003478] relative overflow-hidden">
                    {branch.logoUrl ? (
                      <img src={branch.logoUrl} className="w-full h-full object-contain p-2" alt="logo" />
                    ) : (
                      <MapPin className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Activo</span>
                  </div>
                </div>

                <div className="p-6 pt-4 flex-1">
                  <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-[#003478] transition-colors">{branch.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">{branch.companyName || 'Ford Yude Canahuati'}</p>
                  <div className="flex items-center text-xs text-gray-500 font-medium gap-1 mb-6">
                    <MapPin className="w-3 h-3" /> {branch.city}, {branch.country}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                      <BarChart3 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <span className="block text-xs font-black text-gray-900">{branch._count?.vcards || 0}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">vCards</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                      <Users className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <span className="block text-xs font-black text-gray-900">{branch._count?.users || 0}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Admins</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-center">
                      <Wifi className="w-4 h-4 text-green-500 mx-auto mb-1" />
                      <span className="block text-xs font-black text-gray-900">Online</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Portal</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 px-1">
                      <span>Router ID</span>
                      <span className="text-gray-400">{branch.routerSerial || 'No configurado'}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#003478] w-[75%]" />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 border-t border-gray-50 grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => { setSelectedBranch(branch); setShowQRModal(true); }}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all"
                  >
                    <QrCode className="w-3 h-3" /> Generar QR
                  </button>
                  <button
                    onClick={() => { setSelectedBranch(branch); setShowGuideModal(true); }}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-[#003478] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <Settings className="w-3 h-3" /> Config Router
                  </button>
                  <button
                    onClick={() => handleOpenModal(branch)}
                    className="col-span-2 flex items-center justify-center gap-2 py-3 bg-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Sucursal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* MODAL: Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h3 className="text-xl font-black text-[#003478] uppercase tracking-tighter">
                  {editingBranch ? 'Configurar Sucursal Elite' : 'Nueva Agencia Regional'}
                </h3>
                <p className="text-xs text-gray-500 font-medium">Asigna coordenadas y parámetros técnicos</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 scrollbar-hide">
              <form id="branchForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Empresa / Tenant</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={formData.companyId}
                        onChange={e => {
                          const selected = companies.find(company => company.id === e.target.value);
                          setFormData({
                            ...formData,
                            companyId: e.target.value,
                            companyName: selected?.name || formData.companyName,
                            vcardThemeId: formData.vcardThemeId || selected?.defaultVcardThemeId || '',
                            seasonalVcardThemeId: formData.seasonalVcardThemeId || selected?.seasonalVcardThemeId || '',
                            primaryColor: selected?.primaryColor || formData.primaryColor,
                            secondaryColor: selected?.secondaryColor || formData.secondaryColor,
                            logoUrl: selected?.logoUrl || formData.logoUrl,
                          });
                        }}
                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] focus:bg-white transition-all outline-none font-bold text-[#003478]"
                      >
                        <option value="">Seleccionar empresa...</option>
                        {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                      </select>
                      <input
                        type="text" value={formData.companyName}
                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] focus:bg-white transition-all outline-none font-bold text-[#003478]"
                        placeholder="Ford Yude Canahuati"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nombre de la Sucursal</label>
                    <input
                      type="text" required value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] focus:bg-white transition-all outline-none font-bold text-[#003478]"
                      placeholder="Ej. Ford - San Pedro Sula Principal"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Slug Único (URL)</label>
                    <input
                      type="text" value={formData.uniqueSlug}
                      onChange={e => setFormData({ ...formData, uniqueSlug: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] focus:bg-white outline-none font-bold text-xs"
                      placeholder="ford-sps"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ciudad</label>
                    <input
                      type="text" value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] outline-none font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                      <Wifi className="w-3 h-3 text-blue-500" /> Parámetros de Red & Router
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 mb-1 block">Serial Router / HWID</label>
                        <input
                          type="text" value={formData.routerSerial}
                          onChange={e => setFormData({ ...formData, routerSerial: e.target.value })}
                          className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none font-mono text-xs"
                          placeholder="CS-1200-XXXX"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 mb-1 block">Nombre SSID Objetivo</label>
                        <input
                          type="text" value={formData.ssidTarget}
                          onChange={e => setFormData({ ...formData, ssidTarget: e.target.value })}
                          className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none font-bold text-xs text-[#003478]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                      Diseño & Branding Segmentado
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 mb-1 block">Tema Captive Portal</label>
                        <select
                          value={formData.portalThemeId}
                          onChange={e => setFormData({ ...formData, portalThemeId: e.target.value })}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-xs"
                        >
                          <option value="">Seleccionar Tema Portal...</option>
                          {themes.filter(t => t.category === 'PORTAL').map(theme => (
                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 mb-1 block">Tema vCards Sucursal</label>
                        <select
                          value={formData.vcardThemeId}
                          onChange={e => setFormData({ ...formData, vcardThemeId: e.target.value })}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-xs"
                        >
                          <option value="">Seleccionar Tema vCard...</option>
                          {themes.filter(t => t.category === 'VCARD').map(theme => (
                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold text-gray-500 mb-1 block">Tema estacional vCard</label>
                        <select
                          value={formData.seasonalVcardThemeId}
                          onChange={e => setFormData({ ...formData, seasonalVcardThemeId: e.target.value })}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-xs"
                        >
                          <option value="">Sin tema estacional</option>
                          {themes.filter(t => t.category === 'VCARD').map(theme => (
                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                      Configuración de Captura (Portal)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: 'collectName', label: 'Nombre Completo' },
                        { id: 'collectEmail', label: 'Correo Electrónico' },
                        { id: 'collectPhone', label: 'Teléfono / WhatsApp' },
                        { id: 'collectCarModel', label: 'Modelo de Vehículo' },
                        { id: 'collectVehicleYear', label: 'Año del Vehículo' },
                        { id: 'collectLicensePlate', label: 'Placa del Vehículo' }
                      ].map(field => (
                        <label key={field.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent has-[:checked]:border-blue-200">
                          <input
                            type="checkbox"
                            checked={(formData.portalConfig as any)[field.id]}
                            onChange={e => setFormData({
                              ...formData,
                              portalConfig: { ...formData.portalConfig, [field.id]: e.target.checked }
                            })}
                            className="w-4 h-4 rounded text-[#003478]"
                          />
                          <span className="text-[10px] font-bold text-gray-600">{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Guía de Configuración p/ Técnico</label>
                    <textarea
                      rows={2}
                      value={formData.setupGuide}
                      onChange={e => setFormData({ ...formData, setupGuide: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#003478] outline-none text-xs font-medium"
                      placeholder="Ej. DNS: 8.8.8.8, Radius IP: 15.X.X.X..."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-6 border-t border-gray-200 bg-[#F8FAFC] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 bg-white text-gray-500 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-all text-xs uppercase tracking-widest">
                Descartar
              </button>
              <button
                type="submit" form="branchForm" disabled={isSubmitting}
                className="px-8 py-3 bg-[#003478] text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all text-xs uppercase tracking-widest"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR Generator */}
      {showQRModal && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center relative animate-in slide-in-from-bottom-8 duration-500">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="mb-8">
              <div className="w-20 h-20 bg-[#003478] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200 overflow-hidden p-4">
                <QrCode className="w-full h-full text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase">QR de Sucursal</h3>
              <p className="text-xs text-gray-500 font-medium">Link inteligente para {selectedBranch.name}</p>
            </div>

            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-center mb-8 relative group">
              {/* Fake QR Preview */}
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100">
                <div className="w-40 h-40 bg-gray-900 rounded-xl" />
              </div>
              <button className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                <Download className="w-4 h-4" /> Bajar PNG
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <code className="text-[10px] font-mono font-bold text-[#003478]">vcard.hn/portal/{selectedBranch.uniqueSlug || 'default'}</code>
                <button className="p-1.5 hover:bg-blue-200 rounded-lg transition-all" title="Copiar Link">
                  <Copy className="w-3 h-3 text-[#003478]" />
                </button>
              </div>
              <p className="text-[9px] text-gray-400 font-medium">Muestra este QR en recepción para conectar clientes automáticamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Setup Guide */}
      {showGuideModal && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0F172A] text-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Terminal className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Manual de Configuración IT</h3>
                  <p className="text-xs text-blue-400 font-mono">{selectedBranch.name} {'//'} SSID: {selectedBranch.ssidTarget}</p>
                </div>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Paso 1: Parámetros del Portal Cautivo
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">External Splash Page URL</span>
                    <code className="text-xs text-green-400 font-mono">vcard.yude.hn/login</code>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Redirection Success URL</span>
                    <code className="text-xs text-green-400 font-mono">vcard.yude.hn/success</code>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Paso 2: Whitlisting (Walled Garden)
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">Permitir los siguientes dominios en el router sin autenticación:</p>
                <div className="bg-[#1E293B] p-4 rounded-2xl font-mono text-xs text-blue-300 space-y-1">
                  <div>* .yudecanahuati.com</div>
                  <div>* .yude.hn</div>
                  <div>* fonts.googleapis.com</div>
                  <div>* .google-analytics.com</div>
                </div>
              </section>

              {selectedBranch.setupGuide && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-orange-400 uppercase tracking-widest">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Notas Específicas de la Sucursal
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl text-xs text-orange-200/80 leading-relaxed whitespace-pre-wrap font-medium italic">
                    {selectedBranch.setupGuide}
                  </div>
                </section>
              )}
            </div>

            <div className="p-8 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 active:scale-95 text-xs uppercase tracking-widest"
              >
                <Printer className="w-4 h-4" /> Imprimir Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
