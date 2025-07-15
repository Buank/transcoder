const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    env = require('./config/env'),
    CronJob = require('cron').CronJob;

const path = require('path');

//Подключение моделей и модулей
const transcodeVideoRouter = require('./api/routes/transcoding-video-route');
const statisticsRouter = require('./api/routes/statistics-route');
const retranscodeRouter = require('./api/routes/retranscode-route');
const cutVideoRouter = require('./api/routes/cut-video-route');
const autoTranscode = require('./modules/autoTranscode');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('events').EventEmitter.defaultMaxListeners = 150;
// Настройки сервера

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({
    type: ['application/json', 'application/*+json']
}));



app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.static(path.join(__dirname, 'web')));


// Routes
app.use('/video', transcodeVideoRouter.route);
app.use('/stats', statisticsRouter.route);
app.use('/retranscode', retranscodeRouter.route);
app.use('/cut', cutVideoRouter.route);

app.listen(env.serverPort, function () {
    console.info('Start server a success');
    autoTranscode.sendToTelegram('Сервер стартанул успешно');
});
process.on('exit', (code)  => {
    autoTranscode.sendToTelegram('Сервер упал code: ' + code);
});
process.on('uncaughtException', () => {
    autoTranscode.sendToTelegram('Сервер упал');
});

new CronJob('0 */1 * * * *', function() {
    autoTranscode.autoTranscode();
}, null, true, 'America/Los_Angeles');
