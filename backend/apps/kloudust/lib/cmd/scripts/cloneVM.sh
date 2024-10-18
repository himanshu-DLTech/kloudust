#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

printf "Cloning VM {1} to {2}\n"
if ! virt-clone --original {1} --auto-clone --name {2}; then exitFailed; fi

printf "\n\nGenerating metadata\n"
cat <<EOF > /kloudust/metadata/{2}.metadata
NAME={2}
EOF
cat /kloudust/metadata/{1}.metadata | grep -v NAME >> /kloudust/metadata/{2}.metadata
if ! virsh dumpxml {2} > /kloudust/metadata/{2}.xml; then exitFailed; fi

printf "Enabling autostart"
if ! virsh autostart {2}; then exitFailed; fi

printf "\n\nClone successful\n"
exit 0
