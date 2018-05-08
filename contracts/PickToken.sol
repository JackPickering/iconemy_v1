pragma solidity 0.4.21;

/*
 * This token is part of Pickeringware ltds smart contracts
 * It is used to specify certain details about the token upon release
 */

import './MintableToken.sol';

contract PickToken is MintableToken {
  string public name;
  string public symbol;
  uint8 public decimals;

  function PickToken(string _name, string _symbol, uint8 _decimals) public { 
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}