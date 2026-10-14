'use client';

import { CarFront, Wrench, ShieldCheck } from 'lucide-react';
import { detectVCardBrand } from '@/lib/vcard-profile';

interface Props {
  company: string;
  branch?: string;
  imageUrl?: string | null;
}

export function AutomotiveBrandHero({
  company,
  branch,
  imageUrl,
}: Props) {
  const brand = detectVCardBrand(company, branch);

  const designs = {
    ford: {
      title: 'FORD YUDE',
      subtitle: 'Innovación, confianza y respaldo',
      headline: 'TU CAMINO, NUESTRA PASIÓN',
      primary: '#003478',
      accent: '#5AA7FF',
    },
    gac: {
      title: 'GAC YUDE',
      subtitle: 'Tecnología y diseño en movimiento',
      headline: 'EL FUTURO TE ACOMPAÑA',
      primary: '#101827',
      accent: '#E53935',
    },
    quicklane: {
      title: 'QUICK LANE',
      subtitle: 'Servicio express automotriz',
      headline: 'TU VEHÍCULO EN LAS MEJORES MANOS',
      primary: '#101B31',
      accent: '#FF7515',
    },
    generic: {
      title: company || 'VCARD CORPORATIVA',
      subtitle: branch || 'Contacto digital',
      headline: 'ESTAMOS PARA AYUDARTE',
      primary: '#172033',
      accent: '#5FA8D3',
    },
  };

  const design = designs[brand];

  return (
    <section
      className="automotive-hero mx-auto mb-5 w-full max-w-5xl overflow-hidden rounded-3xl text-white shadow-2xl"
      style={{
        backgroundColor: design.primary,
        backgroundImage: imageUrl
          ? `linear-gradient(90deg, rgba(5,12,26,.96),rgba(5,12,26,.55)),url("${imageUrl}")`
          : `linear-gradient(120deg,${design.primary},#07101D)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative min-h-[230px] overflow-hidden p-6 sm:min-h-[300px] sm:p-9 lg:min-h-[350px]">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">
            VCARD CORPORATIVA
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
            {design.title}
          </h2>

          <p className="mt-2 text-sm opacity-80">
            {design.subtitle}
          </p>

          <div
            className="my-5 h-1 w-20 rounded-full"
            style={{ backgroundColor: design.accent }}
          />

          <h3 className="max-w-md text-xl font-extrabold leading-tight sm:text-3xl">
            {design.headline}
          </h3>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-2">
              <Wrench size={16} />
              Servicio
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Confianza
            </span>
            <span className="flex items-center gap-2">
              <CarFront size={16} />
              Experiencia
            </span>
          </div>
        </div>

        <CarFront
          aria-hidden="true"
          className="auto-car absolute bottom-2 right-0 h-32 w-32 opacity-20 sm:h-56 sm:w-56"
        />

        <div
          aria-hidden="true"
          className="auto-light absolute -bottom-8 right-[-10%] h-24 w-[75%] rotate-[-14deg] opacity-40 blur-2xl"
          style={{ backgroundColor: design.accent }}
        />
      </div>

      <style jsx>{`
        @keyframes car-enter {
          from { transform: translateX(35px); opacity: 0; }
          to { transform: translateX(0); opacity: .20; }
        }

        @keyframes light-move {
          0%, 100% { transform: translateX(-12%) rotate(-14deg); }
          50% { transform: translateX(12%) rotate(-14deg); }
        }

        .automotive-hero :global(.auto-car) {
          animation: car-enter 900ms ease-out both;
        }

        .auto-light {
          animation: light-move 7s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .automotive-hero :global(.auto-car),
          .auto-light {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
