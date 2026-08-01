// Timezone-aware local timestamp formatter
export const formatTimestamp = (rawTimestamp) => {
  if (!rawTimestamp) return "";
  const date = new Date(rawTimestamp);
  if (isNaN(date.getTime())) {
    return rawTimestamp; // Fallback string if already formatted
  }
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return timeStr;
  }
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
};
