#!/bin/bash

# Params
# {1} The IP to assign

IP_TO_ASSIGN="{1}"

function exitFailed() {
    echo Failed.
    exit 1
}

if ! netplan set 'network.ethernets.$bootif.addresses=['"$IP_TO_ASSIGN/24]"; then exitFailed; fi
if ! netplan apply; then exitFailed; fi

printf "\nIP assignment successful\n"
exit 0