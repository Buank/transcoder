

//Модули сиситемы

// Мои модули
const dbModel = require("../../db-model");

async function cutVideo(req,res) {
    let data = {
        id: req.body.id,
        time: req.body.time
    };
    console.log('Я тут чтобы резать видео ' + data.id + ' на ' + data.time);
    await dbModel.none('UPDATE queue SET payment = true, freetime = $1 WHERE original_id=$2',[data.time,data.id]).then(res => {return true});
    res.status(200).json({message: 'Success'});
}

async function cutVideoNewTime(req,res) {
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

exports.cutVideo = cutVideo;
exports.cutVideoNewTime = cutVideoNewTime;
