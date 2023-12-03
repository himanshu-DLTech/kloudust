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

function handleLoginResult(fetchResponse) {
    logoutListeners = [];   // reset listeners on sign in

    const apiURL = fetchResponse.url, headers = fetchResponse.headers, jsonResponseObject = fetchResponse.response;
    if (jsonResponseObject && jsonResponseObject.result) {
        apiman.addJWTToken(apiURL, headers, jsonResponseObject);
        session.set(APP_CONSTANTS.USERID, jsonResponseObject.id); 
        session.set(APP_CONSTANTS.USERNAME, jsonResponseObject.name);
        session.set(APP_CONSTANTS.USERORG, jsonResponseObject.org);
        session.set(APP_CONSTANTS.LOGGEDIN_USEROLE, jsonResponseObject.role);
        session.set(APP_CONSTANTS.ACTIVE_PROJECT, APP_CONSTANTS.DEFAULT_PROJECT);
        securityguard.setCurrentRole(APP_CONSTANTS.USER_ROLE);  // we only have user and guest at this level 
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