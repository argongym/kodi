#!/data/data/com.termux/files/usr/bin/sh

cd ~/kodi

while true; do
    echo "[$(date)] Checking for updates..."

    git fetch origin master 2>/dev/null

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/master)

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "[$(date)] Update found! $LOCAL -> $REMOTE"
        git pull origin master
        npm install --production
        echo "[$(date)] Updated and dependencies installed."
    else
        echo "[$(date)] Already up to date."
    fi

    echo "[$(date)] Starting application..."
    node main.js
    EXIT_CODE=$?

    echo "[$(date)] Application exited with code $EXIT_CODE. Restarting in 3 seconds..."
    sleep 3
done
