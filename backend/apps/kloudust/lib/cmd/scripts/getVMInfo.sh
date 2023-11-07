#!/bin/bash


function exitFailed() {
    echo Failed
    exit 1
}


printf "\n\Information on {1}\n"
if ! cat /kloudust/metadata/{1}.metadata; then exitFailed; fi
if ! virsh dominfo {1}; then exitFailed; fi
if ! virsh domblklist {1}; then exitFailed; fi
if ! virsh domiflist {1}; then exitFailed; fi

printf "\n\nVM information queried successfully\n"
exit 0
