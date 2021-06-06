const helper = require('./helper.js');
const responseMaker =require('./responseMaker.js');
const requestTypeError = require('./enum.js');
const Web3 = require('web3');
const abis = require('./abi.js');

const web3 = new Web3('https://data-seed-prebsc-2-s1.binance.org:8545/');
var TokenAddress  = "0x95b03895A0c58A868324c2098a89178679EFAE48"
var LockAddress  = "0xd431187ff85b1200cC2B35133438a09C103BF932"
var DistributionAddress = "0xB816e66302592E0700bAbE6b712E124320571696"

const cors = require('cors');
var express = require('express');
const app = express();
var bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json({limit:1024*1024*1024,type:'application/json'}));
let errorMessage;
let errorCode;
var rawResponseObject;
var key;
var value ;

/*Account yaratmak için rest api url
*Çağırım : http://ip:port/AddressSituation
*input : {address:ethereum}
*output: account adresi, privateKey*/
app.post('/AddressSituation',function(req,res){ 
  var create = async() =>{
    try
    {
      let body = JSON.stringify(req.body.address);
      console.log("body",body);
      let ethereum = JSON.parse(body);
      console.log("ethereum",ethereum)
      let personAddress = helper.cleanWhiteCharacter(ethereum.selectedAddress);
      console.log("wewe",personAddress);
      var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
        from: personAddress, 
        to:TokenAddress
      });
    
      var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
        from: personAddress, 
        to:LockAddress
      });
    
      var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
        from:personAddress, 
        to:DistributionAddress
      });

    
      var bakiye =  await MyContractToken.methods.balanceOf(personAddress).call({from:personAddress});
      var Nest1 =  await MyContractLock.methods.ifNestFull(1).call({from:personAddress});
      var Nest2 =  await MyContractLock.methods.ifNestFull(2).call({from:personAddress});
      var Nest3 =  await MyContractLock.methods.ifNestFull(3).call({from:personAddress});
      
      let obj = {
         "nest1":[Nest1[0],Nest1[1],Nest1[2]],
         "nest2":[Nest2[0],Nest2[1],Nest2[2]],
         "nest3":[Nest3[0],Nest3[1],Nest3[2]],
      }

      key = ["account","balance","situation"];
      value = [personAddress,bakiye,obj];
      rawResponseObject = responseMaker.createResponse(key,value);
      response = responseMaker.responseMaker(rawResponseObject);
      res.send(response);
    }
    catch(err)
    {
      errorCode = requestTypeError.account_create;
      errorMessage =  helper.error(errorCode,err);
      response = responseMaker.responseErrorMaker(errorCode,errorMessage);
      res.send(response);
    }
  }
  create();
});

/*Contract deploy etmek için rest api url
*Çağırım : http://ip:port/Lock
*input :{
            "nestIndex":1,
            "tierIndex":3
            "address":ethereum
        }
*output: contract adresi,account,bakiye,mining durumu,gas değeri,blok sayısı*/
app.post('/Lock',function(req,res){

  var set = async() => {
    try{
            let nestIndex = JSON.stringify(req.body.nestIndex);
            let tierIndex = JSON.stringify(req.body.tierIndex);
            let ethereum = JSON.stringify(req.body.address);
            let lockAmount = 0;

            try{

              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: ethereum.selectedAddress, 
                to:TokenAddress
              });
            
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: ethereum.selectedAddress, 
                to:LockAddress
              });
            
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: ethereum.selectedAddress, 
                to:DistributionAddress
              });


              var bakiye =  await MyContractToken.methods.balanceOf(ethereum.selectedAddress).call({from:ethereum.selectedAddress});           
              if(tierIndex === 1 && bakiye < 150){
                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"balance is not enough for specified tier",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
              else if(tierIndex === 2 && bakiye < 200){
                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"balance is not enough for specified tier",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);

              }
              else if(tierIndex === 3 && bakiye < 300){
                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"balance is not enough for specified tier",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);

              }
              
              //lock-2
              var canBeLockable =  await MyContractLock.methods.canBeLockable().call({from:ethereum.selectedAddress});
              if(canBeLockable){
                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"address made lock before so you cant lock again",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
               
              //lock-3
              var ifNestFull =  await MyContractLock.methods.ifNestFull(nestIndex).call({from:ethereum.selectedAddress});
              if(ifNestFull[0] + ifNestFull[1] + ifNestFull[2] === 375){
                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"selected nest is full select another nest",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
           
              //lock-4
              var ifTierFull =  await MyContractLock.methods.ifTierFull(nestIndex,tierIndex).call({from:ethereum.selectedAddress});
              if(ifTierFull === 125){
                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"selected tier is full select another tier",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
               
              if(tierIndex === 1){
                lockAmount = 150;
              }
              else if(tierIndex === 2){
                lockAmount = 200;
              }
              else if(tierIndex === 3){
                lockAmount = 300;
              }
          
              var encodedToken =  await MyContractToken.methods.approve(LockAddress,lockAmount).encodeABI();
              let _paramsToken = {
                 data: encodedToken,
                 gasLimit:'3000000',
                 gas:'63262',
                 from:ethereum.selectedAddress,
                 to:TokenAddress
               }

               var encodedToken2 =  await MyContractLock.methods.lock(nestIndex,tierIndex).encodeABI();
                let _paramsToken2 = {
                data: encodedToken2,
                gasLimit:'3000000',
                gas:'63262',
                from:ethereum.selectedAddress,
                to:LockAddress
                }
               
                let encoding = [_paramsToken,_paramsToken2];


                key = ["account","result","transactions"];
                value = [ethereum.selectedAddress,"",encoding];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
                                 
            } 
            catch(err){
                errorCode = requestTypeError.identity_transactional_hash;
                errorMessage =  helper.error(errorCode,err);
                response = responseMaker.responseErrorMaker(errorCode,errorMessage);
                res.send(response);
            }
                       
    }
    catch(err)
    {
      errorCode = requestTypeError.identity;
      errorMessage = helper.error(errorCode,err);
      response = responseMaker.responseErrorMaker(errorCode,errorMessage);
      res.send(response);
    }
  }
  set();    
});


