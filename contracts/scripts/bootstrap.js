async function main() {
    const [owner] = await ethers.getSigners();

    const transactionHash = await owner.sendTransaction({
        to: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        value: ethers.utils.parseEther("2.0"), // Sends exactly 1.0 ether
    });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
