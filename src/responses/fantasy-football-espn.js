const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");

var Client = require("espn-fantasy-football-api/node").Client;
const myClient = new Client({ leagueId: config.LEAGUE_ID});
myClient.setCookies({
  espnS2: config.S2,
  SWID: config.SWID
});

var teamByeMap = {ARI:12, ATL:9, BAL:8, BUF:6, CAR:7, CHI:6, CIN:9, CLE:7, DAL:8, DEN:10, DET:5, GB:11, HOU:10, IND:6, JAX:10, KC:12, LAC:12, LAR:9, MIA:5, MIN:12, NE:10, NO:9, NYG:11, NYJ:4, OAK:6, PHI:10, PIT:7, SEA:11, SF:4, TB:7, TEN:11, WAS:10};

function trigger(msg) {
  return /@ff/i.test(msg.text);
}

async function respond(msg) {

  let resp = await rp({
    method: "GET",
    url: `https://fantasy.espn.com/apis/v3/games/ffl/seasons`,
    json: true
  });

  var week = resp[0].currentScoringPeriod.id;

  var message = msg.text.replace(/.*@ff/i, "").trim();
  message = message.replace("week", "");
  message = message.replace(/[0-9]/g, '').trim();

  if (message == "my matchup") {
    sendMatchup(msg, week);
  } else if (message == "scoreboard") {
    sendScoreboard(msg, week);
  } else if (message == "lineup check") {
    sendLineupStatus(msg, week);
  }
}

function sendMatchup(msg, wk) {
  var teamId = getTeamId(msg.user_id);
  var message = msg.text.replace(/.*@ff/i, "").trim();
  var week = wk;
  if (/\d/.test(message)) {
    week = message.match(/\d+/)[0].trim();
    week = parseInt(week, 10);
  }

  try {
    myClient
      .getBoxscoreForWeek({
        seasonId: 2019,
        scoringPeriodId: week,
        matchupPeriodId: week
      })
      .then(boxscores => {
        myClient
          .getTeamsAtWeek({ seasonId: 2019, scoringPeriodId: week })
          .then(teams => {
            var msg =
              "\nWeek " + week + ":\n=================================\n";
            for (var k = 0; k < boxscores.length; k++) {
              if (boxscores[k].homeTeamId == teamId || boxscores[k].awayTeamId == teamId) {
                var homeScore = boxscores[k].homeScore;
                var roundedHS = Math.round(homeScore * 10) / 10;
                var awayScore = boxscores[k].awayScore;
                var roundedAS = Math.round(awayScore * 10) / 10;

                var homeTeamName = "";
                var awayTeamName = "";
                for (var j = 0; j < teams.length; j++) {
                  if (teams[j].id == boxscores[k].homeTeamId) {
                    homeTeamName = teams[j].name;
                  }
                  if (teams[j].id == boxscores[k].awayTeamId) {
                    awayTeamName = teams[j].name;
                  }
                }

                msg +=
                  homeTeamName +
                  ": " +
                  roundedHS +
                  "\n" +
                  awayTeamName +
                  ": " +
                  roundedAS +
                  "\n=================================\n";
              }
            }
            setTimeout(function() {
              bot.postMsg(msg);
            }, 1000);
          });
      });
  } catch (err) {
    console.error(err);
  }
}

function sendScoreboard(msg, wk) {
  var message = msg.text.replace(/.*@ff/i, "").trim();
  var week = wk;
  if (/\d/.test(message)) {
    week = message.match(/\d+/)[0].trim();
    week = parseInt(week, 10);
  }

  try {
    myClient
      .getBoxscoreForWeek({
        seasonId: 2019,
        scoringPeriodId: week,
        matchupPeriodId: week
      })
      .then(boxscores => {
        myClient
          .getTeamsAtWeek({ seasonId: 2019, scoringPeriodId: week })
          .then(teams => {
            var msg =
              "\nWeek " + week + ":\n=================================\n";
            for (var k = 0; k < boxscores.length; k++) {
              var homeScore = boxscores[k].homeScore;
              var roundedHS = Math.round(homeScore * 10) / 10;
              var awayScore = boxscores[k].awayScore;
              var roundedAS = Math.round(awayScore * 10) / 10;

              var homeTeamName = "";
              var awayTeamName = "";
              for (var j = 0; j < teams.length; j++) {
                if (teams[j].id == boxscores[k].homeTeamId) {
                  homeTeamName = teams[j].name;
                }
                if (teams[j].id == boxscores[k].awayTeamId) {
                  awayTeamName = teams[j].name;
                }
              }

              msg +=
                homeTeamName +
                ": " +
                roundedHS +
                "\n" +
                awayTeamName +
                ": " +
                roundedAS +
                "\n=================================\n";
            }
            setTimeout(function() {
              bot.postMsg(msg);
            }, 1000); 
          });
      });
  } catch (err) {
    console.error(err);
  }
}

