echo "This script sets up the data folder structure for MNP site."
echo "It also sets up required files, include some with sample data."

# Grab dependencies
if [ ! -d "node_modules" ]; then 
	echo "downloading dependencies using npm"
	npm i
fi

# Required Folders
if [ ! -d "data" ]; then 
	echo "creating folder: data"
	mkdir data
fi

if [ ! -d "data/ifpa" ]; then 
	echo "creating folder: data/ifpa"
	mkdir data/ifpa
fi

if [ ! -d "data/matches" ]; then 
	echo "creating folder: data/matches"
	mkdir data/matches
fi

if [ ! -d "data/players" ]; then 
	echo "creating folder: data/players"
	mkdir data/players
fi

if [ ! -d "data/posts" ]; then 
	echo "creating folder: data/posts"
	mkdir data/posts
fi

if [ ! -d "data/sessions" ]; then 
	echo "creating folder: data/sessions"
	mkdir data/sessions
fi

if [ ! -d "data/stats" ]; then 
	echo "creating folder: data/stats"
	mkdir data/stats
fi

if [ ! -d "uploads" ]; then 
	echo "creating folder: uploads"
	mkdir uploads
fi


# Required files
if [ ! -f "data/.shadows" ]; then
	echo "creating empty file: data/.shadows"
    touch data/.shadows
fi

if [ ! -f "data/.tokens" ]; then
	echo "creating empty file: data/.tokens"
    touch data/.tokens
fi

# Comma separated list of player ids that are
#{
#  LEAGUE_ADMINS: '123,234,456,789'
#}
if [ ! -f ".env" ]; then
	echo "creating sample file: .env"
	cat > .env <<- "EOF"
	LEAGUE_ADMINS=0,1
	CURRENT_SEASON=season-0
	EOF

	#Since we don't yet have a .env file, we won't have season-0 either.
	#So let's create it
	if [ ! -d "data/season-0" ]; then
		echo "creating sample season-0"
		mkdir data/season-0
	fi

	if [ ! -f "data/season-0/teams.csv" ]; then
		echo "creating sample season-0/teams.csv"
		cat > data/season-0/teams.csv <<- "EOF"
		NLT,OLF,Northern Lights,1,,,,,,,,,,,,,,,,,,
		SJK,FTB,Soda Jerks,1,,,,,,,,,,,,,,,,,,
		EOF
	fi

	if [ ! -f "data/season-0/season.json" ]; then
		echo "creating sample season-0/season.json"
		cat > data/season-0/season.json <<- "EOF"
		{
          "key": "season-13",
          "teams": {
            "SJK": {
              "key": "SJK",
              "venue": "FTB",
              "name": "Soda Jerks",
              "roster": [
                {
                  "name": "Allison McClure"
                },
                {
                  "name": "Ari Golding"
                },
                {
                  "name": "Austin Arlitt"
                },
                {
                  "name": "Bobby Conover"
                },
                {
                  "name": "Danny Rashid"
                },
                {
                  "name": "Garrick West"
                },
                {
                  "name": "Jarrett Gaddy"
                },
                {
                  "name": "John McAllister"
                },
                {
                  "name": "Matt Galbraith"
                },
                {
                  "name": "Raymond Davidson"
                }
              ],
              "schedule": [
                {
                  "match_key": "mnp-0-1-NLT-SJK",
                  "week": "1",
                  "date": "20200203",
                  "side": "vs",
                  "opp": {
                    "key": "NLT",
                    "name": "Northern Lights"
                  }
                }
              ],
              "division": 1,
              "captain": "Bobby Conover",
              "co_captain": "Raymond Davidson"
            },
            "NLT": {
              "key": "NLT",
              "venue": "OLF",
              "name": "Northern Lights",
              "roster": [
                {
                  "name": "Brett Wolfe"
                },
                {
                  "name": "Cameron Austgen"
                },
                {
                  "name": "Cory Lampe"
                },
                {
                  "name": "Evan Eckles"
                },
                {
                  "name": "Fabian Benabente"
                },
                {
                  "name": "James Thompson"
                },
                {
                  "name": "Jason Heitt"
                },
                {
                  "name": "Laura Minter"
                },
                {
                  "name": "Neil Kubath"
                },
                {
                  "name": "Taylor Minter"
                }
              ],
              "schedule": [
                {
                  "match_key": "mnp-0-1-NLT-SJK",
                  "week": "1",
                  "date": "20200203",
                  "side": "@",
                  "opp": {
                    "key": "SJK",
                    "name": "Soda Jerks"
                  }
                }
              ],
              "division": 1,
              "captain": "Brett Wolfe",
              "co_captain": "Taylor Minter"
            }
          },
          "weeks": [
            {
              "n": "1",
              "label": "WEEK 1",
              "code": "WK1",
              "isPlayoffs": false,
              "date": "02/03/2020",
              "matches": [
                {
                  "match_key": "mnp-0-1-NLT-SJK",
                  "away_key": "NLT",
                  "away_name": "Northern Lights",
                  "away_linked": true,
                  "home_key": "SJK",
                  "home_name": "Soda Jerks",
                  "home_linked": true,
                  "venue": {
                    "key": "FTB",
                    "name": "Full Tilt Ballard"
                  }
                }
              ]
            }
          ]
        }
		EOF
	fi
fi

# Comma separated file: {ipr},{player name}
if [ ! -f "data/IPR.csv" ]; then
	echo "creating sample file: data/IPR.csv"
	cat > data/IPR.csv <<- "EOF"
	1,Jason Isringhausen
	6,Harold Reynolds
	EOF
fi


# JSON Venues
if [ ! -f "data/venues.json" ]; then
	echo "creating sample file: data/venues.json"
	cat > data/venues.json <<- "EOF"
	{
		"FTB": {
    		"name": "Full Tilt Ballard",
    		"machines": [
      			"Indy500",
      			"IronMan",
      			"Jackbot"
			    ],
    		"key": "FTB",
    		"address": "5453 Leary Ave NW, Seattle",
    		"neighborhood": "Ballard"
  		},
		"OLF": {
    		"name": "Olaf's",
    		"machines": [
      			"BOP2",
      			"BSD",
      			"BlackHole"
      			],
    		"key": "OLF",
    		"address": "6301 24th Ave NW, Seattle",
    		"neighborhood": "Ballard"
  		}
	}
	EOF
fi




# JSON Machines
#if [ ! -f "data/machines.json" ]; then
#	echo "creating sample file: data/machines.json"
#	cat > data/machines.json <<- "EOF"
#	{
#		"BOP2":{"key":"BOP2","name":"Bride of Pinbot 2.0"},
#		"BSD":{"key":"BSD","name":"Bram Stoker's Dracula"},
#		"BlackHole":{"key":"BlackHole","name":"Black Hole"},
#		"Indy500":{"key":"Indy500","name":"Indianapolis 500"},
#		"IronMan":{"key":"IronMan","name":"Iron Man"},
#		"Skindy":{"key":"Skindy","name":"Stern Indiana Jones"},
#		"Jackbot":{"key":"Jackbot","name":"Jackbot"}
#	}
#	EOF
#fi










