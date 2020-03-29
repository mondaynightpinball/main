#!/bin/bash

# Example crontab lines, in UTC
#39 22	* * 1	root	sh /home/mnp/main/scripts/pre-week.sh
#35 11	* * 2	root	sh /home/mnp/main/scripts/post-week.sh

# The NVM part is usually in .bashrc, but cron was having
# some issues sourcing it.
# TODO: Have mnp account setup and use nvm. We can use a su mnp to start.
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

# TODO: It might be nice to get up to date on node version.
nvm use 6

LOG=/home/mnp/main/data/cronlog/post-week.log

echo "Running post week:" `date` >> $LOG
cd /home/mnp/main
# echo `pwd` >> $LOG
# echo "node:" `node -v` >> $LOG

# Check to see what kind of logging we might want to do with these.
# However, they can log on their own, so no need to pipe their output.
node util/compute-stats.js
node util/summarize-weeks.js

sh scripts/restart.sh

sh scripts/sync-to-archive.sh

# TODO: Scan for weird machines and players -> send report
# TODO: Automated recaps and highlights?
