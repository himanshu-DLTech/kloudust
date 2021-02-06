/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const kloudust = require(`${APP_CONSTANTS.KLOUDUST_DIR}/kloudust`);
const dbAbstractor = require(`${APP_CONSTANTS.KLOUDUST_DIR}/lib/dbAbstractor.js`);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	
	LOG.debug("Got change password request for ID: " + jsonReq.id);

	kloudust.init(); const result = await dbAbstractor.changeUserPassword(jsonReq.id, jsonReq.oldpass, jsonReq.pass);

	if (result) LOG.info(`Password changed for: ${jsonReq.id}`); else LOG.error(`Failed to change password for: ${jsonReq.id}`);

	return {result};
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.pass && jsonReq.oldpass);
