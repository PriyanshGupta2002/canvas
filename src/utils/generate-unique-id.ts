export function generateUniqueId() {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now();
  // Generate a random number
  const randomNum = Math.floor(Math.random() * 10000);
  // Combine the timestamp and random number
  const uniqueId = `${timestamp}-${randomNum}`;
  return uniqueId;
}
