/** Human-friendly "time from now" in Chinese, used for next-review hints. */
export function formatDue(due: Date, now: Date): string {
  const minutes = Math.round((due.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return '现在';
  if (minutes < 60) return `${minutes}分钟`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}小时`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}天`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months}个月`;

  return `${Math.round(months / 12)}年`;
}
