pragma solidity 0.5.16;

import './SafeMath.sol';
import './anttroop.sol';

contract lockClaim {
    
    using SafeMath for uint256;
    
    
    address private contractOwner;
    address private administrator;
    address private ownerOfBep20Tokens;
    
    struct lockTime {
        uint256 start;
        uint256 end;
    }

    
    //kişi => yuva indeksi => tier_indeksi => nekadarlık kilitleme yaptığı
    
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) private lockAmountForPerson;
 
    mapping(address => lockTime) private durationOflockTimeforPerson;
    
    mapping(address=>uint256[2]) accountSituation;
    
    uint256 private counterForClaimablePerson = 0;
    
    mapping(address => bool) private registeredAddresses;
    
    uint256 public nestSize=3;
    
    mapping(uint256 => mapping(uint256 => uint256)) private personCountOnTier;
    
    ANTTROOP private _BEP20Token;
    
    modifier onlyOwner() {
        require(contractOwner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function setAdministrator(address administratorAddress) external onlyOwner(){
        administrator = administratorAddress;
    }

    constructor(address _BEP20TokenAddress) public {
         contractOwner = msg.sender;
        _BEP20Token = ANTTROOP(_BEP20TokenAddress);
    }
    
    //yuva sayısı ilerde arttırılması ihtimali için
    function updateNestSize(uint256 _nestSize) external onlyOwner returns  (bool) {
        nestSize = _nestSize;
    }
    
     //yuva sayısı ilerde arttırılması ihtimali için
    function getNestSize() external view returns  (uint256) {
        return nestSize;
    }
    
    
    //sahip olunan tüm yuvaların durumu ancak
    //ifNestFull ve ifTierFull metodlarının tekrar tekrar cagırılıp backende hesaplanıp
    //onyuze gonderilmesi ile anlasılabilinir boylede gas tüketimi olmayacaktır.
    
    //1    // aynı adres tekrar kilitleme yapamaz
    function canBeLockable() external view returns(bool){
       return registeredAddresses[msg.sender];
    }
    //2    // 375 ise yuva dolmuştur;
    function ifNestFull(uint256 nestIndex) external view returns (uint256,uint256,uint256) {
        return (personCountOnTier[nestIndex][0],personCountOnTier[nestIndex][1],personCountOnTier[nestIndex][2]);
        
    }
    //3    // tier 125 ten küçük kontrolü
    function ifTierFull(uint256 nestIndex, uint256 tierIndex) external view returns (uint256) {
         return personCountOnTier[nestIndex][tierIndex];
    }
    //4
    function getPersonNest() public view returns(uint256[2] memory) {
        return accountSituation[msg.sender];
    }
    
    
    //4 üstteki 4 metod sırası ile basarılı ise kilitleme metodu cagrılır
    //backendden cagrılan canBeLockable işleminin sonucu basarılı ise backend lock metodunu cagıracaktır. 
    function lock(uint256 nestIndex, uint256 tierIndex) external  {
        require(!registeredAddresses[msg.sender],"this address locked once; no more locking");
        require(personCountOnTier[nestIndex][0] + personCountOnTier[nestIndex][1] + 
        personCountOnTier[nestIndex][2]  < 375, "nest is full; no more locking");
        require(personCountOnTier[nestIndex][tierIndex] < 125,"tier is full; no more locking") ;
        uint256 amount;
        require(nestIndex > 0 && nestIndex <= nestSize,"wrong nestIndex indexes");
        require(tierIndex > 0 && tierIndex <= 3,"wrong tierIndex indexes");
        if(tierIndex == 1){
            amount = 15000;
        }
        else if(tierIndex == 2){
            amount = 35000;
        }
        else {
            amount = 50000;
        }
        
        require(
            _BEP20Token.transferFrom(msg.sender, address(this), amount) == true,
            "transferFrom failed, make sure you approved Ant transfer"
        );
        accountSituation[msg.sender][0] = nestIndex;
        accountSituation[msg.sender][1] = tierIndex;
        lockAmountForPerson[msg.sender][nestIndex][tierIndex] = amount; //adrese ait yuvadaki miktar;
        personCountOnTier[nestIndex][tierIndex] = personCountOnTier[nestIndex][tierIndex].add(1);
        counterForClaimablePerson = counterForClaimablePerson.add(1);
        registeredAddresses[msg.sender] = true;
        durationOflockTimeforPerson[msg.sender] = lockTime(block.timestamp,block.timestamp);
    }
    
    
    // çekme işlemi öncesi süresi dolmuşsa kesinti olmayacağı mesajı çıkacak
    // süresi dolmamışsa kesinti olacağı bilgisi verilecek;
    // sonuç backend ile kıyaslanacak sorun yoksa claim metodu çağrılacak
    // 1
    function canBeClaimable() external view returns (uint256){
        require(registeredAddresses[msg.sender],"address not rights fşr first claim");
        return durationOflockTimeforPerson[msg.sender].start;
    }
    function getRatioClaimAmount (uint256 a, uint256 b, uint256 amount) internal pure returns(uint256){
         uint256 result = amount.mul(a);
         return result.div(b);
    }
    
    function balanceafterclaim(uint256 nestIndexLocal,uint256 tierIndexLocal) public view returns(uint256){
        return lockAmountForPerson[msg.sender][nestIndexLocal][tierIndexLocal];
    }
    
    //3 sözleşmede biriken fee kesintilerini tüm insanlar claim ettikten sonra belli bir adrese gönderimi yapılır
    function claimAllBalances() public onlyOwner {
       require(counterForClaimablePerson == 0, "Still Some Person With Balances");
       uint256 allRestBalance = _BEP20Token.balanceOf(address(this));
        require(
            _BEP20Token.transfer(administrator, allRestBalance) == true,
            "claimAllBalances failed, make sure you approved Ant transfer"
        );

    }
    //2    
  
    function claim() external returns (bool){
        require(registeredAddresses[msg.sender],"address has claim right");
  
        //kullanıcını hangi yuva ve tier içerisinde kilitleme yaptığı bulunmalı;
        mapping(uint256 => mapping(uint256 => uint256))  storage s = lockAmountForPerson[msg.sender];
        uint256 nestIndexLocal=100;
        uint256 tierIndexLocal=100;
        
        for(uint256 i =1;i<=nestSize;i++){
            if(s[i][1] != 0 ){
                nestIndexLocal = i;
                tierIndexLocal = 1;
                break;
            }
            else if(s[i][2] != 0 ){
                nestIndexLocal = i;
                tierIndexLocal = 2;
                break;
            }
            else if(s[i][3] != 0 ){
                nestIndexLocal = i;
                tierIndexLocal = 3;
                break;
            }
        }
        
        require(nestIndexLocal != 100,"Error on calculation"); 
        uint256 _amountWillClaim = lockAmountForPerson[msg.sender][nestIndexLocal][tierIndexLocal];
        uint256 _lockTime = durationOflockTimeforPerson[msg.sender].start;
        if(now > _lockTime + 90 * 1 days ) {
           // _amountWillClaim = _amountWillClaim;
        }
        else if(now > _lockTime + 60 * 1 days ){
            //%95
            _amountWillClaim = getRatioClaimAmount(95,100,_amountWillClaim);
        }
        else if(now > _lockTime + 30 * 1 days ){
            //%90
            _amountWillClaim = getRatioClaimAmount(90,100,_amountWillClaim);
        }
        else if(now > _lockTime + 20 * 1 days ){
            //%80
            _amountWillClaim = getRatioClaimAmount(80,100,_amountWillClaim);
        }
        else if(now > _lockTime + 10 * 1 days ){
            //%75
            _amountWillClaim = getRatioClaimAmount(75,100,_amountWillClaim);
        }
        else if(now > _lockTime +  2 days ) {
             _amountWillClaim = getRatioClaimAmount(65,100,_amountWillClaim);
        }
        
        else if(now > _lockTime +  1 days ) {
             _amountWillClaim = getRatioClaimAmount(40,100,_amountWillClaim);
        }
        
        else{
            //%70
            _amountWillClaim = getRatioClaimAmount(70,100,_amountWillClaim);
        }
        
        require(
            _BEP20Token.transfer(msg.sender, _amountWillClaim) == true,
            "claim failed, make sure you approved Ant transfer"
        );

         accountSituation[msg.sender][0] = 0;
         accountSituation[msg.sender][1] = 0;
         lockAmountForPerson[msg.sender][nestIndexLocal][tierIndexLocal] = 0;
         personCountOnTier[nestIndexLocal][tierIndexLocal] = personCountOnTier[nestIndexLocal][tierIndexLocal].sub(1);
         lockTime storage idoTime = durationOflockTimeforPerson[msg.sender];
         idoTime.end = block.timestamp; 
         registeredAddresses[msg.sender] = false;
         counterForClaimablePerson = counterForClaimablePerson.sub(1);
        
    }
    
    function getDurationOflockTimeforPerson() external view returns(uint256,uint256){
        return (durationOflockTimeforPerson[msg.sender].start,durationOflockTimeforPerson[msg.sender].end);
    }
    
    
    //2.claim işlemi dağıtımı hesaplaması
     function isAddressClaimableForDistribution(address sender,uint256 idoStartTime,uint256 idoEndingTime) external view returns(bool,uint256) {
        uint256 start = durationOflockTimeforPerson[sender].start;
        uint256 end  = durationOflockTimeforPerson[sender].end;    
  
        //kullanıcını hangi yuva ve tier içerisinde kilitleme yaptığı bulunmalı;
        mapping(uint256 => mapping(uint256 => uint256))  storage s = lockAmountForPerson[sender];
        uint256 nestIndexLocal=100;
        uint256 tierIndexLocal=100;
        
        for(uint256 i =1;i<=nestSize;i++){
            if(s[i][1] != 0 ){
                nestIndexLocal = i;
                tierIndexLocal = 1;
                break;
            }
            else if(s[i][2] != 0 ){
                nestIndexLocal = i;
                tierIndexLocal = 2;
                break;
            }
            else if(s[i][3] != 0 ){
                nestIndexLocal = i;
                tierIndexLocal = 3;
                break;
            }
        }
        
        require(nestIndexLocal!=100,"Error on calculation"); 
        
        if(start <= idoStartTime){
            if(start == end){ // kilitleme bozulmamış
              return (true,tierIndexLocal);
            }
            else if(end >= idoEndingTime ) {
              return (true,tierIndexLocal);
            }
            else{
              return (false,0);
            }
        }
        
        else{
            return (false,0);
        }
        
    }

}
