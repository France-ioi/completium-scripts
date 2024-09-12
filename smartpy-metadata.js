const fs = require('fs');

if(process.argv.length < 5) {
    throw new Error('Not enough arguments.');
}

const contract_json = JSON.parse(fs.readFileSync(process.argv[2]));
const storage_json = JSON.parse(fs.readFileSync(process.argv[3]));
const metadata_path = process.argv[4];

let metadata = {};

metadata.storage = storage_json;

metadata.parameters = [];
let contract_storage = null;
contract_json.forEach(x => {
    if(x.prim == 'storage') { contract_storage = x.args[0]; }
});

if(contract_storage) {
    while(contract_storage) {
        console.log(contract_storage);
        if(contract_storage.prim == 'pair') {
            metadata.parameters.push(contract_storage.args[0].annots[0].slice(1));
            contract_storage = contract_storage.args[1];
        } else if(contract_storage.annots) {
            metadata.parameters.push(contract_storage.annots[0].slice(1));
            contract_storage = null;
        } else {
            metadata.parameters.push('__default__');
            contract_storage = null;
        }
    }
}

fs.writeFileSync(metadata_path, JSON.stringify(metadata, 0, 2));

console.log(metadata);
console.log(metadata_path);
