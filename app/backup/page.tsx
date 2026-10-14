'use client';

import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Database, Download, Upload, Shield, RefreshCw, FileText, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BDManagerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBackups(data);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackup = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        alert('Respaldo generado exitosamente: ' + result.fileName);
        fetchBackups();
      } else {
        alert('Error al generar respaldo: ' + result.error);
      }
    } catch (err) {
      alert('Error de conexión al generar respaldo');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="BD Manager" subtitle="Gestión de respaldos y mantenimiento de base de datos" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#003478]">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 border-none">Mantenimiento de Datos</h2>
                  <p className="text-gray-500 font-medium">Frecuencia de respaldo: <span className="text-blue-600 font-bold uppercase text-xs">Manual y Automática</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={handleBackup}
                  disabled={isProcessing}
                  className="p-6 bg-white border border-gray-200 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all group flex flex-col items-center text-center gap-4 disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                    {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Generar Respaldo</h3>
                    <p className="text-xs text-gray-500 mt-1">Exporta un volcado SQL completo de los datos actuales.</p>
                  </div>
                </button>

                <div className="p-6 bg-slate-50 border border-gray-200 rounded-3xl flex flex-col items-center text-center gap-4 opacity-75">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-400">Restaurar Datos</h3>
                    <p className="text-xs text-gray-400 mt-1">Función restringida al administrador de sistemas.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Historial de Respaldos
                </h3>
                <button onClick={fetchBackups} className="text-[#003478] hover:rotate-180 transition-transform duration-500">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {backups.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 italic">No hay respaldos generados todavía.</div>
                ) : (
                  backups.map((b) => (
                    <div key={b.name} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                            {new Date(b.createdAt).toLocaleString()} • {(b.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={`/api/backup/download?file=${b.name}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#003478] text-white p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 opacity-50" />
                <h3 className="text-lg font-bold">Seguridad de Datos</h3>
              </div>
              <p className="text-white/70 text-sm">Los respaldos manuales se guardan en el servidor seguro. Recomendamos descargar copias importantes a un almacenamiento externo como precaución adicional.</p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
