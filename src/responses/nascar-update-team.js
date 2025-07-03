const config = require("../config");
const bot = require("../bot");
const mysql = require('mysql2/promise');
const Fuse = require('fuse.js');

function trigger(msg) {
    return /@sub/i.test(msg.text);
}

async function respond(msg) {
    const connection = await mysql.createConnection({
        host: config.DATABASE_HOST,
        user: config.DATABASE_USER,
        password: config.DATABASE_PASS,
        database: config.DATABASE_NAME
    });

    try {
        console.log('Full Message', msg);
        let message = '';
        let update = true;
        let teamFound = false;
        let driversValid = false;
        let validInput = true;
        var [driverA, driverB] = [];
        var team = {};
        let columnA = null, columnB = null;
        let input = msg.text.replace(/.*@/i, "").trim();

        //get team name of requestor
        let teamName = getTeamName(msg.sender_id);

        //get current week race details
        const [rows] = await connection.execute(
            'SELECT name, date, number FROM `races_2025` WHERE `closed` = 0 LIMIT 1'
        );
        const { name, date, number } = rows[0];

        //if user specified week in message, get week number and set team week; if not specified, use current week
        let teamWeek = number;
        const weekNumber = getWeekNumber(input);
        if (weekNumber) {
            if (weekNumber < number) {
                message = 'Invalid week. Cannot edit past lineups';
                validInput = false;
            } else if (weekNumber > 27) {
                message = 'Invalid week. You can only edit your regular season lineups';
                validInput = false;
            } else {
                teamWeek = weekNumber;
            }
        }

        // extract driver names from string; if unable, input is incorrect, send message, no udpate; else map to variables
        const drivers = parseSwitchRequest(input);
        if (!drivers) {
            console.log("Invalid input format.");
            message = "Invalid input. Please check message and try again";
            validInput = false;
        } else {
            [driverA, driverB] = drivers.map(name => name.toLowerCase());
            driversValid = true;
        }

        if (validInput) {
            //get team based on user and week
            const [rows2] = await connection.execute(
                'SELECT driver1, driver2, driver3, driver4 FROM teams_2025 WHERE team_name = ? AND week = ?',
                [teamName, teamWeek]
            );

            // if team not found, send message and no update; if found, set to variable
            if (rows2.length === 0) {
                console.log('Team not found.');
                message = 'Team not matched in the database';
                update = false;
            } else {
                team = rows2[0];
                teamFound = true;
            }

            if (driversValid && teamFound) {
                let bothFound = false;

                // Create a list of drivers from the row
                const driverMap = Object.entries(team).filter(([key]) =>
                    key.startsWith('driver')
                );

                // Prepare values for fuzzy matching
                const driverNames = driverMap.map(([_, val]) => val);

                // Use Fuse.js to search
                const fuse = new Fuse(driverNames, {
                    threshold: 0.2, // adjust as needed (lower = stricter match)
                });

                const resultA = fuse.search(driverA)[0];
                const resultB = fuse.search(driverB)[0];

                if (!resultA || !resultB) {
                    console.log('One or both drivers not found on this team');
                    message = 'One or both drivers not found on your team';
                    update = false;
                } else {
                    bothFound = true;
                }

                if (bothFound) {
                    // Find columns where these matched names are stored
                    columnA = driverMap.find(([_, val]) => val === resultA.item)?.[0];
                    columnB = driverMap.find(([_, val]) => val === resultB.item)?.[0];
                }
            }

            //if all checks pass, update
            if (update) {
                const sql = `UPDATE teams_2025 SET ${columnA} = ?, ${columnB} = ? WHERE team_name = ? AND week = ?`;
                await connection.execute(sql, [team[`${columnB}`], team[`${columnA}`], teamName, teamWeek]);

                console.log(`✅ Switched "${driverA}" and "${driverB}" successfully.`);
                message = '✅  Substitution made successfully.';
            }
        }

        bot.postMsg(message);
    } catch (err) {
        console.error('Database error:', err);
        return { success: false, message: 'Database error' };
    } finally {
        await connection.end();
    }
}

function parseSwitchRequest(input) {
    const lower = input.toLowerCase().trim();
    const cleaned = lower.replace(/\bweek\s+\d+\b$/, '').trim();
    const match = cleaned.match(/(?:sub|switch)\s+([\w\s]+?)\s+(?:for|with|and)\s+([\w\s]+)/i);

    if (!match) return null;

    const nameA = match[1].trim();
    const nameB = match[2].trim();

    return [nameA, nameB];
}

function getTeamName(userId) {
    const userTeamMap = {
        "25143759": "Team Nick",
        /*"": "Team Rachel",
        "": "Team Matt",
        "": "Team Jim",
        "": "Team Jru",
        "": "Team Chives",
        "": "Team Donna",
        "": "Team Mike",
        "": "Team Steve",
        "": "Team Joey"*/
    };

    return userTeamMap[userId] || null;
}

function getWeekNumber(str) {
  const match = str.match(/\bweek\s+(\d+)\b/i);
  return match ? parseInt(match[1], 10) : null;
}


exports.trigger = trigger;
exports.respond = respond;
