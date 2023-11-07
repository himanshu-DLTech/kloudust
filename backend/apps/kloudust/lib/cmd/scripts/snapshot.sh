#!/bin/bash


function exitFailed() {
    sudo rm -rf /kloudust/snapshots/{1}.{2}.timestamp
    sudo rm -rf /kloudust/snapshots/{1}.{2}.disk.qcow2
    echo Failed
    exit 1
}

if sudo ls /kloudust/snapshots/{1}.{2}.disk.qcow2; then 
    echo Error: Snapshot {2} for VM {1} already exists.
    exitFailed; 
fi

TIMESTAMP=`date +%s%N | cut -b1-13`
UTC_DATE=`date -u`
OLDDISK=`virsh domblklist {1} | grep vda | tr -s " " | xargs | cut -d" " -f2`

if [ -z "$OLDDISK" ]; then 
    echo Unable to locate VM disk
    exitFailed
fi
echo Old disk located at $OLDDISK

printf "\n\nSnapshotting {1} to image named {2}\n"
if ! virsh snapshot-create-as --no-metadata --domain {1} {2} \
    --diskspec vda,file=/kloudust/disks/{1}.$TIMESTAMP.qcow2,snapshot=external \
    --disk-only --atomic; then exitFailed; fi

printf "\n\nAdding additional snapshot metadata\n"
sudo echo $TIMESTAMP > /kloudust/snapshots/{1}.{2}.timestamp
sudo echo UTC Date: $UTC_DATE >> /kloudust/snapshots/{1}.{2}.timestamp

printf "\n\nMaking snapshot independent\n"
# The step below makes the olddisk free by moving all current changes to the latest active snapshot disk
if ! virsh blockpull --domain {1} --path /kloudust/disks/{1}.$TIMESTAMP.qcow2 --verbose --wait; then exitFailed; fi
# now we move the olddisk, which was current till this snapshot was taken, to the snapshots directory
# to restore the snapshot this is the disk we need to restore to
sudo mv $OLDDISK /kloudust/snapshots/{1}.{2}.disk.qcow2

printf "\n\nSnapshot successful\n"
exit 0
