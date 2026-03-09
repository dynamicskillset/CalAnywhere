import { createHash } from 'crypto';
import { createSession, validateSession, deleteSession, purgeExpiredSessions } from '../auth/session';

function sha256(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

describe('createSession', () => {
  it('returns a 64-char hex token', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const token = await createSession(pool as any, 'user-1');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stores the SHA-256 hash of the token, not the token itself', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const token = await createSession(pool as any, 'user-1');
    const storedHash = pool.query.mock.calls[0][1][1];
    expect(storedHash).toBe(sha256(token));
    expect(storedHash).not.toBe(token);
  });

  it('generates a different token on each call', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const a = await createSession(pool as any, 'user-1');
    const b = await createSession(pool as any, 'user-1');
    expect(a).not.toBe(b);
  });
});

describe('validateSession', () => {
  it('returns session data when a valid row is found', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [{ user_id: 'user-1', emoji_id: '🐶🍕🚀' }],
      }),
    };
    const result = await validateSession(pool as any, 'sometoken');
    expect(result).toEqual({ userId: 'user-1', emojiId: '🐶🍕🚀' });
  });

  it('queries using the hash of the token, not the plain token', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const token = 'plaintexttoken';
    await validateSession(pool as any, token);
    const queryHash = pool.query.mock.calls[0][1][0];
    expect(queryHash).toBe(sha256(token));
  });

  it('returns null when no row is found', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    expect(await validateSession(pool as any, 'expiredtoken')).toBeNull();
  });
});

describe('deleteSession', () => {
  it('deletes using the hash of the token', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const token = 'tokenToDelete';
    await deleteSession(pool as any, token);
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM sessions WHERE token_hash = $1',
      [sha256(token)]
    );
  });
});

describe('purgeExpiredSessions', () => {
  it('calls DELETE with expires_at condition', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    await purgeExpiredSessions(pool as any);
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM sessions WHERE expires_at <= NOW()'
    );
  });
});
