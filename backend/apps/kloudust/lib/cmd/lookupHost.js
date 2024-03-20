/** 
 * getHostInfo.js - Queries the given host information and prints it. This 
 * command requires cloud admin authority
 * 
 * Params - 0 - hostname
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);
 
/**
 * Queries the given host information and prints it
 * @param {array} params The incoming params - must be host name or IP
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_cloud_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}
    const hostname = params[0];

    const hostinfoRaw = hostname?await dbAbstractor.getHostEntry(hostname):null; 
    if (!hostinfoRaw) {const err = "Bad hostname or host not found"; params.consoleHandlers.LOGERROR(err); 
        return CMD_CONSTANTS.FALSE_RESULT(err); }

    const hostinfo = {...hostinfoRaw, rootid: undefined, hostkey: undefined, rootpw: undefined};

    let formattedOut = `Host information follows for ${hostname}`; 
    for (const [key, value] of Object.entries(hostinfo)) formattedOut = formattedOut+"\n"+key+" - "+value;

    params.consoleHandlers.LOGINFO(formattedOut);
    return {result: true, err: "", out: formattedOut, stdout: formattedOut, hostinfo};
}