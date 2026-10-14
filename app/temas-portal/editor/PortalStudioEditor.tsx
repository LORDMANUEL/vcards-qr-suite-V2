'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import {
  AlignCenter,
  AlignHorizontalDistributeStart,
  AlignLeft,
  AlignVerticalDistributeStart,
  Car,
  Check,
  Circle,
  Clock,
  Copy,
  Download,
  Eye,
  Facebook,
  FileText,
  Film,
  FormInput,
  Grid3X3,
  Headphones,
  History,
  Image as ImageIcon,
  Instagram,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  MousePointer2,
  Move,
  Plus,
  QrCode,
  Redo2,
  RotateCw,
  Ruler,
  Save,
  Smartphone,
  Square,
  Star,
  Trash2,
  Type,
  Unlock,
  Upload,
  Video,
  Zap,
} from 'lucide-react';

type SideKey = 'portrait' | 'landscape' | 'mobile';
type ElementKind = 'text' | 'image' | 'video' | 'embed' | 'button' | 'form' | 'shape' | 'qr' | 'carousel' | 'gallery' | 'faq' | 'testimonial' | 'pricing' | 'countdown' | 'social' | 'map' | 'progress' | 'icon' | 'divider' | 'spacer';

interface PortalTheme {
  id: string;
  name: string;
  category: string;
  config?: any;
  htmlTemplate?: string | null;
  cssCustom?: string | null;
}

interface UserOption {
  id: string;
  name: string;
  position?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  branch?: { name: string } | null;
  qrCodeData?: string | null;
}

interface MediaItem {
  id: string;
  name: string;
  kind: 'image' | 'video';
  src: string;
}

interface StudioElement {
  id: string;
  kind: ElementKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  allowOverlap: boolean;
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  src?: string;
  objectFit?: 'cover' | 'contain';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  qrValue?: string;
  embedUrl?: string;
  boxShadow?: string;
  gradient?: string;
  iconName?: string;
  subtext?: string;
  items?: Array<{ id: string; text: string; subtext?: string; image?: string; price?: string; }>;
  countdownDate?: string;
  mapUrl?: string;
  progressValue?: number;
  progressColor?: string;
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  spacerHeight?: number;
  animationType?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
}

interface StudioDocument {
  name: string;
  canvas: {
    width: number;
    height: number;
    background: string;
    gridSize: number;
    showGrid: boolean;
    snap: boolean;
    showRulers: boolean;
  };
  media: MediaItem[];
  portrait: StudioElement[];
  landscape: StudioElement[];
  mobile: StudioElement[];
}

const CANVAS_PRESETS = {
  portrait: { width: 768, height: 1024 },
  landscape: { width: 1024, height: 768 },
  mobile: { width: 375, height: 812 },
};

