
/**
 * Tests adding a new user.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "addUser";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping ADD USER test case, not called.\n`);
        return;
    }
    
    if(!argv[1] || !argv[2] || !argv[3] || !argv[4]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <email> <name> <org> <role>\n`);
        return;
    }

    LOG.console(`Running ADD USER test case, command: ${COMMAND_NAME} for ${argv.map(a => `"${a}"`).join(" ")}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`USER ${argv[1]} added successfully for org ${argv[3]}.\n`);
        return true;
    } else {
        LOG.console(`Failed to add USER ${argv[1]} for org ${argv[3]}. Error: ${result.stderr}\n`);
        return false;
    };
}
