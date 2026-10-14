'use client';

import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

type TourStep = {
  id: string;
  selector: string;
  title: string;
  description: string;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  tourId: string;
  title: string;
  steps: TourStep[];
  autoStart?: boolean;
};

const OVERLAY_Z = 90;

export function VCardsGuidedTour({ tourId, title, steps, autoStart = true }: Props) {
  const storageKey = useMemo(() => `vcards-tour-completed-${tourId}`, [tourId]);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const activeStep = steps[stepIndex];

  const closeTour = (markCompleted: boolean) => {
    if (markCompleted && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    setOpen(false);
    setStepIndex(0);
    setRect(null);
  };

  const refreshSpotlight = () => {
    if (!open || !activeStep) {
      setRect(null);
      return;
    }
    const el = document.querySelector(activeStep.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const pad = 10;
    setRect({
      top: Math.max(0, r.top - pad),
      left: Math.max(0, r.left - pad),
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !autoStart) return;
    const alreadyDone = localStorage.getItem(storageKey) === 'true';
    if (!alreadyDone) {
      setOpen(true);
      setStepIndex(0);
    }
  }, [autoStart, storageKey]);

  useEffect(() => {
    if (!open) return;
    refreshSpotlight();

    const onScroll = () => refreshSpotlight();
    const onResize = () => refreshSpotlight();

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, stepIndex]);

  const next = () => {
    if (stepIndex >= steps.length - 1) {
      closeTour(true);
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const prev = () => setStepIndex((prev) => Math.max(0, prev - 1));

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setStepIndex(0);
        }}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#003478] px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-200 hover:bg-[#002557]"
        aria-label="Abrir ayuda guiada"
        title="Abrir ayuda guiada"
      >
        <HelpCircle className="h-5 w-5" />
        Ayuda paso a paso
      </button>

      {open && activeStep && (
        <div className="fixed inset-0" style={{ zIndex: OVERLAY_Z }}>
          <div className="absolute inset-0 bg-black/55" />

          {rect && (
            <>
              <div
                className="absolute rounded-2xl border-2 border-[#60a5fa] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all duration-300"
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
              />
              <div
                className="absolute rounded-2xl border-2 border-[#93c5fd] animate-pulse pointer-events-none"
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            </>
          )}

          <div className="absolute left-1/2 top-6 w-[min(94vw,640px)] -translate-x-1/2 rounded-2xl border border-blue-100 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">{title} · paso {stepIndex + 1}/{steps.length}</p>
                <h3 className="mt-2 text-2xl font-black text-[#003478]">{activeStep.title}</h3>
                <p className="mt-2 text-base text-gray-700">{activeStep.description}</p>
              </div>
              <button
                onClick={() => closeTour(true)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar ayuda"
                title="Cerrar ayuda"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() => closeTour(true)}
                className="rounded-lg px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Omitir tour
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  disabled={stepIndex === 0}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-black text-gray-700 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={next}
                  className="rounded-lg bg-[#003478] px-4 py-2 text-sm font-black text-white"
                >
                  {stepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
