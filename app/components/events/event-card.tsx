import { Link } from 'react-router';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Calendar, MapPin, Users, Video, Combine, Infinity } from 'lucide-react';
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
    <Link
      to={`/c/${communitySlug}/events/${event.id}`}
      className="block"
    >
      <Card className={cn(
        "overflow-hidden pt-0 border-0 shadow-sm",
        "transition-all duration-300 ease-out",
        "group bg-card/50 backdrop-blur-sm cursor-pointer",
        "hover:shadow-xl hover:scale-[1.02]",
        "active:scale-[0.98] active:shadow-md active:bg-card/70"
      )}>
        {/* Cover Image Section with Enhanced Design */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Dynamic Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20" />

          {/* Cover Image or Placeholder */}
        {event.cover_url ? (
            <>
              <img
                src={event.cover_url}
                alt={event.title}
                className={cn(
                  "w-full h-full object-cover",
                  "transition-transform duration-500 ease-out",
                  "group-hover:scale-110",
                  "group-active:scale-105"
                )}
              />
              {/* Gradient Overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent",
                "transition-opacity duration-300",
                "opacity-0 group-hover:opacity-100 group-active:opacity-80"
              )} />
            </>
        ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
                <Calendar className="h-16 w-16 text-muted-foreground/20 relative z-10" />
                {/* Decorative Elements */}
                <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-primary/5 blur-2xl" />
                <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
          </div>
        )}

          {/* Glassmorphism Status Badge - Top Left */}
          <div className="absolute top-3 left-3 z-20">
            <Badge
              variant={statusConfig[event.status].variant}
              className={cn(
                "backdrop-blur-md bg-background/80 border border-border/50",
                "shadow-lg font-medium",
                "transition-all duration-300 ease-out",
                "group-hover:scale-105 group-hover:shadow-xl",
                "group-active:scale-100 group-active:shadow-lg"
              )}
            >
            {statusConfig[event.status].label}
          </Badge>
        </div>

          {/* Past Event Overlay with Enhanced Design */}
          {isPastEvent && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <Badge
                variant="outline"
                className="bg-black/70 backdrop-blur-md text-white border-white/30 shadow-xl px-4 py-1.5 font-semibold"
              >
              Past Event
            </Badge>
          </div>
        )}

          {/* Subtle Border Glow on Hover and Active */}
          <div className={cn(
            "absolute inset-0 border-2 pointer-events-none",
            "transition-all duration-300 ease-out",
            "border-primary/0",
            "group-hover:border-primary/20",
            "group-active:border-primary/30 group-active:shadow-[0_0_0_4px_rgba(255,128,64,0.1)]"
          )} />
      </div>

        {/* Enhanced Content Section */}
        <CardContent className="px-5 py-0 space-y-4 bg-gradient-to-b from-card to-card/95">
          {/* Title with Better Typography */}
          <h3 className={cn(
            "font-bold text-lg leading-tight line-clamp-2 mt-0",
            "transition-colors duration-300 ease-out",
            "text-foreground",
            "group-hover:text-primary",
            "group-active:text-primary/90"
          )}>
          {event.title}
        </h3>

          {/* Date & Time with Enhanced Styling */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 p-1.5 rounded-lg",
              "bg-primary/5",
              "transition-all duration-300 ease-out",
              "group-hover:bg-primary/10 group-hover:scale-105",
              "group-active:bg-primary/15 group-active:scale-100"
            )}>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="font-semibold text-sm text-foreground">
                {eventDate.format('MMM D, YYYY')}
              </p>
              <p className="text-muted-foreground text-xs font-medium">
              {eventDate.format('h:mm A')}
              {event.end_time && ` - ${dayjs(event.end_time).format('h:mm A')}`}
            </p>
          </div>
        </div>

          {/* Location/Type with Enhanced Icons */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "mt-0.5 p-1.5 rounded-lg",
              "bg-primary/5",
              "transition-all duration-300 ease-out",
              "group-hover:bg-primary/10 group-hover:scale-105",
              "group-active:bg-primary/15 group-active:scale-100"
            )}>
              <div className="text-primary">
                {typeIcons[event.event_type]}
              </div>
          </div>
          <div className="flex-1 min-w-0">
            {event.event_type === 'in-person' && (
                <p className="text-muted-foreground text-sm font-medium truncate">
                  {event.location_address}
                </p>
            )}
            {event.event_type === 'online' && (
                <p className="text-muted-foreground text-sm font-medium">Online Event</p>
            )}
            {event.event_type === 'hybrid' && (
                <p className="text-muted-foreground text-sm font-medium">Hybrid Event</p>
            )}
          </div>
        </div>

          {/* Enhanced Capacity Section with Animated Progress */}
          <div className="space-y-2.5 pt-2 border-t border-border/50">
          {event.capacity ? (
            <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      "bg-primary/5",
                      "transition-all duration-300 ease-out",
                      "group-hover:bg-primary/10 group-hover:scale-105",
                      "group-active:bg-primary/15 group-active:scale-100"
                    )}>
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                    {registrationCount} / {event.capacity}
                  </span>
                </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-md",
                    capacityPercentage >= 90
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : capacityPercentage >= 70
                        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'bg-green-500/10 text-green-600 dark:text-green-400'
                  )}>
                    {capacityPercentage}%
                  </span>
              </div>
                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out shadow-sm',
                    'relative overflow-hidden',
                    capacityPercentage >= 90
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : capacityPercentage >= 70
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                  )}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
              </div>
            </>
          ) : (
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    "bg-primary/5",
                    "transition-all duration-300 ease-out",
                    "group-hover:bg-primary/10 group-hover:scale-105",
                    "group-active:bg-primary/15 group-active:scale-100"
                  )}>
                    <Infinity className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">Unlimited capacity</span>
            </div>
          )}
        </div>
        </CardContent>
    </Card>
    </Link>
  );
}

