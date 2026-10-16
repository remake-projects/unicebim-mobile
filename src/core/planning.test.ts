import { describe, expect, it } from 'vitest';

import { brandIconUrl, guessBrandDomain } from './brand-icon';
import { monthlySubscriptionsTotal, nextRenewalOnOrAfter, renewalAfter } from './subscriptions';
import { addMonthsToYmd } from './time';

describe('addMonthsToYmd', () => {
  it('keeps the day and clamps to month ends', () => {
    expect(addMonthsToYmd('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonthsToYmd('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToYmd('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonthsToYmd('2026-12-31', 2)).toBe('2027-02-28');
    expect(addMonthsToYmd('2026-03-31', -1)).toBe('2026-02-28');
  });
});

describe('subscriptions', () => {
  it('keeps a renewal that is still ahead', () => {
    expect(nextRenewalOnOrAfter('2026-10-20', 'monthly', '2026-10-16')).toBe('2026-10-20');
    expect(nextRenewalOnOrAfter('2026-10-16', 'monthly', '2026-10-16')).toBe('2026-10-16');
  });

  it('rolls a passed renewal forward by whole cycles from the stored date', () => {
    expect(nextRenewalOnOrAfter('2026-01-31', 'monthly', '2026-03-01')).toBe('2026-03-31');
    expect(nextRenewalOnOrAfter('2026-01-31', 'monthly', '2026-02-10')).toBe('2026-02-28');
    expect(nextRenewalOnOrAfter('2024-02-29', 'yearly', '2026-10-16')).toBe('2027-02-28');
  });

  it('suggests the next renewal for a new subscription', () => {
    expect(renewalAfter('2026-10-16', 'monthly')).toBe('2026-11-16');
    expect(renewalAfter('2026-10-16', 'yearly')).toBe('2027-10-16');
  });

  it('totals active subscriptions per month', () => {
    expect(
      monthlySubscriptionsTotal([
        { amount: 100, billingCycle: 'monthly', isActive: true },
        { amount: 1200, billingCycle: 'yearly', isActive: true },
        { amount: 50, billingCycle: 'monthly', isActive: false },
      ])
    ).toBe(200);
    expect(monthlySubscriptionsTotal([])).toBe(0);
  });
});

describe('brand icon', () => {
  it('guesses domains from service names', () => {
    expect(guessBrandDomain('Spotify Premium')).toBe('spotify.com');
    expect(guessBrandDomain('Netflix')).toBe('netflix.com');
    expect(guessBrandDomain('Disney+')).toBe('disneyplus.com');
    expect(guessBrandDomain('YouTube Premium Aile')).toBe('youtube.com');
    expect(guessBrandDomain('ChatGPT Plus')).toBe('openai.com');
    expect(guessBrandDomain('BluTV')).toBe('blutv.com');
    expect(guessBrandDomain('Spor Salonu')).toBe('sporsalonu.com');
  });

  it('gives up when nothing usable is left', () => {
    expect(guessBrandDomain('Premium')).toBeNull();
    expect(guessBrandDomain('?')).toBeNull();
    expect(brandIconUrl('')).toBeNull();
    expect(brandIconUrl('Netflix')).toBe('https://unavatar.io/netflix.com?fallback=false');
  });
});
