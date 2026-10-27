'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Download, HelpCircle, MapPin, Plus, Search, Upload } from 'lucide-react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { VCardCard } from '../components/vcard-card';
import { CreateVCardModal } from '../components/modals/create-vcard-modal';
import { EditVCardModal } from '../components/modals/edit-vcard-modal';
import { ViewQRModal } from '../components/modals/view-qr-modal';
import { VCardsGuidedTour } from '../components/vcards-guided-tour';

interface VCard {
  id: string;
  user: {
    id: string;
    name: string;
    position?: string | null;
    email: string;
    phone?: string | null;
    photoUrl?: string | null;
    website?: string | null;
  };
  branch?: {
    id: string;
    companyId?: string | null;
    city?: string | null;
    name: string;
    address?: string | null;
  } | null;
  qrCodeData: string;
  qrImageUrl?: string | null;
  downloadCount: number;
  isActive: boolean;
}

export default function VCardsPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [vcards, setVcards] = useState<VCard[]>([]);
  const [filteredVcards, setFilteredVcards] = useState<VCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState<'active' | 'archived'>('active');
  const [cardOperationId, setCardOperationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedVCard, setSelectedVCard] = useState<VCard | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupedVcards = (filteredVcards || []).reduce((acc, vcard) => {
    const key = vcard?.branch?.id || 'no-branch'; // Names may repeat across companies
    if (!acc[key]) acc[key] = [];
    acc[key].push(vcard);
    return acc;
  }, {} as Record<string, VCard[]>);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    loadVCards();
  }, []);

  useEffect(() => {
    const filtered = vcards?.filter(
      (vcard) =>
        vcard.isActive === (visibility === 'active') && (
          vcard?.user?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
          vcard?.user?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
          vcard?.user?.position?.toLowerCase()?.includes(searchQuery?.toLowerCase())
        )
    );
    setFilteredVcards(filtered ?? []);
  }, [searchQuery, vcards, visibility]);

  const loadVCards = async () => {
    try {
      const response = await fetch('/api/vcards');
      if (response?.ok) {
        const data = await response.json();
        setVcards(data?.vcards ?? []);
        setFilteredVcards(data?.vcards ?? []);
      }
    } catch (error) {
      console.error('Error loading vCards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (cardOperationId) return;
    if (!confirm('¿Archivar esta vCard? El QR dejará de funcionar mientras esté archivada, pero conservará sus escaneos y podrá restaurarse.')) return;
    setCardOperationId(id);
    try {
      const response = await fetch(`/api/vcards/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No fue posible archivar la tarjeta');
      await loadVCards();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al archivar la tarjeta');
    } finally {
      setCardOperationId(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (cardOperationId) return;
    if (!confirm('¿Restaurar esta vCard? Volverá a estar disponible mediante el mismo QR original.')) return;
    setCardOperationId(id);
    try {
      const response = await fetch(`/api/vcards/${encodeURIComponent(id)}`, { method: 'PATCH' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No fue posible restaurar la tarjeta');
      await loadVCards();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al restaurar la tarjeta');
    } finally {
      setCardOperationId(null);
    }
  };

  const handleViewQR = (vcard: VCard) => {
    setSelectedVCard(vcard);
    setShowQRModal(true);
  };

  const handleEdit = (vcard: VCard) => {
    if (!vcard.isActive) return;
    setSelectedVCard(vcard);
    setShowEditModal(true);
  };

  const handleDownloadTemplate = () => window.open('/api/users/template', '_blank');
  const handleExportData = () => window.open('/api/vcards/export', '_blank');
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setImporting(true);
    try {
      const res = await fetch('/api/users/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error importando usuarios');
      alert(`Importacion completada. Usuarios: ${data.createdUsers}, vCards: ${data.createdVCards}`);
      await loadVCards();
    } catch (error: any) {
      alert(error.message || 'Error importando archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title="Generador QR/vCards"
          subtitle={`Bienvenido, ${session?.user?.name ?? 'Usuario'} · Empresas, sucursales y tarjetas digitales`}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#003478] rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Generador QR/vCards</h2>
                <p className="text-sm text-gray-600">Administra las vCards por empresa y sucursal, sin perder QR ni historial.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative" data-tour-id="vcards-search">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar vCards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value ?? '')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1" aria-label="Filtrar por estado">
                <button type="button" onClick={() => setVisibility('active')} aria-pressed={visibility === 'active'} className={`rounded-md px-3 py-2 text-sm font-bold ${visibility === 'active' ? 'bg-[#003478] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Activas ({vcards.filter(v => v.isActive).length})</button>
                <button type="button" onClick={() => setVisibility('archived')} aria-pressed={visibility === 'archived'} className={`rounded-md px-3 py-2 text-sm font-bold ${visibility === 'archived' ? 'bg-[#003478] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Archivadas ({vcards.filter(v => !v.isActive).length})</button>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                data-tour-id="vcards-create"
                className="flex items-center justify-center gap-2 px-6 py-2 bg-[#003478] hover:bg-[#002557] text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Nueva vCard</span>
              </button>
              <button onClick={handleDownloadTemplate} data-tour-id="vcards-template" className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4" /> Plantilla Excel
              </button>
              <button onClick={handleExportData} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4" /> Exportar vCards CSV
              </button>
              <button onClick={handleImportClick} data-tour-id="vcards-import" disabled={importing} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg transition-colors font-medium hover:bg-emerald-600 disabled:opacity-60">
                <Upload className="w-4 h-4" /> {importing ? 'Importando...' : 'Subir Excel'}
              </button>
              <button onClick={() => router.push('/vcards/manual')} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-50">
                <HelpCircle className="w-4 h-4" /> Manual visual
              </button>
              <button onClick={() => router.push('/vcards/sucursales')} data-tour-id="vcards-branches" className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-50">
                <MapPin className="w-4 h-4" /> Organizar sucursales
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} aria-label="Subir plantilla masiva" title="Subir plantilla masiva" />
          </div>

          {/* vCards agrupadas por sucursal */}
          {filteredVcards?.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No se encontraron vCards' : visibility === 'archived' ? 'No hay vCards archivadas' : 'No hay vCards activas'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Intenta con otra búsqueda'
                  : 'Crea tu primera vCard para empezar'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#003478] hover:bg-[#002557] text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Nueva vCard</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8" data-tour-id="vcards-grouped-list">
              {Object.entries(groupedVcards).map(([branchName, branchVcards]) => (
                <section key={branchName} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-base font-extrabold text-[#003478]">{branchVcards[0]?.branch?.name || 'Sin sucursal'}</h3>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#003478]">{branchVcards.length} vCards</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {branchVcards.map((vcard) => (
                      <VCardCard
                        key={vcard?.id}
                        vcard={vcard}
                        onViewQR={() => handleViewQR(vcard)}
                        onEdit={() => handleEdit(vcard)}
                        onDelete={() => handleArchive(vcard.id)}
                        onRestore={() => handleRestore(vcard.id)}
                        busy={cardOperationId === vcard.id}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateVCardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadVCards}
      />
      <EditVCardModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadVCards}
        vcard={selectedVCard}
      />
      <ViewQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        vcard={selectedVCard}
      />

      <VCardsGuidedTour
        tourId="home-v1"
        title="Guia vCards"
        steps={[
          {
            id: 'home-search',
            selector: '[data-tour-id="vcards-search"]',
            title: 'Buscador rapido',
            description: 'Escribe nombre, correo o puesto para encontrar una tarjeta en segundos.',
          },
          {
            id: 'home-create',
            selector: '[data-tour-id="vcards-create"]',
            title: 'Crear una nueva vCard',
            description: 'Aqui registras un asesor nuevo y luego eliges empresa y sucursal desde listas seguras.',
          },
          {
            id: 'home-template',
            selector: '[data-tour-id="vcards-template"]',
            title: 'Bajar plantilla',
            description: 'Descarga la plantilla para carga masiva. Es ideal para usuarios que prefieren Excel.',
          },
          {
            id: 'home-import',
            selector: '[data-tour-id="vcards-import"]',
            title: 'Subir plantilla',
            description: 'Sube el archivo completado para crear usuarios y vCards en lote.',
          },
          {
            id: 'home-branches',
            selector: '[data-tour-id="vcards-branches"]',
            title: 'Organizar por sucursales',
            description: 'Entra aqui para direccion, plantillas por sucursal y temas por puesto.',
          },
          {
            id: 'home-list',
            selector: '[data-tour-id="vcards-grouped-list"]',
            title: 'Listado agrupado',
            description: 'Las vCards quedan agrupadas por sucursal para facilitar control y seguimiento.',
          },
        ]}
      />
    </div>
  );
}
