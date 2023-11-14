/** 
 * createVM.js - Creates VM from Internet download or catalog image
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Creates VM from Internet download or catalog image
 * @param {array} params The incoming params - must be - Hostname, VM name, VM description, vCPUs, RAM, disk size in GB, optional catalog ISO name
 */
module.exports.exec = async function(params) {
    const hostInfo = await dbAbstractor.getHostEntry(params[0]); 
    if (!hostInfo) {params.consoleHandlers.LOGERROR("Bad hostname or host not found"); return false;}

    if ((params[7]||"").trim().length == 0) {
        params.consoleHandlers.LOGWARN("Missing VM type, assuming generic Linux");
        params[7] = "linux2018";
    }

    const fromCloudImg = params[6].toLowerCase().endsWith(".iso") ? "false": "true";  // only ISOs are installable disks
    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/createVM.sh`,
            params[1], params[2], params[3], params[4], params[5], 
            params[6],
            params[7], fromCloudImg, params[8]||"undefined",
            KLOUD_CONSTANTS.env.org, KLOUD_CONSTANTS.env.prj
        ]
    }

    const results = await xforge(xforgeArgs);
    if (results.result) {
        if (await dbAbstractor.addVMToDB(params[1], params[2], params[0], params[6], params[3], params[4], params[5])) return results;
        else {params.consoleHandlers.LOGERROR("DB failed"); return {...results, result: false};}
    } else return results;
}