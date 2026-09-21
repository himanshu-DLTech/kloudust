#!/bin/bash

VM_NAME="{1}"

echoerr() { echo "$@" 1>&2; }
exitFailed() { echo Failed; exit 1; }

LINUX_SCRIPT='
if command -v netplan >/dev/null 2>&1; then
    netplan apply || exit 1
elif command -v nmcli >/dev/null 2>&1; then
    nmcli con reload        # keyfiles are written directly, make sure NM has seen them
    for CON in $(nmcli -t -f NAME con show | grep "^kd-ip-"); do nmcli con up "$CON" || exit 1; done
else
    echo No supported network tool, netplan or nmcli, found in the VM
    exit 1
fi
'

JSON_PAYLOAD=$(jq -n --arg script "$LINUX_SCRIPT" '
{
  "execute": "guest-exec",
  "arguments": {
    "path": "/bin/bash",
    "arg": ["-c", $script],
    "capture-output": true
  }
}')

PID=$(virsh qemu-agent-command "$VM_NAME" "$JSON_PAYLOAD" | jq -r '.return.pid') || exitFailed

sleep 2

STATUS=$(virsh qemu-agent-command "$VM_NAME" \
  "{\"execute\":\"guest-exec-status\",\"arguments\":{\"pid\":$PID}}")

EXITCODE=$(echo "$STATUS" | jq -r '.return.exitcode')

if [ "$EXITCODE" -eq 0 ]; then
    echo "$STATUS" | jq -r '.return["out-data"] // empty' | base64 --decode 2>/dev/null
else
    echoerr "Command failed inside VM (exit code $EXITCODE)"
    echo "$STATUS" | jq -r '.return["err-data"] // empty' | base64 --decode 2>/dev/null
    exit 1
fi

echo Done.