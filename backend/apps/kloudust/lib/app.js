/* 
 * (C) 2020 TekMonks. All rights reserved.
 */

module.exports.initSync = _ => {
    global.KLOUD_CONSTANTS = require(`${__dirname}/constants.js`);  // setup the constants
    require(`${KLOUD_CONSTANTS.LIBDIR}/kloudustAPISecurity.js`).initSync(); // init API security checker
}