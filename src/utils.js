import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import m3u8 from 'm3u-file-parser';

import { getTypeForExt } from 'moseamp/filetypes';

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

export async function getEntriesForPath(currentPath) {
  let entries;

  // Playlists vs directories
  if (currentPath.endsWith('m3u')) {
    const parser = m3u8.createStream();
    const file = fs.createReadStream(currentPath);
    const playlist = await new Promise((resolve, reject) => {
      parser.on('m3u', (m3u) => {
        resolve(m3u);
      });
      parser.on('error', (error) => {
        console.error(error);
        reject(error);
      });
      file.pipe(parser);
    });

    entries = [];
    for (const item of playlist.items.PlaylistItem) {
      const itemPath = path.resolve(currentPath, '..', item.get('uri'));

      // Skip nonexistant paths
      try {
        await fs.promises.access(itemPath);
      } catch (err) {
        console.warn(err);
        continue;
      }

      entries.push({
        path: itemPath,
        ext: path.extname(itemPath),
        name: path.basename(itemPath),
        playlistPath: currentPath,
        type: 'file',
      });
    }
  } else {
    const dirEntries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    entries = dirEntries.map((dirEnt) => {
      return {
        path: path.join(currentPath, dirEnt.name),
        ext: path.extname(dirEnt.name),
        name: dirEnt.name,
        playlistPath: currentPath,
        type: dirEnt.isDirectory() ? 'directory' : 'file',
      };
    });
  }

  // Remove non-openable files and sort
  entries = entries.filter((entry) => entry.type === 'directory' || entry.ext === '.m3u' || getTypeForExt(entry.ext));
  entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  return entries;
}
