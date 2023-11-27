/**
 * Handles logins. 
 * (C) 2018 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";
import {securityguard} from "/framework/js/securityguard.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

let currTimeout; let logoutListeners = [];

function handleLoginResult(resp) {
    logoutListeners = [];   // reset listeners on sign in

    if (resp && resp.result) {
        session.set(APP_CONSTANTS.USERID, resp.id); 
        session.set(APP_CONSTANTS.USERNAME, resp.name);
        session.set(APP_CONSTANTS.USERORG, resp.org);
        securityguard.setCurrentRole(APP_CONSTANTS.USER_ROLE);
        if (!APP_CONSTANTS.INSECURE_DEVELOPMENT_MODE) startAutoLogoutTimer();   
        router.loadPage(APP_CONSTANTS.MAIN_HTML);
    } else {LOG.error(`Login failed.`); router.loadPage(`${APP_CONSTANTS.LOGIN_HTML}?_error=true`);}
}

const addLogoutListener = listener => logoutListeners.push(listener);

async function logout() {
    for (const listener of logoutListeners) await listener();

    const savedLang = session.get($$.MONKSHU_CONSTANTS.LANG_ID);
    _stopAutoLogoutTimer(); session.destroy(); 
    securityguard.setCurrentRole(APP_CONSTANTS.GUEST_ROLE);
    session.set($$.MONKSHU_CONSTANTS.LANG_ID, savedLang);
    
	router.doIndexNavigation();
}

const interceptPageLoadData = _ => {
    router.addOnLoadPageData(APP_CONSTANTS.LOGIN_HTML, async (data, _url) => {
	    data.LOGIN_API_KEY = apiman.getAPIKeyFor(`${APP_CONSTANTS.API_PATH}}/login`); });
    router.addOnLoadPageData(APP_CONSTANTS.LOGINRESULT_HTML, async (data, _url) => {
        data.LOGIN_API_KEY = apiman.getAPIKeyFor(`${APP_CONSTANTS.API_PATH}}/login`); });
}

function startAutoLogoutTimer() {
    router.addOnLoadPage(startAutoLogoutTimer);

    if (!session.get(APP_CONSTANTS.USERID)) return; // not logged in
    
    const events = ["load", "mousemove", "mousedown", "click", "scroll", "keypress"];
    const resetTimer = _=> {_stopAutoLogoutTimer(); currTimeout = setTimeout(_=>logout(), APP_CONSTANTS.TIMEOUT);}
    for (const event of events) {document.addEventListener(event, resetTimer);}
    resetTimer();   // start the timing
}

function _stopAutoLogoutTimer() {
    if (currTimeout) {clearTimeout(currTimeout); currTimeout = null;}
}

export const loginmanager = {handleLoginResult, logout, startAutoLogoutTimer, addLogoutListener, interceptPageLoadData}