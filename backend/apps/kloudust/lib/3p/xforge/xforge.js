/**
 * >>>>> NOT REAL XFORGE!
 * 
 * Stub to migrate Kloudust to be independent of XForge. This 
 * provides an interface compatible to XForge in-process args.
 * 
 * License: See enclosed LICENSE file.
 * (C) 2023 Tekmonks
 */

const remote_ssh = require(`${__dirname}/remote_ssh_sh.js`);

exports.xforge = async function(xforge_args) {
    try {
        const remoteCommand = xforge_args.other;

        const [host, user, password, hostkey, scriptPath] = [...remoteCommand].slice(0, 5);
        const sshArgs = [...remoteCommand].slice(4);    // this is because all Kloudust files start from param 1 so we need param 0 to be the script itself
        const results = await ssh_cmd(host, user, password, hostkey, scriptPath, sshArgs, true);

        KLOUD_CONSTANTS.LOGINFO("Success, done.");
        return results;
	} catch (err) { 
		KLOUD_CONSTANTS.LOGERROR(`Build failed with remote exit code: ${err.exitCode}, due to error: ${err.stderr}`);
        return err; 
	}
}

function ssh_cmd(host, user, password, hostkey, shellScriptPath, scriptParams, stream) {
    KLOUD_CONSTANTS.LOGINFO(`[SSH_CMD]: ${user}@${host} -> ${scriptParams.join(" ")}`);
    return new Promise((resolve, reject) => {
        remote_ssh.runRemoteSSHScript({user, password, host, hostkey}, shellScriptPath, scriptParams, stream, (err,stdout,stderr) => {
            if (!err) resolve({result: true, exitCode: 0, stdout, stderr, out: stdout, err: stderr});
            else reject({result: false, exitCode: err, stdout, stderr, out: stdout, err: stderr});
        });
    });
}