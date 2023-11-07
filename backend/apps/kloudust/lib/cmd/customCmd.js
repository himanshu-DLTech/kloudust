/** 
 * customCmd.js - Runs a custom command on the host
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Runs a custom command (script) on the host with given params
 * @param {array} params The incoming params - must be - hostname, script path, additional params for the script
 */
module.exports.exec = async function(params) {
    const hostInfo = await dbAbstractor.getHostEntry(params[0]); 
    if (!hostInfo) {KLOUD_CONSTANTS.LOGERROR("Bad hostname or host not found"); return false;}

    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
            params[1],
            [...params].slice(2)
        ]
    }

    return (await xforge(xforgeArgs)==0)?true:false;
}