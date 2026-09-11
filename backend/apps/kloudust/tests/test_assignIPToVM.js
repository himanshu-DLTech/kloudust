
/**
 * Tests assigning a given IP to the VM.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "assignIPToVM";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping ASSIGN VM IP test case, not called.\n`);
        return;
    }
    
    if(!argv[1] || !argv[2]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <vm name> <IP>\n`);
        return;
    }

    LOG.console(`Running ASSIGN VM IP test case, command: ${COMMAND_NAME} for ${argv.map(a => `"${a}"`).join(" ")}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`IP ${argv[2]} assigned successfully to VM ${argv[1]}.\n`);
        return true;
    } else {
        LOG.console(`Failed to assign IP ${argv[2]} to VM ${argv[1]}. Error: ${result.stderr}\n`);
        return false;
    };
}
