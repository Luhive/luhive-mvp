import { describe, it, expect } from 'vitest';
import { successBody, failureBody } from '../src/lib/response';

describe('successBody', () => {
  it('wraps a single resource with ok:true and no meta', () => {
    expect(successBody({ id: 'x' })).toEqual({ ok: true, data: { id: 'x' } });
  });

  it('includes meta when provided (e.g. pagination cursor)', () => {
    expect(successBody([1, 2], { next_cursor: 'abc' })).toEqual({
      ok: true,
      data: [1, 2],
      meta: { next_cursor: 'abc' },
    });
  });
});

describe('failureBody', () => {
  it('emits ok:false with a stable code and no fields', () => {
    expect(failureBody('unauthorized')).toEqual({
      ok: false,
      error: { code: 'unauthorized' },
    });
  });

  it('includes fields for validation errors', () => {
    const fields = [{ path: 'when', message: 'invalid' }];
    expect(failureBody('invalid_query', fields)).toEqual({
      ok: false,
      error: { code: 'invalid_query', fields },
    });
  });

  it('omits an empty fields array', () => {
    expect(failureBody('invalid_query', [])).toEqual({
      ok: false,
      error: { code: 'invalid_query' },
    });
  });
});
