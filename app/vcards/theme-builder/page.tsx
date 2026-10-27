'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { themeRuntimeLayout, themeStudioDocument } from '@/lib/vcard-theme-format';
import { saveAs } from 'file-saver';
import {
  AlignCenter,
  AlignHorizontalDistributeStart,
  AlignLeft,
  AlignVerticalDistributeStart,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  Eye,
  FileText,
  Film,
  FormInput,
  Grid3X3,
  History,
  Image as ImageIcon,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Monitor,
  MousePointer2,
  Move,
  Plus,
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
  Clock,
  Check,
  MapPin,
  Facebook,
  Car,
  Minus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Palette,
  Box,
  User,
  Group,
  Ungroup,
  Code,
  Layout,
  Heart,
  ShoppingCart,
  Phone,
  Mail,
  Globe,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Share2,
  Link,
  ImagePlus,
  Rows3,
  Columns3,
  Heading1,
  Heading2,
  Timer,
  Award,
  CreditCard,
  Grid,
  Columns,
  FileCode,
  ArrowUpDown,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo,
  Redo,
  X,
  Search,
  Filter,
  Settings2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignJustify,
  AlignEndHorizontal,
  AlignStartHorizontal,
  MoreHorizontal,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { renderVCardLayout } from '../../components/vcard-theme-runtime';

type SideKey = 'mobile' | 'desktop';
type ElementKind = 'text' | 'image' | 'video' | 'embed' | 'button' | 'shape' | 'icon' | 'social' | 'map' | 'divider' | 'spacer' | 'header' | 'profile' | 'contact-actions' | 'contact-info' | 'action-button' | 'stats-bar' | 'footer' | 'promo-strip' | 'testimonial' | 'pricing' | 'countdown' | 'faq' | 'gallery' | 'carousel' | 'group' | 'html-embed' | 'contact-social' | 'icon-button';

type ButtonShape = 'square' | 'rounded' | 'pill' | 'circle' | 'leaf';

interface MediaItem {
  id: string;
  name: string;
  kind: 'image' | 'video';
  src: string;
}

interface ContactAction {
  id: string;
  type: 'tel' | 'wa' | 'sms' | 'email' | 'link' | 'instagram' | 'facebook' | 'telegram' | 'youtube' | 'twitter' | 'linkedin' | 'tiktok' | 'custom';
  label: string;
  icon: string;
  value?: string;
  bgColor: string;
  textColor: string;
}

interface GroupedWidget {
  id: string;
  name: string;
  elements: StudioElement[];
  thumbnail?: string;
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
  groupId?: string;
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  src?: string;
  objectFit?: 'cover' | 'contain';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  embedUrl?: string;
  htmlContent?: string;
  boxShadow?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  iconName?: string;
  subtext?: string;
  items?: Array<{ id: string; text: string; subtext?: string; image?: string; price?: string; }>;
  countdownDate?: string;
  progressValue?: number;
  progressColor?: string;
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  spacerHeight?: number;
  animationType?: 'none' | 'fade' | 'fadeInUp' | 'fadeInDown' | 'scaleIn' | 'slide' | 'bounce' | 'pulse' | 'shake' | 'wiggle';
  animationDuration?: number;
  animationDelay?: number;
  gradient?: string;
  gradientType?: 'linear' | 'radial';
  gradientDirection?: number;
  depth?: number;
  blur?: number;
  buttonShape?: ButtonShape;
  contactActions?: ContactAction[];
  customIcons?: string[];
  // Button action fields
  actionType?: 'download' | 'call' | 'whatsapp' | 'email' | 'url' | 'share';
  actionUrl?: string;
  actionPhone?: string;
  actionWhatsapp?: string;
  actionMessage?: string;
  actionEmail?: string;
}

interface StudioDocument {
  id?: string;
  name: string;
  canvas: {
    width: number;
    height: number;
    background: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    gridSize: number;
    showGrid: boolean;
    snap: boolean;
    showRulers: boolean;
  };
  media: MediaItem[];
  elements: StudioElement[];
  savedWidgets: GroupedWidget[];
}

interface UserData {
  name: string;
  lastname: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
}

const MOCK_USER_DATA: UserData = {
  name: 'Ford Yude',
  lastname: 'Canahuati',
  title: 'Director de Operaciones',
  company: 'Ford Yude Canahuati',
  email: 'ford@fordyudecanahuati.com',
  phone: '+504 9876-5432',
  whatsapp: '+504 9876-5432',
  website: 'www.fordyudecanahuati.com',
  address: 'Tegucigalpa, Honduras',
  avatar: '',
  coverImage: '',
  bio: 'Especialistas en servicio automotriz de calidad premium',
  socialLinks: {
    facebook: 'https://facebook.com/fordyude',
    instagram: 'https://instagram.com/fordyude',
    twitter: 'https://twitter.com/fordyude',
    youtube: 'https://youtube.com/fordyude',
  }
};

const CANVAS_PRESETS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1050, height: 600 },
};

const SOCIAL_ICONS = [
  { id: 'facebook', icon: 'facebook', color: '#1877f2' },
  { id: 'instagram', icon: 'instagram', color: '#e4405f' },
  { id: 'whatsapp', icon: 'whatsapp', color: '#25d366' },
  { id: 'phone', icon: 'phone', color: '#10b981' },
  { id: 'email', icon: 'email', color: '#ea4335' },
  { id: 'website', icon: 'globe', color: '#3b82f6' },
  { id: 'youtube', icon: 'youtube', color: '#ff0000' },
  { id: 'twitter', icon: 'twitter', color: '#1da1f2' },
  { id: 'linkedin', icon: 'linkedin', color: '#0a66c2' },
  { id: 'tiktok', icon: 'tiktok', color: '#000000' },
  { id: 'telegram', icon: 'telegram', color: '#0088cc' },
  { id: 'location', icon: 'map-pin', color: '#ef4444' },
];

