/**
 * Processes command lists
 * 
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

import {i18n} from "/framework/js/i18n.mjs";
import {router} from "/framework/js/router.mjs";
import {rolemanager as roleman} from "./rolemanager.mjs";


async function getCommands(listFileLocation) {
    const listJSON = await $$.requireText(listFileLocation), listObject = JSON.parse(listJSON), 
        mustache = await router.getMustache(), i18nObject = {i18n: listObject.i18n?.[i18n.getSessionLang()]||{}};
    const expandedListJSON = mustache.render(listJSON, i18nObject), expandedListObject = JSON.parse(expandedListJSON);
    const cmdList = await roleman.filterRoleList(expandedListObject.rolelist);
    return cmdList;
}

export const cmdlist = {getCommands}