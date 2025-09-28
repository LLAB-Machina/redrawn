#!/bin/sh
set -e

echo "Installing dependencies on Linux (Debian/Ubuntu)..."

# Check if we're on a Debian/Ubuntu system
if ! command -v apt-get >/dev/null 2>&1; then
    echo "apt-get not found. This script only supports Debian/Ubuntu systems."
    echo "Please install dependencies manually or use a different installation method."
    exit 1
fi

echo "Updating package lists..."
sudo apt-get update

echo "Installing system dependencies..."
sudo apt-get install -y curl wget git build-essential jq

# Install Go
if ! command -v go >/dev/null 2>&1; then
    echo "Installing Go..."
    GO_VERSION=1.21.5
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) GO_ARCH=amd64 ;;
        aarch64|arm64) GO_ARCH=arm64 ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    
    curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz" -o /tmp/go.tar.gz
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    
    # Add Go to PATH
    echo 'export PATH=/usr/local/go/bin:$PATH' | sudo tee /etc/profile.d/go.sh
    export PATH=/usr/local/go/bin:$PATH
    
    echo "Go installed. You may need to restart your shell or run: export PATH=/usr/local/go/bin:\$PATH"
else
    echo "Go already installed: $(go version)"
fi

# Install Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install Atlas
if ! command -v atlas >/dev/null 2>&1; then
    echo "Installing Atlas..."
    curl -sSf https://atlasgo.sh | sh
else
    echo "Atlas already installed: $(atlas version)"
fi

# Install golangci-lint
if ! command -v golangci-lint >/dev/null 2>&1; then
    echo "Installing golangci-lint..."
    # Ensure Go is in PATH for this session
    export PATH=/usr/local/go/bin:$PATH
    curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
else
    echo "golangci-lint already installed: $(golangci-lint version)"
fi

echo "Linux dependencies installation completed!"
