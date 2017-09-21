#!/usr/bin/env bash
set -eu

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pushd $TMP_DIR
git clone --recursive https://github.com/Osmose/aosdklib.git
cd aosdklib
python3 ./build.py
popd
cp "$TMP_DIR/aosdklib/aosdk.dylib" "$BASE_DIR/libs/libaosdk.dylib"
