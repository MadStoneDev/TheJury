// Australian formatting throughout: "28 Sep 2026", "28 September 2026",
// and "Monday, 28 September 2026, 5:18 pm" — not the US month-first order.
export const formatDateShort = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatDateLong = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatDateFull = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
