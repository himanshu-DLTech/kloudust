/**
 * Interprets and runs form.json files.
 *  
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
import {util} from "/framework/js/util.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta);

async function runForm(hostID) {

}

function close(elementOrHostID, mainDivID) {
	const shadowRoot = elementOrHostID instanceof Element ? dialog_box.getShadowRootByContainedElement(elementOrHostID): 
        dialog_box.getShadowRootByHostId(elementOrHostID);
    const mainElement = shadowRoot.querySelector(`div#${mainDivID}`); 
    while (mainElement && mainElement.firstChild) hostElement.removeChild(hostElement.firstChild);  // deletes everything
    mainElement.classList.remove("visible"); 
}

const trueWebComponentMode = true;	// making this false renders the component without using Shadow DOM
export const form_runner = {trueWebComponentMode, runForm, close};
monkshu_component.register("form-runner", `${COMPONENT_PATH}/form-runner.html`, form_runner);