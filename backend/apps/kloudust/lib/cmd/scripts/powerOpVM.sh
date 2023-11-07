#!/bin/bash


function exitFailed() {
    echo Failed
    exit 1
}

printf "Power operating {1}\n"
if ! virsh {2} {1}; then exitFailed; fi

printf "\n\nPower operation successfull\n"
exit 0
