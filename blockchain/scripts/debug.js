const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const c = await hre.ethers.getContractAt(
    "CertificateRegistry",
    CONTRACT_ADDRESS
  );

  console.log("Before:", await c.authorizedIssuer(ACCOUNT));

  const tx = await c.authorizeIssuer(ACCOUNT);
  await tx.wait();

  console.log("After:", await c.authorizedIssuer(ACCOUNT));
}

main().catch(console.error);
