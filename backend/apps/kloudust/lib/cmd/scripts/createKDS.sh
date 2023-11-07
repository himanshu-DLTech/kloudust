#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

if virsh list --all | grep {1}; then
    printf "KDS instance with that name already exists. Use a different name.\n"
    exitFailed
fi

printf "Creating KDS Instance {1}\n"
if ! cp /kloudust/catalog/kds.qcow2 /kloudust/disks/{1}.qcow2; then existFailed; fi
if ! virt-install --name {1} --metadata title="{2}" --metadata description="{1}-{2}-{5}-{6}" \
    --vcpus {3} --ram {4} \
    --disk path=/kloudust/disks/{1}.qcow2,format=qcow2 --import \
    --os-type linux --os-variant centos8 \
    --network network=default \
    --controller type=scsi,model=virtio-scsi \
    --graphics vnc,listen=0.0.0.0 --noautoconsole \
    --virt-type kvm; then exitFailed; fi

printf "\n\nEnabling autostart\n"
if ! virsh autostart {1}; then exitFailed; fi

printf "\n\nGenerating metadata\n"
cat <<EOF > /kloudust/metadata/{1}.metadata
NAME={1}
DESCRIPTION="{2}"
VCPUS={3}
RAM={4}
INSTALL_DISK=/kloudust/catalog/kds.qcow2
ORG="{5}"
PROJECT="{6}"
EOF
if ! virsh dumpxml {1} > /kloudust/metadata/{1}.xml; then exitFailed; fi


printf "\n\nConnect via VNC to one of the following\n"
PORT=`virsh vncdisplay {1} | cut -c 2-`;echo `ip route get 8.8.8.8 | head -1 | cut -d' ' -f7`:`expr 5900 + $PORT`
echo `hostname`:`expr 5900 + $PORT`

printf "\n\nVM created successfully\n"
exit 0