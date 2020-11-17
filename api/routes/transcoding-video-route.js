
const express = require('express'),
    router = express.Router();

const transcodingVideoController = require('../controllers/transcoding-video-control');

router.post('/', transcodingVideoController.controller);

module.exports = {route : router};
