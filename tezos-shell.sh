#!/bin/bash
cp /dev/stdin /home/admin/tezos-docker/data/test_input.js

echo "const { testerOriginate, testerDeploy } = require('./testDeploy.js');" > /home/admin/tezos-docker/data/test.js
cat /home/admin/tezos-docker/data/test_input.js >> /home/admin/tezos-docker/data/test.js
sed -i 's/originate(/testerDeploy(/g' /home/admin/tezos-docker/data/test.js
sed -i 's/deploy(/testerDeploy(/g' /home/admin/tezos-docker/data/test.js

docker exec tezos completium-cli log enable > /dev/null

echo "" > /home/admin/tezos-docker/data/runner_output.json

rm /home/admin/tezos-docker/data/contracts/* 2>/dev/null

FILES=()
for FILE in "$@"
do
  FILENAME=`basename "$FILE"`
  EXT=`echo "$FILENAME" | cut -d '.' -f 2`
  if [ "$EXT" = "arl" ]
  then
    cat "$FILE" | tr -d '\015' > /home/admin/tezos-docker/data/contracts/"$FILENAME"
  elif [ "$EXT" = "tz" ]
  then
    cat "$FILE" | tr -d '\015' > /home/admin/tezos-docker/data/contracts/"$FILENAME"
  else
    cp "$FILE" /home/admin/tezos-docker/data/contracts/"$FILENAME"
  fi
  FILES+=("$FILENAME")
done



# echo "{}" > /home/admin/tezos-docker/data/metadata.json

# if [ "$EXT" = "arl" ]
# then
#   echo "" > /home/admin/tezos-docker/data/contract.arl
#   cat "$1" | tr -d '\015' > /home/admin/tezos-docker/data/contract.arl
# else
#   echo "" > /home/admin/tezos-docker/data/contract.tz
#   cat "$1" | tr -d '\015' > /home/admin/tezos-docker/data/contract.tz
# fi

# if [ -n "$2" ]
# then
#   cat "$2" > /home/admin/tezos-docker/data/metadata.json
# fi

#docker exec tezos node /home/gitpod/data/run_test.js contract.$EXT metadata.json > /dev/null
docker exec tezos node /home/gitpod/data/run_test.js "${FILES[@]}" > /dev/null
#docker exec tezos completium-cli log dump
cat /home/admin/tezos-docker/data/runner_output.json
docker exec tezos completium-cli log clear --force > /dev/null

exit 0
