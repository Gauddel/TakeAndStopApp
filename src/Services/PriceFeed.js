import ethers from 'ethers';
import EthereumConnexion from './../Services/EthereumConnexion';

const PriceFeedMockETHUSD = require("../pre-compiles/PriceFeedMockETHUSD.json");
const PriceFeedMockETHUSDAddress = "0xB02aFF0C00a60AeB06A7b12c82214e08cCD5499f";

class PriceFeed {
    async isEthereumConnexionInit() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
    }

    getPriceFeederContract(signer) {
        return new ethers.Contract(PriceFeedMockETHUSDAddress, PriceFeedMockETHUSD.abi, signer);
    }

    async getETHUSDRawPrice() {
        await this.isEthereumConnexionInit();
        let signer = await EthereumConnexion.GetInstance().signer;
        let priceFeed = this.getPriceFeederContract(signer);
        return priceFeed.getLatestPriceToken0();
    }

    async getETHUSDPrice() {
        let price = this.getETHUSDRawPrice();
        return Math.floor(Number(ethers.utils.formatUnits(await price, 18) * 100)) / 100;;
    }

    async mock(limit) {
        await this.isEthereumConnexionInit();
        let signer = await EthereumConnexion.GetInstance().signer;
        let priceFeed = this.getPriceFeederContract(signer);
        let price = await this.getETHUSDPrice();
        let adjustmentValue = await this.getDiffPlusDelta(price, limit);
        let res = await priceFeed.mock(adjustmentValue);
        res.wait();
    }

    async getDiffPlusDelta(a, b) {
        // Delta will be 10 ** 18
        return ethers.utils.parseUnits(String(a), 18).sub(ethers.utils.parseUnits(String(b), 18)).add(ethers.utils.parseUnits("10", 18));
    }
}

export default PriceFeed;