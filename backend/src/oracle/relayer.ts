import { ethers } from "ethers";
import { env } from "../config/env.js";

const ORACLE_ABI = ["function updatePrice(string skinId,uint256 price,bytes signature)"];

export class OracleRelayer {
  private wallet: ethers.Wallet | null;
  private provider: ethers.Provider | null;

  constructor() {
    if (env.oraclePrivateKey && env.oracleRpcUrl) {
      this.provider = new ethers.JsonRpcProvider(env.oracleRpcUrl);
      this.wallet = new ethers.Wallet(env.oraclePrivateKey, this.provider);
    } else {
      this.provider = null;
      this.wallet = null;
    }
  }

  isReady(): boolean {
    return Boolean(this.wallet && this.provider);
  }

  async signPrice(skinId: string, price: number): Promise<string> {
    if (!this.wallet) {
      throw new Error("Relayer wallet not configured");
    }
    const payloadHash = ethers.solidityPackedKeccak256(
      ["string", "uint256"],
      [skinId, Math.round(price * 100)]
    );
    return await this.wallet.signMessage(ethers.getBytes(payloadHash));
  }

  async updatePrice(skinId: string, price: number, signature: string): Promise<string> {
    if (!this.wallet || !env.oracleAdapterAddress) {
      throw new Error("Oracle adapter not configured");
    }
    const contract = new ethers.Contract(env.oracleAdapterAddress, ORACLE_ABI, this.wallet);
    const tx = await contract.updatePrice(skinId, Math.round(price * 100), signature);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

}
