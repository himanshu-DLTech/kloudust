#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

if ! sudo ls /kloudust/snapshots/{1}.{2}.disk.qcow2; then 
    echo Error: Snapshot {2} for the VM {1} does not exist.
    exitFailed
fi

TIMESTAMP=`date +%s%N | cut -b1-13`
SNAPSHOT_DISK=/kloudust/snapshots/{1}.{2}.disk.qcow2
VM_OLD_DISK=`virsh dumpxml {1} | grep -Poz "<source file='/kloudust/disks/.+?\.qcow2'" | cut -d"'" -f2`
VM_NEW_DISK=/kloudust/disks/{1}.qcow2
TMP_XML_FILE=/tmp/kloudust_vm_definition_{1}_$TIMESTAMP.xml
RESTART_VM={3}

if [ -z "$VM_OLD_DISK" ]; then 
    echo Error: VM {1} is not a standard Kloudust VM, unable to locate source disk. Quitting.
    exitFailed
fi

printf "\n\nShutting down VM {1}\n"
virsh destroy {1}
if ! virsh dumpxml {1} | sed "s#$VM_OLD_DISK#$VM_NEW_DISK#g" > $TMP_XML_FILE; then exitFailed; fi
if ! virsh undefine {1} --snapshots-metadata --remove-all-storage; then exitFailed; fi
if ! sudo rm -rf $VM_OLD_DISK; then exitFailed; fi

printf "\n\nRestoring snapshot {2} to {1}\n"
if ! sudo cp -f $SNAPSHOT_DISK $VM_NEW_DISK; then exitFailed; fi
if ! virsh define $TMP_XML_FILE; then exitFailed; fi

if [ "$RESTART_VM" == "restart" ]; then
    printf "\n\nRestarting VM {1}\n"
    if ! virsh start {1} --force-boot; then exitFailed; fi
fi


printf "\n\nVM restored successfully\n"
exit 0