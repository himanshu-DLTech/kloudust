#!/bin/bash

# Params 
# {1} - VM Name

VM_NAME={1}

function exitFailed() {
    echo Failed
    exit 1
}

printf "\nInformation on $VM_NAME\n"
if ! cat /kloudust/metadata/$VM_NAME.metadata | grep -v INSTALL | grep -v CLOUDINIT_USERDATA; then exitFailed; fi
if ! virsh dominfo $VM_NAME; then exitFailed; fi
if ! virsh domblklist $VM_NAME; then exitFailed; fi
if ! virsh domiflist $VM_NAME; then exitFailed; fi
if ! virsh domifaddr $VM_NAME; then exitFailed; fi

printf "\n\nVM information queried successfully\n"
exit 0
