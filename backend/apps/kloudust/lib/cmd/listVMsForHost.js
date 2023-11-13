/** 
 * listVMs.js - Lists the host VMs - either all or running (default)
 * 
 * Params - 0 - The host name
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Lists the host VMs - either all or running (default)
 * @param {array} params The incoming params - must be - type (centos8 only for now), ip, user id, password, ssh hostkey, [all|running] optional param, defaults to running
 */
module.exports.exec = async function(params) {
    const hostInfo = await dbAbstractor.getHostEntry(params[0]); 
    if (!hostInfo) {KLOUD_CONSTANTS.LOGERROR("Bad hostname or host not found"); return false;}
    const vms = await dbAbstractor.listVMsForCloudAdmin(params[0], true);

    let out = "";
    if (vms) {
        out += "VM information from the database follows.";
        for (const vm of vms) out += "\n"+JSON.stringify(vm);
    }

    if (hostInfo) {
        out += "\n"+"VM information from the specific host follows.";
        const xforgeArgs = {
            colors: KLOUD_CONSTANTS.COLORED_OUT, 
            file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
            other: [
                hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
                `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/listVMs.sh`
            ]
        }
        const xforgeResults = await xforge(xforgeArgs); 
        out += "\n"+hostResults.stdout; return {out, ...xforgeResults};
    } else return {result: true, out, err: ""};
}