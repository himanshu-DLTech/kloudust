/** 
 * addProject.js - Adds the given project to the current org
 * 
 * Params - 0 - Project description, the project name is picked from -j param
 * to the Kloudust command line itself, 1 - org - only used if cloud admin is calling
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Adds the given project to the current org
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_org)) { 
        KLOUD_CONSTANTS.LOGERROR("User is unauthorized for this operation."); return false; }

    const org = roleman.getNormalizedOrg(params[1]||KLOUD_CONSTANTS.env.org);
    const result = await dbAbstractor.addProject(KLOUD_CONSTANTS.env.prj, params[0]||"", org);   // add project for user and org
    return {result, out: "", err: ""};
}