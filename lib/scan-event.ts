export type ScanMethod = 'QR' | 'DIRECT' | 'MANUAL';
export type ValidScan = { ok: true; vcardId: string; scanMethod: ScanMethod };
export type InvalidScan = { ok: false; error: string };
export function validateScanEvent(payload: unknown): ValidScan | InvalidScan {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {ok:false,error:'JSON de escaneo inválido'};
  const p = payload as Record<string, unknown>;
  if (typeof p.vcardId !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(p.vcardId)) {
    return {ok:false,error:'vcardId inválido'};
  }
  const method = p.scanMethod === undefined ? 'QR' : p.scanMethod;
  if (typeof method !== 'string' || !['QR','DIRECT','MANUAL'].includes(method.toUpperCase().trim())) {
    return {ok:false,error:'Método de escaneo inválido'};
  }
  return {ok:true,vcardId:p.vcardId,scanMethod:method.toUpperCase().trim() as ScanMethod};
}
