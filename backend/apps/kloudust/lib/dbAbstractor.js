/** 
 * dbAbstractor.js - All DB queries for Kloudust. Role enforcement is
 * embedded here as well via calls to role enforcer.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const path = require("path");
const kdutils = require(`${KLOUD_CONSTANTS.LIBDIR}/utils.js`);
const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const crypt = require(`${KLOUD_CONSTANTS.MONKSHU_BACKEND_LIBDIR}/crypt.js`);
const monkshubridge = require(`${KLOUD_CONSTANTS.LIBDIR}/monkshubridge.js`);
const jsonxparser = require(`${KLOUD_CONSTANTS.MONKSHU_BACKEND_LIBDIR}/jsonx.js`);
const dbschema = jsonxparser.parseFileSync(`${KLOUD_CONSTANTS.DBDIR}/kd_dbschema.jsonx`);

const KLOUDUST_MAIN_DBFILE = path.resolve(`${KLOUD_CONSTANTS.ROOTDIR}/db/kloudust.db`);

/** Inits the module */
exports.initAsync = async function() { KLOUD_CONSTANTS.env.db = await _initMonkshuGlobalAndGetDBModuleAsync(); }

/**
 * Adds the given host to the catalog, if it exists, it will delete and reinsert it. 
 * Hosts are never tied to any project, org or entity and owned by the entire cloud.
 * @param {string} hostname The hostname which is any identifiable name for the host
 * @param {string} hostaddress The host IP or DNS address
 * @param {string} type The host type
 * @param {string} rootid The host's admin user id
 * @param {string} rootpw The host's admin password
 * @param {string} hostkey The hostkey
 * @param {number} cores The cores
 * @param {number} memory The memory
 * @param {number} disk The disk
 * @param {number} networkspeed The networkspeed
 * @param {string} processor The processor
 * @param {string} processor The processor architecture eg amd64
 * @param {number} sockets The sockets
 * @return true on success or false otherwise
 */
exports.addHostToDB = async (hostname, hostaddress, type, rootid, rootpw, hostkey, cores, memory, disk, networkspeed, 
        processor, processor_architecture, sockets) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {_logUnauthorized(); return false;}

    const rootpw_encrypted = crypt.encrypt(rootpw);
    const query = "replace into hosts(hostname, hostaddress, type, rootid, rootpw, hostkey, cores, memory, disk, networkspeed, processor, processorarchitecture, sockets) values (?,?,?,?,?,?,?,?,?,?,?,?,?)";
    return await _db().runCmd(query, [hostname, hostaddress, type, rootid, rootpw_encrypted, hostkey, cores, memory, 
        disk, networkspeed, processor, processor_architecture, sockets]);
}

/**
 * Deletes the given host from the catalog. Only cloud admin can delete hosts.
 * @param {string} hostname The hostname
 * @return true on success or false otherwise
 */
exports.deleteHostFromDB = async (hostname) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {_logUnauthorized(); return false; }

    const query = "delete from hosts where hostname = ?";
    return await _db().runCmd(query, [hostname]);
}

/**
 * Sets the latest synced timestamp for the host
 * @param {string} hostname The hostname to update the entry for
 * @param {number} timestamp The sync timestamp value to set
 * @returns true on success or false otherwise
 */
exports.updateHostSynctime = async(hostname, timestamp) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {_logUnauthorized(); return false; }

    const query = "update hosts set synctimestamp = ? where hostname = ?";
    return await _db().runCmd(query, [timestamp, hostname]);
}

/**
 * Returns all hosts matching the given processor architecture.
 * @param {string} processor_architecture The processor architecutre, eg amd64
 * @returns The matching hosts or null on error or empty array if nothing found
 */
exports.getHostsMatchingProcessorArchitecture = async(processor_architecture) => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_cloud_resource)) {_logUnauthorized(); return false; }

    const query = "select * from hosts where processorarchitecture=? collate nocase";
    const hosts = await _db().getQuery(query, [processor_architecture]);
    if (hosts && hosts.length) for (const host of hosts) host.rootpw = crypt.decrypt(host.rootpw);
    return hosts;
}

