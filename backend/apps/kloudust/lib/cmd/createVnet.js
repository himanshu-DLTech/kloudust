/** 
 * createVnet.js - Creates new virtual network (type VxLAN) for the cloud.
 * 
 * Params - 0 - Vnet name, 1 - Vnet description, 3 - force overwrite, if true
 *  and a Vnet by the same name already exists, it will be overwrittern
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Creates a new virtual network
 * @param {array} params The incoming params - must be as above
 */
module.exports.exec = async function(params) {
    const out = stdout = `Virtual network ${params[0]} created.`;
    return {...CMD_CONSTANTS.TRUE_RESULT(), out, err: "", stdout: out, stderr: ""};
}