#!/bin/bash

# Params
# $VM_NAME The VM name
# $SNAPSHOT_NAME The snapshot name

VM_NAME={1}
SNAPSHOT_NAME={2}

function exitFailed() {
    sudo rm -rf /kloudust/snapshots/$VM_NAME.$SNAPSHOT_NAME.timestamp
    sudo rm -rf /kloudust/snapshots/$VM_NAME.$SNAPSHOT_NAME.disk.qcow2
    echo Failed
    exit 1
}

if sudo ls /kloudust/snapshots/$VM_NAME.$SNAPSHOT_NAME.disk.qcow2; then 
    echo Error: Snapshot $SNAPSHOT_NAME for VM $VM_NAME already exists.
    exitFailed; 
fi

TIMESTAMP=`date +%s%N | cut -b1-13`
UTC_DATE=`date -u`
OLDDISK=`virsh domblklist $VM_NAME | grep vda | tr -s " " | xargs | cut -d" " -f2`

if [ -z "$OLDDISK" ]; then 
    echo Unable to locate VM disk
    exitFailed
fi
echo Old disk located at $OLDDISK

printf "\n\nSnapshotting $VM_NAME to image named $SNAPSHOT_NAME\n"
if ! virsh snapshot-create-as --no-metadata --domain $VM_NAME $SNAPSHOT_NAME \
    --diskspec vda,file=/kloudust/disks/$VM_NAME.$TIMESTAMP.qcow2,snapshot=external \
    --disk-only --atomic; then exitFailed; fi

printf "\n\nAdding additional snapshot metadata\n"
sudo echo $TIMESTAMP > /kloudust/snapshots/$VM_NAME.$SNAPSHOT_NAME.timestamp
sudo echo UTC Date: $UTC_DATE >> /kloudust/snapshots/$VM_NAME.$SNAPSHOT_NAME.timestamp

printf "\n\nMaking snapshot independent\n"
# The step below makes the olddisk free by moving all current changes to the latest active snapshot disk
if ! virsh blockpull --domain $VM_NAME --path /kloudust/disks/$VM_NAME.$TIMESTAMP.qcow2 --verbose --wait; then exitFailed; fi
# now we move the olddisk, which was current till this snapshot was taken, to the snapshots directory
# to restore the snapshot this is the disk we need to restore to
sudo mv $OLDDISK /kloudust/snapshots/$VM_NAME.$SNAPSHOT_NAME.disk.qcow2

printf "\n\nSnapshot successful\n"
exit 0
