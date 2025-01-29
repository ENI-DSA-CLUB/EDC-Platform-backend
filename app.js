const express = require("express")
const pool = require('./db')
const app = express() ;
const PORT = 3000 ;

app.get('/', async (req, res)=>{
    try{
        const {rows} = await pool.query('SELECT * FROM P_USER WHERE IDUSER=1') ;
        res.json(rows) ;
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
}) ;

app.listen(PORT, ()=>{
    console.log(`App runing on port ${PORT}`)
})