import RPi.GPIO as GPIO
from time import sleep
import http.client
import json

pin = 8

def setup():
    GPIO.setmode(GPIO.BOARD);
    GPIO.setup(pin, GPIO.IN);

def startRun():
    alreadyRunning = False
    try:
        conn = http.client.HTTPConnection('localhost', 8080) # TODO: make port an env variable
        conn.request('GET', '/run')
        resp = conn.getresponse()
        d = json.loads(resp.read().decode())
        if d['status'] == 'running':
            alreadyRunning = True
    except Exception as e:
        print(e)
    finally:
        if alreadyRunning:
            sleep(60)
        else:
            sleep(180)

def doLoop():
    while True:
        detected = GPIO.input(pin)
        if detected:
            print('motion detected', detected)
            startRun()
setup()
doLoop()
