pragma solidity 0.5.16;

import './lockClaim.sol';
import './SafeMath.sol';

contract distributionClaim {
    
    using SafeMath for uint256;
    
    IBEP20 private busdToken;
    
    address private contractOwner;
    
    uint256 private idoStartTime;
    
    uint256 private idoEndingTime;
    
    lockClaim private _lockClaim;
    
    uint256 idoCount = 0; // 0 pasif 1 aktif;
    
     mapping(address => address) mappingAddressLinkedList;
     address constant guard = address(1);
     address[] addressLinkedList;
    
    modifier onlyOwner() {
        require(contractOwner == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    
    constructor(address _lockClaimAddress,IBEP20 _busdTokenAddress ) public {
         contractOwner = msg.sender;
        _lockClaim = lockClaim(_lockClaimAddress);
         busdToken = _busdTokenAddress;
    }
    
    function ifAddable() internal view returns (bool){
        if(mappingAddressLinkedList[msg.sender] == address(0)){
            return true;
        }
        else
         return false;
         
     }
    
     function addAddress() internal {
         require(ifAddable(), "cant add" );
         uint256 len = addressLinkedList.length;
         if(len == 1){
              mappingAddressLinkedList[guard] = msg.sender;
              mappingAddressLinkedList[msg.sender] = guard;
              addressLinkedList.push(msg.sender);
             
         }
         else{
             mappingAddressLinkedList[addressLinkedList[len-1]] = msg.sender;
             mappingAddressLinkedList[msg.sender] = guard;
             addressLinkedList.push(msg.sender);
            
         }
     }

       //dağıtım işlemeri

    function setIdoStart(uint256 _timestamp) external onlyOwner {
        idoStartTime  = block.timestamp;
        idoEndingTime = block.timestamp + _timestamp * 1 days;
         idoCount = 1;
        mappingAddressLinkedList[guard] = guard;
        addressLinkedList.push(guard);
    }
    
     function setIdoFinish() external onlyOwner {
         uint256 i = 0; 
        do{
          mappingAddressLinkedList[addressLinkedList[i]] = address(0);
          i++;  
        } 
        while(i<addressLinkedList.length);
         
         delete addressLinkedList;
         mappingAddressLinkedList[guard] = guard;
         addressLinkedList.push(guard);
         idoCount = 0;
    }
  
    
    //kazanılan tüm busd bakiyeleri bu metod ile bu sozleşmeye gönderilecektir.
    function transferToContractAll() public payable onlyOwner{
         uint256 amountBusd = busdToken.balanceOf(address(this));
         msg.sender.transfer(amountBusd);
    }
    
    
    function getRatioClaimAmount (uint256 a, uint256 b, uint256 amount) internal pure returns(uint256){
         uint256 result = amount.mul(a);
         return result.div(b);
    }
    
    function canRigtForDistribution() external view returns(uint256,uint256){
       return (idoStartTime,idoEndingTime);
    }
    
    //0 ise ido bitmiştr ve claim yapılamaz uyarısı cıkarılır
    //1 ise ido devam ediyor claim yapabilirsiniz uyarısı cıkarılır
    function isIdoTimeOrNot() external view returns(uint256){
        return idoCount;
    }


    //verilen tarihler arası hakeden kişinin adresi hangi tier içerisinde ise 
    // bulunur ve kişinin adresine gönderim yapılır
    function startDistribution() external payable{
        
        uint256 distributionForTier;
        require(idoCount == 1,"Not Ido Time");
        addAddress();
        
        (bool result,uint256 tierIndex) =  _lockClaim.isAddressClaimableForDistribution(msg.sender,idoStartTime,idoEndingTime);
        uint256 nestSize = _lockClaim.getNestSize();
        
        require(result,"need right for claim");//dağıtımı hesapla ve gönderim yap
        
        uint256 amountBusd = busdToken.balanceOf(address(this));
       
        uint256 totalBalance = amountBusd.div(nestSize);
        
        uint256 newTotalBalance = totalBalance.div(375);
        
        if(tierIndex == 1){
           distributionForTier = getRatioClaimAmount(15,100,newTotalBalance);
        }
        
        else if(tierIndex == 2){
             distributionForTier = getRatioClaimAmount(35,100,newTotalBalance);
        }
        
        else if(tierIndex == 3){
            distributionForTier = getRatioClaimAmount(50,100,newTotalBalance);
        }
        
        msg.sender.transfer(distributionForTier);
        
    }
    

    
    
}
