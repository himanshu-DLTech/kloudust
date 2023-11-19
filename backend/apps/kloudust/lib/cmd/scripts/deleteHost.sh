#!/bin/bash

# Kills the host completely. Kloudust equivalent of rm -rf /
# BE VERY CAREFUL (or frankly NEVER call this script).

rm -rf /kloudust    # all Kloudust data gone
virsh list --all --name > doms.txt  # every VM listed
cat doms.txt | xargs -n 1 virsh destroy # every VM destroyed
cat doms.txt | xargs -n 1 virsh undefine # every VM undefined