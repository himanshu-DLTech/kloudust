/* 
 * (C) 2015 TekMonks. All rights reserved.
 */
const kloudust = require(`${APP_CONSTANTS.KLOUDUST_DIR}/kloudust`);
const dbAbstractor = require(`${APP_CONSTANTS.KLOUDUST_DIR}/lib/dbAbstractor.js`);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	
	LOG.debug("Got login request for ID: " + jsonReq.id);

	kloudust.init(); const result = await dbAbstractor.loginUser(jsonReq.id, jsonReq.pass, jsonReq.otp);

	if (result) {
		LOG.info(`User logged in: ${jsonReq.id}`); 
		result.result = true; return result;
	} else {
		LOG.error(`Bad login for: ${jsonReq.id}`);
		return CONSTANTS.FALSE_RESULT;
	}
}

const validateRequest = jsonReq => (jsonReq && jsonReq.id && jsonReq.pass && jsonReq.otp);
