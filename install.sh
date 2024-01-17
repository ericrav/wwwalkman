#! /bin/bash

echo "Installing bun..."
curl -fsSL https://bun.sh/install | bash

apt-get update

echo "Installing PulseAudio..."
apt-get install pulseaudio

echo "Installing minimodem..."
apt-get install minimodem

