pragma solidity 0.4.15;

import "./Ownable.sol";


contract Multivest is Ownable {

    /* public variables */
    mapping(address => bool) public allowedMultivests;

    /* events */
    event MultivestSet(address multivest);

    event MultivestUnset(address multivest);

    modifier onlyMultivests(address _addresss) {
        require(allowedMultivests[_addresss] == true);
        _;
    }

    /* constructor */
    function Multivest(address multivest) {
        allowedMultivests[multivest] = true;
    }

    /* public methods */
    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
    }

    function multivestBuy(address _holder, uint256 _value, bool _locked) public onlyMultivests(msg.sender) {
        bool status = buy(_holder, _value, _locked);
        require(status == true);
    }

    function multivestBuy(
        bytes32 _hash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        bool _locked
    ) public payable onlyMultivests(verify(_hash, _v, _r, _s)) {
        require(_hash == keccak256(msg.sender, _locked));

        bool status = buy(msg.sender, msg.value, _locked);
        require(status == true);
        increaseCollectedEthers(msg.value);
    }

    function verify(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        return ecrecover(keccak256(prefix, _hash), _v, _r, _s);
    }

    function buy(address _address, uint256 _value, bool _locked) internal returns (bool);

    function increaseCollectedEthers(uint256 _value) internal returns (bool);
}