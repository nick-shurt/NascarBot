const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");

function trigger(msg) {
  return /@indians/i.test(msg.text);
}

async function respond(msg) {
  var gameDate1 = msg.text.replace(/.*@indians/i, "").trim();
  if (gameDate1[5] == "i") {
    gameDate1 = gameDate1.replace(/who did they play/i, "").trim();
  } else if (gameDate1[5] == "o") {
    gameDate1 = gameDate1.replace(/who do they play/i, "").trim();
  }

  let gameDate = gameDate1;
  var dateNum = gameDate.match(/\d/g);
  var future = false;
  dateNum = dateNum.join("");
  if (dateNum.length < 5) {
    gameDate += " 2019";
  }

  var today = new Date();
  var dateobj = new Date(gameDate);

  if (today < dateobj) {
    future = true;
  }

  var gameDateFormatted = dateobj.toISOString();
  gameDateFormatted = gameDateFormatted.substring(
    0,
    gameDateFormatted.indexOf("T")
  );

  try {
    let resp = await rp({
      method: "GET",
      url: `http://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${gameDateFormatted}&teamId=114`,
      json: true
    });

    var message = "";
    if (future) {
      message = getFutureGameMessage(resp);
    } else {
      message = getPastGameMessage(resp);
    }

    setTimeout(function() {
      bot.postMsg(message);
    }, 1000);
  } catch (err) {
    console.error(err);
  }
}

function getFutureGameMessage(resp) {
  var message = "";
  var home = true;
  if (resp.totalGames == 0) {
    message = "The Indians do not play on that day";
  } else {
    if (resp.totalGames == 1) {
      if (resp.dates[0].games[0].teams.away.team.id == "114") {
        message =
          "The Indians play a road game against the " +
          resp.dates[0].games[0].teams.home.team.name;
        home = false;
      } else {
        message =
          "The Indians play a home game against the " +
          resp.dates[0].games[0].teams.away.team.name;
      }
    }
    if (resp.totalGames == 2) {
      if (resp.dates[0].games[0].teams.away.team.id == "114") {
        message =
          "The Indians play a doubleheader on the road against the " +
          resp.dates[0].games[0].teams.home.team.name;
        home = false;
      } else {
        message =
          "The Indians play a doubleheader at home against the " +
          resp.dates[0].games[0].teams.away.team.name;
      }

      //for (var i = 0; i < 2; i++) {

      //}
    }

    var gameTime = resp.dates[0].games[0].gameDate;
    gameTime = gameTime.substring(
      gameTime.indexOf("T") + 1,
      gameTime.indexOf("Z")
    );

    var hours = gameTime[0] + gameTime[1];
    if (hours < 16) {
      hours -= 16;
      hours += 24;
    } else if (hours == 16) {
      hours -= 4;
    } else {
      hours -= 16;
    }
    var minutes = gameTime[3] + gameTime[4];

    message += ".\nGame Time: " + hours + ":" + minutes + " p.m.";
  }

  return message;
}

function getPastGameMessage(resp) {
  var message = "";
  var home = true;

  if (resp.totalGames == 0) {
    message = "The Indians did not play on that day";
  } else if (resp.totalGames == 1) {
    if (resp.dates[0].games[0].teams.away.team.id == "114") {
      message =
        "The Indians played a road game against the " +
        resp.dates[0].games[0].teams.home.team.name;
      home = false;
    } else {
      message =
        "The Indians played a home game against the " +
        resp.dates[0].games[0].teams.away.team.name;
    }

    if (home) {
      if (resp.dates[0].games[0].teams.home.isWinner) {
        message +=
          ". They won " +
          resp.dates[0].games[0].teams.home.score +
          " - " +
          resp.dates[0].games[0].teams.away.score +
          ".";
      } else {
        message +=
          ". They lost " +
          resp.dates[0].games[0].teams.away.score +
          " - " +
          resp.dates[0].games[0].teams.home.score +
          ".";
      }
    } else {
      if (resp.dates[0].games[0].teams.away.isWinner) {
        message +=
          ". They won " +
          resp.dates[0].games[0].teams.away.score +
          " - " +
          resp.dates[0].games[0].teams.home.score +
          ".";
      } else {
        message +=
          ". They lost " +
          resp.dates[0].games[0].teams.home.score +
          " - " +
          resp.dates[0].games[0].teams.away.score +
          ".";
      }
    }
  } else if (resp.totalGames == 2) {
    if (resp.dates[0].games[0].teams.away.team.id == "114") {
      message =
        "The Indians played a doubleheader on the road against the " +
        resp.dates[0].games[0].teams.home.team.name;
      home = false;
    } else {
      message =
        "The Indians played a doubleheader at home against the " +
        resp.dates[0].games[0].teams.away.team.name;
    }

    for (var i = 0; i < 2; i++) {
      if (home) {
        if (resp.dates[0].games[i].teams.home.isWinner) {
          message +=
            i == 0
              ? ". They won the first game, "
              : ". They won the second game, ";
          message +=
            resp.dates[0].games[i].teams.home.score +
            " - " +
            resp.dates[0].games[i].teams.away.score;
        } else {
          message +=
            i == 0
              ? ". They lost the first game, "
              : ". They lost the second game, ";
          message +=
            resp.dates[0].games[i].teams.away.score +
            " - " +
            resp.dates[0].games[i].teams.home.score;
        }
      } else {
        if (resp.dates[0].games[i].teams.away.isWinner) {
          message +=
            i == 0
              ? ". They won the first game, "
              : ". They won the second game, ";
          message +=
            resp.dates[0].games[i].teams.away.score +
            " - " +
            resp.dates[0].games[i].teams.home.score;
        } else {
          message +=
            i == 0
              ? ". They lost the first game, "
              : ". They lost the second game, ";
          message +=
            resp.dates[0].games[i].teams.home.score +
            " - " +
            resp.dates[0].games[i].teams.away.score;
        }
      }
    }
    message += ".";
  }
  return message;
}

exports.trigger = trigger;
exports.respond = respond;
