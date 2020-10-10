/* 
 * (C) 2015 TekMonks. All rights reserved.
 * See enclosed LICENSE file.
 */

const path = require("path");

APP_ROOT = `${path.resolve(`${__dirname}/../../`)}`;

exports.APP_ROOT = APP_ROOT;
exports.KLOUDUST_DIR = `${APP_ROOT}/3p/kloudust`;
exports.CONF_DIR = `${APP_ROOT}/conf`;
exports.LIB_DIR = __dirname;

/* Constants for the Login subsystem */
exports.SALT_PW = "$2a$10$VFyiln/PpFyZc.ABoi4ppf";
exports.APP_DB = `${APP_ROOT}/db/users.db`;