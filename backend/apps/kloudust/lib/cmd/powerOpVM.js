/** 
 * powerOpVM.js - Performs the given power operation on the VM
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

const POWER_OP_PARAMS_MAP = {
    "start": "start", "stop": "shutdown", "reboot": "reboot", "forcestop": "destroy", 
    "autostart": "autostart", "noautostart": "autostart --disable", "pause": "managedsave",
    "hardboot": "reset", "default": "start"
}

/**
 * Performs the given power operation on the VM
 * @param {array} params The incoming params - must be - type (centos8 only for now), ip, user id, password, ssh hostkey, VM name, [start|pause|stop|forcestop|reboot|autostart|noautostart] - default is start
 */
module.exports.exec = async function(params) {
    const vm = await dbAbstractor.getVM(params[0]);
    if (!vm) {params.consoleHandlers.LOGERROR("Bad VM name or VM not found"); return false;}
    
    const hostInfo = await dbAbstractor.getHostEntry(vm.hostname); 
    if (!hostInfo) {params.consoleHandlers.LOGERROR("Bad hostname or host not found"); return false;}

    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/powerOpVM.sh`,
            params[0], POWER_OP_PARAMS_MAP[params[1].toLowerCase()]||POWER_OP_PARAMS_MAP["default"]
        ] 
    }

    return await xforge(xforgeArgs);
}