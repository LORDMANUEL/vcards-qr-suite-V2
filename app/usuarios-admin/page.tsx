'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Plus, Search, Edit2, Trash2, UserCog, Mail } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  phone: string | null;
  website: string | null;
  branchId: string | null;
  photoUrl: string | null;
  isActive: boolean;
  branch?: {
    name: string;
  } | null;
  _count?: {
    vcards: number;
  };
}

export default function UsuariosAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SAC',
    position: '',
    phone: '',
    website: '',
    branchId: '',
    photoUrl: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingResetUserId, setSendingResetUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, branchesRes] = await Promise.all([
        fetch('/api/users?kind=system'),
        fetch('/api/branches')
      ]);

      if (usersRes.ok && branchesRes.ok) {
        const usersData = await usersRes.json();
        const branchesData = await branchesRes.json();
        setUsers(usersData.users || []);
        setFilteredUsers(usersData.users || []);
        setBranches(branchesData.branches || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't populate password on edit
        role: user.role,
        position: user.position || '',
        phone: user.phone || '',
        website: user.website || '',
        branchId: user.branchId || '',
        photoUrl: user.photoUrl || '',
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'SAC',
        position: '',
        phone: '',
        website: '',
        branchId: branches.length > 0 ? branches[0].id : '',
        photoUrl: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      // Clean empty string for branchId
      const payload = {
        ...formData,
        branchId: formData.branchId === '' ? null : formData.branchId
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadData();
        handleCloseModal();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar el usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error en el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      } else {
        alert('Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleSendResetEmail = async (user: User) => {
    if (!confirm(`Enviar correo de recuperacion a ${user.email}?`)) return;
    setSendingResetUserId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/send-reset-email`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || data.error || 'Proceso completado');
    } catch (error) {
      console.error('Error sending reset email:', error);
      alert('No se pudo enviar el correo de recuperacion');
    } finally {
      setSendingResetUserId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    'ADMIN': 'Admin',
    'IT': 'IT',
    'MARKETING': 'Mercadeo',
    'MARKETING_MANAGER': 'Jefe Mercadeo',
    'SAC': 'Servicio Cliente',
    'SALES_MANAGER': 'Gerente Ventas',
    'ADVISOR': 'Asesor'
  };

  const roleColors: Record<string, string> = {
    'ADMIN': 'bg-red-100 text-red-800',
    'IT': 'bg-slate-100 text-slate-800',
    'MARKETING': 'bg-yellow-100 text-yellow-800',
    'MARKETING_MANAGER': 'bg-amber-100 text-amber-800',
    'SAC': 'bg-cyan-100 text-cyan-800',
    'SALES_MANAGER': 'bg-emerald-100 text-emerald-800',
    'ADVISOR': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Gestión Usuarios" subtitle="Administra usuarios del sistema y sus roles" />
        <main className="flex-1 overflow-y-auto p-6">

          {/* Header Action Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#003478] rounded-lg flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
                  <p className="text-sm text-gray-500">Maneja solo los 5 usuarios del sistema. Los usuarios vCard masivos se suben por Excel.</p>
                </div>
              </div>

              <div className="flex w-full sm:w-auto gap-4">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[#003478] hover:bg-[#002557] text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Usuario</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    <th className="px-6 py-4 font-semibold">Sucursal</th>
                    <th className="px-6 py-4 font-semibold text-center">vCards</th>
                    <th className="px-6 py-4 font-semibold text-center">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-[#003478] rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.branch?.name || <span className="text-gray-400 italic">No asignada</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                            {user._count?.vcards || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {user.isActive ? (
                            <span className="text-green-500 font-medium">Activo</span>
                          ) : (
                            <span className="text-red-500 font-medium">Inactivo</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSendResetEmail(user)}
                            className="text-amber-600 hover:text-amber-800 mr-3"
                            title="Enviar recuperación"
                          >
                            <Mail className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-[#003478] hover:text-[#002557] mr-3"
                            title="Editar"
                          >
                            <Edit2 className="w-5 h-5 inline" />
                          </button>
                          {session?.user?.email !== user.email && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-4">

                <h4 className="font-semibold text-gray-700 border-b pb-2 mb-4">Información de Acceso</h4>

                {editingUser ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Puedes enviar correo de recuperacion desde la tabla principal con el icono de sobre si el usuario pierde su acceso.
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol en Sistema *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none bg-white"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="IT">IT</option>
                      <option value="MARKETING">Mercadeo</option>
                      <option value="MARKETING_MANAGER">Jefe Mercadeo</option>
                      <option value="SAC">Servicio al Cliente</option>
                      <option value="SALES_MANAGER">Gerente Ventas</option>
                    </select>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-700 border-b pb-2 mb-4 mt-6">Información de Perfil</h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal/Agencia Asignada</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none bg-white"
                    >
                      <option value="">-- Sin Sucursal Asignada --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo/Puesto (Visible en vCard)</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                      placeholder="Ej. Gerente de Ventas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                      placeholder="+504 9999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web Personal/Ventas</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL de Foto de Perfil</label>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] outline-none"
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                  </div>

                  <div className="sm:col-span-2 mt-2">
                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-[#003478] rounded focus:ring-[#003478]"
                      />
                      <div>
                        <span className="font-medium text-gray-900 block">Usuario Activo</span>
                        <span className="text-sm text-gray-500">Permite al usuario iniciar sesión y ser mostrado</span>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="userForm"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#003478] hover:bg-[#002557] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
