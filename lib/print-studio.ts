export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 54;
export const MIN_QR_WIDTH_MM = 20;

/** CR80 dimensions, independent of editor pixel zoom. */
export function qrWidthMm(qrWidthPx: number, canvasWidthPx: number): number {
  return canvasWidthPx > 0 ? (qrWidthPx * CARD_WIDTH_MM) / canvasWidthPx : 0;
}

/** The signed QR image is generated on the server and stored with the vCard. */
export function isStoredQrImage(value: unknown): value is string {
  return typeof value === 'string'
    && /^data:image\/png;base64,[a-zA-Z0-9+/]+={0,2}$/.test(value);
}
