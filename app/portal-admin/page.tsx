import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/app/components/sidebar';
import { Topbar } from '@/app/components/topbar';

const modules = [
  { title: 'Nodos y puntos de acceso', description: 'Inventario, sucursal y configuración de los Access Points existentes.', href: '/ubicaciones', icon: '📡' },
  { title: 'Usuarios conectados', description: 'Sesiones del portal cautivo y consulta operacional.', href: '/usuarios', icon: '👥' },
  { title: 'Temas de portales', description: 'Diseño exclusivo del acceso Wi-Fi, independiente de los temas vCard.', href: '/temas-portal', icon: '🎨' },
  { title: 'Sucursales de portales', description: 'Organización de las sedes asociadas a los nodos.', href: '/portales/sucursales', icon: '🏢' },
  { title: 'Enlaces y promociones', description: 'Destinos, promociones y contenidos autorizados del portal.', href: '/links', icon: '🔗' },
  { title: 'Reportes del portal', description: 'Revisar métricas y eventos de las sesiones.', href: '/reportes?tab=portal', icon: '📊' },
];

export default async function PortalAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 rounded-3xl bg-[#003478] p-6 text-white shadow-lg md:p-10">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Espacio independiente</span>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">Administración de portales cautivos</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 md:text-base">
                Administre nodos, sucursales, sesiones y contenido Wi-Fi sin mezclar herramientas de vCards y tarjetas impresas.
                Los nodos existentes continúan usando sus integraciones actuales.
              </p>
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Módulos del portal</h2>
                <p className="mt-1 text-sm text-slate-500">Accesos a las pantallas existentes. No se han migrado rutas ni controladores.</p>
              </div>
              <Link href="/vcards" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#003478] hover:bg-slate-50">
                Volver a vCards
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <Link key={module.href} href={module.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl" aria-hidden="true">{module.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{module.description}</p>
                  <span className="mt-5 block text-sm font-semibold text-[#003478]">Abrir módulo</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-bold text-amber-900">Gestión de nodos: fase inicial</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-800">
                Este espacio separa la navegación. La incorporación de controladores adicionales, aprovisionamiento remoto,
                inventario operativo y monitorización se implementará en PR posteriores después de auditar cada proveedor.
                No se modifica el portal público ni el servicio 9301.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
