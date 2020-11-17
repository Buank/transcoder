

//Модули сиситемы

// Мои модули
const dbModel = require("../../db-model");
const transcoder = require("../../modules/autoTranscode");

/***
 * Сюда нужно передать ссылку на видос, который надо скачать, кладем ссылку в редис
 * Дальше мы также передаем сюда ID сервера на котором лежат видосы, чтобы положить туда-же свежие
 * ***/

async function reTranscode(req,res) {
    let data = {
        id: req.body.id
    };
    console.log(data);
    transcoder.updateStatus(data.id,0);
    transcoder.updateState(data.id,'downloaded',false);
    transcoder.updateState(data.id,'transcoded',false);
    transcoder.updateState(data.id,'uploaded',false);
    res.status(200).json({message: 'Success'});
}

async function transcodeNewVideo(req,res) {
    const addToQueue = require('transcoding-video-control');
    let video = {
        uuid: req.body.uuid,
        resulotion: req.body.resolution,
        ext: req.body.extname,
        id: req.body.videoId,
        token: ''
    };
    await addToQueue(video);
    res.status(200).json({message:'Success'});
}

exports.reTranscode = reTranscode;
exports.transcodeNewVideo = transcodeNewVideo;
