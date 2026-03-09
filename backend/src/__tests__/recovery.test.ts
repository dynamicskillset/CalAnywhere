import { generateRecoveryCodes, consumeRecoveryCode, remainingRecoveryCodes } from '../auth/recovery';

describe('generateRecoveryCodes', () => {
  it('returns exactly 5 codes', () => {
    expect(generateRecoveryCodes()).toHaveLength(5);
  });

  it('each code has plain, hash, and salt fields', () => {
    for (const code of generateRecoveryCodes()) {
      expect(typeof code.plain).toBe('string');
      expect(typeof code.hash).toBe('string');
      expect(typeof code.salt).toBe('string');
    }
  });

  it('plain codes are 32-char hex strings (128-bit entropy)', () => {
    for (const code of generateRecoveryCodes()) {
      expect(code.plain).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it('all plain codes within a batch are unique', () => {
    const codes = generateRecoveryCodes();
    const plains = codes.map(c => c.plain);
    expect(new Set(plains).size).toBe(5);
  });

  it('hashes differ from plain codes', () => {
    for (const code of generateRecoveryCodes()) {
      expect(code.hash).not.toBe(code.plain);
    }
  });

  it('produces different codes across calls', () => {
    const a = generateRecoveryCodes().map(c => c.plain);
    const b = generateRecoveryCodes().map(c => c.plain);
    expect(a).not.toEqual(b);
  });
});

describe('consumeRecoveryCode', () => {
  function makePool(storedCodes: Array<{ id: number; hash: string; salt: string; used: boolean }>) {
    return {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: storedCodes })   // SELECT unused codes
        .mockResolvedValue({ rows: [] }),               // UPDATE used = true
    };
  }

  it('returns true and updates the code when a valid code is supplied', async () => {
    const [code] = generateRecoveryCodes();
    const pool = makePool([{ id: 1, hash: code.hash, salt: code.salt, used: false }]);

    expect(await consumeRecoveryCode(pool as any, 'user-1', code.plain)).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(2,
      'UPDATE recovery_codes SET used = true WHERE id = $1',
      [1]
    );
  });

  it('returns false when the code does not match', async () => {
    const [code] = generateRecoveryCodes();
    const pool = makePool([{ id: 1, hash: code.hash, salt: code.salt, used: false }]);

    expect(await consumeRecoveryCode(pool as any, 'user-1', 'wrongcode')).toBe(false);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('returns false when there are no unused codes', async () => {
    const pool = makePool([]);
    expect(await consumeRecoveryCode(pool as any, 'user-1', 'anycode')).toBe(false);
  });

  it('skips codes with mismatched hash lengths without throwing', async () => {
    const pool = makePool([{ id: 1, hash: 'tooshort', salt: 'a'.repeat(64), used: false }]);
    expect(await consumeRecoveryCode(pool as any, 'user-1', 'anycode')).toBe(false);
  });

  it('matches only the correct code when multiple unused codes exist', async () => {
    const codes = generateRecoveryCodes();
    const storedCodes = codes.map((c, i) => ({ id: i + 1, hash: c.hash, salt: c.salt, used: false }));
    const pool = makePool(storedCodes);

    // Use the third code
    expect(await consumeRecoveryCode(pool as any, 'user-1', codes[2].plain)).toBe(true);
    expect(pool.query).toHaveBeenNthCalledWith(2,
      'UPDATE recovery_codes SET used = true WHERE id = $1',
      [3]
    );
  });
});

describe('remainingRecoveryCodes', () => {
  it('returns the count from the database', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ count: '3' }] }) };
    expect(await remainingRecoveryCodes(pool as any, 'user-1')).toBe(3);
  });

  it('returns 0 when all codes are used', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ count: '0' }] }) };
    expect(await remainingRecoveryCodes(pool as any, 'user-1')).toBe(0);
  });
});
