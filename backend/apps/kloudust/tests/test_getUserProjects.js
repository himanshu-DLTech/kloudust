
/**
 * Tests getting all projects for a user.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "getUserProjects";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping GET USER PROJECTS test case, not called.\n`)
        return;
    }
    
    LOG.console(`Running GET USER PROJECTS test case, command: ${COMMAND_NAME}.\n`);

    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" ") };
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`User projects retrieved successfully.\n`);
        LOG.console(`Result: ${JSON.stringify(result.projects)}\n`);
        return true;
    } else {
        LOG.console(`Failed to retrieve user projects. Error: ${result.stderr}\n`);
        return false;
    }
}
