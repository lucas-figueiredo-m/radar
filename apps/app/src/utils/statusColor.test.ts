import { describe, it, expect } from 'vitest';
import { statusColor } from './statusColor';
import { colorValues } from '@radar/design-system';

describe('statusColor', () => {
  it('returns error color for undefined', () => {
    expect(statusColor(undefined)).toBe(colorValues['status-error']);
  });

  it('returns error color for 0', () => {
    expect(statusColor(0)).toBe(colorValues['status-error']);
  });

  it('returns success color for 2xx', () => {
    expect(statusColor(200)).toBe(colorValues['status-success']);
    expect(statusColor(201)).toBe(colorValues['status-success']);
    expect(statusColor(299)).toBe(colorValues['status-success']);
  });

  it('returns warning color for 3xx', () => {
    expect(statusColor(300)).toBe(colorValues['status-warning']);
    expect(statusColor(301)).toBe(colorValues['status-warning']);
    expect(statusColor(399)).toBe(colorValues['status-warning']);
  });

  it('returns error color for 4xx', () => {
    expect(statusColor(400)).toBe(colorValues['status-error']);
    expect(statusColor(404)).toBe(colorValues['status-error']);
    expect(statusColor(499)).toBe(colorValues['status-error']);
  });

  it('returns error color for 5xx', () => {
    expect(statusColor(500)).toBe(colorValues['status-error']);
    expect(statusColor(503)).toBe(colorValues['status-error']);
  });

  it('returns success color for 1xx', () => {
    expect(statusColor(100)).toBe(colorValues['status-success']);
    expect(statusColor(101)).toBe(colorValues['status-success']);
  });
});
