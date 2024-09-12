#!/usr/bin/env python3

import sys

def main():
    for f in sys.argv[1:]:
        if f.endswith('.json'):
            print(f, end=' ')
            continue
        curName = f.split('/')[-1].rsplit('.', 1)[0]
        curNameDefault = True
        contractLines = {}
        contractLines[curName] = []
        for l in open(f, 'r'):
            if l.startswith('### contract:'):
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
        with open('/tezos/exec/%s.tz' % name, 'w') as f:
            if ''.join(contractLines[name]).strip() == '':
                continue
            for l in contractLines[name]:
                f.write(l)
        print('/tezos/exec/%s.tz ' % name, end='')
    print()

if __name__ == '__main__':
    main()