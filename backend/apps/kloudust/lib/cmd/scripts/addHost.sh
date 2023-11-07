# Params
# {1} The login ID

#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

printf "Updating the system\n"
if [ -f "`which yum`" ]; then 
    if ! sudo yum -y install epel-release; then exitFailed; fi
    if ! sudo yum -y update; then exitFailed; fi
else 
    if ! yes | sudo DEBIAN_FRONTEND=noninteractive apt -qq -y update; then exitFailed; fi
    if ! yes | sudo DEBIAN_FRONTEND=noninteractive apt -qq -y upgrade; then exitFailed; fi
fi

printf "Installing required software\n"
if [ -f "`which yum`" ]; then 
    if ! sudo yum -y install fail2ban; then exitFailed; fi
    if ! sudo yum -y install qemu-kvm libvirt virt-top bridge-utils libguestfs-tools virt-install; then exitFailed; fi
else
    if ! yes | sudo DEBIAN_FRONTEND=noninteractive apt -qq -y install fail2ban; then exitFailed; fi
    if ! yes | sudo DEBIAN_FRONTEND=noninteractive apt -qq -y install net-tools; then exitFailed; fi
    if ! yes | sudo DEBIAN_FRONTEND=noninteractive apt -qq -y install qemu-system-x86 libvirt-daemon-system libvirt-clients bridge-utils virtinst libosinfo-bin guestfs-tools; then exitFailed; fi
fi

printf "\n\nSecuring the system against SSH attacks\n"
if ! sudo cat <<EOF > /tmp/kdfail2ban.jail.local; then exitFailed; fi
[DEFAULT]
# Ban hosts for one hour:
bantime = 3600

# Override /etc/fail2ban/jail.d/00-firewalld.conf:
banaction = iptables-multiport

[sshd]
enabled = true
EOF
if ! sudo mv /tmp/kdfail2ban.jail.local /etc/fail2ban/jail.local; then exitFailed; fi
if ! sudo chown root:root /etc/fail2ban/jail.local; then exitFailed; fi
if ! sudo systemctl enable --now fail2ban; then exitFailed; fi


printf "\n\nEnabling hypervisor\n"
if ! sudo systemctl enable --now libvirtd; then exitFailed; fi
if ! sudo lsmod | grep -i kvm; then exitFailed; fi


printf "\n\nEnabling virtual networking\n"
if [ -f "`which yum`" ]; then 
    if ! sudo yum -y install https://repos.fedorapeople.org/repos/openstack/openstack-antelope/rdo-release-antelope-1.el9s.noarch.rpm openvswitch; then exitFailed; fi
    if ! sudo systemctl enable --now openvswitch; then exitFailed; fi
else
    if ! yes | sudo DEBIAN_FRONTEND=noninteractive apt -qq -y install openvswitch-switch openvswitch-common  openvswitch-switch-dpdk; then exitFailed; fi
    if ! sudo systemctl enable --now openvswitch-switch; then exitFailed; fi
fi

printf "\n\nCreating Kloudust Structures\n"
if ! sudo mkdir -p /kloudust/catalog/; then exitFailed; fi
if ! sudo mkdir -p /kloudust/drivers/; then exitFailed; fi
if ! sudo mkdir -p /kloudust/disks/; then exitFailed; fi
if ! sudo mkdir -p /kloudust/metadata/; then exitFailed; fi
if ! sudo mkdir -p /kloudust/snapshots/; then exitFailed; fi
if ! sudo mkdir -p /kloudust/temp/; then exitFailed; fi
if ! sudo mkdir -p /kloudust/system/; then exitFailed; fi

printf "\n\nDownloading additional drivers\n"
if [ "`cat /kloudust/drivers/virtio-win.version`" != "virtio-win-0.1.240.iso" ]; then
    if ! sudo bash -c "curl -L https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/archive-virtio/virtio-win-0.1.240-1/virtio-win-0.1.240.iso > /kloudust/drivers/virtio-win.iso"; then exitFailed; fi
    if ! sudo bash -c  'echo "virtio-win-0.1.240.iso" > /kloudust/drivers/virtio-win.version'; then exitFailed; fi
fi;

printf "\n\nGiving permissions to Kloudust folders to KVM"
if [ -f "`which yum`" ]; then 
    if ! sudo chgrp -R qemu /kloudust/; then exitFailed; fi
else 
    if ! sudo chgrp -R libvirt /kloudust/; then exitFailed; fi
fi

printf "\n\nChanging password, Kloudust is taking over the system\n"
if [ -f "`which yum`" ]; then 
    if ! echo '{1}' | passwd --stdin `whoami` > /dev/null; then exitFailed; fi
else
    if ! echo `whoami`':{1}' | sudo chpasswd > /dev/null; then exitFailed; fi
fi

printf "\n\nSystem initialization finished successfully\n"
exit 0