set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default: help

help:
    @echo "Usage: just [recipe]"
    @echo ""
    @echo "Development tasks for setup-jlo:"
    @just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

# Format repository files with Biome
format:
    npm run format

# Verify repository formatting with Biome
format-check:
    npm run format:check

# Run Biome lint checks
lint:
    npm run lint

# Run TypeScript typecheck
typecheck:
    npm run typecheck

# Run test suite
test:
    npm run test

# Build committed GitHub Action distribution
package:
    npm run package

# Verify committed dist output matches generated output
verify-dist:
    npm run verify:dist
