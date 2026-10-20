'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, LockKeyhole, Mail, Server, ShieldAlert } from 'lucide-react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';

interface SmtpStatus {
  host: string;
  port: number;
  user: string;
  from: string;
  secure: boolean;
  configured: boolean;
}

export default function ConfiguracionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [smtp, setSmtp] = useState<SmtpStatus | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status !== 'authenticated') return;
    fetch('/api/admin/smtp/status')
      .then(async (response) => response.ok ? response.json() : null)
      .then((value) => setSmtp(value))
      .catch(() => setSmtp(null));
  }, [router, status]);

  if (status === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50">Cargando configuración…</main>;
  }

  const role = session?.user?.role || '';
  if (!['ADMIN', 'IT', 'SUPER_ADMIN', 'MARKETING', 'MARKETING_MANAGER'].includes(role)) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-lg rounded-3xl border border-red-100 bg-red-50 p-8 text-center text-red-700">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12" />
            <h1 className="text-xl font-black">Acceso denegado</h1>
            <p className="mt-2 text-sm">Tu rol no administra la configuración de esta plataforma.</p>
          </div>
        </main>
      </div>
    );
  }

  const isInfrastructureAdmin = ['ADMIN', 'IT', 'SUPER_ADMIN'].includes(role);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title="Configuración" subtitle="Estado real y accesos operativos de YUDE VCards" />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-4">
                <Server className="mt-1 h-6 w-6 shrink-0 text-[#003478]" />
                <div>
                  <h1 className="text-xl font-black text-slate-900">Plataforma enfocada en VCards</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">El portal cautivo ya no se configura aquí. Esta aplicación conserva la administración central de VCards y el acceso visual a los nodos externos.</p>
                  <Link href="/portales" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#003478] px-4 py-2 text-sm font-bold text-white">Administrar nodos <ExternalLink className="h-4 w-4" /></Link>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><LockKeyhole className="h-6 w-6 text-emerald-600" /><h2 className="text-lg font-black text-slate-900">Controles activos</h2></div>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  {['Acceso administrativo protegido por sesión y rol.', 'Autenticación de dos factores disponible por usuario.', 'Recuperación mediante enlace de un solo uso con vigencia de 30 minutos.', 'Usuarios, reportes y sucursales limitados por permisos.'].map((item) => (
                    <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-center gap-3"><ShieldAlert className="h-6 w-6 text-amber-700" /><h2 className="text-lg font-black text-slate-900">HTTPS pendiente</h2></div>
                <p className="mt-4 text-sm leading-6 text-slate-600">La instalación automática permanece deshabilitada. HTTPS se configurará como última fase, después de validar dominio, proxy, certificados y rollback. La plataforma debe seguir funcionando por HTTP durante las pruebas aisladas.</p>
              </section>
            </div>

            {isInfrastructureAdmin ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><Mail className="h-6 w-6 text-[#003478]" /><h2 className="text-lg font-black text-slate-900">Estado del correo</h2></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Status label="Servidor" value={smtp?.host || 'No disponible'} />
                  <Status label="Puerto" value={smtp?.port ? String(smtp.port) : 'No disponible'} />
                  <Status label="Credenciales" value={smtp?.user || 'No configuradas'} />
                  <Status label="Remitente" value={smtp?.from || 'No disponible'} />
                </div>
                <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${smtp?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{smtp?.configured ? `SMTP configurado. Transporte seguro: ${smtp.secure ? 'sí' : 'según STARTTLS del servidor'}.` : 'SMTP no está completamente configurado.'}</p>
                <p className="mt-3 text-xs text-slate-500">Los correos de recuperación se envían individualmente desde Gestión de Usuarios. El envío masivo con destinatarios fijos fue retirado.</p>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-bold text-slate-800">{value}</p></div>;
}
