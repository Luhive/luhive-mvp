import { Link } from 'react-router';
import { Card, CardContent, CardFooter } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu';
import { Calendar, MapPin, Users, MoreVertical, Edit, Trash2, Eye, Video, Combine, Infinity, ListChecks } from 'lucide-react';
import type { Database } from '~/models/database.types';
import dayjs from 'dayjs';
import { cn } from '~/lib/utils';

type Event = Database['public']['Tables']['events']['Row'];
type EventStatus = Database['public']['Enums']['event_status'];
type EventType = Database['public']['Enums']['event_type'];

interface EventCardProps {
  event: Event & { registration_count?: number };
  communitySlug: string;
  onDelete?: (eventId: string) => void;
}

const statusConfig: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const typeIcons: Record<EventType, React.ReactNode> = {
  'in-person': <MapPin className="h-3.5 w-3.5" />,
  online: <Video className="h-3.5 w-3.5" />,
  hybrid: <Combine className="h-3.5 w-3.5" />,
};

export function EventCard({ event, communitySlug, onDelete }: EventCardProps) {
  const eventDate = dayjs(event.start_time);
  const isPastEvent = eventDate.isBefore(dayjs());
  const registrationCount = event.registration_count || 0;
  const capacityPercentage = event.capacity
    ? Math.round((registrationCount / event.capacity) * 100)
    : 0;

  return (
    <Card className="overflow-hidden pt-0 hover:shadow-lg transition-shadow duration-200 group">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/20 via-muted-foreground/10 to-background overflow-hidden">
        {event.cover_url ? (
          <img
            src={event.cover_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <Badge variant={statusConfig[event.status].variant}>
            {statusConfig[event.status].label}
          </Badge>
        </div>

        {/* Actions Menu - Top Right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-lg"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/${communitySlug}/events/${event.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/c/${communitySlug}/events/${event.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Page
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/${communitySlug}/attenders?eventId=${event.id}`}>
                  <ListChecks className="h-4 w-4 mr-2" />
                  View Attenders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(event.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Past Event Overlay */}
        {isPastEvent && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="outline" className="bg-black/60 text-white border-white/20">
              Past Event
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="px-4 space-y-4">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 min-h-[1rem]">
          {event.title}
        </h3>

        {/* Date & Time */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{eventDate.format('MMM D, YYYY')}</p>
            <p className="text-muted-foreground text-xs">
              {eventDate.format('h:mm A')}
              {event.end_time && ` - ${dayjs(event.end_time).format('h:mm A')}`}
            </p>
          </div>
        </div>

        {/* Location/Type */}
        <div className="flex items-start gap-2 text-sm">
          <div className="mt-0.5 text-muted-foreground flex-shrink-0">
            {typeIcons[event.event_type]}
          </div>
          <div className="flex-1 min-w-0">
            {event.event_type === 'in-person' && (
              <p className="text-muted-foreground text-sm truncate">{event.location_address}</p>
            )}
            {event.event_type === 'online' && (
              <p className="text-muted-foreground text-sm">Online Event</p>
            )}
            {event.event_type === 'hybrid' && (
              <p className="text-muted-foreground text-sm">Hybrid Event</p>
            )}
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          {event.capacity ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {registrationCount} / {event.capacity}
                  </span>
                </div>
                <span className="text-xs font-medium">{capacityPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    capacityPercentage >= 90
                      ? 'bg-red-500'
                      : capacityPercentage >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Infinity className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Unlimited capacity</span>
            </div>
          )}
        </div>
      </CardContent>

    </Card>
  );
}

