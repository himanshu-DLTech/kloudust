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

const COMPONENT_PATH = util.getModulePath(import.meta), INPUT_ELEMENTS = ["input", "select", "textarea"];

async function elementConnected(host) {
    const formData = util.base64ToString(host.dataset.form);
    const expandedData = await router.expandPageData(formData);
    let formObject = JSON.parse(expandedData);
    if (formObject.optional_fields) formObject.showOptional = true;
    formObject = await _runOnLoadJavascript(formObject);
    form_runner.setDataByHost(host, formObject);
}

async function close(element) {
    const onclose = await form_runner.getAttrValue(form_runner.getHostElement(element), "onclose");
    if (onclose && onclose.trim() != "") new Function(onclose)();
}

async function formSubmitted(element) {
    const shadowRoot = form_runner.getShadowRootByContainedElement(element);
    const allFormElements = []; for (const inputElement of INPUT_ELEMENTS) allFormElements.push(...shadowRoot.querySelectorAll(inputElement));
    for (const input of allFormElements) if ((input.dataset.optional?.toLowerCase() != "true") && (!input.checkValidity())) {
        LOG.error(`Submit failed due to failed validation of ${input.id} whose value is ${input.type != "password" ? input.value.trim() != "" ? input.value : "empty value" : "***********" }`);
        input.reportValidity(); return false;
    }

    const retObject = {}; for (const formElement of allFormElements) 
        retObject[formElement.id] = (formElement.type != "password" ? formElement.value.trim() : formElement.value);
    const onsubmit = await form_runner.getAttrValue(form_runner.getHostElement(element), "onsubmit");
    if (onsubmit && onsubmit.trim() != "") {
        const form = form_runner.getDataByContainedElement(element);
        await _runOnSubmitJavascript(retObject, form);

        const functionCode = `const formdata = ${JSON.stringify(retObject)}; ${onsubmit}`;
        new Function(functionCode)();
    }
}

async function _runOnSubmitJavascript(retObject, form) {
    if (!form.submit_javascript) return;

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const submit_js_result = await (new AsyncFunction(form.submit_javascript))(retObject);
    if (!submit_js_result) {
        LOG.error(`Submit failed due to failed on submit javascript`);
        return false;
    }
}

async function _runOnLoadJavascript(form) {
    if (!form.load_javascript) return form;
    const onloadjs = (Array.isArray(taformbledef.load_javascript)?form.load_javascript:[form.load_javascript]).join("\n");

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const load_js_result = await (new AsyncFunction(onloadjs))(form);
    if (!load_js_result) {
        LOG.error(`Form load JS failed`);
        return form;
    } else return load_js_result;
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM
export const form_runner = {trueWebComponentMode, elementConnected, close, formSubmitted};
monkshu_component.register("form-runner", `${COMPONENT_PATH}/form-runner.html`, form_runner);