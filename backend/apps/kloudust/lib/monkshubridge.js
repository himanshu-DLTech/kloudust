/**
 * Monkshu integration bridge.
 * 
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const kdutils = require(`${KLOUD_CONSTANTS.LIBDIR}/utils.js`);

exports.initMonkshuGlobalAndGetModuleAsync = modulename => {
    if (!global.CONSTANTS) {    // we are not running under Monkshu
        const CONSTANTS = require(`${KLOUD_CONSTANTS.MONKSHU_BACKEND_LIBDIR}/constants.js`);
        const LOG = {info: KLOUD_CONSTANTS.LOGINFO, error: KLOUD_CONSTANTS.LOGERROR, warn: KLOUD_CONSTANTS.LOGWARN,
            debug: KLOUD_CONSTANTS.LOGINFO}
        const monkshu_module = require(`${CONSTANTS.LIBDIR||KLOUD_CONSTANTS.MONKSHU_BACKEND_LIBDIR}/${modulename}.js`), 
            monkshu_module_wrapped = kdutils.wrapObjectInNewContext(monkshu_module, {CONSTANTS, LOG});
        return monkshu_module_wrapped;
    } else return require(`${CONSTANTS.LIBDIR}/${modulename}.js`);  // we are under Monkshu
}