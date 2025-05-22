/** 
 * createVM.js - Creates VM from URI download or catalog image.
 * 
 * Params - 0 - VM name, 1 - VM description, 2 - cores, 3 - memory in MB, 4 vlan, 5 - disk in GB, 
 *  6 - image name, 7 - cloud init data in JSON (or YAML format), 8 - force overwrite, if true
 *  in case the HOST has a VM by the same name already, it will be overwrittern, 9 - max cores
 *  is the maximum cores we can hotplug, 10 - max memory is the max memory we can hotplug, 
 *  11 - additional creation params (optional), 12 - vm type, default is vm, or anything else
 *  13 - No QEMU agent - "true" if no needed else "false", 14 - set to true to not install qemu-agent, 
 *  15 - hostname for the VM (only cloud admins can do this)
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);
const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const createVM = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/createVM.js`);

/**
 * Creates VM from URI download or catalog image
 * @param {array} params See documented params
 */
module.exports.exec = async function (params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) { params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }

    const [vm_name_raw, servers] = [...params];

    const vm = await dbAbstractor.getVM(createVM.resolveVMName(vm_name_raw));

    const hostInfo = await dbAbstractor.getHostEntry(vm.hostname); 

    const lb = await dbAbstractor.getLB(vm.id);

    const lb_creds = JSON.parse(lb.creds);

    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT,
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey, hostInfo.port,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/updateServersOnLB.sh`, vm.ips.trim(), servers,lb_creds.user,lb_creds.pass]
    };


    const result = await xforge(xforgeArgs);

    const db_update = await dbAbstractor.updateLBServers(vm.id,servers);

    return result;
};
