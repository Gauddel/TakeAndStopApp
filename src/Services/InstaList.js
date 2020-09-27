import ethers from 'ethers';
import EthereumConnexion from './../Services/EthereumConnexion';

const InstaListABI = require("../pre-compiles/InstaList.json");

const InstaListAddress = "0x4c8a1BEb8a87765788946D6B19C6C6355194AbEb"; // Mainnet Address.

class InstaList {
    async isEthereumConnexionInit() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
    }

    getInstaListContract(signer) {
        return new ethers.Contract(InstaListAddress, InstaListABI.abi, signer);
    }

    async getDSAId() {
        return String((await this.getAccountList()).first);
    }

    async isDSAExist() {
        return String((await this.getAccountList()).first) !== "0";
    }

    async getDSA() {
        await this.isEthereumConnexionInit();
        let id = (await this.getAccountList()).first;
        if(String(id)!== "0") {
            let signer = await EthereumConnexion.GetInstance().signer;
            let instaList = this.getInstaListContract(signer); 
            return await instaList.accountAddr(id);
        }
    }

    async getAccountList() {
        await this.isEthereumConnexionInit();
        let signer = await EthereumConnexion.GetInstance().signer;
        let userAddress = await signer.getAddress();
        let instaList = this.getInstaListContract(signer);
        return await instaList.userLink(userAddress);
    }
}

export default InstaList;