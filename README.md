# pi-wifi-switch
Scripts for a motion activated WiFi-switch turn-on sequence used for an art installation.

Two types of WiFi switches were used in the project
1. TPLink WiFi switch powered by Kasa, which can be controlled over WiFi with the following library: https://github.com/konsumer/tplink-lightbulb
1. Set of Chinese WiFi switches powered by [Tuya](https://www.tuya.com/) or [SmartLife](https://play.google.com/store/apps/details?id=com.tuya.smartlife&hl=en) with the following library: https://github.com/codetheweb/tuyapi

## Motion Sensor
The motion sensor used to start the sequence was connected directly to the raspberry Pi. The inputs from the motion sensor were read by a python script, which sent a GET request to the node server that controlled the WiFi switches.

## WiFi Switch control
A NodeJS script was written so the WiFi switch turn-on sequence could be started by a request triggered by the motion sensor. In this particular setup, the script runs on the same raspberry Pi the motion sensor was connected to.
