import { useState, useEffect } from 'react';
import { Label } from '~/shared/components/ui/label';
import { Checkbox } from '~/shared/components/ui/checkbox';
import { Textarea } from '~/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/components/ui/card';
import { Bell } from 'lucide-react';

export type ReminderTime = '1-hour' | '3-hours' | '1-day';

export interface EventRemindersConfig {
  reminderTimes: ReminderTime[];
  customMessage: string | null;
}

interface EventRemindersProps {
  reminderTimes?: ReminderTime[];
  customMessage?: string | null;
  onReminderTimesChange: (times: ReminderTime[]) => void;
  onCustomMessageChange: (message: string | null) => void;
}

const REMINDER_OPTIONS: { value: ReminderTime; label: string; description: string }[] = [
  {
    value: '1-hour',
    label: '1 Hour Before',
    description: 'Send reminder 1 hour before the event starts',
  },
  {
    value: '3-hours',
    label: '3 Hours Before',
    description: 'Send reminder 3 hours before the event starts',
  },
  {
    value: '1-day',
    label: '1 Day Before',
    description: 'Send reminder 1 day before the event starts',
  },
];

const DEFAULT_REMINDER_MESSAGE = `Hi {participantName},

Just a quick reminder that {eventTitle} is starting {reminderTime}.

Event Details:
Date & Time: {eventDateTime}
Location: {eventLocation}

We’re excited to have you join us and can’t wait to see you there!

Best regards,
{communityName}`;

export function EventReminders({
  reminderTimes = [],
  customMessage = null,
  onReminderTimesChange,
  onCustomMessageChange,
}: EventRemindersProps) {
  const [selectedTimes, setSelectedTimes] = useState<ReminderTime[]>(reminderTimes);
  const [message, setMessage] = useState<string>(customMessage || DEFAULT_REMINDER_MESSAGE);
  const [isCustom, setIsCustom] = useState(!!customMessage);

  // Sync state changes to parent
  useEffect(() => {
    onReminderTimesChange(selectedTimes);
  }, [selectedTimes, onReminderTimesChange]);

  useEffect(() => {
    onCustomMessageChange(isCustom ? message : null);
  }, [message, isCustom, onCustomMessageChange]);

  const handleReminderToggle = (time: ReminderTime) => {
    setSelectedTimes((prev) => {
      if (prev.includes(time)) {
        return prev.filter((t) => t !== time);
      } else {
        return [...prev, time];
      }
    });
  };

  const handleMessageReset = () => {
    setMessage(DEFAULT_REMINDER_MESSAGE);
    setIsCustom(false);
  };

  return (
    <div className="space-y-6">
      {/* Reminder Times Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Reminder Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select when you want to send reminder emails to registered participants. You can choose multiple times.
          </p>

          <div className="space-y-3">
            {REMINDER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={selectedTimes.includes(option.value)}
                  onCheckedChange={() => handleReminderToggle(option.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedTimes.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                ✓ Reminders will be sent {selectedTimes.length} time{selectedTimes.length !== 1 ? 's' : ''} per attendee
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Message Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-message-toggle" className="text-sm font-medium cursor-pointer">
                <input
                  id="custom-message-toggle"
                  type="checkbox"
                  checked={isCustom}
                  onChange={(e) => setIsCustom(e.target.checked)}
                  className="mr-2"
                />
                Use custom message
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave unchecked to use the default message, or check to customize the reminder email.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-xs font-mono text-muted-foreground mb-2">Available Variables:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>{'{participantName}'} - Participant's name</li>
              <li>{'{eventTitle}'} - Event title</li>
              <li>{'{eventDateTime}'} - Event date and time</li>
              <li>{'{eventLocation}'} - Event location or meeting link</li>
              <li>{'{communityName}'} - Organizing community name</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm">
              {isCustom ? 'Custom Message' : 'Default Message (Read-only)'}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isCustom}
              placeholder="Enter your custom reminder message..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {isCustom && (
            <button
              onClick={handleMessageReset}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:dark:text-blue-300 underline"
            >
              Reset to default message
            </button>
          )}

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
            <p className="text-amber-900 dark:text-amber-100">
              💡 Tip: Keep messages clear and include all relevant event details. Variables will be automatically replaced with actual values.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
