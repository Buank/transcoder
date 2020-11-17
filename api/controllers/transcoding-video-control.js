

//Модули сиситемы

// Мои модули
const dbModel = require("../../db-model");

/***
 * Сюда нужно передать ссылку на видос, который надо скачать, кладем ссылку в редис
 * Дальше мы также передаем сюда ID сервера на котором лежат видосы, чтобы положить туда-же свежие
 * ***/

async function controller(req,res) {
    let video = {
        uuid: req.body.uuid,
        resulotion: req.body.resolution,
        ext: req.body.extname,
        id: req.body.videoId,
        token: ''
    };
    await addToQueue(video);
    res.status(200).json({message:'Success'})
}

/***
 * Такс как тут работает
 * Присылаем видос на апиху - сохраняем - опрашиваем базу на активный транскод - если есть тогда ничего не даелм
 * если нет тогда запускаем транскод - скачиваение - проверка формата - транскод - отпрвка - помечаем готовый элемент
 */

//TODO затолкать в ОРМ
async function addToQueue(video){
    let check = await dbModel.one('SELECT id FROM queue WHERE original_id = $1',video.id).then(res=>{return true}).catch(error=>{return false});
    if (check === true){
        console.log('Уже есть такое видео');
    } else {
        dbModel.none('INSERT INTO queue(uuid, status, original_ext, original_res, original_id, server_id) VALUES(${uuid}, ${status}, ${original_ext}, ${original_res}, ${original_id}, ${server_id})', {
            uuid: video.uuid,
            status: 0,
            original_ext: video.ext,
            original_res: video.resulotion,
            original_id: video.id,
            server_id: 3
        })
            .then(result => {
                return true;
            })
            .catch(error => {
                console.log(error); // print the error;
            });

    }
}

exports.controller = controller;
exports.addToQueue = addToQueue;
