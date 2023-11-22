/** 
 * listSnapshots.js - Lists the snapshots for the given VM
 * 
 * Params - 0 - VM Name
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const createVM = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/createVM.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Lists the snapshots for the given VM
 * @param {array} params The incoming params - must be - type (centos8 only for now), ip, user id, password, ssh hostkey, VM name
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }
    const [vm_name_raw] = [...params], vm_name = createVM.resolveVMName(vm_name_raw); 
    const snapshots = vm_name?await dbAbstractor.listSnapshots(vm_name):null;

    const list = []; if (snapshots) for (const snapshot of snapshots) list.push({name: snapshot.snapshotname, timestamp: snapshot.timestamp});

    return {...CMD_CONSTANTS.TRUE_RESULT(JSON.stringify(list)), snapshots: list};
}