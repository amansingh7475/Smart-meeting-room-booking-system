import { format, parseISO, isWithinInterval } from 'date-fns';

export const formatDisplayTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return isoString;
  }
};

export const formatDisplayDate = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE, MMMM d, yyyy');
  } catch {
    return String(date);
  }
};

export const formatInputDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatInputTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const isNowWithinBooking = (startTime: string, endTime: string): boolean => {
  try {
    const now = new Date();
    return isWithinInterval(now, {
      start: parseISO(startTime),
      end: parseISO(endTime),
    });
  } catch {
    return false;
  }
};
