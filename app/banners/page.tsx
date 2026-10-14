'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface Banner {
  id: string;
  name: string;
  imageUrl: string;
  targetUrl: string | null;
  isActive: boolean;
  clicks: number;
}

export default function BannersPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    targetUrl: '',
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBanners();
    }
  }, [status, router]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        name: banner.name,
        imageUrl: banner.imageUrl,
        targetUrl: banner.targetUrl || '',
        isActive: banner.isActive,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        name: '',
        imageUrl: '',
        targetUrl: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchBanners();
        closeModal();
      } else {
        alert('Error al guardar banner');
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error inesperado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner publicitario?')) return;

    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners(banners.filter(b => b.id !== id));
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      console.error(error);
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
        <Topbar title="Banners Publicitarios" subtitle="Configura imágenes clickeables para Portales" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">Listado de Banners</h2>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-[#003478] text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Subir Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-100 relative group flex-shrink-0 border-b border-gray-100">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full shadow-sm ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {banner.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{banner.name}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded line-clamp-1 truncate" title={banner.targetUrl || 'Sin link'}>
                    Link: {banner.targetUrl || 'Sin link'}
                  </div>

                  <div className="text-sm font-semibold text-[#003478] mb-4">
                    👁️ {banner.clicks} interacciones
                  </div>

                  <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => openModal(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {banners.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-100">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No hay banners configurados</h3>
                <p className="text-gray-500">Añade imágenes publicitarias que se rotarán en los portales cautivos.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? 'Editar Banner' : 'Subir Banner'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Interno</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                  placeholder="Ej. Banner Mantenimiento Preventivo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen (Obligatorio)</label>
                <input
                  required
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                  placeholder="https://ejemplo.com/banner1.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Destino (Redirección al hacer click)</label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                  placeholder="https://fordyudecanahuati.com/citas"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveBanner"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 text-[#003478] border-gray-300 rounded focus:ring-[#003478]"
                />
                <label htmlFor="isActiveBanner" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Mostrar este Banner públicamente
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#003478] text-white rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-sm"
                >
                  Guardar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
