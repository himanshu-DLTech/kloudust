#!/bin/bash


function exitFailed() {
    echo Failed
    exit 1
}

printf "Renaming {1} to {2}\n"
if ! virsh domrename {1} {2}; then exitFailed; fi
if ! mv /kloudust/metadata/{1}.metadata /kloudust/metadata/{2}.metadata; then exitFailed; fi
if ! mv /kloudust/metadata/{1}.xml /kloudust/metadata/{2}.xml; then exitFailed; fi

printf "\n\nRename successfull\n"
exit 0
