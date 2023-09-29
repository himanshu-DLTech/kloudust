/* 
 * (C) 2020 TekMonks. All rights reserved.
 * License: MIT - see enclosed license.txt file.
 */
import {i18n} from "/framework/js/i18n.mjs";
import {loginmanager} from "./loginmanager.mjs";
import {session} from "/framework/js/session.mjs";
import {apimanager as apiman} from "/framework/js/apimanager.mjs";

async function changePassword(_element) {
    monkshu_env.components['dialog-box'].showDialog(`${APP_CONSTANTS.DIALOGS_PATH}/changepass.html`, true, true, {}, "dialog", ["p1","p2"], async result=>{
        const done = await loginmanager.changepassword(session.get(APP_CONSTANTS.USERID), result.p1);
        if (!done) monkshu_env.components['dialog-box'].error("dialog", 
            await i18n.get("PWCHANGEFAILED", session.get($$.MONKSHU_CONSTANTS.LANG_ID)));
        else monkshu_env.components['dialog-box'].hideDialog("dialog");
    });
}

async function showOTPQRCode(_element) {
    const id = session.get(APP_CONSTANTS.USERID).toString(); const title = await i18n.get("Title", session.get($$.MONKSHU_CONSTANTS.LANG_ID));
    const qrcode = await apiman.rest(APP_CONSTANTS.API_GETQRCODE, "GET", {id, provider: title}, true, false); if (!qrcode || !qrcode.result) return;
    monkshu_env.components['dialog-box'].showDialog(`${APP_CONSTANTS.DIALOGS_PATH}/changephone.html`, true, true, {img:qrcode.img}, "dialog", ["otpcode"], async result=>{
        const otpValidates = await apiman.rest(APP_CONSTANTS.API_VALIDATE_TOTP, "GET", {totpsec: qrcode.totpsec, otp:result.otpcode, id}, true, false);
        if (!otpValidates||!otpValidates.result) monkshu_env.components['dialog-box'].error("dialog", 
            await i18n.get("PHONECHANGEFAILED", session.get($$.MONKSHU_CONSTANTS.LANG_ID)));
        else monkshu_env.components['dialog-box'].hideDialog("dialog");
    });
}

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

export const main = {changePassword, showOTPQRCode, registerHost, newVM, newKDS, vmOp, run};