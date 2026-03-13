#!/usr/bin/env bash
set -euo pipefail

npm ci
bash ./scripts/test-all.sh
