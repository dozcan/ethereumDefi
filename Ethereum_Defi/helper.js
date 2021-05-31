var crypto = require('crypto');

//exception yakalarken mesajların daha generic olmasını sağlıyor
var error = function(par1,par2){
    var sonuc  = par1.toString() + " " + par2.toString();
    return sonuc;
}

//sha256 şifreleme algoritması uyguluyoruz şuan için kırılıması mümkün değil.
var sha256Hash = function (str,hashKey1,hashKey2){  
    var hashedStr = crypto.createHmac('sha256',str).update(hashKey1).digest('hex');
    hashedStr =  crypto.createHmac('sha256',hashedStr).update(hashKey2).digest('hex');
    return hashedStr;
}

//contract a verinin bytes tipinde gönderilmesi için tip dönüşümü yapıyoruz çünkü daha gas harcamak istiyoruz       
var byteConversion = function(blockchainData){
    console.log("iyiyiz");
    for(var i=0;i<blockchainData.length-1;i=i+2)
    {
        var s = blockchainData.substr(i,2);
        bytes.push(parseInt(s,16));
    }
    var data  = "0x" + blockchainData;
    console.log("cok iyiyiz");
    return data;
}

function reverseString(str){
     return str.split("").reverse().join("");
}

//reqest son string veri tipi yolladığı için çift tırnakları silmek gerekiyor 
var cleanWhiteCharacter = function(address){
     address = address.replace('"','');
     address = reverseString(address);
     address = address.replace('"','');
     address = reverseString(address);
     return address;
}
var bin2string = function bin2string(array){
	var result = "";
	for(var i = 0; i < array.length; ++i){
		result+= (String.fromCharCode(array[i]));
	}
	return result;
}

module.exports = {
    error,
    sha256Hash,
    cleanWhiteCharacter,
    byteConversion,
    bin2string
};

