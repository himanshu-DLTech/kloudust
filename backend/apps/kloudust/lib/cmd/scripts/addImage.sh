#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

printf "Adding image to catalog\n"
if ! sudo bash -c 'curl -L "{1}" > /kloudust/catalog/{2}'; then exitFailed; fi
if ! sudo ls -al /kloudust/catalog/{2}; then exitFailed; fi


printf "\n\nGiving KVM permissions to the image"
if [ -f "`which yum`" ]; then 
    if ! sudo chgrp qemu /kloudust/catalog/{2}; then exitFailed; fi
else 
    if ! sudo chgrp libvirt /kloudust/catalog/{2}; then exitFailed; fi
fi

printf "\n\nImage added successfully\n"
exit 0