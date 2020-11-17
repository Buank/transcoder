const needle = require('needle');

function  needleReq(params,answer){
    needle.request(params.method, params.url, params.data, params.opts, function(error, response) {
        if (response === undefined){
            console.log('Response undefined');
            answer(undefined);
        }else {
            if (response.statusCode === 200){
                answer(response);
            } else if (response.statusCode === 204){
                answer(response);
            }else if(response.statusCode === 500){
                console.log(response.body);
                console.log(response.statusCode);
                console.log('Ошибка сервера');
            } else if (response.statusCode === 400){
                console.log(response.body);
                console.log(response.statusCode);
                console.log('Ошибка неверный запрос');
            } else {
                answer(response);
            }
        }
    });
}

exports.needleReq = needleReq;
