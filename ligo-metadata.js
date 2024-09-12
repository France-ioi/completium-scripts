const fs = require('fs');
const { spawnSync } = require('child_process');


if(process.argv.length < 4) {
    throw new Error('Not enough arguments.');
}

const ligo_path = process.argv[2];
const metadata_path = process.argv[3];

let metadata = {};

const ligo_str = fs.readFileSync(ligo_path).toString().split("\n")[0];

if(ligo_str.substr(0, 2) == '//') {
    const proc = spawnSync("/usr/local/bin/ligo", ['compile', 'storage', ligo_path, ligo_str.substr(2)]);
    metadata.storageMicheline = proc.stdout;
}

fs.writeFileSync(metadata_path, JSON.stringify(metadata, 0, 2));
