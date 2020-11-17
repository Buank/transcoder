
const express = require('express'),
    router = express.Router();

const statisticsController = require('../controllers/statistics-control');

router.get('/', statisticsController.controller);

module.exports = {route : router};
