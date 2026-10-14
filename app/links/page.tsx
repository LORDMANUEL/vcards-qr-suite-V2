'use client';

import { useState, useEffect, Suspense } from 'react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import {
    Plus, Wifi, Link2, QrCode, Settings, Trash2, Copy, CheckCircle,
    Clock, Users, Globe, Edit2, X, ChevronDown, Shield, Sparkles, ServerCog
} from 'lucide-react';

interface Branch { id: string; name: string; }
interface Theme { id: string; name: string; }

interface AccessPoint {
    id: string;
    name: string;
    identifier: string;
    providerType: string;
    branchId: string;
    branchName?: string;
    themeId?: string | null;
    themeName?: string | null;
    ssid?: string | null;
    wifiPassword?: string | null;
    wifiSecurity?: string | null;
    externalUrl?: string | null;
    radiusNasId?: string | null;
    radiusSecret?: string | null;
    uamServer?: string | null;
    uamAllowed?: string[];
    uamDomain?: string[];
    timeLimit: number; // minutes
    fields: string[];
    timerVisible?: boolean;
    isActive: boolean;
    outageBypassEnabled?: boolean;
    outageBypassNotes?: string | null;
    activeSessions?: number;
    portalUrl: string;
}

const SESSION_TIMES = [30, 60, 120, 240, 480, 1440];
const SESSION_LABELS: Record<number, string> = { 30: '30 min', 60: '1h', 120: '2h', 240: '4h', 480: '8h', 1440: '24h' };
const FIELD_OPTIONS = ['Nombre', 'Email', 'Teléfono', 'Modelo Vehículo', 'Año Vehículo', 'Placa', 'RTN', 'VIN'];
const FIELD_KEYS = ['collectName', 'collectEmail', 'collectPhone', 'collectCarModel', 'collectVehicleYear', 'collectLicensePlate', 'rtn', 'vin'];
const PROVIDER_OPTIONS = ['GENERIC', 'CUDY', 'OMAADA', 'UNIFI', 'MIKROTIK'];
const WIFI_SECURITY_OPTIONS = ['WPA', 'WPA2', 'WPA3', 'nopass'];

function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function shortSlug(branchName: string, apName?: string) {
    const clean = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const branchInitials = clean(branchName).split(/\s+/).filter(Boolean).map(w => w[0] || '').join('').slice(0, 3);
    const rand = Math.random().toString(36).slice(2, 6);
    return [branchInitials || 'ap', rand].join('-');
}

