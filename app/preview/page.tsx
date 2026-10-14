'use client';

import { useState, Suspense } from 'react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Smartphone, Tablet, Monitor, RefreshCw, Eye, ExternalLink, ChevronRight, Layout, Link as LinkIcon, Wifi, CheckCircle } from 'lucide-react';

function PortalPreviewContent() {
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [flowStep, setFlowStep] = useState<'portal' | 'acceso' | 'links' | 'internet'>('portal');
  const [company, setCompany] = useState('ford');
  const [key, setKey] = useState(0);

  const getUrl = () => {
    const base = `/${flowStep}`;
    const params = new URLSearchParams({
      company,
      preview: 'true',
      t: key.toString()
    });
    return `${base}?${params.toString()}`;
  };

  const getFrameSize = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px] h-[667px]';
      case 'tablet': return 'max-w-[768px] h-[1024px]';
      case 'desktop': return 'w-full h-full';
    }
  };

  const flowSteps = [
    { id: 'portal', label: '1. Bienvenida (Login)', icon: Layout },
    { id: 'acceso', label: '2. Acceso Garantizado', icon: CheckCircle },
    { id: 'links', label: '3. Enlaces Rápidos', icon: LinkIcon },
    { id: 'internet', label: '4. Estado Internet', icon: Wifi },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Flujo de Experiencia del Cliente" subtitle="Simula el recorrido completo del usuario en el portal" />

        {/* Dynamic Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap justify-between items-center gap-4">
          {/* Device Selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['mobile', 'tablet', 'desktop'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-white shadow-sm text-[#003478]' : 'text-gray-400'}`}
              >
                {mode === 'mobile' && <Smartphone className="w-5 h-5" />}
                {mode === 'tablet' && <Tablet className="w-5 h-5" />}
                {mode === 'desktop' && <Monitor className="w-5 h-5" />}
              </button>
            ))}
          </div>

          {/* Flow Navigator */}
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
            {flowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = flowStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setFlowStep(step.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-[#003478] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {idx < flowSteps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
                </div>
              );
            })}
          </div>

          {/* Company & Controls */}
          <div className="flex gap-3">
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#003478]"
            >
              <option value="ford">Ford Theme</option>
              <option value="quicklane">QuickLane Theme</option>
            </select>
            <button
              onClick={() => setKey(prev => prev + 1)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              title="Recargar"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-hidden p-6 flex flex-col items-center justify-center bg-gray-200">
          <div className={`bg-white shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500 flex flex-col border-[8px] border-gray-900 ${getFrameSize()}`}>
            {/* Mock iPhone Notch / Header */}
            <div className="bg-gray-900 h-6 w-full flex items-center justify-center relative">
              <div className="w-24 h-4 bg-black rounded-b-xl absolute top-0"></div>
            </div>

            <div className="bg-gray-800 p-2 flex items-center justify-between">
              <div className="flex gap-1 pl-4">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="bg-white/10 px-3 py-0.5 rounded text-[8px] text-white/70 font-mono flex items-center gap-2">
                <Eye className="w-2 h-2" /> PREVIEW: {flowStep.toUpperCase()}
              </div>
              <div className="w-10"></div>
            </div>

            <iframe
              key={key}
              src={getUrl()}
              className="flex-1 w-full border-none"
              title="Portal Preview"
            />

            {/* OS Handle */}
            <div className="bg-white h-5 w-full flex justify-center items-center">
              <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 font-medium">Vista previa interactiva del entorno del cliente final.</p>
            <a href={getUrl()} target="_blank" rel="noreferrer" className="text-[#003478] text-[10px] font-bold hover:underline flex items-center justify-center gap-1 mt-1">
              Abrir URL cliente en pestaña nueva <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PortalPreviewPage() {
  return (
    <Suspense fallback={<div>Cargando Vista Previa...</div>}>
      <PortalPreviewContent />
    </Suspense>
  );
}
