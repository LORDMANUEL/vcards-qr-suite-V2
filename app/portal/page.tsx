'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wifi } from 'lucide-react';
import { normalizePortalThemeConfig } from '../components/portal-theme-kit';

const FIELD_LABELS: Record<string, string> = {
  collectName: 'Nombre completo',
  collectEmail: 'Correo electronico',
  collectPhone: 'Telefono',
  collectCarModel: 'Vehiculo',
  collectVehicleYear: 'Ano del vehiculo',
  collectLicensePlate: 'Placa',
  rtn: 'RTN',
  vin: 'VIN',
};

const PORTAL_RUNTIME_SCRIPT = `
(function () {
  const ctx = window.__PORTAL_CONTEXT__ || {};
  const search = ctx.search || {};

  function buildPayload(input) {
    return {
      macAddress: ctx.mac || '',
      ipAddress: ctx.ip || '',
      branchId: ctx.branchId || '',
      apIdentifier: ctx.ap || '',
      name: input.collectName || input.name || '',
      email: input.collectEmail || input.email || '',
      phone: input.collectPhone || input.phone || '',
      carModel: input.collectCarModel || input.carModel || '',
      vehicleYear: input.collectVehicleYear || input.vehicleYear || '',
      licensePlate: input.collectLicensePlate || input.licensePlate || '',
      rtn: input.rtn || '',
      vin: input.vin || '',
      metadata: input,
    };
  }

  async function submitPortal(input) {
    if (!ctx.mac) {
      alert('Este portal requiere MAC para autorizar internet.');
      return;
    }

    const response = await fetch('/api/portal/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(input || {})),
    });
    const result = await response.json().catch(function () { return {}; });

    if (!response.ok || (result && result.authorization && result.authorization.success === false)) {
      throw new Error((result && result.authorization && result.authorization.message) || 'No se pudo autorizar acceso');
    }

    if (search.uamip && search.uamport) {
      const apLoginUrl = 'http://' + search.uamip + ':' + search.uamport + '/login';
      const apParams = new URLSearchParams({
        username: ctx.mac,
        password: ctx.mac,
        challenge: search.challenge || '',
        userurl: window.location.origin + '/acceso?mac=' + encodeURIComponent(ctx.mac || '') + '&branchId=' + encodeURIComponent(ctx.branchId || '') + (ctx.ap ? '&ap=' + encodeURIComponent(ctx.ap) : ''),
      });
      window.top.location.href = apLoginUrl + '?' + apParams.toString();
      return;
    }

    const next = new URLSearchParams({
      mac: ctx.mac || '',
      branchId: ctx.branchId || '',
    });
    if (ctx.ap) next.set('ap', ctx.ap);
    window.top.location.href = '/acceso?' + next.toString();
  }

  function readForm(form) {
    const fd = new FormData(form);
    return Object.fromEntries(fd.entries());
  }

  const form = document.querySelector('form[data-portal-register], form#portal-form, form[name="portal-form"]');
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      try {
        await submitPortal(readForm(form));
      } catch (err) {
        console.error(err);
        alert('No se pudo registrar la sesion del portal.');
      }
    });
  }

  const submitButtons = document.querySelectorAll('[data-portal-submit]');
  submitButtons.forEach(function (button) {
    button.addEventListener('click', async function () {
      try {
        const currentForm = form || document.querySelector('form');
        await submitPortal(currentForm ? readForm(currentForm) : {});
      } catch (err) {
        console.error(err);
        alert('No se pudo registrar la sesion del portal.');
      }
    });
  });

  window.portalConnect = submitPortal;
})();
`;

