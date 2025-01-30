const express = require("express")
const pool = require('./db')
const app = express() ;
const axios = require('axios');
require('dotenv').config();
const cors = require("cors")

app.use(cors())
const PORT = 3000;

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/github/callback';

app.get('/auth/github', (req, res) => {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email;`
  res.redirect(authUrl);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    ); 

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user = userResponse.data;

    res.json({
      login: user.login,
      avatar: user.avatar_url,
      email: user.email || 'Email privé',
    });
  } catch (error) {
    console.error('Erreur lors de la connexion GitHub :', error.message);
    res.status(500).send('Erreur lors de la connexion GitHub');
  }
});

app.get('/users', async (req, res)=>{
    try{
        const {rows} = await pool.query('SELECT * FROM P_USER WHERE 1=1') ;
        res.json(rows) ;
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
}) ;

// CLASSEMENT GLOBAL
app.get('/global-ranking', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT 
            U.IDUSER, 
            U.USERNAME, 
            SUM(
                (CAST(SPLIT_PART(S.PASSEDTESTCASES, '/', 1) AS FLOAT) * CH.MAXPOINT) / 
                CAST(SPLIT_PART(S.PASSEDTESTCASES, '/', 2) AS FLOAT)
            ) AS TOTAL_SCORE,
            SUM(EXTRACT(EPOCH FROM S.SUBMITTEDDATE)) AS TOTAL_TIME
        FROM SOLVE S
        JOIN P_USER U ON U.IDUSER = S.IDUSER
        JOIN CHALLENGE CH ON CH.IDCHALLENGE = S.IDCHALLENGE
        GROUP BY U.IDUSER, U.USERNAME
        ORDER BY TOTAL_SCORE DESC, TOTAL_TIME ASC;
        `);

        const userMap = new Map();
        rows.forEach(({ iduser, username, total_score, total_time }) => {
            total_time = parseFloat(total_time); 
            if (!userMap.has(iduser)) {
                userMap.set(iduser, { iduser, username, total_score, total_time });
            } 
            else {
                let user = userMap.get(iduser);
                user.total_score += total_score;
                user.total_time += total_time;
            }
        });

        const sortedRanking = Array.from(userMap.values()).sort((a, b) => b.total_score - a.total_score || a.total_time - b.total_time);
        res.status(200).json(sortedRanking)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, ()=>{
    console.log(`App runing on port ${PORT}`)
})