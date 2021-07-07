const helper = require('./helper.js');
const responseMaker =require('./responseMaker.js');
const requestTypeError = require('./enum.js');
const Web3 = require('web3');
const abis = require('./abi.js');
const http = require('http')

const web3 = new Web3('https://data-seed-prebsc-2-s1.binance.org:8545/');
var TokenAddress  = "0xA073B373572f3E6d60daE92057F35c80e204b5Ee"
var LockAddress  = "0xc5a890232493E7eF3744b8f5C4FdFa98a8c47674"
var DistributionAddress = "0xB816e66302592E0700bAbE6b712E124320571696"

var express = require('express')
var cors = require('cors')
var app = express()

app.use(cors())

let errorMessage;
let errorCode;
var rawResponseObject;
var key;
var value ;

/*Account yaratmak için rest api url
*Çağırım : http://ip:port/AddressSituation
*input : {address:ethereum}
*output: account adresi, privateKey*/
app.post('/AddressSituation',  function(req,res){ 
  var create = async() =>{
    try
    {
      console.log("istek geldi1")
      let body = JSON.stringify(req.body.address);
      let ethereum = JSON.parse(body);
      let personAddress = ethereum.selectedAddress;
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

    console.log("istek geldi2")
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
      console.log("istek geldi2",response)
      res.send(response);
    }
    catch(err)
    {
     console.log("istek geldi4",err)
      errorCode = requestTypeError.AddressSituation;
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
              
              let body = JSON.stringify(req.body.address);
              let ethereum = JSON.parse(body);
              let personAddress = ethereum.selectedAddress;
              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: personAddress, 
                to:TokenAddress
              });
              console.log("2")
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: personAddress, 
                to:LockAddress
              });
              console.log("3")
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from:personAddress, 
                to:DistributionAddress
              });
              console.log("4")
              var bakiye =  await MyContractToken.methods.balanceOf(personAddress).call({from:personAddress});           
             
              bakiye = Number.parseInt(bakiye);
              tierIndex = Number.parseInt(tierIndex);
              if(tierIndex === 1 && bakiye < 15000){
                key = ["account","result","transactions"];
                value = [personAddress,"balance is not enough for specified tier-1",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
              else if(tierIndex === 2 && bakiye < 20000){
                key = ["account","result","transactions"];
                value = [personAddress,"balance is not enough for specified tier-2",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);

              }
              else if(tierIndex === 3 && bakiye < 30000){
                key = ["account","result","transactions"];
                value = [personAddress,"balance is not enough for specified tier-3",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);

              }
              
              //lock-2
              var canBeLockable =  await MyContractLock.methods.canBeLockable().call({from:personAddress});
              if(canBeLockable){
                key = ["account","result","transactions"];
                value = [personAddress,"address made lock before so you cant lock again",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
               
              //lock-3
              var ifNestFull =  await MyContractLock.methods.ifNestFull(nestIndex).call({from:personAddress});
              let par1 = Number.parseInt(ifNestFull[0]);
              let par2 = Number.parseInt(ifNestFull[1]);
              let par3 = Number.parseInt(ifNestFull[2]);
              if(par1 + par2 + par3 === 375){
                key = ["account","result","transactions"];
                value = [personAddress,"selected nest is full select another nest",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
           
              //lock-4
              var ifTierFull =  await MyContractLock.methods.ifTierFull(nestIndex,tierIndex).call({from:personAddress});
              ifTierFull = Number.parseInt(ifTierFull);
              if(ifTierFull === 125){
                key = ["account","result","transactions"];
                value = [personAddress,"selected tier is full select another tier",[]];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
              }
               
              if(tierIndex === 1){
                lockAmount = 15000;
              }
              else if(tierIndex === 2){
                lockAmount = 20000;
              }
              else if(tierIndex === 3){
                lockAmount = 30000;
              }
          
              var encodedToken =  await MyContractToken.methods.approve(LockAddress,lockAmount).encodeABI();
              let _paramsToken = {
                 data: encodedToken,
                 gasLimit:'3000000',
                 gas:'63262',
                 from:personAddress,
                 to:TokenAddress
               }

               var encodedToken2 =  await MyContractLock.methods.lock(nestIndex,tierIndex).encodeABI();
                let _paramsToken2 = {
                data: encodedToken2,
                gasLimit:'3000000',
                gas:'63262',
                from:personAddress,
                to:LockAddress
                }
               
                let encoding = [_paramsToken,_paramsToken2];


                key = ["account","result","transactions"];
                value = [personAddress,"",encoding];
                rawResponseObject = responseMaker.createResponse(key,value);
                response = responseMaker.responseMaker(rawResponseObject);
                res.send(response);
                                 
            } 
            catch(err){
                errorCode = requestTypeError.Lock;
                errorMessage =  helper.error(errorCode,err);
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
   
            let body = JSON.stringify(req.body.address);
            let ethereum = JSON.parse(body);
            let personAddress = ethereum.selectedAddress;
            let result={};
            try{
              
              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: personAddress, 
                to:TokenAddress
              });
              console.log("2")
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: personAddress, 
                to:LockAddress
              });

              console.log("3")
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: personAddress,
                to:DistributionAddress
              });
              console.log("4")
              let canBeClaimableDate =  await MyContractLock.methods.canBeClaimable().call({from:personAddress});
              console.log("canBeClaimableDate",canBeClaimableDate);
              let start = new Date(canBeClaimableDate*1000);
              var end = Date.now()
            
              const date1 = new Date(start);
              const date2 = new Date(end);
          
              const oneDay = 1000 * 60 * 60 * 24;
              const diffInTime = date2.getTime() - date1.getTime();
              const diffInDays = Math.round(diffInTime / oneDay);	
         
              console.log(date1,date2,diffInDays);

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
              value = [personAddress,result];
              rawResponseObject = responseMaker.createResponse(key,value);
              response = responseMaker.responseMaker(rawResponseObject);
              res.send(response);

                                 
            } 
            catch(err){
              console.log("1")
              errorCode = requestTypeError.ClaimInformation;
              console.log("2")
              errorMessage =  helper.error(errorCode,err);
              console.log("3")
              response = responseMaker.responseErrorMaker(errorCode,errorMessage);
              console.log("4")
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
              let body = JSON.stringify(req.body.address);
              let ethereum = JSON.parse(body);
              let personAddress = ethereum.selectedAddress;
            

              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: personAddress, 
                to:TokenAddress
              });
            
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: personAddress, 
                to:LockAddress
              });
            
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: personAddress, 
                to:DistributionAddress
              });
   
              var claimOP =  await MyContractLock.methods.claim().encodeABI();
              let paramClaim= {
                 data: claimOP,
                 gasLimit:'3000000',
                 gas:'63262',
                 from:personAddress,
                 to:LockAddress
               }

               let encoding = [paramClaim];

               key = ["account","transactions"];
               value = [personAddress,encoding];
               rawResponseObject = responseMaker.createResponse(key,value);
               response = responseMaker.responseMaker(rawResponseObject);
               res.send(response);
                                 
            } 
            catch(err){
              errorCode = requestTypeError.ClaimFirst;
              errorMessage =  helper.error(errorCode,err);
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
              let body = JSON.stringify(req.body.address);
              let ethereum = JSON.parse(body);
              let personAddress = ethereum.selectedAddress;
              let result;
            
              var MyContractToken = new web3.eth.Contract(abis.abiToken, TokenAddress, {
                from: personAddress, 
                to:TokenAddress
              });
            
              var MyContractLock = new web3.eth.Contract(abis.abiLock, LockAddress, {
                from: personAddress, 
                to:LockAddress
              });
            
              var MyContractDistribution = new web3.eth.Contract(abis.abiDistribution, DistributionAddress, {
                from: personAddress, 
                to:DistributionAddress
              });
   
              let getDurationOflockTimeforPerson =  await MyContractLock.methods.getDurationOflockTimeforPerson().call({from:personAddress});
              let idoTime = await MyContractDistribution.methods.canRigtForDistribution().call({from:personAddress});
 
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
                  value = [personAddress,"you have not rights for distribution",[]];
                  rawResponseObject = responseMaker.createResponse(key,value);
                  response = responseMaker.responseMaker(rawResponseObject);
                  res.send(response);
                }

                var encodedstartDistribution =  await MyContractDistribution.methods.startDistribution().encodeABI();
                let _paramsstartDistribution = {
                 data: encodedstartDistribution,
                 gasLimit:'3000000',
                 gas:'63262',
                 from:personAddress,
                 to:DistributionAddress
                 }

                 let encoding = [_paramsstartDistribution];
             
 
                 key = ["account","result","transactions"];
                 value = [personAddress,"",encoding];
                 rawResponseObject = responseMaker.createResponse(key,value);
                 response = responseMaker.responseMaker(rawResponseObject);
                 res.send(response);
                                 
            } 
            catch(err){
              errorCode = requestTypeError.ClaimSecond;
              errorMessage =  helper.error(errorCode,err);
              response = responseMaker.responseErrorMaker(errorCode,errorMessage);
              res.send(response);                    
            }
  }
  set();    
});


app.listen(8080,()=>{
  console.log(8080+"listening");
});
