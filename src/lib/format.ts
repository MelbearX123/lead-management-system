const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function formatDate(date: Date) {
  return dateFormat.format(date);
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
