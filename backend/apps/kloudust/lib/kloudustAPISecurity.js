/** 
 * Custom API security checker that allows for insecure development 
 * mode for Kloudust.
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const login = require(`${KLOUD_CONSTANTS.APIDIR}/login.js`);

const CHECKER_NAME = "kloudustAPISecurity";

function initSync() {
    APIREGISTRY.addCustomSecurityChecker(CHECKER_NAME, module.exports);
}

async function checkSecurity(apiregentry, _url, req, headers, _servObject, reason) {
    if (KLOUD_CONSTANTS.CONF.INSECURE_DEVELOPMENT_MODE && login.getID(headers)) return true;  // we are in in-secure mode, all ok as long as there is SOME JWT token
    else return APIREGISTRY.getExtension("JWTTokenManager").checkSecurity(apiregentry, _url, req, headers, _servObject, reason);
}

module.exports = {checkSecurity, initSync};