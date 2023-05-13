const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3100, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    `DB Error: ${e.message}`;
  }
};
initializeDbAndServer();

const snakeToCamel1 = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

//API 1 state details
app.get("/players/", async (request, response) => {
  const getPlayerStates = `SELECT * FROM player_details;`;
  const statesList = await db.all(getPlayerStates);
  const result = statesList.map((each) => snakeToCamel1(each));
  response.send(result);
});

//API 2 state details
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `SELECT * FROM player_details where player_id = ${playerId};`;
  const player = await db.get(playerDetails);
  const result = snakeToCamel1(player);
  response.send(result);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
  UPDATE player_details  SET 
         player_name = '${playerName}'  
   WHERE 
        player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const cricketMatch = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `SELECT * FROM match_details where match_id = ${matchId};`;
  const match = await db.get(matchDetails);
  const result = cricketMatch(match);
  response.send(result);
});

///////////API 5 matches details
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchesDetails = `SELECT * FROM player_match_score INNER JOIN match_details ON player_match_score.match_id = match_details.match_id WHERE player_id = ${playerId}; `;
  const match = await db.all(matchesDetails);
  const result = match.map((each) => cricketMatch(each));
  response.send(result);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getmatchQuery = `SELECT * FROM player_match_score INNER JOIN  player_details ON player_match_score.player_id = player_details.player_id WHERE match_id = ${matchId};`;
  const match = await db.all(getmatchQuery);
  response.send(match.map((each) => snakeToCamel1(each)));
});

const snakeToCamel3 = (object) => {
  return {
    playerId: object.player_id,
    palyer_name: object.player_name,
    score: object.score,
    fours: object.fours,
    sixes: object.sixes,
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playersDetails = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const dbResponse = await db.get(playersDetails);
  response.send(dbResponse);
});

module.exports = app;
