const express = require("express") ;
const app = express() ;
const axios = require('axios');
require('dotenv').config();
const cors = require("cors") ;
const userRoute = require('./Routes/userRoute') ;
const globalRanking = require('./Routes/globalRanking') ;

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

app.use(userRoute) ;
app.use(globalRanking) ;


app.listen(PORT, ()=>{
    console.log(`App runing on http://localhost:${PORT}`)
})