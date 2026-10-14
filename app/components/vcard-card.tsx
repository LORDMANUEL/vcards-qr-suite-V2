'use client';

import { Phone, Building2, MapPin, QrCode, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface VCardCardProps {
  vcard: {
    id: string;
    user: {
      name: string;
      position?: string | null;
      email: string;
      phone?: string | null;
      photoUrl?: string | null;
    };
    branch?: {
      name: string;
      address?: string | null;
    } | null;
    downloadCount: number;
    isActive: boolean;
  };
  onViewQR: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function VCardCard({ vcard, onViewQR, onEdit, onDelete }: VCardCardProps) {
  const initials = vcard?.user?.name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? '?';

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      {/* Header with Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-[#003478] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">{vcard?.user?.name}</h3>
          {vcard?.user?.position && (
            <p className="text-sm text-gray-600 truncate">{vcard.user.position}</p>
          )}
          <p className="text-sm text-gray-600 truncate mt-1">{vcard?.user?.email}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {vcard?.user?.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="truncate">{vcard.user.phone}</span>
          </div>
        )}
        {vcard?.branch?.name && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="truncate">{vcard.branch.name}</span>
          </div>
        )}
        {vcard?.branch?.address && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{vcard.branch.address}</span>
          </div>
        )}
      </div>

      {/* Stats and Status */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">{vcard?.downloadCount ?? 0} descargas</span>
        {vcard?.isActive && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            Activa
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/vcards/scans?vcardId=${vcard.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          <span>Escaneos</span>
        </Link>
        <button
          onClick={onViewQR}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Ver QR"
        >
          <QrCode className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
