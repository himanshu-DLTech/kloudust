#!/bin/bash

LOGIN="$1"
PW="$2"
HOSTKEY="$3"
FILE="$4"
PORT="$5"
HOST="$6"

cat "$FILE" | sshpass -p "$PW" ssh -T -o StrictHostKeyChecking=no -l "$LOGIN" $HOST
