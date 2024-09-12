#!/usr/bin/env python3

import sys


def main():
    for f in sys.argv[1:]:
        curName = f.split('/')[-1].rsplit('.', 1)[0]
        curNameDefault = True
        contractLines = {}
        contractLines[curName] = []
        for l in open(f, 'r'):
            if l.strip().startswith('archetype '):
                newName = l.strip().split(' ')[1]
                if curNameDefault:
                    contractLines[newName] = contractLines[curName]
                    del contractLines[curName]
                    curNameDefault = False
                else:
                    contractLines[newName] = []
                curName = newName
            contractLines[curName].append(l)
    for name in contractLines:
        with open('/tezos/exec/%s.arl' % name, 'w') as f:
            if ''.join(contractLines[name]).strip() == '':
                continue
            for l in contractLines[name]:
                f.write(l)
        print('/tezos/exec/%s.arl ' % name, end='')
    print()


if __name__ == '__main__':
    main()
