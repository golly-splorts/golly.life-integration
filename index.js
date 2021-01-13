(function () {

  var LandingPage = {

    // http://localhost:8989/endpoint
    // ^^^^^^^^^^^^^^^^^^^^^
    //      baseApiUrl
    // http://localhost:8000/landing.html
    // ^^^^^^^^^^^^^^^^^^^^^
    //      baseUIUrl
    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    loadingElem : null,

    landingDivIds : [
      'container-mode0009',
      'container-mode1019',
      'container-mode21',
      'container-mode22',
      'container-mode23',
      'container-mode31',
      'container-mode32',
      'container-mode33',
      'container-mode40plus'
    ],

    init : function() {

      this.loading();

      // Load a game from the /game API endpoint
      let url = this.baseApiUrl + '/mode';
      fetch(url)
      .then(res => res.json())
      .then((modeApiResult) => {

        var mode = modeApiResult.mode;
        var start = modeApiResult.start;

        if (mode < 0) {
          this.error(mode);
        } else if (mode < 10) {
          this.mode0009(mode, start);
        } else if (mode < 20) {
          this.mode1019(mode);
        } else if (mode < 30) {
          this.mode2029(mode, start);
        } else if (mode < 40) {
          this.mode3039(mode);
        } else {
          this.mode40plus(mode);
        }
      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      });
      // Done loading game from /game API endpoint
    },

    /**
     * Handle the case of an error, tell the user something is wrong
     */
    error : function(mode) {

      // Hide elements
      this.loadingElem.classList.add('invisible');
      for (var c in this.landingDivIds) {
        try {
          var elem = document.getElementById(this.landingDivIds[c]);
          elem.classList.add('invisible');
        } catch (e) {
          // do nothing
        }
      }

      // Show error 
      var container = document.getElementById('container-error');
      container.classList.remove("invisible");

    },

    /**
     * Show the site loading message while waiting for the API response
     */
    loading : function() {
      this.loadingElem = document.getElementById('container-loading');
      this.loadingElem.classList.remove('invisible');
    },

    /**
     * Given a container div id, remove all other container divs
     */
    filterContainers : function(saveid) {
      var ix = this.landingDivIds.indexOf(saveid);
      if (ix<0) {
        this.error(-1);
      }
      var i;
      for (i=0; i<this.landingDivIds.length; i++) {
        if (i!=ix) {
          // Remove every div except the one with specified id
          try {
            var elem = document.getElementById(this.landingDivIds[i]);
            elem.parentNode.removeChild(elem);
          } catch (e) {
          }
        }
      }
      var container = document.getElementById(saveid);
      container.classList.remove("invisible");
      return container
    },

    /**
     * Function called if site is in mode 0-9 (pre-season)
     */
    mode0009 : function(mode, countdownStart) {
      var container = this.filterContainers('container-mode0009');
      this.updateSeasonHeader();
      this.updateCountdownClock(countdownStart);
      this.loadingElem.classList.add('invisible');
      this.minilife();
    },

    /**
     * Function called if site is in mode 10-19 (season underway)
     */
    mode1019 : function(mode) {
      var container = this.filterContainers('container-mode1019');
      this.updateSeasonHeader();
      this.updateSeedTable();
      this.populateSeasonGames(mode, container);
    },

    /**
     * Function called if site is in mode 20-29 (waiting for postseason)
     */
    mode2029 : function(mode, countdownStart) {

      // Handle special cases
      var container;
      if (mode==21) {
        container = this.filterContainers('container-mode21');
      } else if (mode==22) {
        container = this.filterContainers('container-mode22');
      } else if (mode==23) {
        container = this.filterContainers('container-mode23');
      } else {
        this.error(-1);
      }
      this.updateSeasonHeader();
      this.updateCountdownClock(countdownStart);
      this.updateSeedTable();
      this.populatePostseasonWaiting(mode, container);

    },

    /**
     * Function called if site is in mode 30-39 (postseason underway)
     */
    mode3039 : function(mode) {

      // Handle special cases
      var container;
      if (mode==31) {
        container = this.filterContainers('container-mode31');
      } else if (mode==32) {
        container = this.filterContainers('container-mode32');
      } else if (mode==33) {
        container = this.filterContainers('container-mode33');
      } else {
        this.error(-1);
      }
      this.updateSeasonHeader();
      this.updateSeedTable();
      this.populatePostseasonOngoing(mode, container);

    },

    /**
     * Function called if site is in mode 40+ (season and postseason over)
     */
    mode40plus : function(mode) {
      container = this.filterContainers('container-mode40plus');
      this.updateSeasonHeader();
      this.loadingElem.classList.add('invisible');
      this.updateChampions();
      this.minilife();
    },

    /**
     * Update the "Season X" or "Season X Day Y" header with information
     * from the API /today endpoint.
     */
    updateSeasonHeader : function() {

      var seasonHeadTitle = document.getElementById('landing-header-season').parentNode;
      seasonHeadTitle.classList.add('invisible');

      // get current day/season info from API /today
      let url = this.baseApiUrl + '/today';
      fetch(url)
      .then(res => res.json())
      .then((apiResult) => {

        var season;
        if (apiResult[0]==-1) {
          season = 1;
        } else {
          var season = apiResult[0] + 1;
        }

        var day = apiResult[1] + 1;

        // get element by id "landing-header-season" and change innerHTML to current season
        var seasonHead = document.getElementById('landing-header-season');
        if (seasonHead != null) {
          seasonHead.innerHTML = season;
        }

        // get element by id "landing-header-day", if it exists, and change innerHTML to curr day
        var dayHead = document.getElementById('landing-header-day');
        if (dayHead != null) {
          dayHead.innerHTML = day;
        }
        
        seasonHeadTitle.classList.remove('invisible');

      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      });
    },

    updateCountdownClock : function(countdownSeconds) {
      var unixStart = Math.floor(Date.now() / 1000) + countdownSeconds;
      var flipdown = new FlipDown(unixStart, {
        headings: ["D", "H", "M", "S"],
      }).start();
    },

    /**
     * Use the seed table template to add a postseason seed table to the
     * container elem, and populate it with information from the API /seed endpoint.
     */
    updateSeedTable : function() {

      // Load the leagues and seeds from the API /seeds endpoint
      let url = this.baseApiUrl + '/seeds';
      fetch(url)
      .then(res => res.json())
      .then((seedsApiResult) => {

        this.loadingElem.classList.add('invisible');

        var seedtables = document.getElementsByClassName("seed-table");
        var template = document.getElementById('seed-table-template');
        var clone = template.content.cloneNode(true);

        // Create each div on the page
        var s;
        for (s = 0; s < seedtables.length; s++) {
          seedTableElem = seedtables[s];
          seedTableElem.appendChild(clone);
        }

        // Assemble a sorted list of leagues
        var leaguesSet = new Set();
        Object.keys(seedsApiResult).forEach(function(key) {
          leaguesSet.add(key);
        });
        var leagues = Array.from(leaguesSet);
        leagues.sort();

        // Load team win/loss records from the API /records endpoint
        let recordsUrl = this.baseApiUrl + '/records';
        fetch(recordsUrl)
        .then(res => res.json())
        .then((recordsApiResult) => {

          // Loop over each league, populate league headers and seeds
          for (s = 0; s < seedtables.length; s++) {
            seedTableElem = seedtables[s];
            var l;
            for (l = 0; l < leagues.length; l++) {
              // Populate league headers
              var lp1 = l+1;
              var leagueHead = document.getElementById('seed-table-league-'+lp1+'-name');
              var leagueName = leagues[l];
              var leagueSeeds = seedsApiResult[leagueName];
              leagueHead.innerHTML = leagueName;

              // Populate seeds with the team name and win-loss record
              var seed;
              for (seed = 0; seed < leagueSeeds.length; seed++) {
                var seedp1 = seed + 1;

                var seedTeamName, seedTeamRecord, seedTeamRecordStr;
                var nameElemId, nameElem;
                var recordElemId, recordElem;

                seedTeamName = leagueSeeds[seed];
                // assume the team name exists as a key, add check later
                seedTeamRecord = recordsApiResult[seedTeamName];
                seedTeamRecordStr = "(" + seedTeamRecord[0] + "-" + seedTeamRecord[1] + ")";

                nameElemId = 'league-'+lp1+'-seed-'+seedp1;
                nameElem = document.getElementById(nameElemId);

                recordElemId = nameElemId + '-record';
                recordElem = document.getElementById(recordElemId);

                nameElem.innerHTML = seedTeamName;
                recordElem.innerHTML = seedTeamRecordStr;

              } // end each seed team loop
            } // end leagues loop
          } // end loop over each seed table
        })
        .catch(err => {
          console.log(err);
          this.error(-1);
        }); // end /records endpoint

      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end /seeds api call

    },

    /**
     * Populate the champion information on the season-is-over page
     * using information from the API /champion endpoint.
     */
    updateChampions : function() {
      var champs = document.getElementById('champion-team');
      var champsIcon = document.getElementById('champion-icon');

      // get current champion from API
      let url = this.baseApiUrl + '/champion';
      fetch(url)
      .then(res => res.json())
      .then((apiResult) => {

        if (apiResult.hasOwnProperty('champion')) {
          champs.innerHTML = apiResult.champion;
          champs.style.color = apiResult.color;

          if (apiResult.hasOwnProperty('abbr')) {

            var iconSize = "200";
            var iconId = "champion-icon";
            var icontainerId = "champion-icon-container";
            var icontainer = document.getElementById(icontainerId);
            var svg = document.createElement("object");
            svg.setAttribute('type', 'image/svg+xml');
            svg.setAttribute('data', '../img/' + apiResult.abbr.toLowerCase() + '.svg');
            svg.setAttribute('height', iconSize);
            svg.setAttribute('width', iconSize);
            svg.setAttribute('id', iconId);
            svg.classList.add('icon');
            svg.classList.add('team-icon');
            svg.classList.add('invisible');
            icontainer.appendChild(svg);

            // Wait a little bit for the data to load,
            // then modify the color and make it visible
            var paint = function(color, elemId) {
              var mysvg = $('#' + elemId).getSVG();
              var child = mysvg.find("g path:first-child()");
              if (child.length > 0) {
                child.attr('fill', color);
                $('#' + elemId).removeClass('invisible');
              }
            }
            // This fails pretty often, so try a few times.
            setTimeout(paint, 100,  apiResult.color, iconId);
            setTimeout(paint, 250,  apiResult.color, iconId);
            setTimeout(paint, 500,  apiResult.color, iconId);
            setTimeout(paint, 1000, apiResult.color, iconId);
            setTimeout(paint, 1500, apiResult.color, iconId);
          }

        } else {
          this.error(-1);
        }

      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end /champion api call

    },

    /**
     * Add the minilife player to the appropriate <div> element
     */
    minilife : function() {
      var minilife = document.getElementById('minilife-player');
      var template = document.getElementById('minilife-template');
      var clone = template.content.cloneNode(true);
      minilife.appendChild(clone);

      var bod = document.getElementsByTagName('body')[0];
      var jsfiles = ['json-sans-eval.js', 'minilife.js'];
      for (let j in jsfiles) {
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', this.baseUIUrl + '/theme/js/' + jsfiles[j]);
        bod.append(script);
        if (j==1) {
          script.onload = () => {
            MiniGOL.init();
          }
        }
      }
    },


    /**
     * Utility method to populate a league div with results from the /currentGames API
     */
    fillLeagueContainer : function(leagueContainerElem, leagueNameElem, leagueName, currGamesApiResult) {

      leagueNameElem.innerHTML = leagueName;

      // Create divs for all of the games in this league
      for (let g in currGamesApiResult) {
        var game = currGamesApiResult[g];
        if (game.league==leagueName) {

          // Create a clone of the template
          var gametemplate = document.getElementById('inprogress-game-template');
          var cloneFragment = gametemplate.content.cloneNode(true);

          // Add the game id to the template game id
          if (game.hasOwnProperty('id')) {
            cloneFragment.querySelector(".card").setAttribute("id", game.id);
          }

          // Add the template game div to the page
          leagueContainerElem.appendChild(cloneFragment);
        }
      }

      // Now populate each div
      for (let g in currGamesApiResult) {
        var game = currGamesApiResult[g];
        if (game.league==leagueName) {

          var elem = document.getElementById(game.id);

          // Team name labels
          if (game.hasOwnProperty('team1Name') && game.hasOwnProperty('team2Name')) {
            var t1tags = elem.getElementsByClassName('team1name');
            var t2tags = elem.getElementsByClassName('team2name');
            var t;
            for (t = 0; t < t1tags.length; t++) {
              teamNameElem = t1tags[t];
              teamNameElem.innerHTML = game.team1Name;
            }
            for (t = 0; t < t2tags.length; t++) {
              teamNameElem = t2tags[t];
              teamNameElem.innerHTML = game.team2Name;
            }
          }

          // Team colors
          if (game.hasOwnProperty('team1Color') && game.hasOwnProperty('team2Color')) {
            var t1tags = elem.getElementsByClassName('team1color');
            var t2tags = elem.getElementsByClassName('team2color');
            var t;
            for (t = 0; t < t1tags.length; t++) {
              teamColorElem = t1tags[t];
              teamColorElem.style.color = game.team1Color;
            }
            for (t = 0; t < t2tags.length; t++) {
              teamColorElem = t2tags[t];
              teamColorElem.style.color = game.team2Color;
            }
          }

          // Assemble team W-L records
          if (game.hasOwnProperty('team1WinLoss') && game.hasOwnProperty('team2WinLoss')) {
            var wlstr1 = "(" + game.team1WinLoss[0] + "-" + game.team1WinLoss[1] + ")";
            var wlstr2 = "(" + game.team2WinLoss[0] + "-" + game.team2WinLoss[1] + ")";
            var t1tags = elem.getElementsByClassName('team1record');
            var t2tags = elem.getElementsByClassName('team2record');
            var t;
            for (t = 0; t < t1tags.length; t++) {
              teamWinLossElem = t1tags[t];
              teamWinLossElem.innerHTML = wlstr1;
            }
            for (t = 0; t < t2tags.length; t++) {
              teamWinLossElem = t2tags[t];
              teamWinLossElem.innerHTML = wlstr2;
            }
          }

          // Update map pattern name
          if (game.hasOwnProperty('mapName')) {
            var mapName = game.mapName;
            var mapTags = elem.getElementsByClassName('map-name');
            var mt;
            for (mt = 0; mt < mapTags.length; mt++) {
              mapNameElem = mapTags[mt];
              mapNameElem.innerHTML = mapName;
            }
          }

          // Update simulate game button link
          if (game.hasOwnProperty('id')) {
            var btnUrl = this.baseUIUrl + '/simulator/index.html?gameId=' + game.id;
            var btnTags = elem.getElementsByClassName('simulate');
            var bt;
            for (bt = 0; bt < btnTags.length; bt++) {
              btnNameElem = btnTags[bt];
              btnNameElem.setAttribute('href', btnUrl);
            }
          }
        } // End if game in correct league
      } // End populate each div
    },


    /**
     * Use the golly API to get the current games for this regular season day,
     * and populate the league divs with games.
     */
    populateSeasonGames : function(mode, container) {
      // get the league names from the games
      let url = this.baseApiUrl + '/currentGames';
      fetch(url)
      .then(res => res.json())
      .then((currGamesApiResult) => {

        this.loadingElem.classList.add('invisible');

        // Assemble a sorted list of leagues
        var leaguesSet = new Set();
        for (let g in currGamesApiResult) {
          leaguesSet.add(currGamesApiResult[g].league);
        }
        var leagues = Array.from(leaguesSet);
        leagues.sort();

        var leagueContainers = [
          document.getElementById("league-1-container"),
          document.getElementById("league-2-container"),
        ];
        var leagueNames = [
          document.getElementById("league-1-name"),
          document.getElementById("league-2-name"),
        ]

        // Loop over each league and populate its coresponding div with games
        for (let i in leagues) {

          // This is the container we will add each game to
          var leagueContainerElem = leagueContainers[i];
          var leagueNameElem = leagueNames[i];
          var leagueName = leagues[i];

          this.fillLeagueContainer(leagueContainerElem, leagueNameElem, leagueName, currGamesApiResult);

        } // end for each league

      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end /currentGames api call
    },

    /**
     * Populate the list of upcoming postseason games.
     */
    populatePostseasonWaiting : function(mode, container) {
      // get the league names from the games
      let url = this.baseApiUrl + '/currentGames';
      fetch(url)
      .then(res => res.json())
      .then((currGamesApiResult) => {

        // Load the seeds from the API
        let seedsUrl = this.baseApiUrl + '/seeds';
        fetch(seedsUrl)
        .then(res => res.json())
        .then((seedsApiResult) => {

          // Assemble a sorted list of leagues
          var leaguesSet = new Set();
          for (var league in seedsApiResult) {
            leaguesSet.add(league);
          }
          var leagues = Array.from(leaguesSet);
          leagues.sort();

          if ((mode==21) || (mode==22)) {

            // Two leagues, two columns
            var leagueContainers = [
              document.getElementById("league-1-container"),
              document.getElementById("league-2-container"),
            ];
            var leagueNames = [
              document.getElementById("league-1-name"),
              document.getElementById("league-2-name"),
            ]

            // Loop over each league and populate its coresponding div with games
            var i;
            for (i = 0; i < leagues.length; i++) {

              // This is the container we will add each game to
              var leagueContainerElem = leagueContainers[i];
              var leagueNameElem = leagueNames[i];

              leagueNameElem.innerHTML = leagues[i];

              // Create divs for all of the games in this league
              for (let g in currGamesApiResult) {
                var game = currGamesApiResult[g];
                if (game.league==leagues[i]) {

                  // Create a clone of the template
                  var postTemplate = document.getElementById('scheduled-postgame-template');
                  var cloneFragment = postTemplate.content.cloneNode(true);

                  // Add the game id to the template game id
                  if (game.hasOwnProperty('id')) {
                    cloneFragment.querySelector(".card").setAttribute("id", game.id);
                  }

                  // Add the template game div to the page
                  leagueContainerElem.appendChild(cloneFragment);
                }
              } // end loop creating divs for each game in league

              // Now populate each div
              for (let g in currGamesApiResult) {
                var game = currGamesApiResult[g];
                if (game.league==leagues[i]) {

                  var t1tags, t2tags, t, elem;

                  elem = document.getElementById(game.id);

                  if (game.hasOwnProperty('team1Name') && game.hasOwnProperty('team2Name')) {

                    // Team name labels
                    t1tags = elem.getElementsByClassName('team1name');
                    t2tags = elem.getElementsByClassName('team2name');
                    for (t = 0; t < t1tags.length; t++) {
                      teamNameElem = t1tags[t];
                      teamNameElem.innerHTML = game.team1Name;
                    }
                    for (t = 0; t < t2tags.length; t++) {
                      teamNameElem = t2tags[t];
                      teamNameElem.innerHTML = game.team2Name;
                    }

                    // Seed number
                    var leagueSeedResults = seedsApiResult[leagues[i]];
                    t1tags = elem.getElementsByClassName('team1seed');
                    t2tags = elem.getElementsByClassName('team2seed');
                    t1seed = leagueSeedResults.indexOf(game.team1Name) + 1;
                    t2seed = leagueSeedResults.indexOf(game.team2Name) + 1;
                    for (t = 0; t < t1tags.length; t++) {
                      t1tags[t].innerHTML = "(" + t1seed + ")";
                    }
                    for (t = 0; t < t2tags.length; t++) {
                      t2tags[t].innerHTML = "(" + t2seed + ")";
                    }

                  }

                  // Game description
                  if (game.hasOwnProperty('description')) {
                    descrElems = elem.getElementsByClassName('postseason-game-description');
                    var d;
                    for (d = 0; d < descrElems.length; d++) {
                      descrElem = descrElems[d];
                      descrElem.innerHTML = game.description;
                    }
                  }

                  // Update map pattern name
                  if (game.hasOwnProperty('mapName')) {
                    var mapName = game.mapName;
                    var mapTags = elem.getElementsByClassName('map-name');
                    var mt;
                    for (mt = 0; mt < mapTags.length; mt++) {
                      mapNameElem = mapTags[mt];
                      mapNameElem.innerHTML = mapName;
                    }
                  }

                  // Team colors
                  if (game.hasOwnProperty('team1Color') && game.hasOwnProperty('team2Color')) {
                    t1tags = elem.getElementsByClassName('team1color');
                    t2tags = elem.getElementsByClassName('team2color');
                    for (t = 0; t < t1tags.length; t++) {
                      teamColorElem = t1tags[t];
                      teamColorElem.style.color = game.team1Color;
                    }
                    for (t = 0; t < t2tags.length; t++) {
                      teamColorElem = t2tags[t];
                      teamColorElem.style.color = game.team2Color;
                    }
                  }

                } // end if correct league
              } // end loop updating divs for each game in league
            } // end for each league


            // end if mode 21 or 22
          } else if(mode==23) {
            // begin if mode 23

            // World Series has no league, single-column
            var leagueContainerElem = document.getElementById('ws-league-waiting-container');
            var g;
            for (g = 0; g < currGamesApiResult.length; g++) {
              var game = currGamesApiResult[g];

              // Create a clone of the template
              var postTemplate = document.getElementById('scheduled-postgame-template');
              var cloneFragment = postTemplate.content.cloneNode(true);

              // Add the game id to the template game id
              if (game.hasOwnProperty('id')) {
                cloneFragment.querySelector(".card").setAttribute("id", game.id);
              }

              // Add the template game div to the page
              leagueContainerElem.appendChild(cloneFragment);

            } // end loop creating divs for each game in league

            // Now populate the div
            for (g = 0; g < currGamesApiResult.length; g++) {
              var game;
              var t1tags, t2tags, t, elem;

              game = currGamesApiResult[g];
              elem = document.getElementById(game.id);

              if (game.hasOwnProperty('team1Name') && game.hasOwnProperty('team2Name')) {

                // Team name labels
                t1tags = elem.getElementsByClassName('team1name');
                t2tags = elem.getElementsByClassName('team2name');
                for (t = 0; t < t1tags.length; t++) {
                  teamNameElem = t1tags[t];
                  teamNameElem.innerHTML = game.team1Name;
                }
                for (t = 0; t < t2tags.length; t++) {
                  teamNameElem = t2tags[t];
                  teamNameElem.innerHTML = game.team2Name;
                }

                // Seed number
                t1tags = elem.getElementsByClassName('team1seed');
                t2tags = elem.getElementsByClassName('team2seed');
                t1ix = -1;
                t2ix = -1;
                var i;
                for (i = 0; i < leagues.length; i++) {
                  leagueSeedResults = seedsApiResult[leagues[i]];
                  t1ix = leagueSeedResults.indexOf(game.team1Name);
                  console.log(t1ix);
                  if (t1ix >= 0) {
                    t1seed = t1ix;
                  }
                  t2ix = leagueSeedResults.indexOf(game.team2Name);
                  console.log(t2ix);
                  if (t2ix >= 0) {
                    t2seed = t2ix;
                  }
                }
                if (t1seed >= 0) {
                  t1seed += 1;
                  for (t = 0; t < t1tags.length; t++) {
                    t1tags[t].innerHTML = "(" + t1seed + ")";
                  }
                }
                if (t2seed >= 0) {
                  t2seed += 1;
                  for (t = 0; t < t2tags.length; t++) {
                    t2tags[t].innerHTML = "(" + t2seed + ")";
                  }
                }
              }

              // Game description
              if (game.hasOwnProperty('description')) {
                descTags = elem.getElementsByClassName('postseason-game-description');
                console.log(descTags);
                var j;
                for (j = 0; j < descTags.length; j++) {
                  descElem = descTags[j];
                  descElem.innerHTML = game.description;
                }
              }

              // Update map pattern name
              if (game.hasOwnProperty('mapName')) {
                var mapName = game.mapName;
                var mapTags = elem.getElementsByClassName('map-name');
                var mt;
                for (mt = 0; mt < mapTags.length; mt++) {
                  mapNameElem = mapTags[mt];
                  mapNameElem.innerHTML = mapName;
                }
              }

              // Team colors
              if (game.hasOwnProperty('team1Color') && game.hasOwnProperty('team2Color')) {
                t1tags = elem.getElementsByClassName('team1color');
                t2tags = elem.getElementsByClassName('team2color');
                for (t = 0; t < t1tags.length; t++) {
                  teamColorElem = t1tags[t];
                  teamColorElem.style.color = game.team1Color;
                }
                for (t = 0; t < t2tags.length; t++) {
                  teamColorElem = t2tags[t];
                  teamColorElem.style.color = game.team2Color;
                }
              }

            } // end for each game in api result

          } // end if mode 23

        })
        .catch(err => {
          console.log(err);
          this.error(-1);
        }); // end API /seeds
      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end API /currentGames
    },

    /**
     * Populate the list of ongoing postseason games.
     */
    populatePostseasonOngoing : function(mode, container) {
      // get the league names from the games
      let url = this.baseApiUrl + '/currentGames';

      fetch(url)
      .then(res => res.json())
      .then((currGamesApiResult) => {

        // Load the seeds from the API
        let seedsUrl = this.baseApiUrl + '/seeds';
        fetch(seedsUrl)
        .then(res => res.json())
        .then((seedsApiResult) => {

          this.loadingElem.classList.add('invisible');

          // Assemble a sorted list of leagues
          var leaguesSet = new Set();
          for (let league in seedsApiResult) {
            leaguesSet.add(league);
          }
          var leagues = Array.from(leaguesSet);
          leagues.sort();

          if ((mode==31) || (mode==32)) {

            // Two leagues, two columns
            var leagueContainers = [
              document.getElementById("league-1-container"),
              document.getElementById("league-2-container"),
            ];
            var leagueNames = [
              document.getElementById("league-1-name"),
              document.getElementById("league-2-name"),
            ]

            // Loop over each league and populate its coresponding div with games
            var i;
            for (i = 0; i < leagues.length; i++) {

              // This is the container we will add each game to
              var leagueContainerElem = leagueContainers[i];
              var leagueNameElem = leagueNames[i];

              leagueNameElem.innerHTML = leagues[i];

              // Create divs for all of the games in this league
              for (let g in currGamesApiResult) {
                var game = currGamesApiResult[g];
                if (game.league==leagues[i]) {

                  // Create a clone of the template
                  var postTemplate = document.getElementById('inprogress-postgame-template');
                  var cloneFragment = postTemplate.content.cloneNode(true);

                  // Add the game id to the template game id
                  if (game.hasOwnProperty('id')) {
                    cloneFragment.querySelector(".card").setAttribute("id", game.id);
                  }

                  // Add the template game div to the page
                  leagueContainerElem.appendChild(cloneFragment);
                }
              } // end loop creating divs for each game in league

              // Now populate each div
              for (let g in currGamesApiResult) {
                var game = currGamesApiResult[g];
                if (game.league==leagues[i]) {

                  var t1tags, t2tags, t, elem;

                  elem = document.getElementById(game.id);

                  if (game.hasOwnProperty('team1Name') && game.hasOwnProperty('team2Name')) {

                    // Team name labels
                    t1tags = elem.getElementsByClassName('team1name');
                    t2tags = elem.getElementsByClassName('team2name');
                    for (t = 0; t < t1tags.length; t++) {
                      teamNameElem = t1tags[t];
                      teamNameElem.innerHTML = game.team1Name;
                    }
                    for (t = 0; t < t2tags.length; t++) {
                      teamNameElem = t2tags[t];
                      teamNameElem.innerHTML = game.team2Name;
                    }

                    //// Seed number
                    //var leagueSeedResults = seedsApiResult[leagues[i]];
                    //t1tags = elem.getElementsByClassName('team1seed');
                    //t2tags = elem.getElementsByClassName('team2seed');
                    //t1seed = leagueSeedResults.indexOf(game.team1Name) + 1;
                    //t2seed = leagueSeedResults.indexOf(game.team2Name) + 1;
                    //for (t = 0; t < t1tags.length; t++) {
                    //  t1tags[t].innerHTML = "(" + t1seed + ")";
                    //}
                    //for (t = 0; t < t2tags.length; t++) {
                    //  t2tags[t].innerHTML = "(" + t2seed + ")";
                    //}

                    // Series W-L
                    var t1tags, t2tags;
                    t1tags = elem.getElementsByClassName('team1seed');
                    t2tags = elem.getElementsByClassName('team2seed');

                    var wl, t1wl, t2wl;
                    wl = game['team1SeriesWinLoss'];
                    t1wl = wl[0] + '-' + wl[1];
                    wl = game['team2SeriesWinLoss'];
                    t2wl = wl[0] + '-' + wl[1];

                    for (t = 0; t < t1tags.length; t++) {
                      t1tags[t].innerHTML = "(" + t1wl + ")";
                    }
                    for (t = 0; t < t2tags.length; t++) {
                      t2tags[t].innerHTML = "(" + t2wl + ")";
                    }

                  }

                  // Game description
                  if (game.hasOwnProperty('description')) {
                    descrElems = elem.getElementsByClassName('postseason-game-description');
                    var d;
                    for (d = 0; d < descrElems.length; d++) {
                      descrElem = descrElems[d];
                      descrElem.innerHTML = game.description;
                    }
                  }

                  // Update map pattern name
                  if (game.hasOwnProperty('mapName')) {
                    var mapName = game.mapName;
                    var mapTags = elem.getElementsByClassName('map-name');
                    var mt;
                    for (mt = 0; mt < mapTags.length; mt++) {
                      mapNameElem = mapTags[mt];
                      mapNameElem.innerHTML = mapName;
                    }
                  }

                  // Team colors
                  if (game.hasOwnProperty('team1Color') && game.hasOwnProperty('team2Color')) {
                    t1tags = elem.getElementsByClassName('team1color');
                    t2tags = elem.getElementsByClassName('team2color');
                    for (t = 0; t < t1tags.length; t++) {
                      teamColorElem = t1tags[t];
                      teamColorElem.style.color = game.team1Color;
                    }
                    for (t = 0; t < t2tags.length; t++) {
                      teamColorElem = t2tags[t];
                      teamColorElem.style.color = game.team2Color;
                    }
                  }

                  // Update simulate game button link
                  if (game.hasOwnProperty('id')) {
                    var btnUrl = this.baseUIUrl + '/simulator/index.html?gameId=' + game.id;
                    var btnTags = elem.getElementsByClassName('simulate');
                    var bt;
                    for (bt = 0; bt < btnTags.length; bt++) {
                      btnNameElem = btnTags[bt];
                      btnNameElem.setAttribute('href', btnUrl);
                    }
                  }

                } // end if correct league
              } // end loop updating divs for each game in league
            } // end for each league

            // end if mode 31 or 32
          } else if(mode==33) {
            // begin if mode 33

            // World Series has no league, single-column
            var leagueContainerElem = document.getElementById('ws-league-ongoing-container');
            var g;
            for (g = 0; g < currGamesApiResult.length; g++) {
              var game = currGamesApiResult[g];

              // Create a clone of the template
              var postTemplate = document.getElementById('inprogress-postgame-template');
              var cloneFragment = postTemplate.content.cloneNode(true);

              // Add the game id to the template game id
              if (game.hasOwnProperty('id')) {
                cloneFragment.querySelector(".card").setAttribute("id", game.id);
              }

              // Add the template game div to the page
              leagueContainerElem.appendChild(cloneFragment);
            }

            // Now populate the div
            for (g = 0; g < currGamesApiResult.length; g++) {
              var game;
              var t1tags, t2tags, t, elem;

              game = currGamesApiResult[g];
              elem = document.getElementById(game.id);

              if (game.hasOwnProperty('team1Name') && game.hasOwnProperty('team2Name')) {

                // Team name labels
                t1tags = elem.getElementsByClassName('team1name');
                t2tags = elem.getElementsByClassName('team2name');
                for (t = 0; t < t1tags.length; t++) {
                  teamNameElem = t1tags[t];
                  teamNameElem.innerHTML = game.team1Name;
                }
                for (t = 0; t < t2tags.length; t++) {
                  teamNameElem = t2tags[t];
                  teamNameElem.innerHTML = game.team2Name;
                }

                //// Seed number
                //t1tags = elem.getElementsByClassName('team1seed');
                //t2tags = elem.getElementsByClassName('team2seed');
                //var i;
                //for (i = 0; i < leagues.length; i++) {
                //  var leagueSeedResults = seedsApiResult[leagues[i]];
                //  t1ix = leagueSeedResults.indexOf(game.team1Name);
                //  if (t1ix > 0) {
                //    t1seed = t1ix;
                //  }
                //  t2ix = leagueSeedResults.indexOf(game.team2Name);
                //  if (t2ix > 0) {
                //    t2seed = t2ix;
                //  }
                //}
                //if (t1seed != 0) {
                //  t1seed += 1;
                //  for (t = 0; t < t1tags.length; t++) {
                //    t1tags[t].innerHTML = "(" + t1seed + ")";
                //  }
                //}
                //if (t2seed != 0) {
                //  t2seed += 1;
                //  for (t = 0; t < t2tags.length; t++) {
                //    t2tags[t].innerHTML = "(" + t2seed + ")";
                //  }
                //}

                // Series W-L
                var t1tags, t2tags;
                t1tags = elem.getElementsByClassName('team1seed');
                t2tags = elem.getElementsByClassName('team2seed');

                var wl, t1wl, t2wl;
                wl = game['team1SeriesWinLoss'];
                t1wl = wl[0] + '-' + wl[1];
                wl = game['team2SeriesWinLoss'];
                t2wl = wl[0] + '-' + wl[1];

                for (t = 0; t < t1tags.length; t++) {
                  t1tags[t].innerHTML = "(" + t1wl + ")";
                }
                for (t = 0; t < t2tags.length; t++) {
                  t2tags[t].innerHTML = "(" + t2wl + ")";
                }

              }

              // Game description
              if (game.hasOwnProperty('description')) {
                descTags = elem.getElementsByClassName('postseason-game-description');
                var j;
                for (j = 0; j < descTags.length; j++) {
                  descElem = descTags[j];
                  descElem.innerHTML = game.description;
                }
              }

              // Update map pattern name
              if (game.hasOwnProperty('mapName')) {
                var mapName = game.mapName;
                var mapTags = elem.getElementsByClassName('map-name');
                var mt;
                for (mt = 0; mt < mapTags.length; mt++) {
                  mapNameElem = mapTags[mt];
                  mapNameElem.innerHTML = mapName;
                }
              }

              // Team colors
              if (game.hasOwnProperty('team1Color') && game.hasOwnProperty('team2Color')) {
                t1tags = elem.getElementsByClassName('team1color');
                t2tags = elem.getElementsByClassName('team2color');
                for (t = 0; t < t1tags.length; t++) {
                  teamColorElem = t1tags[t];
                  teamColorElem.style.color = game.team1Color;
                }
                for (t = 0; t < t2tags.length; t++) {
                  teamColorElem = t2tags[t];
                  teamColorElem.style.color = game.team2Color;
                }
              }

              // Update simulate game button link
              if (game.hasOwnProperty('id')) {
                var btnUrl = this.baseUIUrl + '/simulator/index.html?gameId=' + game.id;
                var btnTags = elem.getElementsByClassName('simulate');
                var bt;
                for (bt = 0; bt < btnTags.length; bt++) {
                  btnNameElem = btnTags[bt];
                  btnNameElem.setAttribute('href', btnUrl);
                }
              }

            } // end loop creating divs for each game

          } // end if mode 33

        })
        .catch(err => {
          console.log(err);
          this.error(-1);
        }); // end API /seeds

      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end API /currentGames
    },

    /**
     * Register Event
     */
    registerEvent : function (element, event, handler, capture) {
      if (/msie/i.test(navigator.userAgent)) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, capture);
      }
    },

  };

  LandingPage.registerEvent(window, 'load', function () {
    LandingPage.init();
  }, false);

}());