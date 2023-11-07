/* 
 * (C) 2018 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";
import {securityguard} from "/framework/js/securityguard.mjs";

let currTimeout; let logoutListeners = [];

function handleLoginResult(resp) {
    logoutListeners = [];   // reset listeners on sign in

    if (resp && resp.result) {
        session.set(APP_CONSTANTS.USERID, resp.id); 
        session.set(APP_CONSTANTS.USERNAME, resp.name);
        session.set(APP_CONSTANTS.USERORG, resp.org);
        securityguard.setCurrentRole(APP_CONSTANTS.USER_ROLE);
        startAutoLogoutTimer();
        router.loadPage(APP_CONSTANTS.MAIN_HTML);
    } else {LOG.error(`Login failed for ${id}`); router.loadPage(`${APP_CONSTANTS.LOGIN_HTML}?_error=true`);}
}

const addLogoutListener = listener => logoutListeners.push(listener);

async function logout() {
    for (const listener of logoutListeners) await listener();

    const savedLang = session.get($$.MONKSHU_CONSTANTS.LANG_ID);
    _stoptAutoLogoutTimer(); session.destroy(); 
    securityguard.setCurrentRole(APP_CONSTANTS.GUEST_ROLE);
    session.set($$.MONKSHU_CONSTANTS.LANG_ID, savedLang);
    
	router.doIndexNavigation();
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

export const loginmanager = {handleLoginResult, logout, startAutoLogoutTimer, addLogoutListener}