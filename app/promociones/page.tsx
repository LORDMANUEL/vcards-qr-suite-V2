'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Calendar } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  clicks: number;
}

export default function PromocionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPromotions();
    }
  }, [status, router]);

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions');
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        title: promo.title,
        description: promo.description || '',
        imageUrl: promo.imageUrl || '',
        targetUrl: promo.targetUrl || '',
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 16) : '',
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : '',
        isActive: promo.isActive,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        targetUrl: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPromo ? `/api/promotions/${editingPromo.id}` : '/api/promotions';
      const method = editingPromo ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPromotions();
        closeModal();
      } else {
        alert('Error al guardar promoción');
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error inesperado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPromotions(promotions.filter(p => p.id !== id));
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
        <Topbar title="Promociones" subtitle="Gestiona campañas y ofertas de vCard" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">Listado de Promociones</h2>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-[#003478] text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Promoción</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-100 relative group flex-shrink-0">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {promo.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{promo.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{promo.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'Sin caducidad'}</span>
                    </div>
                    <span className="font-semibold text-[#003478]">{promo.clicks} clicks</span>
                  </div>

                  <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => openModal(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {promotions.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-100">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No hay promociones activas</h3>
                <p className="text-gray-500">Comienza creando tu primera promoción publicitaria.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título / Nombre</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                    placeholder="Ej. Oferta Ford Fiesta"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none resize-none"
                    placeholder="Descripción de la campaña..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen (Banner)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                    placeholder="https://ejemplo.com/promo.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de Destino (Redirección al click)</label>
                  <input
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                    placeholder="https://fordyudecanahuati.com/ofertas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActivePromo"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 text-[#003478] border-gray-300 rounded focus:ring-[#003478]"
                />
                <label htmlFor="isActivePromo" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Promoción Activa visible en vCards/Portales
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
                  Guardar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
