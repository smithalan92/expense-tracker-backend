export function getUnixTimestampFromJSDate(date: Date) {
  return Math.floor(date.getTime() / 1000);
}
