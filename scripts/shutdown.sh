#!/bin/bash

sleep 3.5h && sudo systemctl stop motion-sensor.service && curl localhost/lights/on-all && sudo shutdown -h 5
