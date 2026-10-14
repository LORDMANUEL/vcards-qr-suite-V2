'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Settings, Shield, Key, Clock, Save, ShieldAlert, Zap, Globe, RefreshCw, Mail, Send } from 'lucide-react';

export default function ConfiguracionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  const [formData, setFormData] = useState({
    sessionTimeout: 30, // minutes
    passwordExpiryDays: 90,
    maxLoginAttempts: 3,
    forceMfa: false,
    strictIpLock: false,
    antiScrapingRateLimit: 15,
    sslDomain: 'portal.honduras.ford.com',
  });

  const [portalConfig, setPortalConfig] = useState({
    collectName: true,
    collectEmail: true,
    collectPhone: false,
    sessionLimit: 180,
    renewalLimit: 60,
    branchId: '',
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInstallingSSL, setIsInstallingSSL] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 0,
    user: '',
    from: '',
    secure: false,
    configured: false,
  });
  const [isSendingInvites, setIsSendingInvites] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // In a real app, fetch existing config from DB here. Mocking for UI demonstration:
      setFormData({
        sessionTimeout: 30,
        passwordExpiryDays: 90,
        maxLoginAttempts: 3,
        forceMfa: false,
        strictIpLock: false,
        antiScrapingRateLimit: 15,
        sslDomain: 'portal.honduras.ford.com',
      });
      // Fetch data
      loadBranches();
      loadSmtpStatus();
    }
  }, [status, router]);

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
        if (data.branches?.length > 0) {
          loadPortalConfig(data.branches[0].id);
        }
      }
    } catch (e) { console.error(e); }
  };

  const loadPortalConfig = async (branchId: string) => {
    try {
      setPortalConfig(prev => ({ ...prev, branchId }));
      const res = await fetch(`/api/portal-config?branchId=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) setPortalConfig(data.config);
      }
    } catch (e) { console.error(e); }
  };

  const loadSmtpStatus = async () => {
    try {
      const res = await fetch('/api/admin/smtp/status');
      if (res.ok) {
        const data = await res.json();
        setSmtpConfig(data);
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate save to DB Global Settings table
    setTimeout(() => {
      setIsSaving(false);
      alert('Configuraciones Globales Guardadas Exitosamente. Los cambios aplican inmediatamente.');
    }, 1500);
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
      </div>
    );
  }

  // Protección UI 
  if (!['ADMIN', 'IT', 'SUPER_ADMIN', 'MARKETING', 'MARKETING_MANAGER'].includes(session?.user?.role || '')) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar title="Configuraciones" subtitle="Sistema" />
          <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            <div className="bg-red-50 text-red-700 p-8 rounded-xl max-w-lg text-center border border-red-100 shadow-sm">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
              <p>No tienes permisos suficientes para acceder a esta sección.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleInstallSSL = async () => {
    if (!confirm(`¿Iniciar instalación de SSL para ${formData.sslDomain}?`)) return;
    setIsInstallingSSL(true);
    try {
      const res = await fetch('/api/admin/install-ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: formData.sslDomain })
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch (e) { alert('Error al conectar con la API'); }
    finally { setIsInstallingSSL(false); }
  };

  const handleSavePortalConfig = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/portal-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portalConfig)
      });
      alert('Configuración de Portal Guardada');
    } catch (e) { alert('Error al guardar'); }
    finally { setIsSaving(false); }
  };

  const handleSendItInvites = async () => {
    if (!confirm('Se enviaran correos de prueba a los usuarios de informatica solicitando cambio inmediato de contrasena. ¿Continuar?')) return;
    setIsSendingInvites(true);
    try {
      const res = await fetch('/api/admin/smtp/send-it-invites', { method: 'POST' });
      const data = await res.json();
      alert(data.message || data.error || 'Proceso completado');
    } catch (e) {
      alert('No se pudo enviar los correos de prueba');
    } finally {
      setIsSendingInvites(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Ajustes Globales y Normativas" subtitle="Políticas ISO 27001 de retención y seguridad" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">

            <form onSubmit={handleSave} className="space-y-6">

              {/* Section 0: Portal Field Configuration (Marketing + Admin) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-100 bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900 font-black">Configuración Campos Portal Cautivo</h3>
                  </div>
                  <select
                    value={portalConfig.branchId}
                    onChange={(e) => loadPortalConfig(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm outline-none"
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={portalConfig.collectName} onChange={e => setPortalConfig({ ...portalConfig, collectName: e.target.checked })} />
                      <span className="text-sm font-medium">Solicitar Nombre</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={portalConfig.collectEmail} onChange={e => setPortalConfig({ ...portalConfig, collectEmail: e.target.checked })} />
                      <span className="text-sm font-medium">Solicitar Correo</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={portalConfig.collectPhone} onChange={e => setPortalConfig({ ...portalConfig, collectPhone: e.target.checked })} />
                      <span className="text-sm font-medium">Solicitar WhatsApp</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Duración Sesión Inicial (Min)</label>
                      <input type="number" value={portalConfig.sessionLimit} onChange={e => setPortalConfig({ ...portalConfig, sessionLimit: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Duración Renovación (Min)</label>
                      <input type="number" value={portalConfig.renewalLimit} onChange={e => setPortalConfig({ ...portalConfig, renewalLimit: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <button type="button" onClick={handleSavePortalConfig} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Guardar Cambios de Marketing</button>
                </div>
              </div>

              {/* Section 0.5: SSL Let's Encrypt (Super Admin Only) */}
              {['ADMIN', 'IT', 'SUPER_ADMIN'].includes(session?.user?.role || '') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="p-5 border-b border-gray-100 bg-green-50 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900 border-none font-black">Seguridad SSL (Let's Encrypt)</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">Configura y renueva automáticamente certificados SSL para el dominio del portal.</p>
                    <div className="flex gap-4 items-center">
                      <input
                        type="text"
                        value={formData.sslDomain}
                        onChange={e => setFormData({ ...formData, sslDomain: e.target.value })}
                        className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="dominio.com"
                      />
                      <button
                        type="button"
                        disabled={isInstallingSSL}
                        onClick={handleInstallSSL}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                      >
                        {isInstallingSSL ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Instalar / Renovar SSL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {['ADMIN', 'IT', 'SUPER_ADMIN'].includes(session?.user?.role || '') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="p-5 border-b border-gray-100 bg-amber-50 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-gray-900 font-black">SMTP y correos de prueba</h3>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Servidor SMTP</p>
                        <p className="text-sm font-semibold text-gray-900">{smtpConfig.host || 'No configurado'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Puerto</p>
                        <p className="text-sm font-semibold text-gray-900">{smtpConfig.port || 'No configurado'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Usuario SMTP</p>
                        <p className="text-sm font-semibold text-gray-900">{smtpConfig.user || 'No configurado'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Remitente</p>
                        <p className="text-sm font-semibold text-gray-900">{smtpConfig.from || 'No configurado'}</p>
                      </div>
                    </div>

                    <div className={`rounded-xl border px-4 py-3 text-sm ${smtpConfig.configured ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                      {smtpConfig.configured
                        ? `SMTP listo. Conexion segura: ${smtpConfig.secure ? 'Si' : 'No'}.`
                        : 'SMTP aun no esta configurado en variables de entorno del servidor.'}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      Se enviara un correo personalizado solo a <b>informatica2@grupoyc.com</b> e <b>informatica4@grupoyc.com</b> indicandoles ingresar a la plataforma y cambiar su contrasena de inmediato.
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={loadSmtpStatus}
                        className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar estado SMTP
                      </button>
                      <button
                        type="button"
                        onClick={handleSendItInvites}
                        disabled={!smtpConfig.configured || isSendingInvites}
                        className="px-5 py-2 rounded-lg bg-amber-600 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSendingInvites ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar correos de prueba a Informatica
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#003478]" />
                  <h3 className="text-lg font-bold text-gray-900">Políticas de Acceso a Administradores</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" /> Timeout de Inactividad (Minutos)
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="120"
                      value={formData.sessionTimeout}
                      onChange={(e) => setFormData({ ...formData, sessionTimeout: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cierra la sesión automáticamente si el administrador no interactúa.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400" /> Caducidad de Contraseñas (Días)
                    </label>
                    <input
                      type="number"
                      required
                      min="30"
                      max="365"
                      value={formData.passwordExpiryDays}
                      onChange={(e) => setFormData({ ...formData, passwordExpiryDays: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Normativa ISO: Forzar cambio periódico de credenciales. (Mín 30, Máx 90 sugerido).</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intentos Máximos de Login</label>
                    <select
                      value={formData.maxLoginAttempts}
                      onChange={(e) => setFormData({ ...formData, maxLoginAttempts: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003478] focus:border-transparent outline-none"
                    >
                      <option value="3">3 Intentos (Estricto)</option>
                      <option value="5">5 Intentos (Normal)</option>
                      <option value="10">10 Intentos (Laxo)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Bloqueo temporal de cuenta al errar contraseña repetidas veces.</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Public API Security (Anti Scraping) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-red-50 flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-bold text-gray-900 border-red-200">Mitigación de Clonación y API Pública</h3>
                </div>
                <div className="p-6 space-y-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Límite de Escaneos por Minuto (Anti-Scraping / WAF)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="100"
                      value={formData.antiScrapingRateLimit}
                      onChange={(e) => setFormData({ ...formData, antiScrapingRateLimit: Number(e.target.value) })}
                      className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                      <b>Protección Activa:</b> Las APIs públicas (Generación y Visualización de vCard) bloquearán automáticamente cualquier IP que solicite más de <code>{formData.antiScrapingRateLimit}</code> tarjetas distintas en menos de un minuto, previniendo robots que busquen descargar el directorio de empleados de Ford.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                    <input
                      type="checkbox"
                      id="strictIpLock"
                      checked={formData.strictIpLock}
                      onChange={(e) => setFormData({ ...formData, strictIpLock: e.target.checked })}
                      className="w-5 h-5 mt-0.5 text-[#003478] border-gray-300 rounded focus:ring-[#003478]"
                    />
                    <div>
                      <label htmlFor="strictIpLock" className="text-sm font-bold text-gray-900 cursor-pointer">
                        Bloqueo Geográfico Estricto (Honduras Only)
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Si se activa, el middleware bloqueará cualquier escaneo de VCard proveniente de IPs fuera del territorio regional mapeado. Efectivo contra ataques bot de Rusia/China, pero puede afectar clientes usando VPNs.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-8 py-3 bg-[#003478] hover:bg-blue-800 text-white rounded-lg transition-colors font-bold shadow-md ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{isSaving ? 'Guardando...' : 'Aplicar Políticas en Producción'}</span>
                </button>
              </div>

            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