/**
 * Adds the given host resources to the tracking DB
 * @param {string} name Unique name
 * @param {string} uri Download URL usually
 * @param {string} processor_architecture The processor architecture eg amd64
 * @param {string} description Description 
 * @param {string} extra Extra information 
 * @returns true on success or false otherwise
 */
exports.addHostResource = async (name, uri, processor_architecture, description, extra) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {_logUnauthorized(); return false; }

    const query = "replace into hostresources(name, uri, processorarchitecture, description, extrainfo) values (?,?,?,?,?)";
    return await _db().runCmd(query, [name, uri, processor_architecture, description, extra]);
}

/**
 * Returns the given host resource for project
 * @param {string} name The resource name
 * @return host resource object on success or null otherwise
 */
exports.getHostResourceForProject = async name => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_cloud_resource_for_project)) {_logUnauthorized(); return false; }

    const query = "select * from hostresources where name=?";
    const resources = await _db().getQuery(query, [name]);
    if ((!resources) || (!resources.length)) return null; else return resources[0];
}

/**
 * Deletes the given host resource. Only cloud admin can delete hosts.
 * @param {string} name The resource name
 * @return true on success or false otherwise
 */
exports.deleteHostResource = async (name) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_cloud_resource)) {_logUnauthorized(); return false; }

    const query = "delete from hostresources where name = ?";
    return await _db().runCmd(query, [name]);
}

/**
 * Returns the host entry object for the given hostname. Any valid project user
 * is authorized as VMs and other resources need host entry to access the hosting
 * server for them.
 * @param {string} hostname The host name
 * @return {hostname, rootid, rootpw, hostkey} or null
 */
exports.getHostEntry = async hostname => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_cloud_resource_for_project)) {_logUnauthorized(); return false; }

    const hosts = await _db().getQuery("select * from hosts where hostname = ?", hostname);
    if (!hosts || !hosts.length) return null;

    hosts[0].rootpw = crypt.decrypt(hosts[0].rootpw);  // decrypt the password
    return hosts[0];
}

/**
 * Adds the given VM to the catalog.
 * @param {string} name The VM name
 * @param {string} description The VM description
 * @param {string} hostname The hostname
 * @param {string} os The OS
 * @param {integer} cpus The CPU
 * @param {integer} memory The memory
 * @param {integer} disk The disk
 * @return true on success or false otherwise
 */
exports.addVMToDB = async (name, description, hostname, os, cpus, memory, disk) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {_logUnauthorized(); return false;}

    const project = KLOUD_CONSTANTS.env.prj, org = KLOUD_CONSTANTS.env.org, id = `${org}_${project}_${name}`
    const query = "insert into vms(id, name, description, hostname, org, projectid, os, cpus, memory, disk) values (?,?,?,?,?,?,?,?,?,?)";
    return await _db().runCmd(query, [id, name, description, hostname, org, _getProjectID(), os, cpus, memory, disk]);
}

/**
 * Returns the VM for the current user, org and project given its name. 
 * @param {string} name The VM Name
 * @return VM object or null
 */
exports.getVM = async name => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_project_resource)) {_logUnauthorized(); return false;}

    const project = KLOUD_CONSTANTS.env.prj, org = KLOUD_CONSTANTS.env.org, id = `${org}_${project}_${name}`;
    const results = await _db().getQuery("select * from vms where id = ?", [id]);
    return results?results[0]:null;
}

/**
 * Renames the VM for the current user, org and project given its name. 
 * @param {string} name The VM name
 * @param {string} newname The VM new name
 * @return true on success or false otherwise
 */
exports.renameVM = async (name, newname) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {_logUnauthorized(); return false;}

    const vm = await exports.getVM(name); if (!vm) return false;
    if (!await exports.addVMToDB(newname, vm.description, vm.hostname, vm.os, vm.cpus, vm.memory, vm.disk)) return false;
    return await exports.deleteVM(name); 
}