function AccessPointModal({ ap, branches, themes, onSave, onClose }: {
    ap?: Partial<AccessPoint>;
    branches: Branch[];
    themes: Theme[];
    onSave: (data: any) => void;
    onClose: () => void;
}) {
    const isEditing = Boolean(ap?.id);
    const [name, setName] = useState(ap?.name || '');
    const [branchId, setBranchId] = useState(ap?.branchId || branches[0]?.id || '');
    const [themeId, setThemeId] = useState(ap?.themeId || '');
    const [timeLimit, setTimeLimit] = useState(ap?.timeLimit || 60);
    const [fields, setFields] = useState<string[]>(ap?.fields || ['collectName', 'collectEmail', 'collectPhone']);
    const [identifier, setIdentifier] = useState(ap?.identifier || '');
    const [providerType, setProviderType] = useState(ap?.providerType || 'CUDY');
    const [ssid, setSsid] = useState(ap?.ssid || '');
    const [wifiPassword, setWifiPassword] = useState(ap?.wifiPassword || '');
    const [wifiSecurity, setWifiSecurity] = useState(ap?.wifiSecurity || 'WPA2');
    const [timerVisible, setTimerVisible] = useState(ap?.timerVisible ?? true);
    const [externalUrl, setExternalUrl] = useState(ap?.externalUrl || '');
    const [radiusNasId, setRadiusNasId] = useState(ap?.radiusNasId || 'cudy');
    const [radiusSecret, setRadiusSecret] = useState(ap?.radiusSecret || '');
    const [uamServer, setUamServer] = useState(ap?.uamServer || '');
    const [uamAllowed, setUamAllowed] = useState((ap?.uamAllowed || []).join(', '));
    const [uamDomain, setUamDomain] = useState((ap?.uamDomain || []).join(', '));
    const [outageBypassEnabled, setOutageBypassEnabled] = useState(ap?.outageBypassEnabled ?? false);
    const [outageBypassNotes, setOutageBypassNotes] = useState(ap?.outageBypassNotes || '');
    const [simpleMode, setSimpleMode] = useState(!isEditing);
    const [showAdvanced, setShowAdvanced] = useState(isEditing);

    const selectedBranch = branches.find((branch) => branch.id === branchId);

    useEffect(() => {
        if (!identifier && name && selectedBranch) {
            const generated = shortSlug(selectedBranch.name);
            setIdentifier(generated);
            if (!radiusNasId || radiusNasId === 'cudy') {
                setRadiusNasId(generated);
            }
        }
    }, [identifier, name, radiusNasId, selectedBranch]);

    useEffect(() => {
        if (!simpleMode) {
            return;
        }

        setProviderType('CUDY');
        setTimerVisible(true);

        if (!fields.length) {
            setFields(['collectName', 'collectEmail', 'collectPhone']);
        }

        if (!uamAllowed.trim()) {
            setUamAllowed('portal.honduras.ford.com, fordyude.hn');
        }

        if (!uamDomain.trim()) {
            setUamDomain('portal.honduras.ford.com, fordyude.hn');
        }

        if (!outageBypassNotes.trim()) {
            setOutageBypassNotes('Si el portal externo falla, cambiar temporalmente el SSID a autenticacion local o sin autenticacion hasta restaurar el servidor.');
        }
    }, [fields.length, outageBypassNotes, simpleMode, uamAllowed, uamDomain]);

    useEffect(() => {
        if (simpleMode && !isEditing) {
            setWifiSecurity('nopass');
            setWifiPassword('');
        }
    }, [isEditing, simpleMode]);

    const toggleField = (key: string) =>
        setFields(f => f.includes(key) ? f.filter(x => x !== key) : [...f, key]);

    const handleSaveClick = () => {
        const normalizedIdentifier = identifier || shortSlug(selectedBranch?.name || 'portal');
        onSave({
            name,
            branchId,
            themeId: themeId || null,
            timeLimit,
            fields,
            identifier: normalizedIdentifier,
            providerType,
            ssid,
            wifiPassword: wifiSecurity === 'nopass' ? '' : wifiPassword,
            wifiSecurity,
            timerVisible,
            externalUrl,
            radiusNasId: radiusNasId || normalizedIdentifier,
            radiusSecret,
            uamServer,
            uamAllowed: uamAllowed.split(',').map(v => v.trim()).filter(Boolean),
            uamDomain: uamDomain.split(',').map(v => v.trim()).filter(Boolean),
            outageBypassEnabled,
            outageBypassNotes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900">{ap?.id ? 'Editar' : 'Nuevo'} Access Point</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
                </div>

                <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Provisionamiento</p>
                            <h3 className="mt-2 text-lg font-black text-slate-900">Modo simple para portal con RADIUS</h3>
                            <p className="mt-1 text-sm text-slate-600">Completa solo sucursal, AP, SSID, clave y secreto RADIUS. El resto se rellena con defaults seguros para Cudy.</p>
                        </div>
                        <button
                            onClick={() => setSimpleMode((value) => !value)}
                            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${simpleMode ? 'bg-[#003478] text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                        >
                            <Sparkles className="w-4 h-4" /> {simpleMode ? 'Modo simple activo' : 'Activar modo simple'}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Sucursal</label>
                            <select value={branchId} onChange={e => setBranchId(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none appearance-none">
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre del AP</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Sala de Espera Principal"
                                className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">SSID / Nombre WiFi</label>
                            <input value={ssid} onChange={e => setSsid(e.target.value)} placeholder={simpleMode ? 'WiFi-Libre' : 'WiFi-Invitados'}
                                className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                        </div>
                        {simpleMode ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-emerald-800">Red abierta (sin contraseña)</p>
                                    <p className="text-[10px] text-emerald-600 mt-0.5">El portal cautivo captura al cliente al conectar</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Password WiFi</label>
                                <input value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="Clave WiFi"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>
                        )}
                    </div>

                    {simpleMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">NAS ID RADIUS</label>
                                <input value={radiusNasId} onChange={e => setRadiusNasId(e.target.value)} placeholder="auto desde nombre del AP"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">RADIUS Secret</label>
                                <input value={radiusSecret} onChange={e => setRadiusSecret(e.target.value)} placeholder="Secreto compartido con el AP"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Seguridad WiFi</label>
                                <select value={wifiSecurity} onChange={e => setWifiSecurity(e.target.value)} className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none appearance-none">
                                    {WIFI_SECURITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">NAS ID</label>
                                <input value={radiusNasId} onChange={e => setRadiusNasId(e.target.value)} placeholder="auto desde AP"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">RADIUS Secret</label>
                                <input value={radiusSecret} onChange={e => setRadiusSecret(e.target.value)} placeholder="Secreto compartido"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Tema Visual del Portal</label>
                        <select value={themeId || ''} onChange={e => setThemeId(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none appearance-none">
                            <option value="">— Sin tema (por defecto) —</option>
                            {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-start gap-3">
                            <ServerCog className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                            <div className="text-sm text-emerald-900">
                                <p className="font-black">Perfil recomendado para Cudy + RADIUS</p>
                                <p className="mt-1">Autenticación: servidor de portal externo. NAS ID igual al identificador del AP. RADIUS Secret igual en Cudy y en FreeRADIUS. El portal recoge datos y luego el backend autoriza la MAC/IP.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Endpoint Router / URL externa</label>
                        <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="http://router.local/api/captive"
                            className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                    </div>

                    {simpleMode ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <p className="font-black text-slate-800">Defaults automáticos</p>
                            <ul className="mt-2 space-y-1 text-xs">
                                <li>Proveedor: CUDY</li>
                                <li>Timer visible: activado</li>
                                <li>Campos mínimos: nombre, email, teléfono</li>
                                <li>Contingencia: notas de bypass preconfiguradas</li>
                            </ul>
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Configuración avanzada</p>
                            <p className="text-xs text-gray-400 mt-1">UAM, identificador manual, proveedor y dominios permitidos</p>
                        </div>
                        <button
                            onClick={() => setShowAdvanced((value) => !value)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-slate-700"
                        >
                            <ChevronDown className={`w-4 h-4 transition ${showAdvanced ? 'rotate-180' : ''}`} /> {showAdvanced ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>

                    {showAdvanced ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Identificador AP</label>
                                    <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="sala-espera-sps"
                                        className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Proveedor</label>
                                    <select value={providerType} onChange={e => setProviderType(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none appearance-none">
                                        {PROVIDER_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">UAM Server / Redirect URL</label>
                                <input value={uamServer} onChange={e => setUamServer(e.target.value)} placeholder="https://portal.midominio.com/redirect-flow"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">UAM Allowed hosts</label>
                                <input value={uamAllowed} onChange={e => setUamAllowed(e.target.value)} placeholder="dominio1.com, dominio2.com"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">UAM Domain hosts</label>
                                <input value={uamDomain} onChange={e => setUamDomain(e.target.value)} placeholder="dominio1.com, dominio2.com"
                                    className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                            </div>
                        </>
                    ) : null}

                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Tiempo de Sesión</label>
                        <div className="grid grid-cols-3 gap-2">
                            {SESSION_TIMES.map(t => (
                                <button key={t} onClick={() => setTimeLimit(t)}
                                    className={`py-2 rounded-xl text-xs font-black border transition-all ${timeLimit === t ? 'bg-[#003478] text-white border-[#003478]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#003478]'}`}>
                                    {SESSION_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Campos a Capturar</label>
                        <div className="grid grid-cols-2 gap-2">
                            {FIELD_OPTIONS.map((label, i) => (
                                <button key={FIELD_KEYS[i]} onClick={() => toggleField(FIELD_KEYS[i])}
                                    className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${fields.includes(FIELD_KEYS[i]) ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${fields.includes(FIELD_KEYS[i]) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        {fields.includes(FIELD_KEYS[i]) && <CheckCircle className="w-2 h-2 text-white" />}
                                    </div>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Timer visible</p>
                            <p className="text-xs text-gray-400 mt-1">Mostrar countdown en /acceso</p>
                        </div>
                        <button onClick={() => setTimerVisible(v => !v)} className={`relative h-6 w-11 rounded-full transition-all ${timerVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${timerVisible ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Bypass por corte electrico</p>
                            <p className="text-xs text-gray-400 mt-1">Permitir internet local o SSID abierto temporal si el servidor cae</p>
                        </div>
                        <button onClick={() => setOutageBypassEnabled(v => !v)} className={`relative h-6 w-11 rounded-full transition-all ${outageBypassEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${outageBypassEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Instruccion de contingencia</label>
                        <textarea value={outageBypassNotes} onChange={e => setOutageBypassNotes(e.target.value)} rows={3} placeholder="Ej. Cambiar el portal a Local Password o No Authentication si el servidor no responde"
                            className="w-full p-3 border border-gray-200 rounded-2xl font-semibold focus:ring-2 focus:ring-[#003478] outline-none" />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSaveClick}
                        className="flex-1 py-3 bg-[#003478] text-white rounded-2xl font-bold hover:bg-[#002557] transition-colors shadow-lg shadow-blue-100">
                        {ap?.id ? 'Guardar Cambios' : simpleMode ? 'Crear Portal Simple' : 'Crear Access Point'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RadiusConfigModal({ ap, portalBase, onClose }: {
    ap: AccessPoint;
    portalBase: string;
    onClose: () => void;
}) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'cudy' | 'test'>('cudy');
    const serverIp = (() => {
        if (portalBase) { try { return new URL(portalBase).hostname; } catch { /**/ } }
        return typeof window !== 'undefined' ? window.location.hostname : '';
    })();
    const nasId = ap.radiusNasId || ap.identifier;
    const portalUrl = `${portalBase}/portal?ap=${ap.identifier}&mac=\${mac}&ip=\${ip}`;
    const wifiQrData = !ap.wifiSecurity || ap.wifiSecurity === 'nopass'
        ? `WIFI:T:nopass;S:${ap.ssid || ''};;`
        : `WIFI:T:${ap.wifiSecurity};S:${ap.ssid || ''};P:${ap.wifiPassword || ''};;`;
    const testRegisterCmd = `curl -s -X POST ${portalBase}/api/portal/register \\
  -H 'Content-Type: application/json' \\
  -d '{"macAddress":"AA:BB:CC:DD:EE:FF","ipAddress":"192.168.10.100","apIdentifier":"${ap.identifier}","name":"Test","email":"test@prueba.com","phone":"00000000"}'`;
    const testRadiusCmd = `/usr/local/bin/vcard-radius-authorize.sh AA:BB:CC:DD:EE:FF ${nasId} 192.168.10.100`;
    const freeradiusClientConf = `client ${nasId} {\n    ipaddr = <IP_DEL_CUDY>\n    secret = ${ap.radiusSecret || 'SECRETO_AQUI'}\n    nas_type = other\n    shortname = ${nasId}\n}`;

    const copy = (value: string, key: string) => {
        navigator.clipboard.writeText(value);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
    };

    const Row = ({ label, value, fieldKey, note, mono = true }: { label: string; value: string; fieldKey: string; note?: string; mono?: boolean }) => (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                <p className={`mt-0.5 text-sm font-bold break-all ${mono ? 'font-mono text-[#003478]' : 'text-gray-900'}`}>{value || '—'}</p>
                {note && <p className="text-[10px] text-gray-400 mt-1">{note}</p>}
            </div>
            {value && (
                <button onClick={() => copy(value, fieldKey)}
                    className={`shrink-0 mt-5 p-2 rounded-xl transition-all ${copiedKey === fieldKey ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                    {copiedKey === fieldKey ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
                <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-8 pt-6 pb-4 z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">AP creado ✓ — lista de configuración</p>
                            <h2 className="text-lg font-black text-gray-900 mt-0.5">{ap.name}</h2>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {ap.identifier}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl mt-1"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => setActiveTab('cudy')}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'cudy' ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            Configurar Cudy
                        </button>
                        <button onClick={() => setActiveTab('test')}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'test' ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            Probar ahora
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 pt-4">
                {activeTab === 'cudy' && (
                    <>
                        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 mb-5 text-xs text-amber-800">
                            <p className="font-black">Ruta en el router Cudy</p>
                            <p className="mt-1 font-mono">192.168.10.1 → Login → Advanced → Wireless → <strong>Hotspot</strong></p>
                            <p className="mt-1 text-amber-600">(algunos modelos: Network → Captive Portal)</p>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">① WiFi — configura la red</p>
                        <div className="bg-white rounded-xl border border-gray-100 px-4 mb-4 divide-y divide-gray-50">
                            <Row label="SSID (Nombre de la red)" value={ap.ssid || ''} fieldKey="ssid"
                                note="Campo: SSID — escribe el nombre exactamente así" />
                            <Row label="Security / Seguridad" value="None" fieldKey="sec" mono={false}
                                note="Selecciona None u Open — sin contraseña. El portal captura al usuario al conectar." />
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">② Hotspot — activar y modo</p>
                        <div className="bg-white rounded-xl border border-gray-100 px-4 mb-4 divide-y divide-gray-50">
                            <Row label="Enable Hotspot" value="ON (activar)" fieldKey="enable" mono={false} />
                            <Row label="Authentication Type" value="External Portal Server" fieldKey="authtype" mono={false}
                                note='Desplegable → selecciona "External Portal Server"' />
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">③ Portal URL — pegar tal como está</p>
                        <div className="bg-white rounded-xl border border-gray-100 px-4 mb-4">
                            <Row label="Captive Portal URL" value={portalUrl} fieldKey="portalurl"
                                note="Cudy sustituye ${mac} y ${ip} automáticamente por la MAC e IP del cliente" />
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">④ RADIUS — servidor de autorización</p>
                        <div className="bg-white rounded-xl border border-gray-100 px-4 mb-4 divide-y divide-gray-50">
                            <Row label="RADIUS Server / Primary Server" value={serverIp} fieldKey="radius_ip"
                                note="IP del servidor donde corre FreeRADIUS" />
                            <Row label="RADIUS Auth Port" value="1812" fieldKey="radius_port" />
                            <Row label="RADIUS Accounting Port" value="1813" fieldKey="radius_acct" />
                            <Row label="RADIUS Shared Secret" value={ap.radiusSecret || '(ingresa el secreto en el form del AP)'}
                                fieldKey="secret" note="Mismo valor en Cudy y en /etc/freeradius/3.0/clients.d/" />
                            <Row label="NAS ID / NAS Identifier" value={nasId} fieldKey="nasid"
                                note="Identifica este AP en FreeRADIUS — usar el mismo en el archivo de cliente" />
                            <Row label="Session Timeout / Lease Time (minutos)" value={String(ap.timeLimit)} fieldKey="timeout" />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">FreeRADIUS — archivo de cliente para este Cudy</p>
                                <button onClick={() => copy(freeradiusClientConf, 'frconf')}
                                    className={`p-1.5 rounded-lg transition-all ${copiedKey === 'frconf' ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                    {copiedKey === 'frconf' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap">{freeradiusClientConf}</pre>
                            <p className="mt-2 text-[10px] text-slate-400">
                                Guardar como <span className="font-mono">/etc/freeradius/3.0/clients.d/{nasId}.conf</span> y correr: <span className="font-mono">systemctl restart freeradius</span>
                            </p>
                        </div>

                        {ap.ssid && (
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex gap-4 items-center">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(wifiQrData)}`}
                                    alt="WiFi QR" className="h-[110px] w-[110px] rounded-xl border border-gray-200 bg-white p-1 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">QR WiFi para imprimir</p>
                                    <p className="text-sm font-bold text-gray-900 mt-1">{ap.ssid}</p>
                                    <p className="text-xs text-gray-500 mt-1">Red abierta — escanear y el portal captura al cliente</p>
                                    <button onClick={() => { const a = document.createElement('a'); a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(wifiQrData)}`; a.download = `wifi-${ap.ssid}.png`; a.click(); }}
                                        className="mt-2 text-[10px] font-black text-[#003478] hover:underline">Descargar PNG 400px</button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'test' && (
                    <>
                        <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 mb-5 text-xs text-blue-800">
                            <p className="font-black">Probar sin Cudy configurado</p>
                            <p className="mt-1 text-blue-600">Estos comandos simulan el flujo completo desde la terminal del servidor (SSH root).</p>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">① Registrar sesión de prueba</p>
                        <p className="text-[11px] text-gray-500 mb-2">Simula que el cliente llenó el formulario del portal:</p>
                        <div className="relative rounded-xl bg-gray-900 p-4 mb-1">
                            <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap break-all pr-8">{testRegisterCmd}</pre>
                            <button onClick={() => copy(testRegisterCmd, 'testreg')}
                                className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${copiedKey === 'testreg' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {copiedKey === 'testreg' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-5">Respuesta esperada: <span className="font-mono text-emerald-600">status: &quot;AUTHORIZED&quot;</span></p>

                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">② Verificar que RADIUS la aprueba</p>
                        <div className="relative rounded-xl bg-gray-900 p-4 mb-1">
                            <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap break-all pr-8">{testRadiusCmd}</pre>
                            <button onClick={() => copy(testRadiusCmd, 'testrad')}
                                className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${copiedKey === 'testrad' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {copiedKey === 'testrad' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-5">Respuesta esperada: <span className="font-mono text-emerald-600">ACCEPT Session-Timeout := {ap.timeLimit * 60 - 1}</span></p>

                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">③ Abrir el formulario del portal</p>
                        <div className="relative rounded-xl bg-gray-900 p-4 mb-1">
                            <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap break-all pr-8">{`${portalBase}/portal?ap=${ap.identifier}&mac=AA:BB:CC:DD:EE:FF&ip=192.168.10.100`}</pre>
                            <button onClick={() => copy(`${portalBase}/portal?ap=${ap.identifier}&mac=AA:BB:CC:DD:EE:FF&ip=192.168.10.100`, 'testportal')}
                                className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${copiedKey === 'testportal' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                {copiedKey === 'testportal' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-5">Abrí esta URL en el navegador — muestra el formulario del portal cautivo.</p>

                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">④ Ver sesión en el panel</p>
                        <p className="text-[11px] text-gray-600 mb-5">Ve a <strong>/usuarios</strong> — aparece la sesión del cliente con estado, MAC y tiempo restante.</p>

                        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-800">
                            <p className="font-black mb-2">Cuando el Cudy esté configurado:</p>
                            <ol className="space-y-1 list-decimal list-inside">
                                <li>Conectá el celular a <strong>{ap.ssid || 'la red WiFi'}</strong> (red abierta, sin contraseña)</li>
                                <li>El Cudy redirige automáticamente al portal del formulario</li>
                                <li>El cliente llena el form y presiona Submit</li>
                                <li>El backend registra la sesión → RADIUS responde ACCEPT</li>
                                <li>Cudy da internet por {ap.timeLimit >= 60 ? `${ap.timeLimit / 60}h` : `${ap.timeLimit} min`}</li>
                            </ol>
                        </div>
                    </>
                )}

                <button onClick={onClose} className="mt-6 w-full py-3 bg-[#003478] text-white rounded-2xl font-bold hover:bg-[#002557] transition-colors">
                    Listo, cerrar
                </button>
                </div>
            </div>
        </div>
    );
}

function LinksContent() {
    const [aps, setAps] = useState<AccessPoint[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAp, setEditingAp] = useState<Partial<AccessPoint> | undefined>();
    const [copied, setCopied] = useState<string | null>(null);
    const [testingApId, setTestingApId] = useState<string | null>(null);
    const [configReadyAp, setConfigReadyAp] = useState<AccessPoint | null>(null);
    const [radiusConfigAp, setRadiusConfigAp] = useState<AccessPoint | null>(null);

    const getPortalBaseUrl = () => {
        if (typeof window === 'undefined') return '';
        const envUrl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL;
        if (envUrl) return envUrl.replace(/\/$/, '');
        // Fall back to the current origin to avoid mixing domain/ports.
        return window.location.origin.replace(/\/$/, '');
    };

    const BASE_URL = getPortalBaseUrl();

    useEffect(() => {
        Promise.all([
            fetch('/api/branches').then(r => r.json()),
            fetch('/api/themes?category=PORTAL').then(r => r.json()),
            fetch('/api/access-points').then(r => r.ok ? r.json() : { accessPoints: [] }),
        ]).then(([bData, tData, apData]) => {
            setBranches(bData.branches || []);
            setThemes(tData.themes || []);
            setAps(apData.accessPoints || []);
        }).finally(() => setLoading(false));
    }, []);

    const handleSave = async (data: any) => {
        const isNew = !editingAp?.id;
        const method = isNew ? 'POST' : 'PUT';
        const url = isNew ? '/api/access-points' : `/api/access-points/${editingAp!.id}`;
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
            const updated = await fetch('/api/access-points').then(r => r.json());
            const list: AccessPoint[] = updated.accessPoints || [];
            setAps(list);
            if (isNew) {
                const newAp = list.find(a => a.identifier === data.identifier);
                if (newAp) setConfigReadyAp(newAp);
            }
        }
        setShowModal(false);
        setEditingAp(undefined);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este Access Point?')) return;
        await fetch(`/api/access-points/${id}`, { method: 'DELETE' });
        setAps(prev => prev.filter(a => a.id !== id));
    };

    const copyLink = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleTestIntegration = async (ap: AccessPoint) => {
        try {
            setTestingApId(ap.id);
            const res = await fetch(`/api/access-points/${ap.id}/test`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'No se pudo probar la integracion');
            }
            alert(`Integracion AP lista\nAuthorize: ${data.authorizeResult?.message || 'OK'}\nRevoke: ${data.revokeResult?.message || 'OK'}`);
        } catch (error: any) {
            alert(error.message || 'Error probando AP');
        } finally {
            setTestingApId(null);
        }
    };

    const generatePortalUrl = (ap: AccessPoint) =>
        `${BASE_URL}${ap.portalUrl}`;

    const generateWifiQr = (ap: AccessPoint) => {
        if (!ap.ssid) return '';
        const security = ap.wifiSecurity === 'nopass' ? 'nopass' : (ap.wifiSecurity || 'WPA');
        return `WIFI:T:${security};S:${ap.ssid};P:${ap.wifiPassword || ''};;`;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar title="Links / Access Points" subtitle="Gestión de puntos de acceso y portales cautivos por sucursal" />
                <main className="flex-1 overflow-y-auto p-8">

                    <div className="flex items-center justify-between mb-8">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 max-w-lg">
                            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-blue-800">Cómo funciona</p>
                                <p className="text-xs text-blue-600 mt-0.5">Configura un AP por sucursal. El router Cudy redirige al <code className="bg-blue-100 px-1 rounded">/portal?mac&ip&branchId</code>. El cliente llena el form y obtiene internet por el tiempo configurado.</p>
                            </div>
                        </div>
                        <button onClick={() => { setEditingAp(undefined); setShowModal(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-[#003478] hover:bg-[#002557] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all">
                            <Plus className="w-4 h-4" /> Nuevo Access Point
                        </button>
                    </div>

                    <div className="mb-8 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Creación rápida</p>
                            <h2 className="mt-2 text-2xl font-black text-slate-900">Portal simple con RADIUS</h2>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600">Para un AP nuevo solo necesitas: sucursal, nombre del AP, SSID, clave WiFi y secreto RADIUS. El modal ya precarga el perfil recomendado para Cudy y deja los campos avanzados ocultos.</p>
                            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-2">1. Crear AP</span>
                                <span className="rounded-full bg-slate-100 px-3 py-2">2. Configurar Cudy</span>
                                <span className="rounded-full bg-slate-100 px-3 py-2">3. Probar portal</span>
                                <span className="rounded-full bg-slate-100 px-3 py-2">4. Emitir QR WiFi</span>
                            </div>
                        </section>
                        <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Recomendado</p>
                            <h3 className="mt-2 text-lg font-black text-emerald-950">Perfil Cudy + RADIUS</h3>
                            <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                                <li>Portal externo en Cudy</li>
                                <li>NAS ID = identificador del AP</li>
                                <li>Secret compartido igual en AP y FreeRADIUS</li>
                                <li>Autorizar cliente por MAC/IP tras el formulario</li>
                            </ul>
                        </section>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[#003478] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : aps.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Wifi className="w-10 h-10 text-[#003478]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Sin Access Points configurados</h3>
                            <p className="text-gray-500 mb-6">Crea el primer AP para generar el link del portal cautivo</p>
                            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-[#003478] text-white rounded-2xl font-bold hover:bg-[#002557]">
                                <Plus className="w-4 h-4" /> Crear Access Point
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {aps.map(ap => {
                                const portalUrl = generatePortalUrl(ap);
                                const wifiQr = generateWifiQr(ap);
                                const branch = branches.find(b => b.id === ap.branchId);
                                const theme = themes.find(t => t.id === ap.themeId);
                                return (
                                    <div key={ap.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ap.isActive ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                                    <Wifi className={`w-5 h-5 ${ap.isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{ap.name}</h3>
                                                    <p className="text-xs text-gray-400">{branch?.name || 'Sin sucursal'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => window.open(`${BASE_URL}/portal?branchId=${ap.branchId}&ap=${ap.identifier}&mac=AA:BB:CC:DD:EE:FF&ip=192.168.1.20`, '_blank')}
                                                    className="p-2 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600"
                                                    title="Abrir portal">
                                                    <Globe className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleTestIntegration(ap)}
                                                    className="p-2 hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-600 disabled:opacity-50"
                                                    disabled={testingApId === ap.id}
                                                    title="Probar integracion">
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setRadiusConfigAp(ap)}
                                                    className="p-2 hover:bg-purple-50 rounded-xl text-gray-400 hover:text-purple-600"
                                                    title="Ver configuración RADIUS para router">
                                                    <ServerCog className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setEditingAp(ap); setShowModal(true); }}
                                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(ap.id)}
                                                    className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                                <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs font-black text-gray-800">{SESSION_LABELS[ap.timeLimit] || ap.timeLimit + 'min'}</p>
                                                <p className="text-[9px] text-gray-400">Sesión</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                                <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs font-black text-gray-800">{ap.activeSessions || 0}</p>
                                                <p className="text-[9px] text-gray-400">Activos</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                                <Globe className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                                <p className="text-xs font-black text-gray-800 truncate">{theme?.name || 'Default'}</p>
                                                <p className="text-[9px] text-gray-400">Tema</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">AP ID</p>
                                                <p className="mt-1 text-xs font-bold text-gray-700 truncate">{ap.identifier}</p>
                                            </div>
                                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Proveedor</p>
                                                <p className="mt-1 text-xs font-bold text-gray-700 truncate">{ap.providerType}</p>
                                            </div>
                                        </div>

                                        {/* Fields */}
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {(ap.fields || []).map(f => {
                                                const idx = FIELD_KEYS.indexOf(f);
                                                return idx >= 0 ? (
                                                    <span key={f} className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                                                        {FIELD_OPTIONS[idx]}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>

                                        {/* Portal URL */}
                                        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                                            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="text-xs text-gray-500 font-mono flex-1 truncate">{portalUrl}</span>
                                            <button onClick={() => copyLink(portalUrl, ap.id)}
                                                className={`p-1.5 rounded-lg transition-all ${copied === ap.id ? 'bg-emerald-100 text-emerald-600' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>
                                                {copied === ap.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>

                                        <div className="mt-4 grid grid-cols-[96px_1fr] gap-4 items-center rounded-2xl border border-gray-100 p-4">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(portalUrl)}`}
                                                alt={`QR ${ap.name}`}
                                                className="h-24 w-24 rounded-xl border border-gray-100 bg-white p-1"
                                            />
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">QR para router / sticker</p>
                                                <p className="mt-2 text-xs text-gray-500">Configura el AP con este link y comparte el QR en la sucursal si necesitas pruebas internas.</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {ap.ssid ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">SSID: {ap.ssid}</span> : null}
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">Timer {ap.timerVisible ? 'visible' : 'oculto'}</span>
                                                    {ap.externalUrl ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">Router endpoint</span> : null}
                                                </div>
                                            </div>
                                        </div>

                                        {wifiQr ? (
                                            <div className="mt-4 grid grid-cols-[96px_1fr] gap-4 items-center rounded-2xl border border-gray-100 p-4">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(wifiQr)}`}
                                                    alt={`WiFi QR ${ap.name}`}
                                                    className="h-24 w-24 rounded-xl border border-gray-100 bg-white p-1"
                                                />
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">QR para conectarse al WiFi</p>
                                                    <p className="mt-2 text-xs text-gray-500">Escaneo directo para SSID `{ap.ssid}` con seguridad `{ap.wifiSecurity || 'WPA'}`.</p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">SSID: {ap.ssid}</span>
                                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">Seguridad: {ap.wifiSecurity || 'WPA'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}

                                        {ap.outageBypassEnabled || ap.outageBypassNotes ? (
                                            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                                <p className="text-xs font-black uppercase tracking-widest text-amber-700">Contingencia por caida del servidor</p>
                                                <p className="mt-2 text-xs text-amber-700">{ap.outageBypassNotes || 'Configurar el AP con bypass local si el portal no responde.'}</p>
                                            </div>
                                        ) : null}

                                        {/* QR hint */}
                                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                                            Pega esta URL en la configuración de <strong>Redirección del router Cudy AC1200</strong> → Wireless → Portal Cautivo
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {showModal && (
                <AccessPointModal
                    ap={editingAp}
                    branches={branches}
                    themes={themes}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditingAp(undefined); }}
                />
            )}
            {(configReadyAp || radiusConfigAp) && (
                <RadiusConfigModal
                    ap={(configReadyAp || radiusConfigAp)!}
                    portalBase={BASE_URL}
                    onClose={() => { setConfigReadyAp(null); setRadiusConfigAp(null); }}
                />
            )}
        </div>
    );
}

export default function LinksPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
            <LinksContent />
        </Suspense>
    );
}
