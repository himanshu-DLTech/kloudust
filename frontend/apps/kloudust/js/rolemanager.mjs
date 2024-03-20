/**
 * Role manager.
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

/** @return The filtered role list for file holding role list object */
const fetchFilteredRoleList = async url => filterRoleList(await $$.requireJSON(url));

/**
 * Filters a role list. A role list format is 
 *  {role_1: [_objects_allowed_1], ..., role_x: _one_object_allowed_x, ..., role_n: [_objects_allowed_n]}
 * @param {Array} rolelist The role list to filter for the current role
 * @returns Returns all objects from the list which are allowed for the current role
 */
function filterRoleList(rolelist) {
    const currentRole = $$.libsession.get(APP_CONSTANTS.LOGGEDIN_USEROLE).toString(), 
        _asArray = object => Array.isArray(object) ? object : [object];
    const retlist = []; for (const [role, value] of Object.entries(rolelist)) {
        if (role.toLocaleLowerCase() == currentRole.toLocaleLowerCase()) retlist.push(..._asArray(value));
        if (role.trim().startsWith("!") && role.toLocaleLowerCase().trim() != `!${currentRole.toLocaleLowerCase()}`) 
            retlist.push(..._asArray(value));
        if (role.trim() == "*") retlist.push(..._asArray(value));
    }
    return retlist;
}

/**
 * Returns true if cloud admin is logged in, else false.
 * @return true if cloud admin is logged in, else false.
 */
function isCloudAdminLoggedIn() {
    const currentRole = $$.libsession.get(APP_CONSTANTS.LOGGEDIN_USEROLE).toString();
    return currentRole == APP_CONSTANTS.KLOUDUST_ROLES.cloudadmin;
}

export const rolemanager = {filterRoleList, fetchFilteredRoleList, isCloudAdminLoggedIn};