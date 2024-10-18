#!/bin/bash

# Kills the host completely. Kloudust equivalent of rm -rf /
# BE VERY CAREFUL (or frankly NEVER call this script).

virsh list --all --name > doms.txt  # every VM listed
cat doms.txt | xargs -n 1 virsh destroy # every VM destroyed
cat doms.txt | xargs -n 1 virsh undefine # every VM undefined

rm -rf /kloudust    # all Kloudust data gone
exit 0              # always successful