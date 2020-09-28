import React from 'react';
import { GetEvents } from '../Utils/GetEvents';
import EthereumConnexion from '../Services/EthereumConnexion';
import PriceFeed from '../Services/PriceFeed';
import DefiSmartAccount from '../Services/DefiSmartAccount';
import ConditionStopLoss from './../pre-compiles/ConditionCompareAssetPriceForStopLoss.json';
import PriceFeedJson from './../pre-compiles/PriceFeedMockETHUSD.json';
import AbiEncoder from './../Utils/AbiEncoder';
import { ethers} from 'ethers';

const DAI_TOKEN_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"; // MAINNET
const ConditionStopLossAddress = "0xEd9D452D1755160FeCd6492270Bb67F455b6b78E"; // Need to be filled after the deployement of Condition contract
const PriceFeedMockETHUSDAddress = "0xB02aFF0C00a60AeB06A7b12c82214e08cCD5499f";

class StopLoss extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            token0Balance : 0,
            token1Balance : 0,
            oraclePrice : 0,
            limit : null,
            amount : null
        }

        this.handleLimitValueChange = this.handleLimitValueChange.bind(this);
        this.handleAmountValueChange = this.handleAmountValueChange.bind(this);
        this.submitStopLoss = this.submitStopLoss.bind(this);
        this.submitStopLossAsync = this.submitStopLossAsync.bind(this);
        this.mockPrice = this.mockPrice.bind(this);
        this.mockPriceAsync = this.mockPriceAsync.bind(this);
        this.getAndUpdateEtherBalance = this.getAndUpdateEtherBalance.bind(this);
        this.getAndUpdateDaiBalance = this.getAndUpdateDaiBalance.bind(this);
        this.getAndUpdateOraclePrice = this.getAndUpdateOraclePrice.bind(this);
        this.init = this.init.bind(this);

        this.init();
    }

    async init() {
        this.getAndUpdateOraclePrice();
        this.getAndUpdateDaiBalance();
        this.getAndUpdateEtherBalance();
        
        setInterval(this.getAndUpdateOraclePrice, 3 * 1000);
        setInterval(this.getAndUpdateDaiBalance, 3 * 1000);
        setInterval(this.getAndUpdateEtherBalance, 3 * 1000);
    }

    async getConditionStateMock() {
        if (EthereumConnexion.GetInstance().provider === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }

        var conditionStopLoss = new ethers.Contract(ConditionStopLossAddress, ConditionStopLoss.abi, EthereumConnexion.GetInstance().signer);   
        var data = await conditionStopLoss.getConditionData(
            PriceFeedMockETHUSDAddress,
             AbiEncoder.AbiEncodeWithSelector({
                abi: PriceFeedJson.abi,
                functionname: "getLatestPriceToken0", // Hardcoded just for the hackathon
            }),
            ethers.utils.parseUnits(String(parseFloat(this.state.limit)), 18)
        );
        var res = await conditionStopLoss.ok(0, data, 0);
        console.log(res);
    }

    getAndUpdateOraclePrice() {
        this.getOraclePrice().then((price) => {
            this.setState({
                oraclePrice: String(price)
            })
        })
        this.forceUpdate();
    }

    getAndUpdateDaiBalance() {
        this.getDaiBalance().then((balance) => {
            this.setState({
                token1Balance: String(balance)
            })
        })
        this.forceUpdate();
    }

    getAndUpdateEtherBalance() {
        this.getEtherBalance().then((balance) => {
            this.setState({
                token0Balance: String(balance)
            })
        })
        this.forceUpdate();
    }

    async isEthereumConnexionInit() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
    }

    async getEtherBalance() { // token0 is ETH
        await this.isEthereumConnexionInit();
        return await EthereumConnexion.GetInstance().getBalance();
    }

    async getDaiBalance() {
        await this.isEthereumConnexionInit();
        return await EthereumConnexion.GetInstance().getTokenBalance(DAI_TOKEN_ADDRESS);
    }

    async getOraclePrice() {
        let priceFeed = new PriceFeed();
        return priceFeed.getETHUSDPrice();
    }

    handleLimitValueChange(events) { 
        this.setState({
            limit: events.target.value
        })
    }

    handleAmountValueChange(events) { 
        this.setState({
            amount: events.target.value
        })
    }

    submitStopLoss() {
        var errorMsg = '';
        if(this.state.limit === null && parseFloat(this.state.limit) === NaN) {
            errorMsg = 'Limit value is incorrect.';
        }

        if(this.state.amount === null && parseFloat(this.state.amount) === NaN && parseFloat(this.state.amount) < 0.01) {
            errorMsg = errorMsg + ', ' +  'Limit value is incorrect.';
        }

        if (errorMsg !== '') {
            window.alert(errorMsg);
            return;
        }

        this.submitStopLossAsync();
    }

    async submitStopLossAsync() {
        var dsa = new DefiSmartAccount();
        await dsa.submitTaskStopLoss(this.state.limit, this.state.amount);
    }

    mockPrice() { 
        if(this.state.limit === null && parseFloat(this.state.limit) === NaN) {
            window.alert('Limit value is incorrect.');
            return;
        }
        // To respect the condition for execution
        this.mockPriceAsync();
    }

    async mockPriceAsync() {
        let priceFeed = new PriceFeed();
        await priceFeed.mock(this.state.limit);
        await this.getConditionStateMock();
    }

    cancel() {
        this.cancelAsync();
    }
    async cancelAsync() {
        var dsa = new DefiSmartAccount();
        await dsa.cancel();
        console.log(await dsa.getBalance())
    }

    render() {
        return (<div className="flex items-center justify-center h-screen">
        <div className="max-w-md w-full rounded-lg overflow-hidden shadow-2xl">
            <div className="rounded-t-lg border border-solid border-gray-900 border-opacity-25 pt-12 pb-3 px-4">
                <div className="flex w-full">
                    <div className="flex items-center w-1/2">
                        <div className="flex items-center justify-center w-1/3">
                            <img className="w-10 " src="./ether_logo.png" alt="Ether"/>

                        </div>
                        <div className="flex items-center justify-center w-2/3">
                            <h1 className="text-5xl font-bold text-opacity-75 text-blue">{this.state.token0Balance}</h1>
                        </div>
                    </div>
                    <div className="flex items-center w-1/2">
                        <div className="flex items-center justify-center w-2/3">
                            <h1 className="text-5xl font-bold text-gray-800">{this.state.token1Balance}</h1>
                        </div>
                        <div className="flex items-end justify-center w-1/3">
                            <img className="w-10 bg-white" src="./dollars_logo.png" alt="dollar"/>

                        </div>
                    </div>
                 </div>
                 <div className="flex items-center justify-center">
                    <div className="font-bold text-lg mb-2 text-gray-800">{this.state.oraclePrice} $</div>
                </div>
            </div>
        <div className="flex items-center justify-center px-6 py-4">
          <div className="font-bold text-2xl mb-2 text-gray-800">Stop Loss</div>
        </div>
        <div className="flex items-center justify-center px-6 py-4">
            <input value={this.state.limit} onChange={this.handleLimitValueChange} className="bg-gray-100 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
         id="inline-full-name" type="number" placeholder="Stop Loss value"/>
        </div>
        <div className="flex items-center justify-center px-6 py-4">
            <input value={this.state.amount} onChange={this.handleAmountValueChange} className="bg-gray-100 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
         id="inline-full-name" type="number" placeholder="Amount"/>
        </div>
        <div className="flex items-center justify-center px-6 py-4">
          <button onClick={() => this.submitStopLoss()} className="bg-purple bg-opacity-75 w-full hover:bg-purple text-gray-100 font-bold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg">Submit</button>
        </div>
        <div className="flex items-center justify-center px-6 pb-4">
          <button onClick={() => this.mockPrice()} className="w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm">Mock</button>
        </div>
        <div className="flex items-center justify-center px-6 pb-4">
          <button onClick={() => this.cancel()} className="w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm">Cancel</button>
        </div>
        </div>
      </div>)
    }
}

export default StopLoss;