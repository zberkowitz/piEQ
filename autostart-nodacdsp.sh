#!/bin/bash
export PATH=/usr/local/bin:$PATH
export DISPLAY=:0.0
sleep 10 # can be lower (5) for rpi3

# start supercollider
sclang /home/pi/piEQ/audio/piEQ.scd &

# start Node
cd /home/pi/piEQ/UI 
sudo node index.js &
