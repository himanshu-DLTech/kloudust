/* 
 * (C) 2018 TekMonks. All rights reserved.
 * License: See enclosed license file.
 */
import {util} from "/framework/js/util.mjs";
import {monkshu_component} from "/framework/js/monkshu_component.mjs";

const COMPONENT_PATH = util.getModulePath(import.meta), INPUT_NODES = ["input", "select"];
let data ;
function elementConnected(host) {
	Object.defineProperty(host, "value", {get: _=>JSON.stringify(_getValue(host)), 
		set: value=>_setValue(JSON.parse(value), host)});
	const style = host.getAttribute("style")||"";
	const data = {style_start: "<style>", style_end: "</style>", style};
	load_balancer.setDataByHost(host, data);
}

function elementRendered(host) {
	const shadowRoot = load_balancer.getShadowRootByHost(host);
	_addFirstFirewallRuleRow(shadowRoot);
}

function addRow(callingRow,passedData) {
	const shadowRoot = load_balancer.getShadowRootByContainedElement(callingRow);
	const templateRow = shadowRoot.querySelector("template#rulesrowtemplate");
	const nodesToInject = templateRow.content.cloneNode(true);
	if (callingRow.nextSibling) callingRow.parentNode.insertBefore(nodesToInject, callingRow.nextSibling);
	else callingRow.parentNode.appendChild(nodesToInject);
	if(passedData){
		callingRow.querySelector('#ip').value = passedData.ip;
		callingRow.querySelector('#port').value = passedData.port;
	}
	console.debug(JSON.stringify(_getValue(load_balancer.getHostElementByContainedElement(callingRow))));
	data = _getValue(load_balancer.getHostElementByContainedElement(callingRow));
}

function removeRow(callingRow) {
	const shadowRoot = load_balancer.getShadowRootByContainedElement(callingRow);
	const rulesContainer = shadowRoot.querySelector("div#rulecontainer");
	callingRow.remove();
	const allRows = rulesContainer.querySelectorAll("span#rulesrow");
	if (!allRows.length) _addFirstFirewallRuleRow(shadowRoot);
	data = _getValue(load_balancer.getHostElementByContainedElement(callingRow));
}

function _getValue(host) {
	const shadowRoot = load_balancer.getShadowRootByHost(host);
	const rulesContainer = shadowRoot.querySelector("div#rulecontainer");
	const allRows = rulesContainer.querySelectorAll("span#rulesrow");
	const rules = []; for (const row of allRows) {
		const objectRow = {}; for (const childNode of row.childNodes) {
			if (INPUT_NODES.includes(childNode.nodeName.toLowerCase())) {
				if (childNode.value.trim() != '') objectRow[childNode.id] = childNode.value;
				else objectRow.skip = true;
			}
		}
		if (!objectRow.skip) rules.push(objectRow);
	}
	return rules;
}

function _setValue(rules, host) {
	const shadowRoot = load_balancer.getShadowRootByHost(host);
	const templateRow = shadowRoot.querySelector("template#rulesrowtemplate");
	const rulesContainer = shadowRoot.querySelector("div#rulecontainer");
	for (const rule of rules) {
		const nodesToInject = templateRow.content.cloneNode(true);
		for (const [key, value] of Object.entries(rule)) nodesToInject.querySelector(`#${key}`).value = value;
		rulesContainer.appendChild(nodesToInject);
	}
}

function _addFirstFirewallRuleRow(shadowRoot) {
	const templateRow = shadowRoot.querySelector("template#rulesrowtemplate");
	const nodesToInject = templateRow.content.cloneNode(true);
	const rulesContainer = shadowRoot.querySelector("div#rulecontainer");
	rulesContainer.appendChild(nodesToInject);
}

function values(){
	const rules = data.map(obj => Object.values(obj).join(",")).join("|");	
	return rules ;
}

function updateRow(callingRow) {
	data = _getValue(load_balancer.getHostElementByContainedElement(callingRow));
}

export const load_balancer = {trueWebComponentMode: true, elementConnected,values, elementRendered,_getValue, addRow, removeRow, updateRow}
monkshu_component.register("load-balancer", `${COMPONENT_PATH}/load-balancer.html`, load_balancer);