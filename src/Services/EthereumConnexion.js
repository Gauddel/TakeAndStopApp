import { ethers, signer } from 'ethers';

require('dotenv').config();

class EthereumConnexion {

    provider;
    signer;
    static Instance;

    static GetInstance() {
        if(EthereumConnexion.Instance === undefined) {
            EthereumConnexion.Instance = new EthereumConnexion();
        }

        return EthereumConnexion.Instance;
    }

    constructor() {
    }

    async setup() {
        return window.ethereum.enable().then(()=> {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
        })
    }

    async getBalanceBigNb(accountAddress) {
        return await this.signer.provider.getBalance(accountAddress)
    }

    async getBalance(accountAddress) {
        return Math.floor(Number(ethers.utils.formatUnits(await this.getBalanceBigNb(accountAddress), 18) * 100)) / 100; // WAD with rouding to 2 decimals
    }

    async getTokenBalanceBigNb(accountAddress, tokenAddress) {
        const tokenABI = [
            "function balanceOf(address account) view returns (uint256)",
        ];

        var tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.signer);

        return await tokenContract.balanceOf(accountAddress);
    }

    async getTokenBalance(accountAddress, tokenAddress) {
        return Math.floor(Number(ethers.utils.formatUnits(await this.getTokenBalanceBigNb(accountAddress, tokenAddress), 18) * 100)) / 100;
    }
}

export default EthereumConnexion;