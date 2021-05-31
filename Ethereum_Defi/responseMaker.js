var responseErrorMaker = function(errorCode,errorMessage)
{
    var responseObject = {
            success : false,
            response: {
                errorCode : errorCode,
                errorMessage: errorMessage
            }
    };
     
    return responseObject;
    
}

var responseMaker = function(obj){
    var responseObject = {
        success : true,
        response : obj
    };

    return responseObject;
}



var createResponse = function(par1,par2){
    var i=0;
    obj={};
    par1.forEach(element => {
        obj[element] = par2[i];
        i++;
    });

    return obj;
}

module.exports = {
    responseErrorMaker,   
    responseMaker,
    createResponse
}