
/**
 * Tests listing available VM Images.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const kdcmd = require(`${KLOUD_CONSTANTS.APIDIR}/kloudustcmd.js`);
const TEST_CONSTANTS = require(`${__dirname}/conf/constants.json`);

const COMMAND_NAME = "listVMImages";

exports.runTestsAsync = async function(argv) {
    if ((!argv[0]) || (argv[0] != COMMAND_NAME)) {
        LOG.console(`Skipping LIST VM IMAGES test case, not called.\n`);
        return;
    }
    
    LOG.console(`Running LIST VM IMAGES test case, command: ${COMMAND_NAME}\n`);
    
    const requestBody = { cmd: argv.map(a => `"${a}"`).join(" "), project: "default"};
    const headers = { 'accept': '*/*', 'content-type': 'application/json',
            "x-api-Key": TEST_CONSTANTS.X_API_KEY,
            "authorization": `Bearer ${TEST_CONSTANTS.AUTH_TOKEN}`
    }

    let result = await kdcmd.doService(requestBody, undefined, headers);
    if (result && result.result) {
        LOG.console(`list VM Images command succeed\n${result.out}\n`);
        return true;
    } else {
        LOG.console(`Failed to list the VM Images. Error: ${result.stderr}\n`);
        return false;
    };
}
