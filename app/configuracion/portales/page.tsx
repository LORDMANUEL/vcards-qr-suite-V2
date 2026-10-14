'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { Layout, Smartphone, Palette, Save, Eye, CheckCircle2, Loader2, Sparkles, Settings2, Users } from 'lucide-react';

type PortalTheme = 'ford' | 'quicklane';

interface Branch {
    id: string;
    name: string;
}

interface PortalConfig {
    branchId: string;
    requiredFields: string[];
    sessionLimit: number;
    renewalLimit: number;
    isActive: boolean;
}

export default function PortalConfigPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [config, setConfig] = useState<PortalConfig>({
        branchId: '',
        requiredFields: ['name', 'email'],
        sessionLimit: 180,
        renewalLimit: 60,
        isActive: true
    });

    const fieldOptions = [
        { id: 'name', label: 'Nombre Completo', icon: '👤' },
        { id: 'email', label: 'Correo Electrónico', icon: '📧' },
        { id: 'phone', label: 'Teléfono / WhatsApp', icon: '📱' },
        { id: 'rtn', label: 'RTN (Honduras)', icon: '🆔' },
        { id: 'vin', label: 'VIN del Vehículo', icon: '🚗' },
        { id: 'plate', label: 'Placa', icon: '🔢' },
        { id: 'model', label: 'Modelo del Auto', icon: '🚘' },
    ];

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranchId) {
            fetchConfig(selectedBranchId);
        }
    }, [selectedBranchId]);

    const fetchBranches = async () => {
        try {
            const res = await fetch('/api/branches');
            const data = await res.json();
            setBranches(data.branches || []);
            if (data.branches?.length > 0) {
                setSelectedBranchId(data.branches[0].id);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async (branchId: string) => {
        try {
            const res = await fetch(`/api/portal-config?branchId=${branchId}`);
            const data = await res.json();
            if (data.config) {
                setConfig({
                    ...data.config,
                    requiredFields: Array.isArray(data.config.requiredFields) ? data.config.requiredFields : JSON.parse(data.config.requiredFields || '[]')
                });
            } else {
                setConfig({
                    branchId,
                    requiredFields: ['name', 'email'],
                    sessionLimit: 180,
                    renewalLimit: 60,
                    isActive: true
                });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const toggleField = (fieldId: string) => {
        setConfig((prev: PortalConfig) => {
            const current = prev.requiredFields || [];
            if (current.includes(fieldId)) {
                return { ...prev, requiredFields: current.filter((id: string) => id !== fieldId) };
            } else {
                return { ...prev, requiredFields: [...current, fieldId] };
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/portal-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...config,
                    branchId: selectedBranchId
                })
            });
            if (res.ok) {
                alert('Configuración guardada correctamente');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-[#003478] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar title="Configuración de Portal Cautivo" subtitle="Control de Captura de Datos y Sesiones" />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Selector de Sucursal */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Settings2 className="w-6 h-6 text-[#003478]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Sucursal a Configurar</h3>
                                    <p className="text-sm text-gray-500">Cada sucursal puede tener requisitos de datos diferentes</p>
                                </div>
                            </div>
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#003478] outline-none focus:ring-2 focus:ring-[#003478]"
                            >
                                {branches.map((b: Branch) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Form Section */}
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Users className="w-6 h-6 text-[#003478]" />
                                        Campos de Captura Dinámica
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {fieldOptions.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => toggleField(option.id)}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${config.requiredFields.includes(option.id) ? 'border-[#003478] bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <span className="text-2xl">{option.icon}</span>
                                                <span className={`font-bold ${config.requiredFields.includes(option.id) ? 'text-[#003478]' : 'text-gray-500'}`}>{option.label}</span>
                                                {config.requiredFields.includes(option.id) && <CheckCircle2 className="w-5 h-5 ml-auto text-[#003478]" />}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-8 space-y-6">
                                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-[#003478]" />
                                            Límites de Sesión
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tiempo de Conexión (min)</label>
                                                <input
                                                    type="number"
                                                    value={config.sessionLimit}
                                                    onChange={(e) => setConfig({ ...config, sessionLimit: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003478] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tiempo p/ Renovación (min)</label>
                                                <input
                                                    type="number"
                                                    value={config.renewalLimit}
                                                    onChange={(e) => setConfig({ ...config, renewalLimit: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003478] outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-[#003478] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#002557] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    GUARDAR CONFIGURACIÓN PARA {branches.find((b: Branch) => b.id === selectedBranchId)?.name.toUpperCase()}
                                </button>
                            </div>

                            {/* Preview Section */}
                            <div className="flex flex-col items-center">
                                <div className="sticky top-6 w-full max-w-sm">
                                    <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 w-fit mx-auto">
                                        <Smartphone className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Vista Previa Formulario</span>
                                    </div>

                                    {/* Phone Frame */}
                                    <div className="relative w-full aspect-[9/18.5] bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-gray-800">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>

                                        {/* Screen Content */}
                                        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative flex flex-col">
                                            <div className="p-8 pb-4 text-center">
                                                <div className="w-12 h-12 bg-blue-50 text-[#003478] rounded-xl flex items-center justify-center mx-auto mb-4">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-lg font-black text-gray-900 uppercase">Inicio de Sesión WiFi</h4>
                                                <p className="text-xs text-gray-500 mt-2">Por favor complete sus datos para navegar</p>
                                            </div>

                                            <div className="flex-1 px-8 py-4 space-y-4 overflow-y-auto">
                                                {config.requiredFields.length === 0 && (
                                                    <p className="text-center text-gray-400 text-xs py-10 italic">No se han requerido campos. Conexión directa habilitada.</p>
                                                )}
                                                {config.requiredFields.map((fieldId: string) => {
                                                    const field = fieldOptions.find(o => o.id === fieldId);
                                                    return (
                                                        <div key={fieldId}>
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{field?.label}</label>
                                                            <div className="w-full h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center px-3 gap-2">
                                                                <span className="text-sm opacity-50">{field?.icon}</span>
                                                                <div className="h-2 w-20 bg-gray-200 rounded"></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="p-8 pt-4">
                                                <button className="w-full py-3 bg-[#003478] text-white rounded-xl font-bold text-sm shadow-lg">
                                                    CONECTAR A INTERNET
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
