import { describe, it, expect } from 'vitest';
import { generateRequestId } from './requestId';

describe('generateRequestId', () => {
  it('returns incrementing ids with req_ prefix', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).toMatch(/^req_\d+$/);
    expect(id2).toMatch(/^req_\d+$/);
    expect(id1).not.toBe(id2);
  });
});
