const env = {
    chunks: 0, // количество чанков в папке с каналом, 1 chunk = 6 сек
    serverPort: '', // порт запуска веб‑сервера

    // FTP credentials for uploading transcoded files
    ftp_host: '', // адрес FTP сервера
    ftp_user: '', // имя пользователя FTP
    ftp_pass: '', // пароль FTP

    // OAuth application credentials used when requesting a token
    client_id: '', // идентификатор клиента
    client_secret: '', // секрет клиента
    response_type: '', // тип возвращаемого ответа
    grant_type: '', // тип grant при получении токена
    scope: '', // область прав доступа
    usernameAc: '', // имя пользователя аккаунта
    passwordAc: '', // пароль аккаунта

    // Private key for API requests when sending video data
    private_key: '',

    // Параметры подключения к базе данных PostgreSQL
    db_host: '', // адрес сервера БД
    db_port: '', // порт сервера БД
    db_database: '', // название базы данных
    db_user: '', // пользователь БД
    db_password: '' // пароль пользователя БД
};

module.exports = env;
