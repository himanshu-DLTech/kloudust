/**
 * Runs Kloudust commands. Should always require JWT token to run.
 * (C) 2020 TekMonks. All rights reserved.
 */

const login = require(`${KLOUD_CONSTANTS.APIDIR}/login.js`);
const kloudust = require(`${KLOUD_CONSTANTS.ROOTDIR}/kloudust`);

exports.doService = async (jsonReq, _servObject, headers, _url, _apiconf) => {
	const requestID = Date.now()+":"+Math.random().toString().split(".")[1];

	if (!validateRequest(jsonReq)) {_streamHandler(requestID, undefined, undefined, 
		`Validation failure for the request -> ${jsonReq?JSON.stringify(jsonReq):"undefined"}`); return CONSTANTS.FALSE_RESULT;}
	
    const user = login.getID(headers);
	_streamHandler(requestID, `Running Kloudust command: ${jsonReq.cmd}`);
    const kdRequest = {user: [user], project: jsonReq.project?[jsonReq.project]:undefined, execute: [jsonReq.cmd],
		setup: jsonReq.setup?[jsonReq.setup]:undefined, consoleStreamHandler: (info, warn, error) => 
			_streamHandler(requestID, info, warn, error)};
	const results = await kloudust.kloudust(kdRequest);
	return {result: results.result, stdout: results.out||"", stderr: results.err||""};
}

function _streamHandler(id, info, warn, err) {
	if (info && info.toString().trim() != "") KLOUD_CONSTANTS.LOGINFO(`[${id}] ${info}`);
	if (warn && warn.toString().trim() != "") KLOUD_CONSTANTS.LOGWARN(`[${id}] ${warn}`);
	if (err && err.toString().trim() != "") KLOUD_CONSTANTS.LOGERROR(`[${id}] ${err}`);
}

const validateRequest = jsonReq => jsonReq && jsonReq.cmd;