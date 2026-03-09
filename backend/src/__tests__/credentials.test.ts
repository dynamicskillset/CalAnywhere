import { hashIcalUrl, verifyIcalUrl, isPlausibleIcalUrl } from '../auth/credentials';

describe('hashIcalUrl', () => {
  it('returns a hash and salt', () => {
    const { hash, salt } = hashIcalUrl('https://example.com/cal.ics');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a different salt on each call', () => {
    const a = hashIcalUrl('https://example.com/cal.ics');
    const b = hashIcalUrl('https://example.com/cal.ics');
    expect(a.salt).not.toBe(b.salt);
  });

  it('produces a different hash on each call (due to different salt)', () => {
    const a = hashIcalUrl('https://example.com/cal.ics');
    const b = hashIcalUrl('https://example.com/cal.ics');
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('verifyIcalUrl', () => {
  it('returns true for the correct URL', () => {
    const url = 'https://example.com/calendar.ics';
    const stored = hashIcalUrl(url);
    expect(verifyIcalUrl(url, stored)).toBe(true);
  });

  it('returns false for a different URL', () => {
    const stored = hashIcalUrl('https://example.com/calendar.ics');
    expect(verifyIcalUrl('https://example.com/other.ics', stored)).toBe(false);
  });

  it('returns false for a URL that differs only by trailing slash', () => {
    const stored = hashIcalUrl('https://example.com/calendar.ics');
    expect(verifyIcalUrl('https://example.com/calendar.ics/', stored)).toBe(false);
  });

  it('returns false when stored hash length mismatches (does not throw)', () => {
    const stored = { hash: 'tooshort', salt: 'a'.repeat(64) };
    expect(() => verifyIcalUrl('https://example.com/cal.ics', stored)).not.toThrow();
    expect(verifyIcalUrl('https://example.com/cal.ics', stored)).toBe(false);
  });

  it('returns false when stored salt is empty', () => {
    const stored = { hash: 'a'.repeat(64), salt: '' };
    expect(verifyIcalUrl('https://example.com/cal.ics', stored)).toBe(false);
  });
});

describe('isPlausibleIcalUrl', () => {
  it('accepts https URLs', () => {
    expect(isPlausibleIcalUrl('https://calendar.google.com/feed.ics')).toBe(true);
  });

  it('accepts webcal URLs', () => {
    expect(isPlausibleIcalUrl('webcal://example.com/calendar.ics')).toBe(true);
  });

  it('rejects http URLs', () => {
    expect(isPlausibleIcalUrl('http://example.com/calendar.ics')).toBe(false);
  });

  it('rejects ftp URLs', () => {
    expect(isPlausibleIcalUrl('ftp://example.com/calendar.ics')).toBe(false);
  });

  it('rejects bare strings', () => {
    expect(isPlausibleIcalUrl('not-a-url')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isPlausibleIcalUrl('')).toBe(false);
  });

  it('rejects a URL with no hostname', () => {
    expect(isPlausibleIcalUrl('https://')).toBe(false);
  });
});
