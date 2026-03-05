"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { cn } from "~/shared/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";

export interface FullscreenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function FullscreenModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: FullscreenModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 h-[100dvh] flex flex-col",
              "bg-background shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            )}
          >
            {/* Header: title + X button */}
            <div className="shrink-0 flex items-start justify-between gap-4 p-4 pb-2">
              <DialogPrimitive.Title className="text-lg font-semibold leading-tight">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="rounded-full p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            {description && (
              <DialogPrimitive.Description className="shrink-0 px-4 pb-4 text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4">
              {children}
            </div>
            {/* Pinned footer */}
            {footer && (
              <div className="shrink-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && (
          <div className="shrink-0 border-t px-6 py-4">{footer}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
