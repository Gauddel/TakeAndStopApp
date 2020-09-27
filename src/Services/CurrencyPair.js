import ethers from 'ethers';
import EthereumConnexion from './EthereumConnexion';
import PriceFeed from "./../pre-compiles/IPriceFeed.json";

const TokenPair = [
    {
        name : "ETH/USD",
        token0 : "EUR",
        token1 : "USD",
        contractAddress : "", // To set after the deployement of the contract.
        unitAmount : "10000000000000000",
    },
]

class CurrencyPair {

    async getPrice(tokenPairName, token) {
        if (EthereumConnexion.GetInstance().provider === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }

        var tokenPair = TokenPair.find((tp) => tp.name === tokenPairName);
        if(tokenPair === undefined) {
            console.error('Take&Stop : This token pair is not available.');
            return;
        }

        var priceFeed = new ethers.Contract(tokenPair.contractAddress, PriceFeed.abi, EthereumConnexion.GetInstance().provider);

        if(token === tokenPair.token0) {
            return await this.getToken0Price(priceFeed);
        }
        if(token === tokenPair.token1) {
            return await this.getToken1Price(priceFeed);
        }
    }

    async getToken0Price(priceFeed) {
        return await priceFeed.getLatestPriceToken0();
    }

    async getToken1Price(priceFeed) {
        return await priceFeed.getLatestPriceToken1();
    }

    async getMethodName(tokenPairName, token) {
        var tokenPair = TokenPair.find((tp) => tp.name === tokenPairName);
        if(tokenPair === undefined) {
            console.error('Take&Stop : This token pair is not available.');
            return;
        }
        if(token === tokenPair.token0) {
            return "getLatestPriceToken0";
        }
        if(token === tokenPair.token1) {
            return "getLatestPriceToken1";
        }
    }

    async getPriceFeedAddress(tokenPairName) {
        return TokenPair.find((tp) => tp.name === tokenPairName).contractAddress;
    }

    async getPriceFeedUnitAmount(tokenPairName) {
        return TokenPair.find((tp) => tp.name === tokenPairName).unitAmount;
    }
}

export default CurrencyPair;