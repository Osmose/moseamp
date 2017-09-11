#!/usr/bin/env bash
set -eu

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pushd $TMP_DIR
wget https://bitbucket.org/mpyne/game-music-emu/downloads/game-music-emu-0.6.1.tar.bz2
tar xjf game-music-emu-0.6.1.tar.bz2
cd game-music-emu-0.6.1
mkdir build
cd build
cmake ../ -DCMAKE_INSTALL_PREFIX=./ -DBUILD_SHARED_LIBS=1
make
popd
cp "$TMP_DIR/game-music-emu-0.6.1/build/gme/libgme.0.6.1.dylib" "$BASE_DIR/libs/libgme.dylib"
