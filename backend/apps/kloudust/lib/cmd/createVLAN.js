/** 
 * createVLAN.js - Creates new VLAN for the cloud.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Creates KDS from KDS catalog image
 * @param {array} params The incoming params - must be - Hostname, VM name, VM description, vCPUs, RAM
 */
module.exports.exec = async function(params) {
}