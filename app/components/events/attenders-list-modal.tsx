import { useState, useEffect } from 'react'
import { useIsMobile } from '~/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '~/components/ui/drawer'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Skeleton } from '~/components/ui/skeleton'

interface Attender {
  id: string
  name: string
  avatar_url: string | null
}

interface AttendersListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}

const AttenderItem = ({ attendee }: { attendee: Attender }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-10 w-10">
        <AvatarImage src={attendee.avatar_url || undefined} alt={attendee.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {getInitials(attendee.name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-sm">{attendee.name}</span>
    </div>
  )
}

const AttendersListSkeleton = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function AttendersListModal({
  open,
  onOpenChange,
  eventId,
}: AttendersListModalProps) {
  const isMobile = useIsMobile()
  const [attendees, setAttendees] = useState<Attender[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!open || !eventId) {
        return
      }

      try {
        setLoading(true)

        // Fetch attendees from API endpoint (uses service role to bypass RLS)
        const response = await fetch(`/api/attenders-list?eventId=${encodeURIComponent(eventId)}`)

        if (!response.ok) {
          throw new Error('Failed to fetch attendees')
        }

        const { attendees: attendeeList } = await response.json()
        setAttendees(attendeeList || [])
      } catch (error) {
        console.error('Error fetching attendees:', error)
        setAttendees([])
      } finally {
        setLoading(false)
      }
    }

    fetchAttendees()
  }, [open, eventId])

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Event Attendees</DrawerTitle>
            <DrawerDescription>
              {loading
                ? 'Loading attendees...'
                : `${attendees.length} ${attendees.length === 1 ? 'person' : 'people'} attending`}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {loading ? (
              <AttendersListSkeleton />
            ) : attendees.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No attendees yet
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="space-y-1">
                  {attendees.map((attendee) => (
                    <AttenderItem key={attendee.id} attendee={attendee} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Event Attendees</DialogTitle>
          <DialogDescription>
            {loading
              ? 'Loading attendees...'
              : `${attendees.length} ${attendees.length === 1 ? 'person' : 'people'} attending`}
          </DialogDescription>
        </DialogHeader>
        <div>
          {loading ? (
            <AttendersListSkeleton />
          ) : attendees.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No attendees yet
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-1">
                {attendees.map((attendee) => (
                  <AttenderItem key={attendee.id} attendee={attendee} />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

