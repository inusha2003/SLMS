import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
};

export const formatDate = (date) => {
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return 'Unknown date';
  }
};

export const formatDateTime = (date) => {
  try {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Unknown';
  }
};