const DEFAULT_DOC: StudioDocument = {
  name: 'Portal Theme Studio',
  canvas: {
    width: 375,
    height: 812,
    background: 'linear-gradient(180deg,#003478,#001f4d)',
    gridSize: 12,
    showGrid: true,
    snap: true,
    showRulers: true,
  },
  media: [],
  portrait: [
    {
      id: 'hero-bg', kind: 'shape', name: 'Fondo Hero', x: 0, y: 0, width: 768, height: 300, rotation: 0, opacity: 1, zIndex: 1, locked: false, visible: true, allowOverlap: true,
      backgroundColor: '#003478', borderRadius: 0,
    },
    {
      id: 'hero-title', kind: 'text', name: 'Titulo Principal', x: 40, y: 80, width: 688, height: 60, rotation: 0, opacity: 1, zIndex: 5, locked: false, visible: true, allowOverlap: false,
      text: 'Portal Cliente', fontSize: 36, fontWeight: 800, fontFamily: 'Inter', color: '#ffffff', textAlign: 'center',
    },
    {
      id: 'cta-button', kind: 'button', name: 'Boton CTA', x: 234, y: 400, width: 300, height: 56, rotation: 0, opacity: 1, zIndex: 10, locked: false, visible: true, allowOverlap: false,
      text: 'Contactar Ahora', backgroundColor: '#10b981', borderRadius: 28,
    },
  ],
  landscape: [
    {
      id: 'hero-bg-l', kind: 'shape', name: 'Fondo Hero', x: 0, y: 0, width: 1024, height: 200, rotation: 0, opacity: 1, zIndex: 1, locked: false, visible: true, allowOverlap: true,
      backgroundColor: '#003478', borderRadius: 0,
    },
    {
      id: 'hero-title-l', kind: 'text', name: 'Titulo Principal', x: 40, y: 60, width: 944, height: 60, rotation: 0, opacity: 1, zIndex: 5, locked: false, visible: true, allowOverlap: false,
      text: 'Portal Cliente', fontSize: 36, fontWeight: 800, fontFamily: 'Inter', color: '#ffffff', textAlign: 'center',
    },
  ],
  mobile: [
    {
      id: 'hero-bg-m', kind: 'shape', name: 'Fondo Hero', x: 0, y: 0, width: 375, height: 200, rotation: 0, opacity: 1, zIndex: 1, locked: false, visible: true, allowOverlap: true,
      backgroundColor: '#003478', borderRadius: 0,
    },
    {
      id: 'hero-title-m', kind: 'text', name: 'Titulo Principal', x: 20, y: 60, width: 335, height: 50, rotation: 0, opacity: 1, zIndex: 5, locked: false, visible: true, allowOverlap: false,
      text: 'Portal', fontSize: 28, fontWeight: 800, fontFamily: 'Inter', color: '#ffffff', textAlign: 'center',
    },
  ],
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function toDataUrl(bytes: Uint8Array, mime: string) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function guessMime(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.ogg')) return 'video/ogg';
  if (lower.endsWith('.woff')) return 'font/woff';
  if (lower.endsWith('.woff2')) return 'font/woff2';
  if (lower.endsWith('.ttf')) return 'font/ttf';
  if (lower.endsWith('.css')) return 'text/css';
  if (lower.endsWith('.js')) return 'application/javascript';
  return 'application/octet-stream';
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
}

function replaceAssetPaths(source: string, resolver: (assetPath: string) => string | null) {
  const attrPattern = /(src|href)=("|')([^"']+)(\2)/gi;
  const urlPattern = /url\(("|')?([^"')]+)(\1)?\)/gi;

  const withAttrs = source.replace(attrPattern, (full, attr, quote, value, closeQuote) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || /^https?:|^data:|^mailto:|^tel:|^#/.test(trimmed)) return full;
    const resolved = resolver(trimmed);
    return resolved ? `${attr}=${quote}${resolved}${closeQuote}` : full;
  });

  return withAttrs.replace(urlPattern, (full, quote, value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || /^https?:|^data:|^#/.test(trimmed)) return full;
    const resolved = resolver(trimmed);
    if (!resolved) return full;
    return `url(${quote || ''}${resolved}${quote || ''})`;
  });
}

function snap(value: number, enabled: boolean, grid: number) {
  return enabled ? Math.round(value / grid) * grid : value;
}

function snapGuide(value: number, targets: number[], threshold: number) {
  for (const target of targets) {
    if (Math.abs(value - target) <= threshold) return target;
  }
  return value;
}

function createElement(kind: ElementKind, canvas: StudioDocument['canvas']): StudioElement {
  const base = {
    id: uid(kind),
    kind,
    name: kind,
    x: 60,
    y: 60,
    width: 180,
    height: 64,
    rotation: 0,
    opacity: 1,
    zIndex: 10,
    locked: false,
    visible: true,
    allowOverlap: false,
  };

  if (kind === 'text') return { ...base, name: 'Texto', text: 'Nuevo texto', fontSize: 24, fontWeight: 700, fontFamily: 'Arial', color: '#0f172a', textAlign: 'left' };
  if (kind === 'image') return { ...base, name: 'Imagen', width: 200, height: 140, src: '', objectFit: 'cover', borderRadius: 18 };
  if (kind === 'video') return { ...base, name: 'Video', width: 320, height: 180, src: '', objectFit: 'cover', autoplay: true, muted: true, loop: true, borderRadius: 18 };
  if (kind === 'embed') return { ...base, name: 'Embed', width: 320, height: 180, embedUrl: '', borderRadius: 18 };
  if (kind === 'button') return { ...base, name: 'Boton', text: 'Click Aqui', width: 200, height: 50, backgroundColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 25, textAlign: 'center' };
  if (kind === 'form') return { ...base, name: 'Formulario', width: 320, height: 200, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' };
  if (kind === 'qr') return { ...base, name: 'QR', width: 140, height: 140, qrValue: 'https://example.com', backgroundColor: '#ffffff', borderRadius: 18 };
  if (kind === 'carousel') return { ...base, name: 'Carrusel', width: 320, height: 200, items: [{ id: '1', text: 'Slide 1', image: '' }], borderRadius: 18 };
  if (kind === 'gallery') return { ...base, name: 'Galeria', width: 320, height: 240, items: [{ id: '1', text: 'Imagen 1', image: '' }, { id: '2', text: 'Imagen 2', image: '' }], borderRadius: 18 };
  if (kind === 'faq') return { ...base, name: 'FAQ', width: 320, height: 180, items: [{ id: '1', text: 'Pregunta frecuente', subtext: 'Respuesta aqui' }], borderRadius: 16 };
  if (kind === 'testimonial') return { ...base, name: 'Testimonio', width: 320, height: 140, text: '"Excelente servicio"', subtext: '- Cliente feliz', backgroundColor: '#f8fafc', borderRadius: 16 };
  if (kind === 'pricing') return { ...base, name: 'Precio', width: 280, height: 180, text: 'Plan Basic', subtext: '$99/mes', backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 2, borderColor: '#003478' };
  if (kind === 'countdown') return { ...base, name: 'Cuenta Regresiva', width: 300, height: 80, text: 'Oferta termina en', countdownDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), borderRadius: 16 };
  if (kind === 'social') return { ...base, name: 'Redes Sociales', width: 280, height: 50, items: [{ id: '1', text: 'facebook' }, { id: '2', text: 'instagram' }, { id: '3', text: 'whatsapp' }], borderRadius: 25 };
  if (kind === 'map') return { ...base, name: 'Mapa', width: 320, height: 200, mapUrl: 'https://www.google.com/maps/embed?pb=...', borderRadius: 18 };
  if (kind === 'progress') return { ...base, name: 'Barra Progreso', width: 300, height: 30, progressValue: 65, progressColor: '#10b981', borderRadius: 15 };
  if (kind === 'icon') return { ...base, name: 'Icono', width: 48, height: 48, iconName: 'star', color: '#003478', borderRadius: 24 };
  if (kind === 'divider') return { ...base, name: 'Divisor', width: 300, height: 2, color: '#e2e8f0', dividerStyle: 'solid' };
  if (kind === 'spacer') return { ...base, name: 'Espaciador', width: 320, spacerHeight: 40 };
  return { ...base, name: 'Forma', width: 240, height: 140, backgroundColor: '#003478', borderRadius: 24 };
}

function useEditorHistory(initialDoc: StudioDocument) {
  const [history, setHistory] = useState<StudioDocument[]>([initialDoc]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const [doc, setDocState] = useState(initialDoc);

  const setDoc = useCallback((newDoc: StudioDocument | ((prev: StudioDocument) => StudioDocument)) => {
    setDocState((prevDoc) => {
      const nextDoc = typeof newDoc === 'function' ? newDoc(prevDoc) : newDoc;
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyPointer + 1);
        return [...newHistory, nextDoc];
      });
      setHistoryPointer((prev) => prev + 1);
      return nextDoc;
    });
  }, [historyPointer]);

  const undo = useCallback(() => {
    if (historyPointer > 0) {
      setHistoryPointer((prev) => prev - 1);
      setDocState(history[historyPointer - 1]);
    }
  }, [history, historyPointer]);

  const redo = useCallback(() => {
    if (historyPointer < history.length - 1) {
      setHistoryPointer((prev) => prev + 1);
      setDocState(history[historyPointer + 1]);
    }
  }, [history, historyPointer]);

  return { doc, setDoc, undo, redo, canUndo: historyPointer > 0, canRedo: historyPointer < history.length - 1 };
}

function EditorContent({ initialThemeId }: { initialThemeId?: string }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { doc, setDoc, undo, redo, canUndo, canRedo } = useEditorHistory(DEFAULT_DOC);
  const [themes, setThemes] = useState<PortalTheme[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSide, setSelectedSide] = useState<SideKey>('portrait');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ id: string; mode: 'move' | 'resize'; startX: number; startY: number; originX: number; originY: number; originW: number; originH: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [zoom, setZoom] = useState(100);
  const [clipboard, setClipboard] = useState<StudioElement[]>([]);
  const [webModeEnabled, setWebModeEnabled] = useState(false);
  const [customHtmlTemplate, setCustomHtmlTemplate] = useState('');
  const [customCssTemplate, setCustomCssTemplate] = useState('');

  const copySelected = () => {
    const selected = currentElements.filter((element) => selectedIds.includes(element.id));
    setClipboard([...selected]);
  };

  const pasteClipboard = () => {
    if (clipboard.length === 0) return;
    const maxZ = Math.max(...currentElements.map(e => e.zIndex), 0);
    const newElements = clipboard.map((el, idx) => ({
      ...el,
      id: uid(el.kind),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: maxZ + idx + 1,
    }));
    setElementsForSide((elements) => [...elements, ...newElements]);
    setSelectedIds(newElements.map(el => el.id));
  };

  const currentElements = useMemo(() => doc[selectedSide].sort((a, b) => a.zIndex - b.zIndex), [doc, selectedSide]);

  useEffect(() => {
    Promise.all([
      fetch('/api/themes?category=PORTAL').then((r) => r.json()).catch(() => ({ themes: [] })),
      fetch('/api/users?kind=vcard').then((r) => r.json()).catch(() => ({ users: [] })),
    ]).then(([themeData, userData]) => {
      setThemes(themeData.themes || []);
      setUsers(userData.users || []);
    });
  }, []);

  useEffect(() => {
    if (!initialThemeId) return;
    fetch(`/api/themes/${initialThemeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const theme = data?.theme;
        if (!theme) return;
        setSelectedThemeId(theme.id);
        const hasCustomTemplate = Boolean(theme.htmlTemplate?.trim());
        setWebModeEnabled(hasCustomTemplate);
        setCustomHtmlTemplate(theme.htmlTemplate || '');
        setCustomCssTemplate(theme.cssCustom || '');
        if (theme.config?.studioDoc) {
          setDoc(theme.config.studioDoc);
        }
      })
      .catch(() => {
        // Fail silently and keep default document.
      });
  }, [initialThemeId, setDoc]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragState && !mouseStart) return;

      const scale = zoom / 100;
      const clientRect = canvasRef.current?.getBoundingClientRect();
      if (!clientRect) return;

      const mouseX = (event.clientX - clientRect.left) / scale;
      const mouseY = (event.clientY - clientRect.top) / scale;

      // Marquee Selection
      if (mouseStart && !dragState) {
        const x = Math.min(mouseStart.x, mouseX);
        const y = Math.min(mouseStart.y, mouseY);
        const width = Math.abs(mouseX - mouseStart.x);
        const height = Math.abs(mouseY - mouseStart.y);
        setMarqueeRect({ x, y, width, height });

        const newSelectedIds: string[] = [];
        currentElements.forEach(element => {
          if (
            element.x < x + width &&
            element.x + element.width > x &&
            element.y < y + height &&
            element.y + element.height > y
          ) {
            newSelectedIds.push(element.id);
          }
        });
        setSelectedIds(newSelectedIds);
        return;
      }

      if (!dragState) return;

      const dx = (event.clientX - dragState.startX) / scale;
      const dy = (event.clientY - dragState.startY) / scale;

      // Calculate guides for smart snapping
      const allElements = currentElements;
      const selected = selectedIds.includes(dragState.id) ? selectedIds : [dragState.id];

      // Get boundaries of selected elements to check against others
      const selectedEls = allElements.filter(e => selected.includes(e.id));
      const nonSelectedEls = allElements.filter(e => !selected.includes(e.id));

      let finalDx = dx;
      let finalDy = dy;

      if (dragState.mode === 'move') {
         // Simple snapping to grid
         finalDx = snap(dragState.originX + dx, doc.canvas.snap, doc.canvas.gridSize) - dragState.originX;
         finalDy = snap(dragState.originY + dy, doc.canvas.snap, doc.canvas.gridSize) - dragState.originY;
         
         // Smart snapping to other objects (simplified: check centers and edges)
         // This requires complex logic, defaulting to grid for now in this snippet
         // to ensure stability, but framework is here.
      }

      setDoc((prevDoc) => {
        return {
          ...prevDoc,
          [selectedSide]: prevDoc[selectedSide].map((element) => {
            if (!selected.includes(element.id)) return element;

            let newX = element.x;
            let newY = element.y;
            let newWidth = element.width;
            let newHeight = element.height;

            if (dragState.mode === 'move') {
              newX = dragState.originX + finalDx;
              newY = dragState.originY + finalDy;
            } else if (dragState.mode === 'resize') {
               if (element.id === dragState.id) {
                newWidth = Math.max(32, snap(dragState.originW + finalDx, prevDoc.canvas.snap, prevDoc.canvas.gridSize));
                newHeight = Math.max(32, snap(dragState.originH + finalDy, prevDoc.canvas.snap, prevDoc.canvas.gridSize));
               }
            }
            return { ...element, x: newX, y: newY, width: newWidth, height: newHeight };
          }),
        };
      });
    };

    const onUp = () => {
      setDragState(null);
      setMarqueeRect(null);
      setMouseStart(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragState, mouseStart, selectedIds, doc, setDoc, currentElements, selectedSide, zoom]);

  const setElementsForSide = (updater: (elements: StudioElement[]) => StudioElement[]) => {
    setDoc((prev) => ({ ...prev, [selectedSide]: updater(prev[selectedSide]) }));
  };

  const selectedElements = currentElements.filter((element) => selectedIds.includes(element.id));
  const activeElement = selectedElements.length === 1 ? selectedElements[0] : null;

  const addElement = (kind: ElementKind) => {
    const next = createElement(kind, doc.canvas);
    setElementsForSide((elements) => [...elements, { ...next, zIndex: elements.length + 2 }]);
    setSelectedIds([next.id]);
  };

  const updateElement = (id: string, patch: Partial<StudioElement>) => {
    setElementsForSide((elements) => elements.map((element) => element.id === id ? { ...element, ...patch } : element));
  };

  const updateSelected = (patch: Partial<StudioElement>) => {
    setElementsForSide((elements) => elements.map((element) => selectedIds.includes(element.id) ? { ...element, ...patch } : element));
  };

  const deleteSelected = () => {
    setElementsForSide((elements) => elements.filter((element) => !selectedIds.includes(element.id)));
    setSelectedIds([]);
  };

  const duplicateSelected = () => {
    setElementsForSide((elements) => {
      const clones = elements
        .filter((element) => selectedIds.includes(element.id))
        .map((element) => ({ ...element, id: uid(element.kind), x: element.x + doc.canvas.gridSize, y: element.y + doc.canvas.gridSize, zIndex: elements.length + 3 }));
      return [...elements, ...clones];
    });
    setDoc(doc => doc); // Push to history
  };

  const reorderLayer = (id: string, direction: -1 | 1) => {
    setElementsForSide((elements) => {
      const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = ordered.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return elements;
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      return ordered.map((element, idx) => ({ ...element, zIndex: idx + 1 }));
    });
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    setElementsForSide((elements) => {
      const maxZ = Math.max(...elements.map(e => e.zIndex)) + 1;
      return elements.map(element => selectedIds.includes(element.id) ? { ...element, zIndex: maxZ } : element);
    });
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    setElementsForSide((elements) => {
      const minZ = Math.min(...elements.map(e => e.zIndex)) - 1;
      return elements.map(element => selectedIds.includes(element.id) ? { ...element, zIndex: minZ } : element);
    });
  };

  const alignElements = (axis: 'x' | 'y', position: 'min' | 'center' | 'max' | 'space') => {
    if (selectedIds.length < 2) return;
    setElementsForSide((elements) => {
      const selected = elements.filter(e => selectedIds.includes(e.id));
      const nonSelected = elements.filter(e => !selectedIds.includes(e.id));

      if (position === 'space') {
        if (selected.length < 3) return elements;
        const sorted = [...selected].sort((a, b) => a[axis] - b[axis]);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last[axis] + (axis === 'x' ? last.width : last.height)) - (first[axis]) - sorted.slice(1, -1).reduce((sum, e) => sum + (axis === 'x' ? e.width : e.height), 0);
        const gap = totalSpace / (selected.length - 1);

        let currentPos = first[axis];
        return [...nonSelected, ...sorted.map((el, idx) => {
          const newEl = { ...el, [axis]: currentPos };
          currentPos += (axis === 'x' ? el.width : el.height) + gap;
          return newEl;
        })];
      } else {
        let targetValue = 0;
        const vals = selected.map(e => e[axis]);
        if (position === 'min') targetValue = Math.min(...vals);
        if (position === 'max') targetValue = Math.max(...vals);
        if (position === 'center') targetValue = (Math.min(...vals) + Math.max(...vals)) / 2;
        
        return [...nonSelected, ...selected.map(el => ({ ...el, [axis]: targetValue }))];
      }
    });
  };

  const addMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const nextItems = await Promise.all(files.map((file) => new Promise<MediaItem>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: uid('media'),
        name: file.name,
        kind: file.type.startsWith('video') ? 'video' : 'image',
        src: String(reader.result || ''),
      });
      reader.readAsDataURL(file);
    })));
    setDoc((prev) => ({ ...prev, media: [...prev.media, ...nextItems] }));
    event.target.value = '';
  };

  const applyTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    const theme = themes.find((item) => item.id === themeId);
    if (!theme?.config?.studioDoc) return;
    setWebModeEnabled(Boolean(theme.htmlTemplate?.trim()));
    setCustomHtmlTemplate(theme.htmlTemplate || '');
    setCustomCssTemplate(theme.cssCustom || '');
    setDoc(theme.config.studioDoc);
    setSelectedIds([]);
  };

  const importWebPack = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith('.html')) {
        const html = await file.text();
        setWebModeEnabled(true);
        setCustomHtmlTemplate(html);
        return;
      }

      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Solo se permite .zip o .html para modo Web Pack.');
        return;
      }

      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const fileNames = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
      const indexFileName = fileNames.find((name) => /(^|\/)index\.html$/i.test(name));
      if (!indexFileName) {
        alert('El ZIP debe incluir un index.html');
        return;
      }

      const rawHtml = await zip.file(indexFileName)!.async('string');
      const baseDir = normalizePath(indexFileName).split('/').slice(0, -1).join('/');

      const binaryMap = new Map<string, string>();
      await Promise.all(fileNames.map(async (name) => {
        const normalized = normalizePath(name);
        if (normalized === normalizePath(indexFileName)) return;
        const fileEntry = zip.file(name);
        if (!fileEntry) return;
        const bytes = await fileEntry.async('uint8array');
        binaryMap.set(normalized, toDataUrl(bytes, guessMime(normalized)));
      }));

      const resolveAsset = (assetPath: string) => {
        const normalized = normalizePath(assetPath);
        const withBase = normalizePath(`${baseDir}/${assetPath}`);
        return binaryMap.get(normalized) || binaryMap.get(withBase) || null;
      };

      const htmlWithAssets = replaceAssetPaths(rawHtml, resolveAsset);
      setWebModeEnabled(true);
      setCustomHtmlTemplate(htmlWithAssets);
      setCustomCssTemplate('');
    } catch (error) {
      console.error('Error importing ZIP web pack:', error);
      alert('No se pudo importar el ZIP del portal. Revisa estructura y vuelve a intentar.');
    } finally {
      event.target.value = '';
    }
  };

  const applyUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    setElementsForSide((elements) => elements.map((element) => {
      if (element.name === 'Nombre') return { ...element, text: user.name };
      if (element.name === 'Cargo') return { ...element, text: user.position || '' };
      if (element.name === 'QR principal') return { ...element, qrValue: user.qrCodeData || user.email };
      return element;
    }));
  };

  const saveStudio = async () => {
    const payload = {
      name: doc.name,
      category: 'PORTAL',
      type: 'CORPORATE',
      colors: JSON.stringify({ primary: '#003478', secondary: '#ffffff', accent: '#10b981' }),
      typography: 'Inter',
      htmlTemplate: webModeEnabled ? customHtmlTemplate : null,
      cssCustom: webModeEnabled ? customCssTemplate : null,
      config: {
        studioDoc: doc,
        renderMode: webModeEnabled ? 'WEB_TEMPLATE' : 'STUDIO',
      },
      isActive: true,
    };
    const res = await fetch(selectedThemeId ? `/api/themes/${selectedThemeId}` : '/api/themes', {
      method: selectedThemeId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedThemeId ? { ...payload, id: selectedThemeId } : payload),
    });
    const data = await res.json();
    if (data.theme?.id) {
      setSelectedThemeId(data.theme.id);
      const themeData = await fetch('/api/themes?category=PORTAL').then((r) => r.json());
      setThemes(themeData.themes || []);
    }
  };

  const canvasScale = zoom / 100;

  const layerList = useMemo(() => [...currentElements].sort((a, b) => b.zIndex - a.zIndex), [currentElements]);

  const exportPng = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: null, scale: 3, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${doc.name.replace(/\s+/g, '-')}-${selectedSide}.png`;
    link.click();
  };

  const exportPdf = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: null, scale: 3, useCORS: true });
    const image = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: doc.canvas.width > doc.canvas.height ? 'landscape' : 'portrait', unit: 'mm', format: [85.6, 54] });
    pdf.addImage(image, 'PNG', 0, 0, 85.6, 54);
    pdf.save(`${doc.name.replace(/\s+/g, '-')}-${selectedSide}.pdf`);
  };

  const exportDocx = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: null, scale: 3, useCORS: true });
    const image = canvas.toDataURL('image/png');
    const data = Uint8Array.from(atob(image.split(',')[1] || ''), (char) => char.charCodeAt(0));

    const docx = new Document({
      sections: [{ children: [new Paragraph({ children: [new ImageRun({ data, transformation: { width: 720, height: 420 } } as any)] })] }],
    });
    const blob = await Packer.toBlob(docx);
    saveAs(blob, `${doc.name.replace(/\s+/g, '-')}-${selectedSide}.docx`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f8fb]">
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900">Studio Portal Theme</h1>
          <p className="text-xs font-medium text-gray-500">Canvas absoluto, capas, snapping, embeds y media library</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={undo} disabled={!canUndo} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50" title="Deshacer (Ctrl+Z)"><History className="inline h-4 w-4 mr-1"/> Deshacer</button>
          <button onClick={redo} disabled={!canRedo} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50" title="Rehacer (Ctrl+Y)"><Redo2 className="inline h-4 w-4 mr-1"/> Rehacer</button>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <button onClick={exportPng} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200">PNG</button>
          <button onClick={exportPdf} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">PDF</button>
          <button onClick={exportDocx} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600">DOCX</button>
          <button onClick={saveStudio} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Guardar</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ASIDE (LEFT PANEL) - CONTROLES Y LAYERS */}
        <aside className="w-[360px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Documento</label>
              <input value={doc.name} onChange={(e) => setDoc((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[#003478]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Empleado</label>
                <select value={selectedUserId} onChange={(e) => applyUser(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="">Manual</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Plantilla</label>
                <select value={selectedThemeId} onChange={(e) => applyTheme(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="">Cargar</option>
                  {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black text-gray-900">Biblioteca de media</div>
                <label className="cursor-pointer rounded-xl bg-[#003478] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                  <Upload className="mr-1 inline h-3 w-3" /> Subir
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={addMedia} />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {doc.media.map((media) => (
                  <button key={media.id} onClick={() => {
                    const kind = media.kind === 'video' ? 'video' : 'image';
                    const created = createElement(kind, doc.canvas);
                    created.src = media.src;
                    created.name = media.name;
                    setElementsForSide((elements) => [...elements, { ...created, zIndex: elements.length + 2 }]);
                    setSelectedIds([created.id]);
                  }} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-[10px] font-bold text-gray-600">
                    {media.kind === 'image' ? <img src={media.src} alt={media.name} className="mb-1 h-14 w-full rounded-lg object-cover" /> : <video src={media.src} className="mb-1 h-14 w-full rounded-lg object-cover" />}
                    {media.name}
                  </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-sm font-black text-gray-900">Paletas de Colores</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Corporativo', colors: ['#003478', '#ffffff', '#10b981', '#f8fafc'] },
                    { name: 'Moderno', colors: ['#1e293b', '#3b82f6', '#06b6d4', '#f1f5f9'] },
                    { name: 'Calido', colors: ['#ea580c', '#fbbf24', '#fef3c7', '#fff7ed'] },
                    { name: 'Elegante', colors: ['#0f172a', '#334155', '#94a3b8', '#f8fafc'] },
                  ].map((palette) => (
                    <button key={palette.name} onClick={() => {
                      const newBg = `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})`;
                      setDoc((prev) => ({ ...prev, canvas: { ...prev.canvas, background: newBg } }));
                    }} className="rounded-xl border border-gray-200 bg-white p-2 hover:border-[#003478]">
                      <div className="flex gap-1 mb-1">
                        {palette.colors.map((c, i) => (
                          <div key={i} className="flex-1 h-4 rounded" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-gray-600">{palette.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-sm font-black text-gray-900">Secciones Pre-disenadas</div>
                <div className="space-y-2">
                  {[
                    { name: 'Hero Section', icon: '🏠' },
                    { name: 'Features Grid', icon: '🔲' },
                    { name: 'Testimonials', icon: '⭐' },
                    { name: 'Pricing Cards', icon: '💰' },
                  ].map((template) => (
                    <button key={template.name} className="w-full flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:border-[#003478] hover:text-[#003478]">
                      <span>{template.icon}</span> {template.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-sm font-black text-gray-900">Agregar elemento</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['text', Type, 'Texto'],
                  ['shape', Square, 'Forma'],
                  ['button', Circle, 'Boton'],
                  ['form', FormInput, 'Form'],
                  ['image', ImageIcon, 'Imagen'],
                  ['video', Film, 'Video'],
                  ['embed', Video, 'Embed'],
                  ['qr', QrCode, 'QR'],
                  ['carousel', Car, 'Carrusel'],
                  ['gallery', Grid3X3, 'Galeria'],
                  ['faq', FileText, 'FAQ'],
                  ['testimonial', Star, 'Testimonio'],
                  ['pricing', Zap, 'Precio'],
                  ['countdown', Clock, 'Cuenta'],
                  ['social', Facebook, 'Social'],
                  ['map', MapPin, 'Mapa'],
                  ['progress', Check, 'Progreso'],
                  ['icon', Star, 'Icono'],
                  ['divider', Minus, 'Divisor'],
                  ['spacer', Move, 'Espacio'],
                ] as const).map(([kind, Icon, label]) => (
                  <button key={kind} onClick={() => addElement(kind)} className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2 text-[10px] font-bold text-gray-700 hover:border-[#003478] hover:text-[#003478]">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black text-gray-900">Portal Web Pack (ZIP/HTML)</div>
                <label className="cursor-pointer rounded-xl bg-[#003478] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                  <Upload className="mr-1 inline h-3 w-3" /> Importar
                  <input type="file" accept=".zip,.html" className="hidden" onChange={importWebPack} />
                </label>
              </div>
              <label className="mb-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
                Modo Web (usa HTML/CSS publicado)
                <input type="checkbox" checked={webModeEnabled} onChange={(e) => setWebModeEnabled(e.target.checked)} />
              </label>
              <textarea
                value={customHtmlTemplate}
                onChange={(e) => setCustomHtmlTemplate(e.target.value)}
                placeholder="Pega aqui tu index.html o importa un ZIP con index.html"
                rows={6}
                className="mb-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#003478]"
              />
              <textarea
                value={customCssTemplate}
                onChange={(e) => setCustomCssTemplate(e.target.value)}
                placeholder="CSS extra opcional"
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#003478]"
              />
              <p className="mt-2 text-[11px] text-gray-500">Si activas este modo, el portal publico usa esta plantilla por encima del canvas Studio.</p>
            </div>

            {/* LAYERS PANEL */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-gray-900"><Layers className="h-4 w-4 text-[#003478]" /> Capas</div>
              <div className="space-y-2">
                {layerList.map((element) => (
                  <button key={element.id} onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      setSelectedIds((prev) => prev.includes(element.id) ? prev.filter((id) => id !== element.id) : [...prev, element.id]);
                    } else {
                      setSelectedIds([element.id]);
                    }
                  }} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold ${selectedIds.includes(element.id) ? 'border-[#003478] bg-blue-50 text-[#003478]' : 'border-gray-200 bg-white text-gray-700'}`}>
                    <span>{element.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={(evt) => { evt.stopPropagation(); updateElement(element.id, { locked: !element.locked }); }} className="text-gray-400">{element.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}</button>
                      <button onClick={(evt) => { evt.stopPropagation(); bringToFront(); }} className="text-gray-400" title="Traer al frente"><Move className="h-3.5 w-3.5 rotate-90" /></button>
                      <button onClick={(evt) => { evt.stopPropagation(); sendToBack(); }} className="text-gray-400" title="Enviar atrás"><Move className="h-3.5 w-3.5 -rotate-90" /></button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PROPIEDADES ATÓMICAS */}
            {activeElement ? (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900">Propiedades: {activeElement.name}</div>
                  <button onClick={deleteSelected} className="text-xs font-bold text-red-500"><Trash2 className="inline h-4 w-4" /> Quitar</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className="mb-2 block text-[10px] font-black">X</label><input type="number" value={Math.round(activeElement.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  <div><label className="mb-2 block text-[10px] font-black">Y</label><input type="number" value={Math.round(activeElement.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  <div><label className="mb-2 block text-[10px] font-black">Ancho</label><input type="number" value={Math.round(activeElement.width)} onChange={(e) => updateSelected({ width: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  <div><label className="mb-2 block text-[10px] font-black">Alto</label><input type="number" value={Math.round(activeElement.height)} onChange={(e) => updateSelected({ height: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  <div><label className="mb-2 block text-[10px] font-black">Rotacion</label><input type="number" value={activeElement.rotation} onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  <div><label className="mb-2 block text-[10px] font-black">Opacidad</label><input type="range" min={0} max={1} step={0.01} value={activeElement.opacity} onChange={(e) => updateSelected({ opacity: Number(e.target.value) })} className="w-full accent-[#003478]" /></div>
                </div>

                 {/* PROPIEDADES ESPECÍFICAS POR TIPO */}
                 {activeElement.kind === 'text' && (
                  <>
                    <textarea value={activeElement.text || ''} onChange={(e) => updateSelected({ text: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold outline-none" rows={3} />
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="mb-2 block text-[10px] font-black">Font Size</label><input type="number" value={activeElement.fontSize || 16} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                        <div><label className="mb-2 block text-[10px] font-black">Font Weight</label><input type="number" value={activeElement.fontWeight || 400} onChange={(e) => updateSelected({ fontWeight: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                        <div><label className="mb-2 block text-[10px] font-black">Color</label><input type="color" value={activeElement.color || '#000000'} onChange={(e) => updateSelected({ color: e.target.value })} className="w-full" /></div>
                         <div><label className="mb-2 block text-[10px] font-black">Alineación</label>
                         <select value={activeElement.textAlign || 'left'} onChange={(e) => updateSelected({ textAlign: e.target.value as any })} className="w-full text-sm rounded-xl">
                            <option value="left">Izquierda</option>
                            <option value="center">Centro</option>
                            <option value="right">Derecha</option>
                         </select>
                         </div>
                    </div>
                  </>
                )}
                {['image', 'video'].includes(activeElement.kind) && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">URL Media</label><textarea value={activeElement.src || ''} onChange={(e) => updateSelected({ src: e.target.value })} className="w-full text-sm rounded-xl" rows={3} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={activeElement.objectFit === 'contain'} onChange={(e) => updateSelected({ objectFit: e.target.checked ? 'contain' : 'cover' })} />Contain</label>
                    </div>
                  </>
                )}
                {activeElement.kind === 'qr' && (
                  <div><label className="mb-2 block text-[10px] font-black">QR Value</label><textarea value={activeElement.qrValue || ''} onChange={(e) => updateSelected({ qrValue: e.target.value })} className="w-full text-sm rounded-xl" rows={3} /></div>
                )}
                {activeElement.kind === 'shape' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#003478'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Radio Borde</label><input type="number" value={activeElement.borderRadius || 0} onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  </>
                )}
                {activeElement.kind === 'button' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Texto</label><input type="text" value={activeElement.text || ''} onChange={(e) => updateSelected({ text: e.target.value })} className="w-full text-sm rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#10b981'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                      <div><label className="mb-2 block text-[10px] font-black">Color Texto</label><input type="color" value={activeElement.color || '#ffffff'} onChange={(e) => updateSelected({ color: e.target.value })} className="w-full" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="mb-2 block text-[10px] font-black">Font Size</label><input type="number" value={activeElement.fontSize || 16} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                      <div><label className="mb-2 block text-[10px] font-black">Radio</label><input type="number" value={activeElement.borderRadius || 25} onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                    </div>
                  </>
                )}
                {activeElement.kind === 'form' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#f8fafc'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Borde Color</label><input type="color" value={activeElement.borderColor || '#e2e8f0'} onChange={(e) => updateSelected({ borderColor: e.target.value })} className="w-full" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="mb-2 block text-[10px] font-black">Ancho Borde</label><input type="number" value={activeElement.borderWidth || 1} onChange={(e) => updateSelected({ borderWidth: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                      <div><label className="mb-2 block text-[10px] font-black">Radio</label><input type="number" value={activeElement.borderRadius || 16} onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                    </div>
                  </>
                )}
                {activeElement.kind === 'carousel' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#f1f5f9'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Radio</label><input type="number" value={activeElement.borderRadius || 18} onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  </>
                )}
                {activeElement.kind === 'gallery' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#f1f5f9'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                  </>
                )}
                {activeElement.kind === 'testimonial' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Texto</label><textarea value={activeElement.text || ''} onChange={(e) => updateSelected({ text: e.target.value })} className="w-full text-sm rounded-xl" rows={2} /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Autor</label><input type="text" value={activeElement.subtext || ''} onChange={(e) => updateSelected({ subtext: e.target.value })} className="w-full text-sm rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#f8fafc'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                      <div><label className="mb-2 block text-[10px] font-black">Color Texto</label><input type="color" value={activeElement.color || '#1e293b'} onChange={(e) => updateSelected({ color: e.target.value })} className="w-full" /></div>
                    </div>
                  </>
                )}
                {activeElement.kind === 'pricing' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Titulo Plan</label><input type="text" value={activeElement.text || ''} onChange={(e) => updateSelected({ text: e.target.value })} className="w-full text-sm rounded-xl" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Precio</label><input type="text" value={activeElement.subtext || ''} onChange={(e) => updateSelected({ subtext: e.target.value })} className="w-full text-sm rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#ffffff'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                      <div><label className="mb-2 block text-[10px] font-black">Color Acento</label><input type="color" value={activeElement.borderColor || '#003478'} onChange={(e) => updateSelected({ borderColor: e.target.value })} className="w-full" /></div>
                    </div>
                  </>
                )}
                {activeElement.kind === 'countdown' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Mensaje</label><input type="text" value={activeElement.text || ''} onChange={(e) => updateSelected({ text: e.target.value })} className="w-full text-sm rounded-xl" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Fecha Fin</label><input type="datetime-local" value={activeElement.countdownDate?.slice(0, 16) || ''} onChange={(e) => updateSelected({ countdownDate: new Date(e.target.value).toISOString() })} className="w-full text-sm rounded-xl" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#fee2e2'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                  </>
                )}
                {activeElement.kind === 'social' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || '#f1f5f9'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Radio</label><input type="number" value={activeElement.borderRadius || 25} onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  </>
                )}
                {activeElement.kind === 'map' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">URL Mapa (Google Maps Embed)</label><input type="text" value={activeElement.mapUrl || ''} onChange={(e) => updateSelected({ mapUrl: e.target.value })} className="w-full text-sm rounded-xl" placeholder="https://www.google.com/maps/embed?..." /></div>
                  </>
                )}
                {activeElement.kind === 'progress' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Valor (%)</label><input type="number" min={0} max={100} value={activeElement.progressValue || 50} onChange={(e) => updateSelected({ progressValue: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Color Progreso</label><input type="color" value={activeElement.progressColor || '#10b981'} onChange={(e) => updateSelected({ progressColor: e.target.value })} className="w-full" /></div>
                  </>
                )}
                {activeElement.kind === 'icon' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Icono</label>
                      <select value={activeElement.iconName || 'star'} onChange={(e) => updateSelected({ iconName: e.target.value })} className="w-full text-sm rounded-xl">
                        <option value="star">★ Estrella</option>
                        <option value="heart">♥ Corazon</option>
                        <option value="check">✓ Check</option>
                        <option value="phone">☎ Telefono</option>
                        <option value="email">✉ Email</option>
                        <option value="location">📍 Ubicacion</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="mb-2 block text-[10px] font-black">Color</label><input type="color" value={activeElement.color || '#003478'} onChange={(e) => updateSelected({ color: e.target.value })} className="w-full" /></div>
                      <div><label className="mb-2 block text-[10px] font-black">Fondo</label><input type="color" value={activeElement.backgroundColor || 'transparent'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="w-full" /></div>
                    </div>
                  </>
                )}
                {activeElement.kind === 'divider' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Color</label><input type="color" value={activeElement.color || '#e2e8f0'} onChange={(e) => updateSelected({ color: e.target.value })} className="w-full" /></div>
                    <div><label className="mb-2 block text-[10px] font-black">Estilo</label>
                      <select value={activeElement.dividerStyle || 'solid'} onChange={(e) => updateSelected({ dividerStyle: e.target.value as any })} className="w-full text-sm rounded-xl">
                        <option value="solid">Solido</option>
                        <option value="dashed">Guiones</option>
                        <option value="dotted">Puntos</option>
                      </select>
                    </div>
                  </>
                )}
                {activeElement.kind === 'spacer' && (
                  <>
                    <div><label className="mb-2 block text-[10px] font-black">Altura (px)</label><input type="number" value={activeElement.spacerHeight || 40} onChange={(e) => updateSelected({ spacerHeight: Number(e.target.value) })} className="w-full text-sm rounded-xl" /></div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </aside>

        {/* MAIN CANVAS AREA */}
        <main className="flex min-h-0 flex-1 flex-col bg-[#eef2f6]">
          {/* TOOLBAR SUPERIOR DEL CANVAS */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedSide('portrait'); setDoc(prev => ({ ...prev, canvas: { ...prev.canvas, width: 768, height: 1024 } })); }} className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest ${selectedSide === 'portrait' ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}>Portrait</button>
              <button onClick={() => { setSelectedSide('landscape'); setDoc(prev => ({ ...prev, canvas: { ...prev.canvas, width: 1024, height: 768 } })); }} className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest ${selectedSide === 'landscape' ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}>Landscape</button>
              <button onClick={() => { setSelectedSide('mobile'); setDoc(prev => ({ ...prev, canvas: { ...prev.canvas, width: 375, height: 812 } })); }} className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest ${selectedSide === 'mobile' ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}>Mobile</button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDoc(prev => ({ ...prev, canvas: { ...prev.canvas, showGrid: !prev.canvas.showGrid } }))} className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest ${doc.canvas.showGrid ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}><Grid3X3 className="mx-auto mb-1 h-4 w-4" />Grid</button>
              <button onClick={() => setDoc(prev => ({ ...prev, canvas: { ...prev.canvas, snap: !prev.canvas.snap } }))} className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest ${doc.canvas.snap ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}><MousePointer2 className="mx-auto mb-1 h-4 w-4" />Snap</button>
              <button onClick={() => setDoc(prev => ({ ...prev, canvas: { ...prev.canvas, showRulers: !prev.canvas.showRulers } }))} className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest ${doc.canvas.showRulers ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}><Ruler className="mx-auto mb-1 h-4 w-4" />Rulers</button>

              <div className="ml-3 border-l border-gray-200 pl-3">
                <button onClick={() => alignElements('x', 'min')} className="p-2 rounded-lg hover:bg-gray-100" title="Alinear Izquierda"><AlignLeft className="h-4 w-4" /></button>
                <button onClick={() => alignElements('x', 'center')} className="p-2 rounded-lg hover:bg-gray-100" title="Alinear Centro"><AlignCenter className="h-4 w-4" /></button>
                <button onClick={() => alignElements('x', 'max')} className="p-2 rounded-lg hover:bg-gray-100" title="Alinear Derecha"><AlignLeft className="h-4 w-4 rotate-180" /></button>
                <button onClick={() => alignElements('x', 'space')} className="p-2 rounded-lg hover:bg-gray-100" title="Distribuir Horizontal"><AlignHorizontalDistributeStart className="h-4 w-4" /></button>
                <button onClick={() => alignElements('y', 'space')} className="p-2 rounded-lg hover:bg-gray-100" title="Distribuir Vertical"><AlignVerticalDistributeStart className="h-4 w-4" /></button>
              </div>

              <div className="ml-3 border-l border-gray-200 pl-3">
                <button onClick={copySelected} className="p-2 rounded-lg hover:bg-gray-100" title="Copiar"><Copy className="h-4 w-4" /></button>
                <button onClick={pasteClipboard} className="p-2 rounded-lg hover:bg-gray-100" title="Pegar" disabled={clipboard.length === 0}><Upload className="h-4 w-4" /></button>
              </div>

              <div className="ml-3 border-l border-gray-200 pl-3">
                {[75, 100, 125].map((value) => <button key={value} onClick={() => setZoom(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${zoom === value ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500'}`}>{value}%</button>)}
              </div>
            </div>
          </div>

          {/* CANVAS AREA */}
          <div className="flex-1 overflow-auto p-8 relative">
            {doc.canvas.showRulers && (
              <>
                <div className="absolute top-0 left-0 w-8 h-8 bg-gray-100 z-50" />
                <div className="absolute top-0 left-8 right-0 h-8 bg-gray-100 border-b border-gray-300 z-40" style={{ transform: `scaleX(${zoom/100})`, transformOrigin: 'left top' }}>
                  {Array.from({ length: Math.ceil(doc.canvas.width / 50) + 1 }).map((_, i) => (
                    <div key={i} className="absolute text-xs text-gray-500" style={{ left: i * 50, top: 4 }}>{i * 50}</div>
                  ))}
                </div>
                <div className="absolute top-8 left-0 bottom-0 w-8 bg-gray-100 border-r border-gray-300 z-40" style={{ transform: `scaleY(${zoom/100})`, transformOrigin: 'left top' }}>
                  {Array.from({ length: Math.ceil(doc.canvas.height / 50) + 1 }).map((_, i) => (
                    <div key={i} className="absolute text-xs text-gray-500" style={{ top: i * 50, left: 4 }}>{i * 50}</div>
                  ))}
                </div>
              </>
            )}

            <div className="mx-auto flex min-h-full items-center justify-center p-4" style={{ paddingLeft: doc.canvas.showRulers ? 32 : 16, paddingTop: doc.canvas.showRulers ? 32 : 16 }}>
              <div
                ref={canvasRef}
                className="relative overflow-hidden rounded-[28px] bg-white shadow-2xl"
                style={{
                  width: doc.canvas.width,
                  height: doc.canvas.height,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  background: doc.canvas.background,
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.2)'
                }}
                onMouseDown={(event) => {
                  if (event.button === 0) {
                    const clientRect = canvasRef.current?.getBoundingClientRect();
                    if (!clientRect) return;
                    setMouseStart({ x: (event.clientX - clientRect.left) / canvasScale, y: (event.clientY - clientRect.top) / canvasScale });
                    // Deseleccionar si se hace click en vacío y no es para marcar
                    if ((event.target as HTMLElement).classList.contains('canvas-area')) {
                       setSelectedIds([]);
                    }
                  }
                }}
              >
                {/* GRID */}
                {doc.canvas.showGrid && (
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, rgba(59,130,246,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.18) 1px, transparent 1px)`, backgroundSize: `${doc.canvas.gridSize}px ${doc.canvas.gridSize}px` }} />
                )}

                {/* MARQUEE SELECTION RECTANGLE */}
                {marqueeRect && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
                    style={{ left: marqueeRect.x, top: marqueeRect.y, width: marqueeRect.width, height: marqueeRect.height }}
                  />
                )}

                {/* ELEMENTS */}
                {currentElements.map((element) => {
                  const isSelected = selectedIds.includes(element.id);
                  return (
                    <div
                      key={element.id}
                      className={`absolute ${element.locked ? 'cursor-default' : 'cursor-move'} ${isSelected ? 'ring-2 ring-[#2563eb]' : ''}`}
                      style={{
                        left: element.x, top: element.y,
                        width: element.width, height: element.height,
                        transform: `rotate(${element.rotation}deg)`,
                        opacity: element.opacity,
                        zIndex: element.zIndex,
                        overflow: 'visible',
                      }}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        if (!element.locked) {
                          const clientRect = canvasRef.current?.getBoundingClientRect();
                          if (!clientRect) return;
                          const startX = event.clientX;
                          const startY = event.clientY;
                          // Modo move para el primero seleccionado, o para todos si ya estaban seleccionados
                          setDragState({ id: element.id, mode: 'move', startX, startY, originX: element.x, originY: element.y, originW: element.width, originH: element.height });
                        }
                        if (event.ctrlKey || event.metaKey) {
                          setSelectedIds((prev) => prev.includes(element.id) ? prev.filter((id) => id !== element.id) : [...prev, element.id]);
                        } else if (!isSelected) {
                          setSelectedIds([element.id]);
                        }
                      }}
                    >
                      {element.kind === 'text' && <div contentEditable suppressContentEditableWarning onBlur={(e) => updateElement(element.id, { text: e.currentTarget.textContent || '' })} className="h-full w-full outline-none" style={{ color: element.color, fontSize: element.fontSize, fontWeight: element.fontWeight, fontFamily: element.fontFamily, textAlign: element.textAlign, backgroundColor: element.backgroundColor || 'transparent' }}>{element.text}</div>}
                      {element.kind === 'shape' && <div className="h-full w-full" style={{ backgroundColor: element.backgroundColor || '#003478', borderRadius: element.borderRadius, border: `${element.borderWidth || 0}px solid ${element.borderColor || 'transparent'}` }} />}
                      {element.kind === 'button' && <div className="h-full w-full flex items-center justify-center transition-all hover:opacity-90" style={{ backgroundColor: element.backgroundColor || '#10b981', borderRadius: element.borderRadius || 25 }}><span style={{ color: element.color || '#ffffff', fontSize: element.fontSize || 16, fontWeight: element.fontWeight || 700 }}>{element.text || 'Boton'}</span></div>}
                      {element.kind === 'form' && <div className="h-full w-full p-4" style={{ backgroundColor: element.backgroundColor || '#f8fafc', borderRadius: element.borderRadius || 16, border: `${element.borderWidth || 1}px solid ${element.borderColor || '#e2e8f0'}` }}><div className="text-sm text-gray-400">Formulario</div></div>}
                      {element.kind === 'image' && <img src={element.src} alt={element.name} className="h-full w-full" style={{ objectFit: element.objectFit, borderRadius: element.borderRadius }} />}
                      {element.kind === 'video' && <video src={element.src} className="h-full w-full" style={{ objectFit: element.objectFit, borderRadius: element.borderRadius }} autoPlay={element.autoplay} muted={element.muted} loop={element.loop} controls />}
                      {element.kind === 'embed' && <iframe src={element.embedUrl} className="h-full w-full rounded-2xl border-0 bg-white" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
                      {element.kind === 'qr' && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(element.qrValue || '')}`} alt={element.name} className="h-full w-full rounded-xl border border-gray-200 bg-white p-2" />}
                      {element.kind === 'carousel' && (
                        <div className="h-full w-full flex items-center justify-center rounded-2xl bg-gray-100 overflow-hidden" style={{ backgroundColor: element.backgroundColor || '#f1f5f9', borderRadius: element.borderRadius }}>
                          <div className="text-center p-4">
                            <div className="text-2xl mb-2">🎠</div>
                            <div className="text-xs font-bold text-gray-500">Carrusel de Promociones</div>
                            <div className="text-xs text-gray-400">{(element.items || []).length} slides</div>
                          </div>
                        </div>
                      )}
                      {element.kind === 'gallery' && (
                        <div className="h-full w-full grid grid-cols-2 gap-1 p-2 rounded-2xl" style={{ backgroundColor: element.backgroundColor || '#f1f5f9', borderRadius: element.borderRadius }}>
                          {(element.items || []).slice(0, 4).map((item, idx) => (
                            <div key={item.id || idx} className="bg-gray-200 rounded-lg flex items-center justify-center aspect-square">
                              <span className="text-2xl">🖼️</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {element.kind === 'faq' && (
                        <div className="h-full w-full p-4 rounded-2xl overflow-auto" style={{ backgroundColor: element.backgroundColor || '#ffffff', borderRadius: element.borderRadius, border: `1px solid ${element.borderColor || '#e2e8f0'}` }}>
                          <div className="text-sm font-bold text-gray-800 mb-2">Preguntas Frecuentes</div>
                          {(element.items || []).slice(0, 3).map((item, idx) => (
                            <div key={item.id || idx} className="mb-2 p-2 bg-gray-50 rounded-lg">
                              <div className="text-xs font-bold text-gray-700">Q: {item.text}</div>
                              <div className="text-xs text-gray-500">A: {item.subtext}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {element.kind === 'testimonial' && (
                        <div className="h-full w-full p-4 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: element.backgroundColor || '#f8fafc', borderRadius: element.borderRadius }}>
                          <div className="text-lg font-serif italic text-center mb-2" style={{ color: element.color || '#1e293b' }}>"{element.text || 'Excelente servicio'}"</div>
                          <div className="text-sm font-bold text-center" style={{ color: element.color || '#64748b' }}>{element.subtext || '- Cliente'}</div>
                        </div>
                      )}
                      {element.kind === 'pricing' && (
                        <div className="h-full w-full p-4 rounded-2xl flex flex-col justify-center items-center" style={{ backgroundColor: element.backgroundColor || '#ffffff', borderRadius: element.borderRadius, border: `2px solid ${element.borderColor || '#003478'}` }}>
                          <div className="text-lg font-bold mb-1" style={{ color: element.color || '#1e293b' }}>{element.text || 'Plan Basic'}</div>
                          <div className="text-2xl font-black" style={{ color: element.borderColor || '#003478' }}>{element.subtext || '$99/mes'}</div>
                          <button className="mt-2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: element.borderColor || '#003478' }}>Comprar</button>
                        </div>
                      )}
                      {element.kind === 'countdown' && (
                        <div className="h-full w-full p-3 rounded-2xl flex flex-col items-center justify-center" style={{ backgroundColor: element.backgroundColor || '#fee2e2', borderRadius: element.borderRadius }}>
                          <div className="text-xs font-bold text-red-600 mb-1">{element.text || 'Oferta termina en'}</div>
                          <div className="text-xl font-black text-red-700">07d : 00h : 00m</div>
                        </div>
                      )}
                      {element.kind === 'social' && (
                        <div className="h-full w-full flex items-center justify-center gap-3 rounded-full" style={{ backgroundColor: element.backgroundColor || '#f1f5f9', borderRadius: element.borderRadius }}>
                          {['facebook', 'instagram', 'whatsapp', 'twitter'].slice(0, (element.items || []).length || 4).map((social, idx) => (
                            <div key={idx} className="w-8 h-8 rounded-full bg-[#003478] flex items-center justify-center text-white text-xs">
                              {social === 'facebook' && 'f'}
                              {social === 'instagram' && 'ig'}
                              {social === 'whatsapp' && 'w'}
                              {social === 'twitter' && 'x'}
                            </div>
                          ))}
                        </div>
                      )}
                      {element.kind === 'map' && (
                        <div className="h-full w-full rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden" style={{ borderRadius: element.borderRadius }}>
                          <div className="text-center">
                            <div className="text-2xl mb-1">📍</div>
                            <div className="text-xs font-bold text-gray-600">Mapa de Ubicacion</div>
                          </div>
                        </div>
                      )}
                      {element.kind === 'progress' && (
                        <div className="h-full w-full flex items-center px-2">
                          <div className="flex-1 h-full rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${element.progressValue || 50}%`, backgroundColor: element.progressColor || '#10b981' }} />
                          </div>
                          <span className="ml-2 text-xs font-bold text-gray-600">{element.progressValue || 50}%</span>
                        </div>
                      )}
                      {element.kind === 'icon' && (
                        <div className="h-full w-full flex items-center justify-center rounded-full" style={{ backgroundColor: element.backgroundColor || 'transparent', borderRadius: element.borderRadius }}>
                          <span className="text-2xl" style={{ color: element.color || '#003478' }}>★</span>
                        </div>
                      )}
                      {element.kind === 'divider' && (
                        <div className="h-full w-full flex items-center">
                          <hr className="w-full" style={{ borderTopStyle: element.dividerStyle || 'solid', borderColor: element.color || '#e2e8f0' }} />
                        </div>
                      )}
                      {element.kind === 'spacer' && (
                        <div className="h-full w-full flex items-center justify-center bg-gray-50/50" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 4 }}>
                          <span className="text-xs text-gray-400">Espacio: {element.spacerHeight || 40}px</span>
                        </div>
                      )}

                      {/* RESIZE HANDLE */}
                      {isSelected && !element.locked && (
                        <button
                          onMouseDown={(event) => {
                            event.stopPropagation();
                            const clientRect = canvasRef.current?.getBoundingClientRect();
                            if (!clientRect) return;
                            const startX = event.clientX;
                            const startY = event.clientY;
                            setDragState({ id: element.id, mode: 'resize', startX, startY, originX: element.x, originY: element.y, originW: element.width, originH: element.height });
                          }}
                          className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-[#2563eb] border-2 border-white z-50"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PortalStudioEditorPage({ initialThemeId }: { initialThemeId?: string }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando editor...</div>}>
      <EditorContent initialThemeId={initialThemeId} />
    </Suspense>
  );
}
