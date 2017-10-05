pragma solidity ^0.4.13;

import './Ownable.sol';

contract Multivest is Ownable {
    /* public variables */
    mapping(address => bool) public allowedMultivests;

    /* events */
    event MultivestSet(address multivest);
    event MultivestUnset(address multivest);

    event Debug(string s, address v);
    event DebugU(string s, uint256 v);
    event DebugB(string s, bytes32 v);

    /* modifier */
    modifier onlyPayloadSize(uint numwords) {
        assert(msg.data.length == numwords * 32 + 4);
        _;
    }

    /* constructor */
    function Multivest(address multivest) {
        allowedMultivests[multivest] = true;
    }

    /* public methods */
    function setAllowedMultivest(address _address) onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) onlyOwner {
        allowedMultivests[_address] = false;
    }

    function buy(address _address, uint256 value) internal returns (bool);

    function multivestBuy(bytes32 hash, uint8 v, bytes32 r, bytes32 s) payable {
        require(hash == sha3(msg.sender));
        require(allowedMultivests[verify(hash, v, r, s)] == true);

        bool status = buy(msg.sender, msg.value);

        require(status == true);
    }

    function verify(bytes32 hash, uint8 v, bytes32 r, bytes32 s) constant returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        return ecrecover(sha3(prefix, hash), v, r, s);
    }
}