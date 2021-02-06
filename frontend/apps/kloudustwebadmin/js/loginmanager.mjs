/* 
 * (C) 2018 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {application} from "./application.mjs";
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";
import {securityguard} from "/framework/js/securityguard.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

let currTimeout; let logoutListeners = [];

async function signin(id, pass, otp) {
    logoutListeners = [];   // reset listeners on sign in
        
    const resp = await apiman.rest(APP_CONSTANTS.API_LOGIN, "POST", {id, pass, otp}, false, true);
    if (resp && resp.result) {
        session.set(APP_CONSTANTS.USERID, resp.id); 
        session.set(APP_CONSTANTS.USERPW, pass);
        session.set(APP_CONSTANTS.USERNAME, resp.name);
        session.set(APP_CONSTANTS.USERORG, resp.org);
        securityguard.setCurrentRole(APP_CONSTANTS.USER_ROLE);
        startAutoLogoutTimer();
        return true;
    } else {LOG.error(`Login failed for ${id}`); return false;}
}

async function register(name, id, pass, org, totpSecret, totpCode) {
    const req = {name, id, pass, org, totpSecret, totpCode}; 
    const resp = await apiman.rest(APP_CONSTANTS.API_REGISTER, "POST", req, false, true);
    if (resp && resp.result) {
        session.set(APP_CONSTANTS.USERID, id); 
        session.set(APP_CONSTANTS.USERPW, pass);
        session.set(APP_CONSTANTS.USERNAME, name);
        session.set(APP_CONSTANTS.USERORG, org);
        securityguard.setCurrentRole(APP_CONSTANTS.USER_ROLE);
        startAutoLogoutTimer();
        return true;
    } else {LOG.error(`Registration failed for ${id}`); return false;}
}

async function changepassword(id, pass) {
    const req = {id, pass, oldpass: session.get(APP_CONSTANTS.USERPW)};
    const resp = await apiman.rest(APP_CONSTANTS.API_CHANGEPW, "POST", req, true, false);
    if (resp && resp.result) {session.set(APP_CONSTANTS.USERPW, pass); return true;}
    else {LOG.error(`Password change failed for ${id}`); return(false);}
}

const addLogoutListener = listener => logoutListeners.push(listener);

async function logout() {
    for (const listener of logoutListeners) await listener();

    const savedLang = session.get($$.MONKSHU_CONSTANTS.LANG_ID);
    _stoptAutoLogoutTimer(); session.destroy(); 
    securityguard.setCurrentRole(APP_CONSTANTS.GUEST_ROLE);
    session.set($$.MONKSHU_CONSTANTS.LANG_ID, savedLang);
	application.main();
}

function startAutoLogoutTimer() {
    router.addOnLoadPage(startAutoLogoutTimer);

    if (!session.get(APP_CONSTANTS.USERID)) return; // not logged in
    
    const events = ["load", "mousemove", "mousedown", "click", "scroll", "keypress"];
    const resetTimer = _=> {_stoptAutoLogoutTimer(); currTimeout = setTimeout(_=>logout(), APP_CONSTANTS.TIMEOUT);}
    for (const event of events) {document.addEventListener(event, resetTimer);}
    resetTimer();   // start the timing
}

function _stoptAutoLogoutTimer() {
    if (currTimeout) {clearTimeout(currTimeout); currTimeout = null;}
}

export const loginmanager = {signin, register, logout, changepassword, startAutoLogoutTimer, addLogoutListener}