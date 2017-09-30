#!/usr/bin/env bash
set -eu

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pushd $TMP_DIR
git clone https://github.com/chirlu/soxr.git
cd soxr
./go
popd
cp "$TMP_DIR/soxr/Release/src/libsoxr.0.1.0.dylib" "$BASE_DIR/libs/libsoxr.dylib"
