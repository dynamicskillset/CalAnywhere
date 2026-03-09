import { generateEmojiId, isValidEmojiId, generateUniqueEmojiId, isEmojiIdTaken } from '../auth/emoji-id';
import { EMOJI_ALPHABET, ID_LENGTH } from '../auth/emoji-alphabet';

function graphemes(s: string): string[] {
  const seg = new (Intl as any).Segmenter();
  return Array.from(seg.segment(s) as Iterable<{ segment: string }>).map((x: { segment: string }) => x.segment);
}

function mockPool(rows: unknown[][] = [[]]): any {
  return { query: jest.fn().mockResolvedValue({ rows: rows[0] !== undefined ? rows.shift()! : [] }) };
}

describe('generateEmojiId', () => {
  it('returns exactly ID_LENGTH grapheme clusters', () => {
    for (let i = 0; i < 20; i++) {
      expect(graphemes(generateEmojiId())).toHaveLength(ID_LENGTH);
    }
  });

  it('only uses emoji from the alphabet', () => {
    for (let i = 0; i < 20; i++) {
      const id = generateEmojiId();
      graphemes(id).forEach(e => expect(EMOJI_ALPHABET).toContain(e));
    }
  });

  it('produces different values across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateEmojiId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('isValidEmojiId', () => {
  it('accepts a valid 3-emoji ID', () => {
    const id = generateEmojiId();
    expect(isValidEmojiId(id)).toBe(true);
  });

  it('rejects a string with too few emoji', () => {
    expect(isValidEmojiId('🐶🍕')).toBe(false);
  });

  it('rejects a string with too many emoji', () => {
    expect(isValidEmojiId('🐶🍕🚀🎸')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmojiId('')).toBe(false);
  });

  it('rejects ASCII text', () => {
    expect(isValidEmojiId('abc')).toBe(false);
  });

  it('rejects emoji outside the alphabet', () => {
    // 🤡 is not in the curated alphabet
    expect(isValidEmojiId('🤡🤡🤡')).toBe(false);
  });

  it('rejects a mix of valid and invalid emoji', () => {
    expect(isValidEmojiId('🐶🤡🍕')).toBe(false);
  });
});

describe('generateUniqueEmojiId', () => {
  it('returns an ID on first attempt when not taken', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const id = await generateUniqueEmojiId(pool as any);
    expect(isValidEmojiId(id)).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('retries when the first ID is taken', async () => {
    const pool = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // first taken
        .mockResolvedValueOnce({ rows: [] }),                  // second free
    };
    const id = await generateUniqueEmojiId(pool as any);
    expect(isValidEmojiId(id)).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('throws after maxAttempts when all IDs are taken', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) };
    await expect(generateUniqueEmojiId(pool as any, 3)).rejects.toThrow();
    expect(pool.query).toHaveBeenCalledTimes(3);
  });
});

describe('isEmojiIdTaken', () => {
  it('returns true when a row exists', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{}] }) };
    expect(await isEmojiIdTaken(pool as any, '🐶🍕🚀')).toBe(true);
  });

  it('returns false when no row exists', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    expect(await isEmojiIdTaken(pool as any, '🐶🍕🚀')).toBe(false);
  });
});
