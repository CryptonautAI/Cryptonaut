pragma solidity ^0.4.13;

import './Ownable.sol';
import './AbstractLockedAddress.sol';

contract tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData); }

contract ERC20 is Ownable, AbstractLockedAddress {
    /* Public variables of the token */
    string public standard;

    string public name;

    string public symbol;

    uint8 public decimals;

    uint256 public initialSupply;

    uint256 public creationBlock;

    bool public locked;

    mapping (address => uint256) public balances;

    mapping (address => mapping (address => uint256)) public allowance;

    mapping (address => bool) public lockedAddresses;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed _owner, address indexed _spender, uint _value);

    modifier onlyPayloadSize(uint numwords) {
        assert(msg.data.length == numwords * 32 + 4);
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
        standard = 'ERC20 0.1';

        initialSupply = _initialSupply;

        if (_transferAllSupplyToOwner) {
            setBalance(msg.sender, initialSupply);
        } else {
            setBalance(this, initialSupply);
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

    /* internal balances */

    function setBalance(address _holder, uint256 _amount) internal {
        balances[_holder] = _amount;
    }

    function transferInternal(address _from, address _to, uint256 _value) internal returns (bool success) {
        if (_value == 0) {
            Transfer(_from, _to, 0);
            return true;
        }

        if (balances[_from] < _value) {
            return false;
        }

        if (balances[_to] + _value <= balances[_to]) {
            return false;
        }

        setBalance(_from, balances[_from] - _value);
        setBalance(_to, balances[_to] + _value);
        
        Transfer(_from, _to, _value);

        return true;
    }

    function setLockedAddress(address _address, bool _lock) {
        lockedAddresses[_address] = _lock;
    }

    /* public methods */
    function isAddressLocked(address _address) public constant returns(bool) {
        return lockedAddresses[_address] == true;
    }

    function totalSupply() public constant returns (uint256) {
        return initialSupply;
    }

    function balanceOf(address _address) public constant returns (uint256) {
        return balances[_address];
    }

    function transfer(address _to, uint256 _value) public onlyPayloadSize(2) fromUnlockedAddresses(msg.sender) returns (bool) {
        require(locked == false);

        bool status = transferInternal(msg.sender, _to, _value);

        require(status == true);

        return true;
    }

    function approve(address _spender, uint256 _value) public fromUnlockedAddresses(msg.sender) returns (bool success) {
        if(locked) {
            return false;
        }

        allowance[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);

        return true;
    }

    function approveAndCall(address _spender, uint256 _value, bytes _extraData) public fromUnlockedAddresses(msg.sender) returns (bool success) {
        if (locked) {
            return false;
        }

        tokenRecipient spender = tokenRecipient(_spender);

        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }
    }

    function transferFrom(address _from, address _to, uint256 _value) public fromUnlockedAddresses(_from) returns (bool success) {
        if (locked) {
            return false;
        }

        if (allowance[_from][msg.sender] < _value) {
            return false;
        }

        bool _success = transferInternal(_from, _to, _value);

        if (_success) {
            allowance[_from][msg.sender] -= _value;
        }

        return _success;
    }
}