/**
 * Deletes the VM for the current user, org and project given its name. 
 * @param {string} name The VM Name
 * @return true on success or false otherwise
 */
exports.deleteVM = async name => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {_logUnauthorized(); return false;}

    const project = KLOUD_CONSTANTS.env.prj, org = KLOUD_CONSTANTS.env.org, id = `${org}_${project}_${name}`;
    return await _db().runCmd("delete from vms where id = ?", [id]);
}

/**
 * Returns VMs for the given host and / or current project. All VMs for the current project
 * are returned if hostname is skipped. This is for project admins or project users.
 * @param {string} hostname The host (optional)
 * @param {boolean} dontUseProject Return list of VMs for the host irrespective of project
 * @return The list of VMs
 */
exports.listVMs = async hostname => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_project_resource)) {_logUnauthorized(); return false;}

    const projectid = _getProjectID(), org = KLOUD_CONSTANTS.env.org;
    const query = hostname ? "select * from vms where hostname = ? and projectid = ? and org = ?" : 
        "select * from vms where projectid = ? and org = ?";
    const results = await _db().getQuery(query, hostname?[hostname,projectid,org]:[projectid,org]);
    return results;
}

/**
 * Returns VMs for the given host. All VMs are returned if hostname is skipped. 
 * This is for cloud admins.
 * @param {string} hostname The host (optional)
 * @return The list of VMs
 */
exports.listVMsForCloudAdmin = async hostname => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_cloud_resource)) {_logUnauthorized(); return false;}

    const query = hostname ? "select * from vms where hostname = ?" : "select * from vms";

    const results = await _db().getQuery(query, hostname?[hostname]:[]);
    return results;
}

/**
 * Adds the project to the DB if it doesn't exist for this org. Only admins
 * can add new projects.
 * @param {string} name The project name
 * @param {string} description The project description 
 * @return true on success or false otherwise
 */
exports.addProject = async(name, description="", orgIn=KLOUD_CONSTANTS.env.org) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_org)) {_logUnauthorized(); return false;}

    const org = roleman.getNormalizedOrg(orgIn), id = _getProjectID(KLOUD_CONSTANTS.env.prj, org);
    if ((await exports.getProject(name)).length == 0) return await _db().runCmd(
        "insert into projects (id, name, org, description) values (?,?,?,?)", [id, name, org, description]);
    else return true;
}

/**
 * Returns the project or all if name is null. For users it returns
 * projects they are mapped to, and for admins it goes across org projects
 * @param {string} name Project name
 */
exports.getProject = async name => {
    const userid = KLOUD_CONSTANTS.env.user, org = KLOUD_CONSTANTS.env.org, 
        projectid = `${(name||"undefined").toLocaleLowerCase()}_${org}`;

    let results;
    if (KLOUD_CONSTANTS.env.role == KLOUD_CONSTANTS.ROLES.ORG_ADMIN) {
        if (name) results = await _db().getQuery("select * from projects where id=? and org=?", 
            [projectid, org]);
        else results = await _db().getQuery("select * from projects where org=?)", [org]);
    }
    else {
        if (name) results = await _db().getQuery("select * from projects where id in \
            (select projectid from projectusermappings where userid=?) and id=?", [userid,projectid]);
        else results = await _db().getQuery("select * from projects where id in \
            (select projectid from projectusermappings where userid=?)", [userid]);
    }

    return _getArrayOrObjectIfLength1(results);
}

/**
 * Deletes the current project from the DB for this org. Only admins can delete.
 * @param {string} name The project name - only honored for cloud admins, else current project is used
 * @param {string} org The project org - only honored for cloud admins, else current org is used
 * @return true on success or false otherwise
 */
exports.deleteProject = async (name, org=KLOUD_CONSTANTS.env.org) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_org)) {_logUnauthorized(); return false; }

    const id = _isCloudAdminLoggedIn()?_getProjectID(name, org):_getProjectID();
    let result = await _db().runCmd("delete from projects where id = ?", [id]);
    if (result) result = await _db().runCmd("delete from projectusermappings where projectid = ?", [id]);
    return result;
}

