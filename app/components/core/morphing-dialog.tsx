import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { X } from "lucide-react";

import { cn } from "~/shared/lib/utils/cn";

type MorphingDialogContextValue = {
  dialogId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  transition?: Transition;
};

const MorphingDialogContext =
  React.createContext<MorphingDialogContextValue | null>(null);

function useMorphingDialog() {
  const context = React.useContext(MorphingDialogContext);

  if (!context) {
    throw new Error("MorphingDialog components must be used within MorphingDialog.");
  }

  return context;
}

type MorphingDialogProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  transition?: Transition;
};

function MorphingDialog({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  transition,
}: MorphingDialogProps) {
  const dialogId = React.useId();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const open = openProp ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openProp],
  );

  return (
    <MorphingDialogContext.Provider
      value={{ dialogId, open, setOpen, transition }}
    >
      <Dialog.Root open={open} onOpenChange={setOpen}>
        {children}
      </Dialog.Root>
    </MorphingDialogContext.Provider>
  );
}

function MorphingDialogTrigger({
  children,
  className,
  onClick,
  type = "button",
  ...props
}: React.ComponentProps<typeof motion.button>) {
  const { dialogId, setOpen, transition } = useMorphingDialog();

  return (
    <motion.button
      layoutId={`${dialogId}-container`}
      type={type}
      className={cn("block w-full text-left", className)}
      transition={transition}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function MorphingDialogContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, transition } = useMorphingDialog();

  return (
    <AnimatePresence>
      {open ? (
        <Dialog.Portal forceMount>
          <div className="fixed inset-0 z-[80]">
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
              {children}
            </div>
          </div>
        </Dialog.Portal>
      ) : null}
    </AnimatePresence>
  );
}

function MorphingDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const { dialogId, transition } = useMorphingDialog();

  return (
    <Dialog.Content asChild onOpenAutoFocus={(event) => event.preventDefault()}>
      <motion.div
        layoutId={`${dialogId}-container`}
        transition={transition}
        initial={{ opacity: 0.96, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0.96, scale: 0.98 }}
        className={cn(
          "relative z-10 overflow-hidden outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    </Dialog.Content>
  );
}

function MorphingDialogImage(
  props: React.ComponentProps<typeof motion.img>,
) {
  const { dialogId, transition } = useMorphingDialog();

  return <motion.img layoutId={`${dialogId}-image`} transition={transition} {...props} />;
}

function MorphingDialogTitle({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.h2>) {
  const { dialogId, transition } = useMorphingDialog();

  return (
    <motion.h2
      layoutId={`${dialogId}-title`}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </motion.h2>
  );
}

function MorphingDialogSubtitle({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.p>) {
  const { dialogId, transition } = useMorphingDialog();

  return (
    <motion.p
      layoutId={`${dialogId}-subtitle`}
      transition={transition}
      className={className}
      {...props}
    >
      {children}
    </motion.p>
  );
}

function MorphingDialogClose({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Close>) {
  return (
    <Dialog.Close
      aria-label="Close dialog"
      className={cn(
        "absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm ring-1 ring-black/5 transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? <X className="h-4 w-4" />}
    </Dialog.Close>
  );
}

export {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogContainer,
};