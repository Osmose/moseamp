import zlib from 'zlib';

import fs from 'fs-extra';

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

export async function decompress(buffer) {
  return new Promise((resolve, reject) => {
    zlib.unzip(buffer, (err, unzippedBuffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(unzippedBuffer);
      }
    });
  });
}

export function parseTags(buffer, reservedSize, programSize) {
  const tagBuf = buffer.slice(16 + reservedSize + programSize);
  if (tagBuf.length < 5 || tagBuf.toString('ascii', 0, 5) !== '[TAG]') {
    return {};
  }

  const lines = [];
  let start = 5;
  let mid = null;
  for (let k = 5; k < tagBuf.length; k++) {
    const char = tagBuf.readUInt8(k);
    if (char === 0x0A) { // Newline
      lines.push([
        tagBuf.toString('ascii', start, mid),
        tagBuf.toString('utf8', mid + 1, k),
      ]);
      start = k + 1;
    } else if (char === 0x3D) { // =
      mid = k;
    }
  }

  // Final tag
  if (tagBuf.length > 5 && mid) {
    lines.push([
      tagBuf.toString('ascii', start, mid),
      tagBuf.toString('utf8', mid + 1),
    ]);
  }

  const tags = {};
  for (const [lineKey, lineValue] of lines) {
    const key = lineKey.trim();
    const value = lineValue.trim();
    if (key in tags) {
      tags[key] += `\n${value}`;
    } else {
      tags[key] = value;
    }
  }

  return tags;
}

export async function readPsfTags(filename) {
  const buf = await fs.readFile(filename);
  if (buf.toString('ascii', 0, 3) !== 'PSF') {
    throw new Error(`${filename} is not a valid PSF file.`);
  }

  const reservedSize = buf.readUInt32LE(4);
  const programSize = buf.readUInt32LE(8);
  return parseTags(buf, reservedSize, programSize);
}
