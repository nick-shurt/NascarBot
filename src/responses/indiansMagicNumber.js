const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");

function trigger(msg) {
  return /indians magic number/i.test(msg.text);
}

async function respond(msg) {
  try {
    let resp = await rp({
      method: "GET",
      url: `http://statsapi.mlb.com/api/v1/standings/regularSeason?leagueId=103&season=2019`,
      json: true
    });

    var message = "";

    if (resp.records[2].teamRecords[0].team.id == "114") {
      var num =
        163 -
        resp.records[2].teamRecords[0].leagueRecord.wins -
        resp.records[2].teamRecords[1].leagueRecord.losses;
      message += "Their magic number is " + num;
    } else {
      message += "They do not have a magic number, they are not in 1st place";
    }

    console.log(resp.records[2].teamRecords[0].team.name);
    console.log(resp.records[2].teamRecords[1].team.name);
    console.log(message);

    setTimeout(function() {
      bot.postMsg(message);
    }, 1000);
  } catch (err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;