const FILL_PRESETS = [
  { name: 'Ford Blue', bg: 'linear-gradient(135deg, #003478 0%, #001f4d 100%)', color: '#ffffff' },
  { name: 'Quicklane Orange', bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#ffffff' },
  { name: 'Corporate', bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff' },
  { name: 'Forest', bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff' },
  { name: 'Sunset', bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff' },
  { name: 'Ocean', bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#ffffff' },
  { name: 'Rose', bg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: '#ffffff' },
  { name: 'Violet', bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#ffffff' },
  { name: 'Pure White', bg: '#ffffff', color: '#0f172a' },
  { name: 'Light Gray', bg: '#f8fafc', color: '#0f172a' },
  { name: 'Transparent', bg: 'transparent', color: '#0f172a' },
];

const BASE_THEMES = [
  {
    id: 'ford',
    name: 'Ford Principal',
    preview: 'bg-gradient-to-br from-[#003478] to-[#001f4d]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg, #003478 0%, #001f4d 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 120, backgroundColor: '#003478', text: 'FORD YUDE CANAHUATI', fontSize: 22, fontWeight: 800, color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 140, width: 335, height: 100, backgroundColor: '#ffffff', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', text: 'Ford Yude Canahuati', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5 },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 260, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'i1', kind: 'contact-info' as ElementKind, name: 'Info', x: 20, y: 360, width: 335, height: 100, backgroundColor: '#f8fafc', borderRadius: 16, zIndex: 15 },
        { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 480, width: 295, height: 56, backgroundColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 28, text: 'Contactar Ahora', zIndex: 20 },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: '#0f172a', color: '#ffffff', text: 'Ford Yude Canahuati', zIndex: 30 },
      ]
    }
  },
  {
    id: 'quicklane',
    name: 'Quicklane',
    preview: 'bg-gradient-to-br from-[#f97316] to-[#ea580c]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 100, backgroundColor: '#f97316', text: 'QUICKLANE', fontSize: 28, fontWeight: 900, color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 120, width: 335, height: 100, backgroundColor: '#ffffff', borderRadius: 20, text: 'Servicio Express', fontSize: 24, fontWeight: 700, color: '#0f172a', zIndex: 5 },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 240, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 340, width: 295, height: 56, backgroundColor: '#0f172a', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 12, text: 'Agenda Tu Cita', zIndex: 20 },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: '#0f172a', color: '#ffffff', text: 'Quicklane - Servicio Express', zIndex: 30 },
      ]
    }
  },
  {
    id: 'quicklane-flotas',
    name: 'Quicklane Flotas',
    preview: 'bg-gradient-to-br from-[#1e293b] to-[#0f172a]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 120, backgroundColor: '#1e293b', text: 'QUICKLANE FLOTAS', fontSize: 24, fontWeight: 800, color: '#f97316', textAlign: 'center', zIndex: 1 },
        { id: 'img1', kind: 'image' as ElementKind, name: 'Imagen', x: 20, y: 140, width: 335, height: 160, backgroundColor: '#334155', borderRadius: 16, src: '', zIndex: 5 },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 320, width: 335, height: 80, backgroundColor: '#ffffff', borderRadius: 16, text: 'Gestión de Flotas', fontSize: 22, fontWeight: 700, color: '#0f172a', zIndex: 10 },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 420, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 15, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 520, width: 295, height: 56, backgroundColor: '#f97316', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 12, text: 'Cotizar Flota', zIndex: 20 },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: '#0f172a', color: '#94a3b8', text: 'Quicklane Flotas - Ford', zIndex: 30 },
      ]
    }
  },
  {
    id: 'ventas-ford',
    name: 'Ventas Ford',
    preview: 'bg-gradient-to-br from-[#003478] to-[#0066cc]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg, #003478 0%, #0066cc 50%, #0099ff 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 80, backgroundColor: 'transparent', text: 'FORD VENTAS', fontSize: 26, fontWeight: 900, color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 100, width: 335, height: 100, backgroundColor: '#ffffff', borderRadius: 24, text: 'Nuevos Modelos 2024', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5 },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 220, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 320, width: 295, height: 56, backgroundColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 28, text: 'Ver Inventario', zIndex: 20 },
        { id: 'b2', kind: 'button' as ElementKind, name: 'Boton2', x: 40, y: 390, width: 295, height: 56, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ffffff', color: '#ffffff', fontSize: 14, fontWeight: 600, borderRadius: 28, text: 'Test Drive', zIndex: 25 },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: '#0f172a', color: '#ffffff', text: 'Ford Ventas - Tu Concesionario', zIndex: 30 },
      ]
    }
  },
  {
    id: 'ventas-gac',
    name: 'Ventas GAC',
    preview: 'bg-gradient-to-br from-[#c2410c] to-[#9a3412]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg, #c2410c 0%, #9a3412 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 100, backgroundColor: '#c2410c', text: 'GAC MOTOR', fontSize: 28, fontWeight: 900, color: '#ffffff', textAlign: 'center', letterSpacing: 2, zIndex: 1 },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 120, width: 335, height: 100, backgroundColor: '#ffffff', borderRadius: 20, text: 'Vehículos GAC', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5 },
        { id: 'gal', kind: 'gallery' as ElementKind, name: 'Galeria', x: 20, y: 240, width: 335, height: 180, backgroundColor: '#ffffff', borderRadius: 16, zIndex: 10 },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 440, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 15, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 540, width: 295, height: 56, backgroundColor: '#ffffff', color: '#c2410c', fontSize: 16, fontWeight: 700, borderRadius: 12, text: 'Cotizar Ahora', zIndex: 20 },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: '#0f172a', color: '#ffffff', text: 'GAC Motor - Premium Experience', zIndex: 30 },
      ]
    }
  },
  {
    id: 'dia-padre',
    name: 'Día del Padre',
    preview: 'bg-gradient-to-br from-[#7c3aed] via-[#db2777] to-[#f43f5e]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg, #7c3aed 0%, #db2777 50%, #f43f5e 100%)' },
      elements: [
        { id: 'deco1', kind: 'shape' as ElementKind, name: 'Decoracion', x: -50, y: -50, width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, zIndex: 1 },
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 40, width: 375, height: 80, backgroundColor: 'transparent', text: '¡Feliz Día, Padre!', fontSize: 32, fontWeight: 900, color: '#ffffff', textAlign: 'center', zIndex: 5 },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 140, width: 335, height: 120, backgroundColor: '#ffffff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', text: 'Papa Favorito', fontSize: 28, fontWeight: 800, color: '#0f172a', zIndex: 10 },
        { id: 'quote', kind: 'testimonial' as ElementKind, name: 'Cita', x: 20, y: 280, width: 335, height: 80, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, text: '"Eres mi héros y mi ejemplo"', fontSize: 18, fontWeight: 500, color: '#7c3aed', zIndex: 15 },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 380, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 20, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 480, width: 295, height: 60, backgroundColor: '#ffffff', color: '#db2777', fontSize: 18, fontWeight: 800, borderRadius: 30, text: '¡Te Amo Papa!', zIndex: 25 },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: 'rgba(0,0,0,0.3)', color: '#ffffff', text: 'Con Amor - Día del Padre 2024', zIndex: 30 },
      ]
    }
  },
  {
    id: 'asesor-ventas',
    name: 'Asesor de Ventas',
    preview: 'bg-gradient-to-br from-[#003478] to-[#0066cc]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg,#003478 0%,#0066cc 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 130, backgroundColor: '#003478', text: 'FORD VENTAS', subtext: 'TU ASESOR DE CONFIANZA', fontSize: 22, fontWeight: 900, color: '#ffffff', textAlign: 'center', zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 150, width: 335, height: 120, backgroundColor: '#ffffff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 290, width: 345, height: 90, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Agendar Cita', x: 40, y: 400, width: 295, height: 56, backgroundColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 28, text: 'Agendar Cita', zIndex: 20, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'b2', kind: 'button' as ElementKind, name: 'Ver Inventario', x: 40, y: 470, width: 295, height: 52, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ffffff', color: '#ffffff', fontSize: 14, fontWeight: 600, borderRadius: 28, text: 'Ver Inventario', zIndex: 25, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 730, width: 375, height: 82, backgroundColor: '#001f4d', color: '#ffffff', text: 'Ford Ventas • Yude Canahuati', zIndex: 30, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
      ]
    }
  },
  {
    id: 'asesor-servicio',
    name: 'Asesor de Servicio',
    preview: 'bg-gradient-to-br from-[#059669] to-[#047857]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg,#059669 0%,#047857 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 130, backgroundColor: '#059669', text: 'FORD SERVICIO', subtext: 'ASESOR TÉCNICO', fontSize: 22, fontWeight: 900, color: '#ffffff', textAlign: 'center', zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 150, width: 335, height: 120, backgroundColor: '#ffffff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 290, width: 345, height: 90, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#059669', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Agendar Servicio', x: 40, y: 400, width: 295, height: 56, backgroundColor: '#059669', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 28, text: 'Agendar Servicio', zIndex: 20, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 730, width: 375, height: 82, backgroundColor: '#03543f', color: '#ffffff', text: 'Ford Servicio • Yude Canahuati', zIndex: 30, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
      ]
    }
  },
  {
    id: 'gerente',
    name: 'Gerente General',
    preview: 'bg-gradient-to-br from-[#1e293b] to-[#0f172a]',
    config: {
      canvas: { width: 375, height: 812, background: 'linear-gradient(180deg,#1e293b 0%,#0f172a 100%)' },
      elements: [
        { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 140, backgroundColor: '#1e293b', text: 'DIRECCIÓN GENERAL', subtext: 'YUDE CANAHUATI', fontSize: 22, fontWeight: 900, color: '#f8fafc', textAlign: 'center', zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
        { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 158, width: 335, height: 120, backgroundColor: '#ffffff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 298, width: 345, height: 90, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false, contactActions: [
          { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#003478', textColor: '#ffffff' },
          { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
          { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#1e293b', textColor: '#ffffff' },
        ]},
        { id: 'b1', kind: 'button' as ElementKind, name: 'Contacto Directo', x: 40, y: 408, width: 295, height: 56, backgroundColor: '#003478', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 12, text: 'Contacto Directo', zIndex: 20, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
        { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 730, width: 375, height: 82, backgroundColor: '#000000', color: '#94a3b8', text: 'Dirección General — Yude Canahuati', zIndex: 30, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
      ]
    }
  },
];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function snap(value: number, enabled: boolean, grid: number) {
  return enabled ? Math.round(value / grid) * grid : value;
}

function createElement(kind: ElementKind, canvas: StudioDocument['canvas'], existingElements: StudioElement[] = []): StudioElement {
  const baseZIndex = existingElements.length > 0 ? Math.max(...existingElements.map(e => e.zIndex)) + 1 : 1;
  const base = {
    id: uid(kind),
    kind,
    name: kind,
    x: 20,
    y: 60,
    width: 180,
    height: 64,
    rotation: 0,
    opacity: 1,
    zIndex: baseZIndex,
    locked: false,
    visible: true,
    allowOverlap: false,
  };

  if (kind === 'text') return { ...base, name: 'Texto', text: 'Nuevo texto', fontSize: 24, fontWeight: 700, fontFamily: 'Arial', color: '#0f172a', textAlign: 'left' };
  if (kind === 'image') return { ...base, name: 'Imagen', width: 200, height: 140, src: '', objectFit: 'cover', borderRadius: 18 };
  if (kind === 'video') return { ...base, name: 'Video', width: 320, height: 180, src: '', objectFit: 'cover', autoplay: true, muted: true, loop: true, borderRadius: 18 };
  if (kind === 'embed') return { ...base, name: 'Embed', width: 320, height: 180, embedUrl: '', borderRadius: 18 };
  if (kind === 'html-embed') return { ...base, name: 'HTML', width: 320, height: 180, htmlContent: '<!-- Inserta tu código HTML aquí -->', borderRadius: 18 };
  if (kind === 'button') return { ...base, name: 'Boton', text: 'Click Aqui', width: 200, height: 50, backgroundColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 25, textAlign: 'center', buttonShape: 'rounded' };
  if (kind === 'icon-button') return { ...base, name: 'Icono Accion', width: 56, height: 56, backgroundColor: '#003478', borderRadius: 28, buttonShape: 'circle' };
  if (kind === 'shape') return { ...base, name: 'Forma', width: 240, height: 140, backgroundColor: '#003478', borderRadius: 24 };
  if (kind === 'icon') return { ...base, name: 'Icono', width: 48, height: 48, iconName: 'star', color: '#003478', borderRadius: 24 };
  if (kind === 'social') return { ...base, name: 'Redes Sociales', width: 280, height: 50, items: [{ id: '1', text: 'facebook' }, { id: '2', text: 'instagram' }], borderRadius: 25 };
  if (kind === 'contact-social') return { ...base, name: 'Botones Sociales', width: 340, height: 70, backgroundColor: '#ffffff', borderRadius: 20, contactActions: [
    { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
    { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
    { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
  ]};
  if (kind === 'map') return { ...base, name: 'Mapa', width: 320, height: 200, borderRadius: 18 };
  if (kind === 'divider') return { ...base, name: 'Divisor', width: 300, height: 2, color: '#e2e8f0', dividerStyle: 'solid' };
  if (kind === 'spacer') return { ...base, name: 'Espaciador', width: 320, spacerHeight: 40 };
  
  if (kind === 'header') return { ...base, name: 'Header', width: 375, height: 120, backgroundColor: '#003478', text: 'Nombre Empresa', fontSize: 24, fontWeight: 800, color: '#ffffff', textAlign: 'center' };
  if (kind === 'profile') return { ...base, name: 'Perfil', width: 335, height: 100, backgroundColor: '#ffffff', text: 'Nombre Apellido', fontSize: 28, fontWeight: 800, color: '#0f172a', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };
  if (kind === 'contact-actions') return { ...base, name: 'Acciones', width: 355, height: 80, backgroundColor: '#ffffff', borderRadius: 20, contactActions: [
    { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
    { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
    { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
  ]};
  if (kind === 'contact-info') return { ...base, name: 'Info Contacto', width: 335, height: 120, backgroundColor: '#f8fafc', borderRadius: 16 };
  if (kind === 'action-button') return { ...base, name: 'Boton Accion', text: 'Descargar', width: 200, height: 50, backgroundColor: '#003478', color: '#ffffff', borderRadius: 12 };
  if (kind === 'stats-bar') return { ...base, name: 'Estadisticas', width: 335, height: 80, backgroundColor: '#ffffff', borderRadius: 16 };
  if (kind === 'footer') return { ...base, name: 'Footer', width: 375, height: 92, backgroundColor: '#0f172a', color: '#ffffff', text: 'Empresa', borderRadius: 0 };
  if (kind === 'promo-strip') return { ...base, name: 'Promociones', width: 335, height: 100, backgroundColor: '#ffffff', borderRadius: 16 };
  if (kind === 'testimonial') return { ...base, name: 'Testimonio', width: 320, height: 100, backgroundColor: '#f8fafc', text: '"Excelente servicio"', color: '#1e293b', borderRadius: 16 };
  if (kind === 'pricing') return { ...base, name: 'Precio', width: 280, height: 140, backgroundColor: '#ffffff', text: 'Plan Basic', subtext: '$99/mes', borderRadius: 16, borderWidth: 2, borderColor: '#003478' };
  if (kind === 'countdown') return { ...base, name: 'Cuenta Regresiva', width: 300, height: 60, backgroundColor: '#fee2e2', text: 'Oferta termina en', borderRadius: 16 };
  if (kind === 'faq') return { ...base, name: 'FAQ', width: 320, height: 150, backgroundColor: '#ffffff', borderRadius: 16 };
  if (kind === 'gallery') return { ...base, name: 'Galeria', width: 320, height: 200, backgroundColor: '#f1f5f9', borderRadius: 18 };
  if (kind === 'carousel') return { ...base, name: 'Carrusel', width: 320, height: 180, backgroundColor: '#f1f5f9', borderRadius: 18 };

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

function SocialIcon({ type, color, size = 20 }: { type: string; color: string; size?: number }) {
  const iconMap: Record<string, React.ReactNode> = {
    facebook: <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" fill={color}/>,
    instagram: <><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke={color} strokeWidth="2"/><circle cx="17.5" cy="5.5" r="1.5" fill={color}/></>,
    whatsapp: <><path d="M17.47,13.41c-.24-.12-1.42-.7-1.64-.78s-.38-.12-.54.12-.62.78-.76.94-.28.18-.52.06-1.02-.3-1.95-.94-1.02-1.62-1.02-1.62-.19-.38-.27-.68s.04-.48.06-.5.14-.1.32-.02,1.02.48,2.34,1.4.98,1.63,1.06,1.71.28.52" fill={color}/></>,
    phone: <><path d="M3.47,12.62l1.06,1.06a1.46,1.46,0,0,0,2.13,0l1.42-1.42a1.46,1.46,0,0,0,0-2.13L5.25,7.3A1.46,1.46,0,0,0,3.12,7.3L1.7,8.72A1.46,1.46,0,0,0,.54,10.85l1.27,1.27A14.11,14.11,0,0,0,3.47,12.62Z" fill={color}/></>,
    email: <><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke={color} strokeWidth="2"/><path d="M2,7l10,6,10-6" fill="none" stroke={color} strokeWidth="2"/></>,
    globe: <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2"/><ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke={color} strokeWidth="2"/><path d="M2,12H22" stroke={color} strokeWidth="2"/></>,
    youtube: <><rect x="2" y="4" width="20" height="16" rx="4" fill="none" stroke={color} strokeWidth="2"/><polygon points="10,9 15,12 10,15" fill={color}/></>,
    twitter: <><path d="M23,3a10.9,10.9,0,0,1-3.14,1.53,4.48,4.48,0,0,0-7.88,0V6A4.48,4.48,0,0,1,9,1a4.48,4.48,0,0,0,4.48,4.48A4.48,4.48,0,0,1,17.52,10,10.92,10.92,0,0,1,1,19.48a4.48,4.48,0,0,0,3.41,4.38,4.51,4.51,0,0,1-2,.07,4.48,4.48,0,0,0,4.18,3.1,8.94,8.94,0,0,1-5.5,1.9A9.27,9.27,0,0,1,1,21" fill={color}/></>,
    linkedin: <><rect x="2" y="2" width="20" height="16" rx="2" fill="none" stroke={color} strokeWidth="2"/><path d="M6,7V5a2,2,0,0,1,2-2h0a2,2,0,0,1,2,2v2M6,15v-4a2,2,0,0,1,2-2h0a2,2,0,0,1,2,2v4" fill="none" stroke={color} strokeWidth="2"/></>,
    tiktok: <><path d="M9,12a4,4,0,1,1,4,4V7h4V5a6,6,0,1,0-6,6,6,6,0,0,0,1,3.3V14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    telegram: <><path d="M21.54,3.69a.86.86,0,0,0-1-.25l-3.1,2.9,3.21,3.09,2.62-1.59a.86.86,0,0,0,.45-.83V4.16A.86.86,0,0,0,21.54,3.69Z" fill={color}/></>,
    'map-pin': <><path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,11,7,11s7-5.75,7-11A7,7,0,0,0,12,2Zm0,9.5A2.5,2.5,0,1,1,14.5,9,2.5,2.5,0,0,1,12,11.5Z" fill={color}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{iconMap[type] || iconMap.globe}</svg>;
}

function renderElementContent(el: StudioElement, userData: UserData) {
  const renderContactActions = () => {
    const actions = el.contactActions || [
      { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
      { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
      { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
    ];
    return (
      <div className="flex justify-around items-center h-full px-2">
        {actions.map((action) => (
          <div key={action.id} className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: action.bgColor }}
            >
              <SocialIcon type={action.icon} color={action.textColor} size={20} />
            </div>
            <span className="text-[10px] mt-1 text-gray-600">{action.label}</span>
          </div>
        ))}
      </div>
    );
  };

  switch (el.kind) {
    case 'header':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center px-4 py-3 gap-1" style={{ backgroundColor: el.backgroundColor || '#003478' }}>
          <span style={{ fontSize: el.fontSize || 22, fontWeight: el.fontWeight || 800, color: el.color || '#ffffff', textAlign: el.textAlign || 'center', lineHeight: 1.2 }}>{el.text || 'EMPRESA SA de CV'}</span>
          {el.subtext && <span style={{ fontSize: (el.fontSize || 22) * 0.5, color: el.color || '#ffffff', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{el.subtext}</span>}
        </div>
      );
    case 'profile': {
      const _initials = ((userData.name?.charAt(0) || 'A') + (userData.lastname?.charAt(0) || 'B')).toUpperCase();
      const _avatarBg = (!el.backgroundColor || el.backgroundColor === '#ffffff' || el.backgroundColor === 'white') ? '#003478' : (el.backgroundColor || '#003478');
      const _avatarPx = 52; // tamaño del círculo interior en el canvas preview
      const _ringOuter = 4;
      const _ringInner = 3;
      const _totalAv = _avatarPx + (_ringOuter + _ringInner) * 2;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ backgroundColor: el.backgroundColor || '#ffffff', borderRadius: el.borderRadius, boxShadow: el.boxShadow }}>
          {/* Dual-ring avatar preview */}
          <div style={{ width: _totalAv, height: _totalAv, borderRadius: '50%', backgroundColor: _avatarBg, padding: _ringOuter, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: _avatarPx + _ringInner * 2, height: _avatarPx + _ringInner * 2, borderRadius: '50%', backgroundColor: '#ffffff', padding: _ringInner, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userData.avatar
                ? <img src={userData.avatar} alt="Avatar" style={{ width: _avatarPx, height: _avatarPx, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: _avatarPx, height: _avatarPx, borderRadius: '50%', backgroundColor: _avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: Math.floor(_avatarPx * 0.33), fontWeight: 900 }}>{_initials}</div>
              }
            </div>
          </div>
          <span className="font-bold" style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color || '#111827' }}>{userData.name} {userData.lastname}</span>
          {userData.title && <span className="text-sm" style={{ color: el.color || '#6b7280', opacity: 0.8 }}>{userData.title}</span>}
          {userData.company && <span className="text-xs font-bold uppercase" style={{ color: el.color || '#003478', opacity: 0.7 }}>{userData.company}</span>}
        </div>
      );
    }
    case 'contact-actions':
    case 'contact-social':
      return renderContactActions();
    case 'contact-info':
      return (
        <div className="w-full h-full p-4" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius }}>
          {userData.phone && <div className="flex items-center gap-2 mb-1"><Phone size={14} /> <span className="text-sm">{userData.phone}</span></div>}
          {userData.email && <div className="flex items-center gap-2 mb-1"><Mail size={14} /> <span className="text-sm">{userData.email}</span></div>}
          {userData.website && <div className="flex items-center gap-2 mb-1"><Globe size={14} /> <span className="text-sm">{userData.website}</span></div>}
          {userData.address && <div className="flex items-center gap-2"><MapPin size={14} /> <span className="text-sm">{userData.address}</span></div>}
        </div>
      );
    case 'button':
    case 'action-button':
    case 'icon-button':
      const shapes: Record<ButtonShape, string> = {
        square: '4px',
        rounded: el.height ? `${Math.min(el.height * 0.3, 20)}px` : '12px',
        pill: `${el.height ? el.height / 2 : 25}px`,
        circle: '50%',
        leaf: `${el.height ? el.height * 0.4 : 20}px ${el.height ? el.height * 0.4 : 20}px 0 0`,
      };
      return (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          style={{
            backgroundColor: el.backgroundColor,
            borderRadius: el.buttonShape ? shapes[el.buttonShape] : (el.borderRadius || 12),
            border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none',
          }}
        >
          <span style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color }}>{el.text}</span>
        </div>
      );
    case 'text':
      return <span style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, fontFamily: el.fontFamily, color: el.color, textAlign: el.textAlign }}>{el.text}</span>;
    case 'image':
      return el.src ? (
        <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit, borderRadius: el.borderRadius }} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400" style={{ backgroundColor: el.backgroundColor || '#f1f5f9', borderRadius: el.borderRadius }}>
          <ImagePlus size={32} />
          <span className="text-xs mt-1">Subir imagen</span>
        </div>
      );
    case 'video':
      return el.src ? (
        <video src={el.src} className="w-full h-full" style={{ objectFit: el.objectFit, borderRadius: el.borderRadius }} autoPlay={el.autoplay} muted={el.muted} loop={el.loop} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400" style={{ backgroundColor: '#f1f5f9', borderRadius: el.borderRadius }}>
          <Video size={32} />
          <span className="text-xs mt-1">URL de video</span>
        </div>
      );
    case 'embed':
      return el.embedUrl ? (
        <iframe src={el.embedUrl} className="w-full h-full" style={{ borderRadius: el.borderRadius }} frameBorder="0" allowFullScreen />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400" style={{ backgroundColor: '#f1f5f9', borderRadius: el.borderRadius }}>
          <Code size={32} />
          <span className="text-xs mt-1">Embed URL</span>
        </div>
      );
    case 'html-embed':
      return (
        <div className="w-full h-full overflow-auto p-2" style={{ backgroundColor: el.backgroundColor || '#ffffff', borderRadius: el.borderRadius }}>
          {el.htmlContent ? (
            <div dangerouslySetInnerHTML={{ __html: el.htmlContent }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Code size={32} />
              <span className="text-xs mt-1">Código HTML</span>
            </div>
          )}
        </div>
      );
    case 'shape':
      return <div className="w-full h-full" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius }} />;
    case 'icon':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius }}>
          <Star size={el.width ? Math.min(el.width, el.height) * 0.5 : 24} style={{ color: el.color }} />
        </div>
      );
    case 'divider':
      return <hr style={{ borderStyle: el.dividerStyle, borderColor: el.color, borderWidth: `${el.height}px 0 0 0` }} />;
    case 'spacer':
      return <div style={{ height: el.spacerHeight }} />;
    case 'footer':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: el.backgroundColor || '#0f172a' }}>
          <span style={{ color: el.color || '#ffffff', fontSize: el.fontSize || 12, fontWeight: el.fontWeight || 500, textAlign: 'center' }}>{el.text || 'Footer'}</span>
          {el.subtext && <span style={{ color: el.color || '#ffffff', fontSize: (el.fontSize || 12) * 0.85, opacity: 0.7 }}>{el.subtext}</span>}
        </div>
      );
    case 'testimonial':
      return (
        <div className="w-full h-full p-4" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius }}>
          <p className="text-center italic" style={{ color: el.color, fontSize: el.fontSize }}>{el.text}</p>
        </div>
      );
    case 'pricing':
      return (
        <div className="w-full h-full p-4 flex flex-col items-center justify-center" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none' }}>
          <span className="font-bold text-lg" style={{ color: el.color }}>{el.text}</span>
          <span className="text-2xl font-bold" style={{ color: el.color }}>{el.subtext}</span>
        </div>
      );
    case 'countdown':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius }}>
          <Timer size={20} className="mr-2" />
          <span style={{ color: el.color, fontSize: el.fontSize }}>{el.text}</span>
        </div>
      );
    case 'gallery':
    case 'carousel':
      return (
        <div className="w-full h-full grid grid-cols-2 gap-1 p-1" style={{ backgroundColor: el.backgroundColor, borderRadius: el.borderRadius }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-200 rounded flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-400" />
            </div>
          ))}
        </div>
      );
    case 'map':
      return (
        <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: el.backgroundColor || '#ffffff', borderRadius: el.borderRadius }}>
          <div className="flex-1 bg-blue-50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2393c5fd\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            <MapPin size={32} className="text-[#003478] z-10" />
          </div>
          <div className="p-2 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-700 truncate block">{el.text || 'Ubicación'}</span>
          </div>
        </div>
      );
    default:
      return <div className="w-full h-full bg-gray-100" />;
  }
}

