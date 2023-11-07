/** 
 * deleteUserFromProject.js - Removes the given user from the given
 * or current project.
 * 
 * Params - 0 - email, 1 - project name
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Removes the given user from the given or current project. Org admins can remove a user
 * from any org project. Normal users can only remove another user from their own project.
 * @param {array} params The incoming params - must be - email, project name (optionally)
 */
module.exports.exec = async function(params) {
    const email = params[0], project = roleman.isOrgAdminLoggedIn()?params[1]:KLOUD_CONSTANTS.env.prj;

    return await dbAbstractor.removeUserFromProject(email, project);
}
