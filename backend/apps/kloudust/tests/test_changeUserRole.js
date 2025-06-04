
/**
 * Tests change user role for an existing user.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "changeUserRole";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping CHANGE USER ROLE test case, not called.\n`);
        return;
    }
    
    if(!argv[1] || !argv[2] || !argv[3]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <email> <role> <org>\n`);
        return;
    }

    LOG.console(`Running CHANGE USER ROLE test case, command: ${COMMAND_NAME} for ${argv.map(a => `"${a}"`).join(" ")}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`ROLE ${argv[2]} updated successfully for user ${argv[1]} & org ${argv[3]}.\n`);
        return true;
    } else {
        LOG.console(`Failed to update ROLE ${argv[2]} for user ${argv[1]} & org ${argv[3]}. Error: ${result.stderr}\n`);
        return false;
    };
}
