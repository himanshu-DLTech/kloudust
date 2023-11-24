/**
 * Main constant for the app.
 * (C) 2015 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */
const FRONTEND = "https://{{{hostname}}}";
const BACKEND = "https://{{{hostname}}}:9090";
const APP_NAME = "kloudust";
const APP_PATH = `${FRONTEND}/apps/${APP_NAME}`;
const API_PATH = `${BACKEND}/apps/${APP_NAME}`;
const CONF_PATH = `${FRONTEND}/apps/${APP_NAME}/conf`;
const INDEX_HTML = APP_PATH+"/index.html";
const MAIN_HTML = APP_PATH+"/main.html";
const LOGIN_HTML = APP_PATH+"/login.html";
const LOGINRESULT_HTML = APP_PATH+"/loginresult.html";

export const APP_CONSTANTS = {
    FRONTEND, BACKEND, APP_PATH, APP_NAME, CONF_PATH, API_PATH,
    INDEX_HTML, MAIN_HTML, LOGIN_HTML, LOGINRESULT_HTML,

    DIALOGS_PATH: APP_PATH+"/dialogs",

    SESSION_NOTE_ID: "com_monkshu_ts",

    // Login constants
    MIN_PASS_LENGTH: 8,
    API_LOGIN: API_PATH+"/login",
    API_KLOUDUSTCMD: API_PATH+"/kloudustcmd",
    USERID: "userid",
    USERPW: "pw",
    MIN_PW_LENGTH: 10,
    TIMEOUT: 3600000,
    USERNAME: "username",
    USERORG: "userorg",
    USER_ROLE: "user",
    GUEST_ROLE: "guest",
    PERMISSIONS_MAP: {
        user:[window.location.origin, MAIN_HTML, LOGIN_HTML, LOGINRESULT_HTML, APP_PATH+$$.MONKSHU_CONSTANTS.ERROR_HTML], 
        guest:[window.location.origin, LOGIN_HTML, LOGINRESULT_HTML, $$.MONKSHU_CONSTANTS.ERROR_HTML]
    },
    API_KEYS: {"*":"fheiwu98237hjief8923ydewjidw834284hwqdnejwr79389"},
    KEY_HEADER: "X-API-Key"
}