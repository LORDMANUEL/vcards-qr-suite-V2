'use client';

import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { Building2, FileSpreadsheet, Palette, QrCode, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    title: 'Crear empresa',
    description: 'Define branding, logo, colores y tema base/estacional de la empresa.',
    icon: Building2,
  },
  {
    title: 'Crear sucursales',
    description: 'Agrega nombre, direccion, tema predefinido y calendario estacional por ciudad.',
    icon: Palette,
  },
  {
    title: 'Subir usuarios por Excel',
    description: 'Descarga la plantilla, completa filas y sube el archivo para crear usuarios y vCards masivamente.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Editar temas',
    description: 'Entra a Editar Temas vCard para abrir el layout, ajustar widgets, footer e iconos.',
    icon: Palette,
  },
  {
    title: 'Generar y probar QR',
    description: 'Valida la URL publica y el render del cliente final antes de publicar masivamente.',
    icon: QrCode,
  },
  {
    title: 'Amarrar empleados',
    description: 'Ubica empleados en sucursales y revisa el organigrama por ventas, servicio y gerencia.',
    icon: Users,
  },
];

export default function VcardsManualPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Manual visual vCard" subtitle="Guia rapida de uso para admin, mercadeo y gerencias" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/vcards')}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a vCards
              </button>
            </div>
            {steps.map((step, index) => (
              <section key={step.title} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#003478]">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Paso {index + 1}</p>
                    <h2 className="mt-2 text-xl font-black text-gray-900">{step.title}</h2>
                    <p className="mt-3 text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
