// load libraries
const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise')

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

// SQL
const SQL_GET_TV_SHOW = 'select distinct (name) from tv_shows order by name desc limit ?';
const SQL_GET_TV_SHOW_BY_NAME = 'select * from tv_shows where name = ?'

// create express instance
const app = express();

// configure handlebars
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

// configure routes
app.get('/', async (req, res) => {
    const conn = await pool.getConnection();

    try {
        const results = await conn.query(SQL_GET_TV_SHOW,[30]);
        console.info('>>>results[0] : ', results[0])

        res.status(200);
        res.type('text/html');
        res.render('index', { tvShows: results[0] });

    } catch (e) {
        res.status(500);
        res.type('text/html');
        res.send(JSON.stringify(e));
        return

    } finally {
        conn.release();
    }
})

app.get('/tvshow/:name', async (req, res) => {
    
    const name = req.params['name'];
    const conn = await pool.getConnection();

    try {
        const results = await conn.query(SQL_GET_TV_SHOW_BY_NAME,[name]);
        const recs = results[0]

        if (recs.length <= 0) {
            //404
            res.status(404);
            res.type('text/html');
            res.send(`Not found : ${name}`);
            return
        }

        res.status(200);
        res.format({
            'application/json': () => {
                res.type('application/json');
                res.json(recs[0])
            },
            'text/html': () => {
                res.type('text/html');
                res.render('show', { show: recs[0] });
            },
            'default': () => {
                res.type('text/plain');
                res.send(JSON.stringify(recs[0]));
            }
        })
        
    } catch (e) {
        res.status(500);
        res.type('text/html');
        res.semd(JSON.stringify(e));
        return

    } finally {
        conn.release();
    }
})

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
