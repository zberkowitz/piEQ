#!/bin/bash
export PATH=/usr/local/bin:$PATH
export DISPLAY=:0.0
sleep 10 # can be lower (5) for rpi3

# settings for dac+ dsp
dsptoolkit write-mem 0xF106 0x0003
dsptoolkit write-mem 0xF146 0x0004
dsptoolkit write-mem 0xF107 0x0000
dsptoolkit write-mem 0xF195 0x0000
dsptoolkit write-mem 0xF194 0x0033
dsptoolkit write-mem 0xF21C 0x6C40

dsptoolkit write-reg 0xF106 0x0003
dsptoolkit write-reg 0xF146 0x0004
dsptoolkit write-reg 0xF107 0x0000
dsptoolkit write-reg 0xF195 0x0000
dsptoolkit write-reg 0xF194 0x0033
dsptoolkit write-reg 0xF21C 0x6C40

# start supercollider
sclang /home/pi/piEQ/audio/piEQ.scd &

# start Node
cd /home/pi/piEQ/UI 
sudo node index.js &
