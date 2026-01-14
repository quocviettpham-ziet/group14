const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.getContractAt(
    "CertificateRegistry",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );

  const issuer = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const tx = await contract.authorizeIssuer(issuer);
  await tx.wait();

  console.log("Authorized issuer:", issuer);
}

main();