/**
 * Adds the given user to the DB
 * @param {string} email The user's email, must be unique
 * @param {string} name The user's name 
 * @param {string} org The user's organization, only honored for 
 *                     cloud admins, else the current org is used.
 * @param {string} role The user's role
 * @param {boolean} _setup_mode True if we are in setup mode
 * @return true on succes, false otherwise
 */
exports.addUserToDB = async (email, name, org=KLOUD_CONSTANTS.env.org, role) => {
    const setup_mode = KLOUD_CONSTANTS.env._setup_mode;
    if ((!setup_mode) && (!roleman.checkAccess(roleman.ACTIONS.edit_org))) {_logUnauthorized(); return false; }

    const query = "insert into users(id, name, org, role) values (?,?,?,?)", 
        orgFixed = setup_mode || _isCloudAdminLoggedIn() ? org : KLOUD_CONSTANTS.env.org;
    return await _db().runCmd(query, [email.toLocaleLowerCase(), name, orgFixed, role]);
}

/**
 * Removes the given user from the DB, assumption is that he is under the
 * same org as the admin removing him. Only admin can remove, anyone can add
 * as removal is a destructive operation.
 * @param {string} email The user's email
 * @param {string} org The user's organization, only honored for 
 *                     cloud admins, else the current org is used.
 * @return true on succes, false otherwise
 */
exports.removeUserFromDB = async (email, org=KLOUD_CONSTANTS.env.org) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_org)) {_logUnauthorized(); return false;}

    const orgFixed = _isCloudAdminLoggedIn() ? org : KLOUD_CONSTANTS.env.org;

    const query = "delete from users where id=? and org=?";
    return await _db().runCmd(query, [email.toLocaleLowerCase(), orgFixed]);
}

/**
 * Adds the given user to the currently logged in user's project
 * @param {string} userid The user ID to add 
 * @param {string} project The project to add to, only honored for org admins, 
 *                         else current project is used
 * @returns true on succes, false otherwise
 */
exports.addUserToProject = async (userid, project) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {_logUnauthorized(); return false;}

    const query = "insert into projectusermappings(userid, projectid) values (?,?)"
    return await _db().runCmd(query, [userid, _getProjectID(roleman.isOrgAdminLoggedIn()?project:undefined)]);
}

/**
 * Removes the given user from the project. This does not remove the 
 * user from the DB. So any current project user or admin can perform 
 * this operation.
 * @param {string} user The user ID to add 
 * @param {string} project The project to add to, only honored for org admins, 
 *                         else current project is used
 * @returns true on succes, false otherwise
 */
exports.removeUserFromProject = async (user, project) => {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {_logUnauthorized(); return false;}

    const query = "delete from projectusermappings where userid=? and projectid=?"
    return await _db().runCmd(query, [user, _getProjectID(roleman.isOrgAdminLoggedIn()?project:undefined)]);
}

/**
 * Returns all currently registered admins, for an org, could be null in case of error.
 * Only cloud admin or an org admin can retrieve this list.
 * @param {string} org  The org, a case insensitive search will be performed. This param is only
 *                      honored if a cloud admin is logged in, else the org of the currently logged
 *                      in user will be used.
 */
exports.getAllAdmins = async (org=KLOUD_CONSTANTS.env.org) => {
    if (!roleman.checkAccess(roleman.ACTIONS.lookup_org)) {_logUnauthorized(); return false;}

    const users = await _db().getQuery(
        `select * from users where org = ? and role = ${KLOUD_CONSTANTS.ROLES.ORG_ADMIN} collate nocase`, 
        [_isCloudAdminLoggedIn()?org:KLOUD_CONSTANTS.env.org]);
    return users;
}

