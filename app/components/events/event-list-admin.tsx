import { useState } from 'react';
import { Link } from 'react-router';
import { EventCard } from './event-card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';
import { Plus, Search, Calendar, Filter } from 'lucide-react';
import type { Database } from '~/models/database.types';
import dayjs from 'dayjs';

type Event = Database['public']['Tables']['events']['Row'];
type EventStatus = Database['public']['Enums']['event_status'];
type EventType = Database['public']['Enums']['event_type'];

interface EventListProps {
  events: (Event & { registration_count?: number })[];
  communitySlug: string;
  onDelete?: (eventId: string) => void;
}

export function EventList({ events, communitySlug, onDelete }: EventListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && event.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && event.event_type !== typeFilter) {
      return false;
    }

    // Time filter
    if (timeFilter !== 'all') {
      const eventDate = dayjs(event.start_time);
      const now = dayjs();
      if (timeFilter === 'upcoming' && eventDate.isBefore(now)) {
        return false;
      }
      if (timeFilter === 'past' && eventDate.isAfter(now)) {
        return false;
      }
    }

    return true;
  });

  // Sort by start time (upcoming first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf();
  });

  // Stats
  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === 'published').length,
    draft: events.filter((e) => e.status === 'draft').length,
    upcoming: events.filter((e) => dayjs(e.start_time).isAfter(dayjs())).length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your community events
          </p>
        </div>
        <Button asChild>
          <Link to={`/dashboard/${communitySlug}/events/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Events</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.published}</div>
          <div className="text-xs text-muted-foreground">Published</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.draft}</div>
          <div className="text-xs text-muted-foreground">Drafts</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.upcoming}</div>
          <div className="text-xs text-muted-foreground">Upcoming</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EventStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as EventType | 'all')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in-person">In-person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        {/* Time Filter */}
        <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'all' | 'upcoming' | 'past')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Summary */}
      {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || timeFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary">
              Search: {searchQuery}
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary">
              Status: {statusFilter}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary">
              Type: {typeFilter}
              <button
                onClick={() => setTypeFilter('all')}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          {timeFilter !== 'all' && (
            <Badge variant="secondary">
              Time: {timeFilter}
              <button
                onClick={() => setTimeFilter('all')}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
              setTimeFilter('all');
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Events Grid */}
      {sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              communitySlug={communitySlug}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {events.length === 0
              ? "Get started by creating your first event"
              : "Try adjusting your filters"}
          </p>
          {events.length === 0 && (
            <Button asChild>
              <Link to={`/dashboard/${communitySlug}/events/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

