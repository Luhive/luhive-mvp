import { Label } from '~/shared/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/shared/components/ui/input-group';
import { MessageCircle } from 'lucide-react';
import { isValidUrl } from '~/modules/events/utils/discussion-platform';

interface EventDiscussionProps {
  discussionLink?: string;
  onDiscussionLinkChange: (link: string) => void;
}

export function EventDiscussion({
  discussionLink = '',
  onDiscussionLinkChange,
}: EventDiscussionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDiscussionLinkChange(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="discussion-link">Discussion Channel</Label>
      <InputGroup>
        <InputGroupAddon>
          <MessageCircle className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="discussion-link"
          type="url"
          value={discussionLink}
          onChange={handleChange}
          placeholder="Add WhatsApp group, Discord server, or Telegram channel link"
        />
      </InputGroup>
      <p className="text-xs text-muted-foreground">
        Share a link where attendees can discuss this event
      </p>
    </div>
  );
}

