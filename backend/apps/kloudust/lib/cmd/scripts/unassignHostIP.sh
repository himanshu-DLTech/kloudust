#!/bin/bash

# Params
# {1} The IP to unassign

IP_TO_UNASSIGN="{1}"

function exitFailed() {
    echo Failed.
    exit 1
}

if ! netplan get | grep -v "$IP_TO_UNASSIGN" > /tmp/kdnetplan_temp.yaml; then exitFailed; fi
if ! rm -rf /etc/netplan/*.yaml; then exitFailed; fi
if ! cat /tmp/kdnetplan_temp.yaml > /etc/netplan/99-kloudust-config.yaml; then exitFailed; fi
if ! chmod 600 /etc/netplan/99-kloudust-config.yaml; then exitFailed; fi
rm /tmp/kdnetplan_temp.yaml
if ! netplan apply; then exitFailed; fi

printf "\n\IP unassignment successful\n"
exit 0