/*Contract deploy etmek için rest api url
*Çağırım : http://ip:port/Lock
*input :{
            "address":ethereum
        }
*output: contract adresi,account,bakiye,mining durumu,gas değeri,blok sayısı*/
app.post('/ClaimInformation',function(req,res){

  var set = async() => {
    try{
            let ethereum = JSON.stringify(req.body.address);
            let result;
            try{
   
              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: ethereum.selectedAddress, 
                to:TokenAddress
              });
            
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: ethereum.selectedAddress, 
                to:LockAddress
              });
            
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: ethereum.selectedAddress, 
                to:DistributionAddress
              });

              let canBeClaimableDate =  await MyContractLock.methods.canBeClaimable().call({from:ethereum.selectedAddress});
              let start = new Date(canBeClaimableDate*1000);
              var end = Date.now()
            
              const date1 = new Date(start);
              const date2 = new Date(end);
              const oneDay = 1000 * 60 * 60 * 24;
              const diffInTime = date2.getTime() - date1.getTime();
              const diffInDays = Math.round(diffInTime / oneDay);	
         
             if( diffInDays > 90) {
                result.message = "there is no fee for your claim"
                result.success = true;
              }
              else if(diffInDays > 60 && diffInDays <= 90){
                result.message= "%5 fee for your early claim you will take %95 of your lock amount"
                result.success = true;
              }
              else if(diffInDays > 30 && diffInDays <= 60){
                result.message = "%10 fee for your early claim you will take %95 of your lock amount"
                result.success = true;
              }
              else if(diffInDays > 20 && diffInDays <= 30){
                result.message= "%20 fee for your early claim you will take %95 of your lock amount"
                result.success = true;
              }
              else if(diffInDays > 10 && diffInDays <= 20){
                result.message = "%25 fee for your early claim you will take %95 of your lock amount"
                result.success = true;
              }
              else{
                result.message= "%30 fee for your early claim you will take %95 of your lock amount"
                result.success = true;
              }
             
              key = ["account","result"];
              value = [ethereum.selectedAddress,result];
              rawResponseObject = responseMaker.createResponse(key,value);
              response = responseMaker.responseMaker(rawResponseObject);
              res.send(response);

                                 
            } 
            catch(err){
              result.message= "address has not rights for claim"
              result.success = false;
              key = ["account","result"];
              value = [ethereum.selectedAddress,result];
              rawResponseObject = responseMaker.createResponse(key,value);
              response = responseMaker.responseMaker(rawResponseObject);
              res.send(response);
                               
            }
                       
    }
    catch(err)
    {
      errorCode = requestTypeError.identity;
      errorMessage = helper.error(errorCode,err);
      response = responseMaker.responseErrorMaker(errorCode,errorMessage);
      res.send(response);
    }
  }
  set();    
});

