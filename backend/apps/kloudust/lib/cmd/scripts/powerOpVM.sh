#!/bin/bash

# Params
# {1} - Domain / VM name
# {2} - The operation to perform

NAME="{1}"
POWER_OP="{2}"

function exitFailed() {
    echo Failed
    exit 1
}

printf "Power operating {1}\n"
if ! virsh $NAME $POWER_OP; then exitFailed; fi

printf "\n\nPower operation $POWER_OP successfull on $NAME\n"
exit 0
