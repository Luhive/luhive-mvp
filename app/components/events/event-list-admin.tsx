import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu';
import { Badge } from '~/components/ui/badge';
import { Plus, Search, Calendar, Filter, MapPin, Users, MoreHorizontal, ExternalLink, Edit, Trash2, BarChart3, Clock } from 'lucide-react';
import type { Database } from '~/models/database.types';
import dayjs from 'dayjs';
import { cn } from '~/lib/utils';

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

  // Sort by start time (latest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return dayjs(b.start_time).valueOf() - dayjs(a.start_time).valueOf();
  });

  // Helper function to format event type
  const formatEventType = (type: EventType): string => {
    const typeMap: Record<EventType, string> = {
      'in-person': 'in-person',
      'online': 'online',
      'hybrid': 'hybrid',
    };
    return typeMap[type] || type;
  };

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

      {/* Events List */}
      {sortedEvents.length > 0 ? (
        <div className="relative">
          {/* Continuous vertical connecting line - Desktop Only */}
          <div className="hidden md:block absolute left-[120px] top-0 bottom-0 w-px border-l border-dashed border-gray-200" />

          <div className="space-y-3">
            {(() => {
              // Group events by month, then by date
              const eventsByMonth = sortedEvents.reduce((acc, event) => {
                const monthKey = dayjs(event.start_time).format('YYYY-MM');
                const dateKey = dayjs(event.start_time).format('YYYY-MM-DD');

                if (!acc[monthKey]) {
                  acc[monthKey] = {};
                }
                if (!acc[monthKey][dateKey]) {
                  acc[monthKey][dateKey] = [];
                }
                acc[monthKey][dateKey].push(event);
                return acc;
              }, {} as Record<string, Record<string, typeof sortedEvents>>);

              const monthEntries = Object.entries(eventsByMonth);

              return monthEntries.flatMap(([monthKey, datesByMonth]) => {
                const firstEventInMonth = Object.values(datesByMonth)[0][0];
                const monthName = dayjs(firstEventInMonth.start_time).format('MMMM YYYY');
                const dateEntries = Object.entries(datesByMonth);

                return [
                  // Mobile: Month Header
                  <div key={`month-${monthKey}`} className="md:hidden pt-4 first:pt-0">
                    <div className="text-xl font-bold text-gray-900">{monthName}</div>
                  </div>,
                  // Date groups for this month
                  ...dateEntries.map(([dateKey, dateEvents], dateIndex) => {
                    const firstEvent = dateEvents[0];
                    const eventDate = dayjs(firstEvent.start_time);
                    const date = eventDate.format('MMM D');
                    const dayName = eventDate.format('dddd');
                    const isLast = dateIndex === dateEntries.length - 1;

                    return (
                      <div key={dateKey} className="flex flex-col md:flex-row gap-6 relative">
                        {/* Timeline Date Entry - Desktop Only */}
                        <div className="hidden md:flex flex-col w-[120px] flex-shrink-0 relative">
                          <div className="relative">
                            <div className="relative flex items-start gap-4 py-2 pr-4">
                              {/* Date and Day Name */}
                              <div className="flex-1 min-w-0">
                                <div className="text-lg font-bold text-gray-900">{date}</div>
                                <div className="text-sm text-gray-500 mt-0.5">{dayName}</div>
                              </div>
                            </div>
                            {/* Dot indicator - absolutely positioned to align with line */}
                            <div className="absolute right-[-0.28rem] top-1/2 -translate-y-1/2 z-10">
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Events for this date */}
                        <div className="flex-1 space-y-3">
                          {/* Mobile: Date Header */}
                          <div className="md:hidden pb-2 border-b border-gray-100">
                            <div className="text-lg font-bold text-gray-900">{date}</div>
                            <div className="text-sm text-gray-500 mt-0.5">{dayName}</div>
                          </div>

                          {dateEvents.map((event) => {
                            const eventDate = dayjs(event.start_time);
                            const weekday = eventDate.format('ddd').toUpperCase();
                            const date = eventDate.format('MMM D');
                            const time = eventDate.format('h:mm A');
                            const registrationCount = event.registration_count || 0;
                            const capacity = event.capacity;
                            const location = event.event_type === 'in-person'
                              ? event.location_address
                              : event.event_type === 'online'
                                ? 'Online Event'
                                : event.location_address || 'Hybrid Event';

                            return (
                              <div
                                key={event.id}
                                className="group bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-6 hover:shadow-xs transition-all duration-200 hover:border-gray-200"
                              >
                                {/* Left Section: Cover Picture with Date Overlay (Desktop) / Small Icon + Date (Mobile) */}
                                <div className="flex flex-col gap-3 min-w-[200px] md:min-w-0 md:self-stretch md:gap-0">
                                  {/* Mobile: Small Icon + Date Side by Side */}
                                  <div className="flex md:hidden items-center gap-4">
                                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100 aspect-square">
                                      {event.cover_url ? (
                                        <img
                                          src={event.cover_url}
                                          alt={event.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-2xl">📅</div>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">{weekday}</span>
                                      <span className="text-xl font-bold text-gray-900">{date}</span>
                                      <span className="text-xs text-gray-500 mt-0.5">{time}</span>

                                      {/* Mobile: Status and Registration Badges */}
                                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <Badge
                                          variant="secondary"
                                          className={cn(
                                            "h-5 px-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-md",
                                            event.status === "published"
                                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                          )}
                                        >
                                          {event.status}
                                        </Badge>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                                          <Users className="w-3 h-3 text-primary" />
                                          <span className="text-xs font-bold text-primary">{registrationCount}</span>
                                          <span className="text-[10px] text-primary/70">/{capacity || "∞"}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Desktop: Full Height Cover Picture */}
                                  <div className="hidden md:flex relative h-full max-h-[180px] aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                                    {event.cover_url ? (
                                      <img
                                        src={event.cover_url}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-4xl">📅</div>
                                    )}
                                  </div>
                                </div>

                                {/* Center Section: Title, Location, Registration */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                  {/* Desktop: Status and Type Badges */}
                                  <div className="hidden md:flex items-center gap-2 mb-1">
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "h-5 px-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-md",
                                        event.status === "published"
                                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      )}
                                    >
                                      {event.status}
                                    </Badge>
                                    <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                                      {formatEventType(event.event_type)}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                                    {event.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span className="truncate max-w-[200px]">{location}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{time}</span>
                                    </div>
                                  </div>

                                  {/* Desktop: Registration Count */}
                                  <div className="hidden md:flex items-center gap-3 mt-3">
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/5 rounded-full border border-primary/20 w-fit transition-colors group-hover:bg-primary/15 group-hover:border-primary/30">
                                      <Users className="w-3.5 h-3.5 text-primary" />
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-primary">{registrationCount}</span>
                                        <span className="text-xs text-primary/70 font-medium">
                                          / {capacity ? capacity : "∞"}
                                        </span>
                                        <span className="text-xs text-primary/70 font-medium ml-1">registered</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Section: Action Buttons */}
                                <div className="flex items-center gap-4 md:pl-6 md:border-l md:border-gray-50 md:justify-end">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center border border-gray-100 bg-gray-50/50 rounded-lg p-1 gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-md"
                                        title="View Event Page"
                                        asChild
                                      >
                                        <Link to={`/c/${communitySlug}/events/${event.id}`}>
                                          <ExternalLink className="w-4 h-4" />
                                        </Link>
                                      </Button>
                                      <div className="w-px h-4 bg-gray-200"></div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-md"
                                        title="Manage Guests"
                                        asChild
                                      >
                                        <Link to={`/dashboard/${communitySlug}/attenders?eventId=${event.id}`}>
                                          <Users className="w-4 h-4" />
                                        </Link>
                                      </Button>
                                      <div className="w-px h-4 bg-gray-200"></div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-md"
                                          >
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem disabled>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem asChild>
                                            <Link to={`/dashboard/${communitySlug}/attenders?eventId=${event.id}`}>
                                              <Users className="w-4 h-4 mr-2" />
                                              Manage Guests
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem disabled>
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            View Analytics
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={() => onDelete?.(event.id)}
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Event
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ];
              });
            })()}
          </div>
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

