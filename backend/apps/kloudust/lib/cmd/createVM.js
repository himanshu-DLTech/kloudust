/** 
 * createVM.js - Creates VM from URI download or catalog image.
 * 
 * Params - 0 - VM name, 1 - VM description, 2 - cores, 3 - memory in MB, 4 - disk in GB, 
 *  5 - image name, 6 - cloud init data in JSON (or YAML format)
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
 * Creates VM from URI download or catalog image
 * @param {array} params See documented params
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}

    const [vm_name_raw, vm_description, cores_s, memory_s, disk_s, creation_image_name, cloudinit_data] = [...params];
    const vm_name = exports.resolveVMName(vm_name_raw), cores = parseInt(cores_s), memory = parseInt(memory_s), 
        disk = parseInt(disk_s);

    const kdResource = await dbAbstractor.getHostResourceForProject(creation_image_name);
    if (!kdResource) {
        params.consoleHandlers.LOGERROR("Bad resource name or resource not found"); return CMD_CONSTANTS.FALSE_RESULT();
    }

    const hostInfo = await hostchooser.getHostFor(cores, memory, disk, kdResource.processorarchitecture); 
    if (!hostInfo) {params.consoleHandlers.LOGERROR("Unable to find a suitable host."); return CMD_CONSTANTS.FALSE_RESULT();}

    const extrainfoSplits = kdResource.extrainfo?kdResource.extrainfo.split(":"):[null,null];
    let ostype = extrainfoSplits[0], imgtype = extrainfoSplits[1];
    if (!ostype) {
        params.consoleHandlers.LOGWARN("Missing VM type in resource definition, assuming generic Linux");
        ostype = "linux2018";
    }

    const fromCloudImg = imgtype?.toLowerCase().endsWith(".iso") ? "false": "true";  // only ISOs are installable disks
    
    const xforgeArgs = {
        colors: KLOUD_CONSTANTS.COLORED_OUT, 
        file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
        console: params.consoleHandlers,
        other: [
            hostInfo.hostaddress, hostInfo.rootid, hostInfo.rootpw, hostInfo.hostkey,
            `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/createVM.sh`,
            vm_name, vm_description, cores, memory, disk, creation_image_name, kdResource.uri, ostype, 
            fromCloudImg, cloudinit_data||"undefined", KLOUD_CONSTANTS.env.org, KLOUD_CONSTANTS.env.prj
        ]
    }

    const results = await xforge(xforgeArgs);
    if (results.result) {
        if (await dbAbstractor.addVMToDB(vm_name, vm_description, hostInfo.hostname, ostype, cores, memory, disk, 
            ["createVM ", ...params].join(" "))) return results;
        else {params.consoleHandlers.LOGERROR("DB failed"); return {...results, result: false};}
    } else return results;
}

/** @return The internal VM name for the given raw VM name */
exports.resolveVMName = vm_name_raw => `${vm_name_raw}_${KLOUD_CONSTANTS.env.org}_${KLOUD_CONSTANTS.env.prj}`;