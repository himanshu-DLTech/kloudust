/**
 * Returns HTML for the cloud alerts
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
    flex-direction: column;
    align-items: flex-end;
}

div#close {
    padding: 0.2em 0.6em;
    background-color: #BC5205;
    border-radius: 0.2em;
    margin: 1em;
    cursor: pointer;
}

div#main {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
    max-height: 100%;
}

div#alertdiv {
    padding: 1em;
    box-sizing: border-box;
}
div#main div#alertdiv:nth-child(odd) {background-color: #858585;}
div#main div#alertdiv:first-child{border-top: 1px solid #ffffff;}
div#main div#alertdiv:last-child{border-bottom: 1px solid #ffffff;}
span#alert {
    width: 100%;
    font-family: monospace;
}
</style>

<div id="body">
<div id="close" onclick='event.stopPropagation(); monkshu_env.apps[APP_CONSTANTS.APP_NAME].cmdmanager.closeForm(this)'>X</div>

<div id="main">
{{^alerts}}<div id="alertdiv"><span id="alert">No alerts.</span></div>{{/alerts}}
{{#alerts}}<div id="alertdiv"><span id="alert">{{.}}</span></div>{{/alerts}}
</div>

</div>
`;

async function getHTML(_formJSON, cmdmanager) {
    const html = router.expandPageData(HTML_TEMPLATE, undefined, {alerts: cmdmanager.getAlerts()});
    return html;
} 

export const alerts = {getHTML};