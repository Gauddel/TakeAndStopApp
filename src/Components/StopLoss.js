import React from 'react';
import { GetEvents } from '../Utils/GetEvents';
import EthereumConnexion from '../Services/EthereumConnexion';
import PriceFeed from '../Services/PriceFeed';
import DefiSmartAccount from '../Services/DefiSmartAccount';
import GelatoWrapper from '../Services/GelatoWrapper';
import ConditionStopLoss from './../pre-compiles/ConditionCompareAssetPriceForStopLoss.json';
import PriceFeedJson from './../pre-compiles/PriceFeedMockETHUSD.json';
import AbiEncoder from './../Utils/AbiEncoder';
import { ethers} from 'ethers';
import Button from './Button';

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
            providerStake : 0,
            limit : null,
            amount : null,
            mockAllowed: true,
            creditClass : 'font-bold text-lg mb-2 text-gray-800',
            creditPrefix : 'Gelato Credit ',
            // Buy Gelato Credit button property
            creditBuyBtnLabel : 'Buy Gelato Credit',
            creditBuyBtnClass : 'mr-2 w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg',
            creditBuyBtnIsLarge : true,
            creditBuyBtnIsWaitingReceipt : false,
            creditBuyBtnIsTransactionValidated : false,
            // Submit button property
            submitBtnLabel : 'Submit',
            submitBtnClass : 'ml-2 bg-purple w-full hover:bg-purple text-gray-100 font-bold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg',
            submitBtnIsLarge : true,
            submitBtnIsWaitingReceipt : false,
            submitBtnIsTransactionValidated : false,
            // Retrieve button property
            retrieveBtnLabel : 'Retrieve Dai',
            retrieveBtnClass : 'w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg',
            retrieveBtnIsLarge : true,
            retrieveBtnIsWaitingReceipt : false,
            retrieveBtnIsTransactionValidated : false,
            // Cancel button property
            cancelBtnLabel : 'Cancel',
            cancelBtnClass : 'w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm',
            cancelBtnIsLarge : false,
            cancelBtnIsWaitingReceipt : false,
            cancelBtnIsTransactionValidated : false,
            // Mock button property
            mockBtnLabel : 'Mock',
            mockBtnClass : 'w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm cursor-not-allowed',
            mockBtnIsLarge : false,
            mockBtnIsWaitingReceipt : false,
            mockBtnIsTransactionValidated : false,
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
        this.getAndUpdateProviderFunds = this.getAndUpdateProviderFunds.bind(this);
        this.isUserIsPriceFeederOwnerAsync = this.isUserIsPriceFeederOwnerAsync.bind(this);
        this.isUserIsPriceFeederOwner = this.isUserIsPriceFeederOwnerAsync.bind(this);
        this.init = this.init.bind(this);

        this.buyCreditAction = this.buyCreditAction.bind(this);
        this.buyCreditCondition = this.buyCreditCondition.bind(this);
        this.submitAction = this.submitAction.bind(this);
        this.submitCondition = this.submitCondition.bind(this);
        this.retrieveAction = this.retrieveAction.bind(this);
        this.retrieveCondition = this.retrieveCondition.bind(this);
        this.cancelAction = this.cancelAction.bind(this);
        this.cancelCondition = this.cancelCondition.bind(this);
        this.mockAction = this.mockAction.bind(this);
        this.mockCondition = this.mockCondition.bind(this);

        this.init();
        let dsa = new DefiSmartAccount();
        dsa.checkExecutorAndModule();
        this.isUserIsPriceFeederOwner();
    }

    async init() {
        this.getAndUpdateOraclePrice();
        this.getAndUpdateDaiBalance();
        this.getAndUpdateEtherBalance();
        this.getAndUpdateProviderFunds();
        
        setInterval(this.getAndUpdateOraclePrice, 3 * 1000);
        setInterval(this.getAndUpdateDaiBalance, 3 * 1000);
        setInterval(this.getAndUpdateEtherBalance, 3 * 1000);
        setInterval(this.getAndUpdateProviderFunds, 3 * 1000);
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
        return res.wait();
    }

    isUserIsPriceFeederOwner() {
        this.isUserIsPriceFeederOwnerAsync();
    }

    async isUserIsPriceFeederOwnerAsync() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
        var priceFeed = new PriceFeed();
        if (String(await priceFeed.getOwner()) === (await EthereumConnexion.GetInstance().signer.getAddress())) {
            return ;
        }
        this.setState({
            mockAllowed : false,
            mockBtnClass : 'w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm cursor-not-allowed'
        });
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
    getAndUpdateProviderFunds() {
        this.getProviderStake().then(async (stake) => {
            let dsa = new DefiSmartAccount();
            let minimunFunds = await dsa.getTaskAutomationFunds();
            let bigNbStake = await this.getProviderStakeBigNb();
            if (bigNbStake.lt(minimunFunds)) {
                this.setState({
                    creditClass : 'font-bold text-lg mb-2 text-red-600',
                    creditPrefix : 'Gelato Credit Low ',
                    providerStake: String(stake)
                })
            }
            else {
                this.setState({
                    creditClass : 'font-bold text-lg mb-2 text-gray-800',
                    creditPrefix : 'Gelato Credit ',
                    providerStake: String(stake)
                })
            }
        })
        this.forceUpdate();
    }

    async isEthereumConnexionInit() {
        if (EthereumConnexion.GetInstance().signer === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
    }

    async getProviderStake() {
        await this.isEthereumConnexionInit();
        let gelatoWrapper = new GelatoWrapper();
        var dsa = new DefiSmartAccount();
        let dsaContract = await dsa.DSA();
        return await gelatoWrapper.getProviderStake(dsaContract.address);
    }

    async getProviderStakeBigNb() {
        await this.isEthereumConnexionInit();
        let gelatoWrapper = new GelatoWrapper();
        var dsa = new DefiSmartAccount();
        let dsaContract = await dsa.DSA();
        return await gelatoWrapper.getProviderStakeBigNb(dsaContract.address);
    }

    async getEtherBalance() { // token0 is ETH
        await this.isEthereumConnexionInit();
        var dsa = new DefiSmartAccount();
        let dsaContract = await dsa.DSA();
        return await EthereumConnexion.GetInstance().getBalance(dsaContract.address);
    }

    async getDaiBalance() {
        await this.isEthereumConnexionInit();
        var dsa = new DefiSmartAccount();
        let dsaContract = await dsa.DSA();
        return await EthereumConnexion.GetInstance().getTokenBalance(dsaContract.address, DAI_TOKEN_ADDRESS);
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
        this.submitStopLossAsync();
    }

    async submitStopLossAsync() {
        var errorMsg = '';
        if(this.state.limit === null && parseFloat(this.state.limit) === NaN) {
            errorMsg = 'Limit value is incorrect.';
        }

        if(this.state.amount === null && parseFloat(this.state.amount) === NaN && parseFloat(this.state.amount) < 0.01) {
            errorMsg = errorMsg + ', ' +  'Limit value is incorrect.';
        }

        if (errorMsg !== '') {
            throw String(errorMsg);
        }
        var dsa = new DefiSmartAccount();
        return dsa.submitTaskStopLoss(this.state.limit, this.state.amount);
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
        return this.getConditionStateMock();
    }

    cancel() {
        this.cancelAsync();
    }
    async cancelAsync() {
        var dsa = new DefiSmartAccount();
        return dsa.cancel();
    }

    provideFunds() {
        this.provideFundsAsync();
    }

    async provideFundsAsync() {
        var dsa = new DefiSmartAccount();
        return dsa.provideFunds();
    }

    retrieveDai() {
        this.retrieveDaiAsync();
    }

    async retrieveDaiAsync() {
        var dsa = new DefiSmartAccount();
        return dsa.retrieveDAI();
    }

    // Buttons Dealing

    // Buy Credit Button

    buyCreditCondition() {
        return true;
    }

    async buyCreditAction(callback) {
        
        //callback();
        var afterTX = async () => {
            this.setState({
                creditBuyBtnIsWaitingReceipt : false,
                creditBuyBtnIsTransactionValidated : true,
            }, callback);
            await this.sleep(2000);
            this.setState({
                creditBuyBtnIsWaitingReceipt : false,
                creditBuyBtnIsTransactionValidated : false,
            }, callback);
        }

        this.provideFundsAsync().then(afterTX).catch(() => {
            this.setState({
                creditBuyBtnIsWaitingReceipt : false,
                creditBuyBtnIsTransactionValidated : false,
            }, callback);
        });
        await this.sleep(1000);
        this.setState({
            creditBuyBtnIsWaitingReceipt : true
        }, callback);
    }

    // Buy Credit Button

    // Submit Button

    async submitCondition() {
        // Verify if the user has enough credit.
        let dsa = new DefiSmartAccount();
        let minimunFunds = await dsa.getTaskAutomationFunds();
        let gelatoWrapper = new GelatoWrapper();
        let dsaContract = await dsa.DSA();
        let providerFunds = await gelatoWrapper.getProviderStakeBigNb(dsaContract.address);
        if(minimunFunds.gt(providerFunds)) {
            window.alert('Not enough gelato Credit for executing Action. Execution transaction can be rejected and gas burn uselessly. Buy some gelato credit before submitting.');
            return false;
        }
        return true;
    }

    async submitAction(callback) {
        //callback();
        var afterTX = async () => {
            this.setState({
                submitBtnIsWaitingReceipt : false,
                submitBtnIsTransactionValidated : true,
            }, callback);
            await this.sleep(2000);
            this.setState({
                submitBtnIsWaitingReceipt : false,
                submitBtnIsTransactionValidated : false,
            }, callback);
            let dsa = new DefiSmartAccount();
            await dsa.check(this.state.limit, this.state.amount);
        }

        this.submitStopLossAsync().then(afterTX).catch((err) => {
            this.setState({
                submitBtnIsWaitingReceipt : false,
                submitBtnIsTransactionValidated : false,
            }, callback);
            window.alert('check input.');
        });
        this.setState({
            submitBtnIsWaitingReceipt : true
        }, callback);
    }

    // Submit Button

    // Retrieve Button

    async retrieveCondition() {
        var dsa = new DefiSmartAccount();
        let dsaContract = await dsa.DSA();
        var balance = await EthereumConnexion.GetInstance().getTokenBalanceBigNb(dsaContract.address, DAI_TOKEN_ADDRESS);
        if(balance.isZero()) {
            window.alert("DeFi Smart Account DAI balance is equal to zero. No need to do retrieve action.");
            return false;
        }
        return true;
    }

    async retrieveAction(callback) {
        //callback();
        var afterTX = async () => {
            this.setState({
                retrieveBtnIsWaitingReceipt : false,
                retrieveBtnIsTransactionValidated : true,
            }, callback);
            await this.sleep(2000);
            this.setState({
                retrieveBtnIsWaitingReceipt : false,
                retrieveBtnIsTransactionValidated : false,
            }, callback);
        }

        this.retrieveDaiAsync().then(afterTX).catch(() => {
            this.setState({
                retrieveBtnIsWaitingReceipt : false,
                retrieveBtnIsTransactionValidated : false,
            }, callback);
        });
        this.setState({
            retrieveBtnIsWaitingReceipt : true
        }, callback);
    }

    // Retrieve Button

    // Cancel Button

    async cancelCondition() {
        let dsa = new DefiSmartAccount();
        let dsaContract = await dsa.DSA();
        let dsaBalance = await EthereumConnexion.GetInstance().getBalanceBigNb(dsaContract.address);
        let providerFunds = await dsa.getProviderFunds();
        if(dsaBalance.isZero() && providerFunds.isZero()) {
            window.alert('Already cancelled.');
            return false;
        }
        return true;
    }

    async cancelAction(callback) {
        //callback();
        var afterTX = async () => {
            this.setState({
                cancelBtnIsWaitingReceipt : false,
                cancelBtnIsTransactionValidated : true,
            }, callback);
            await this.sleep(2000);
            this.setState({
                cancelBtnIsWaitingReceipt : false,
                cancelBtnIsTransactionValidated : false,
            }, callback);
        }

        this.cancelAsync().then(afterTX).catch(() => {
            this.setState({
                cancelBtnIsWaitingReceipt : false,
                cancelBtnIsTransactionValidated : false,
            }, callback);
        });
        this.setState({
            cancelBtnIsWaitingReceipt : true
        }, callback);
    }

    // Cancel Button

    // Mock Button

    mockCondition() {
        if (this.state.mockAllowed) {
            return true;
        }
        return false;
    }

    async mockAction(callback) {
        //callback();
        var afterTX = async () => {
            this.setState({
                mockBtnIsWaitingReceipt : false,
                mockBtnIsTransactionValidated : true,
            }, callback);
            await this.sleep(2000);
            this.setState({
                mockBtnIsWaitingReceipt : false,
                mockBtnIsTransactionValidated : false,
            }, callback);
        }

        this.mockPriceAsync().then(afterTX).catch(() => {
            this.setState({
                mockBtnIsWaitingReceipt : false,
                mockBtnIsTransactionValidated : false,
            }, callback);
        });
        this.setState({
            mockBtnIsWaitingReceipt : true
        }, callback);
    }

    // Mock Button

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Buttons Dealing

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
                    <div className="font-bold text-lg mb-2 text-gray-800">ETH/USD {this.state.oraclePrice} $</div>
                </div>
                <div className="flex items-center justify-center">
                    <div className={this.state.creditClass}>{this.state.creditPrefix} {this.state.providerStake} Eth</div>
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
          {/* <button onClick={() => this.provideFunds()} className="mr-2 w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg">Buy Gelato Credit</button> */}
            <Button label={this.state.creditBuyBtnLabel} class={this.state.creditBuyBtnClass} isLarge={this.state.creditBuyBtnIsLarge} action={this.buyCreditAction} condition={this.buyCreditCondition} isTransactionValidated={this.state.creditBuyBtnIsTransactionValidated} isWaitingReceipt={this.state.creditBuyBtnIsWaitingReceipt}/>
            <Button label={this.state.submitBtnLabel} class={this.state.submitBtnClass} isLarge={this.state.submitBtnIsLarge} action={this.submitAction} condition={this.submitCondition} isTransactionValidated={this.state.submitBtnIsTransactionValidated} isWaitingReceipt={this.state.submitBtnIsWaitingReceipt}/>
          {/* <button onClick={() => this.submitStopLoss()} className="ml-2 bg-purple bg-opacity-100 w-full hover:bg-purple text-gray-100 font-bold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg">Submit</button> */}
        </div>
        <div className="flex items-center justify-center px-6 pb-4">
          {/* <button onClick={() => this.retrieveDai()} className="w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-lg">Retrieve Dai</button> */}
          <Button label={this.state.retrieveBtnLabel} class={this.state.retrieveBtnClass} isLarge={this.state.retrieveBtnIsLarge} action={this.retrieveAction} condition={this.retrieveCondition} isTransactionValidated={this.state.retrieveBtnIsTransactionValidated} isWaitingReceipt={this.state.retrieveBtnIsWaitingReceipt}/>
        </div>
        <div className="flex items-center justify-center px-6 pb-4">
          {/* <button onClick={() => this.cancel()} className="w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm">Cancel</button> */}
          <Button label={this.state.cancelBtnLabel} class={this.state.cancelBtnClass} isLarge={this.state.cancelBtnIsLarge} action={this.cancelAction} condition={this.cancelCondition} isTransactionValidated={this.state.cancelBtnIsTransactionValidated} isWaitingReceipt={this.state.cancelBtnIsWaitingReceipt}/>
        </div>
        <div className="flex items-center justify-center px-6 pb-4">
          {/* <button onClick={() => this.mockPrice()} className= {`w-full hover:bg-gray-100 text-gray-800 font-semibold hover:font-bold py-2 px-4 border border-gray-200 hover:border-gray-300 rounded text-sm ${this.state.mockAllowed}`}>Mock</button> */}
          <Button label={this.state.mockBtnLabel} class={this.state.mockBtnClass} isLarge={this.state.mockBtnIsLarge} action={this.mockAction} condition={this.mockCondition} isTransactionValidated={this.state.mockBtnIsTransactionValidated} isWaitingReceipt={this.state.mockBtnIsWaitingReceipt}/>
        </div>
        </div>
      </div>)
    }
}

export default StopLoss;