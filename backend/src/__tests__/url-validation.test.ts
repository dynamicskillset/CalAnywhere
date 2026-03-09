import dns from 'dns';
import { isSafeToFetch } from '../auth/url-validation';

jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

const mockLookup = dns.promises.lookup as jest.Mock;

function mockResolve(address: string, family: 4 | 6 = 4) {
  mockLookup.mockResolvedValue({ address, family });
}

describe('isSafeToFetch — protocol checks', () => {
  it('rejects http URLs', async () => {
    expect(await isSafeToFetch('http://example.com/cal.ics')).toBe(false);
  });

  it('rejects ftp URLs', async () => {
    expect(await isSafeToFetch('ftp://example.com/cal.ics')).toBe(false);
  });

  it('accepts https URLs that resolve to a public IP', async () => {
    mockResolve('93.184.216.34');
    expect(await isSafeToFetch('https://example.com/cal.ics')).toBe(true);
  });

  it('accepts webcal URLs that resolve to a public IP', async () => {
    mockResolve('93.184.216.34');
    expect(await isSafeToFetch('webcal://example.com/cal.ics')).toBe(true);
  });
});

describe('isSafeToFetch — blocked hostnames', () => {
  it('blocks localhost', async () => {
    expect(await isSafeToFetch('https://localhost/cal.ics')).toBe(false);
  });

  it('blocks metadata.google.internal', async () => {
    expect(await isSafeToFetch('https://metadata.google.internal/cal.ics')).toBe(false);
  });

  it('blocks metadata.goog', async () => {
    expect(await isSafeToFetch('https://metadata.goog/cal.ics')).toBe(false);
  });

  it('blocks bare "metadata" hostname', async () => {
    expect(await isSafeToFetch('https://metadata/cal.ics')).toBe(false);
  });
});

describe('isSafeToFetch — IP literals', () => {
  it('blocks 127.0.0.1 (loopback)', async () => {
    expect(await isSafeToFetch('https://127.0.0.1/cal.ics')).toBe(false);
  });

  it('blocks 127.255.255.255 (loopback range)', async () => {
    expect(await isSafeToFetch('https://127.255.255.255/cal.ics')).toBe(false);
  });

  it('blocks 10.0.0.1 (private)', async () => {
    expect(await isSafeToFetch('https://10.0.0.1/cal.ics')).toBe(false);
  });

  it('blocks 172.16.0.1 (private)', async () => {
    expect(await isSafeToFetch('https://172.16.0.1/cal.ics')).toBe(false);
  });

  it('blocks 172.31.255.255 (private boundary)', async () => {
    expect(await isSafeToFetch('https://172.31.255.255/cal.ics')).toBe(false);
  });

  it('allows 172.15.0.1 (just outside private range)', async () => {
    // 172.15.x is public; isSafeToFetch resolves the IP literal directly
    expect(await isSafeToFetch('https://172.15.0.1/cal.ics')).toBe(true);
  });

  it('allows 172.32.0.1 (just outside private range)', async () => {
    expect(await isSafeToFetch('https://172.32.0.1/cal.ics')).toBe(true);
  });

  it('blocks 192.168.1.1 (private)', async () => {
    expect(await isSafeToFetch('https://192.168.1.1/cal.ics')).toBe(false);
  });

  it('blocks 169.254.169.254 (link-local / AWS metadata)', async () => {
    expect(await isSafeToFetch('https://169.254.169.254/cal.ics')).toBe(false);
  });

  it('blocks 0.0.0.0 (unspecified)', async () => {
    expect(await isSafeToFetch('https://0.0.0.0/cal.ics')).toBe(false);
  });

  it('blocks IPv6 literals (including ::1)', async () => {
    expect(await isSafeToFetch('https://[::1]/cal.ics')).toBe(false);
  });

  it('blocks other IPv6 literals', async () => {
    expect(await isSafeToFetch('https://[2001:db8::1]/cal.ics')).toBe(false);
  });
});

describe('isSafeToFetch — DNS resolution', () => {
  it('blocks hostname resolving to private IP', async () => {
    mockResolve('192.168.1.100');
    expect(await isSafeToFetch('https://internal.corp.example.com/cal.ics')).toBe(false);
  });

  it('blocks hostname resolving to loopback', async () => {
    mockResolve('127.0.0.1');
    expect(await isSafeToFetch('https://sneaky.example.com/cal.ics')).toBe(false);
  });

  it('allows hostname resolving to public IP', async () => {
    mockResolve('93.184.216.34');
    expect(await isSafeToFetch('https://example.com/cal.ics')).toBe(true);
  });

  it('blocks when DNS resolution fails', async () => {
    mockLookup.mockRejectedValue(new Error('ENOTFOUND'));
    expect(await isSafeToFetch('https://nonexistent.invalid/cal.ics')).toBe(false);
  });

  it('allows IPv6 public address from DNS', async () => {
    mockResolve('2606:2800:220:1:248:1893:25c8:1946', 6);
    expect(await isSafeToFetch('https://example.com/cal.ics')).toBe(true);
  });

  it('blocks ::1 returned from DNS', async () => {
    mockResolve('::1', 6);
    expect(await isSafeToFetch('https://sneaky.example.com/cal.ics')).toBe(false);
  });
});
