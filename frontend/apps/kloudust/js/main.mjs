/**
 * Post login main page support. 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */
import {session} from "/framework/js/session.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

function registerHost() {
    _runKloudustCommand(`${APP_CONSTANTS.DIALOGS_PATH}/registerhost.html`, 
        ["hostname","password","hostkey"],"addHost centos8 {{{hostname}}} root {{{password}}} {{{hostkey}}}");
}

function newVM() {
    _runKloudustCommand(`${APP_CONSTANTS.DIALOGS_PATH}/newvm.html`, 
        ["hostname", "vmname", "vmdescription", "cores", "memory", "disk", "image", "imagetype"],
        "createVM {{{hostname}}} {{{vmname}}} \\\"{{{vmdescription}}}\\\" {{{cores}}} {{{memory}}} {{{disk}}} {{{image}}} {{{imagetype}}}");
}

function newKDS() {
    _runKloudustCommand(`${APP_CONSTANTS.DIALOGS_PATH}/newkds.html`, 
        ["hostname", "vmname", "vmdescription", "cores", "memory"],
        "createKDS {{{hostname}}} {{{vmname}}} \\\"{{{vmdescription}}}\\\" {{{cores}}} {{{memory}}}");
}

function vmOp() {
    _runKloudustCommand(`${APP_CONSTANTS.DIALOGS_PATH}/vmop.html`, 
        ["vmname", "vmop", "deleteVM"],
        "{{^deleteVM}}powerOpVm {{{vmname}}} {{{vmop}}}{{/deleteVM}}{{#deleteVM}}deleteVM {{{vmname}}}{{/deleteVM}}");
}

const run = _ => _runKloudustCommand(`${APP_CONSTANTS.DIALOGS_PATH}/run.html`, ["run"], "{{{run}}}");

function _runKloudustCommand(template, values, command) {
    monkshu_env.components['dialog-box'].showDialog(template, true, true, {}, "dialog", values, async result=>{
        monkshu_env.components['dialog-box'].hideDialog("dialog");
        if (!Mustache) await $$.require("/framework/3p/mustache.min.js");
        const cmd = ["-u", session.get(APP_CONSTANTS.USERID), "-p", session.get(APP_CONSTANTS.USERPW),
            "-e", Mustache.render(command, result)];
        _outputLog(`Running command - ${cmd}`, true);
        const cmdResult = await apiman.rest(APP_CONSTANTS.API_KLOUDUSTCMD, "POST", {cmd}, true, false);
        if (cmdResult) {_outputLog(cmdResult.stdout); _outputLog(cmdResult.stderr); _outputLog(`Success! Exit code: ${cmdResult.exitCode}`);}
        else _outputLog(`Failed!`);
    });
}

function _outputLog(text, addPartition) {
    const consoleOut = document.querySelector("div#output > div#console");
    if (addPartition && consoleOut.innerHTML.trim() != "") consoleOut.innerHTML = consoleOut.innerHTML + "<br>\n<br>\n";

    const linebreakEscapedText = text.trim().replace(/(?:\r\n|\r|\n)/g, '<br>');
    if (text && text.trim != "") {
        _expandOutput(); consoleOut.innerHTML = consoleOut.innerHTML.trim() != "" ?
            consoleOut.innerHTML + "<br>\n" + linebreakEscapedText : linebreakEscapedText;
    }
}

function _expandOutput() {
    document.querySelector("span#uparrow").click();
}

export const main = {registerHost, newVM, newKDS, vmOp, run};