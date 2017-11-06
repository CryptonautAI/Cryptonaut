pragma solidity 0.4.15;


import "./Ownable.sol";
import "./SafeMath.sol";
import "./AbstractLockedAddress.sol";


contract TokenRecipient {
    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) public;
}


/*
    ERC20 compatible smart contract
*/
contract ERC20 is Ownable, AbstractLockedAddress {
    //contract ERC20 is Ownable {

    using SafeMath for uint256;

    /* Public variables of the token */
    string public standard = "ERC20 0.1";

    string public name;

    string public symbol;

    uint8 public decimals;

    uint256 public totalSupply;

    uint256 public creationBlock;

    bool public locked;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;

    mapping (address => mapping (address => uint256)) public allowance;

    mapping (address => bool) public lockedAddresses;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    modifier onlyPayloadSize(uint _numwords) {
        assert(msg.data.length == _numwords.mul(32).add(4));
        _;
    }

    modifier fromUnlockedAddresses(address _address) {
        require(lockedAddresses[_address] != true);
        _;
    }

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function ERC20(
        uint256 _initialSupply,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        bool _transferAllSupplyToOwner,
        bool _locked
    ) {
        totalSupply = _initialSupply;

        if (_transferAllSupplyToOwner) {
            balanceOf[msg.sender] = _initialSupply;
        } else {
            balanceOf[this] = _initialSupply;
        }

        name = _tokenName;
        // Set the name for display purposes
        symbol = _tokenSymbol;
        // Set the symbol for display purposes
        decimals = _decimalUnits;
        // Amount of decimals for display purposes
        locked = _locked;
        creationBlock = block.number;
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) public onlyPayloadSize(2) fromUnlockedAddresses(msg.sender) {
        require(locked == false);

        bool status = transferInternal(msg.sender, _to, _value);

        require(status == true);
    }

    /* Approve */
    function approve(
        address _spender,
        uint256 _value
    ) public onlyPayloadSize(2) fromUnlockedAddresses(msg.sender) returns (bool success) {
        if (locked) {
            return false;
        }

        allowance[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);

        return true;
    }

    /* Approve and then communicate the approved contract in a single tx */
    function approveAndCall(
        address _spender,
        uint256 _value,
        bytes _extraData
    ) public fromUnlockedAddresses(msg.sender) returns (bool success) {
        if (locked) {
            return false;
        }

        TokenRecipient spender = TokenRecipient(_spender);

        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }

        return false;
    }

    /* A contract attempts to get the coins */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public fromUnlockedAddresses(_from) returns (bool success) {
        if (locked) {
            return false;
        }

        if (allowance[_from][msg.sender] < _value) {
            return false;
        }

        bool _success = transferInternal(_from, _to, _value);

        if (_success) {
            allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        }

        return _success;
    }

    function isAddressLocked(address _address) public constant returns (bool) {
        return lockedAddresses[_address] == true;
    }

    function setLockedAddressInternal(address _address, bool _lock) internal {
        lockedAddresses[_address] = _lock;
    }

    function transferInternal(address _from, address _to, uint256 _value) internal returns (bool success) {
        if (_value == 0) {
            Transfer(_from, _to, 0);

            return true;
        }

        if (balanceOf[_from] < _value) {
            return false;
        }

        if (balanceOf[_to].add(_value) <= balanceOf[_to]) {
            return false;
        }

        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);

        Transfer(_from, _to, _value);

        return true;
    }

}