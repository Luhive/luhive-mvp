import { useIsMobile } from '~/shared/hooks/use-mobile'
import { Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/shared/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '~/shared/components/ui/drawer'

interface AttendersLockedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isExternalEvent?: boolean
}

function LockedContent({ isExternalEvent }: { isExternalEvent: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Users className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          {isExternalEvent
            ? 'Only subscribers can see the subscriber list'
            : 'Only registered attendees can see the full attendee list'}
        </p>
        <p className="text-sm text-muted-foreground">
          {isExternalEvent
            ? 'Subscribe to this event to see who else has signed up.'
            : 'Register for this event to see who else is attending.'}
        </p>
      </div>
    </div>
  )
}

export function AttendersLockedModal({
  open,
  onOpenChange,
  isExternalEvent = false,
}: AttendersLockedModalProps) {
  const isMobile = useIsMobile()
  const title = isExternalEvent ? 'Event Subscribers' : 'Event Attendees'

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription className="sr-only">{title}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <LockedContent isExternalEvent={isExternalEvent} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <LockedContent isExternalEvent={isExternalEvent} />
      </DialogContent>
    </Dialog>
  )
}
