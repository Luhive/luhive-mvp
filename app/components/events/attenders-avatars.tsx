import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Skeleton } from '~/components/ui/skeleton'
import { createClient } from '~/lib/supabase.client'
import { AttendersListModal } from './attenders-list-modal'
import { cn } from '~/lib/utils'

interface AttenderAvatar {
  id: string
  name: string
  avatar_url: string | null
}

interface AttendersAvatarsProps {
  eventId: string
  maxVisible?: number
}

const AttendersAvatarsSkeleton = () => {
  return (
    <div className='bg-background flex items-center w-fit rounded-full border p-1 shadow-sm'>
      <div className='flex -space-x-2'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className='h-8 w-8 rounded-full ring-background ring-2 bg-muted'
          />
        ))}
      </div>
      <Skeleton className='h-4 w-8 ml-2 rounded-full bg-muted' />
    </div>
  )
}

const AttendersAvatars = ({ eventId, maxVisible = 3 }: AttendersAvatarsProps) => {
  const [attendees, setAttendees] = useState<AttenderAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!eventId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const supabase = createClient()

        // Fetch event registrations with user profiles
        const { data: registrations, error } = await supabase
          .from('event_registrations')
          .select(`
            id,
            user_id,
            anonymous_name,
            profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('event_id', eventId)
          .eq('is_verified', true)
          .eq('rsvp_status', 'going')
          .order('registered_at', { ascending: false })
          .limit(20) // Limit initial fetch

        if (error) {
          console.error('Error fetching attendees:', error)
          setAttendees([])
          setLoading(false)
          return
        }

        // Transform data to avatar format
        const attendeeAvatars: AttenderAvatar[] = (registrations || [])
          .map((reg: any) => {
            const isAnonymous = !reg.user_id
            const name = isAnonymous
              ? reg.anonymous_name || 'Anonymous'
              : reg.profiles?.full_name || 'Unknown User'

            return {
              id: reg.id,
              name,
              avatar_url: isAnonymous ? null : reg.profiles?.avatar_url || null,
            }
          })
          .filter((avatar) => avatar.name !== 'Unknown User')

        setAttendees(attendeeAvatars)
      } catch (error) {
        console.error('Error fetching attendees:', error)
        setAttendees([])
      } finally {
        setLoading(false)
      }
    }

    fetchAttendees()
  }, [eventId])

  if (loading) {
    return <AttendersAvatarsSkeleton />
  }

  if (attendees.length === 0) {
    return null
  }

  const visibleAttendees = attendees.slice(0, maxVisible)
  const remainingCount = attendees.length - maxVisible

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'bg-background flex items-center w-fit',
            'hover:border-primary/50 transition-transform cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2 focus:rounded-full',
          )}
          aria-label="View all attendees"
        >
          <div className='flex -space-x-2'>
            {visibleAttendees.map((attendee) => (
              <Avatar key={attendee.id} className='ring-background hover:shadow-md hover:scale-110 hover:-translate-y-1 transition-transform ease-in-out ring-2 h-8 w-8'>
                <AvatarImage src={attendee.avatar_url || undefined} alt={attendee.name} />
                <AvatarFallback className='text-xs bg-primary/10 text-primary'>
                  {getInitials(attendee.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {remainingCount > 0 && (
            <span className='text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full bg-transparent px-2 text-xs shadow-none hover:bg-transparent'>
              +{remainingCount}
            </span>
          )}
        </button>
        
        {/* Names below avatars */}
        <div className="flex gap-1">
          {visibleAttendees.map((attendee) => (
            <span key={attendee.id} className="text-sm text-muted-foreground">
              {attendee.name.split(' ')[0]},
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="text-sm text-muted-foreground">
              and {remainingCount} {remainingCount === 1 ? 'other' : 'others'}
            </span>
          )}
        </div>
      </div>
      
      <AttendersListModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
      />
    </>
  )
}

export default AttendersAvatars
export { AttendersAvatarsSkeleton }
