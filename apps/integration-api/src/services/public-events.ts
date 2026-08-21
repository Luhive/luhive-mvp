import type { SupabaseClient } from '../lib/supabase';
import { EventRow, type PublicEventsRequest } from '../schemas/events';
import { encodeCursor } from '../lib/cursor';

const SELECT =
  'id,title,description,start_time,end_time,location_name,online_meeting_link,cover_url,slug,community:communities!inner(name,slug,is_show)';

// Cross-community public events feed. Deliberately NOT community-scoped, and
// structurally separate from any future community EventsService.
export class PublicEventsService {
  constructor(private db: SupabaseClient) {}

  async listPublic(
    filters: PublicEventsRequest,
  ): Promise<{ data: EventRow[]; next_cursor: string | null }> {
    const asc = filters.when !== 'past';
    const now = new Date().toISOString();

    let q = this.db
      .from('events')
      .select(SELECT)
      .eq('status', 'published')
      .eq('community.is_show', true);

    if (filters.when === 'upcoming') q = q.gte('start_time', now);
    if (filters.when === 'past') q = q.lt('start_time', now);
    if (filters.from) q = q.gte('start_time', filters.from);
    if (filters.to) q = q.lte('start_time', filters.to);
    if (filters.q) q = q.ilike('title', `%${filters.q}%`);

    if (filters.cursor) {
      const { startTime, id } = filters.cursor;
      q = asc
        ? q.or(
            `start_time.gt.${startTime},and(start_time.eq.${startTime},id.gt.${id})`,
          )
        : q.or(
            `start_time.lt.${startTime},and(start_time.eq.${startTime},id.lt.${id})`,
          );
    }

    q = q
      .order('start_time', { ascending: asc })
      .order('id', { ascending: asc })
      .limit(filters.limit + 1);

    const { data, error } = await q;
    if (error) throw error;

    // Boundary validation: keep only rows that match the expected shape.
    const rows: EventRow[] = [];
    for (const raw of data ?? []) {
      const parsed = EventRow.safeParse(raw);
      if (parsed.success) rows.push(parsed.data);
    }

    let next_cursor: string | null = null;
    if (rows.length > filters.limit) {
      rows.length = filters.limit;
      const last = rows[rows.length - 1];
      next_cursor = encodeCursor(last.start_time, last.id);
    }

    return { data: rows, next_cursor };
  }
}
