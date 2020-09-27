import ethers from 'ethers';
import EthereumConnexion from './../Services/EthereumConnexion';

const InstaIndexABI = require("../pre-compiles/InstaIndex.json");

const InstaIndexAddress = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723"; // Mainnet Address.

class InstaIndex {
    async isEthereumConnexionInit() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
    }

    getInstaIndexContract(signer) {
        return new ethers.Contract(InstaIndexAddress, InstaIndexABI.abi, signer);
    }

    async buildDeFiSmartAccount() {
        await this.isEthereumConnexionInit();
        let signer = await EthereumConnexion.GetInstance().signer;
        let instaIndex = this.getInstaIndexContract(signer);
        let userAddress = await signer.getAddress();
        let res = await instaIndex.functions.build(userAddress, "1", userAddress);
        await res.wait();
    }
}

export default InstaIndex;
