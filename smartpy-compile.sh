#!/bin/bash
TMPDIR="`/usr/bin/mktemp -d`"
FILENAME="`basename "$1"`"
/tezos/smartpy-new/smartpy test "$1" "$TMPDIR" > "$TMPDIR/smartpy.log"
if [ $(find "$TMPDIR" -name *_contract.tz | wc -l) -lt 1 ]
then
    >&2 echo "No contract was able to be compiled from the SmartPy source."
    >&2 echo ""
    sed "s/$FILENAME/submission.py/g" "$TMPDIR/smartpy.log" | sed 's/\/tezos\/smartpy-cli\///g' >&2
    exit 1
fi
if [ "$(md5sum `find "$TMPDIR" -name *_contract.tz` | awk '{print $1}' | sort | uniq | wc -l)" -gt 1 ]
then
    >&2 echo "Warning : multiple contracts present in test, only the first one will be used."
fi

( echo "{" ; 
  cat "`find "$TMPDIR" -name *_contract.tz | head -n 1`" | sed 's/^/  /g' ;
  echo "";
  echo "}" ) > "$2"

/usr/bin/nodejs /tezos/smartpy-metadata.js "`find "$TMPDIR" -name *_contract.json | head -n 1`" "`find "$TMPDIR" -name *_storage.json | head -n 1`" "$3" > /tmp/last_smartpy-metadata

#rm -rf "$TMPDIR" >/dev/null 2>/dev/null

exit 0
