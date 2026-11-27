/**
 * Evicts or restores a physical host. Eviction removes it from the Cloud
 * Balancer (getAvailableHosts). Existing VMs are drained through live migration
 * only when forceDrainVMs is true.
 * Params: hostname, evicted (true/false), forceDrainVMs (true/false, optional).
 */
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const dbAbstractor = require(`${KLOUD_CONSTANTS.LIBDIR}/dbAbstractor.js`);
const liveMigrate = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/liveMigrate.js`);
const liveMigrateHostHelper = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/liveMigrateHostHelper.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.LIBDIR}/cmd/cmdconstants.js`);

module.exports.exec = async function(params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) { params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT(); }
    const [hostname, evictedRaw, forceDrainVMsRaw="false"] = params;
    const evicted = String(evictedRaw).toLowerCase() === "true";
    const forceDrainVMs = String(forceDrainVMsRaw).toLowerCase() === "true";
    const host = await dbAbstractor.getHostEntry(hostname);
    if (!host) { params.consoleHandlers.LOGERROR("Bad hostname or host not found"); return CMD_CONSTANTS.FALSE_RESULT(); }

    if (!await dbAbstractor.setHostEvicted(hostname, evicted)) {
        params.consoleHandlers.LOGERROR("Unable to update host eviction state"); return CMD_CONSTANTS.FALSE_RESULT();
    }
    await dbAbstractor.auditHostAction(hostname, evicted ? "eviction_enter" : "eviction_exit", KLOUD_CONSTANTS.env.userid());
    if (!evicted) return CMD_CONSTANTS.TRUE_RESULT(`Host ${hostname} accepts new VM placements.`);
    if (!forceDrainVMs) return CMD_CONSTANTS.TRUE_RESULT(`Host ${hostname} is evicted from new VM placements.`);

    const vms = await dbAbstractor.listVMsForCloudAdmin(["vm"], hostname) || [];
    for (const vm of vms) {
        const compatible = await liveMigrateHostHelper.getCompatibleHostsForLiveMigration(vm.name_raw);
        const destination = compatible.hosts?.[0];
        if (!destination) {
            params.consoleHandlers.LOGERROR(`Unable to drain ${vm.name_raw}: no compatible host is available.`);
            return CMD_CONSTANTS.FALSE_RESULT(`Host ${hostname} is evicted, but could not drain ${vm.name_raw}.`);
        }
        const migrationParams = [vm.name_raw, destination.hostname]; migrationParams.consoleHandlers = params.consoleHandlers;
        const result = await liveMigrate.exec(migrationParams);
        if (!result.result) return result;
    }
    return CMD_CONSTANTS.TRUE_RESULT(`Host ${hostname} is evicted and has been drained.`);
};
