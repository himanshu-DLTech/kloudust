/** 
 * listVMs.js - Lists the host VMs - either all or running (default)
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Lists the host VMs - either all or running (default)
 * @param {array} params The incoming params - must be - type (centos8 only for now), ip, user id, password, ssh hostkey, [all|running] optional param, defaults to running
 */
module.exports.exec = async function() {
    const vms = await dbAbstractor.listVMs();

    if (vms) {
        KLOUD_CONSTANTS.LOGINFO("VM information from the database follows.");
        for (const vm of vms) KLOUD_CONSTANTS.LOGINFO(JSON.stringify(vm));
        return true;
    } else return false;
}