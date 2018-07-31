const drivers = {};

// Dynamically load modules in the formats directory
const context = require.context('.', true, /\.js$/);
for (const moduleName of context.keys()) {
  const module = context(moduleName);
  if (module.driverId) {
    drivers[module.driverId] = module;
  }
}

export async function createSound(entry, ctx) {
  const sound = new drivers.musicplayer.Sound(entry, ctx);
  await sound.promiseLoaded;
  return sound;
}

export async function createEntries(filename) {
  for (const driver of Object.values(drivers)) {
    if (driver.supportsFile(filename)) {
      return driver.createEntries(filename);
    }
  }

  return null;
}

export function getCategoryInfo(category) {
  for (const driver of Object.values(drivers)) {
    const info = driver.getCategoryInfo(category);
    if (info) {
      return info;
    }
  }

  return null;
}
