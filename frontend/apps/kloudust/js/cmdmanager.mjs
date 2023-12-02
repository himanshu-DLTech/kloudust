/**
 * Handles Kloudust UI commands. Registers and runs them.
 *  
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {i18n} from "/framework/js/i18n.mjs";
import {session} from "/framework/js/session.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

const REGISTERED_COMMANDS = {}, KLOUDUST_CMDLINE = "kloudust_cmdline", FRONTEND_MODULE = "frontend_module",
    ALERT_OBJECT_KEY = "__com_tekmonks_kloudust_frontend_alerts";

/**
 * Registers the given command object.
 * @param {Object} cmdObject Command object
 * @throws Error if the same object is already registered
 */
function registerCommand(cmdObject) {
    if (REGISTERED_COMMANDS[cmdObject.id]) {LOG.warn(`Command ${cmdObject.id} is already registered.`); return;}
    REGISTERED_COMMANDS[cmdObject.id] = cmdObject;

    // plug ourselves into the enviornment if not present
    if (!monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager) monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager = cmdmanager;
}

/**
 * Handles command clicked event
 * @param {string} id The ID of the command clicked 
 * @returns The command output
 */
async function cmdClicked(id) {
    const command = REGISTERED_COMMANDS[id]; if (!command) {LOG.error(`Commands ${id} not found.`); return;}

    try {
        const formJSON = await $$.requireJSON(`${APP_CONSTANTS.FORMS_PATH}/${id}.form.json`);
        const html = await _getFormHTML(formJSON);
        monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.showContent(html, true);
    } catch (err) {LOG.error(`Error loading command files for ${id}: ${err}`); return;}
}

function closeForm() {
    monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.hideOpenContent();    // close the form
}

async function formSubmitted(id, values) {
    monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.hideOpenContent();    // close the form

    const form = await $$.requireJSON(`${APP_CONSTANTS.FORMS_PATH}/${id}.form.json`); 
    if (form.type != KLOUDUST_CMDLINE) return;  // no need to call backend in this case

    let command = form.command;
    const cmdLineMap = form.kloudust_cmdline_params;
    for (const param of cmdLineMap) command += " "+('"'+values[param]+'"'||'""');
    _processCommandOutput(`Running command - ${command}`, false, true);
    const cmdResult = await apiman.rest(APP_CONSTANTS.API_KLOUDUSTCMD, "POST", {cmd: command}, true);
    if (cmdResult?.result) {
        _processCommandOutput(`Success. Command output follows.`);
        _processCommandOutput(cmdResult.out); _processCommandOutput(cmdResult.err); 
        _processCommandOutput(`Exit code: ${cmdResult.exitcode}`);
    } else _processCommandOutput(`Command Failed. ${command}. ${cmdResult?.err?"Error was\n"+cmdResult.err:""}`, true);
}

function addAlert(text, isError) {
    const formattedAlert = `[${isError?"ERROR":"INFO"}] ${text}`;
    const alertObject = session.get(ALERT_OBJECT_KEY, []);
    alertObject.push(formattedAlert);
    session.set(ALERT_OBJECT_KEY, alertObject);
}

function getAlerts() {
    const alertObject = session.get(ALERT_OBJECT_KEY, []);
    return [...alertObject];
}

function _processCommandOutput(text, isError=false, firstLineOfNewCommand=false) {
    if (firstLineOfNewCommand) addAlert("\n\n-----------------------------------------------------");
    if (isError) addAlert(text, true);
    else addAlert(text);
}

async function _getFormHTML(formJSON) {
    let html = "";

    if (formJSON.type == KLOUDUST_CMDLINE) {
        const uriencodedFormJSON = encodeURIComponent(JSON.stringify(formJSON.form)), id = formJSON.id;
        if (formJSON.i18n) for (const [lang, i18nObject] of Object.entries(formJSON.i18n)) await i18n.setI18NObject(lang, i18nObject);

        html = `<form-runner id="${id}" form='decodeURIComponent(${uriencodedFormJSON})'
            onclose='monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.hideOpenContent()'
            onsubmit='monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.formSubmitted("${id}", formdata)'></form-runner>`;
    }
    
    if (formJSON.type == FRONTEND_MODULE) {
        const formModule = await import(`${APP_CONSTANTS.FORM_MODULES_PATH}/${formJSON.id}.mjs`);
        html = await formModule[formJSON.id].getHTML(formJSON, cmdmanager);
    }

    return html;
}

export const cmdmanager = {registerCommand, cmdClicked, formSubmitted, closeForm, addAlert, getAlerts};