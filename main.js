// load libraries
const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise')

const r = require('./routes')

// configure environment
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// configure sql
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'leisure',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 4,
    timezone: '+08:00'
})

const router = r(pool, '/v1');

// create express instance
const app = express();

// configure handlebars
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

// configure routes
app.use('/v1',router);

// load static resources


// start the application
pool.getConnection()
.then(conn => {
    console.info(`Pinging database...`);
    const p0 = Promise.resolve(conn);
    const p1 = conn.ping();
    return Promise.all([p0, p1]);
})
.then(results => {
    const conn = results[0];

    // release the connection
    conn.release();

    // start the app
    app.listen(PORT, () => {
        console.log(`Application initialized on PORT: ${PORT} at ${new Date()}`);
    })
})
.catch (e => {
    console.error(`Cannot ping database: ${e}`);
});
