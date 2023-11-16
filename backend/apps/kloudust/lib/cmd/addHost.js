/** 
 * addHost.js - Initializes the host machine to become a Kloudust hypervisor and adds 
 *              it to the Kloudust catalog
 * 
 * Params - 0 - hostname, 1 - hostip, 2 - OS type, 3 - login admin ID,
 *  4 - login ID password, 5 - hostkey ssh-ed25519 in md5 fingerprint format,
 *  6 - physical cores, 7 - memory in bytes, 8 - disk in bytes, 9 - network
 *  speed in bytes per second, 10 - processor in Vendor:ProcessorFamily:Model format, 
 *  11 - processor architecture,  12 - number of sockets, 
 *  13 - optional - if set to nochange the host password is not changed
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const cryptoMod = require("crypto");
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Initializes and adds the given machine to become a Kloudust hypervisor
 * @param {array} params The incoming params - must be - type (centos8 only for now), ip, user id (must have root access), password, ssh hostkey
 *                        params.consoleHandlers - Function of the format function(LOGINFO, LOGWARN, LOGERROR) to 
 *                        handle streaming consoles
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}

    const [hostname, hostip, ostype, adminid, adminpass, hostsshkey, cores, memory, disk, netspeed, processor, 
        processorarchitecture, sockets, nochangepassword] = [...params];

    if ((!KLOUD_CONSTANTS.CONF.HOST_TYPES.includes(ostype.toLowerCase()))) {
        params.consoleHandlers.LOGERROR(`Only ${KLOUD_CONSTANTS.CONF.HOST_TYPES.join(", ")} are supported.`); return CMD_CONSTANTS.FALSE_RESULT();}

    const newPassword = nochangepassword.toLowerCase() == "nochange" ? adminpass : cryptoMod.randomBytes(32).toString("hex");
    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        console: params.consoleHandlers,
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        other: [
            hostip, adminid, adminpass, hostsshkey, 
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/addHost.sh`,
            newPassword
        ]
    }

    const results = await xforge(xforgeArgs);
    if (results.exitCode==0) {
        if (await dbAbstractor.addHostToDB(hostname, hostip, ostype.toLowerCase(), adminid, newPassword, 
                hostsshkey, parseInt(cores), parseInt(memory), parseInt(disk), parseInt(netspeed), processor, 
                processorarchitecture, parseInt(sockets))) return {result: true, out: results.stdout, err: results.stderr}; 
        else {_showError(newPassword, adminid, adminpass, params.consoleHandlers||KLOUD_CONSTANTS.LOG); return {
            result: false, out: results.stdout, err: results.stderr};}
    } else {_showError(newPassword, params[2], params[3], params.consoleHandlers||KLOUD_CONSTANTS.LOG); return {
        result: false, out: results.stdout, err: results.stderr};}
}

function _showError(newPassword, userid, oldPassword, consoleHandlers) {
    consoleHandlers.LOGERROR("Host initialization failed. Password may be changed");
    consoleHandlers.LOGERROR(`Login password for ${userid} is one of these now: ${oldPassword} or ${newPassword}`);
}