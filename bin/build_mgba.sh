#!/usr/bin/env bash
set -eu

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pushd $TMP_DIR
wget https://github.com/mgba-emu/mgba/archive/0.6.0.tar.gz
tar xzf 0.6.0.tar.gz
cd mgba-0.6.0
mkdir build
cd build
cmake -DCMAKE_PREFIX_PATH=`brew --prefix qt5` -DBUILD_LIBRETRO=1 ..
make
popd
cp "$TMP_DIR/mgba-0.6.0/build/mgba_libretro.dylib" "$BASE_DIR/libs/mgba_libretro.dylib"
