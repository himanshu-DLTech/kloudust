VM_IP="{1}"
IP_TO_REMOVE="{2}"
HOST_GATEWAY="{3}"

function exitFailed() {
    echo Failed.
    exit 1
}


if ! sudo iptables -t nat -D PREROUTING -d $IP_TO_REMOVE -j DNAT --to-destination $VM_IP; then exitFailed; fi
if ! sudo iptables -t nat -D POSTROUTING -d $VM_IP -j SNAT --to-source $HOST_GATEWAY; then exitFailed; fi

if [ -f "`which yum`" ]; then 
    iptables-save > /etc/sysconfig/iptables # Location for RHEL IPv4
    ip6tables-save > /etc/sysconfig/ip6tables # Location for RHEL IPv6
else
    iptables-save > /etc/iptables/rules.v4 # Location for Ubuntu IPv4
    ip6tables-save > /etc/iptables/rules.v6 # Location for Ubuntu IPv6
fi

printf "\n\nIP unassignment successful\n"
exit 0
