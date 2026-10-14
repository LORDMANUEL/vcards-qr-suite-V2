import { CaptiveProvider, CaptiveAuthorizeInput, CaptiveProviderResult, CaptiveRevokeInput } from '../types';

function buildMessage(action: 'authorize' | 'revoke', input: CaptiveAuthorizeInput | CaptiveRevokeInput) {
  const target = input.accessPointName || input.accessPointIdentifier;
  return action === 'authorize'
    ? `Manual authorization registered for ${target}`
    : `Manual revoke registered for ${target}`;
}

export class ManualCaptiveProvider implements CaptiveProvider {
  async authorizeClient(input: CaptiveAuthorizeInput): Promise<CaptiveProviderResult> {
    return {
      success: true,
      mode: 'manual',
      provider: 'MANUAL',
      externalRef: `manual-${input.accessPointIdentifier}-${Date.now()}`,
      message: buildMessage('authorize', input),
      payload: input,
    };
  }

  async revokeClient(input: CaptiveRevokeInput): Promise<CaptiveProviderResult> {
    return {
      success: true,
      mode: 'manual',
      provider: 'MANUAL',
      externalRef: `manual-revoke-${input.accessPointIdentifier}-${Date.now()}`,
      message: buildMessage('revoke', input),
      payload: input,
    };
  }
}
