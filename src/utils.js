export function formatDuration(duration) {
  if (duration === Infinity) {
    return '∞';
  }

  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor(duration / 60);
  const hours = Math.floor(duration / 3600);
  let string = seconds.toString().padStart(2, '0');
  if (hours) {
    string = `${hours}:${minutes.toString().padStart(2, '0')}:${string}`;
  } else {
    string = `${minutes}:${string}`;
  }
  return string;
}
