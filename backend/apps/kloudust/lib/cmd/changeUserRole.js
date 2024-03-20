/** 
 * changeUserRole.js - Changes the user's role. A user can't change their 
 * own role. Only org and cloud admins can call this. Org admin can change
 * roles for the users of their own org, cloud admins can change role of any
 * user across orgs.
 * 
 * Params - 0 - email - the user's email, 2 - role - the new role, 
 *  3 - org - the user's org, optional
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

/**
 * Changes the role of the given user.
 * @param {array} params The incoming params, see above.
 */
module.exports.exec = async function(params) {
    if ((!roleman.isCloudAdminLoggedIn()) && (!roleman.isOrgAdminLoggedIn())) {
        params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }

    const _accountExists = async (email) => {
        const lookupResult = await dbAbstractor.getUserForEmail(email);
        if (lookupResult != null) return true; else return false;
    }

    const [email, roleRaw, orgRaw] = [...params], org = roleman.getNormalizedOrg(orgRaw), 
        role = roleman.getNormalizedRole(roleRaw.toLowerCase());
    if (!Object.values(KLOUD_CONSTANTS.ROLES).includes(roleRaw.toLowerCase())) {const err = `Invalid role ${role}.`; 
        params.consoleHandlers.LOGERROR(err); return CMD_CONSTANTS.FALSE_RESULT(err);}  
    if (roleRaw.toLowerCase() != role) {const err = `Unauthorized role assignment ${roleRaw}.`; 
        params.consoleHandlers.LOGERROR(err); return CMD_CONSTANTS.FALSE_RESULT(err);} 
    if (!await _accountExists(email, org)) {const err = `Account ${email} doesn't exist.`; 
        params.consoleHandlers.LOGERROR(err); return CMD_CONSTANTS.FALSE_RESULT(err);}  
    
    const result = await dbAbstractor.changeUserRole(email, role, org);
    return {result, out: "", err: ""};
}
