/**
 * Runs Kloudust commands. Should always require JWT token to run.
 * 
 * Request params
 * 	cmd - The command to run, the user ID is auto picked always from the JWT token
 * 	setup - Only valid during special setup mode, if set to true then setup mode will be used if secure
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const login = require(`${KLOUD_CONSTANTS.APIDIR}/login.js`);
const kloudust = require(`${KLOUD_CONSTANTS.ROOTDIR}/kloudust`);

exports.doService = async (jsonReq, _servObject, headers, _url, _apiconf) => {
	const requestID = Date.now()+":"+Math.random().toString().split(".")[1];

	if (!validateRequest(jsonReq)) {_streamHandler(requestID, undefined, undefined, 
		`Validation failure for the request -> ${jsonReq?JSON.stringify(jsonReq):"undefined"}`); return CONSTANTS.FALSE_RESULT;}
	
    const user = login.getID(headers); if (!user) {_streamHandler(requestID, undefined, undefined,
		`Validation failure for the request, missing user ID from headers -> ${JSON.stringify(jsonReq)}`); return CONSTANTS.FALSE_RESULT;}
	_streamHandler(requestID, `Running Kloudust command: ${jsonReq.cmd}`);
    const kdRequest = {user: [user], project: jsonReq.project?[jsonReq.project]:undefined, execute: [jsonReq.cmd],
		setup: jsonReq.setup?[jsonReq.setup]:undefined, consoleStreamHandler: (info, warn, error) => 
			_streamHandler(requestID, info, warn, error)};
	const results = await kloudust.kloudust(kdRequest);
	return {...results, result: results.result, stdout: results.out||"", stderr: results.err||"", exitcode: results.result?0:1};
}

function _streamHandler(id, info, warn, err) {
	if (info && info.toString().trim() != "") KLOUD_CONSTANTS.LOGINFO(`[${id}] ${info}`);
	if (warn && warn.toString().trim() != "") KLOUD_CONSTANTS.LOGWARN(`[${id}] ${warn}`);
	if (err && err.toString().trim() != "") KLOUD_CONSTANTS.LOGERROR(`[${id}] ${err}`);
}

const validateRequest = jsonReq => jsonReq && jsonReq.cmd;