function convertElementsToRuntimeLayout(elements: StudioElement[]) {
  const ordered = [...elements]
    .filter((el) => el.visible !== false)
    .sort((a, b) => (a.y - b.y) || (a.zIndex - b.zIndex));

  return ordered.map((el) => {
    if (el.kind === 'contact-actions' || el.kind === 'contact-social') {
      return {
        type: 'ContactActions',
        id: el.id,
        props: {
          sectionBgColor: el.backgroundColor || '#ffffff',
          buttonRadius: el.borderRadius || 16,
          showBorder: true,
          itemBorderColor: '#e5e7eb',
          items: el.contactActions?.map((action, idx) => {
            let href: string | undefined;
            if (action.type === 'wa' && action.value)
              href = `https://wa.me/${action.value.replace(/\D/g, '')}`;
            else if (action.type === 'tel' && action.value)
              href = `tel:${action.value}`;
            else if (action.type === 'email' && action.value)
              href = `mailto:${action.value}`;
            else if ((action.type === 'link' || action.type === 'instagram' || action.type === 'facebook') && action.value)
              href = action.value;
            return {
              id: action.id || `action_${idx}`,
              type: action.type,
              label: action.label,
              bgColor: action.bgColor,
              textColor: action.textColor,
              ...(href ? { href } : {}),
            };
          }) || [],
        },
      };
    }

    if (el.kind === 'profile') {
      return {
        type: 'Profile',
        id: el.id,
        props: {
          align: el.textAlign || 'center',
          avatarSize: Math.max(48, Math.min(72, Math.round(el.height * 0.45))),
          avatarBg: (!el.backgroundColor || el.backgroundColor === '#ffffff') ? '#003478' : (el.backgroundColor || '#003478'),
          cardBgColor: el.backgroundColor || '#ffffff',
          cardRadius: el.borderRadius || 20,
          nameColor: el.color || '#0f172a',
          nameSize: el.fontSize || 24,
          showCompany: true,
          usePhoto: true,
          avatarUrl: (el as any).src || undefined,
          _height: el.height,
          _width: el.width,
        },
      };
    }

    if (el.kind === 'header') {
      return {
        type: 'Header',
        id: el.id,
        props: {
          bgColor: el.backgroundColor || '#003478',
          textColor: el.color || '#ffffff',
          title: el.text || 'Company Name',
          subtitle: el.subtext || 'vCard corporativa',
          backgroundImageUrl: (el as any).backgroundImage || undefined,
          _height: el.height,
          _width: el.width,
        },
      };
    }

    if (el.kind === 'button' || el.kind === 'action-button' || el.kind === 'icon-button') {
      if (el.actionType && el.actionType !== 'download') {
        return {
          type: 'ProgrammableButton',
          id: el.id,
          props: {
            label: el.text || 'Botón',
            bgColor: el.backgroundColor || '#003478',
            textColor: el.color || '#ffffff',
            borderRadius: el.borderRadius || 28,
            actionType: el.actionType === 'call' ? 'tel' : el.actionType,
            actionUrl: el.actionUrl,
            phoneNumber: el.actionPhone,
            whatsappNumber: el.actionWhatsapp,
            whatsappMessage: el.actionMessage,
            emailAddress: el.actionEmail,
            shadowEnabled: true,
          },
        };
      }
      return {
        type: 'ActionButton',
        id: el.id,
        props: {
          label: el.text || 'Guardar en Contactos (vCard)',
          bgColor: el.backgroundColor || '#10b981',
          textColor: el.color || '#ffffff',
          borderRadius: el.borderRadius || 28,
        },
      };
    }

    if (el.kind === 'contact-info') {
      return {
        type: 'ContactInfo',
        id: el.id,
        props: {
          bgColor: el.backgroundColor || '#f8fafc',
          iconBg: '#003478',
          iconColor: '#ffffff',
          items: [
            { id: 'email', icon: 'email', label: 'Email', value: '{{email}}' },
            { id: 'phone', icon: 'tel', label: 'Telefono', value: '{{phone}}' },
            { id: 'address', icon: 'location', label: 'Ubicacion', value: '{{address}}' },
          ],
        },
      };
    }

    if (el.kind === 'footer') {
      return {
        type: 'Footer',
        id: el.id,
        props: {
          title: el.text || 'Footer',
          subtitle: el.subtext || '',
          bgColor: el.backgroundColor || '#0f172a',
          textColor: el.color || '#ffffff',
          showLegal: false,
          paddingY: 20,
        },
      };
    }

    if (el.kind === 'divider') {
      return {
        type: 'Divider',
        id: el.id,
        props: { color: el.color || '#e5e7eb' },
      };
    }

    if (el.kind === 'spacer') {
      return {
        type: 'Spacer',
        id: el.id,
        props: { height: el.spacerHeight || el.height || 24 },
      };
    }

    if (el.kind === 'embed') {
      return {
        type: 'EmbedWidget',
        id: el.id,
        props: {
          embedType: 'iframe',
          embedUrl: el.embedUrl || '',
          height: el.height || 220,
          title: el.name || 'Embed',
        },
      };
    }

    if (el.kind === 'html-embed') {
      return {
        type: 'HTMLBlock',
        id: el.id,
        props: {
          htmlContent: el.htmlContent || '',
        },
      };
    }

    if (el.kind === 'map') {
      return {
        type: 'MapBlock',
        id: el.id,
        props: {
          title: el.text || 'Nuestra Ubicación',
          subtitle: el.subtext || 'Contacto digital corporativo',
          mapEmbedUrl: el.embedUrl || '',
          mapsUrl: el.actionUrl || '',
          buttonLabel: 'Ver en Google Maps',
          mapHeight: (el.height || 220) - 80,
          bgColor: el.backgroundColor || '#ffffff',
        },
      };
    }

    return {
      type: 'AnimationWidget',
      id: el.id,
      props: {
        label: el.text || el.name,
        bgColor: el.backgroundColor || '#111827',
        textColor: el.color || '#ffffff',
      },
    };
  });
}