function sendLineupStatus(msg, week) {
  var teamId = getTeamId(msg.user_id);
  var found = false;

  try {
    myClient
      .getBoxscoreForWeek({
        seasonId: 2019,
        scoringPeriodId: week,
        matchupPeriodId: week
      })
      .then(boxscores => {
        var msg = "--------    LINEUP STATUS    --------\n\n";
        for (var k = 0; k < boxscores.length; k++) {
          if (boxscores[k].homeTeamId == teamId) {
            for (var i = 0; i < boxscores[k].homeRoster.length; i++) {
              if (boxscores[k].homeRoster[i].position != "Bench") {
                if (boxscores[k].homeRoster[i].player.injuryStatus != "ACTIVE" && typeof boxscores[k].homeRoster[i].player.injuryStatus != "undefined") {
                  msg += "PLAYER: " + boxscores[k].homeRoster[i].player.fullName + ", " + boxscores[k].homeRoster[i].position + "\n";
                  msg += "STATUS: " + boxscores[k].homeRoster[i].player.injuryStatus + "\n\n";
                  found = true;
                } else {
                  if (checkForBye(boxscores[k].homeRoster[i].player.proTeamAbbreviation, week)) {
                    msg += "PLAYER: " + boxscores[k].homeRoster[i].player.fullName + ", " + boxscores[k].homeRoster[i].position + "\n";
                    msg += "STATUS: BYE\n\n";
                    found = true;
                  }
                }
              }
            }
          }
          if (boxscores[k].awayTeamId == teamId) {
            for (var i = 0; i < boxscores[k].awayRoster.length; i++) {
              if (boxscores[k].awayRoster[i].position != "Bench") {
                if (boxscores[k].awayRoster[i].player.injuryStatus != "ACTIVE" && typeof boxscores[k].awayRoster[i].player.injuryStatus != "undefined") {
                  msg += "PLAYER: " + boxscores[k].awayRoster[i].player.fullName + ", " + boxscores[k].awayRoster[i].position + "\n";
                  msg += "STATUS: " + boxscores[k].awayRoster[i].player.injuryStatus + "\n\n";
                  found = true;
                } else {
                  if (checkForBye(boxscores[k].awayRoster[i].player.proTeamAbbreviation, week)) {
                    msg += "PLAYER: " + boxscores[k].awayRoster[i].player.fullName + ", " + boxscores[k].awayRoster[i].position + "\n";
                    msg += "STATUS: BYE\n\n";
                    found = true;
                  }
                }
              }
            }
          }
        }
        if (!found) {
          msg += "You have no one in your starting lineup injured or on bye\n";
        }
        setTimeout(function() {
          bot.postMsg(msg);
        }, 1000);
      });
  } catch (err) {
    console.error(err);
  }
}

function getTeamId(userId) {
  if (userId == 25143759) {
    return 3;
  } else if (userId == 13996624) {
    return 5;
  } else if (userId == 22571812) {
    return 16;
  } else if (userId == 20405725) {
    return 4;
  } else if (userId == 23131215) {
    return 13;
  } else if (userId == 7174176) {
    return 9;
  } else if (userId == 32131345) {
    return 6;
  } else if (userId == 16189519) {
    return 7;
  } else if (userId == 17528908) {
    return 11;
  } else if (userId == 55267854) {
    return 1;
  } else if (userId == 28182819) {
    return 14;
  }
}

function checkForBye(team, week) {
  if (teamByeMap[team] == week) {
    return true;
  }
}

exports.trigger = trigger;
exports.respond = respond;