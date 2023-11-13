/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const path = require("path");

const colors = {
    red: s => `\x1b[031m${s}\x1b[0m`,
    green: s => `\x1b[032m${s}\x1b[0m`,
    yellow: s => `\x1b[033m${s}\x1b[0m`,
    blue: s => `\x1b[034m${s}\x1b[0m`
}

exports.COLORED_OUT = false;
const _getColoredMessage = (s, colorfunc) => exports.COLORED_OUT?colorfunc(s):s;

exports.env = {};
exports.LIBDIR = path.resolve(__dirname);
exports.ROOTDIR = path.resolve(`${__dirname}/../`);
exports.DBDIR = path.resolve(`${exports.ROOTDIR}/db`);
exports.APIDIR = path.resolve(`${exports.ROOTDIR}/apis`);
exports.CONFDIR = path.resolve(`${exports.ROOTDIR}/conf`);
exports.CONF = require(`${exports.CONFDIR}/kloudust.json`);
exports.MONKSHU_BACKEND_LIBDIR = `${exports.LIBDIR}/3p/monkshu/backend/server/lib`;

exports.ROLES = Object.freeze({CLOUD_ADMIN: "cloudadmin", ORG_ADMIN: "orgadmin", USER: "user"});

exports.COLORS = colors;
exports.LOGBARE = (s, color=colors.green) => console.info(_getColoredMessage(`${s}\n`, color));
exports.LOGINFO = s => console.info(_getColoredMessage(`[INFO] ${s}\n`, colors.green));
exports.LOGERROR = e => console.error(_getColoredMessage(`[ERROR] ${_getErrorMessage(e)}\n`, colors.red));
exports.LOGWARN = s => console.warn(_getColoredMessage(`[WARN] ${s}\n`, colors.yellow));
exports.LOGEXEC = s => console.info(_getColoredMessage(`[EXEC] ${s}\n`, colors.blue));
exports.LOGUNAUTH = s => console.info(_getColoredMessage("[ERROR] User is not authorized for this action.\n", colors.red));
exports.UNDER_MONKSHU = true;

exports.EXITOK = _ => exports.LOGINFO("Success, done.");
exports.EXITFAILED = _ => exports.LOGERROR("Failed."); 
let _allowExit = true;
exports.exitallow = allowFlag => _allowExit = allowFlag;

function _getErrorMessage(e) {
    if (e instanceof Error) return `${e.message}\n[ERROR] ${e.stack}`;

    const type = typeof e; const keys = Object.keys(e);
    if (type === 'function' || type === 'object' && !!e && keys.length) return JSON.stringify(e);

    return e;
}
