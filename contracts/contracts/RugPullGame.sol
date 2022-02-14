// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract RugPullGame is Ownable {
    event Pump(address payable[] bidders, uint256 balance);
    event RugPull(address payable[] bidders, uint256 reward);

    uint256 public constant PUMP_FEE = 1 ether;
    uint256 public constant RUG_PULL_BLOCKS = 10;

    uint256 private lastPumpBlock = 0;
    address payable[] private lastPumpers;

    function pump() external payable {
        require(msg.value >= PUMP_FEE, "Pump fee must be at least 1 ether");

        if (lastPumpBlock != block.number) {
            delete lastPumpers;
            lastPumpBlock = block.number;
        }

        lastPumpers.push(payable(msg.sender));

        emit Pump(lastPumpers, address(this).balance);
    }

    function getLastPumpers() public view returns(address payable[] memory) {
        return lastPumpers;
    }

    function pullTheRug() external {
        require(
            block.number >= lastPumpBlock + RUG_PULL_BLOCKS,
            "At least 10 blocks must pass before a rug pull"
        );

        uint256 reward = address(this).balance / lastPumpers.length;
        for (uint256 i = 0; i < lastPumpers.length; i++) {
            lastPumpers[i].transfer(reward);
        }

        emit RugPull(lastPumpers, reward);

        delete lastPumpers;
    }
}
