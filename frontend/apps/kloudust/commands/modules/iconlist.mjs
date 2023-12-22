/**
 * Returns HTML for icon lists to be displayed
 * in a main area.
 * 
 * (C) 2023 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */

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
    color: #4C4C4C;
    background-color: #EBECEE;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

div#close {
    padding: 0.2em 0.6em;
    background-color: #BC5205;
    border-radius: 0.2em;
    margin: 1em;
    cursor: pointer;
    color: #EBECEE;
}

div#buttons {
	display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: left;
    margin-top: 2em;
    flex-wrap: wrap;
}
div#button {
	display: flex;
    flex-direction: column;
    align-items: center;
    width: 10em;
    cursor: pointer;
    justify-content: center;
    height: 7em;
    max-height: 7em;
    overflow: hidden;
    font-size: 0.9em;
    margin: 1.5em;
}
div#button img {width: 5em; height: 5em;}
div#button span {text-align: center;}
</style>
{{#style}}<style>{{{.}}}</style>{{/style}}

<div id="body">
<div id="close" onclick='event.stopPropagation(); monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.closeForm(this)'>X</div>

<div id="buttons">
{{#icons}}
<div id="button" onclick="window.monkshu_env.apps[APP_CONSTANTS.APP_NAME].iconlist.cmdClicked('{{id}}')">
    <img src="{{{logo}}}"><span>{{label}}</span>
</div>
{{/icons}}
</div>

</div>
`;

async function getHTML(formObject, cmdmanager) {
    const cmdlist = (await import(`${APP_CONSTANTS.LIB_PATH}/cmdlist.mjs`)).cmdlist;

    // plug ourselves into the enviornment if not present
    if (!monkshu_env.apps[APP_CONSTANTS.APP_NAME].iconlist) monkshu_env.apps[APP_CONSTANTS.APP_NAME].iconlist = iconlist;
    const commands = await cmdlist.getCommands(undefined, formObject); 
    for (const command of commands) cmdmanager.registerCommand(command);

    const html = await $$.librouter.expandPageData(HTML_TEMPLATE, undefined, {icons: commands, style: formObject.style});
    return html;
}

export const iconlist = {getHTML, cmdClicked: id => monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.cmdClicked(id)};