import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Mail } from "lucide-react";
import { Label } from "~/shared/components/ui/label";
import { Switch } from "~/shared/components/ui/switch";
import { toast } from "sonner";

type NotificationSettingsProps = {
  notifyRegistrations: boolean;
};

type ActionData = {
  success: boolean;
  error?: string;
  notifyRegistrations?: boolean;
};

export function NotificationSettings({
  notifyRegistrations: initialValue,
}: NotificationSettingsProps) {
  const fetcher = useFetcher<ActionData>();
  const [checked, setChecked] = useState(initialValue);
  const committedRef = useRef(initialValue);

  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    committedRef.current = initialValue;
    setChecked(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!fetcher.data) return;

    if (
      fetcher.data.success &&
      typeof fetcher.data.notifyRegistrations === "boolean"
    ) {
      committedRef.current = fetcher.data.notifyRegistrations;
      setChecked(fetcher.data.notifyRegistrations);
      return;
    }

    if (fetcher.data.error) {
      setChecked(committedRef.current);
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);

  function handleCheckedChange(next: boolean) {
    setChecked(next);
    fetcher.submit(
      { notify_registrations: String(next) },
      { method: "post" },
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose which emails you receive for this community.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Events you host
        </p>

        <div className="flex items-center gap-3 py-1">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <Label
            htmlFor="notify-registrations"
            className="min-w-0 flex-1 text-sm font-medium leading-none cursor-pointer"
          >
            New registration emails
          </Label>
          <Switch
            id="notify-registrations"
            className="shrink-0"
            checked={checked}
            disabled={isSaving}
            onCheckedChange={handleCheckedChange}
          />
        </div>
      </div>
    </div>
  );
}
