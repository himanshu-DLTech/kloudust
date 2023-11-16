#!/bin/bash

# Params
# {1} VM Name - no spaces
# {2} VM Description - can have spaces
# {3} VCPUS
# {4} RAM in MB
# {5} Disk Size in GB
# {6} Install disk name
# {7} Install disk download URI, CURL will be used
# {8} OS Variant as per virt-install --os-variant list
# {9} true means this is a pre-installed cloud image, false means no it is an ISO
# {10} Cloudinit YAML data or undefined if not available
# {11} Org which owns this VM
# {12} Project which owns this VM

NAME="{1}"
DESCRIPTION="{2}"
VCPUS={3}
RAM={4}
DISK_SIZE={5}
INSTALL_DISK="{6}"
INSTALL_URI="{7}"
OS_VARIANT={8}
CLOUD_IMAGE={9}
CLOUDINIT_USERDATA="{10}"
ORG="{11}"
PROJECT="{12}"

function exitFailed() {
    echo Failed
    exit 1
}

SPACE_PATTERN=" |'"
if [[ $NAME =~ $SPACE_PATTERN ]]; then 
    printf "VM name $NAME can't have spaces.\n"
    exitFailed
fi;

if virsh list --all | grep "$NAME"; then
    printf "VM already exists. Use a different name.\n"
    exitFailed
fi

if [ ! -f /kloudust/catalog/$INSTALL_DISK ]; then
    printf "VM install disk not found cached locally. Downloading first.\n"
    if ! curl $INSTALL_URI > /kloudust/catalog/$INSTALL_DISK; then exitFailed; fi
fi

printf "Creating VM $NAME\n"

DISK="path=/kloudust/disks/$NAME.qcow2"
BOOTCMD="--boot hd"
CLOUD_INIT="--cloud-init user-data=/kloudust/temp/ci_$NAME.yaml"
if [ "$CLOUD_IMAGE" == "true" ]; then # this is a cloud image file in QCow2 format, convert and load, else it is a CD-ROM ISO file
    if ! qemu-img convert -f qcow2 -O qcow2 /kloudust/catalog/$INSTALL_DISK /kloudust/disks/$NAME.qcow2; then exitFailed; fi
    if ! qemu-img resize /kloudust/disks/$NAME.qcow2 "$DISK_SIZE"G; then exitFailed; fi
    if [ "$CLOUDINIT_USERDATA" != "undefined" ] && [ -n "$CLOUDINIT_USERDATA" ]; then # check if a cloud init is provided 
        if ! printf "#cloud-config\n\n$CLOUDINIT_USERDATA" > /kloudust/temp/ci_$NAME.yaml; then exitFailed; fi
    else
        CLOUD_INIT=""
        echo !WARNING! $NAME is a cloud image but no cloud init was provided. Image may not boot or work properly.
    fi
else
    echo !WARNING! $NAME is being initialized using a non-cloud ready image. Manual install will be required.
    DISK="path=/kloudust/disks/$NAME.qcow2,size=$DISK_SIZE,format=qcow2"
    BOOTCMD="--cdrom /kloudust/catalog/$INSTALL_DISK"
    CLOUD_INIT=""
fi


if [[ "$OS_VARIANT" = win* ]]; then 
    WIN_DISK_ARGS="--disk /kloudust/drivers/virtio-win.iso,device=cdrom"
else
    WIN_DISK_ARGS=""
fi;

BASE64_METADATA=`echo "iscloud=$CLOUD_IMAGE>>>installuri=$INSTALL_URI>>>installdisk=/kloudust/catalog/$INSTALL_DISK>>>cloudinit=\"$CLOUDINIT_USERDATA\"" | base64 -w0`
if [ -z "$BASE64_METADATA" ]; then
	echo BASE64 metadata generation failed. >&2
	exitFailed
fi
if ! virt-install --name $NAME --metadata name=$NAME --metadata title="$DESCRIPTION" \
    --metadata description=$BASE64_METADATA \
    --vcpus $VCPUS --ram $RAM \
    --disk $DISK $WIN_DISK_ARGS \
    --os-variant $OS_VARIANT \
    --network network=default \
    --controller type=scsi,model=virtio-scsi \
    --graphics vnc,listen=0.0.0.0 --noautoconsole \
    --virt-type kvm \
    $BOOTCMD $CLOUD_INIT; then exitFailed; fi

printf "\n\nEnabling autostart\n"
if ! virsh autostart $NAME; then exitFailed; fi

printf "\n\nGenerating metadata\n"
cat <<EOF > /kloudust/metadata/$NAME.metadata
INSTALL="virt-install --name $NAME --metadata name=$NAME --metadata title=\"$DESCRIPTION\" \
    --metadata description=$BASE64_METADATA \
    --vcpus $VCPUS --ram $RAM \
    --disk $DISK $WIN_DISK_ARGS \
    --os-variant $OS_VARIANT \
    --network network=default \
    --controller type=scsi,model=virtio-scsi \
    --graphics vnc,listen=0.0.0.0 --noautoconsole \
    --virt-type kvm \
    $BOOTCMD $CLOUD_INIT"
NAME="$NAME"
DESCRIPTION="$DESCRIPTION"
VCPUS=$VCPUS
RAM=$RAM
DISK_SIZE=$DISK_SIZE
INSTALL_DISK="$INSTALL_DISK"
INSTALL_URI="$INSTALL_URI"
OS_VARIANT=$OS_VARIANT
CLOUD_IMAGE=$CLOUD_IMAGE
CLOUDINIT_USERDATA="$CLOUDINIT_USERDATA"
ORG="$ORG"
PROJECT="$PROJECT"
EOF
if ! virsh dumpxml $NAME > /kloudust/metadata/$NAME.xml; then exitFailed; fi


printf "\n\nConnect via VNC to one of the following\n"
PORT=`virsh vncdisplay $NAME | cut -c 2-`;echo `ip route get 8.8.8.8 | head -1 | cut -d' ' -f7`:`expr 5900 + $PORT`
echo `hostname`:`expr 5900 + $PORT`

printf "\n\nVM created successfully\n"
exit 0