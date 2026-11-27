/** 
 * rebootHost.js - Reboots the Hypervisor host
 * 
 * Params - 0 - Host name
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const evictHost = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/evictHost.js`);
const {xforge} = require(`${KLOUD_CONSTANTS.THIRD_PARTY_DIR}/xforge/xforge`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Reboots the Hypervisor host
 * @param {array} params The incoming params - must be the host name
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}
    
    const hostname = params[0], hostInfo = await dbAbstractor.getHostEntry(hostname); 
    if (!hostInfo) {params.consoleHandlers.LOGERROR("Bad hostname or host not found"); return CMD_CONSTANTS.FALSE_RESULT();}
    // Prevent any new placement while the host is unavailable during reboot.
    const evictParams = [hostname, true, false]; evictParams.consoleHandlers = params.consoleHandlers;
    const evictionResult = await evictHost.exec(evictParams);
    if (!evictionResult.result) return evictionResult;
    await dbAbstractor.auditHostAction(hostname, "reboot", KLOUD_CONSTANTS.env.userid());

    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.THIRD_PARTY_DIR}/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey, hostInfo.port,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/rebootHost.sh`
        ]
    }

    const results = await xforge(xforgeArgs);
    if (results.result) await new Promise(resolve => setTimeout(resolve, 60000));

    const unevictParams = [hostname, false, false]; unevictParams.consoleHandlers = params.consoleHandlers;
    const unevictionResult = await evictHost.exec(unevictParams);
    if (!unevictionResult.result) return unevictionResult;
    return {...results, result: true};    // reboot always will return 1 as if successful, there is still a network error
}
