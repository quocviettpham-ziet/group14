import { BrowserProvider } from "ethers";
import { useState } from "react";

export function useWallet() {
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState<string>("");

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert("Chưa cài MetaMask");
      return;
    }

    const provider = new BrowserProvider((window as any).ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    setProvider(provider);
    setSigner(signer);
    setAccount(address);
  };

  return { connectWallet, provider, signer, account };
}
