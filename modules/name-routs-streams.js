//Модули сиситемы

// Мои модули
const ndlReq = require('../modules/needleSend');

function controller(cl) {

    let params = {
        method:'GET',
        // url: req.headers.host+'/channels-url',
        url: 'http://localhost:3000/channels-url',
    };

    ndlReq.needleReq(params,(answer)=>{
        if (answer === undefined){
            console.log('Ответа от запроса нет')
        } else if (answer.statusCode === 200){
            answer = answer.body.apTV;
            cl(answer)
        } else {
            console.log(answer.body);
            console.log(answer.statusCode);
        }
    });
}


exports.controller = controller;