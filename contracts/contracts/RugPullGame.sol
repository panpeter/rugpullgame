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

    uint256 public constant PUMP_FEE_DIV = 100; // 1%
    uint256 public constant RUG_PULL_BLOCKS = 30;
    uint256 public constant DEV_COMMISSION_DIV = 10; // 10%

    uint256 public startBlock = 0;
    address payable public devAddress;

    Action[] private actions;

    constructor() Ownable() {
        devAddress = payable(owner());
    }

    function pump() external nonReentrant payable {
        require(block.number >= startBlock, "Game has not started yet");

        uint256 balance = address(this).balance;
        if (msg.value < balance) {
            uint256 minPump = (balance - msg.value) / PUMP_FEE_DIV;
            require(msg.value >= minPump, "Not enough ether send");
        }

        if (actions.length > 0) {
            Action memory lastAction = actions[actions.length - 1];
            require(!lastAction.rugPull, "Game has finished");
        }

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
            "Cannot do a rug pull just yet"
        );

        uint256 balance = address(this).balance;
        uint256 devReward = balance / DEV_COMMISSION_DIV;
        uint256 pumperReward = balance - devReward;

        devAddress.transfer(devReward);
        lastAction.sender.transfer(pumperReward);

        actions.push(Action(lastAction.sender, block.number, balance, true));

        emit RugPullEvent(lastAction.sender, balance);
    }

    function startOver(uint256 newGameStartBlock) onlyOwner external payable {
        if (actions.length > 0) {
            Action memory lastAction = actions[actions.length - 1];
            require(lastAction.rugPull, "Game has not finished yet");

            delete actions;
        }
        startBlock = newGameStartBlock;
    }

    function setDevAddress(address payable _address) onlyOwner external {
        devAddress = _address;
    }

    function getActions() external view returns(Action[] memory) {
        return actions;
    }

    receive() external payable {
        require(actions.length == 0);
        // Allow to bootstrap the game.
    }

    fallback() external payable {
        require(actions.length == 0);
        // Allow to bootstrap the game.
    }
}
