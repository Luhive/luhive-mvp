import { Label } from '~/shared/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/shared/components/ui/input-group';

interface EventPriceProps {
  priceInput: string;
  currency: string;
  disabled: boolean;
  errorMessage: string | null;
  onPriceInputChange: (value: string) => void;
}

export function EventPrice({
  priceInput,
  currency,
  disabled,
  errorMessage,
  onPriceInputChange,
}: EventPriceProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="ticket-price">Ticket Price</Label>
      <InputGroup>
        <InputGroupInput
          id="ticket-price"
          inputMode="decimal"
          value={priceInput}
          disabled={disabled}
          onChange={(e) => onPriceInputChange(e.target.value)}
          placeholder="Leave empty for a free event"
          aria-invalid={!!errorMessage}
        />
        <InputGroupAddon align="inline-end">{currency}</InputGroupAddon>
      </InputGroup>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {disabled
            ? 'Paid tickets are no longer enabled for this community, so the price cannot be changed.'
            : 'Attendees pay before their registration is confirmed. Changing the price does not affect tickets already bought.'}
        </p>
      )}
    </div>
  );
}
