/** 
 * deleteHost.js - Removes the gives host as a Kloudust hypervisor from the catalog
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
 const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

 /**
  * Removes the gives host as a Kloudust hypervisor
  * @param {array} params The incoming params - must be - ip
  */
 module.exports.exec = async params => await dbAbstractor.deleteHostFromDB(params[0]);