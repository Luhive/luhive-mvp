"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Users, Loader2 } from "lucide-react"
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
import { useSubmit, useNavigation } from "react-router"

const joinCommunitySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  communityId: z.string().min(1, "Community ID is required"),
})

type JoinCommunityFormValues = z.infer<typeof joinCommunitySchema>

interface JoinCommunityFormProps {
  communityId: string
  communityName: string
  trigger?: React.ReactNode
}

export function JoinCommunityForm({
  communityId,
  communityName,
  trigger,
}: JoinCommunityFormProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const submit = useSubmit()
  const navigation = useNavigation()

  const form = useForm<JoinCommunityFormValues>({
    resolver: zodResolver(joinCommunitySchema),
    defaultValues: {
      fullName: "",
      email: "",
      communityId: communityId,
    },
  })

  const isSubmitting = navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "join_community"

  const onSubmit = (values: JoinCommunityFormValues) => {
    const formData = new FormData()
    formData.append("intent", "join_community")
    formData.append("fullName", values.fullName)
    formData.append("email", values.email)
    formData.append("communityId", values.communityId)

    submit(formData, { method: "post" })
  }

  // Close dialog/drawer on successful submission
  React.useEffect(() => {
    if (navigation.state === "idle" && form.formState.isSubmitSuccessful) {
      setOpen(false)
      form.reset()
    }
  }, [navigation.state, form.formState.isSubmitSuccessful, form])

  const defaultTrigger = (
    <Button className="w-full py-5.5 rounded-sm hover:bg-muted text-sm hover:shadow-xs font-medium border-foreground/20 border-solid border bg-background">
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 opacity-90 text-foreground" />
          <span className="text-foreground">Join Our Community</span>
        </span>
      </span>
    </Button>
  )

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" {...form.register("communityId")} />

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

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Join {communityName}</DrawerTitle>
            <DrawerDescription>
              Enter your details to join our community and stay connected.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <FormContent />
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
          <DialogTitle>Join {communityName}</DialogTitle>
          <DialogDescription>
            Enter your details to join our community and stay connected.
          </DialogDescription>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  )
}

