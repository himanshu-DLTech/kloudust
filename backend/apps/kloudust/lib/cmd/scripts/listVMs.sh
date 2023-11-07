#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

printf "Showing VM list\n"
if ! virsh list --all; then exitFailed; fi

printf "\n\nSuccess\n"
exit 0