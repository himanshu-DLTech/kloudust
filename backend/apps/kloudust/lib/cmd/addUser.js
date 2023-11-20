/** 
 * addUser.js - Adds the given user to org as an operator. Only org admins can add or remove
 * org users.
 * 
 * Params - 0 - email, 1 - name, 2 - org, 3 - role (if current user is admin or super-admin)
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Adds the given user to org as an operator. Only org admins can add or remove
 * org users.
 * @param {array} params The incoming params - must be - email, name, password, org
 */
module.exports.exec = async function(params) {
    if ((!KLOUD_CONSTANTS.env._setup_mode) && (!roleman.checkAccess(roleman.ACTIONS.edit_org))) {
        params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }

    const _accountExists = async email => {
        const lookupResult = await dbAbstractor.getUserForEmail(email);
        if (lookupResult != null) return true; else return false;
    }

    const email = params[0], name = params[1], org = roleman.getNormalizedOrg(params[2]), role = params[3];
    if (await _accountExists(email)) {params.consoleHandlers.LOGERROR("Account already exists or unauthorized."); 
        return CMD_CONSTANTS.FALSE_RESULT("Account already exists or unauthorized.");}  

    const result = await dbAbstractor.addUserToDB(email, name, org, (roleman.isCloudAdminLoggedIn() ||
        roleman.isOrgAdminLoggedIn()) ? role : KLOUD_CONSTANTS.ROLES.USER);
    return {result, out: "", err: ""};
}
