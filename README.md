# Monday Night Pinball

## Summary

As of January 23rd, 2018, the MNP main codebase is now open source, under Gnu Public License (GPL).
Visit the live site at: [https://www.mondaynightpinball.com](https://www.mondaynightpinball.com)

## Easy Installation

On a fresh machine, this is the minimum to allow the MNP web site to run.

### Clone / Install dependencies / Setup minimal files and folders:

This assumes Node.js is installed - which is beyond the scope of these installation steps.

If no data folders exist, setupMNPFolders.sh will create them and populate with a minimal
sample 'season-0' with a single match.

```
git clone https://github.com/mondaynightpinball/main.git
source ./setupMNPFolders.sh
node http.js
```

To change the season, you can either edit the .env file (in the root project folder - created by
setupMNPFolders.sh.  Alternately, you can specify a different CURRENT_SEASON environment variable
on the command line.

```
CURRENT_SEASON=season-13 node http.js
```


## Manual Installation

### Clone and Install the dependencies:

```
git clone https://github.com/mondaynightpinball/main.git
npm i
```

### Setup necessary data paths (TODO: Make a setup script)
```
# Run from project home
mkdir data
mkdir data/ifpa
mkdir data/matches
mkdir data/players
mkdir data/sessions
mkdir data/stats

# As a backup and log of events, we save all non-auth posts to a directory.
mkdir data/posts

# All image data is currently just saved on the server.
# TODO: Save image data to a scalable storage service like AWS/S3
mkdir uploads

# You need season-# directories for any season you want to load.
# See model/seasons.js
mkdir data/season-8
```

## Config files

The code needs a few files setup to get things going.

### Data Archive

Many of the config files that were used for seasons 6, 7, and 8
are available, as well as all the match data, schedule, and rosters.

Visit the [data archive](https://github.com/mondaynightpinball/data-archive)

TODO: It would be awesome to have the code just point to a DATA_HOME .env var. Then people could clone the data archive and point the server code at it (until a better solution becomes available).

### Venues

`data/venues.json` has the form:
```
{
  "ABC": {
    "name": "ABC Venue",
    "machines": [ array_of_machine_keys ],
    "key": "ABC",
    "address": "[Optional] 123 Fake St, Springfield, WA",
    "neighborhood", "[Optional] Neighborhood"
  },
  ...
}
```

### Machines

`data/machines.json` defines all the machines that are available to
be used in a match. People can still enter machines that are not on
this list (much to our dismay), but this is the source for machine keys and names.

```
{
  "MachineKey": {
    "key": "MachineKey",
    "name": "Machine Name"
  },
  ...
}
```

TODO: Probably don't need to include the key in the machine object, and we could probably also just store a map of key -> name.

### Ifpa

`data/ifpa_num.csv` is in the form of:

```
player_name,ifpa_num
...
```

Where the `ifpa_num` is the player's official IFPA number.
See [IFPA Player Search](https://www.ifpapinball.com/players/find.php)

### Season files

In each of the `data/season-{n}` directories, you need the following files:

`matches.csv` defines the schedule and should have the following columns:
```
week_num,date,away_key,home_key,venue_key
```

A special note that playoff weeks are denoted as `week_num = 90 + playoff_week`, so the first week of playoffs is week 91.

`teams.csv` defines teams and has columns:
```
team_key,venue_key,team_name
```

`playerdb.csv` is the master roster file and has columns:
```
player_lookup,player_name,team_key,role_on_team
```

`player_lookup` has most recently been `player_name.trim().toLowerCase()`.

TODO: It would be much better to have unique keys for every player.

### Gmail settings

Currently, there may be an issue that if you don't have a gmail OAuth token, you might run into issues when you start the server.

TODO: Add more details/resources on how to setup the gmail token.

### SSL settings

If you want to run a secure server, you will need to setup a certificate file.
`.credentials/https.opts.mnp.json`
TODO: Add more details/resources on how to setup the certificate.

## League Operation

### Importing a season

Once you have all the season files above setup, you need to run the script that parses all the CSV files and generates a `season.json` (currently written to standard out, so I send that to a file on the command line).

```
node importers/import-season > data/season-{n}/season.json
```

### Generating a week of matches

The system doesn't filter which matches are visible, so it is usually advised to generate matches a few hours before they start.

This is one of the areas of the site that could be very much improved once we move to a proper database. That project exists and has a fair amount of test coverage. The goal is to integrate that backend code with this full stack project to replace the `model`s.

[Proposed New MNP Backend](https://github.com/mondaynightpinball/server)

### Generating stats

Eventually stats would likely be real time, but for now we run a script to generate player stats.

```
node run util/compute-stats
```

### Starting the server

To get things running, you can run one of the following commands:
```
# Start just HTTP (you will need to have sudo/root access)
node http.js

# Start just in HTTPS (you will need to have sudo/root
# as well as the necessary certificate config)
node https.js

# Start the service on both 80 and 443, with a redirect to 443
# This is what the website uses (after some service wrapping).
node app.js
```

If you are interested in how to wrap up the app to run as a service, we use `forever` and `forever-service`, both npm modules and not too hard to setup.
However, we don't feel like this is the best long term solution.
There are more solutions, and layers like `nginx` that can help clean up our solution.

## Contributing

We very much want developers to be able to help make the MNP site more reliable, secure, beautiful, and responsive. Feel free to submit PRs, and check out our [issues](https://github.com/mondaynightpinball/main/issues).
