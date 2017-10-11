pragma solidity ^0.4.13;
import "./ERC20.sol";

    /*
    This contract manages the minters and the modifier to allow mint to happen only if called by minters
    This contract contains basic minting functionality though
    */

contract MintingERC20 is ERC20 {

    mapping (address => bool) public minters;
    uint256 public maxSupply;

    function MintingERC20(
        uint256 _initialSupply,
        uint256 _maxSupply,
        string _tokenName,
        uint8 _decimals,
        string _symbol,
        bool _transferAllSupplyToOwner,
        bool _locked
    )
        ERC20(_initialSupply, _tokenName, _decimals, _symbol, _transferAllSupplyToOwner, _locked)

    {
        minters[msg.sender] = true;
        maxSupply = _maxSupply;
    }

    function addMinter(address _newMinter) onlyOwner {
        minters[_newMinter] = true;
    }

    function removeMinter(address _minter) onlyOwner {
        minters[_minter] = false;
    }

    function mint(address _addr, uint256 _amount) onlyMinters returns (uint256) {
        if (_amount == uint256(0)) {
            return uint256(0);
        }
        if (totalSupply() + _amount > maxSupply) {
            return uint256(0);
        }

        initialSupply += _amount;
        balances[_addr] += _amount;
        Transfer(this, _addr, _amount);

        return _amount;
    }

    modifier onlyMinters () {
        require(true == minters[msg.sender]);
        _;
    }
}