import { ethers } from "ethers";
import { env } from "../config/env.js";
const ORACLE_ABI = ["function updatePrice(string skinId,uint256 price,bytes signature)"];
const BETTING_ABI = ["function resolveMatch(string matchId,string winner)"];
export class OracleRelayer {
    wallet;
    provider;
    constructor() {
        if (env.oraclePrivateKey && env.oracleRpcUrl) {
            this.provider = new ethers.JsonRpcProvider(env.oracleRpcUrl);
            this.wallet = new ethers.Wallet(env.oraclePrivateKey, this.provider);
        }
        else {
            this.provider = null;
            this.wallet = null;
        }
    }
    isReady() {
        return Boolean(this.wallet && this.provider);
    }
    async signPrice(skinId, price) {
        if (!this.wallet) {
            throw new Error("Relayer wallet not configured");
        }
        const payloadHash = ethers.solidityPackedKeccak256(["string", "uint256"], [skinId, Math.round(price * 100)]);
        return await this.wallet.signMessage(ethers.getBytes(payloadHash));
    }
    async updatePrice(skinId, price, signature) {
        if (!this.wallet || !env.oracleAdapterAddress) {
            throw new Error("Oracle adapter not configured");
        }
        const contract = new ethers.Contract(env.oracleAdapterAddress, ORACLE_ABI, this.wallet);
        const tx = await contract.updatePrice(skinId, Math.round(price * 100), signature);
        const receipt = await tx.wait();
        return receipt?.hash ?? tx.hash;
    }
    async resolveMatch(matchId, winner) {
        if (!this.wallet || !env.oracleBettingRouterAddress) {
            throw new Error("Betting router not configured");
        }
        const contract = new ethers.Contract(env.oracleBettingRouterAddress, BETTING_ABI, this.wallet);
        const tx = await contract.resolveMatch(matchId, winner);
        const receipt = await tx.wait();
        return receipt?.hash ?? tx.hash;
    }
}
