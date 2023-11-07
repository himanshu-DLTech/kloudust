#!/bin/bash

echoerr() { echo "$@" 1>&2; }

function exitFailed() {
    echo Failed.
    exit 1
}

if ! virsh domifaddr {1} &> /dev/null; then
    echoerr No such KDS service.
    exitFailed; 
fi

printf "\n\KDS login is below\n"
IP=`virsh domifaddr {1} | tr -s ' ' | grep ipv4 | cut -d" " -f5 | cut -d"/" -f1`
echo IP Address: $IP
echo Port: 3306
echo DB Root ID: Root
echo DB Root Password: KloudustDB01
echo **** PLEASE IMMEDIATELY CHANGE THE ROOT PASSWORD ****

printf "\n\nKDS service located successfully\n"
exit 0