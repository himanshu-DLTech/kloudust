/**
 * Tests the custom testcases mention in the custom_configurtion.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */
const fs = require('fs');
const path = require("path");
const fspromises = fs.promises;
const mustache = require("mustache");
const customfile = "custom.json";
const GEN_REPORT_PREFIX = "output";

exports.runTestsAsync = async function(argv) {
	if ((!argv[0]) || (argv[0].toLowerCase() != "custom")) {
		LOG.console(`Skipping custom test case, not called.\n`);
		return;
	}

	LOG.console("------------------Custom Test Case--------------------\n");
	const fileContent = await fspromises.readFile(`${_toUnixPath(__dirname)}/conf/${customfile}`,"utf8");	
	const renderedContent = mustache.render(fileContent,{ "assetspath": `${_toUnixPath(__dirname)}/assets` });
	const customTestcases = JSON.parse(renderedContent);
	
	let testResults = []; for (const testcase of customTestcases) {
		const module = require(`${__dirname}/${_getModuleName(testcase.commandName)}`);
        testcase.params.unshift(testcase.commandName);
        testResults.push(await module.runTestsAsync(testcase.params));
	}

	const genDirName = argv[2], genFileName = argv[1];
    _generateCSVReport(genDirName, genFileName, testResults, customTestcases);
	LOG.console("-------------------------------------------------------\n");
	return true;
}

const _getModuleName = (testName) => `test_${testName}.js`;

const _generateCSVReport = (genDirName, genFileName, results, customTestcases) => {
	try{
		const csvHeades = `S.no, Test Case, Status\n`; // csv Formate : S.no | Test case | Status
		let csvRows = []; for (const [i, testcase] of customTestcases.entries()) {
			csvRows.push(`${i+1}, ${_escapeCommas(testcase["description"]||"")}, ${results[i]}`); }
		const csvData = csvHeades + csvRows.join('\n');
		const  dirName = genDirName || __dirname, fileName = genFileName || `${GEN_REPORT_PREFIX}_${Date.now()}.csv`;
		fs.writeFileSync(`${dirName}/${fileName}`, csvData); LOG.console(`**Report Generated**\n`);
	} catch(err) { LOG.console(`**Report Generation Failed**\n${err}\nResults: ${results}\n`); }
}

const _escapeCommas = (value) => `"${value.replace(/"/g, '""')}"`;
const _toUnixPath = pathIn => pathIn.split(path.sep).join(path.posix.sep);