/*Contract deploy etmek için rest api url
*Çağırım : http://ip:port/Lock
*input :{
            "address":ethereum
        }
*output: contract adresi,account,bakiye,mining durumu,gas değeri,blok sayısı*/
app.post('/ClaimFirst',function(req,res){

  var set = async() => {
    try{
            let ethereum = JSON.stringify(req.body.address);
            try{

              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: ethereum.selectedAddress, 
                to:TokenAddress
              });
            
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: ethereum.selectedAddress, 
                to:LockAddress
              });
            
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: ethereum.selectedAddress, 
                to:DistributionAddress
              });
   
              var claimOP =  await MyContractLock.methods.claim().encodeABI();
              let paramClaim= {
                 data: claimOP,
                 gasLimit:'3000000',
                 gas:'63262',
                 from:ethereum.selectedAddress,
                 to:LockAddress
               }

               let encoding = [paramClaim];

               key = ["account","transactions"];
               value = [ethereum.selectedAddress,encoding];
               rawResponseObject = responseMaker.createResponse(key,value);
               response = responseMaker.responseMaker(rawResponseObject);
               res.send(response);
                                 
            } 
            catch(err){
              errorCode = requestTypeError.identity_transactional_hash;
              errorMessage =  helper.error(errorCode,err);
              response = responseMaker.responseErrorMaker(errorCode,errorMessage);
              res.send(response);                    
            }
    }
    catch(err)
    {
      errorCode = requestTypeError.identity;
      errorMessage = helper.error(errorCode,err);
      response = responseMaker.responseErrorMaker(errorCode,errorMessage);
      res.send(response);
    }
  }
  set();    
});

/*Contract deploy etmek için rest api url
*Çağırım : http://ip:port/Lock
*input :{
            "address":ethereum
        }
*output: contract adresi,account,bakiye,mining durumu,gas değeri,blok sayısı*/
app.post('/ClaimSecond',function(req,res){

  var set = async() => {
    try{
            let ethereum = JSON.stringify(req.body.address);
            let result;
            try{

              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: ethereum.selectedAddress, 
                to:TokenAddress
              });
            
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: ethereum.selectedAddress, 
                to:LockAddress
              });
            
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: ethereum.selectedAddress, 
                to:DistributionAddress
              });
   
              let getDurationOflockTimeforPerson =  await MyContractLock.methods.getDurationOflockTimeforPerson().call({from:ethereum.selectedAddress});
              let idoTime = await MyContractDistribution.methods.canRigtForDistribution().call({from:ethereum.selectedAddress});
 
                if(getDurationOflockTimeforPerson[0] <= idoTime[0]){
                  if(getDurationOflockTimeforPerson[0]  == getDurationOflockTimeforPerson[1] ){ // kilitleme bozulmamış
                    result.message = "you have rights for distribution"
                    result.succes = true;
                  }
                  else if(getDurationOflockTimeforPerson[1] >= idoTime[1]) {
                    result.message = "you have rights for distribution"
                    result.succes = true;
                  }
                  else{
                    result.message = "you have not rights for distribution"
                    result.succes = false;
                  }
                }
                
                else{
                  result.message = "you have not rights for distribution"
                  result.succes = false;
                }

                if(result.succes === false){
                  key = ["account","result","transactions"];
                  value = [ethereum.selectedAddress,"you have not rights for distribution",[]];
                  rawResponseObject = responseMaker.createResponse(key,value);
                  response = responseMaker.responseMaker(rawResponseObject);
                  res.send(response);
                }

                var encodedstartDistribution =  await MyContractDistribution.methods.startDistribution().encodeABI();
                let _paramsstartDistribution = {
                 data: encodedstartDistribution,
                 gasLimit:'3000000',
                 gas:'63262',
                 from:ethereum.selectedAddress,
                 to:DistributionAddress
                 }

                 let encoding = [_paramsstartDistribution];
             
 
                 key = ["account","result","transactions"];
                 value = [ethereum.selectedAddress,"",encoding];
                 rawResponseObject = responseMaker.createResponse(key,value);
                 response = responseMaker.responseMaker(rawResponseObject);
                 res.send(response);
                                 
            } 
            catch(err){
              errorCode = requestTypeError.identity_transactional_hash;
              errorMessage =  helper.error(errorCode,err);
              response = responseMaker.responseErrorMaker(errorCode,errorMessage);
              res.send(response);                    
            }
    }
    catch(err)
    {
      errorCode = requestTypeError.identity;
      errorMessage = helper.error(errorCode,err);
      response = responseMaker.responseErrorMaker(errorCode,errorMessage);
      res.send(response);
    }
  }
  set();    
});



app.listen(6000,()=>{
  console.log(6000+"listening");
});
