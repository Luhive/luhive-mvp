"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Users, Loader2, UserCheck, LogOut } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { useSubmit, useNavigation, useNavigate } from "react-router"

// Schema for non-logged-in users
const guestJoinSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  communityId: z.string().min(1, "Community ID is required"),
})

// Schema for logged-in users (just community consent)
const memberJoinSchema = z.object({
  communityId: z.string().min(1, "Community ID is required"),
})

type GuestJoinFormValues = z.infer<typeof guestJoinSchema>
type MemberJoinFormValues = z.infer<typeof memberJoinSchema>

interface JoinCommunityFormProps {
  communityId: string
  communityName: string
  userEmail?: string | null
  isLoggedIn: boolean
  isMember: boolean
  trigger?: React.ReactNode
}

export function JoinCommunityForm({
  communityId,
  communityName,
  userEmail,
  isLoggedIn,
  isMember,
  trigger,
}: JoinCommunityFormProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const submit = useSubmit()
  const navigate = useNavigate()
  const navigation = useNavigation()

  const guestForm = useForm<GuestJoinFormValues>({
    resolver: zodResolver(guestJoinSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      communityId: communityId,
    },
  })

  const memberForm = useForm<MemberJoinFormValues>({
    resolver: zodResolver(memberJoinSchema),
    defaultValues: {
      communityId: communityId,
    },
  })

  const isSubmitting = navigation.state === "submitting" &&
    (navigation.formData?.get("intent") === "join_community" ||
      navigation.formData?.get("intent") === "leave_community")

  // For logged-in users: handle leave
  const handleLeave = () => {
    const formData = new FormData()
    formData.append("intent", "leave_community")
    formData.append("communityId", communityId)

    submit(formData, { method: "post" })
    setOpen(false)
  }

  // For logged-in users: submit directly to join
  const onMemberSubmit = (values: MemberJoinFormValues) => {
    const formData = new FormData()
    formData.append("intent", "join_community")
    formData.append("communityId", values.communityId)

    submit(formData, { method: "post" })
  }

  // For non-logged-in users: redirect to register with params
  const onGuestSubmit = (values: GuestJoinFormValues) => {
    const params = new URLSearchParams({
      name: values.name,
      surname: values.surname,
      email: values.email,
      communityId: values.communityId,
      communityName: communityName,
    })
    navigate(`/signup?${params.toString()}`)
  }

  // Close dialog/drawer on successful submission (for logged-in users)
  React.useEffect(() => {
    if (isLoggedIn && navigation.state === "idle" && memberForm.formState.isSubmitSuccessful) {
      setOpen(false)
      memberForm.reset()
    }
  }, [isLoggedIn, navigation.state, memberForm.formState.isSubmitSuccessful, memberForm])

  const defaultTrigger = isMember ? (
    <Button
      className="w-full py-5.5 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-primary/30 border-solid border bg-primary/5"
      disabled={isSubmitting}
    >
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 opacity-90 text-primary" />
          <span className="text-primary font-semibold">Joined</span>
        </span>
      </span>
    </Button>
  ) : (
    <Button className="w-full py-5.5 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background">
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 opacity-90 text-foreground" />
          <span className="text-foreground">Join Our Community</span>
        </span>
      </span>
    </Button>
  )

  const consentMessage = `By joining ${communityName}, you'll receive email notifications about announcements, posts, and events. You can manage your notification preferences anytime.`

  // Leave confirmation content
  const LeaveConfirmationContent = () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>Are you sure you want to leave {communityName}? You will no longer receive updates about events and announcements.</p>
      </div>

      {isMobile ? (
        <DrawerFooter className="px-0">
          <Button
            onClick={handleLeave}
            disabled={isSubmitting}
            variant="destructive"
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Leave Community
              </>
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      ) : (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLeave}
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Leave Community
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )

  // Form content for logged-in users (just consent)
  const MemberFormContent = () => (
    <Form {...memberForm}>
      <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p>{consentMessage}</p>
        </div>

        {userEmail && (
          <div className="space-y-2">
            <FormLabel>Your Email</FormLabel>
            <Input
              type="email"
              value={userEmail}
              disabled
              className="bg-muted"
            />
          </div>
        )}

        <input type="hidden" {...memberForm.register("communityId")} />

        {isMobile ? (
          <DrawerFooter className="px-0">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Community"
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Community"
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )

  // Form content for non-logged-in users (name, surname, email)
  const GuestFormContent = () => (
    <Form {...guestForm}>
      <form onSubmit={guestForm.handleSubmit(onGuestSubmit)} className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p>{consentMessage}</p>
        </div>

        <FormField
          control={guestForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Elizabeth"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={guestForm.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surname</FormLabel>
              <FormControl>
                <Input
                  placeholder="Queen"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={guestForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" {...guestForm.register("communityId")} />

        {isMobile ? (
          <DrawerFooter className="px-0">
            <Button type="submit" className="w-full">
              Continue to Sign Up
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
                onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
              <Button type="submit">
                Continue to Sign Up
            </Button>
          </div>
        )}
      </form>
    </Form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {isMember ? `Leave ${communityName}` : `Join ${communityName}`}
            </DrawerTitle>
            <DrawerDescription>
              {isMember
                ? "You are currently a member of this community."
                : isLoggedIn
                  ? "Review the details below and confirm to join our community."
                  : "Enter your details to get started with your account."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            {isMember ? (
              <LeaveConfirmationContent />
            ) : isLoggedIn ? (
              <MemberFormContent />
            ) : (
              <GuestFormContent />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isMember ? `Leave ${communityName}` : `Join ${communityName}`}
          </DialogTitle>
          <DialogDescription>
            {isMember
              ? "You are currently a member of this community."
              : isLoggedIn
                ? "Review the details below and confirm to join our community."
                : "Enter your details to get started with your account."}
          </DialogDescription>
        </DialogHeader>
        {isMember ? (
          <LeaveConfirmationContent />
        ) : isLoggedIn ? (
          <MemberFormContent />
        ) : (
          <GuestFormContent />
        )}
      </DialogContent>
    </Dialog>
  )
}

