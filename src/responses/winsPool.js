const bot = require("../bot");

function trigger(msg) {
  return /wins pool standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    setTimeout(function() {
        bot.postMsg("https://docs.google.com/spreadsheets/d/1S7pqIiMrg97vysptgdL2kIMkVQ2vO53hs-7a4eCA8_4/edit#gid=0");
    }, 1000);
  } catch (err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;