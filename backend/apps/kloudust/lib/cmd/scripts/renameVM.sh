#!/bin/bash

# Params
# {1} Old VM Name - no spaces
# {2} New VM Name - no spaces

OLD_NAME="{1}"
NEW_NAME="{2}"
SHUTDOWN_WAIT=${3}
SHUTDOWN_WAIT="${SHUTDOWN_WAIT:-90}"    # Default it to 90 seconds if not provided

function exitFailed() {
    echo Failed
    exit 1
}

function waitProcessKilled() {
    PID=$1
    TIME_TO_WAIT=$2

    WAITED_SO_FAR=0
    while [ $WAITED_SO_FAR -lt $TIME_TO_WAIT ]; do
        ps --pid $PID
        if [ "$?" == "1" ]; then return 0; 
        else 
            sleep 5
            WAITED_SO_FAR=$(($WAITED_SO_FAR+5))
        fi
    done
    return 1
}

function shutdownVM() {
    VMNAME=$1
    VMPID=`ps ax | grep $VMNAME | grep kvm | tr -s " " | xargs  | cut -d" " -f1`
    if ! virsh shutdown $VMNAME; then exitFailed; fi
    waitProcessKilled $VMPID $SHUTDOWN_WAIT
    if [ "$?" == "1" ]; then  
        echo VM graceful shutdown timed out for $VMNAME after waiting $SHUTDOWN_WAIT seconds, destroying it instead. 
        if ! virsh destroy $VMNAME; then 
            echo VM destroy failed as well for $VMNAME.
            return 1
        else
            echo VM $VMNAME was shutdown via forced destroy.
        fi
    else
        echo Warning!! VM $VMNAME was shutdown gracefully.
    fi
    return 0
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
if ! shutdownVM $OLD_NAME; then exitFailed; fi

if ! virsh domrename $OLD_NAME $NEW_NAME; then exitFailed; fi   # rename the domain

# now move the files
if ! mv /kloudust/metadata/$OLD_NAME.metadata /kloudust/metadata/$NEW_NAME.metadata; then exitFailed; fi
if ! mv /kloudust/metadata/$OLD_NAME.xml /kloudust/metadata/$NEW_NAME.xml; then exitFailed; fi
if ! mv /kloudust/disks/$OLD_NAME.qcow2 /kloudust/disks/$NEW_NAME.qcow2; then exitFailed; fi

# now edit domain XML to point to the new drive
if ! virt-xml $NEW_NAME --edit source.file=/kloudust/disks/$OLD_NAME.qcow2 \
    --disk source.file=/kloudust/disks/$NEW_NAME.qcow2; then exitFailed; fi

printf "Restarting VM as new name $NEW_NAME\n"
if ! virsh start $NEW_NAME; then exitFailed; fi

printf "\n\nRenamed $OLD_NAME to $NEW_NAME successfully.\n"
exit 0
