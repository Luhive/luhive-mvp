import { Label } from '~/shared/components/ui/label';
import { Input } from '~/shared/components/ui/input';
import { Textarea } from '~/shared/components/ui/textarea';

interface EventBasicInfoProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function EventBasicInfo({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: EventBasicInfoProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="event-title">Event Title *</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Monthly Community Meetup"
          required
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/200 characters
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Tell attendees what this event is about..."
          rows={6}
          className="resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/2000 characters
        </p>
      </div>
    </div>
  );
}

