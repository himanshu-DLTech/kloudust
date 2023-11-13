/** 
 * addUserToProject.js - Adds the given user to the given project. Users
 * for a project or org admins can others to the project.
 * 
 * Params - 0 - email, 1 - project name, only org admins are honored on
 * this param.
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Adds the given user to the given or current project. Org admins can add a user
 * to any project. Normal users can only add another user to their own project.
 * @param {array} params The incoming params - must be - email, project name (optionally)
 */
module.exports.exec = async function(params) {
    const email = params[0], project = roleman.isOrgAdminLoggedIn()?params[1]:KLOUD_CONSTANTS.env.prj;

    if (await dbAbstractor.checkUserBelongsToProject(email, project)) return {result: true, err: "", out: ""};
    else return {result: await dbAbstractor.addUserToProject(email, project), err: "", out: ""};
}
