#!/bin/bash


function exitFailed() {
    echo Failed
    exit 1
}


if virsh list | grep {1}; then
    printf "Power operating {1} to force shut\n"
    if ! virsh destroy {1}; then exitFailed; fi
fi


printf "\n\nDeleting {1}\n"
if ! virsh undefine {1} --nvram; then exitFailed; fi
if ! rm -rf /kloudust/disks/{1}.qcow2; then exitFailed; fi
if ! rm -rf /kloudust/metadata/{1}.xml; then exitFailed; fi
if ! rm -rf /kloudust/metadata/{1}.metadata; then exitFailed; fi

printf "\n\nVM deleted successfully\n"
exit 0
