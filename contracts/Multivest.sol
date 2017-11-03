pragma solidity 0.4.15;

import "./Ownable.sol";
import "./AbstractLockedAddress.sol";


contract Multivest is Ownable {
    /* public variables */
    mapping(address => bool) public allowedMultivests;

    mapping(address => uint256) public allowedContributors;

    /* events */
    event MultivestSet(address multivest);

    event MultivestUnset(address multivest);

    AbstractLockedAddress public lockedAddress;

    modifier onlyMultivests(address _addresss) {
        require(allowedMultivests[_addresss] == true);
        _;
    }

    /* constructor */
    function Multivest(address multivest) {
        allowedMultivests[multivest] = true;
    }

    function setAbstractLockedAddress(AbstractLockedAddress _value) public onlyOwner {
        lockedAddress = _value;
    }

    /* public methods */
    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
    }

    function acceptMultivestBuy(address _address, uint256 _value) public onlyMultivests(msg.sender) {
        allowedContributors[_address] = _value;
    }

    function burn(address _address) public onlyOwner {
        require(lockedAddress.isAddressLocked(_address));
        allowedContributors[_address] = 0;
    }

    function multivestBuy(
        bytes32 _hash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        bool _locked
    ) public payable onlyMultivests(verify(_hash, _v, _r, _s)) {
        require(_hash == keccak256(msg.sender, _locked));
        require(allowedContributors[msg.sender] >= msg.value);

        bool status = buy(msg.sender, msg.value, _locked);

        require(status == true);
    }

    function verify(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        return ecrecover(keccak256(prefix, _hash), _v, _r, _s);
    }

    function buy(address _address, uint256 _value, bool _locked) internal returns (bool);
}