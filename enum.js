const requestTypeError = {
   
    account_create  : "account yaratılırken hata oluştu.",
    contract_deploy : "sözleşme deploy edilirken hata oluştu.",
    identity        : "blockchain üzerine veri gönderilirken hata oluştu.",
    identity_transactional : "blockchain üzerine veri gönderirken transaction seviyesinde hata oluştu.",
    identity_transactional_hash : "blockchain üzerine veri gönderirken transaction seviyesinde hash hatası oluştu.",
    hash_get        : "blockchain üzerinden veri getirilirken hata oluştu."
}

module.exports =  requestTypeError;