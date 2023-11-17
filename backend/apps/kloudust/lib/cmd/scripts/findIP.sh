#!/bin/bash

# Params
# {1} - Domain / VM name

NAME="{1}"

echoerr() { echo "$@" 1>&2; }

function exitFailed() {
    echo Failed.
    exit 1
}

if ! virsh domifaddr $NAME &> /dev/null; then
    echoerr No such VM.
    exitFailed; 
fi

printf "\n\nVM IP is below\n"
IP=`virsh domifaddr $NAME | tr -s ' ' | grep ipv4 | cut -d" " -f5 | cut -d"/" -f1`
echo $IP

printf "\n\nIP located successfully\n"
exit 0