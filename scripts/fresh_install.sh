#!/usr/bin/env sh

PARENT_DIR=..

rm -rf \
  $PARENT_DIR/node_modules \
  $PARENT_DIR/releases \
  $PARENT_DIR/dist \
  $PARENT_DIR/*lock* \
  $PARENT_DIR/*.log
