#!/bin/bash

# Params
# {1} - Domain / VM name

NAME="{1}"

echoerr() { echo "$@" 1>&2; }

function exitFailed() {
    echo Failed.
    exit 1
}

if ! virsh vncdisplay $NAME &> /dev/null; then 
    echoerr No such VM.
    exitFailed; 
fi

printf "\n\nConnect via VNC to one of the following\n"
PORT=`virsh vncdisplay $NAME | cut -c 2-`;echo `ip route get 8.8.8.8 | head -1 | cut -d' ' -f7`:`expr 5900 + $PORT`
echo `hostname`:`expr 5900 + $PORT`

printf "\n\nVNC located successfully\n"
exit 0