function buildPortalSrcDoc(htmlTemplate: string, cssCustom: string, context: any) {
  const safeContext = JSON.stringify(context || {}).replace(/</g, '\\u003c');
  const customCss = cssCustom || '';
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>html,body{margin:0;padding:0;min-height:100%;width:100%;}*{box-sizing:border-box;} ${customCss}</style>
  </head>
  <body>
    ${htmlTemplate}
    <script>window.__PORTAL_CONTEXT__=${safeContext};</script>
    <script>${PORTAL_RUNTIME_SCRIPT}</script>
  </body>
</html>`;
}

export default function PublicPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [sessionParams, setSessionParams] = useState({ mac: '', ip: '', branchId: '', ap: '' });
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const apCandidate =
      searchParams.get('ap') ||
      searchParams.get('ap_mac') ||
      searchParams.get('called') ||
      searchParams.get('ssid') ||
      searchParams.get('nasid') ||
      '';
    const params = {
      mac: searchParams.get('mac') || searchParams.get('client_mac') || searchParams.get('status') || '',
      ip: searchParams.get('ip') || searchParams.get('client_ip') || '',
      branchId: searchParams.get('branchId') || '',
      ap: apCandidate,
      continue_url: searchParams.get('continue_url') || searchParams.get('user_url') || searchParams.get('userurl') || '',
    };
    setSessionParams(params as any);

    const query = params.ap
      ? `ap=${params.ap}`
      : params.branchId
        ? `branchId=${params.branchId}`
        : 'slug=default';

    fetch(`/api/public/portal-info?${query}`)
      .then((res) => res.json())
      .then((data) => setPortalInfo(data))
      .finally(() => setLoading(false));
  }, []);

  const themeConfig = useMemo(() => normalizePortalThemeConfig(portalInfo?.branch?.portalTheme?.config), [portalInfo]);
  const customHtmlTemplate = portalInfo?.branch?.portalTheme?.htmlTemplate || '';
  const customCssTemplate = portalInfo?.branch?.portalTheme?.cssCustom || '';
  const hasCustomPortalTemplate = Boolean(customHtmlTemplate.trim());
  const customPortalSrcDoc = useMemo(() => {
    if (!hasCustomPortalTemplate) return '';
    return buildPortalSrcDoc(customHtmlTemplate, customCssTemplate, {
      mac: sessionParams.mac,
      ip: sessionParams.ip,
      branchId: sessionParams.branchId || portalInfo?.branch?.id || '',
      ap: sessionParams.ap || portalInfo?.accessPoint?.identifier || '',
      branchName: portalInfo?.branch?.name || 'General',
      search: {
        uamip: new URLSearchParams(window.location.search).get('uamip') || '',
        uamport: new URLSearchParams(window.location.search).get('uamport') || '',
        challenge: new URLSearchParams(window.location.search).get('challenge') || '',
      },
    });
  }, [hasCustomPortalTemplate, customHtmlTemplate, customCssTemplate, sessionParams, portalInfo]);
  const config = themeConfig.portal;
  const accessPointFields = Array.isArray(portalInfo?.accessPoint?.fields) ? portalInfo.accessPoint.fields : [];
  const visibleFields: string[] = accessPointFields.length > 0
    ? accessPointFields
    : [
        'collectName',
        'collectEmail',
        'collectPhone',
        ...(config.showFieldVehicle ? ['collectCarModel'] : []),
        ...(config.showFieldVehicleYear ? ['collectVehicleYear'] : []),
        ...(config.showFieldLicensePlate ? ['collectLicensePlate'] : []),
        ...(config.showFieldRtn ? ['rtn'] : []),
        ...(config.showFieldVin ? ['vin'] : []),
      ].filter(Boolean);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          macAddress: sessionParams.mac,
          ipAddress: sessionParams.ip,
          branchId: sessionParams.branchId || portalInfo?.branch?.id,
          apIdentifier: sessionParams.ap || portalInfo?.accessPoint?.identifier,
          name: formData.collectName,
          email: formData.collectEmail,
          phone: formData.collectPhone,
          carModel: formData.collectCarModel,
          vehicleYear: formData.collectVehicleYear,
          licensePlate: formData.collectLicensePlate,
          rtn: formData.rtn,
          vin: formData.vin,
          metadata: Object.fromEntries(Object.entries(formData).filter(([key]) => !['collectName', 'collectEmail', 'collectPhone', 'collectCarModel', 'collectVehicleYear', 'collectLicensePlate', 'rtn', 'vin'].includes(key))),
        }),
      });

      const result = await response.json();
      if (!response.ok || result?.authorization?.success === false) {
        throw new Error(result?.authorization?.message || 'No se pudo autorizar el acceso al router');
      }

      const searchParams = new URLSearchParams(window.location.search);
      const uamip = searchParams.get('uamip');
      const uamport = searchParams.get('uamport');
      const challenge = searchParams.get('challenge');
      
      // Linksys specific check
      const continueUrl = searchParams.get('continue_url') || searchParams.get('user_url');

      if (uamip && uamport) {
        const apLoginUrl = `http://${uamip}:${uamport}/login`;
        const apParams = new URLSearchParams({
          username: sessionParams.mac,
          password: sessionParams.mac,
          challenge: challenge || '',
          userurl: `${window.location.origin}/acceso?mac=${sessionParams.mac}&branchId=${sessionParams.branchId || ''}${sessionParams.ap ? `&ap=${sessionParams.ap}` : ''}`
        });
        window.location.href = `${apLoginUrl}?${apParams.toString()}`;
        return;
      }

      // If Linksys provides a continue_url, we might want to go there or to our success page
      const next = new URLSearchParams({
        mac: (sessionParams as any).mac,
        branchId: (sessionParams as any).branchId || portalInfo?.branch?.id || '',
      });
      if ((sessionParams as any).ap || portalInfo?.accessPoint?.identifier) {
        next.set('ap', (sessionParams as any).ap || portalInfo.accessPoint.identifier);
      }
      
      // Redirect to /acceso which is the "Success" landing page
      router.push(`/acceso?${next.toString()}`);
    } catch (error) {
      console.error(error);
      alert('No se pudo registrar la sesion del portal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-[#003478]" /></div>;
  }

  if (hasCustomPortalTemplate) {
    return (
      <iframe
        title="Portal custom template"
        srcDoc={customPortalSrcDoc}
        className="h-screen w-full border-0"
        sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
      />
    );
  }

  const secondarySections: Record<string, JSX.Element | null> = {
    support: config.showSupportCard ? (
      <div className="max-w-xl rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">{config.supportTitle}</p>
        <p className="mt-3 text-sm font-medium text-white/85">{config.supportText}</p>
      </div>
    ) : null,
    banners: config.showBanners && portalInfo?.banners?.length ? (
      <div className="max-w-2xl overflow-hidden rounded-[28px] border border-white/15 bg-white/10 backdrop-blur">
        <img src={portalInfo.banners[0].imageUrl} alt={portalInfo.banners[0].name} className="h-48 w-full object-cover" />
      </div>
    ) : null,
    promotions: config.showPromotions && portalInfo?.promotions?.length ? (
      <section className="rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur">
        <h3 className="text-lg font-black text-white">{config.sectionTitlePromotions}</h3>
        <div className="mt-4 grid gap-4">
          {portalInfo.promotions.slice(0, 2).map((promo: any) => (
            <a key={promo.id} href={promo.targetUrl || '#'} target="_blank" rel="noreferrer" className="rounded-3xl bg-white/90 p-4 text-slate-800 transition hover:bg-white">
              <div className="flex items-center gap-4">
                {promo.imageUrl ? <img src={promo.imageUrl} alt={promo.title} className="h-20 w-28 rounded-2xl object-cover" /> : null}
                <div>
                  <p className="text-base font-black">{promo.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{promo.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    ) : null,
    links: config.showQuickLinks && portalInfo?.links?.length ? (
      <section className="rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur">
        <h3 className="text-lg font-black text-white">{config.sectionTitleLinks}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {portalInfo.links.slice(0, 4).map((link: any) => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="rounded-2xl bg-white/90 px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-white">
              {link.name}
            </a>
          ))}
        </div>
      </section>
    ) : null,
  };

  return (
    <div className="min-h-screen" style={{ background: config.bgGradient ? `linear-gradient(160deg, ${config.bgColor}, ${config.gradientTo})` : config.bgColor }}>
      {config.bgImageUrl ? (
        <img src={config.bgImageUrl} alt="Portal background" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: config.bgOpacity / 100, filter: `blur(${config.bgBlur}px)` }} />
      ) : null}
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] backdrop-blur">
              <Wifi className="h-4 w-4" /> Portal cautivo activo
            </div>
            <h1 className="mt-6 text-5xl font-black leading-none" style={{ maxWidth: config.contentMaxWidth }}>{config.welcomeTitle}</h1>
            <p className="mt-5 text-lg font-medium text-white/80" style={{ maxWidth: Math.min(config.contentMaxWidth, 620) }}>{config.welcomeSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest text-white/70">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Sucursal: {portalInfo?.branch?.name || 'General'}</span>
              {portalInfo?.accessPoint?.name ? <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">AP: {portalInfo.accessPoint.name}</span> : null}
              {sessionParams.mac ? <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">MAC detectada</span> : null}
            </div>
            {config.featureChips?.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {config.featureChips.filter(Boolean).map((chip, index) => (
                  <span key={`${chip}-${index}`} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur">{chip}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-8 space-y-8">
              {config.sectionOrder.filter((sectionId) => ['support', 'banners'].includes(sectionId)).map((sectionId) => (
                <div key={sectionId}>{secondarySections[sectionId]}</div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/60 bg-white/92 p-7 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur" style={{ maxWidth: config.cardMaxWidth, width: '100%', justifySelf: 'end' }}>
            {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="mb-5 h-12 object-contain" /> : null}
            <h2 className="text-2xl font-black" style={{ color: config.primaryColor }}>Acceso portal</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Tus datos habilitan temporalmente internet para este dispositivo.</p>

            <div className="mt-6 space-y-3">
              {visibleFields.map((field) => (
                <input
                  key={field}
                  type={field === 'collectEmail' ? 'email' : field === 'collectPhone' ? 'tel' : 'text'}
                  placeholder={FIELD_LABELS[field] || field}
                  value={formData[field] || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2"
                  style={{ borderColor: `${config.accentColor}33` }}
                />
              ))}
            </div>

            <button onClick={handleSubmit} disabled={submitting || !sessionParams.mac} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white disabled:opacity-60" style={{ backgroundColor: config.buttonColor }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              {submitting ? 'Autorizando...' : config.buttonText}
            </button>

            {!sessionParams.mac ? <p className="mt-4 text-xs font-bold text-amber-600">Este portal requiere que el router envie la MAC del dispositivo para autorizar internet.</p> : null}
          </section>
        </div>

        {config.sectionOrder.some((sectionId) => ['promotions', 'links'].includes(sectionId)) ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {config.sectionOrder.filter((sectionId) => ['promotions', 'links'].includes(sectionId)).map((sectionId) => (
              <div key={sectionId}>{secondarySections[sectionId]}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
