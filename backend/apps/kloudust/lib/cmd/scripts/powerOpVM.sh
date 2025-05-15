#!/bin/bash

# Params
# {1} - Domain / VM name
# {2} - The operation to perform
# {3} - Optional WAIT time before checking state (in seconds)

VM_NAME="{1}"
POWER_OP="{2}"
WAIT_TIME="${3:-10}"

function exitFailed() {
    echo Failed
    exit 1
}

function backgroundCheckAndStartIfNeeded() {
    (
        sleep "$WAIT_TIME"
        STATE=$(virsh domstate "$VM_NAME" | xargs)
        if [ "$STATE" == "shut off" ]; then virsh start "$VM_NAME"; fi
    ) &
}

echo "Power operating $VM_NAME to $POWER_OP"
if ! virsh "$POWER_OP" "$VM_NAME"; then exitFailed; fi
if [[ "$POWER_OP" == "reboot" || "$POWER_OP" == "reset" ]]; then backgroundCheckAndStartIfNeeded; fi
exit 0