#!/bin/bash

# Params
# {1} VM Name - no spaces

NAME="{1}"

function exitFailed() {
    echo Failed
    exit 1
}

SPACE_PATTERN=" |'"
if [[ $NAME =~ $SPACE_PATTERN ]]; then 
    printf "VM name $NAME can't have spaces.\n"
    exitFailed
fi

if virsh list | grep $NAME; then
    printf "Power operating $NAME to force shut\n"
    if ! virsh destroy $NAME; then exitFailed; fi
fi

printf "WARNING!! VM $NAME will be deleted permanently at the end of this operation.\n"

printf "\n\nDeleting $NAME\n"
if ! virsh undefine $NAME --nvram; then exitFailed; fi
if ! rm -rf /kloudust/disks/$NAME.qcow2; then exitFailed; fi
if ! rm -rf /kloudust/metadata/$NAME.xml; then exitFailed; fi
if ! rm -rf /kloudust/metadata/$NAME.metadata; then exitFailed; fi

printf "\n\nVM $NAME deleted successfully\n"
exit 0
