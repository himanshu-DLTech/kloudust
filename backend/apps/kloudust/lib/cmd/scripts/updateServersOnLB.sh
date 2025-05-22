VM_IP="{1}"
SERVERS="{2}"
VM_USER="{3}" 
VM_PASS="{4}"

SERVER_LINES=""
INDEX=1
IFS='|' read -ra ADDR <<< "$SERVERS"
for entry in "${ADDR[@]}"; do
    HOST=$(echo "$entry" | cut -d',' -f1)
    PORT=$(echo "$entry" | cut -d',' -f2)
    echo $HOST $PORT
    SERVER_LINES+="    server web${INDEX} ${HOST}:${PORT} check"$'\n'
    ((INDEX++))
done

echo $SERVER_LINES

# Run SSH command to update HAProxy config
sshpass -p "$VM_PASS" ssh -T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USER@$VM_IP" << EOF

sudo cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.bak

sed '/^backend web_servers/,/^[^ \t]/ s/^\s*server.*//' /etc/haproxy/haproxy.cfg > /tmp/haproxy.cfg.clean

echo "$SERVER_LINES" >> /tmp/haproxy.cfg.clean

sed '/^backend web_servers/,/^[^ \t]/ {/^[[:space:]]*$/d}' /tmp/haproxy.cfg.clean > /tmp/haproxy.cfg.cleaned

sudo cp /tmp/haproxy.cfg.cleaned /etc/haproxy/haproxy.cfg.new

if haproxy -c -f /etc/haproxy/haproxy.cfg.new; then
  sudo cp /etc/haproxy/haproxy.cfg.new /etc/haproxy/haproxy.cfg
  sudo systemctl reload haproxy
else
  echo "Invalid HAProxy config. Restore or fix required."
  exit 1
fi

exit 0

EOF

exit 0