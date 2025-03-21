/**
 * Get the timestamp for the start of today
 */
export const getStartOfToday = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

/**
 * Get the timestamp for 7 days ago
 */
export const getSevenDaysAgo = (): number => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/**
 * Format a timestamp as a readable date string
 * @param timestamp Timestamp to format
 */
export const formatDateString = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a timestamp as a readable time string
 * @param timestamp Timestamp to format
 */
export const formatTimeString = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Convert a formatted date string back to a Date object
 * @param dateString The formatted date string (e.g., "Monday, Jan 1")
 * @returns Date object for the given date string
 */
export const getDateFromString = (dateString: string): Date => {
  const date = new Date(dateString);

  // If the date is invalid (e.g., "Monday, Jan 1" isn't directly parseable),
  // fallback to current date
  if (isNaN(date.getTime())) {
    // For strings like "Monday, Jan 1", we just return today's date
    // as the primary use case is for grouping by day
    return new Date();
  }

  return date;
};
