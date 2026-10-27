import assert from 'node:assert/strict';
import test from 'node:test';
import { cardCreationError, validateAdvisorCardCreation, type ExistingAdvisorAccount } from '../lib/vcard-account-integrity';

const advisor = (patch: Partial<ExistingAdvisorAccount> = {}): ExistingAdvisorAccount => ({
  branchId: 'sps',
  role: 'ADVISOR',
  isSystemUser: false,
  isActive: true,
  vcards: [],
  ...patch,
});

test('new user and valid existing advisor in same branch can create their first card', () => {
  assert.equal(validateAdvisorCardCreation(null, 'sps'), null);
  assert.equal(validateAdvisorCardCreation(advisor(), 'sps'), null);
});
test('never convert an administrative or system account into an advisor', () => {
  assert.equal(validateAdvisorCardCreation(advisor({ role: 'SUPER_ADMIN' }), 'sps'), 'PROTECTED_USER');
  assert.equal(validateAdvisorCardCreation(advisor({ isSystemUser: true }), 'sps'), 'PROTECTED_USER');
});
test('disabled accounts stay disabled', () => {
  assert.equal(validateAdvisorCardCreation(advisor({ isActive: false }), 'sps'), 'INACTIVE_USER');
});
test('existing user cannot be silently moved to another branch', () => {
  assert.equal(validateAdvisorCardCreation(advisor(), 'tgu'), 'ACCOUNT_OTHER_BRANCH');
  assert.equal(validateAdvisorCardCreation(advisor({ branchId: null }), 'sps'), null);
});
test('old cards in other branch block account migration, even if user branch is null', () => {
  assert.equal(validateAdvisorCardCreation(advisor({ branchId: null, vcards: [{ branchId: 'tgu' }] }), 'sps'), 'CARD_OTHER_BRANCH');
});
test('same-branch duplicate card rejected BEFORE user modifications', () => {
  assert.equal(validateAdvisorCardCreation(advisor({ vcards: [{ branchId: 'sps' }] }), 'sps'), 'CARD_ALREADY_EXISTS');
});
test('each conflict has actionable error text', () => {
  for (const key of ['PROTECTED_USER', 'INACTIVE_USER', 'ACCOUNT_OTHER_BRANCH', 'CARD_OTHER_BRANCH', 'CARD_ALREADY_EXISTS'] as const) {
    assert.ok(cardCreationError[key].length > 20);
  }
});
