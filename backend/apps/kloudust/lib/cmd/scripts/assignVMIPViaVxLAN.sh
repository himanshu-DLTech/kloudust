#!/bin/bash

#########################################################################################################
# Assigns the IP to the VM's mac attached to the given VxLAN. Re-entry safe. Network Manager must be
# installed for Linux VMs for persistent IP assignments. The Linux image should have netplan support
# available for persistent IP changes. 
#
# (C) 2025 Tekmonks. All rights reserved.
# LICENSE: See LICENSE file.
#########################################################################################################
# Init section - check params, and assigns defaults if missing
#
# Params
# {1} VM name
# {2} VxLAN name (not used)
# {3} VxLAN ID (it is a number)
# {4} IP address
# {5} DNS1 - if not provided then 8.8.8.8 is used
# {6} DNS2 - if not provided then 8.8.4.4 is used
# {7} MTU for the VM, set to 1200 if not given
#########################################################################################################
VM_NAME={1}
VLAN_NAME=kd{3}
IP_ADDRESS={4}
BR_NAME="$VLAN_NAME"_br
DNS1_IN={5}
DNS2_IN={6}
MTUIN={7}

MTU=${MTUIN:-1200}
DNS1=${DNS1_IN:-8.8.8.8}
DNS2=${DNS2_IN:-8.8.4.4}
IS_WINDOWS=""
if virsh dumpxml "$VM_NAME" | grep -qE 'microsoft\.com/win|windows'; then IS_WINDOWS="true"; fi

echoerr() { echo "$@" 1>&2; }

function exitFailed() {
    echo Failed
    exit 1
}

MAC_ADDRESS=`virsh dumpxml $VM_NAME | xmllint --xpath "string(//interface[@type='bridge'][source/@bridge='$BR_NAME']/mac/@address)" -`
if [ -z "$MAC_ADDRESS" ]; then
    echoerr Could not locate MAC for the VM $VM_NAME attached to the VxLAN $VLAN_NAME or already detached, skipping.
    exitFailed
else
    echo Found $MAC_ADDRESS for VM attachment to the VxLAN. Proceeding with IP setup.
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
      "primary": {
        "match": {"macaddress": "'${MAC_ADDRESS}'"},
        "dhcp4": false,
	      "mtu": '${MTU}',
        "addresses": ["'${IP_ADDRESS}'/24"],
        "routes": [{"to": "0.0.0.0/0","scope": "link"}],
        "nameservers": {"addresses": ["'${DNS1}'","'${DNS2}'"]}
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
route1=0.0.0.0/0
route-metric=50
dns='${DNS1}';'${DNS2}';

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

WINDOWS_PS_SCRIPT="\$mac=('$MAC_ADDRESS' -replace ':','-').ToUpper(); \$adapter = Get-NetAdapter | Where-Object {\$_.MacAddress -eq \$mac}; if (\$null -eq \$adapter) { throw \"No network adapter found with MAC \$mac\" }; New-NetIPAddress -InterfaceIndex \$adapter.InterfaceIndex -IPAddress '$IP_ADDRESS' -PrefixLength 24; Remove-NetRoute -InterfaceIndex \$adapter.InterfaceIndex -DestinationPrefix '0.0.0.0/0' -Confirm:\$false -ErrorAction SilentlyContinue; New-NetRoute -InterfaceIndex \$adapter.InterfaceIndex -DestinationPrefix '0.0.0.0/0' -NextHop 0.0.0.0 -RouteMetric 5 | Out-Null; Set-NetIPInterface -InterfaceIndex \$adapter.InterfaceIndex -AddressFamily IPv4 -InterfaceMetric 1; Set-NetAdapterAdvancedProperty -Name \$adapter.Name -DisplayName 'Jumbo Packet' -DisplayValue '$MTU' -ErrorAction SilentlyContinue; netsh interface ipv4 set subinterface \$(\$adapter.InterfaceIndex) mtu=$MTU store=persistent"

# Use jq to properly escape and build the JSON
JSON_PAYLOAD_LINUX=$(jq -n --arg script "$LINUX_SCRIPT" \
	'{execute: "guest-exec", arguments: {path: "/bin/bash", arg: ["-c", $script], "capture-output": true}}')

JSON_PAYLOAD_WINDOWS=$(jq -n --arg script "$WINDOWS_PS_SCRIPT" \
        '{execute: "guest-exec", arguments: {path: "powershell", arg: ["-Command", $script], "capture-output": true}}')


if [ -z "$IS_WINDOWS" ]; then
    # This is for Linux, uses netplan or nmcli
    echo Using this script for Linux VM: $LINUX_SCRIPT
    if ! PID=$(virsh qemu-agent-command $VM_NAME "$JSON_PAYLOAD_LINUX" | jq -r '.return.pid'); then exitFailed; fi
else
    # This is for Windows VMs
    echo Using this Powershell script for Windows VM: $WINDOWS_PS_SCRIPT
    if ! PID=$(virsh qemu-agent-command "$VM_NAME" "$JSON_PAYLOAD_WINDOWS" | jq -r '.return.pid'); then exitFailed; fi
fi

sleep 2
virsh -c qemu:///system qemu-agent-command $VM_NAME '{"execute": "guest-exec-status", "arguments": {"pid": '$PID'}}' | jq -r '.return["out-data"]' | base64 --decode

echo Done.
