
const express = require('express'),
    router = express.Router();

const cutVideoController = require('../controllers/cut-video-control');

router.post('/', cutVideoController.cutVideo);
router.post('/new_time/', cutVideoController.cutVideoNewTime);

module.exports = {route : router};
