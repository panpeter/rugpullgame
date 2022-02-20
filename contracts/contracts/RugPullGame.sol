// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RugPullGame is Ownable {
    event Pump(address payable pumper, uint256 balance);
    event RugPull(address payable[] pumpers, uint256 reward);

    uint256 public constant PUMP_FEE = 1 ether;
    uint256 public constant RUG_PULL_BLOCKS = 10;

    uint256 private latestPumpBlock = 0;
    address payable[] private latestPumpers;

    function pump() external payable {
        require(msg.value >= PUMP_FEE, "Pump fee must be at least 1 MATIC");

        if (latestPumpBlock != block.number) {
            delete latestPumpers;
            latestPumpBlock = block.number;
        }

        latestPumpers.push(payable(msg.sender));

        emit Pump(payable(msg.sender), address(this).balance);
    }

    function getLatestPumpers() public view returns(address payable[] memory) {
        return latestPumpers;
    }

    function pullTheRug() external {
        require(
            block.number >= latestPumpBlock + RUG_PULL_BLOCKS,
            "At least 10 blocks must pass before a rug pull"
        );

        uint256 reward = address(this).balance / latestPumpers.length;
        for (uint256 i = 0; i < latestPumpers.length; i++) {
            latestPumpers[i].transfer(reward);
        }

        emit RugPull(latestPumpers, reward);

        delete latestPumpers;
    }
}
