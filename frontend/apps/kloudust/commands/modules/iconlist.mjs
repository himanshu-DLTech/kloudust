/**
 * Returns HTML for icon lists to be displayed
 * in a main area.
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */

import {router} from "/framework/js/router.mjs";

const HTML_TEMPLATE = `
<style>
::-webkit-scrollbar {
    width: 0.5em !important;
    height: 0.5em !important;
    scroll-behavior: smooth !important;
}
::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3) !important;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3) !important;
    margin: 5em;
    border-radius: 1em !important;
}
::-webkit-scrollbar-thumb {
    background-color: darkgrey !important;
    border-radius: 1em !important;
    background-clip: padding-box;
}

body {height: 100%; margin: 0;}

div#body {
    overflow: hidden;
    max-height: 100%;
    box-sizing: border-box;
    color: #DCDCDC;
    background-color: #4C4C4C;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
}

div#button {
    padding: 0.2em 0.6em;
    background-color: #BC5205;
    border-radius: 0.2em;
    margin: 1em;
    cursor: pointer;
}
</style>

<div id="body">

<div id="buttons">
{{#icons}}
<div id="button" onclick="window.monkshu_env.apps[APP_CONSTANTS.APP_NAME].iconlist.cmdClicked('{{id}}')">
    <img src="{{{logo}}}"><span>{{label}}</span>
</div>
{{/icons}}
</div>

</div>
`;

async function getHTML(formObject) {
    // plug ourselves into the enviornment if not present
    if (!monkshu_env.apps[APP_CONSTANTS.APP_NAME].iconlist) monkshu_env.apps[APP_CONSTANTS.APP_NAME].iconlist = iconlist;
    const icons = await cmdlist.getCommands(formObject); 

    const html = router.expandPageData(HTML_TEMPLATE, undefined, {icons});
    return html;
}

export const iconlist = {getHTML, cmdClicked: id => monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.cmdClicked(id)};