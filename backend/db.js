const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString : process.env.DATABASE_URL,
});

pool.connect((err) => {
    if(err){
        console.error('Database connection error:', err.message);
    } else {
        console.log('Database connected successfully');
    }
});
module.exports = pool;