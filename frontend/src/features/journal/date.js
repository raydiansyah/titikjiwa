export function isoWeekKey(date) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (value.getUTCDay() + 6) % 7;
  value.setUTCDate(value.getUTCDate() - day + 3);

  const first = new Date(Date.UTC(value.getUTCFullYear(), 0, 4));
  const firstDay = (first.getUTCDay() + 6) % 7;
  first.setUTCDate(first.getUTCDate() - firstDay + 3);

  const week = 1 + Math.round((value.getTime() - first.getTime()) / 604800000);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekLabel(key) {
  const [year, week] = key.split("-W");
  return `Minggu ${Number(week)} · ${year}`;
}
