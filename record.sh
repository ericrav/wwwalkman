#! /bin/bash
set -e

cat ./html/output.html | minimodem -t 1200
