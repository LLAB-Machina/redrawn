#!/bin/sh
set -e

echo "Installing dependencies on macOS..."

# Check and install Homebrew
echo "Checking Homebrew..."
BREW_CMD=$(command -v brew || ( [ -x /opt/homebrew/bin/brew ] && echo /opt/homebrew/bin/brew ) || ( [ -x /usr/local/bin/brew ] && echo /usr/local/bin/brew ) || echo "")

if [ -z "$BREW_CMD" ]; then
    echo "Homebrew not found. Installing Homebrew..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    BREW_CMD=$(command -v brew || ( [ -x /opt/homebrew/bin/brew ] && echo /opt/homebrew/bin/brew ) || ( [ -x /usr/local/bin/brew ] && echo /usr/local/bin/brew ))
fi

echo "Using Homebrew at: $BREW_CMD"
$BREW_CMD update

echo "Installing dependencies via Homebrew..."
$BREW_CMD install go node golangci-lint golines gofumpt jq ariga/tap/atlas || true

echo "Ensuring golines is available..."
if ! command -v golines >/dev/null 2>&1; then
    echo "golines not found in PATH; please install via Homebrew: brew install golines"
fi

echo "macOS dependencies installation completed!"
