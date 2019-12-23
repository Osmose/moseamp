#!/usr/bin/env bash
set -eu

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pushd $TMP_DIR
git clone https://github.com/sasq64/apone.git
git clone https://github.com/Osmose/musicplayer.git
cd musicplayer
make
popd
cp "$TMP_DIR/musicplayer/build/libmusicplayer.dylib" "$BASE_DIR/libs/libmusicplayer.dylib"
cp -r "$TMP_DIR/musicplayer/data" "$BASE_DIR/libs/musicplayer_data"
