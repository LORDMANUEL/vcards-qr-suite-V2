import { notFound } from 'next/navigation';
import ClientVCardPage from '../../vcard/[id]/client-page';

const brands = {
  ford: { company: 'Ford Yude', branch: 'Ford Yude Tegucigalpa', primary: '#003478', accent: '#5AA7FF', position: 'Asesora de ventas' },
  gac: { company: 'GAC Yude', branch: 'GAC Yude Tegucigalpa', primary: '#101827', accent: '#E53935', position: 'Asesor comercial' },
  quicklane: { company: 'Quick Lane', branch: 'Quick Lane Servicio Express', primary: '#101B31', accent: '#FF7515', position: 'Asesor de servicio' },
} as const;

export default function VisualFixturePage({ params }: { params: { brand: keyof typeof brands } }) {
  if (process.env.ENABLE_VCARD_VISUAL_FIXTURES !== 'true') notFound();
  const brand = brands[params.brand];
  if (!brand) notFound();

  const now = new Date().toISOString();
  const layout = [
    { id: 'profile', type: 'Profile', props: { avatarBg: brand.primary, nameColor: brand.primary, cardBgColor: '#ffffff', cardRadius: 22 } },
    { id: 'actions', type: 'ContactActions', props: { items: [
      { id: 'call', type: 'tel', label: 'Llamar', bgColor: brand.primary, textColor: '#ffffff' },
      { id: 'mail', type: 'email', label: 'Correo', bgColor: '#eef3f8', textColor: brand.primary },
      { id: 'wa', type: 'wa', label: 'WhatsApp', bgColor: '#16a34a', textColor: '#ffffff' },
      { id: 'save', type: 'download', label: 'Guardar', bgColor: '#eef3f8', textColor: brand.primary },
    ] } },
    { id: 'appointment', type: 'ButtonRow', props: { buttons: [
      { id: 'book', iconType: 'calendar', label: 'Agenda tu cita', actionType: 'download', bgColor: brand.accent, textColor: '#ffffff' },
      { id: 'vehicle', iconType: 'car', label: 'Conoce la marca', actionType: 'url', actionUrl: 'https://example.com', bgColor: brand.primary, textColor: '#ffffff' },
    ] } },
    { id: 'info', type: 'InfoList', props: {} },
    { id: 'footer', type: 'Footer', props: { text: `${brand.company} · Contacto digital`, bgColor: brand.primary, textColor: '#ffffff' } },
  ];

  return <ClientVCardPage disableTracking vCardId={`fixture-${params.brand}`} initialData={{
    vcard: {
      id: `fixture-${params.brand}`,
      user: { name: 'Andrea Martínez', position: brand.position, email: 'andrea@example.com', phone: '+504 9999-0000', website: 'https://example.com' },
      branch: { name: brand.branch, companyName: brand.company, address: 'Tegucigalpa, Honduras', primaryColor: brand.primary, secondaryColor: '#f4f7fb', vcardTheme: { id: `theme-${params.brand}`, isActive: true, colors: JSON.stringify({ primary: brand.primary, secondary: '#f4f7fb', accent: brand.accent }), config: { layout } } },
      downloadCount: 0,
      updatedAt: now,
    },
    activeGlobalTheme: null,
  }} />;
}
