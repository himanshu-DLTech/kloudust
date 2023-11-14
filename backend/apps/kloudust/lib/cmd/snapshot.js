/** 
 * snapshot.js - Snapshots a VM, live snapshots are supported
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Snapshots a VM
 * @param {array} params The incoming params - must be VM name, Snapshot name
 */
module.exports.exec = async function(params) {
    const vm = await dbAbstractor.getVM(params[0]);
    if (!vm) {params.consoleHandlers.LOGERROR("Bad VM name or VM not found"); return false;}
    
    const hostInfo = await dbAbstractor.getHostEntry(vm.hostname); 
    if (!hostInfo) {params.consoleHandlers.LOGERROR("Bad hostname or host not found"); return false;}

    const DEFAULT_SNAPSHOT_NAME = `${params[0]}_snapshot_${Date.now()}`;
    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/snapshot.sh`,
            params[0], params[1]||DEFAULT_SNAPSHOT_NAME
        ]
    }

    return await xforge(xforgeArgs);
}