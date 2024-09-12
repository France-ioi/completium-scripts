#!/usr/bin/env python3

import subprocess, sys

def main():
    if len(sys.argv) < 3:
        print('No source files specified.', file=sys.stderr)
        sys.exit(1)

    extension = 'mligo' if sys.argv[1] == 'cameligo' else 'jsligo'
    for f in sys.argv[2:]:
        curName = f.split('/')[-1].rsplit('.', 1)[0]
        curNameDefault = True
        contractLines = {}
        contractLines[curName] = []
        for l in open(f, 'r'):
            if l.startswith('// contract:'):
                newName = l.split(':')[1].rsplit('.', 1)[0].strip()
                if curNameDefault:
                    contractLines[newName] = contractLines[curName]
                    curNameDefault = False
                    del contractLines[curName]
                else:
                    contractLines[newName] = []
                curName = newName
            contractLines[curName].append(l)
    for name in contractLines:
        with open('/tezos/exec/%s.%s' % (name, extension), 'w') as f:
            if ''.join(contractLines[name]).strip() == '':
                continue
            for l in contractLines[name]:
                f.write(l)
        comp = subprocess.run(['/usr/local/bin/ligo', 'compile', 'contract', '--no-color', '-o', '/tezos/exec/%s.tz' % name, '/tezos/exec/%s.%s' % (name, extension)], capture_output=True)
        if comp.returncode != 0:
            print('Error compiling %s:' % name, file=sys.stderr)
            print(comp.stderr.decode('utf-8'), file=sys.stderr)
            sys.exit(1)
        print('/tezos/exec/%s.tz ' % name, end='')
    print()

if __name__ == '__main__':
    main()