function getDateParts(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    weekday: "short",
  }).formatToParts(new Date(iso));

  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return { month: find("month"), day: find("day"), weekday: find("weekday") };
}

function formatClockTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** "Sep 30, Wed", in the event's own timezone so server and client agree. */
export function formatEventDateLabel(startTime: string, timeZone: string) {
  const { month, day, weekday } = getDateParts(startTime, timeZone);
  return `${month} ${day}, ${weekday}`;
}

/** "10:00 - 12:00", or just the start time when the event has no end. */
export function formatEventTimeRange(
  startTime: string,
  endTime: string | null,
  timeZone: string,
) {
  const start = formatClockTime(startTime, timeZone);
  return endTime ? `${start} - ${formatClockTime(endTime, timeZone)}` : start;
}
