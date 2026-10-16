'use client';

import { ExternalLink, KeyRound, Network, Plus } from 'lucide-react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';

export default function PortalesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar
          title="Administración de portales"
          subtitle="Acceso centralizado a nodos externos"
        />
        <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                  <Network className="h-4 w-4" /> Nodos externos
                </div>
                <h2 className="text-2xl font-black text-slate-950">Portales administrados</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Aquí se mostrarán los nodos de portales cautivos y el acceso directo a la administración de cada uno.
                  La conexión se habilitará cuando exista el nodo, su contrato de integración y las credenciales aprobadas.
                </p>
              </div>
              <button
                type="button"
                disabled
                title="Disponible cuando se implemente el conector de nodos"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
              >
                <Plus className="h-4 w-4" /> Añadir nodo
              </button>
            </div>
          </section>

          <section aria-label="Estado de nodos" className="grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ExternalLink className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Sin nodos configurados</h3>
              <p className="mt-2 text-sm text-slate-600">Cada nodo tendrá nombre, URL de administración, estado y acceso directo.</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white">
              <KeyRound className="h-7 w-7 text-blue-300" />
              <h3 className="mt-4 font-bold">Integración pendiente</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                El Connector ID y el Key ID se configurarán sin mostrar secretos en pantalla. Esta versión no crea conexiones ni modifica el servicio independiente del puerto 9301.
              </p>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
