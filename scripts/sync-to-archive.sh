SEASON=`node util/get-current-season-key.js`
TODAY=`date "+%Y-%m-%d"`

# TODO: Perhaps we should establish a DATA_HOME env var, but for
#  now, we assume that data-archive is a sibling directory.

cp data/matches/* ../data-archive/$SEASON/matches/
cp data/venues.json ../data-archive/$SEASON/venues.json
cp data/machines.json ../data-archive/$SEASON/machines.json

# TODO: Sync rosters back to the archive

cd ../data-archive

# NOTE: Before the first run, create the sync branch
# If you don't, it will commit to master, which is no good at all,
# at least for now. Eventually, we may want to commit directly to
# master and make a push. If it can fast forward, then it should
# be ok to do.

git checkout sync
git add .
git commit -m "$SEASON $TODAY"
git push origin sync
