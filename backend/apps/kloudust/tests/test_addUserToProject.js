/**
 * Tests adding a new user to existing project.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "addUserToProject";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping ADD USER to PROJECT test case, not called.\n`);
        return;
    }

    if(!argv[1] || !argv[2]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <user's email> <project name>\n`);
        return;
    } const userEmail = argv[1], projectName = argv[2];

    LOG.console(`Running ADD USER to PROJECT test case, command: ${COMMAND_NAME} for User: ${userEmail} & Project: ${projectName}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`USER ${userEmail} added successfully to the project ${projectName}.\n`);
        return true;
    } else {
        LOG.console(`Failed to add USER ${userEmail} to the project ${projectName}. Error: ${result.stderr}\n`);
        return false;
    };
}
