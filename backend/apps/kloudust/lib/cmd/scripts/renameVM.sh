#!/bin/bash


# Params
# {1} Old VM Name - no spaces
# {2} New VM Name - no spaces

OLD_NAME="{1}"
NEW_NAME="{2}"

function exitFailed() {
    echo Failed
    exit 1
}

SPACE_PATTERN=" |'"
if [[ $OLD_NAME =~ $SPACE_PATTERN ]]; then 
    printf "Old VM name $OLD_NAME can't have spaces.\n"
    exitFailed
fi
if [[ $NEW_NAME =~ $SPACE_PATTERN ]]; then 
    printf "New VM name $NEW_NAME can't have spaces.\n"
    exitFailed
fi

printf "WARNING!! VM $OLD_NAME will be restared at the end of this operation.\n"

printf "Renaming $OLD_NAME to $NEW_NAME\n"
if ! virsh domrename $OLD_NAME $NEW_NAME; then exitFailed; fi
if ! mv /kloudust/metadata/$OLD_NAME.metadata /kloudust/metadata/$NEW_NAME.metadata; then exitFailed; fi
if ! mv /kloudust/metadata/$OLD_NAME.xml /kloudust/metadata/$NEW_NAME.xml; then exitFailed; fi
if ! virt-xml $NEW_NAME --edit source.file=/kloudust/disks/$OLD_NAME.qcow2 \
    --disk source.file=/kloudust/disks/$NEW_NAME.qcow2; then exitFailed; fi
if ! mv /kloudust/disks/$OLD_NAME.qcow2 /kloudust/disks/$NEW_NAME.qcow2; then exitFailed; fi

printf "Restarting VM as new name $NEW_NAME\n"
if ! virsh reboot $NEW_NAME; then exitFailed; fi

printf "\n\nRename successfull\n"
exit 0
