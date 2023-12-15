/**
 * Handles Kloudust UI commands. Registers and runs them.
 *  
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {session} from "/framework/js/session.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

const REGISTERED_COMMANDS = {}, KLOUDUST_CMDLINE = "kloudust_cmdline", FRONTEND_MODULE = "frontend_module",
    ALERT_OBJECT_KEY = "__com_tekmonks_kloudust_frontend_alerts", ALERT_ERROR = "error", ALERT_INFO = "info",
    RAW_COMMANDLINE_COMMAND = "RAW_COMMANDLINE";

/**
 * Registers the given command object.
 * @param {Object} cmdObject Command object
 */
function registerCommand(cmdObject) {
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
        const formJSON = await $$.requireJSON(`${APP_CONSTANTS.FORMS_PATH}/${id}.form.json`, APP_CONSTANTS.INSECURE_DEVELOPMENT_MODE?true:undefined);
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

    let command = form.command == RAW_COMMANDLINE_COMMAND?"":form.command;
    const cmdLineMap = form.kloudust_cmdline_params;
    for (const param of cmdLineMap) command += form.command == RAW_COMMANDLINE_COMMAND?values[param]+" ":" "+('"'+values[param]+'"'||'""');
    command = command.trim();
    
    const project = session.get(APP_CONSTANTS.ACTIVE_PROJECT, APP_CONSTANTS.DEFAULT_PROJECT);
    _processCommandOutput(`Running command for project ${project} - ${command}`, false, true);
    const cmdResult = await apiman.rest(APP_CONSTANTS.API_KLOUDUSTCMD, "POST", {cmd: command, project}, true);
    if (cmdResult?.result) {
        _processCommandOutput(`Success. Command output follows.`);
        if ((cmdResult.out||"").trim() != "") _processCommandOutput(cmdResult.out); 
        if ((cmdResult.err||"").trim() != "") _processCommandOutput(cmdResult.err); 
        _processCommandOutput(`Exit code: ${cmdResult.exitcode}`);
    } else _processCommandOutput(`Command Failed for project ${project} - ${command}${cmdResult?.err?". Error was\n"+cmdResult.err:""}`, true);
}

function addAlert(text, isError) {
    const formattedAlert = {type: isError?ALERT_ERROR:ALERT_INFO, message: text};
    const alertObject = session.get(ALERT_OBJECT_KEY, []);
    alertObject.push(formattedAlert);
    session.set(ALERT_OBJECT_KEY, alertObject);
}

function getAlerts() {
    const alertObject = session.get(ALERT_OBJECT_KEY, []);
    return [...alertObject];
}

function _processCommandOutput(text, isError=false, firstLineOfNewCommand=false) {
    if (isError) addAlert(text, true);
    else addAlert(text);
}

async function _getFormHTML(formJSON) {
    let html = "";

    if (formJSON.type == KLOUDUST_CMDLINE) {
        const base64FormJSON = util.stringToBase64(JSON.stringify(formJSON.form)), id = formJSON.id;
        if (formJSON.i18n) for (const [lang, i18nObject] of Object.entries(formJSON.i18n)) await i18n.setI18NObject(lang, i18nObject);

        html = `<form-runner id="${id}" data-form='${base64FormJSON}'
            onclose='monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.hideOpenContent()'
            onsubmit='monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.formSubmitted("${id}", formdata)'></form-runner>`;
    }
    
    if (formJSON.type == FRONTEND_MODULE) {
        const formModule = await import(`${APP_CONSTANTS.FORM_MODULES_PATH}/${formJSON.command}.mjs`);
        html = await formModule[formJSON.command].getHTML(formJSON, cmdmanager);
    }

    return html;
}

export const cmdmanager = {registerCommand, cmdClicked, formSubmitted, closeForm, addAlert, getAlerts, 
    ALERT_ERROR, ALERT_INFO};