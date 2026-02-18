import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(duration);
dayjs.extend(timezone);

/**
 * Calculates the time remaining until a deadline and returns it in days and hours format
 * @param deadline - The deadline date (ISO string or Date object)
 * @param timezone - Optional timezone for the deadline
 * @returns Object with days and hours remaining, or null if deadline has passed
 */
export function getTimeRemaining(
  deadline: string | Date,
  timezone?: string
): { days: number; hours: number; formatted: string } | null {
  const now = dayjs();
  const deadlineDate = timezone
    ? dayjs(deadline).tz(timezone)
    : dayjs(deadline);

  if (deadlineDate.isBefore(now)) {
    return null; // Deadline has passed
  }

  const diff = dayjs.duration(deadlineDate.diff(now));
  const days = Math.floor(diff.asDays());
  const hours = diff.hours();

  // Format: "2d 5h" or "5h" if no days, or "0h" if less than an hour
  let formatted = "";
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h`;
  } else {
    formatted = "0h";
  }

  return {
    days,
    hours,
    formatted,
  };
}
