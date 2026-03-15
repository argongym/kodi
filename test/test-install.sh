#!/bin/bash

# Build and run the Termux test container
# Usage: ./test-install.sh [--local]
#   --local   Use local install.sh instead of fetching from GitHub

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

echo "==================================="
echo "  Termux Test Container"
echo "==================================="
echo ""

# Build the image
echo "[1/2] Building Docker image..."
docker build -t kodi-termux-test "$SCRIPT_DIR"

# Run the container
echo "[2/2] Running install script..."
echo ""

if [ "$1" = "--local" ]; then
    # Mount local repo and run install.sh from local copy
    docker run --rm -it \
        -v "$REPO_DIR/install.sh:/tmp/install.sh:ro" \
        kodi-termux-test \
        bash /tmp/install.sh
else
    # Fetch install.sh from GitHub (real scenario)
    docker run --rm -it kodi-termux-test
fi
