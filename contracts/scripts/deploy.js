async function main() {
  const contractFactory = await ethers.getContractFactory("RugPullGame")

  // Start deployment, returning a promise that resolves to a contract object
  const contract = await contractFactory.deploy()
  await contract.deployed()
  console.log("Contract deployed to address:", contract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
