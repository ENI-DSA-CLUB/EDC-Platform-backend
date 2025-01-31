const express = require('express') ;
const router = express.Router() ;
pool = require('../db')

router.get('/global-ranking', async (req, res) => {
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

module.exports = router ;