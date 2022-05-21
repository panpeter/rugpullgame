// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RugPullGame is Ownable, ReentrancyGuard {
    struct Action {
        address payable sender;
        uint256 block;
        uint256 balance;
        bool rugPull;
    }

    event PumpEvent(address payable sender, uint256 balance);
    event RugPullEvent(address payable sender, uint256 reward);

    uint256 public constant PUMP_FEE = 0.005 ether;
    uint256 public constant RUG_PULL_BLOCKS = 20;
    uint256 public constant START_BLOCK = 5;
    uint256 public constant DEV_COMMISSION_DIV = 50; // 2%

    address payable private devAddress;

    Action[] private actions;

    constructor() Ownable() {
        devAddress = payable(owner());
    }

    function pump() external nonReentrant payable {
        require(msg.value >= PUMP_FEE, "Pump fee must be at least 0.005 BNB");
        require(block.number >= START_BLOCK, "Game has not started yet");

        if (actions.length > 0) {
            Action memory lastAction = actions[actions.length - 1];
            require(!lastAction.rugPull, "Game has finished");
        }

        uint256 balance = address(this).balance;
        address payable sender = payable(msg.sender);

        actions.push(Action(sender, block.number, balance, false));

        emit PumpEvent(sender, balance);
    }

    function rugPull() external nonReentrant {
        require(actions.length > 0, "There is no pump");
        Action memory lastAction = actions[actions.length - 1];
        require(!lastAction.rugPull, "Game has finished");
        require(
            block.number >= lastAction.block + RUG_PULL_BLOCKS,
            "At least 20 blocks must pass before a rug pull"
        );

        uint256 balance = address(this).balance;
        uint256 devReward = balance / DEV_COMMISSION_DIV;
        uint256 pumperReward = balance - devReward;

        devAddress.transfer(devReward);
        lastAction.sender.transfer(pumperReward);

        actions.push(Action(lastAction.sender, block.number, balance, true));

        emit RugPullEvent(lastAction.sender, balance);
    }

    function setDevAddress(address payable _address) onlyOwner external {
        devAddress = _address;
    }

    function getActions() external view returns(Action[] memory) {
        return actions;
    }

    receive() external payable {
        // Allow to bootstrap the game.
    }

    fallback() external payable {
        // Allow to bootstrap the game.
    }
}
