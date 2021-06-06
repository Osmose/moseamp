import { exec } from 'child_process';

export function formatDuration(duration) {
  if (duration === Infinity) {
    return '∞';
  }

  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor((duration % 3600) / 60);
  const hours = Math.floor(duration / 3600);
  let string = seconds.toString().padStart(2, '0');
  if (hours) {
    string = `${hours}:${minutes.toString().padStart(2, '0')}:${string}`;
  } else {
    string = `${minutes}:${string}`;
  }
  return string;
}

export function parseDurationString(durationString) {
  try {
    const segments = durationString.split(':').map((s) => Number.parseInt(s, 10));
    segments.reverse();
    if (segments.includes(NaN) || segments.length > 3) {
      throw new Error('Cannot parse');
    }

    let factor = 1;
    let total = 0;
    for (const segment of segments) {
      total += segment * factor;
      factor *= 60;
    }
    return total;
  } catch (err) {
    return null;
  }
}

export function asyncExec(command, options) {
  return new Promise((resolve) => {
    exec(command, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}
