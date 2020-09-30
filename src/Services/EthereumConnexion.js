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

    async getBalance(accountAddress) {
        return Math.floor(Number(ethers.utils.formatUnits(await this.signer.provider.getBalance(accountAddress), 18) * 100)) / 100; // WAD with rouding to 2 decimals
    }

    async getTokenBalance(accountAddress, tokenAddress) {
        const tokenABI = [
            "function balanceOf(address account) view returns (uint256)",
        ];

        var tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.signer);

        return Math.floor(Number(ethers.utils.formatUnits(await tokenContract.balanceOf(accountAddress), 18) * 100)) / 100;;
    }
}

export default EthereumConnexion;