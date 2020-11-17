const env = require("../config/env");
const dbModel = require("../db-model");

const fs = require('fs');

const exec = require("executive");
const ndlReq = require('./needleSend');

async function autoCut(){
    let active_cutting = await checkStatusCut();
    if(active_cutting.payment === true && active_cutting.cutted === false && active_cutting.ext === '.mp4'){
        cutVideo(active_cutting);
    }
}

async function cutFast(id){
    let video = await getVideoById(id);
    cutVideo(video);
}

async function getVideoById(id) {
    let select = await dbModel.one('SELECT uuid,original_ext,original_id,original_res,server_id,payment,freetime,cutted FROM queue WHERE id=' + id)
        .then( result => {
            return result
        }).catch(error => {
            return false
        });
    if (select === false){
        return false;
    } else {
        return video={
            uuid: select.uuid,
            ext: select.original_ext,
            resolution: select.original_res,
            new_resolution:'',
            id: select.original_id,
            server_id: select.server_id,
            token:'',
            payment:select.payment,
            freetime:select.freetime,
            cutted:select.cutted
        }
    }
}

async function checkStatusCut(){
    let select = await dbModel.one('SELECT uuid,original_ext,original_id,original_res,server_id,payment,freetime,cutted FROM queue WHERE cutted = false and payment = true ORDER BY id ASC LIMIT 1')
        .then((res) => {
            return res
        }).catch(() => {return false;});
    if (select === false){
        return false;
    } else {
        return video={
            uuid: select.uuid,
            ext: select.original_ext,
            resolution: select.original_res,
            new_resolution:'',
            id: select.original_id,
            server_id: select.server_id,
            token:'',
            payment:select.payment,
            freetime:select.freetime,
            cutted:select.cutted
        }
    }
}

async function sendFileFtpCutted(video) {
    if (video.payment === true && video.cutted === true){
        console.log('Отправка платного');
        local_path = await './static/cutted/';
        file = video.uuid+'-'+video.resolution+'-short'+video.freetime+'.mp4';
        await exec('sshpass -p "'+env.ftp_pass+'" scp -P 2222 -p -c aes128-ctr '+local_path+file+' '
            +env.ftp_user+'@'+env.ftp_host+':/home/peertube/storage/videos/')
            .then(()=>{
                return true
            });
    }
}

async function updateState(id,state,status){
    dbModel.none('UPDATE queue SET ' + state + ' = $1 WHERE original_id=$2',[status,id]).then(res => {return true});
}

async function changeMode(video){
    return exec('chmod 664 ./static/cutted/'+video.uuid+'-*.mp4').then((res)=>{
        console.log(res);
        return true
    });
}

async function sendToServer(video){
    console.log('sendToServer я тут с ' + video.resolution);
    await changeMode(video);
    await sendFileFtpCutted(video);
}

async function cutVideo(video) {
    console.log('Я собираюсь резать видос');
    await updateState(video.id,'cutted',true);
    let date = new Date(null);
    date.setSeconds(video.freetime); // specify value for SECONDS here
    let timeString = date.toISOString().substr(11, 8);
    console.log(timeString);
    // await exec('ffmpeg -loglevel panic -y -hwaccel_device 0 -hwaccel cuvid -c:v ' +
    //     'h264_cuvid -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+' -c:v h264_nvenc -profile:v ' +
    //     'main -sc_threshold 0 -g 48 -keyint_min 48 -c:a aac -ar 48000 -filter:v -ss 00:00:00 -t ' + timeString + ' -maxrate:v ' +
    //     '3000k ./static/output/'+video.uuid+'-'+video.resolution+'-short'+video.freetime+'.mp4').then((res)=>{
    //     return true;
    // });
    await exec('ffmpeg -loglevel panic -y ' +
        ' -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+' ' +
        ' -ss 00:00:00 -t ' + timeString +
        ' ./static/cutted/'+video.uuid+'-short'+video.freetime+'.mp4').then((res)=>{
        sendFileFtpCutted(video);
    }).catch((err)=>{
        console.log('Ошибка при нарезке - '+video.id);
        updateState(video.id,'cutted',false);
    });
}

exports.autoCut = autoCut;
exports.cutFast = cutFast;
exports.updateState = updateState;
