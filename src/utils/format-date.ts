export function formatTime(timeString: string) {
  // Prepend a dummy date to create a valid Date object
  const date = new Date(`1970-01-01T${timeString}Z`);

  const formattedTime = date.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  });

  return formattedTime;
}
