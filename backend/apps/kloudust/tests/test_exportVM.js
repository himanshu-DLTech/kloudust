
/**
 * Tests exporting an existing VM to an SFTP server.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "export VM";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping EXPORT VM test case, not called.\n`);
        return;
    }
    
    if(!argv[1] || !argv[2] || !argv[3] || !argv[4]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <vm name> <sftp user> <sftp host> <sftp pass> [destination dir] [sftp port]\n`);
        return;
    }

    LOG.console(`Running EXPORT VM test case, command: ${COMMAND_NAME} for ${argv.map(a => `"${a}"`).join(" ")}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`VM ${argv[1]} exported successfully to ${argv[2]}@${argv[3]}.\n`);
        return true;
    } else {
        LOG.console(`Failed to export the VM ${argv[1]} to ${argv[2]}@${argv[3]}}. Error: ${result.stderr}\n`);
        return false;
    };
}
