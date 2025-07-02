const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");

function trigger(msg) {
  return /fuck you mike/i.test(msg.text);
}

async function respond(msg) {
  try {
    setTimeout(function() {
      bot.postMsg("https://media.giphy.com/media/5pUGvckBvGSNvDOInk/200.gif");
    }, 1000);
  } catch (err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;
