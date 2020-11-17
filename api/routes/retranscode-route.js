
const express = require('express'),
    router = express.Router();

const retranscodeController = require('../controllers/retranscode-control');

router.post('/', retranscodeController.reTranscode);
router.post('/new/', retranscodeController.transcodeNewVideo);

module.exports = {route : router};
