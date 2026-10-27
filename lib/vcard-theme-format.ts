/** Builder and public pages share the same persisted vCard theme shape.
 * Existing array-based configs remain valid. New docs retain editor layers in
 * studioDoc, while public pages consume only the runtime `layout` array.
 */
export interface RuntimeBlock {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
}
export interface VCardThemeStudioDocument {
  name: string;
  canvas: { width: number; height: number; [key: string]: unknown };
  media: unknown[];
  elements: Array<{ id: string; kind: string; [key: string]: unknown }>;
  savedWidgets: unknown[];
}
export function themeRuntimeLayout(config: unknown): RuntimeBlock[] {
  if (Array.isArray(config)) return config as RuntimeBlock[];
  if (config && typeof config === 'object' && 'layout' in config) {
    const layout = (config as { layout?: unknown }).layout;
    return Array.isArray(layout) ? layout as RuntimeBlock[] : [];
  }
  return [];
}
export function themeStudioDocument(config: unknown): VCardThemeStudioDocument | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  const doc = (config as { studioDoc?: unknown }).studioDoc;
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
  const candidate = doc as Partial<VCardThemeStudioDocument>;
  if (!candidate.canvas || !Array.isArray(candidate.elements) || !Array.isArray(candidate.media)
      || !Array.isArray(candidate.savedWidgets)
      || typeof candidate.name !== 'string'
      || typeof candidate.canvas.width !== 'number'
      || typeof candidate.canvas.height !== 'number') return null;
  return candidate as VCardThemeStudioDocument;
}
export function persistVCardTheme(layout: unknown, studioDoc?: unknown): RuntimeBlock[] | { layout: RuntimeBlock[]; studioDoc: VCardThemeStudioDocument } {
  if (!Array.isArray(layout) || layout.some(b => !b || typeof b !== 'object' || typeof b.type !== 'string')) {
    throw new Error('Runtime layout inválido');
  }
  if (studioDoc === undefined) return layout as RuntimeBlock[]; // API legacy
  const doc = themeStudioDocument({ studioDoc });
  if (!doc) throw new Error('Studio document inválido');
  return { layout: layout as RuntimeBlock[], studioDoc: doc };
}
