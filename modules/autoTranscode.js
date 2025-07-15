const env = require("../config/env");
const dbModel = require("../db-model");
const Telegraf = require('telegraf');
const fs = require('fs');
const exec = require("executive");
const ndlReq = require('./needleSend');

// Telegram bot token is expected via environment variable TELEGRAM_TOKEN
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

async function autoTranscode(){
    let active_video = await checkStatus();
    if (active_video === false) {
        let video = await getVideoFromDB();
        if (video){
            newTranscode(video);
        }
    }
}

async function checkStatus(){
    return dbModel.one('SELECT id FROM queue WHERE status = 1')
        .then( result => {
            return true;
        })
        .catch(error => {
            return false
        });
}

async function newTranscode(video){

    await updateStatus(video.id,1);

    await exec('curl -Ok https://up3.showstreams.tv/download/videos/'+video.uuid+'-'+video.resolution+video.ext);

    await exec('mv '+video.uuid+'-'+video.resolution+video.ext+' ./static/input/');
    await updateState(video.id,'downloaded',true);
    if (video.ext === '.mp4'){
        await transcode(video);
    } else{
        await transcodeFromAnotherExt(video);
    }
}

async function getVideoFromDB(){
    let select = await dbModel.one('SELECT uuid,original_ext,original_id,original_res,server_id,payment,freetime,cutted FROM queue WHERE status = 0 order by id LIMIT 1')
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

async function sendFileFtp(video,input) {
    let file = video.uuid+'-'+video.new_resolution+video.ext;
    let local_path = './static/output/';

    if (video.payment === true && video.cutted === true){
        local_path = await './static/cutted/';
        file = video.uuid+'-'+video.resolution+'-short'+video.freetime+'.mp4';
        await exec('sshpass -p "'+env.ftp_pass+'" scp -P 2222 -p -c aes128-ctr '+local_path+file+' '
            +env.ftp_user+'@'+env.ftp_host+':/home/peertube/storage/videos/')
            .then(()=>{
            });
    }

    if (input === true) {
        local_path = await './static/input/';
        file = video.uuid+'-'+video.resolution+video.ext;
        await exec('sshpass -p "'+env.ftp_pass+'" scp -P 2222 -p -c aes128-ctr '+local_path+file+' '
            +env.ftp_user+'@'+env.ftp_host+':/home/peertube/storage/videos/')
            .then(()=>{
                sendInfoToServerOriginal(video);
            }).catch((err) => sendToTelegram('sendFileFtp - error - ' + err.name));
    } else {
        await exec('sshpass -p "'+env.ftp_pass+'" scp -P 2222 -p -c aes128-ctr '+local_path+file+' '
            +env.ftp_user+'@'+env.ftp_host+':/home/peertube/storage/videos/')
            .then(()=>{
                sendInfoToServer(video);
            }).catch((err) => sendToTelegram('sendFileFtp - error - ' + err.name));
    }
}

async function updateState(id,state,status){
    dbModel.none('UPDATE queue SET ' + state + ' = $1 WHERE original_id=$2',[status,id]).then(res => {return true});
}

async function updateStatus(id,status){
    await dbModel.none('UPDATE queue SET status = $1 WHERE original_id=$2',[status,id]).then(res => {return true});
}

async function transcodeFromAnotherExt(video) {
    await exec('ffmpeg -y  -loglevel panic -hwaccel_device 0 -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+
        '  -strict -2 -c:v h264_nvenc -c:a aac ./static/input/'+video.uuid+'-'+video.resolution+'.mp4').then(()=>{
        video.ext = '.mp4';
        sendFileFtp(video,true);
        transcode(video);
    }).catch((error) => sendToTelegram('transcodeFromAnotherExt - error - ' + video.id));
}

async function sendToTelegram(message){
    bot.telegram.sendMessage(305119140, message)
}

async function transcode(video) {
    if (+video.resolution > 480 && +video.resolution <= 720){
        await exec('ffmpeg  -y -hwaccel_device 0 -hwaccel cuvid -c:v ' +
            'h264_cuvid -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+' -c:v h264_nvenc -profile:v ' +
            'main -sc_threshold 0 -g 48 -keyint_min 48 -c:a aac -ar 48000 -filter:v scale_npp=854:480 -maxrate:v ' +
            '3000k ./static/output/'+video.uuid+'-480.mp4', (err, stdout, stderr) => sendToServer(video));
    } else if(+video.resolution > 720) {
        await exec('ffmpeg   -y -hwaccel_device 0 -hwaccel cuvid -c:v h264_cuvid -i ./static/input/'
            +video.uuid+'-'+video.resolution+video.ext+' -c:v h264_nvenc -profile:v main -sc_threshold 0 -g 48 ' +
            '-keyint_min 48 -c:a aac -ar 48000 -filter:v scale_npp=1280:720 -maxrate:v 3000k' +
            ' ./static/output/'+video.uuid+'-720.mp4 && pwd &&'+' ffmpeg -y -hwaccel_device 0 -hwaccel cuvid -c:v ' +
            'h264_cuvid -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+' -c:v h264_nvenc -profile:v ' +
            'main -sc_threshold 0 -g 48 -keyint_min 48 -c:a aac -ar 48000 -filter:v scale_npp=854:480 -maxrate:v ' +
            '3000k ./static/output/'+video.uuid+'-480.mp4 && echo "End"',() => sendToServer(video));
    } else if(+video.resolution <= 480){
        updateInfoOnServer(video);
    }
}

async function getFilesizeInBytes(filename) {
    let stats;
    try {
        stats = fs.statSync(filename);
    } catch (e) {
        await sendToTelegram('Ошибка получения размера файла - ' + filename)
    }
    return stats["size"]
}

async function changeMode(video){
    return exec('chmod 664 ./static/output/'+video.uuid+'-*.mp4').then((res)=>{
        return true
    });
}

async function sendToServer(video){

    await changeMode(video);
    await updateState(video.id,'transcoded',true);
    if(video.payment === true && video.cutted === false){
        let cutted = await cutVideo(video);
        if (cutted === true) await updateState(video.id,'cutted', true );
    }
    if (+video.resolution > 480 && +video.resolution <= 720){
        video.new_resolution = '480';
        await sendFileFtp(video,false);
    }
    else if(+video.resolution > 720){
        video.new_resolution = await '720';
        await sendFileFtp(video,false);
        video.new_resolution = await '480';
        await sendFileFtp(video,false);
    } else if(+video.resolution < 480){
        video.new_resolution = video.resolution;
        await sendFileFtp(video,false);
    }
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

async function cutVideo(video) {
    let date = new Date(null);
    date.setSeconds(video.freetime); // specify value for SECONDS here
    let timeString = date.toISOString().substr(11, 8);
    // await exec('ffmpeg -loglevel panic -y -hwaccel_device 0 -hwaccel cuvid -c:v ' +
    //     'h264_cuvid -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+' -c:v h264_nvenc -profile:v ' +
    //     'main -sc_threshold 0 -g 48 -keyint_min 48 -c:a aac -ar 48000 -filter:v -ss 00:00:00 -t ' + timeString + ' -maxrate:v ' +
    //     '3000k ./static/output/'+video.uuid+'-'+video.resolution+'-short'+video.freetime+'.mp4').then((res)=>{
    //     return true;
    // });
    return await exec('ffmpeg -loglevel panic -y ' +
        ' -i ./static/input/'+video.uuid+'-'+video.resolution+video.ext+' ' +
        ' -sc_threshold 0 -g 48 -keyint_min 48 -c:a aac -ar 48000 -filter:v -ss 00:00:00 -t ' + timeString + ' -maxrate:v ' +
        '3000k ./static/cutted/'+video.uuid+'-'+video.resolution+'-short'+video.freetime+'.mp4').then((res)=>{
        return true;
    });
}

function getToken(video) {
    let data = {
        client_id: env.client_id,
        client_secret: env.client_secret,
        response_type: env.response_type,
        grant_type: env.grant_type,
        scope: env.scope,
        username: env.usernameAc,
        password: env.passwordAc,
    };

    let params = {
        method:'POST',
        url:'https://up3.showstreams.tv/api/v1/users/token',
        data:data
    };

    ndlReq.needleReq(params,(answer)=>{
        if (answer.statusCode === 200){
            video.token = answer.body.access_token;
            updateInfoOnServer(video);
        }else {
            console.log('::: Ошибка при получение токена :::');
        }
    });
}

async function updateInfoOnServer(video){
    if (video.token === '') {
        return getToken(video);
    }
    let options = {
        multipart: false,
        insecure: false,
        headers: {
            'Authorization': 'Bearer '+ video.token ,
            'Content-Type': 'application/x-www-form-urlencoded',
        }};
    let params_put = {
        opts:options,
        method:'PUT',
        url:'https://up3.showstreams.tv/api/v1/videos/'+video.id,
        data:{'state':1}
    };
    await ndlReq.needleReq(params_put, async (answer) => {
        console.log(answer.statusCode);
        if (answer.statusCode !== 200) {
            await updateStatus(video.id, 2);
            await updateState(video.id, 'uploaded', false);
            sendToTelegram('Сервер вернул: ' + answer.statusCode + ' видео: https://showstreams.tv/videos/watch/' + video.uuid)
        } else {
            await updateState(video.id, 'uploaded', true);
            await updateState(video.id, 'transcoded', true);
            await updateStatus(video.id, 3);
        }
    });
}

async function sendInfoToServer(video){

    await updateState(video.id,'uploaded',true);

    let options = {
        multipart: false,
        insecure: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }};
    let path = './static/output/';
    let filename = video.uuid+'-'+video.new_resolution+video.ext;
    let filesize = await getFilesizeInBytes(path+filename);
    let params_put = {
        opts:options,
        method:'POST',
        url:'https://up3.showstreams.tv/api/v1/videos/addVideoFromTranscodeUuid',
        data:{
            'key':env.private_key,
            'size':filesize,
            'id':video.id,
            'resolution':video.new_resolution
        }
    };
    await ndlReq.needleReq(params_put, async (answer) => {
        console.log(answer.statusCode);
        if (answer.statusCode !== 200 || answer.statusCode !== 204) {
            await updateStatus(video.id, 2);
            sendToTelegram('Сервер вернул: ' + answer.statusCode + ' видео: https://showstreams.tv/videos/watch/' + video.uuid)
        } else {
            await updateStatus(video.id, 3);
            await exec('rm ./static/input/' + video.uuid + '-' + video.resolution + video.ext);
            if (video.resolution === '720') {
                await exec('rm ./static/output/' + video.uuid + '-480' + video.ext);
            } else {
                await exec('rm ./static/output/' + video.uuid + '-720' + video.ext);
                await exec('rm ./static/output/' + video.uuid + '-480' + video.ext);
            }
        }
    });

}

async function sendInfoToServerOriginal(video){

    await updateState(video.id,'uploaded',true);

    let options = {
        multipart: false,
        insecure: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }};
    let path = './static/input/';
    let filename = video.uuid+'-'+video.resolution+video.ext;
    let filesize = await getFilesizeInBytes(path+filename);
    let params_put = {
        opts:options,
        method:'POST',
        url:'https://up3.showstreams.tv/api/v1/videos/addVideoToServerAndDeleteOriginal',
        data:{
            'key':env.private_key,
            'size':filesize,
            'id':video.id,
            'resolution':video.resolution
        }
    };
    await ndlReq.needleReq(params_put, async (answer) => {
        if (answer.statusCode !== 200 || answer.statusCode !== 204) {
            await updateStatus(video.id, 2);
            sendToTelegram('Сервер вернул: ' + answer.statusCode + ' видео: https://showstreams.tv/videos/watch/' + video.uuid)
        }
    });
    if (+video.resolution < 480){
        await updateStatus(video.id,3);
    }
}

exports.autoTranscode = autoTranscode;
exports.updateStatus = updateStatus;
exports.updateState = updateState;
exports.sendToTelegram = sendToTelegram;