/**
 * Returns user account for the given email address. Any currently logged
 * in user from the org can fetch this.
 * @param {string} email Expected email address
 * @param {string} org The org, a case insensitive search will be performed. This param is only
 *            honored if a cloud admin is logged in, else the org of the currently logged
 *            in user will be used.
 * @return The account object or null on error
 */
exports.getUserForEmail = async (email, org=KLOUD_CONSTANTS.env.org) => {
    const users = await _db().getQuery("select * from users where id = ? and org = ?", 
        [email.toLocaleLowerCase(), _isCloudAdminLoggedIn()?org:KLOUD_CONSTANTS.env.org]);
    if (users && users.length && checkOrg(users[0].org)) return users[0]; else return null;
}

/** Returns the total number of users in the cloud database */
exports.getUserCount = async _ => ((await _db().getQuery("select * from users"))?.length)||0;

/**
 * Logs the given user in and sets up for environment variables
 * @param {string} email The email
 * @param {string} project The project the user will work on
 * @return true on success and false otherwise
 */
exports.loginUser = async (email, project) => {
    if (KLOUD_CONSTANTS.env._setup_mode) {
        KLOUD_CONSTANTS.env.username = "Setup admin";
        KLOUD_CONSTANTS.env.userid = email;
        KLOUD_CONSTANTS.env.org = "Setup org";
        KLOUD_CONSTANTS.env.role = KLOUD_CONSTANTS.ROLES.CLOUD_ADMIN;
        KLOUD_CONSTANTS.env.prj = project;
        return {name: KLOUD_CONSTANTS.env.username, email, org: KLOUD_CONSTANTS.env.org, role: KLOUD_CONSTANTS.env.role};
    } // in setup mode we don't need to do these checks as DB is empty

    const users = await _db().getQuery("select * from users where id = ?", email.toLocaleLowerCase());
    if (!users || !users.length) return false;  // bad ID 
    const project_check = (users[0].role == KLOUD_CONSTANTS.ROLES.ORG_ADMIN || 
        users[0].role == KLOUD_CONSTANTS.ROLES.CLOUD_ADMIN) ? true : await exports.checkUserBelongsToProject(email, project, users[0].org);
    if (!project_check) return false;  // not part of this project    
    
    KLOUD_CONSTANTS.env.username = users[0].name;
    KLOUD_CONSTANTS.env.userid = users[0].id.toLocaleLowerCase();
    KLOUD_CONSTANTS.env.org = users[0].org;
    KLOUD_CONSTANTS.env.role = users[0].role;
    KLOUD_CONSTANTS.env.prj = project;

    return users[0];
}

exports.checkUserBelongsToProject = async function (userid=KLOUD_CONSTANTS.env.userid, 
        project=KLOUD_CONSTANTS.env.prj, org=KLOUD_CONSTANTS.env.org) {

    const projectid = _getProjectID(project, org);
    const check = await _db().getQuery("select projectid from projectusermappings where userid = ? and projectid = ?", 
        [userid, projectid]);
    if (!check || !check.length) return false;  // user isn't part of this project
    else return true;
}

const _logUnauthorized = _ => KLOUD_CONSTANTS.LOGERROR("User is not authorized.");

const _getProjectID = (project=KLOUD_CONSTANTS.env.prj, org=KLOUD_CONSTANTS.env.org) => `${project}_${org}`;

const _isCloudAdminLoggedIn = roleman.isCloudAdminLoggedIn;

async function _initMonkshuGlobalAndGetDBModuleAsync() {
    const monkshuDBWrapped = await monkshubridge.initMonkshuGlobalAndGetModuleAsync("db");
    const dbDriverMonkshu = await monkshuDBWrapped.getDBDriver("sqlite", KLOUDUST_MAIN_DBFILE, dbschema);
    const monkshuDBDriverWrapped = kdutils.wrapObjectInNewContext(dbDriverMonkshu, {CONSTANTS, LOG});
    const db = monkshuDBDriverWrapped; await db.init(); return db;
}

const _getArrayOrObjectIfLength1 = results => results.length == 1?results[0]:results;

const _db = _ => KLOUD_CONSTANTS.env.db;