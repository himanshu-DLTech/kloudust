/**
 * Post login main page support. 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */

import {i18n} from "/framework/js/i18n.mjs";
import {util} from "/framework/js/util.mjs";
import {router} from "/framework/js/router.mjs";
import {session} from "/framework/js/session.mjs";
import {cmdmanager as cmdman} from "./cmdmanager.mjs";

const LEFTBAR_COMMANDS = `${APP_CONSTANTS.COMMANDS_PATH}/main_leftbar.json`, 
    MAIN_COMMANDS = `${APP_CONSTANTS.COMMANDS_PATH}/main_content.json`;

let _hostingDiv, _initialContentTemplate;

/**
 * Registers the hosting DIV which will host all content
 * @param {element} div The hosting DIV
 * @param {element} initialContentTemplate HTML5 template element hosting initial content
 */
function registerHostingDivAndInitialContentTemplate(div, initialContentTemplate) {
    _hostingDiv = div; _initialContentTemplate = initialContentTemplate;
}

/**
 * Shows the given content. Must be either HTML string or
 * a DOM subtree of nodes. If no content given then same as 
 * hiding and going back to home content.
 * @param {string|Object} contentNode The content to show
 */
function showContent(contentNode) { 
    if (!_hostingDiv) {LOG.error(`Asked to show content but no hosting DIV is registered`); return;}
    util.removeAllChildElements(_hostingDiv); 
    const content = contentNode ? (typeof contentNode === "string" ? _getHTMLNodesToInsert(contentNode) : contentNode) : 
        _initialContentTemplate.content.cloneNode(true);
    _hostingDiv.appendChild(content);
}

/** Plugs in our data interceptor which loads initial main and leftbar contents */
const interceptPageLoadData = _ => router.addOnLoadPageData(APP_CONSTANTS.MAIN_HTML, async (data, _url) => {
    const mustache = await router.getMustache(), mainPageData = {};
    mainPageData.welcomeHeading = mustache.render(await i18n.get("WelcomeHeading"), {user: session.get(APP_CONSTANTS.USERNAME)});
	mainPageData.leftbarCommands = await $$.requireJSON(LEFTBAR_COMMANDS); 
    mainPageData.mainCommands = await $$.requireJSON(MAIN_COMMANDS);
    data.mainPageData = mainPageData;

    for (const cmd of [...mainPageData.leftbarCommands, ...mainPageData.mainCommands]) try{
        cmdman.registerCommand(cmd); } catch (err) {LOG.error(`Error registering command ${cmd.id}.`);}
});

function _getHTMLNodesToInsert(htmlContent) {
    const wrapper = document.createElement("div"); wrapper.innerHTML = htmlContent;
    const docFragment = document.createDocumentFragment(); 
    for (const childNode of wrapper.childNodes) docFragment.appendChild(childNode);
    return docFragment;
}

export const main = {interceptPageLoadData, registerHostingDivAndInitialContentTemplate, showContent,
    cmdClicked: (_element, id) => cmdman.cmdClicked(id), hideOpenContent: showContent};