#!/bin/bash

export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

# TODO: It might be nice to get up to date on node version.
nvm use 6

LOG=/home/mnp/main/data/cronlog/pre-week.log

echo "Running Pre week:" `date` >> $LOG

cd /home/mnp/data-archive
git checkout master
git pull origin master

# TODO Find a way to make the script not season hard coded.
cp season-12/playerdb.csv ../main/data/season-12/playerdb.csv

cd /home/mnp/main

# TODO: Consider a git pull for main.

# Refresh the season.json
# TODO season 12 is hard coded in the import season script.
node importers/import-season.js

node util/spawn-matches.js

sh scripts/restart.sh
