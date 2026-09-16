/** 
 * createVnet.js - Creates new virtual network (type VxLAN) for the cloud.
 * 
 * Params - 0 - Vnet name, 1 - Vnet description, 3 - force overwrite, if true
 *  and a Vnet by the same name already exists, it will be overwrittern
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const vnet = require(`${KLOUD_CONSTANTS.LIBDIR}/vnet.js`);
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Creates a new virtual network
 * @param {array} params The incoming params - must be as above
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();}

    const [vnet_name_raw, vnet_description] = [...params]; 
    if (typeof vnet_name_raw !== "string" || !/^[A-Za-z0-9]+$/.test(vnet_name_raw)) {
        const error = "Vnet name may contain only letters and numbers.";
        params.consoleHandlers.LOGERROR(error);
        return CMD_CONSTANTS.FALSE_RESULT(error);
    }
    const vnet_name = exports.resolveVnetName(vnet_name_raw)

    return await vnet.createVnet(vnet_name, vnet_description, params.consoleHandlers);
}

/** @return The internal name for the given raw Vnet name or null on error */
exports.resolveVnetName = vnet_name_raw => vnet_name_raw ? vnet.resolveVnetName(vnet_name_raw) : null;

/** @return The public name for the given internal Vnet name or null on error */
exports.unresolveVnetName = vnet_name => vnet_name ? vnet.unresolveVnetName(vnet_name) : null;

exports.getInternetBackboneVnet = _ => `${KLOUD_CONSTANTS.env.org()}-${KLOUD_CONSTANTS.env.prj()}-Internet-Backbone`;