import { describe, it, expect } from 'vitest';
import { toPublicEventResponse } from '../src/lib/dto';
import { PublicEventResponse, type EventRow } from '../src/schemas/events';
import { encodeCursor, decodeCursor } from '../src/lib/cursor';

const baseRow: EventRow = {
  id: 'evt-1',
  title: 'Innovation Wednesdays',
  description: 'A meetup',
  start_time: '2026-07-22T15:30:00.000Z',
  end_time: '2026-07-22T19:00:00.000Z',
  location_name: 'Fuzzy Coffee and Wine',
  online_meeting_link: null,
  cover_url: 'https://cdn.luhive.com/cover.jpg',
  slug: 'innovation-wednesdays-12th-edition',
  community: {
    name: 'Innovation Wednesdays',
    slug: 'innovation-wednesdays',
    is_show: true,
  },
};

describe('toPublicEventResponse', () => {
  it('uses location_name for physical events and builds the public url', () => {
    const dto = toPublicEventResponse(baseRow);
    expect(dto.location).toBe('Fuzzy Coffee and Wine');
    expect(dto.url).toBe(
      'https://luhive.com/c/innovation-wednesdays/innovation-wednesdays-12th-edition',
    );
    expect(dto.starts_at).toBe('2026-07-22T15:30:00.000Z');
    expect(dto.community).toEqual({
      name: 'Innovation Wednesdays',
      slug: 'innovation-wednesdays',
    });
    // never leak internal fields
    expect(dto).not.toHaveProperty('online_meeting_link');
    expect(PublicEventResponse.parse(dto)).toEqual(dto);
  });

  it('falls back to "Online" when only an online link exists', () => {
    const dto = toPublicEventResponse({
      ...baseRow,
      location_name: null,
      online_meeting_link: 'https://meet.example.com/abc',
    });
    expect(dto.location).toBe('Online');
    expect(PublicEventResponse.parse(dto)).toEqual(dto);
  });

  it('is null when there is neither a location nor an online link', () => {
    const dto = toPublicEventResponse({
      ...baseRow,
      location_name: null,
      online_meeting_link: null,
    });
    expect(dto.location).toBeNull();
    expect(PublicEventResponse.parse(dto)).toEqual(dto);
  });
});

describe('cursor', () => {
  it('round-trips (start_time, id)', () => {
    const raw = encodeCursor('2026-07-22T15:30:00.000Z', 'evt-1');
    expect(decodeCursor(raw)).toEqual({
      startTime: '2026-07-22T15:30:00.000Z',
      id: 'evt-1',
    });
  });

  it('returns null for a malformed cursor', () => {
    expect(decodeCursor('not-base64!!')).toBeNull();
    expect(decodeCursor(Buffer.from('{}').toString('base64url'))).toBeNull();
    expect(
      decodeCursor(Buffer.from('["only-one"]').toString('base64url')),
    ).toBeNull();
  });
});
