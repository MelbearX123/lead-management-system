const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function formatDate(date: Date) {
  return dateFormat.format(date);
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
