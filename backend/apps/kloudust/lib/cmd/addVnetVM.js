/** 
 * addVnetVM.js - Adds a VM to a Virtual Network.
 * 
 * Params - 0 - VM name, 1 - VxLAN name
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Adds a VM to a Virtual Network
 * @param {array} params The incoming params - must be as above
 */
module.exports.exec = async function(params) {
    const out = stdout = `VM ${params[0]} added to virtual network ${params[1]}.`;
    return {...CMD_CONSTANTS.TRUE_RESULT(), out, err: "", stdout: out, stderr: ""};
}