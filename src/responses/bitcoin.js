const config = require("../config");
const bot = require("../bot");
const rp = require("request-promise");
var Client = require("coinbase").Client;

function trigger(msg) {
  return /@bitcoin/i.test(msg.text);
}

async function respond(msg) {
  let keyword = msg.text.replace(/.*@bitcoin/i, "").trim();

  try {
    var client = new Client({
      apiKey: "API KEY",
      apiSecret: "API SECRET",
      version: "YYYY-MM-DD"
    });

    currencyCode = "USD"; // can also use EUR, CAD, etc.

    // Make the request
    client.getSpotPrice({ currency: currencyCode }, function(err, price) {
      var value = price.data.amount;
      value = Number(value);
      console.log(
        "Current bitcoin price in " + currencyCode + ": " + value.toFixed(2)
      );

      setTimeout(function() {
        bot.postMsg(
          "Current bitcoin price in " + currencyCode + ": $" + value.toFixed(2)
        );
      }, 1000);
    });
  } catch (err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;