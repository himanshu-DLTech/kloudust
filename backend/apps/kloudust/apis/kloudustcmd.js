/**
 * Runs Kloudust commands. Should always require JWT token to run.
 * (C) 2020 TekMonks. All rights reserved.
 */

const login = require(`${KLOUD_CONSTANTS.APIDIR}/login.js`);
const kloudust = require(`${KLOUD_CONSTANTS.ROOTDIR}/kloudust`);

exports.doService = async (jsonReq, _servObject, headers, _url, _apiconf) => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	
    const user = login.getID(headers);
	LOG.debug(`Running Kloudust command: ${jsonReq.cmd}`);
    const kdRequest = {user: [user], project: jsonReq.project?[jsonReq.project]:undefined, execute: [jsonReq.cmd],
		setup: jsonReq.setup?[jsonReq.setup]:undefined};
	const results = await kloudust.kloudust(kdRequest);
	return {result: results.result, stdout: results.out||"", stderr: results.err||""};
}
const validateRequest = jsonReq => jsonReq && jsonReq.cmd;