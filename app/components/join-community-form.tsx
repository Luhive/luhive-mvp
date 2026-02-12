"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Spinner } from "~/components/ui/spinner"
import { useSubmit, useNavigation, useNavigate } from "react-router"
import {
  guestJoinSchema,
  memberJoinSchema,
  type GuestJoinFormValues,
  type MemberJoinFormValues,
} from "~/schemas/registration.schema"

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
  const [isEmailStepComplete, setIsEmailStepComplete] = React.useState(false)
  const [emailStepError, setEmailStepError] = React.useState<string | null>(null)

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

  // Check which form is being submitted for guest form
  const submittingIntent = navigation.formData?.get("intent") as string | null
  const isSubmittingOAuth = navigation.state === "submitting" && submittingIntent === "oauth"

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
    const normalizedEmail = values.email.trim()
    const params = new URLSearchParams({
      name: values.name,
      surname: values.surname,
      email: normalizedEmail,
      communityId: values.communityId,
      communityName: communityName,
    })
    navigate(`/signup?${params.toString()}`)
  }

  // Handle Google OAuth for guest users
  const handleGoogleOAuth = () => {
    const formData = new FormData()
    formData.append("intent", "oauth")
    formData.append("provider", "google")
    formData.append("communityId", communityId)

    // Submit to register route
    submit(formData, { method: "post", action: "/signup" })
  }

  // Close dialog/drawer on successful submission (for logged-in users)
  React.useEffect(() => {
    if (isLoggedIn && navigation.state === "idle" && memberForm.formState.isSubmitSuccessful) {
      setOpen(false)
      memberForm.reset()
    }
  }, [isLoggedIn, navigation.state, memberForm.formState.isSubmitSuccessful, memberForm])

  React.useEffect(() => {
    if (open) return

    guestForm.reset({
      name: "",
      surname: "",
      email: "",
      communityId,
    })
    setIsEmailStepComplete(false)
    setEmailStepError(null)
  }, [communityId, guestForm, open])

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

  const consentMessage = `By joining ${communityName}, you agree to email notifications. Unsubscribe anytime.`

  const headerDescription = isMember
    ? "You are currently a member of this community."
    : isLoggedIn
      ? "Review the details below and confirm to join our community."
      : null

  const handleContinueWithEmail = () => {
    const rawEmail = guestForm.getValues("email")
    const trimmedEmail = typeof rawEmail === "string" ? rawEmail.trim() : ""
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setEmailStepError("Please enter a valid email address.")
      return
    }

    setEmailStepError(null)
    guestForm.setValue("email", trimmedEmail, { shouldValidate: true })
    setIsEmailStepComplete(true)
  }

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
        <p className="text-center text-xs text-muted-foreground">{consentMessage}</p>
      </form>
    </Form>
  )

  // Form content for non-logged-in users (name, surname, email)
  const GuestFormContent = () => (
    <Form {...guestForm}>
      <form onSubmit={guestForm.handleSubmit(onGuestSubmit)} className="space-y-4">
        <Button
          type="button"
          onClick={handleGoogleOAuth}
          disabled={isSubmittingOAuth}
          variant="outline"
          className="w-full hover:bg-muted hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="size-5 mr-1"
            aria-hidden
            focusable="false"
          >
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.843 32.658 29.29 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.143-7.656 19.143-20 0-1.341-.147-2.652-.432-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.813C14.297 16.128 18.787 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 15.316 4 7.954 8.924 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.196 0 9.86-1.992 13.38-5.223l-6.173-5.234C29.093 34.484 26.682 35.5 24 35.5c-5.262 0-9.799-3.507-11.397-8.248l-6.52 5.017C8.704 39.043 15.83 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.018 2.977-3.279 5.308-6.093 6.443l.001-.001 6.173 5.234C34.84 40.782 43 36 43 24c0-1.341-.147-2.652-.432-3.917z" />
          </svg>
          {isSubmittingOAuth ? <Spinner /> : "Continue with Google"}
        </Button>

        <div className="my-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <FormField
          control={guestForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event.target.value)
                    if (emailStepError) {
                      setEmailStepError(null)
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {emailStepError && <p className="text-sm text-destructive">{emailStepError}</p>}

        <input type="hidden" {...guestForm.register("communityId")} />

        {!isEmailStepComplete && (
          <Button type="button" onClick={handleContinueWithEmail} disabled={isSubmittingOAuth} className="w-full">
            Continue with Email
          </Button>
        )}

        <div
          className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${isEmailStepComplete
              ? "max-h-[420px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-1 pointer-events-none"
            }`}
        >
          <div>
            <div className="space-y-4 pt-2">
              <FormField
                control={guestForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                  <FormControl>
                      <Input placeholder="Name" aria-label="Name" {...field} />
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
                  <FormControl>
                      <Input placeholder="Surname" aria-label="Surname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isMobile ? (
                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={isSubmittingOAuth} className="w-full">
                    Continue to Sign Up
                  </Button>
                </DrawerFooter>
              ) : (
                  <Button type="submit" disabled={isSubmittingOAuth} className="w-full">
                    Continue to Sign Up
                  </Button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">{consentMessage}</p>
      </form>
    </Form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent className="pb-6">
          <DrawerHeader>
            <DrawerTitle className={!isMember ? "text-center text-2xl font-extrabold tracking-tight" : undefined}>
              {isMember ? `Leave ${communityName}` : `Join ${communityName}`}
            </DrawerTitle>
            {headerDescription && (
              <DrawerDescription>{headerDescription}</DrawerDescription>
            )}
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
          <DialogTitle className={!isMember ? "text-center text-2xl font-extrabold tracking-tight" : undefined}>
            {isMember ? `Leave ${communityName}` : `Join ${communityName}`}
          </DialogTitle>
          {headerDescription && (
            <DialogDescription>{headerDescription}</DialogDescription>
          )}
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

