FROM node:18-slim

# Install system packages that Termux would provide
RUN apt-get update && apt-get install -y \
    git \
    sqlite3 \
    curl \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Create Termux directory structure
RUN mkdir -p /data/data/com.termux/files/usr/bin \
    && ln -s /bin/sh /data/data/com.termux/files/usr/bin/sh

# Install stub commands
COPY stubs/pkg /usr/local/bin/pkg
COPY stubs/termux-setup-storage /usr/local/bin/termux-setup-storage
COPY stubs/termux-wake-lock /usr/local/bin/termux-wake-lock
RUN chmod +x /usr/local/bin/pkg \
    /usr/local/bin/termux-setup-storage \
    /usr/local/bin/termux-wake-lock

WORKDIR /root

# Set git config (needed for clone)
RUN git config --global user.email "test@test.com" \
    && git config --global user.name "Test"

# Default: run the install script
CMD ["bash", "-c", "curl -sL https://raw.githubusercontent.com/argongym/kodi/master/install.sh | bash"]
