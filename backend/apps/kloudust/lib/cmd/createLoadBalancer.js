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

const cryptoMod = require("crypto");
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);
const createVM = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/createVM.js`);

/**
 * Creates VM from URI download or catalog image
 * @param {array} params See documented params
 */
module.exports.exec = async function (params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) { params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }

    const servers = params.pop();
    const [vm_name_raw, vm_description, cores_s, memory_s, disk_s, vlan, creation_image_name, cloudinit_data,
        force_overwrite, max_cores_s, max_memory_s, additional_params, vmtype_raw, no_qemu_agent_raw, hostname
    ] = [...params];

    let pass = cryptoMod.randomBytes(32).toString("hex");
    params[7] = params[7].replaceAll("__ADMIN_ID__","tekmonks");
    params[7] = params[7].replaceAll("__ADMIN_PASS__",`${pass}`);
    params[12] = "loadbalanceraas";
    
    
    
    let createvm = await createVM.exec(params);
    
    let vm = await dbAbstractor.getVM(createVM.resolveVMName(vm_name_raw));
    
    const addOrUpdate = await dbAbstractor.addOrUpdateLBToDB(vm.id,servers,{user: 'tekmonks',pass:pass});
    
    let vmtypeUpdate = dbAbstractor.updateVMType(vm.id,"loadbalanceraas");

    return createvm;
};
