const express = require('express') ;
const router = express.Router() ;
pool = require('../db')

router.get('/users', async (req, res)=>{
    try{
        const {rows} = await pool.query('SELECT * FROM P_USER') ;
        res.json(rows) ;
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
}) ;

module.exports = router ;