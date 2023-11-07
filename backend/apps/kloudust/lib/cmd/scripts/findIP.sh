#!/bin/bash

echoerr() { echo "$@" 1>&2; }

function exitFailed() {
    echo Failed.
    exit 1
}

if ! virsh domifaddr {1} &> /dev/null; then
    echoerr No such VM.
    exitFailed; 
fi

printf "\n\nVM IP is below\n"
IP=`virsh domifaddr {1} | tr -s ' ' | grep ipv4 | cut -d" " -f5 | cut -d"/" -f1`
echo $IP

printf "\n\nIP located successfully\n"
exit 0