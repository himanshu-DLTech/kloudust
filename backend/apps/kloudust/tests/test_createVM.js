
/**
 * Tests creating a new VM.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "createVM";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping CREATE VM test case, not called.\n`);
        return;
    }

    if(!argv[1] || !argv[2] || !argv[3] || !argv[4] || !argv[5] || !argv[6] || !argv[7]) {
        LOG.console(`Invalid parameters for ${COMMAND_NAME} test case.\n`);
        LOG.console(`Usage: ${COMMAND_NAME} <vm name> <description> <cores> <memory> <disk> <creation image> <cloudinit data> 
            [force overwrite] [max cores] [max memory] [additional params] [vmtype] [no qemu agaent] [hostname]\n`);
        return;
    }

    LOG.console(`Running CREATE VM test case, command: ${COMMAND_NAME} for ${argv.map(a => `"${a}"`).join(" ")}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`VM ${argv[1]} created successfully.\n`);
        return true;
    } else {
        LOG.console(`Failed to create VM ${argv[1]}. Error: ${result.stderr}\n`);
        return false;
    };
}