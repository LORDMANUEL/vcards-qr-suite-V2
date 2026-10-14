import { CaptiveProvider, CaptiveAuthorizeInput, CaptiveProviderResult, CaptiveRevokeInput } from '../types';

function resolveEndpoint(kind: 'authorize' | 'revoke', input: { externalUrl?: string | null; accessPointIdentifier: string }) {
  const envEndpoint = kind === 'authorize' ? process.env.CUDY_AUTH_ENDPOINT : process.env.CUDY_REVOKE_ENDPOINT;
  if (envEndpoint) {
    return envEndpoint
      .replace('{identifier}', input.accessPointIdentifier)
      .replace('{ap}', input.accessPointIdentifier);
  }

  if (!input.externalUrl) {
    return null;
  }

  const base = input.externalUrl.replace(/\/$/, '');
  return `${base}/${kind}`;
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.CUDY_API_TOKEN ? { Authorization: `Bearer ${process.env.CUDY_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = text;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {}

  return { ok: response.ok, status: response.status, payload };
}

export class CudyCaptiveProvider implements CaptiveProvider {
  async authorizeClient(input: CaptiveAuthorizeInput): Promise<CaptiveProviderResult> {
    const endpoint = resolveEndpoint('authorize', input);
    if (!endpoint) {
      return {
        success: true,
        mode: 'manual',
        provider: 'CUDY',
        message: 'CUDY endpoint not configured, authorization kept in manual mode',
        payload: input,
      };
    }

    const result = await postJson(endpoint, {
      macAddress: input.macAddress,
      ipAddress: input.ipAddress,
      accessPointIdentifier: input.accessPointIdentifier,
      durationMinutes: input.durationMinutes,
      radiusNasId: input.radiusNasId,
      radiusSecret: input.radiusSecret,
      uamServer: input.uamServer,
      uamAllowed: input.uamAllowed,
      uamDomain: input.uamDomain,
    });

    return {
      success: result.ok,
      mode: 'router',
      provider: 'CUDY',
      externalRef: endpoint,
      message: result.ok ? 'CUDY authorization sent successfully' : `CUDY authorization failed with status ${result.status}`,
      payload: result.payload,
    };
  }

  async revokeClient(input: CaptiveRevokeInput): Promise<CaptiveProviderResult> {
    const endpoint = resolveEndpoint('revoke', input);
    if (!endpoint) {
      return {
        success: true,
        mode: 'manual',
        provider: 'CUDY',
        message: 'CUDY endpoint not configured, revoke kept in manual mode',
        payload: input,
      };
    }

    const result = await postJson(endpoint, {
      macAddress: input.macAddress,
      accessPointIdentifier: input.accessPointIdentifier,
      radiusNasId: input.radiusNasId,
      radiusSecret: input.radiusSecret,
      uamServer: input.uamServer,
    });

    return {
      success: result.ok,
      mode: 'router',
      provider: 'CUDY',
      externalRef: endpoint,
      message: result.ok ? 'CUDY revoke sent successfully' : `CUDY revoke failed with status ${result.status}`,
      payload: result.payload,
    };
  }
}
