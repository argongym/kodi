#!/data/data/com.termux/files/usr/bin/sh

# Kodi Companion — one-command installer for Termux
# Usage: curl -sL https://raw.githubusercontent.com/argongym/kodi/master/install.sh | bash

set -e

echo "==================================="
echo "  Kodi Companion Installer"
echo "==================================="
echo ""

# 1. Install system dependencies
echo "[1/6] Installing system packages..."
pkg update -y
pkg install -y termux-api git nodejs sqlite iconv curl python

# 2. Grant storage access (if not already granted)
echo "[2/6] Setting up storage access..."
if [ ! -d ~/storage ]; then
    termux-setup-storage
    echo "  Storage access granted. Waiting 3 seconds..."
    sleep 3
else
    echo "  Storage already set up."
fi

# 3. Clone repo
echo "[3/6] Cloning repository..."
if [ -d ~/kodi ]; then
    echo "  Directory already exists. Pulling latest changes..."
    cd ~/kodi
    git pull origin master
else
    git clone https://github.com/argongym/kodi.git ~/kodi
    cd ~/kodi
fi

# 4. Install npm dependencies
echo "[4/6] Installing npm dependencies..."
npm install --no-bin-links --production

# 5. Set up autostart (Termux:Boot)
echo "[5/6] Setting up autostart..."
mkdir -p ~/.termux/boot
cp -f ~/kodi/.termux/boot/autorun.sh ~/.termux/boot/autorun.sh
chmod +x ~/.termux/boot/autorun.sh
chmod +x ~/kodi/start.sh
echo "  Autostart configured."

# 6. Configure
echo "[6/6] Configuring..."
if [ ! -f ~/kodi/config.json ]; then
    echo ""
    echo "  config.json not found. Starting configuration wizard..."
    echo "  Open http://127.0.0.1:3000/ in your browser."
    echo "  After saving, press Ctrl+C and run:"
    echo "    cp ~/kodi/config-tmp.json ~/kodi/config.json"
    echo ""
    cd ~/kodi && npm run config
else
    echo "  config.json already exists. Skipping."
fi

echo ""
echo "==================================="
echo "  Installation complete!"
echo "==================================="
echo ""
echo "  To start:   cd ~/kodi && ./start.sh"
echo "  To config:   cd ~/kodi && npm run config"
echo ""
echo "  Make sure to install Termux:Boot app"
echo "  and disable battery optimization for"
echo "  Termux and Termux:Boot in Android settings."
echo ""
