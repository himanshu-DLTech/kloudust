#!/bin/bash

# Params:
# {1} VM Name
# {2} SFTP Username
# {3} SFTP Host
# {4} SFTP Password
# {5} Remote source directory
# {6} SFTP Port

VM_NAME="{1}"
SFTP_USER="{2}"
SFTP_HOST="{3}"
SFTP_PASS="{4}"
SRC_DIR="{5}"
SFTP_PORT="{6}"

XML_PATH="/kloudust/metadata/$VM_NAME.xml"
DISK_DIR="/kloudust/disks"

function exitFailed() {
    echo "Error: $1"
    echo "Failed"
    exit 1
}

if [ -z "$VM_NAME" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_HOST" ] || [ -z "$SFTP_PASS" ] || [ -z "$SRC_DIR" ] || [ -z "$SFTP_PORT" ]; then
    echo "Usage: $0 <vm-name> <sftp-user> <sftp-host> <sftp-password> <remote-soucre-dir> <sftp-port>"
    exit 1
fi

# Check if VM already exists
if virsh list --all --name | grep -wq "$VM_NAME"; then
    exitFailed "A VM with name '$VM_NAME' already exists. Choose a different name or remove the existing VM first."
fi

echo "Fetching XML definition for VM '$VM_NAME'..."
sshpass -p "$SFTP_PASS" scp -P "$SFTP_PORT" -o StrictHostKeyChecking=no \
    "$SFTP_USER@$SFTP_HOST:$SRC_DIR/$VM_NAME/$VM_NAME.xml" "$XML_PATH" \
    || exitFailed "Failed to fetch VM XML definition."

echo "Detecting remote disk file..."
REMOTE_DISK_NAME=$(sshpass -p "$SFTP_PASS" ssh -T -p "$SFTP_PORT" -o StrictHostKeyChecking=no "$SFTP_USER@$SFTP_HOST" << EOF
ls -1 '$SRC_DIR/$VM_NAME/' | grep -E '\.qcow2$' | head -n 1
EOF
)

if [ -z "$REMOTE_DISK_NAME" ]; then
    exitFailed "No disk file found in remote directory."
fi
echo "Remote disk file detected: '$REMOTE_DISK_NAME'"

LOCAL_DISK_PATH="${DISK_DIR}/${REMOTE_DISK_NAME}"

echo "Fetching disk file '$REMOTE_DISK_NAME'..."
sshpass -p "$SFTP_PASS" scp -P "$SFTP_PORT" -o StrictHostKeyChecking=no \
    "$SFTP_USER@$SFTP_HOST:$SRC_DIR/$VM_NAME/$REMOTE_DISK_NAME" "$LOCAL_DISK_PATH" \
    || exitFailed "Failed to fetch disk image."

echo "Rewriting disk path in XML to '$LOCAL_DISK_PATH'..."
sed -i "s|<source file='.*'|<source file='$LOCAL_DISK_PATH'|" "$XML_PATH" \
    || exitFailed "Failed to rewrite XML."

echo "Defining VM on local host..."
virsh define "$XML_PATH" || exitFailed "Failed to define VM."

echo "Starting VM '$VM_NAME'..."
virsh start "$VM_NAME" || exitFailed "Failed to start VM."

echo "VM '$VM_NAME' import and start completed successfully."
