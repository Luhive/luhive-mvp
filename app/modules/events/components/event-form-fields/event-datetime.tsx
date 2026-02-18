import { useState } from 'react';
import { Calendar } from '~/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/shared/components/ui/popover';
import { Button } from '~/shared/components/ui/button';
import { Label } from '~/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/shared/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/shared/components/ui/input-group';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '~/shared/lib/utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventDateTimeProps {
  startDate?: Date;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  onStartDateChange: (date: Date | undefined) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onTimezoneChange: (tz: string) => void;
}

// Common timezones
const TIMEZONES = [
  { value: 'Asia/Baku', label: 'Asia/Baku (GMT+4)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (GMT+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+11)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
  { value: 'America/Chicago', label: 'America/Chicago (GMT-6)' },
  { value: 'America/Denver', label: 'America/Denver (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-8)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (GMT+13)' },
];

export function EventDateTime({
  startDate,
  startTime = '09:00',
  endTime = '10:00',
  timezone: selectedTimezone = 'Asia/Baku',
  onStartDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onTimezoneChange,
}: EventDateTimeProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="start-date">Start Date *</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? dayjs(startDate).format('MMMM D, YYYY') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                onStartDateChange(date);
                setIsCalendarOpen(false);
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time *</Label>
          <InputGroup>
            <InputGroupAddon>
              <Clock className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              required
            />
          </InputGroup>
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="end-time">End Time</Label>
          <InputGroup>
            <InputGroupAddon>
              <Clock className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone *</Label>
        <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

