
/**
 * Tests adding a new project.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "addProject";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping ADD PROJECT test case, not called.\n`);
        return;
    }
    
    if(!argv[1] || !argv[2]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <projectName> <org>\n`);
        return;
    } const projectName = argv[1], org = argv[2];

    LOG.console(`Running ADD PROJECT test case, command: ${COMMAND_NAME} for Project Name: ${projectName} & Org: ${org}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`Project ${projectName} added successfully to org ${org}.\n`);
        return true;
    } else {
        LOG.console(`Failed to add project ${projectName} to org ${org}. Error: ${result.stderr}\n`);
        return false;
    };
}
