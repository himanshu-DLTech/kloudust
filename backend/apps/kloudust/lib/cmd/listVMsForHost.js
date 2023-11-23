/** 
 * listVMs.js - Lists the host VMs - either all or running (default)
 * 
 * Params - 0 - The host name, 1 - if set to verifyhost, then host is cross verified
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Lists the host VMs - either all or running (default)
 * @param {array} params The incoming params - must be - type (centos8 only for now), ip, user id, password, ssh hostkey, [all|running] optional param, defaults to running
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_cloud_resource)) {
        params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }
    const [hostname, verifyhost] = [...params];

    const hostInfo = hostname?await dbAbstractor.getHostEntry(hostname):null; 
    if (!hostInfo) { const error = "Bad hostname or host not found"; 
        params.consoleHandlers.LOGERROR(error); return CMD_CONSTANTS.FALSE_RESULT(error); }
    const vms = await dbAbstractor.listVMsForCloudAdmin(hostname, true);
    const vms_ret = []; if (vms) for (const vm of vms) vms_ret.push({...vm, creationcmd: undefined});

    let out = "VM information from the database follows.";
    for (const vm of vms_ret) out += "\n"+JSON.stringify(vm);

    if (hostInfo && verifyhost.trim().toLowerCase() == "verifyhost") {
        out += "\n"+"VM information from the specific host follows.";
        const xforgeArgs = {
            colors: KLOUD_CONSTANTS.COLORED_OUT, 
            file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
            console: params.consoleHandlers,
            other: [
                hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
                `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/listVMs.sh`
            ]
        }
        const xforgeResults = await xforge(xforgeArgs); 
        out += "\n"+xforgeResults.stdout; return {...xforgeResults, out, stdout: out, vms: vms_ret};
    } else return {result: true, out, stdout: out, err: "", stderr: "", vms: vms_ret};
}
