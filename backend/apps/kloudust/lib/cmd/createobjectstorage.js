/** 
 * createobjectstorage.js - Creates Object Storage Instance from URI download or catalog image.
 * 
 * Params - 0 - VM name, 1 - VM description, 2 - cores, 3 - memory in MB, 4 - disk in GB, 
 *  5 - image name, 6 - cloud init data in JSON (or YAML format), 7 - force overwrite, if true
 *  in case the HOST has a Instance by the same name already, it will be overwrittern, 
 *  8 - hostname for the VM (only cloud admins can do this)
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const hostchooser = require(`${KLOUD_CONSTANTS.LIBDIR}/hostchooser.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Creates Object Storage Instance from URI download or catalog image
 * @param {array} params See documented params
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}

    const [instance_name_raw, instance_description, cores_s, memory_s, disk_s, creation_image_name, cloudinit_data, 
        force_overwrite, hostname] = [...params];
    const instance_name = exports.resolveVMName(instance_name_raw), cores = parseInt(cores_s),
        memory = parseInt(memory_s), disk = parseInt(disk_s), instancetype = exports.VM_TYPE,
        creation_image = creation_image_name || exports.STORAGE_IMAGE;

    if (await dbAbstractor.getVM(instance_name)) {  // Instance already exists
        const error = `Object Storage Instance: ${instance_name_raw} exists already for this project`;
        params.consoleHandlers.LOGERROR(error); return CMD_CONSTANTS.FALSE_RESULT(error);
    }

    const kdResource = await dbAbstractor.getHostResourceForProject(creation_image);
    if (!kdResource) {
        params.consoleHandlers.LOGERROR("Bad resource name or resource not found");
        return CMD_CONSTANTS.FALSE_RESULT();
    }

    const forceHostByAdmin = hostname && hostname.trim().length && roleman.isCloudAdminLoggedIn();
    const hostInfo = forceHostByAdmin ? await dbAbstractor.getHostEntry(hostname) : 
        await hostchooser.getHostFor(cores, memory, disk, kdResource.processorarchitecture); 
    if (!hostInfo) {params.consoleHandlers.LOGERROR("Unable to find a suitable host."); return CMD_CONSTANTS.FALSE_RESULT();}

    const extrainfoSplits = kdResource.extrainfo?kdResource.extrainfo.split(":"):[null,null];
    let ostype = extrainfoSplits[0], imgtype = extrainfoSplits[1];
    if (!ostype) {
        params.consoleHandlers.LOGWARN("Missing OS type in resource definition, assuming generic Linux");
        ostype = "linux2018";
    }

    if (!imgtype) params.consoleHandlers.LOGWARN("Not a cloud capable image, VM will probably not work");

    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey, hostInfo.port,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/createVM.sh`,
            instance_name, instance_description, cores, memory, disk, creation_image, kdResource.uri, ostype, 
            "true", cloudinit_data||"undefined", KLOUD_CONSTANTS.env.org, KLOUD_CONSTANTS.env.prj,
            force_overwrite||"false", cores, memory, "", "false", exports.DEFAULT_DISK 
        ]
    }

    const results = await xforge(xforgeArgs);
    if (results.result) {
        if (await dbAbstractor.addOrUpdateVMToDB(instance_name, instance_description, hostInfo.hostname, ostype, cores, memory,
            [{diskname: exports.DEFAULT_DISK, size: parseInt(disk)}], ["createVM ", ...params].join(" "),
            instance_name_raw, instancetype)) return results;
        else {params.consoleHandlers.LOGERROR("DB failed"); return {...results, result: false};}
    } else return results;
}

/** @return The internal Instance name for the given raw Instance name or null on error */
exports.resolveVMName = vm_name_raw => vm_name_raw?`${vm_name_raw}_${KLOUD_CONSTANTS.env.org}_${KLOUD_CONSTANTS.env.prj}`.toLowerCase().replace(/\s/g,"_"):null;
exports.VM_TYPE = "storage3";
exports.STORAGE_IMAGE = "kd_object_storage_service";
exports.DEFAULT_DISK = "__org_kloudust_default_disk_name"