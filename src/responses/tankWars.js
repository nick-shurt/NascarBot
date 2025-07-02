const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");

function trigger(msg) {
  return /nba tank war/i.test(msg.text);
}

async function respond(msg) {
  try {
    let resp = await rp({
      method: "GET",
      url: `http://data.nba.net/10s/prod/v1/current/standings_all.json`,
      json: true
    });

    setTimeout(function() {
      bot.postMsg(buildTable(resp));
    }, 1000);
  } catch (err) {
    console.error(err);
  }
}

function buildTable(response) {
  var table = "Team      Wins    Losses\n===================\n";
  for (var i = 25; i < 30; i++) {
    table +=
      getTeamName(response.league.standard.teams[i].teamId) +
      "           " +
      response.league.standard.teams[i].win +
      "          " +
      response.league.standard.teams[i].loss +
      "\n";
  }
  return table;
}

function getTeamName(teamId) {
  var team = " ";
  if (teamId == "1610612739") {
    team = "CLE";
  }
  if (teamId == "1610612740") {
    team = "NOP";
  }
  if (teamId == "1610612752") {
    team = "NYK";
  }
  if (teamId == "1610612741") {
    team = "CHI";
  }
  if (teamId == "1610612737") {
    team = "ATL";
  }
  if (teamId == "1610612763") {
    team = "MEM";
  }
  if (teamId == "1610612764") {
    team = "WAS";
  }
  if (teamId == "1610612744") {
    team = "GSW";
  }
  return team;
}

exports.trigger = trigger;
exports.respond = respond;
