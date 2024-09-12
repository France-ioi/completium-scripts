const { exec, execSync } = require('child_process');
//import { exec, execSync } from 'child_process';
const fs = require('fs');
//import { fs } from 'fs';
const { contractsData } = require('./testDeploy.js');
//import { contractsData } from './testDeploy.js';

const test = require('./test.js');

var resultObject = {};

function postTest() {
    fs.writeFileSync('/home/gitpod/data/runner_output.json', JSON.stringify(resultObject, 0, 2));
    exec("completium-cli log dump", (_e, stdout, _s) => {
        try {
            resultObject.log = JSON.parse(stdout).log;
        } catch (e) { resultObject.log = []; }
        fs.writeFileSync('/home/gitpod/data/runner_output.json', JSON.stringify(resultObject, 0, 2));
    });
}

exec("completium-cli version", (_e, stdout, _s) => {
    try {
        resultObject.version = stdout.toString().trim();
    } catch (e) { }
});


global.metadata = contractsData.metadata;

resultObject.success = false;
resultObject.error = { 'type': 'test', 'message': 'Task test failed. Please contact the task writer to fix it.' };
fs.writeFileSync('/home/gitpod/data/runner_output.json', JSON.stringify(resultObject, 0, 2));
test().then(() => {
    resultObject.success = true;
    resultObject.metadata = contractsData.metadata;
    resultObject.error = undefined;
    postTest();
}).catch(function (err) {
    resultObject.success = false;
    resultObject.metadata = contractsData.metadata;
    if (err.type == 'DeployError') {
        resultObject.error = {
            'type': 'deploy',
            'message': err.message,
            'contract_name': err.contract_name
        };
        // check if err.message contains "missing_type_conversion"
        if (err.message.includes("missing_type_conversion")) {
            resultObject.error.message = "The typing of your contract is incomplete (for instance, a function parameter has no implied type)."
        }
    } else if (err.type == 'StorageError') {
        resultObject.error = {
            'type': 'storage',
            'message': err.message,
            'contract_name': err.contract_name
        };
    } else if (err.constructor.name === 'String') {
        resultObject.error = {
            'type': 'completium',
            'message': err
        };
        if (err.startsWith('Error visit_micheline: ')) {
            try {
                const errData = JSON.parse(err.substr(23));
                const varName = errData.annots[0].substr(1);
                const varType = errData.prim ? ' of type ' + errData.prim : '';
                if (varName) {
                    resultObject.error.message = 'Unable to initialize contract storage for variable \'' + varName + '\'' + varType + '. This usually means that your contract storage doesn\'t contain the variables expected by the task.';
                }
            } catch (e) { }
        }
    } else if (err.code == 'ERR_ASSERTION') {
        resultObject.error = {
            'type': 'assert',
            'message': err.message
        };
    } else if (err.message == 'Typecheck error' && err.data && err.type) {
        resultObject.error = {
            'type': 'typecheck',
            'message': 'Error while calling the contract entrypoint :\nThe contract entrypoint is expecting a parameter of type "' + err.type + '" instead of "' + err.data + '".'
        };
    } else {
        resultObject.error = {
            'type': 'generic',
            'message': err.message || (err.toString ? err.toString() : 'Unknown error')
        };
    }
    postTest();
});
