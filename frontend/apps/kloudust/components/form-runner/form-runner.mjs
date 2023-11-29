/**
 * Interprets and runs form.json files. Renders the
 * UI for the form. This component is a form UI generator
 * basically.
 *  
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {util} from "/framework/js/util.mjs";
import {router} from "/framework/js/router.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta);

async function elementConnected(host) {
    const formData = await form_runner.getAttrValue(host, "form");
    const expandedData = await router.expandPageData(formData);
    const formObject = JSON.parse(expandedData);
    form_runner.setDataByHost(host, formObject);
}
async function close(element) {
    const onclose = await form_runner.getAttrValue(form_runner.getHostElement(element), "onclose");
    if (onclose && onclose.trim() != "") new Function(onclose)();
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM
export const form_runner = {trueWebComponentMode, elementConnected, close};
monkshu_component.register("form-runner", `${COMPONENT_PATH}/form-runner.html`, form_runner);