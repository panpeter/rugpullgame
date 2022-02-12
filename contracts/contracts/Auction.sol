//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Auction {
    event Bid(address payable[] bidders, uint256 balance);
    event Award(address payable[] bidders, uint256 reward);

    uint256 public constant BID_PRICE = 1 ether;
    uint256 public constant CLAIM_BLOCKS = 10;

    uint256 private lastBidBlock = 0;
    address payable[] private lastBidders;

    function bid() external payable {
        require(msg.value >= BID_PRICE, "Bid price must be 1 ether or more");

        if (lastBidBlock != block.number) {
            delete lastBidders;
            lastBidBlock = block.number;
        }

        lastBidders.push(payable(msg.sender));

        emit Bid(lastBidders, address(this).balance);
    }

    function getLastBidders() public view returns(address payable[] memory) {
        return lastBidders;
    }

    function claim() external {
        require(
            block.number >= lastBidBlock + CLAIM_BLOCKS,
            "At least 10 blocks must pass before a claim is made"
        );

        uint256 reward = address(this).balance / lastBidders.length;
        for (uint256 i = 0; i < lastBidders.length; i++) {
            lastBidders[i].transfer(reward);
        }

        emit Award(lastBidders, reward);

        delete lastBidders;
    }
}
