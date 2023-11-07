#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

if virsh list --all | grep {1}; then
    printf "VM already exists. Use a different name.\n"
    exitFailed
fi


printf "Creating VM {1}\n"

DISK="path=/kloudust/disks/{1}.qcow2"
BOOTCMD="--boot hd"
CLOUD_INIT="--cloud-init user-data=/kloudust/temp/ci_{1}.yaml"
if [ "{8}" == "true" ]; then # this is a cloud image file in QCow2 format, convert and load, else it is a CD-ROM ISO file
    if ! qemu-img convert -f qcow2 -O qcow2 /kloudust/catalog/{6} /kloudust/disks/{1}.qcow2; then exitFailed; fi
    if ! qemu-img resize /kloudust/disks/{1}.qcow2 {5}G; then exitFailed; fi
    if [ "{9}" != "undefined" ] && [ -n "{9}" ]; then # check if a cloud init is provided 
        if ! printf "#cloud-config\n\n{9}" > /kloudust/temp/ci_{1}.yaml; then exitFailed; fi
    else
        CLOUD_INIT=""
        echo !WARNING! {1} is a cloud image but no cloud init was provided. Image may not boot or work properly.
    fi
else
    echo !WARNING! {1} is being initialized using a non-cloud ready image. Manual install will be required.
    DISK="path=/kloudust/disks/{1}.qcow2,size={5},format=qcow2"
    BOOTCMD="--cdrom /kloudust/catalog/{6}"
    CLOUD_INIT=""
fi


if [ "{7}" == "windows" ]; then 
    WIN_DISK_ARGS="--disk /kloudust/drivers/virtio-win.iso,device=cdrom"
else
    WIN_DISK_ARGS=""
fi;

if ! virt-install --name {1} --metadata title="{2}" --metadata description="{1}-{2}-{8}-{9}" \
    --vcpus {3} --ram {4} \
    --disk $DISK $WIN_DISK_ARGS \
    --os-variant {7} \
    --network network=default \
    --controller type=scsi,model=virtio-scsi \
    --graphics vnc,listen=0.0.0.0 --noautoconsole \
    --virt-type kvm \
    $BOOTCMD $CLOUD_INIT; then exitFailed; fi

printf "\n\nEnabling autostart\n"
if ! virsh autostart {1}; then exitFailed; fi

printf "\n\nGenerating metadata\n"
cat <<EOF > /kloudust/metadata/{1}.metadata
INSTALL="virt-install --name {1} --metadata title=\"{2}\" --metadata description=\"{1}-{2}-{10}-{11}\" \
    --vcpus {3} --ram {4} \
    --disk $DISK $WIN_DISK_ARGS \
    --os-variant {7} \
    --network network=default \
    --controller type=scsi,model=virtio-scsi \
    --graphics vnc,listen=0.0.0.0 --noautoconsole \
    --virt-type kvm \
    $BOOTCMD $CLOUD_INIT"
NAME="{1}"
DESCRIPTION="{2}"
VCPUS={3}
RAM={4}
DISK_SIZE={5}
INSTALL_DISK="{6}"
OS_VARIANT={7}
CLOUD_IMAGE={8}
CLOUDINIT_USERDATA="{9}"
ORG="{10}"
PROJECT="{11}"
EOF
if ! virsh dumpxml {1} > /kloudust/metadata/{1}.xml; then exitFailed; fi


printf "\n\nConnect via VNC to one of the following\n"
PORT=`virsh vncdisplay {1} | cut -c 2-`;echo `ip route get 8.8.8.8 | head -1 | cut -d' ' -f7`:`expr 5900 + $PORT`
echo `hostname`:`expr 5900 + $PORT`

printf "\n\nVM created successfully\n"
exit 0