<p align="center">
  <img src="https://www.mkelly.me/moseamp/moseamp.png" width="300">
</p>

# MoseAmp

MoseAmp is a cross-platform, Electron-based audio player that specializes in playing music formats for video game consoles like the Playstation, Nintendo 64, and Sega Genesis.

[Download links available on the main site.](https://www.mkelly.me/moseamp/)

![Screenshot of MoseAmp](https://www.mkelly.me/moseamp/screenshot.png)

[Electron]: http://electron.atom.io/

## Development Setup

### Prerequisites

- Git
- A recent version of Node / NPM
- CMake 3.12 or higher
- A C/C++ compiler toolchain as per the [cmake-js](https://github.com/cmake-js/cmake-js#installation) README

### Building

```sh
# 1. Checkout repo
git clone https://github.com/Osmose/moseamp.git
cd moseamp

# 2. Install dependencies
npm install

# 3. Compile native Node plugin
npm run compile

# 4. Build app code
npm run build
```

### Running in Development Mode

After completing the build steps above:

```sh
npm start
```

MoseAmp will watch for changes to the non-native code (JavaScript, CSS, etc.) and automatically rebuild them. You can use <kbd>Ctrl+R</kbd>/<kbd>⌘+R</kbd> to reload the MoseAmp window and pull in new changes while developing.

### Packaging

MoseAmp is automatically built and packaged for distribution by Github Actions. You can also manually build it after following the build steps above:

```sh
# 1. Build app code in production mode
npm run build:prod

# 2. Package built code depending on your OS
npm run package:macos
# or
npm run package:windows
```

You will find a folder and a `.dmg` or `.zip` file in the `dist` folder containing the packaged application ready for distribution.

### Publishing

To publish a new version of MoseAmp:

```sh
# 1. Increment version number and create new git tag
npm version minor # or major or patch

# 2. Push master and tag to Github
git push origin master v5.1.2 # Replace with version number output above
```

Automation will take over (which you can watch on the [actions page](https://github.com/Osmose/moseamp/actions)) and build, package, and upload MoseAmp to a new release off the uploaded tag. The download buttons on the webpage always point to the latest released binaries.

## License

MoseAmp is licensed under the MIT license. See `LICENSE` for more info.
