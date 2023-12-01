/**
 * Handles Kloudust UI commands. Registers and runs them.
 *  
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {i18n} from "/framework/js/i18n.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

const REGISTERED_COMMANDS = {}, KLOUDUST_CMDLINE = "kloudust_cmdline";

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
        const formJSON = await $$.requireJSON(`${APP_CONSTANTS.FORMS_PATH}/${id}.form.json`), 
            uriencodedFormJSON = encodeURIComponent(JSON.stringify(formJSON.form));
        if (formJSON.i18n) for (const [lang, i18nObject] of Object.entries(formJSON.i18n)) await i18n.setI18NObject(lang, i18nObject);
        const html = `<form-runner id="${id}" form='decodeURIComponent(${uriencodedFormJSON})'
            onclose='monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.hideOpenContent()'
            onsubmit='monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.formSubmitted("${id}", formdata)'></form-runner>`;
        monkshu_env.apps[APP_CONSTANTS.APP_NAME].main.showContent(html);
    } catch (err) {LOG.error(`Error loading command files for ${id}: ${err}`); return;}
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
    if (cmdResult?.result) {_processCommandOutput(cmdResult.out); _processCommandOutput(cmdResult.err); _processCommandOutput(`Success! Exit code: ${cmdResult.exitcode}`);}
    else _processCommandOutput(`Command Failed. ${command}. ${cmdResult?.err?"Error was\n"+cmdResult.err:""}`, true);
}

function _processCommandOutput(text, isError=false, firstLineOfNewCommand=false) {
    if (firstLineOfNewCommand) console.info("\n\n-----------------------------------------------------");
    if (isError) console.error(text);
    else console.info(text);
}

export const cmdmanager = {registerCommand, cmdClicked, formSubmitted};