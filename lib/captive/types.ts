import { AccessPointProvider } from '@prisma/client';

export interface CaptiveAuthorizeInput {
  macAddress: string;
  ipAddress?: string | null;
  accessPointIdentifier: string;
  durationMinutes?: number;
  accessPointName?: string;
  externalUrl?: string | null;
  radiusNasId?: string | null;
  radiusSecret?: string | null;
  uamServer?: string | null;
  uamAllowed?: string[] | null;
  uamDomain?: string[] | null;
}

export interface CaptiveRevokeInput {
  macAddress: string;
  accessPointIdentifier: string;
  accessPointName?: string;
  externalUrl?: string | null;
  radiusNasId?: string | null;
  radiusSecret?: string | null;
  uamServer?: string | null;
}

export interface CaptiveProviderResult {
  success: boolean;
  mode: 'router' | 'manual';
  provider: AccessPointProvider | 'MANUAL';
  externalRef?: string;
  message?: string;
  payload?: unknown;
}

export interface CaptiveProvider {
  authorizeClient(input: CaptiveAuthorizeInput): Promise<CaptiveProviderResult>;
  revokeClient(input: CaptiveRevokeInput): Promise<CaptiveProviderResult>;
}
