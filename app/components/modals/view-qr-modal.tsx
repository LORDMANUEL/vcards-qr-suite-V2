'use client';

import { useState } from 'react';
import { X, Copy, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface ViewQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  vcard: {
    id: string;
    qrImageUrl?: string | null;
    qrCodeData: string;
    user: {
      name: string;
      position?: string | null;
      email: string;
    };
  } | null;
}

export function ViewQRModal({ isOpen, onClose, vcard }: ViewQRModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vcard) return null;

  const qrUrl = vcard?.qrImageUrl ?? '';
  const publicUrl = `${typeof window !== 'undefined' ? window?.location?.origin : ''}/vcard/${vcard?.qrCodeData}`;

  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const link = document?.createElement('a');
    if (link) {
      link.href = qrUrl;
      link.download = `qr-${vcard?.user?.name?.replace(/\s+/g, '-')}.png`;
      document?.body?.appendChild(link);
      link.click();
      document?.body?.removeChild(link);
    }
  };

  const handleOpenQR = () => {
    window?.open(publicUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#003478] rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Código QR - {vcard?.user?.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-64 h-64 bg-white border-4 border-[#003478] rounded-lg p-4 mb-4 relative">
            {qrUrl && (
              <Image
                src={qrUrl}
                alt={`QR Code for ${vcard?.user?.name}`}
                fill
                className="object-contain"
              />
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{vcard?.user?.name}</p>
            {vcard?.user?.position && <p className="text-sm text-gray-600">{vcard.user.position}</p>}
            <p className="text-sm text-gray-600">{vcard?.user?.email}</p>
          </div>
        </div>

        {/* QR URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link publico que abre el cliente:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 truncate"
            />
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copiar"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-sm text-green-600 mt-1">Link publico copiado.</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#003478] hover:bg-[#002557] text-white rounded-lg transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PNG</span>
          </button>
          <button
            onClick={handleOpenQR}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-[#003478] text-[#003478] hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver como cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