function EditorContent() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { doc, setDoc, undo, redo, canUndo, canRedo } = useEditorHistory({
    name: 'vCard Theme Studio',
    canvas: { width: 375, height: 812, background: 'linear-gradient(180deg,#ffffff,#f8fafc)', gridSize: 12, showGrid: true, snap: true, showRulers: true },
    media: [],
    elements: [
      { id: 'h1', kind: 'header' as ElementKind, name: 'Header', x: 0, y: 0, width: 375, height: 120, backgroundColor: '#003478', text: 'FORD YUDE CANAHUATI', fontSize: 22, fontWeight: 800, color: '#ffffff', textAlign: 'center', zIndex: 1, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
      { id: 'p1', kind: 'profile' as ElementKind, name: 'Perfil', x: 20, y: 140, width: 335, height: 100, backgroundColor: '#ffffff', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', text: 'Ford Yude Canahuati', fontSize: 24, fontWeight: 800, color: '#0f172a', zIndex: 5, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
      { id: 'a1', kind: 'contact-actions' as ElementKind, name: 'Acciones', x: 15, y: 260, width: 345, height: 80, backgroundColor: '#ffffff', borderRadius: 20, zIndex: 10, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false, contactActions: [
        { id: '1', type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff' },
        { id: '2', type: 'wa', label: 'WhatsApp', icon: 'whatsapp', bgColor: '#25d366', textColor: '#ffffff' },
        { id: '3', type: 'email', label: 'Email', icon: 'mail', bgColor: '#ea4335', textColor: '#ffffff' },
      ]},
      { id: 'i1', kind: 'contact-info' as ElementKind, name: 'Info', x: 20, y: 360, width: 335, height: 120, backgroundColor: '#f8fafc', borderRadius: 16, zIndex: 15, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
      { id: 'b1', kind: 'button' as ElementKind, name: 'Boton', x: 40, y: 500, width: 295, height: 56, backgroundColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: 700, borderRadius: 28, text: 'Contactar Ahora', zIndex: 20, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: false },
      { id: 'f1', kind: 'footer' as ElementKind, name: 'Footer', x: 0, y: 720, width: 375, height: 92, backgroundColor: '#0f172a', color: '#ffffff', text: 'Ford Yude Canahuati', zIndex: 30, rotation: 0, opacity: 1, locked: false, visible: true, allowOverlap: true },
    ],
    savedWidgets: [],
  });
  const [selectedSide, setSelectedSide] = useState<SideKey>('mobile');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ id: string; mode: 'move' | 'resize'; startX: number; startY: number; originX: number; originY: number; originW: number; originH: number; handle?: string } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [clipboard, setClipboard] = useState<StudioElement[]>([]);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [playingAnimations, setPlayingAnimations] = useState(true);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [userData] = useState<UserData>(MOCK_USER_DATA);
  const [themeName, setThemeName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [leftTab, setLeftTab] = useState<'widgets' | 'layers'>('widgets');
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const currentElements = useMemo(() => [...doc.elements].sort((a, b) => a.zIndex - b.zIndex), [doc.elements]);
  const runtimePreviewLayout = useMemo(() => convertElementsToRuntimeLayout(doc.elements), [doc.elements]);
  const canvasScale = zoom / 100;
  const layerList = useMemo(() => [...currentElements].sort((a, b) => b.zIndex - a.zIndex), [currentElements]);
  const selectedElements = useMemo(() => doc.elements.filter(el => selectedIds.includes(el.id)), [doc.elements, selectedIds]);
  const runtimePreviewProfile = useMemo(() => ({
    fullName: `${userData.name} ${userData.lastname}`.trim(),
    position: userData.title,
    company: userData.company || 'Empresa Demo',
    email: userData.email || 'demo@empresa.com',
    phone: userData.phone,
    website: userData.website,
    address: userData.address,
    avatarUrl: userData.avatar,
    logoUrl: undefined,
    initials: `${userData.name?.[0] || ''}${userData.lastname?.[0] || ''}`.toUpperCase() || 'VC',
    updatedLabel: new Date().toLocaleDateString('es-HN'),
    downloadCount: 0,
  }), [userData]);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSavedThemes();
  }, []);

  // Auto-load theme when ?themeId= is present in URL
  useEffect(() => {
    const themeId = searchParams.get('themeId');
    if (!themeId) return;
    fetch(`/api/vcard-themes?id=${themeId}`)
      .then(r => r.json())
      .then(data => {
        if (data.theme) loadSavedTheme(data.theme);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchSavedThemes = async () => {
    try {
      const res = await fetch('/api/vcard-themes');
      const data = await res.json();
      setSavedThemes(data.themes || []);
    } catch (e) {
      console.error('Error loading themes:', e);
    }
  };

  const loadSavedTheme = (theme: any) => {
    const originalStudioDoc = themeStudioDocument(theme.config);
    if (originalStudioDoc) {
      setDoc(originalStudioDoc as StudioDocument);
      setThemeName(theme.name);
      setEditingThemeId(theme.id);
      setShowThemeSelector(false);
      setSelectedIds([]);
      return;
    }
    const config = themeRuntimeLayout(theme.config);
    const W = 375;
    let currentY = 0;

    const kindMap: Record<string, ElementKind> = {
      'Header': 'header',
      'Profile': 'profile',
      'ContactActions': 'contact-actions',
      'ContactInfo': 'contact-info',
      'CTAButton': 'button',
      'ActionButton': 'button',
      'ProgrammableButton': 'button',
      'ButtonRow': 'button',
      'Footer': 'footer',
      'HeroImage': 'image',
      'HeroVideo': 'video',
      'HeroShape': 'shape',
      'TextBlock': 'text',
      'IconBlock': 'icon',
      'SocialLinks': 'social',
      'Gallery': 'gallery',
      'Carousel': 'carousel',
      'Testimonial': 'testimonial',
      'PricingCard': 'pricing',
      'Countdown': 'countdown',
      'FAQ': 'faq',
      'PromoStrip': 'promo-strip',
      'StatsBar': 'stats-bar',
      'EmbedBlock': 'embed',
      'EmbedWidget': 'embed',
      'HTMLBlock': 'html-embed',
      'Divider': 'divider',
      'Spacer': 'spacer',
      'MapBlock': 'map',
    };

    const defaultHeights: Record<string, number> = {
      'Header': 120,
      'Profile': 110,
      'ContactActions': 90,
      'ContactInfo': 130,
      'ActionButton': 60,
      'CTAButton': 60,
      'ProgrammableButton': 60,
      'ButtonRow': 130,
      'Footer': 100,
      'Divider': 20,
      'PromoStrip': 70,
      'StatsBar': 90,
      'MapBlock': 220,
      'EmbedBlock': 220,
      'EmbedWidget': 220,
      'HTMLBlock': 80,
    };

    const elements: StudioElement[] = config.map((block: any, idx: number) => {
      const p = block.props || {};
      const kind = kindMap[block.type] || 'shape';
      const h = block.type === 'Spacer' ? (p.height || 24) : (defaultHeights[block.type] || 80);

      // Positioning: full-width blocks flush left, others with margin
      const fullWidth = ['Header', 'Footer', 'PromoStrip', 'StatsBar', 'Divider', 'ButtonRow', 'MapBlock'];
      const x = fullWidth.includes(block.type) ? 0 : 20;
      const w = fullWidth.includes(block.type) ? W : W - 40;

      const y = currentY;
      currentY += h + 8;

      const base: StudioElement = {
        id: block.id || `el_${idx}`,
        kind,
        name: block.name || block.type,
        x,
        y,
        width: w,
        height: h,
        backgroundColor: p.bgColor || p.sectionBgColor || p.backgroundColor || '#ffffff',
        color: p.textColor || p.nameColor || p.color || '#0f172a',
        fontSize: p.nameSize || p.fontSize || 16,
        fontWeight: p.fontWeight || 600,
        textAlign: (p.align || 'center') as 'left' | 'center' | 'right',
        borderRadius: p.buttonRadius || p.borderRadius || 0,
        text: p.title || p.label || p.text || '',
        subtext: p.subtitle || p.subtext || '',
        zIndex: idx + 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        allowOverlap: ['Header', 'Footer'].includes(block.type),
      };

      // ── Type-specific field overrides ──────────────────────────────────
      if (block.type === 'Header') {
        base.backgroundColor = p.bgColor || '#003478';
        base.color = p.textColor || '#ffffff';
        base.text = p.title || '';
        base.subtext = p.subtitle || '';
        base.fontSize = 22;
        base.fontWeight = 800;
        base.textAlign = 'center';
      }

      if (block.type === 'Profile') {
        base.x = 20;
        base.width = W - 40;
        base.backgroundColor = '#ffffff';
        base.color = p.nameColor || '#0f172a';
        base.fontSize = p.nameSize || 24;
        base.fontWeight = 800;
        base.borderRadius = 20;
        base.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      }

      if (block.type === 'ContactActions') {
        base.x = 15;
        base.width = W - 30;
        base.backgroundColor = p.sectionBgColor || '#ffffff';
        base.borderRadius = p.buttonRadius || 16;
        base.contactActions = (p.items || []).map((item: any) => {
          // Reverse-derive the stored value from href
          let value = item.value || item.href || '';
          if (item.href) {
            if (item.type === 'tel') value = item.href.replace('tel:', '');
            else if (item.type === 'email') value = item.href.replace('mailto:', '');
            else if (item.type === 'wa') value = item.href.replace(/^https:\/\/wa\.me\//, '');
            else value = item.href;
          }
          return {
            id: item.id || `ca_${idx}`,
            type: item.type || 'tel',
            label: item.label || '',
            icon: item.icon || item.type || 'phone',
            bgColor: item.bgColor || '#10b981',
            textColor: item.textColor || '#ffffff',
            value,
          };
        });
      }

      if (block.type === 'ContactInfo') {
        base.x = 20;
        base.width = W - 40;
        base.backgroundColor = p.bgColor || '#f8fafc';
        base.borderRadius = 16;
      }

      if (block.type === 'ActionButton' || block.type === 'CTAButton') {
        base.x = 40;
        base.width = W - 80;
        base.backgroundColor = p.bgColor || '#10b981';
        base.color = p.textColor || '#ffffff';
        base.text = p.label || 'Guardar en Contactos';
        base.borderRadius = p.borderRadius || 28;
        base.actionType = 'download';
      }

      if (block.type === 'ProgrammableButton') {
        base.x = 40;
        base.width = W - 80;
        base.backgroundColor = p.bgColor || '#003478';
        base.color = p.textColor || '#ffffff';
        base.text = p.label || 'Botón';
        base.borderRadius = p.borderRadius || 28;
        // actionType: runtime uses 'tel', builder uses 'call'
        base.actionType = p.actionType === 'tel' ? 'call' : (p.actionType || 'url');
        base.actionUrl = p.actionUrl;
        base.actionPhone = p.phoneNumber;
        base.actionWhatsapp = p.whatsappNumber;
        base.actionMessage = p.whatsappMessage;
        base.actionEmail = p.emailAddress;
      }

      if (block.type === 'ButtonRow') {
        base.backgroundColor = p.bgColor || '#003478';
        base.color = p.textColor || '#ffffff';
        base.text = (p.buttons || [])[0]?.label || 'Botones';
        base.height = 130;
        base.actionType = 'url';
      }

      if (block.type === 'Footer') {
        base.backgroundColor = p.bgColor || '#0f172a';
        base.color = p.textColor || '#ffffff';
        base.text = p.title || '';
        base.subtext = p.subtitle || '';
        base.allowOverlap = true;
      }

      if (block.type === 'Divider') {
        base.height = 20;
        base.x = 0;
        base.width = W;
        base.color = p.color || '#e5e7eb';
        base.dividerStyle = p.style || 'solid';
      }

      if (block.type === 'Spacer') {
        base.x = 0;
        base.width = W;
        base.height = p.height || 24;
        base.spacerHeight = p.height || 24;
      }

      if (block.type === 'MapBlock') {
        base.x = 0;
        base.width = W;
        base.height = 220;
        base.text = p.title || 'Ubicación';
        base.embedUrl = p.mapEmbedUrl || p.mapUrl || p.embedUrl || '';
        base.actionUrl = p.mapsUrl || p.actionUrl || '';
        base.backgroundColor = p.bgColor || '#ffffff';
      }

      if (block.type === 'EmbedBlock' || block.type === 'EmbedWidget') {
        base.embedUrl = p.embedUrl || '';
        base.height = p.height || 220;
      }

      if (block.type === 'HTMLBlock') {
        base.htmlContent = p.htmlContent || '';
      }

      return base;
    });

    setDoc(prev => ({ ...prev, elements }));
    setThemeName(theme.name);
    setEditingThemeId(theme.id);
    setShowThemeSelector(false);
  };

  const addElement = (kind: ElementKind) => {
    const newElement = createElement(kind, doc.canvas, doc.elements);
    // Place new element below the last/tallest existing element
    const maxBottom = doc.elements.reduce((acc, el) => Math.max(acc, el.y + el.height), 0);
    const isFullWidth = ['header', 'footer', 'divider', 'spacer', 'map'].includes(kind);
    newElement.x = isFullWidth ? 0 : 20;
    newElement.y = maxBottom + 8;
    if (isFullWidth) newElement.width = doc.canvas.width;
    setDoc(prev => ({ ...prev, elements: [...prev.elements, newElement] }));
    setSelectedIds([newElement.id]);
  };

  const updateElement = (id: string, updates: Partial<StudioElement>) => {
    setDoc(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));
  };

  const deleteElements = (ids: string[]) => {
    setDoc(prev => ({
      ...prev,
      elements: prev.elements.filter(el => !ids.includes(el.id))
    }));
    setSelectedIds([]);
  };

  const duplicateElements = (elements: StudioElement[]) => {
    const newElements = elements.map(el => ({
      ...el,
      id: uid(el.kind),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: doc.elements.length + elements.indexOf(el) + 1,
    }));
    setDoc(prev => ({ ...prev, elements: [...prev.elements, ...newElements] }));
    setSelectedIds(newElements.map(el => el.id));
  };

  const groupElements = () => {
    if (selectedIds.length < 2) return;
    const groupId = uid('group');
    setDoc(prev => ({
      ...prev,
      elements: prev.elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId } : el)
    }));
  };

  const ungroupElements = () => {
    setDoc(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.groupId && selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el)
    }));
  };

  const saveAsWidget = () => {
    if (selectedIds.length < 1) return;
    const widget: GroupedWidget = {
      id: uid('widget'),
      name: `Widget ${doc.savedWidgets.length + 1}`,
      elements: doc.elements.filter(el => selectedIds.includes(el.id)),
    };
    setDoc(prev => ({ ...prev, savedWidgets: [...prev.savedWidgets, widget] }));
  };

  const loadTheme = (theme: typeof BASE_THEMES[0]) => {
    setEditingThemeId(null);
    setThemeName('');
    setDoc(prev => ({
      ...prev,
      canvas: { ...prev.canvas, ...theme.config.canvas as any },
      elements: theme.config.elements.map((el: any) => ({ ...el, id: uid(el.kind) })),
    }));
    setShowThemeSelector(false);
  };

  const handleSave = async () => {
    if (!themeName.trim() || isSaving) return;
    const hasHeader = doc.elements.some(e => e.kind === 'header' && e.visible !== false);
    const hasProfile = doc.elements.some(e => e.kind === 'profile' && e.visible !== false);
    const hasFooter = doc.elements.some(e => e.kind === 'footer' && e.visible !== false);
    if (!hasHeader || !hasProfile || !hasFooter) {
      setSaveError('Incluya un encabezado, perfil y pie de página visibles antes de guardar.');
      return;
    }
    setSaveError('');
    setIsSaving(true);
    try {
      const layoutJson = convertElementsToRuntimeLayout(doc.elements);
      const payload = { name: themeName.trim(), layoutJson, studioDoc: doc };
      const saveDraft = async (name: string) => {
        const response = await fetch('/api/vcard-themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, name }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.theme?.id) throw new Error(result.error || 'No se pudo crear el borrador');
        return result.theme as { id: string; name: string };
      };
      let saved: { id: string; name: string };
      if (editingThemeId) {
        const response = await fetch('/api/vcard-themes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingThemeId }),
        });
        const result = await response.json().catch(() => ({}));
        if (response.status === 409 && result.code === 'THEME_PUBLISHED') {
          if (!window.confirm('Este tema está publicado. Para no modificar las vCards activas, ¿desea guardar una nueva versión en borrador?')) {
            return;
          }
          saved = await saveDraft(`${themeName.trim()} (borrador)`);
        } else if (!response.ok || !result.theme?.id) {
          throw new Error(result.error || 'Error al actualizar el diseño');
        } else {
          saved = result.theme as { id: string; name: string };
        }
      } else {
        saved = await saveDraft(themeName.trim());
      }
      setEditingThemeId(saved.id);
      setThemeName(saved.name);
      setShowSaveModal(false);
      await fetchSavedThemes();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar el diseño');
    } finally {
      setIsSaving(false);
    }
  };

  const applyDarkModePreset = () => {
    const isDark = doc.canvas.background.includes('#0f172a') || doc.canvas.background.includes('#1e293b');
    if (isDark) {
      setDoc(d => ({ ...d, canvas: { ...d.canvas, background: 'linear-gradient(180deg,#ffffff,#f8fafc)' } }));
    } else {
      setDoc(d => ({ ...d, canvas: { ...d.canvas, background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)' } }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, el: StudioElement) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!selectedIds.includes(el.id)) {
      if (e.shiftKey) setSelectedIds(prev => [...prev, el.id]);
      else setSelectedIds([el.id]);
    }
    setDragState({
      id: el.id,
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      originX: el.x,
      originY: el.y,
      originW: el.width,
      originH: el.height,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, el: StudioElement, handle: string) => {
    e.stopPropagation();
    setDragState({
      id: el.id,
      mode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      originX: el.x,
      originY: el.y,
      originW: el.width,
      originH: el.height,
      handle,
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) {
      if (e.buttons === 1 && mouseStart) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left) / canvasScale;
          const y = (e.clientY - rect.top) / canvasScale;
          const width = Math.abs(e.clientX - mouseStart.x) / canvasScale;
          const height = Math.abs(e.clientY - mouseStart.y) / canvasScale;
          setMarqueeRect({
            x: Math.min(x, x + width),
            y: Math.min(y, y + height),
            width,
            height,
          });
        }
      }
      return;
    }

    const dx = (e.clientX - dragState.startX) / canvasScale;
    const dy = (e.clientY - dragState.startY) / canvasScale;

    if (dragState.mode === 'move') {
      const el = doc.elements.find(e => e.id === dragState.id);
      if (el) {
        const newX = snap(dragState.originX + dx, doc.canvas.snap, doc.canvas.gridSize);
        const newY = snap(dragState.originY + dy, doc.canvas.snap, doc.canvas.gridSize);
        updateElement(dragState.id, { x: newX, y: newY });
      }
    } else if (dragState.mode === 'resize') {
      const { handle, originX, originY, originW, originH } = dragState;
      let newX = originX, newY = originY, newW = originW, newH = originH;
      if (handle?.includes('e')) newW = Math.max(20, originW + dx);
      if (handle?.includes('w')) { newW = Math.max(20, originW - dx); newX = originX + dx; }
      if (handle?.includes('s')) newH = Math.max(20, originH + dy);
      if (handle?.includes('n')) { newH = Math.max(20, originH - dy); newY = originY + dy; }
      updateElement(dragState.id, { x: snap(newX, doc.canvas.snap, doc.canvas.gridSize), y: snap(newY, doc.canvas.snap, doc.canvas.gridSize), width: newW, height: newH });
    }
  }, [dragState, doc.elements, doc.canvas, canvasScale, updateElement]);

  const handleMouseUp = () => {
    if (marqueeRect) {
      const selected = doc.elements.filter(el => {
        return el.x < marqueeRect.x + marqueeRect.width && el.x + el.width > marqueeRect.x &&
               el.y < marqueeRect.y + marqueeRect.height && el.y + el.height > marqueeRect.y;
      });
      setSelectedIds(selected.map(el => el.id));
    }
    setDragState(null);
    setMarqueeRect(null);
    setMouseStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0 && document.activeElement?.tagName !== 'INPUT' && !document.activeElement?.closest('.ProseMirror')) {
          deleteElements(selectedIds);
        }
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') setClipboard(selectedElements);
        if (e.key === 'v' && clipboard.length > 0) {
          const newElements = clipboard.map(el => ({ ...el, id: uid(el.kind), x: el.x + 20, y: el.y + 20 }));
          setDoc(prev => ({ ...prev, elements: [...prev.elements, ...newElements] }));
          setSelectedIds(newElements.map(el => el.id));
        }
        if (e.key === 'z') { if (e.shiftKey) redo(); else undo(); }
        if (e.key === 'a') { e.preventDefault(); setSelectedIds(doc.elements.map(el => el.id)); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedElements, clipboard, doc.elements, undo, redo, deleteElements]);

  const getCursor = () => {
    if (!dragState) return 'default';
    if (dragState.mode === 'resize') {
      if (dragState.handle?.includes('e') || dragState.handle?.includes('w')) return 'ew-resize';
      if (dragState.handle?.includes('n') || dragState.handle?.includes('s')) return 'ns-resize';
      if ((dragState.handle?.includes('e') && dragState.handle?.includes('s')) || (dragState.handle?.includes('w') && dragState.handle?.includes('n'))) return 'nwse-resize';
      if ((dragState.handle?.includes('w') && dragState.handle?.includes('s')) || (dragState.handle?.includes('e') && dragState.handle?.includes('n'))) return 'nesw-resize';
    }
    return 'move';
  };

  const WIDGET_CATEGORIES = [
    { name: 'Basicos', items: [
      { kind: 'text' as ElementKind, icon: Type, label: 'Texto' },
      { kind: 'image' as ElementKind, icon: ImageIcon, label: 'Imagen' },
      { kind: 'video' as ElementKind, icon: Video, label: 'Video' },
      { kind: 'shape' as ElementKind, icon: Square, label: 'Forma' },
      { kind: 'icon' as ElementKind, icon: Star, label: 'Icono' },
    ]},
    { name: 'vCard', items: [
      { kind: 'header' as ElementKind, icon: Layout, label: 'Header' },
      { kind: 'profile' as ElementKind, icon: User, label: 'Perfil' },
      { kind: 'contact-actions' as ElementKind, icon: Phone, label: 'Acciones' },
      { kind: 'contact-social' as ElementKind, icon: Share2, label: 'Social' },
      { kind: 'contact-info' as ElementKind, icon: Info, label: 'Info' },
      { kind: 'button' as ElementKind, icon: Square, label: 'Boton' },
      { kind: 'icon-button' as ElementKind, icon: Circle, label: 'Icono Accion' },
    ]},
    { name: 'Marketing', items: [
      { kind: 'promo-strip' as ElementKind, icon: Zap, label: 'Promo' },
      { kind: 'stats-bar' as ElementKind, icon: BarChart2, label: 'Stats' },
      { kind: 'testimonial' as ElementKind, icon: Quote, label: 'Testimonio' },
      { kind: 'pricing' as ElementKind, icon: CreditCard, label: 'Precio' },
      { kind: 'countdown' as ElementKind, icon: Timer, label: 'Cuenta' },
      { kind: 'faq' as ElementKind, icon: HelpCircle, label: 'FAQ' },
    ]},
    { name: 'Media', items: [
      { kind: 'gallery' as ElementKind, icon: Grid, label: 'Galeria' },
      { kind: 'carousel' as ElementKind, icon: Columns, label: 'Carrusel' },
      { kind: 'embed' as ElementKind, icon: Code, label: 'Embed' },
      { kind: 'html-embed' as ElementKind, icon: FileCode, label: 'HTML' },
    ]},
    { name: 'Avanzado', items: [
      { kind: 'divider' as ElementKind, icon: Minus, label: 'Divisor' },
      { kind: 'spacer' as ElementKind, icon: ArrowUpDown, label: 'Espacio' },
      { kind: 'map' as ElementKind, icon: MapPin, label: 'Mapa' },
      { kind: 'footer' as ElementKind, icon: Box, label: 'Footer' },
    ]},
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left Panel - Tools */}
      {showLeftPanel && (
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex gap-1">
              <button onClick={() => setLeftTab('widgets')} className={`px-3 py-1 rounded text-xs font-bold ${leftTab === 'widgets' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Widgets</button>
              <button onClick={() => setLeftTab('layers')} className={`px-3 py-1 rounded text-xs font-bold ${leftTab === 'layers' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Capas ({doc.elements.length})</button>
            </div>
            <button onClick={() => setShowLeftPanel(false)}><PanelLeftClose size={16} /></button>
          </div>
          {leftTab === 'widgets' ? (
            <div className="flex-1 overflow-y-auto p-2">
              {WIDGET_CATEGORIES.map(cat => (
                <div key={cat.name} className="mb-4">
                  <h3 className="text-xs text-gray-400 mb-2 px-2">{cat.name}</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {cat.items.map(item => (
                      <button key={item.kind} onClick={() => addElement(item.kind)}
                        className="flex flex-col items-center justify-center p-2 rounded bg-gray-700 hover:bg-gray-600 text-xs gap-1">
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-[10px] text-gray-500 mb-2 px-1">Arrastra para reordenar. Click para seleccionar.</p>
              {layerList.map((el) => (
                <div
                  key={el.id}
                  draggable
                  onDragStart={() => setDraggingLayerId(el.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!draggingLayerId || draggingLayerId === el.id) { setDraggingLayerId(null); return; }
                    const srcEl = doc.elements.find(e => e.id === draggingLayerId);
                    if (srcEl) {
                      const srcZ = srcEl.zIndex;
                      const tgtZ = el.zIndex;
                      setDoc(prev => ({
                        ...prev,
                        elements: prev.elements.map(e =>
                          e.id === draggingLayerId ? { ...e, zIndex: tgtZ } :
                          e.id === el.id ? { ...e, zIndex: srcZ } : e
                        )
                      }));
                    }
                    setDraggingLayerId(null);
                  }}
                  onClick={() => setSelectedIds([el.id])}
                  className={`flex items-center gap-2 p-2 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-gray-700 ${
                    selectedIds.includes(el.id) ? 'bg-blue-600/70 ring-1 ring-blue-400' : 'bg-gray-700/40'
                  } ${draggingLayerId === el.id ? 'opacity-40 ring-2 ring-yellow-400' : ''}`}
                >
                  <Move size={11} className="text-gray-500 flex-shrink-0" />
                  <span className="text-xs flex-1 truncate">{el.name}</span>
                  <span className="text-[9px] text-gray-500 flex-shrink-0">{el.kind}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}
                    className={`p-0.5 rounded ${el.visible ? 'text-gray-400' : 'text-gray-600'} hover:text-white flex-shrink-0`}
                  >
                    <Eye size={11} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteElements([el.id]); }}
                    className="p-0.5 rounded text-gray-600 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 border-t border-gray-700">
            <button onClick={() => setShowThemeSelector(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded hover:opacity-90">
              <Sparkles size={16} /> Temas Base
            </button>
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-blue-900 bg-[#102a4b] px-4 py-2 text-xs text-blue-100">
          <strong>1. Diseñe</strong> con widgets y vista previa · <strong>2. Guarde</strong> un borrador · <strong>3. Publique</strong> por empresa o sucursal en el catálogo.
          <span className="ml-2 text-blue-200">La vista previa usa datos de demostración, no genera QR públicos.</span>
        </div>
        {/* Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
          {!showLeftPanel && <button onClick={() => setShowLeftPanel(true)}><PanelLeftOpen size={20} /></button>}
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={!canUndo} className="p-2 rounded hover:bg-gray-700 disabled:opacity-30"><Undo size={18} /></button>
            <button onClick={redo} disabled={!canRedo} className="p-2 rounded hover:bg-gray-700 disabled:opacity-30"><Redo2 size={18} /></button>
          </div>
          <div className="h-6 w-px bg-gray-600" />
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedSide('mobile')} className={`p-2 rounded ${selectedSide === 'mobile' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><Smartphone size={18} /></button>
            <button onClick={() => setSelectedSide('desktop')} className={`p-2 rounded ${selectedSide === 'desktop' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}><Monitor size={18} /></button>
          </div>
          <div className="h-6 w-px bg-gray-600" />
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 rounded hover:bg-gray-700"><ZoomOut size={16} /></button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 rounded hover:bg-gray-700"><ZoomIn size={16} /></button>
          </div>
          <div className="h-6 w-px bg-gray-600" />
          <div className="flex items-center gap-1">
            <button onClick={() => setDoc(d => ({ ...d, canvas: { ...d.canvas, snap: !d.canvas.snap } }))} className={`p-2 rounded ${doc.canvas.snap ? 'bg-green-600' : 'hover:bg-gray-700'}`} title="Snap to grid"><Grid3X3 size={18} /></button>
            <button onClick={() => setDoc(d => ({ ...d, canvas: { ...d.canvas, showGrid: !d.canvas.showGrid } }))} className={`p-2 rounded ${doc.canvas.showGrid ? 'bg-blue-600' : 'hover:bg-gray-700'}`} title="Show grid"><Grid size={18} /></button>
            <button onClick={() => setDoc(d => ({ ...d, canvas: { ...d.canvas, showRulers: !d.canvas.showRulers } }))} className={`p-2 rounded ${doc.canvas.showRulers ? 'bg-blue-600' : 'hover:bg-gray-700'}`} title="Show rulers"><Ruler size={18} /></button>
          </div>
          <div className="flex-1" />
          <button onClick={applyDarkModePreset} className="p-2 rounded hover:bg-gray-700" title="Modo oscuro/claro"><Palette size={18} /></button>
          <a href="/vcards/temas" className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-xs font-semibold" title="Publicar diseños guardados">Publicar temas</a>
          <button onClick={() => setShowPreviewPanel(!showPreviewPanel)} className={`p-2 rounded ${showPreviewPanel ? 'bg-purple-600' : 'hover:bg-gray-700'}`}><Eye size={18} /></button>
          <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700"><Save size={18} /> Guardar</button>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-8 flex justify-center" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: getCursor() }}>
            <div ref={canvasRef} className="relative shadow-2xl" style={{
              width: doc.canvas.width * canvasScale,
              height: doc.canvas.height * canvasScale,
              background: doc.canvas.background,
              transform: `scale(1)`,
              transformOrigin: 'top center',
            }}>
              {doc.canvas.showRulers && (
                <>
                  <div className="absolute -top-6 left-0 right-0 h-5 flex" style={{ width: doc.canvas.width * canvasScale }}>
                    {Array.from({ length: Math.ceil(doc.canvas.width / 50) }).map((_, i) => (
                      <div key={i} className="flex-1 text-[8px] text-gray-400 border-l border-gray-400 pl-1" style={{ width: 50 * canvasScale }}>{i * 50}</div>
                    ))}
                  </div>
                  <div className="absolute -left-6 top-0 h-full w-5 flex flex-col" style={{ height: doc.canvas.height * canvasScale }}>
                    {Array.from({ length: Math.ceil(doc.canvas.height / 50) }).map((_, i) => (
                      <div key={i} className="flex-1 text-[8px] text-gray-400 border-t border-gray-400 pt-1" style={{ height: 50 * canvasScale }}>{i * 50}</div>
                    ))}
                  </div>
                </>
              )}
              {doc.canvas.showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: `${doc.canvas.gridSize * canvasScale}px ${doc.canvas.gridSize * canvasScale}px` }} />
              )}
              {currentElements.map(el => (
                <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el)}
                  className={`absolute cursor-move ${selectedIds.includes(el.id) ? 'ring-2 ring-blue-500' : ''} ${!el.visible ? 'opacity-30' : ''}`}
                  style={{
                    left: el.x * canvasScale, top: el.y * canvasScale,
                    width: el.width * canvasScale, height: el.height * canvasScale,
                    opacity: el.opacity, zIndex: el.zIndex,
                    transform: `rotate(${el.rotation}deg)`,
                    boxShadow: el.boxShadow,
                    color: el.color || '#111827',
                  }}
                >
                  <div className="w-full h-full" style={{ borderRadius: el.borderRadius, overflow: 'hidden' }}>
                    {renderElementContent(el, userData)}
                  </div>
                  {selectedIds.includes(el.id) && (
                    <>
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, el, 'nw')} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-ne-resize" onMouseDown={(e) => handleResizeStart(e, el, 'ne')} />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, el, 'sw')} />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, el, 'se')} />
                      <div className="absolute top-1/2 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-w-resize" onMouseDown={(e) => handleResizeStart(e, el, 'w')} />
                      <div className="absolute top-1/2 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-e-resize" onMouseDown={(e) => handleResizeStart(e, el, 'e')} />
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-n-resize" onMouseDown={(e) => handleResizeStart(e, el, 'n')} />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-s-resize" onMouseDown={(e) => handleResizeStart(e, el, 's')} />
                    </>
                  )}
                </div>
              ))}
              {marqueeRect && (
                <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none"
                  style={{ left: marqueeRect.x * canvasScale, top: marqueeRect.y * canvasScale, width: marqueeRect.width * canvasScale, height: marqueeRect.height * canvasScale }} />
              )}
            </div>
          </div>

          {/* Preview Panel */}
          {showPreviewPanel && (
            <div className="w-[420px] bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-bold text-sm">Vista Previa en Tiempo Real</h3>
                <button onClick={() => setShowPreviewPanel(false)}><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
                <div style={{ width: 188, height: 407, position: 'relative', overflow: 'hidden', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                  <div style={{ width: 375, transform: 'scale(0.5)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, background: doc.canvas.background, minHeight: 812 }}>
                    {renderVCardLayout({
                      layout: runtimePreviewLayout,
                      profile: runtimePreviewProfile,
                      handlers: {
                        onCall: () => {},
                        onEmail: () => {},
                        onWhatsApp: () => {},
                        onDownload: () => {},
                        onShare: () => {},
                        onOpenUrl: () => {},
                      },
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <h3 className="font-bold text-sm">Propiedades</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {selectedElements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Selecciona un elemento para editar</p>
          ) : selectedElements.length === 1 ? (
            <ElementProperties el={selectedElements[0]} onChange={(u) => updateElement(selectedElements[0].id, u)} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{selectedElements.length} elementos seleccionados</p>
              <button onClick={groupElements} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 rounded hover:bg-blue-700"><Group size={16} /> Agrupar</button>
              <button onClick={saveAsWidget} className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 rounded hover:bg-purple-700"><FolderOpen size={16} /> Guardar como Widget</button>
              <button onClick={() => duplicateElements(selectedElements)} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-700 rounded hover:bg-gray-600"><Copy size={16} /> Duplicar</button>
              <button onClick={() => deleteElements(selectedIds)} className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 rounded hover:bg-red-700"><Trash2 size={16} /> Eliminar</button>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="font-bold text-lg mb-2">{editingThemeId ? 'Guardar cambios del tema' : 'Guardar borrador'}</h3>
            <p className="text-xs text-gray-300 mb-4">Diseñe aquí. La publicación a empresas y sucursales se realiza después en Publicar temas.</p>
            <input type="text" placeholder="Nombre del tema" value={themeName} onChange={(e) => setThemeName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none" />
            {saveError && <p role="alert" className="mt-3 rounded border border-red-500 bg-red-900/40 p-2 text-xs text-red-100">{saveError}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowSaveModal(false); setSaveError(''); }} className="flex-1 py-2 bg-gray-700 rounded hover:bg-gray-600">Cancelar</button>
              <button onClick={handleSave} disabled={!themeName.trim() || isSaving} className="flex-1 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">
                {isSaving ? 'Guardando...' : (editingThemeId ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[700px] max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Seleccionar o Cargar Tema</h3>
              <button onClick={() => setShowThemeSelector(false)}><X size={20} /></button>
            </div>
            
            {savedThemes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-2">Temas Guardados</h4>
                <div className="grid grid-cols-2 gap-2">
                  {savedThemes.map((theme: any) => (
                    <button key={theme.id} onClick={() => loadSavedTheme(theme)}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-3 text-white text-left hover:opacity-90 transition-opacity">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold">{theme.name}</h5>
                        {theme.isActive && <span className="text-xs bg-green-500 px-2 py-0.5 rounded">Activo</span>}
                      </div>
                      <p className="text-xs opacity-70 mt-1">{theme.type || 'Corporativo'}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-2">Templates Base</h4>
              <div className="grid grid-cols-2 gap-4">
                {BASE_THEMES.map(theme => (
                  <button key={theme.id} onClick={() => {
                    setEditingThemeId(null);
                    loadTheme(theme);
                  }}
                    className={`${theme.preview} rounded-lg p-4 text-white text-left hover:opacity-90 transition-opacity`}>
                    <h4 className="font-bold text-lg">{theme.name}</h4>
                    <p className="text-sm opacity-80">Template premium</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ElementProperties({ el, onChange }: { el: StudioElement; onChange: (u: Partial<StudioElement>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400">Nombre</label>
        <input type="text" value={el.name} onChange={(e) => onChange({ name: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">X</label>
          <input type="number" value={Math.round(el.x)} onChange={(e) => onChange({ x: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Y</label>
          <input type="number" value={Math.round(el.y)} onChange={(e) => onChange({ y: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Ancho</label>
          <input type="number" value={Math.round(el.width)} onChange={(e) => onChange({ width: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Alto</label>
          <input type="number" value={Math.round(el.height)} onChange={(e) => onChange({ height: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
        </div>
      </div>
      {(el.kind === 'button' || el.kind === 'action-button' || el.kind === 'icon-button') && (
        <div>
          <label className="text-xs text-gray-400">Forma del boton</label>
          <div className="flex gap-1 mt-1">
            {(['square', 'rounded', 'pill', 'circle', 'leaf'] as ButtonShape[]).map(shape => (
              <button key={shape} onClick={() => onChange({ buttonShape: shape })}
                className={`flex-1 py-1 px-2 rounded text-xs ${el.buttonShape === shape ? 'bg-blue-600' : 'bg-gray-700'}`}>{shape}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="text-xs text-gray-400">Fondo (Colores Rapidos)</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {FILL_PRESETS.map((fill, i) => (
            <button key={i} onClick={() => onChange({ backgroundColor: fill.bg, color: fill.color })}
              className="w-8 h-8 rounded border border-gray-500" style={{ background: fill.bg }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">Color Fondo</label>
          <input type="color" value={el.backgroundColor || '#ffffff'} onChange={(e) => onChange({ backgroundColor: e.target.value })} className="w-full h-8 rounded" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Color Texto</label>
          <input type="color" value={el.color || '#000000'} onChange={(e) => onChange({ color: e.target.value })} className="w-full h-8 rounded" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400">Borde Redondo</label>
        <input type="range" min="0" max="50" value={el.borderRadius || 0} onChange={(e) => onChange({ borderRadius: Number(e.target.value) })} className="w-full" />
      </div>
      <div>
        <label className="text-xs text-gray-400">Animacion</label>
        <select value={el.animationType || 'none'} onChange={(e) => onChange({ animationType: e.target.value as any })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm mt-1">
          <option value="none">Ninguna</option>
          <option value="fade">Fade</option>
          <option value="fadeInUp">Fade In Up</option>
          <option value="fadeInDown">Fade In Down</option>
          <option value="scaleIn">Scale In</option>
          <option value="slide">Slide</option>
          <option value="bounce">Bounce</option>
          <option value="pulse">Pulse</option>
          <option value="shake">Shake</option>
          <option value="wiggle">Wiggle</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">Opacity</label>
          <input type="range" min="0" max="1" step="0.1" value={el.opacity} onChange={(e) => onChange({ opacity: Number(e.target.value) })} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Z-Index</label>
          <input type="number" value={el.zIndex} onChange={(e) => onChange({ zIndex: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
        </div>
      </div>
      {el.kind === 'text' && (
        <>
          <div>
            <label className="text-xs text-gray-400">Texto</label>
            <input type="text" value={el.text || ''} onChange={(e) => onChange({ text: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Tamaño</label>
              <input type="number" value={el.fontSize || 16} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Peso</label>
              <input type="number" value={el.fontWeight || 400} onChange={(e) => onChange({ fontWeight: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
            </div>
          </div>
        </>
      )}
      {(el.kind === 'header') && (
        <div className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Contenido del Header</p>
          <div>
            <label className="text-xs text-gray-400">Título principal</label>
            <input type="text" value={el.text || ''} onChange={(e) => onChange({ text: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="EMPRESA SA de CV" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Subtítulo</label>
            <input type="text" value={el.subtext || ''} onChange={(e) => onChange({ subtext: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="VCARD CORPORATIVA" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Tamaño fuente</label>
              <input type="number" value={el.fontSize || 22} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Peso fuente</label>
              <input type="number" value={el.fontWeight || 800} onChange={(e) => onChange({ fontWeight: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Imagen de fondo (URL)</label>
            <input type="text" value={(el as any).backgroundImage || ''} onChange={(e) => onChange({ backgroundImage: e.target.value } as any)} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="https://...imagen.jpg" />
            <p className="text-[10px] text-gray-500 mt-0.5">Se muestra detrás del título del header</p>
          </div>
        </div>
      )}
      {(el.kind === 'profile') && (
        <div className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Configuración del Perfil</p>
          <p className="text-[10px] text-gray-400 italic">Color Fondo = color del panel. Color Texto = color del nombre y del círculo de iniciales cuando no hay foto.</p>
          <div>
            <label className="text-xs text-gray-400">Tamaño del nombre</label>
            <input type="number" value={el.fontSize || 24} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" min="12" max="48" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Peso del nombre</label>
            <select value={el.fontWeight || 800} onChange={(e) => onChange({ fontWeight: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm">
              <option value={400}>Normal</option>
              <option value={600}>Semibold</option>
              <option value={700}>Bold</option>
              <option value={800}>Extrabold (recomendado)</option>
              <option value={900}>Black</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">URL de foto (sobreescribe foto del usuario)</label>
            <input type="text" value={el.src || ''} onChange={(e) => onChange({ src: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="https://...foto.jpg" />
            <p className="text-[10px] text-gray-500 mt-0.5">Opcional — si vacío se usa la foto del usuario</p>
          </div>
        </div>
      )}
      {(el.kind === 'footer') && (
        <div className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Contenido del Footer</p>
          <div>
            <label className="text-xs text-gray-400">Texto principal</label>
            <input type="text" value={el.text || ''} onChange={(e) => onChange({ text: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="© 2026 Empresa" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Subtexto</label>
            <input type="text" value={el.subtext || ''} onChange={(e) => onChange({ subtext: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="Honduras" />
          </div>
        </div>
      )}
      {(el.kind === 'button' || el.kind === 'action-button') && (
        <div className="space-y-3 border-t border-gray-700 pt-3">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Botón</p>
          <div>
            <label className="text-xs text-gray-400">Texto del botón</label>
            <input type="text" value={el.text || ''} onChange={(e) => onChange({ text: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Acción del botón</label>
            <select value={el.actionType || 'download'} onChange={(e) => onChange({ actionType: e.target.value as any })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm mt-1">
              <option value="download">📥 Guardar contacto (vCard)</option>
              <option value="call">📞 Llamar teléfono</option>
              <option value="whatsapp">💬 WhatsApp con mensaje</option>
              <option value="url">🔗 Abrir URL</option>
              <option value="email">✉️ Enviar Email</option>
              <option value="share">📤 Compartir vCard</option>
            </select>
          </div>
          {(el.actionType === 'whatsapp') && (
            <>
              <div>
                <label className="text-xs text-gray-400">Número WhatsApp (con código país)</label>
                <input type="tel" value={el.actionWhatsapp || ''} onChange={(e) => onChange({ actionWhatsapp: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="+504 9876 5432" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Mensaje inicial</label>
                <textarea value={el.actionMessage || ''} onChange={(e) => onChange({ actionMessage: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm h-20 resize-none" placeholder="Hola! Me gustaría agendar una cita..." />
              </div>
            </>
          )}
          {(el.actionType === 'url') && (
            <div>
              <label className="text-xs text-gray-400">URL destino</label>
              <input type="url" value={el.actionUrl || ''} onChange={(e) => onChange({ actionUrl: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="https://..." />
            </div>
          )}
          {(el.actionType === 'call') && (
            <div>
              <label className="text-xs text-gray-400">Número de teléfono</label>
              <input type="tel" value={el.actionPhone || ''} onChange={(e) => onChange({ actionPhone: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="+504 9876 5432" />
            </div>
          )}
          {(el.actionType === 'email') && (
            <div>
              <label className="text-xs text-gray-400">Dirección de email</label>
              <input type="email" value={el.actionEmail || ''} onChange={(e) => onChange({ actionEmail: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="contacto@empresa.com" />
            </div>
          )}
        </div>
      )}
      {(el.kind === 'contact-actions' || el.kind === 'contact-social') && (
        <div className="space-y-3 border-t border-gray-700 pt-3">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Acciones de Contacto</p>
          <button
            onClick={() => {
              const prefilled = (el.contactActions || []).map(action => {
                if (action.type === 'tel' && MOCK_USER_DATA.phone) return { ...action, value: MOCK_USER_DATA.phone };
                if (action.type === 'wa') return { ...action, value: MOCK_USER_DATA.whatsapp || MOCK_USER_DATA.phone || '' };
                if (action.type === 'email' && MOCK_USER_DATA.email) return { ...action, value: MOCK_USER_DATA.email };
                return action;
              });
              onChange({ contactActions: prefilled });
            }}
            className="w-full py-1.5 text-xs bg-blue-600/20 border border-blue-500/40 rounded text-blue-300 hover:bg-blue-600/40 flex items-center justify-center gap-1"
          >
            ⚡ Pre-llenar con datos del asesor demo
          </button>
          {(el.contactActions || []).map((action, idx) => (
            <div key={action.id} className="bg-gray-700 rounded-lg p-2 space-y-2">
              <div className="flex items-center gap-1">
                <select value={action.type}
                  onChange={(e) => {
                    const updated = [...(el.contactActions || [])];
                    updated[idx] = { ...updated[idx], type: e.target.value as ContactAction['type'], icon: e.target.value };
                    onChange({ contactActions: updated });
                  }}
                  className="flex-1 bg-gray-600 text-[10px] text-white rounded px-1 py-1">
                  <option value="tel">📞 Llamar</option>
                  <option value="wa">💬 WhatsApp</option>
                  <option value="email">✉️ Email</option>
                  <option value="link">🔗 Link</option>
                  <option value="instagram">📷 Instagram</option>
                  <option value="facebook">👤 Facebook</option>
                  <option value="youtube">▶️ YouTube</option>
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="twitter">🐦 Twitter</option>
                  <option value="telegram">✈️ Telegram</option>
                </select>
                <button onClick={() => {
                  const updated = (el.contactActions || []).filter((_, i) => i !== idx);
                  onChange({ contactActions: updated });
                }} className="text-red-400 hover:text-red-300 bg-gray-600 hover:bg-gray-500 rounded px-2 py-1 text-xs flex-shrink-0">✕</button>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Etiqueta del botón</label>
                <input type="text" value={action.label || ''}
                  onChange={(e) => {
                    const updated = [...(el.contactActions || [])];
                    updated[idx] = { ...updated[idx], label: e.target.value };
                    onChange({ contactActions: updated });
                  }}
                  className="w-full px-2 py-1 rounded bg-gray-600 text-[11px] text-white" placeholder="Llamar" />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[10px] text-gray-400">Fondo</label>
                  <input type="color" value={action.bgColor || '#10b981'}
                    onChange={(e) => {
                      const updated = [...(el.contactActions || [])];
                      updated[idx] = { ...updated[idx], bgColor: e.target.value };
                      onChange({ contactActions: updated });
                    }} className="w-full h-7 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Color Ícono</label>
                  <input type="color" value={action.textColor || '#ffffff'}
                    onChange={(e) => {
                      const updated = [...(el.contactActions || [])];
                      updated[idx] = { ...updated[idx], textColor: e.target.value };
                      onChange({ contactActions: updated });
                    }} className="w-full h-7 rounded cursor-pointer" />
                </div>
              </div>
              {(action.type === 'wa') && (
                <div>
                  <label className="text-[10px] text-gray-400">Número WhatsApp (con código país)</label>
                  <input type="tel" value={action.value || ''}
                    onChange={(e) => {
                      const updated = [...(el.contactActions || [])];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      onChange({ contactActions: updated });
                    }} className="w-full px-2 py-1 rounded bg-gray-600 text-[11px] text-white" placeholder="+504 9876 5432" />
                </div>
              )}
              {(action.type === 'tel') && (
                <div>
                  <label className="text-[10px] text-gray-400">Teléfono</label>
                  <input type="tel" value={action.value || ''}
                    onChange={(e) => {
                      const updated = [...(el.contactActions || [])];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      onChange({ contactActions: updated });
                    }} className="w-full px-2 py-1 rounded bg-gray-600 text-[11px] text-white" placeholder="+504 9876 5432" />
                </div>
              )}
              {(action.type === 'email') && (
                <div>
                  <label className="text-[10px] text-gray-400">Email</label>
                  <input type="email" value={action.value || ''}
                    onChange={(e) => {
                      const updated = [...(el.contactActions || [])];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      onChange({ contactActions: updated });
                    }} className="w-full px-2 py-1 rounded bg-gray-600 text-[11px] text-white" placeholder="contacto@empresa.com" />
                </div>
              )}
              {(action.type === 'link' || action.type === 'instagram' || action.type === 'facebook' || action.type === 'youtube' || action.type === 'twitter' || action.type === 'tiktok' || action.type === 'telegram') && (
                <div>
                  <label className="text-[10px] text-gray-400">URL</label>
                  <input type="url" value={action.value || ''}
                    onChange={(e) => {
                      const updated = [...(el.contactActions || [])];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      onChange({ contactActions: updated });
                    }} className="w-full px-2 py-1 rounded bg-gray-600 text-[11px] text-white" placeholder="https://..." />
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              const newAction: ContactAction = { id: `ca_${Date.now()}`, type: 'tel', label: 'Llamar', icon: 'phone', bgColor: '#10b981', textColor: '#ffffff', value: '' };
              onChange({ contactActions: [...(el.contactActions || []), newAction] });
            }}
            className="w-full py-2 border border-dashed border-gray-500 rounded-lg text-gray-400 text-xs hover:border-gray-400 hover:text-gray-300 flex items-center justify-center gap-1">
            + Agregar acción
          </button>
        </div>
      )}
      {(el.kind === 'image' || el.kind === 'video') && (
        <div>
          <label className="text-xs text-gray-400">URL de {el.kind === 'image' ? 'imagen' : 'video'}</label>
          <input type="text" value={el.src || ''} onChange={(e) => onChange({ src: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder={el.kind === 'image' ? 'https://...' : 'https://...'} />
        </div>
      )}
      {el.kind === 'embed' && (
        <div>
          <label className="text-xs text-gray-400">Embed URL</label>
          <input type="text" value={el.embedUrl || ''} onChange={(e) => onChange({ embedUrl: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="https://www.youtube.com/embed/..." />
        </div>
      )}
      {el.kind === 'html-embed' && (
        <div>
          <label className="text-xs text-gray-400">Codigo HTML</label>
          <textarea value={el.htmlContent || ''} onChange={(e) => onChange({ htmlContent: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm h-32 font-mono" placeholder="<div>Tu codigo aqui</div>" />
        </div>
      )}
      {el.kind === 'map' && (
        <div className="space-y-2 border-t border-gray-700 pt-3">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Configuración del Mapa</p>
          <div>
            <label className="text-xs text-gray-400">Título</label>
            <input type="text" value={el.text || ''} onChange={(e) => onChange({ text: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="Nuestra Ubicación" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Subtítulo</label>
            <input type="text" value={el.subtext || ''} onChange={(e) => onChange({ subtext: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="Dirección de la empresa" />
          </div>
          <div>
            <label className="text-xs text-gray-400">URL Embed de Google Maps</label>
            <input type="text" value={el.embedUrl || ''} onChange={(e) => onChange({ embedUrl: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="https://www.google.com/maps/embed?pb=..." />
            <p className="text-[10px] text-gray-500 mt-1">Ir a Google Maps → Compartir → Insertar mapa → copiar src del iframe</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">URL abrir en Google Maps</label>
            <input type="text" value={el.actionUrl || ''} onChange={(e) => onChange({ actionUrl: e.target.value })} className="w-full px-2 py-1 rounded bg-gray-700 text-sm" placeholder="https://maps.google.com/?q=..." />
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><path d="M12,16v-4M12,8h.01"/></svg>;
}

function HelpCircle({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><path d="M9.09,9a3,3,0,0,1,5.83,1c0,2-3,3-3,3"/><path d="M12,17h.01"/></svg>;
}

function BarChart2({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M18,20V10M12,20V4M6,20v-6"/></svg>;
}

function Quote({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6,17h3l2-4V7H5V17H6ZM14,17h3l2-4V7H13V17H14Z"/></svg>;
}

export default function ThemeBuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Cargando editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
