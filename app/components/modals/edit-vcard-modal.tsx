'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  companyId?: string | null;
  companyName?: string | null;
}

interface EditVCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vcard: {
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
      id?: string;
      city?: string | null;
      companyId?: string | null;
      companyName?: string | null;
      name: string;
      address?: string | null;
    } | null;
  } | null;
}

export function EditVCardModal({ isOpen, onClose, onSuccess, vcard }: EditVCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    companyId: '',
    branchId: '',
    website: '',
    photoUrl: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([fetch('/api/companies'), fetch('/api/branches')])
      .then(async ([companiesRes, branchesRes]) => {
        const companiesData = companiesRes.ok ? await companiesRes.json() : { companies: [] };
        const branchesData = branchesRes.ok ? await branchesRes.json() : { branches: [] };
        setCompanies(companiesData.companies || []);
        setBranches(branchesData.branches || []);
      })
      .catch(() => {
        setCompanies([]);
        setBranches([]);
      });
  }, [isOpen]);

  useEffect(() => {
    if (vcard) {
      const currentBranch = branches.find((branch) => branch.id === vcard?.branch?.id)
        || branches.find((branch) => branch.name === vcard?.branch?.name);
      setFormData({
        name: vcard?.user?.name ?? '',
        position: vcard?.user?.position ?? '',
        email: vcard?.user?.email ?? '',
        phone: vcard?.user?.phone ?? '',
        companyId: currentBranch?.companyId ?? vcard?.branch?.companyId ?? '',
        branchId: currentBranch?.id ?? vcard?.branch?.id ?? '',
        website: vcard?.user?.website ?? 'https://www.yudecanahuati.com',
        photoUrl: vcard?.user?.photoUrl ?? '',
      });
    }
  }, [vcard, branches]);

  if (!isOpen || !vcard) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'companyId') {
      const firstBranch = branches.find((branch) => branch.companyId === value);
      setFormData((prev) => ({ ...prev, companyId: value, branchId: firstBranch?.id || '' }));
      return;
    }
    if (name === 'branchId') {
      const selectedBranch = branches.find((branch) => branch.id === value);
      setFormData((prev) => ({ ...prev, branchId: value, companyId: selectedBranch?.companyId || prev.companyId }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filteredBranches = branches.filter((branch) => !formData.companyId || branch.companyId === formData.companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/vcards/${vcard?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response?.ok) {
        const data = await response.json();
        throw new Error(data?.error ?? 'Error al actualizar vCard');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Error al actualizar vCard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Editar vCard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Asesor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData?.name ?? ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posición</label>
              <input
                type="text"
                name="position"
                value={formData?.position ?? ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData?.email ?? ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData?.phone ?? ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa <span className="text-red-500">*</span></label>
              <select
                name="companyId"
                value={formData?.companyId ?? ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              >
                <option value="">Seleccione una empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sucursal <span className="text-red-500">*</span></label>
              <select
                name="branchId"
                value={formData?.branchId ?? ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              >
                <option value="">Seleccione una sucursal</option>
                {filteredBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}{branch.city ? ` (${branch.city})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
              <input
                type="url"
                name="website"
                value={formData?.website ?? ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de Foto</label>
              <input
                type="url"
                name="photoUrl"
                value={formData?.photoUrl ?? ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#003478] hover:bg-[#002557] text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
