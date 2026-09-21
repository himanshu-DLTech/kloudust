#!/bin/bash

#########################################################################################################
# Assigns the IP to the VM's mac attached to the given VNet. Re-entry safe. Network Manager must be
# installed for Linux VMs for persistent IP assignments. The Linux image should have netplan support
# available for persistent IP changes. 
#
# (C) 2026 Tekmonks. All rights reserved.
# LICENSE: See LICENSE file.
#########################################################################################################
# Init section - check params, and assigns defaults if missing
#
# Params
# {1} VM name
# {2} VNet name
# {3} VNet ID (it is a number)
# {4} IP address
# {5} MTU for the VM, set to 1200 if not given
#########################################################################################################
VM_NAME={1}
VLAN_NAME=kd{3}
IP_ADDRESS={4}
BR_NAME="$VLAN_NAME"_br
MTUIN={5}

MTU=${MTUIN:-1200}
IS_WINDOWS=""
if virsh dumpxml "$VM_NAME" | grep -qE 'microsoft\.com/win|windows'; then IS_WINDOWS="true"; fi

echoerr() { echo "$@" 1>&2; }

function exitFailed() {
    echo Failed
    exit 1
}

MAC_ADDRESS=`virsh dumpxml $VM_NAME | xmllint --xpath "string(//interface[@type='bridge'][source/@bridge='$BR_NAME']/mac/@address)" -`
if [ -z "$MAC_ADDRESS" ]; then
    echoerr Could not locate MAC for the VM $VM_NAME attached to VNet $VLAN_NAME or already detached, skipping.
    exitFailed
else
    echo Found $MAC_ADDRESS for VM attachment to the VNet. Proceeding with IP setup.
fi

IP_ADDRESS_UNDERSCORES="${IP_ADDRESS//./_}"

LINUX_SCRIPT='
if command -v netplan >/dev/null 2>&1; then
cat > /etc/netplan/99-kd-ip-'${IP_ADDRESS_UNDERSCORES}'.yaml <<NETPLAN_EOF
{
  "network": {
    "version": 2,
    "renderer": "networkd",
    "ethernets": {
      "private_'${IP_ADDRESS_UNDERSCORES}'": {
        "match": {"macaddress": "'${MAC_ADDRESS}'"},
        "dhcp4": false,
	      "mtu": '${MTU}',
        "addresses": ["'${IP_ADDRESS}'/24"],
      }
    }
  }
}
NETPLAN_EOF

chmod 600 /etc/netplan/99-kd-ip-'${IP_ADDRESS_UNDERSCORES}'.yaml        # Fix permissions
netplan apply
if [ $? -eq 0 ]; then
    echo Network configured for MAC '${MAC_ADDRESS}' with IP '${IP_ADDRESS}'
else
    echo Failed to configure MAC '${MAC_ADDRESS}' with IP '${IP_ADDRESS}'
    exit 1
fi
elif command -v nmcli >/dev/null 2>&1; then
CON=kd-ip-'${IP_ADDRESS_UNDERSCORES}'
CONFILE=/etc/NetworkManager/system-connections/$CON.nmconnection
cat > $CONFILE <<NMCONNECTION_EOF
[connection]
id=$CON
type=ethernet
autoconnect=true
autoconnect-priority=100

[ethernet]
mac-address='${MAC_ADDRESS}'
mtu='${MTU}'

[ipv4]
method=manual
address1='${IP_ADDRESS}'/24

[ipv6]
method=ignore
NMCONNECTION_EOF

chmod 600 $CONFILE        # NetworkManager ignores a keyfile that is group or world readable
nmcli con load $CONFILE || exit 1
for i in $(seq 1 15); do nmcli con up "$CON" && break; sleep 2; done     # NIC may still be appearing after hot-attach
if nmcli -t -f GENERAL.STATE con show "$CON" | grep -q activated; then
    echo Network configured for MAC '${MAC_ADDRESS}' with IP '${IP_ADDRESS}'
else
    echo Failed to configure MAC '${MAC_ADDRESS}' with IP '${IP_ADDRESS}'
    exit 1
fi
else
    echo No supported network tool, netplan or nmcli, found in the VM
    exit 1
fi
'

WINDOWS_PS_SCRIPT="\$mac='$MAC_ADDRESS'; \$adapter = Get-NetAdapter | Where-Object {\$_.MacAddress -eq \$mac}; New-NetIPAddress -InterfaceIndex \$adapter.InterfaceIndex -IPAddress '$IP_ADDRESS' -PrefixLength 24; Set-NetAdapterAdvancedProperty -Name \$adapter.Name -DisplayName 'Jumbo Packet' -DisplayValue '$MTU' -ErrorAction SilentlyContinue; netsh interface ipv4 set subinterface \$adapter.InterfaceIndex mtu=$MTU store=persistent"

# Use jq to properly escape and build the JSON
JSON_PAYLOAD_LINUX=$(jq -n --arg script "$LINUX_SCRIPT" \
	'{execute: "guest-exec", arguments: {path: "/bin/bash", arg: ["-c", $script], "capture-output": true}}')

JSON_PAYLOAD_WINDOWS=$(jq -n --arg script "$WINDOWS_PS_SCRIPT" \
        '{execute: "guest-exec", arguments: {path: "powershell", arg: ["-Command", $script], "capture-output": true}}')


if [ -z "$IS_WINDOWS_VM" ]; then
    # This is for Linux, uses netplan or nmcli
    echo Using this script for Linux VM: $LINUX_SCRIPT
    if ! PID=$(virsh qemu-agent-command $VM_NAME "$JSON_PAYLOAD_LINUX" | jq -r '.return.pid'); then exitFailed; fi
else
    # This is for Windows VMs
    echo Using this Powershell script for Windows VM: $WINDOWS_PS_SCRIPT
    if ! PID=$(virsh qemu-agent-command $VM_NAME $JSON_PAYLOAD_WINDOWS | jq -r '.return.pid'); then exitFailed; fi
fi

sleep 2
virsh -c qemu:///system qemu-agent-command $VM_NAME '{"execute": "guest-exec-status", "arguments": {"pid": '$PID'}}' | jq -r '.return["out-data"]' | base64 --decode

echo Done.
