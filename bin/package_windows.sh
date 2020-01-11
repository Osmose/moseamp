#!/usr/bin/env bash
set -eux

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)

function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pushd $TMP_DIR
  cp -r $BASE_DIR/package.json $TMP_DIR
  cp -r $BASE_DIR/build $TMP_DIR
  cp -r $BASE_DIR/node_modules $TMP_DIR
popd
pushd $BASE_DIR
  ./node_modules/.bin/electron-packager $TMP_DIR MoseAmp \
    --platform=win32 \
    --icon=resources/windows/moseamp.ico \
    --out=dist \
    --overwrite
  rm -f $BASE_DIR/dist/MoseAmp.zip
  pushd $BASE_DIR/dist/MoseAmp-win32-x64/
    ../../node_modules/.bin/bestzip ../MoseAmp.zip *
  popd
popd
