import { ethers} from 'ethers';
import GelatoCoreLib from "@gelatonetwork/core";
import EthereumConnexion from "./EthereumConnexion";

const GelatoCoreAddress = "0x1d681d76ce96E4d70a88A00EBbcfc1E47808d0b8";

class GelatoWrapper {

    async isEthereumConnexionInit() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
    }

    async getProviderStakeBigNb(provider) {
        await this.isEthereumConnexionInit();

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        return await gelatoCore.providerFunds(provider);
    }

    async getProviderStake(provider) {
        return Math.floor(Number(ethers.utils.formatUnits(await this.getProviderStakeBigNb(provider), 18) * 100)) / 100; // WAD with rouding to 2 decimals
    }
}

export default GelatoWrapper;