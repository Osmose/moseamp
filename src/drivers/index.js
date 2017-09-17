const drivers = {};

// Dynamically load modules in the formats directory
const context = require.context('.', true, /\.js$/);
for (const moduleName of context.keys()) {
  const module = context(moduleName);
  if (module.driverId) {
    drivers[module.driverId] = module;
  }
}

function getDriver(filename) {
  for (const driver of Object.values(drivers)) {
    if (driver.supports(filename)) {
      return driver;
    }
  }

  return null;
}

export function createSound(entry, ctx) {
  const driver = drivers[entry.get('driverId')];
  return new driver.Sound(entry, ctx);
}

export function createEntries(filename) {
  const driver = getDriver(filename);
  if (driver) {
    return driver.createEntries(filename);
  }

  return null;
}
