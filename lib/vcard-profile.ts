export type VCardBrand = 'ford' | 'gac' | 'quicklane' | 'generic';
export type PositionGroup = 'MANAGEMENT' | 'SALES' | 'SERVICE' | 'PARTS' | 'OTHER';

const normalize = (value?: string | null) =>
  (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function detectVCardBrand(company?: string | null, branch?: string | null): VCardBrand {
  const value = normalize(`${company || ''} ${branch || ''}`);
  if (/\bgac\b/.test(value)) return 'gac';
  if (/quick\s*lane|quicklane/.test(value)) return 'quicklane';
  if (/\bford\b|\byude\b/.test(value)) return 'ford';
  return 'generic';
}

export function getPositionGroup(position?: string | null): PositionGroup {
  const value = normalize(position);
  if (/gerente|jefe|encargad|manager|director|coordinador/.test(value)) return 'MANAGEMENT';
  if (/venta|sales|comercial|asesor de vehiculo/.test(value)) return 'SALES';
  if (/servicio|service|taller|advisor|tecnico|mecanic|mantenimiento/.test(value)) return 'SERVICE';
  if (/repuesto|almacen|bodega|parts/.test(value)) return 'PARTS';
  return 'OTHER';
}

export function buildMailto(email: string, name: string, position?: string | null, intent: 'contact' | 'appointment' = 'contact') {
  const person = name || 'asesor';
  const group = getPositionGroup(position);
  let subject = 'Consulta de información';
  let request = 'Deseo solicitar información sobre sus servicios.';

  if (intent === 'appointment') {
    subject = 'Solicitud de cita';
    request = 'Me gustaría coordinar una cita.\n\nServicio de interés: \nFecha preferida: \nHorario preferido: ';
  } else if (group === 'SALES') {
    subject = 'Consulta comercial y cotización';
    request = 'Me gustaría conocer los vehículos disponibles, precios y opciones comerciales.';
  } else if (group === 'SERVICE') {
    subject = 'Solicitud de servicio automotriz';
    request = 'Deseo consultar sobre mantenimiento o diagnóstico de mi vehículo.\n\nModelo: \nAño: \nServicio requerido: ';
  } else if (group === 'PARTS') {
    subject = 'Cotización de repuestos';
    request = 'Solicito disponibilidad y cotización de repuestos.\n\nVehículo: \nRepuesto: \nCantidad: ';
  } else if (group === 'MANAGEMENT') {
    subject = 'Solicitud de comunicación institucional';
    request = 'Deseo comunicarme para consultar el siguiente asunto: ';
  }

  const body = `Buen día, ${person}:\n\n${request}\n\nQuedo pendiente de su respuesta.\n\nSaludos cordiales.`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value, 'https://vcards.invalid');
    return ['https:', 'http:', 'tel:', 'mailto:', 'sms:'].includes(url.protocol);
  } catch {
    return false;
  }
}
