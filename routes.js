// load libraries
const express = require('express')

// SQL
const SQL_GET_TV_SHOW = 'select distinct (name) from tv_shows order by name desc limit ?';
const SQL_GET_TV_SHOW_BY_NAME = 'select * from tv_shows where name = ?'

// create a high level function that takes in sqlStmt, pool
// returns a function f with params as bound variable, and sqlStmt + pool free variable
const mkQuery = (sqlStmt, pool) => {
    const f = async (params) => {

        // get connection from the pool
        const conn = await pool.getConnection();

        try {
            const results = await conn.query(sqlStmt, params);
            return results[0];
        } catch (e) {
            return Promise.reject(e);
        } finally {
            conn.release();
        }

    }

    return f;
}

module.exports = function (p, r) {

    const router = express.Router();
    const pool = p;
    const root = r || '';

    const getTVList = mkQuery(SQL_GET_TV_SHOW, pool)
    const getTVShowById = mkQuery(SQL_GET_TV_SHOW_BY_NAME, pool)

    router.get('/', async (req, res) => {

        // const conn = await pool.getConnection();
    
        try {
            // const results = await conn.query(SQL_GET_TV_SHOW,[100]);
            const results = await getTVList([100])

            console.info('>>>results : ', results)
    
            res.status(200);
            res.type('text/html');
            res.render('index', { tvShows: results, root });
    
        } catch (e) {
            res.status(500);
            res.type('text/html');
            res.send(JSON.stringify(e));
            return
    
        }
    })
    
    router.get('/tvshow/:name', async (req, res) => {

        const name = req.params['name'];
        // const conn = await pool.getConnection();
    
        try {
            // const results = await conn.query(SQL_GET_TV_SHOW_BY_NAME,[name]);
            const results = await getTVShowById([name])
            const recs = results
    
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
                    res.render('show', { show: recs[0], root  });
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
    
        }
    })

    return(router);

}