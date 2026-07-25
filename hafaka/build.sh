#!/usr/bin/env bash
# Rebuild the encrypted /hafaka page from the Excel file.
# Run after editing "ספקים ולוז.xlsx". Only the encrypted index.html gets committed.
set -e
cd "$(dirname "$0")"
python3 extract.py
node encrypt.mjs
echo "done. hafaka/index.html now holds the encrypted data."
