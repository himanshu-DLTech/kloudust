/** 
 * addImage.js - Adds the given image to the host catalog
 * 
 * Params - 0 - name - The resource identifying name, 
 *  1 - URI - usually the download URL, 2 - processor
 *  architecture eg amd64, 3 - longer description, 
 *  4 - run as a job - if true then runs the operation as
 *  async job in the backend, 5 - retry automatically on 
 *  failure if this is set to true
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const jobs = require(`${KLOUD_CONSTANTS.LIBDIR}/jobs.js`);
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const {xforge} = require(`${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/xforge`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);

/**
 * Adds the given image to the catalog
 * @param {array} params The incoming params, see above for params
 */
module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {params.consoleHandlers.LOGUNAUTH(); return false; }

    if (!await dbAbstractor.addHostResource(params[0], params[1], params[2].toLowerCase(), params[3])) return false;

    const hostinfos = await dbAbstractor.getHostsMatchingProcessorArchitecture(params[2].toLowerCase());
    if ((!hostinfos) || (!hostinfos.length)) {
        params.consoleHandlers.LOGWARN(`No hosts found matching processor architecture for image ${params[0]}.`);
        return true;
    }

    let returnResult = {result: true, out: "", err: ""}; const updateTimestamp = Date.now();
    for (const hostinfo of hostinfos) {        
        const xforgeArgs = {
            colors: KLOUD_CONSTANTS.COLORED_OUT, 
            file: `${KLOUD_CONSTANTS.LIBDIR}/3p/xforge/samples/remoteCmd.xf.js`,
            console: params.consoleHandlers,
            other: [
                hostinfo.hostaddress, hostinfo.rootid, hostinfo.rootpw, hostinfo.hostkey, 
                `${KLOUD_CONSTANTS.LIBDIR}/cmd/scripts/addImage.sh`,
                params[1], params[0].toLowerCase()
            ]
        }

        const runAsJob = params[4].toLowerCase() == "true", retryOnFailure = params[5].toLowerCase() == "true";
        const update_function = async _ => {
            const hostUpdateResults = await xforge(xforgeArgs);
            if (!hostUpdateResults.result) {    // on error at least update other hosts, it relieves cloud network pressure later for recovery
                params.consoleHandlers.LOGERROR(`Error updating host ${hostinfo.hostname} with image ${params[0]}${retryOnFailure?", retrying":""}`);
                if (!runAsJob) returnResult = hostUpdateResults;    // jobs run async to the execution call so no sense they update results
                if (retryOnFailure) jobs.add(update_function);  // on failure add the job back so the host does get updated eventually
            } else await dbAbstractor.updateHostSynctime(hostinfo.hostname, updateTimestamp);
        }
     
        if (runAsJob) jobs.add(update_function, undefined, true); else await update_function();
    }

    return returnResult;
}