#!/bin/bash

LOGIN="$1"
PW="$2"
HOSTKEY="$3"
FILE="$4"
HOST="$5"

echo "Executing remote file -> cat \"$FILE\" | sshpass -p \"*********\" ssh -T -o StrictHostKeyChecking=no -l \"$LOGIN\" $HOST"
cat "$FILE" | sshpass -p "$PW" ssh -T -o StrictHostKeyChecking=no -l "$LOGIN" $HOST
