#!/bin/bash


function exitFailed() {
    echo Failed
    exit 1
}

printf "\n\nSnapshots for {1}\n"
sudo ls /kloudust/snapshots/ | cat | grep {1} | grep .timestamp | cut -d"." -f2

printf "\n\nSnapshots listed successfully\n"
exit 0
