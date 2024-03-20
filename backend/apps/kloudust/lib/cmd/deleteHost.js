/** 
 * deleteHost.js - Removes the gives host as a Kloudust hypervisor from the catalog
 * 
 * Params - 0 - hostname, 1 - clean host, if set the host machine itself will be cleaned
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

 /**
  * Removes the given host as a Kloudust hypervisor
  * @param {array} params The incoming params - must be - hostname
  */
 module.exports.exec = async params => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {
        params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}
    const [hostname, cleanhost] = [...params];

    const result = {result: await dbAbstractor.deleteHostFromDB(hostname), err: "", out: ""};
    params.consoleHandlers.LOGWARN(`Host ${hostname} has been deleted from Kloudust cloud.`);

    if (cleanhost) {
        params.consoleHandlers.LOGWARN(`Host ${hostname} machine is being cleaned.`);
        const xforgeArgs = {
            colors: KLOUD_CONSTANTS.COLORED_OUT, 
            console: params.consoleHandlers,
            file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
            other: [
                hostip, adminid, adminpass, hostsshkey, 
                `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/deleteHost.sh`
            ]
        }
        await xforge(xforgeArgs);
    }

    return result;  // as long as it is gone from our DB, the result is positive
}