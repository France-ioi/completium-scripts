const { deploy, originate, exprMichelineToJson, jsonMichelineToExpr } = require('@completium/completium-cli');
const archetype = require('@completium/archetype');
const { argv } = require('process');
const codec = require('@taquito/michel-codec');
const fs = require('fs');

let contracts_data = {
    contracts: [],
    contracts_requested: [],
    isArchetype: null,
    metadata: {}
};

class DeployError extends Error {
    constructor(message, contract_name) {
        super(message);
        this.type = "DeployError";
        this.contract_name = contract_name;
    }
}

class StorageError extends Error {
    constructor(message, contract_name) {
        super(message);
        this.type = "StorageError";
        this.contract_name = contract_name;
        this.message = message;
    }
}

function removePrefix(str) {
    return str.startsWith("%") ? str.substring(1) : str
}

function checkMichelineType(cobj, iobj) {
    if (cobj.prim == 'pair') {
        if (iobj.prim != 'pair') {
            return false
        }
        return checkMichelineType(cobj.args[0], iobj.args[0]) && checkMichelineType(cobj.args[1], iobj.args[1]);
    } else if (cobj.prim == 'string') {
        return iobj.string != undefined;
    } else if (cobj.prim == 'nat' || cobj.prim == 'int') {
        return iobj.int != undefined;
    }
    return true;
}

function checkMicheline(obj, init, contract_name) {
    if (obj.annots && obj.annots.length > 0) {
        const annot = removePrefix(obj.annots[0]);
        const obj_annot = init[annot]
        if (obj_annot) {
            const json_annot = exprMichelineToJson(obj_annot);
            if (!checkMichelineType(obj, json_annot)) {
                throw new StorageError("Variable " + annot + " has wrong type " + jsonMichelineToExpr(obj) + " for initial storage " + obj_annot + ".", contract_name);
            }
            return [annot];
        }
        throw new StorageError("Unexpected variable " + annot + " in storage.", contract_name);
    }
    if (obj.prim == 'pair') {
        return obj.args.map(x => checkMicheline(x, init)).flat();
    }
    throw new StorageError("The contract storage is missing annotations. Multiples values are expected in the storage, but this type has no annotation: " + jsonMichelineToExpr(obj) + ".", contract_name);
}

async function checkContractStorage(contract, opts) {
    if (!opts.init && !opts.init_obj_mich) return;

    let code;
    if (contracts_data.isArchetype) {
        code = await archetype.compile(getFullPath(contract));
    } else {
        code = fs.readFileSync(getFullPath(contract));
    }
    const m_code = (new codec.Parser()).parseScript(code.toString());
    const obj_storage = m_code.find(x => x.prim === "storage");
    const storageType = obj_storage.args[0];

    if (opts.init) {
        exprMichelineToJson(opts.init);
        if (!checkMichelineType(storageType, exprMichelineToJson(opts.init))) {
            throw new StorageError("Initial storage has wrong type " + jsonMichelineToExpr(storageType) + " for initial storage " + opts.init + ".", contract);
        }
    } else if (opts.init_obj_mich) {
        const annots = checkMicheline(storageType, opts.init_obj_mich, contract);
        for(key in opts.init_obj_mich) {
            if(!annots.includes(key)) {
                throw new StorageError("Variable " + key + " missing from storage.", contract);
            }
        }
    }
}

function getFullPath(path) {
    return '/home/gitpod/data/contracts/' + path;
}

function processArgv() {
    if (argv.length < 3) {
        throw new Error('Missing contract path.');
    }

    for (var i = 2; i < argv.length; i++) {
        let contractPath = argv[i];
        if (contracts_data.contracts.includes(contractPath)) {
            continue;
        }
        if (contractPath.endsWith('.json')) {
            try {
                contracts_data.metadata = JSON.parse(fs.readFileSync(getFullPath(contractPath), { encoding: 'utf8', flag: 'r' }));
            } catch (e) { }
        } else if (contractPath.endsWith('.arl')) {
            if (contracts_data.isArchetype === false) {
                throw new Error('Cannot deploy both Archetype and Michelson contracts.');
            }
            contracts_data.isArchetype = true;
            contracts_data.contracts.push(contractPath);
        } else if (contractPath.endsWith('.tz')) {
            if (contracts_data.isArchetype === true) {
                throw new Error('Cannot deploy both Archetype and Michelson contracts.');
            }
            contracts_data.isArchetype = false;
            contracts_data.contracts.push(contractPath);
        } else {
            throw new Error('Unknown contract type for ' + contractPath + '.');
        }
    }
}
processArgv();

function processOpts(opts) {
    if (!opts || !global.metadata) { return opts; }

    if (global.metadata.parameters && opts.init_obj_mich) {
        for (var param in opts.init_obj_mich) {
            if (!global.metadata.parameters.includes(param)) {
                throw new Error('Contract storage is missing the required variable `' + param + '`.');
            }
        }
    }

    return opts;
}

async function testerDeploy(path, opts) {
    const name = path.split('/').pop().split('.')[0].toLowerCase();
    let contract = contracts_data.contracts.find(c => c.split('.')[0].toLowerCase() == name);
    const is_new = !contracts_data.contracts_requested.includes(name);
    if (!contract) {
        if (contracts_data.contracts.length == 1 && (!is_new || contracts_data.contracts_requested.length == 0)) {
            contract = contracts_data.contracts[0];
        } else {
            throw new Error('Contract ' + name + ' not found. Contracts : ' + contracts_data.contracts.join(', '));
        }
    }
    if (is_new) {
        contracts_data.contracts_requested.push(name);
    }
    //const processed_opts = processOpts(opts);
    await checkContractStorage(contract, opts);

    const prom = contracts_data.isArchetype ? deploy(getFullPath(contract), opts) : originate(getFullPath(contract), opts);
    try {
        return await prom;
    } catch (err) {
        throw new DeployError(err.toString(), contract);
    }
}

module.exports = {
    contractsData: contracts_data,
    testerDeploy: testerDeploy,
    testerOriginate: testerDeploy
};
