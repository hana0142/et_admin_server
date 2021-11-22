const { Pool } = require('pg')

const pool = new Pool({
    	user: 'hana',
	host: '10.214.26.112',
	database: 'db_user',
	password: 'hana',
	port: 5432,
	multipleStatements:true
})

module.exports = pool;
