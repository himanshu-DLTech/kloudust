/* 
 * (C) 2020 TekMonks. All rights reserved.
 */
const totp = require(`${APP_CONSTANTS.KLOUDUST_DIR}/lib/totp.js`);
const kloudust = require(`${APP_CONSTANTS.KLOUDUST_DIR}/kloudust`);
const dbAbstractor = require(`${APP_CONSTANTS.KLOUDUST_DIR}/lib/dbAbstractor.js`);

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	
	LOG.debug("Got register request for ID: " + jsonReq.id);

	if (!totp.verifyTOTP(jsonReq.totpSecret, jsonReq.totpCode)) {
		LOG.error(`Unable to register: ${jsonReq.id}, wrong totp code`);
		return CONSTANTS.FALSE_RESULT;
	}

	kloudust.init(); const result = await dbAbstractor.addUserToDB(jsonReq.id, jsonReq.name, jsonReq.org, jsonReq.pass,
		jsonReq.totpSecret, "root", (await dbAbstractor.getAllAdmins(jsonReq.org)).length==0);

	if (result) LOG.info(`User registered: ${jsonReq.id}`); else LOG.error(`Unable to register: ${jsonReq.id}, DB error`);

	return {result};
}

const validateRequest = jsonReq => (jsonReq && jsonReq.pass && jsonReq.id && jsonReq.name && jsonReq.org && jsonReq.totpSecret && jsonReq.totpCode);
