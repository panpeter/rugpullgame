async function main() {
  const contractFactory = await ethers.getContractFactory("Auction")

  // Start deployment, returning a promise that resolves to a contract object
  const auctionContract = await contractFactory.deploy()
  await auctionContract.deployed()
  console.log("Contract deployed to address:", auctionContract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
