

//Модули сиситемы

// Мои модули
const dbModel = require("../../db-model");

/***
 * Сюда нужно передать ссылку на видос, который надо скачать, кладем ссылку в редис
 * Дальше мы также передаем сюда ID сервера на котором лежат видосы, чтобы положить туда-же свежие
 * ***/

async function controller(req,res) {
    let pagination = {
        offset: req.query.start?req.query.start:0,
        limit:  req.query.count?req.query.count:10,
        sort:  'ORDER BY ' + req.query.sort
    };
    // console.log(pagination);
    //TODO Удалить нахуй pg-promis и перейти на ОРМ

    let data = await dbModel.any('SELECT id, status, uuid, downloaded, uploaded, transcoded, createdat FROM queue ' + pagination.sort + ' LIMIT ${limit} OFFSET ${offset}', {
        sort: pagination.sort,
        limit: pagination.limit,
        offset: pagination.offset
    });
    // let data = await dbModel.any('SELECT id, status, original_id, downloaded, uploaded, transcoded, createdat FROM queue ORDER BY $1 DESC LIMIT $2 OFFSET $3',[pagination.sort,pagination.limit,pagination.offset]);
    let total = await dbModel.one('SELECT COUNT(id) FROM queue');
    res.status(200).json({total:+total.count,data:data});
}

exports.controller = controller;
