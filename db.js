"use strict";
/** Database setup for jobly. */

const pg = require("pg");

let DB_URI = '';

if (process.env.NODE_ENV === 'test') {
    DB_URI = 'jobly_test';
}
else {
    DB_URI = 'jobly';
};

const db = new pg.Client( {
    host: 'localhost', // server name or IP address;
    port: 5432,
    database: DB_URI,
    user: 'postgres',
    password: 'pass'
});

db.connect();

module.exports = db;