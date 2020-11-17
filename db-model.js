// Интерфейс
const env = require('./config/env');
const pgp = require("pg-promise")(/*options*/);

function dbModel(){
    let cn = {
        host: env.db_host,
        port: env.db_port,
        database: env.db_database,
        user: env.db_user,
        password: env.db_password
    };
    return pgp(cn);
}
module.exports = dbModel();
