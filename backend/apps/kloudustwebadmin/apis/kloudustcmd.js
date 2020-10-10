/**
 * Runs Kloudust commands. Should always require JWT token to run.
 * (C) 2020 TekMonks. All rights reserved.
 */

const spawn = require("child_process").spawn;
const agentConf = {
    "shellexecprefix_win32": ["cmd.exe", "/s", "/c"],
    "shellexecprefix_linux": ["/bin/sh","-c"],
    "shellexecprefix_darwin": ["/bin/sh","-c"],
    "shellexecprefix_freebsd": ["/bin/sh","-c"],
    "shellexecprefix_sunos": ["/bin/sh","-c"]
}

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
	
	LOG.debug(`Running Kloudust command: ${jsonReq.cmd}`);
	const nodePath = process.argv[0];
	const results = await _processExecAsync(agentConf["shellexecprefix_"+process.platform], nodePath, 
		[`${APP_CONSTANTS.KLOUDUST_DIR}/kloudust`, ...jsonReq.cmd], true);
	return {result:results.exitCode?false:true, exitCode: results.exitCode||0, stdout: results.stdout, stderr: results.stderr};
}

function _processExecAsync(cmdProcessorArray, script, paramsArray, stream) {
	return new Promise(resolve => {
		_processExec(cmdProcessorArray, script, paramsArray, stream, (exitCode, stdout, stderr) => resolve({exitCode, stdout, stderr}));
	});
}

function _processExec(cmdProcessorArray, script, paramsArray, stream, callback) {
    const spawnArray = cmdProcessorArray.slice(0);

    const quoter = process.platform === "win32" ? '"':"'";
    const paramsArrayCopy = []; paramsArray.forEach((element, i) => {paramsArrayCopy[i] = quoter+element+quoter;});
    let scriptCmd = quoter+script+quoter + " " + paramsArrayCopy.join(" ");
    scriptCmd = process.platform === "win32" ? '"'+scriptCmd+'"' : scriptCmd;
    spawnArray.push(scriptCmd);
    const shellProcess = spawn(spawnArray[0], spawnArray.slice(1), {windowsVerbatimArguments: true});

    let stdout = "", stderr = "";

    shellProcess.stdout.on("data", data => {
        stdout += String.fromCharCode.apply(null, data);
        if (stream) LOG.info(`[KLOUDUST_CMD] [PID:${shellProcess.pid}]\n${data}`);
    });

    shellProcess.stderr.on("data", data => {
        stderr += String.fromCharCode.apply(null, data);
        if (stream) LOG.error(`[KLOUDUST_CMD] [PID:${shellProcess.pid}]\n${data}`);
    });

    shellProcess.on("exit", exitCode => callback(exitCode?exitCode:null, stdout, stderr));
}

const validateRequest = jsonReq => (jsonReq && jsonReq.cmd);