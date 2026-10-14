'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { Plus, Megaphone, Image as ImageIcon, Link as LinkIcon, Trash2, Edit, CheckCircle, XCircle, Search } from 'lucide-react';

interface Promotion {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    targetUrl: string | null;
    isActive: boolean;
    clicks: number;
}

interface Banner {
    id: string;
    name: string;
    imageUrl: string;
    targetUrl: string | null;
    isActive: boolean;
    clicks: number;
}

export default function MarketingPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'promos' | 'banners'>('promos');

    useEffect(() => {
        loadMarketingData();
    }, []);

    const loadMarketingData = async () => {
        try {
            const [promosRes, bannersRes] = await Promise.all([
                fetch('/api/promotions'),
                fetch('/api/banners')
            ]);

            if (promosRes.ok) {
                const data = await promosRes.json();
                setPromotions(data.promotions || []);
            }
            if (bannersRes.ok) {
                const data = await bannersRes.json();
                setBanners(data.banners || []);
            }
        } catch (error) {
            console.error('Error loading marketing data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#003478]"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar title="Marketing y Promociones" subtitle="Gestiona los banners y anuncios del portal cautivo" />
                <main className="flex-1 overflow-y-auto p-6">

                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                            <button
                                onClick={() => setActiveTab('promos')}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'promos' ? 'bg-[#003478] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                PROMOCIONES
                            </button>
                            <button
                                onClick={() => setActiveTab('banners')}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'banners' ? 'bg-[#003478] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                BANNERS PRINCIPALES
                            </button>
                        </div>

                        <button className="flex items-center gap-2 px-6 py-3 bg-[#003478] text-white rounded-2xl font-bold hover:bg-[#002557] transition-all shadow-lg">
                            <Plus className="w-5 h-5" /> NUEVO {activeTab === 'promos' ? 'ANUNCIO' : 'BANNER'}
                        </button>
                    </div>

                    {activeTab === 'promos' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promotions.length === 0 ? (
                                <div className="col-span-full bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                                    <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl font-medium">No hay promociones activas</p>
                                </div>
                            ) : (
                                promotions.map((promo) => (
                                    <div key={promo.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                                            <img src={promo.imageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80'} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-4 right-4 capitalize">
                                                {promo.isActive ? (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                                                        <CheckCircle className="w-3 h-3" /> ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                                                        <XCircle className="w-3 h-3" /> INACTIVO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">{promo.title}</h4>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{promo.description}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                                <div className="text-xs font-black text-[#003478] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">
                                                    {promo.clicks} CLICKS
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-[#003478] hover:bg-blue-50 rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {banners.length === 0 ? (
                                <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl font-medium">No hay banners configurados</p>
                                </div>
                            ) : (
                                banners.map((banner) => (
                                    <div key={banner.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-lg transition-all">
                                        <div className="w-48 h-24 bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
                                            <img src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{banner.name}</h4>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {banner.targetUrl || 'Sin link'}</span>
                                                <span className="flex items-center gap-1 font-bold text-[#003478]"><Megaphone className="w-3 h-3" /> {banner.clicks} Clicks</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pr-4">
                                            <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {banner.isActive ? 'VISIBLE' : 'OCULTO'}
                                            </div>
                                            <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#003478] transition-all"><Edit className="w-5 h-5" /></button>
                                            <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-600 transition-all"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
