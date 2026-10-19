#!/bin/bash

function exitFailed() {
    echo Failed
    exit 1
}

printf "Cloning VM {1} to {2}\n"
if ! sudo virt-clone --original {1} --auto-clone --name {2}; then exitFailed; fi

printf "\n\nResetting clone identity\n"
if ! sudo virt-sysprep --domain {2} --hostname "{3}" \
    --operations customize,machine-id,ssh-hostkeys,udev-persistent-net,net-hostname,net-hwaddr \
    --run-command 'ssh-keygen -A' \
    --run-command 'if [ -f /etc/netplan/50-cloud-init.yaml ]; then sed -i "/^[[:space:]]*match:/,/^[[:space:]]*dhcp4:/ { /^[[:space:]]*dhcp4:/!d; }" /etc/netplan/50-cloud-init.yaml && sed -i "/^[[:space:]]*set-name:/d" /etc/netplan/50-cloud-init.yaml; fi' \
    --run-command 'rm -f /etc/netplan/99-kd-ip-*.yaml'; then exitFailed; fi
    
printf "\n\nGenerating metadata\n"
sudo bash -c "cat <<EOF > /kloudust/metadata/{2}.metadata
NAME={2}
EOF"
cat /kloudust/metadata/{1}.metadata | grep -v NAME | sudo tee -a /kloudust/metadata/{2}.metadata > /dev/null
if ! sudo virsh dumpxml {2} > /kloudust/metadata/{2}.xml; then exitFailed; fi

printf "Enabling autostart"
if ! sudo virsh autostart {2}; then exitFailed; fi

printf "\n\nClone successful\n"
exit 0
