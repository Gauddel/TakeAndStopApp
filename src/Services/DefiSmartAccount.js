import { ethers} from 'ethers';
import GelatoCoreLib from "@gelatonetwork/core";
import InstaAccount from './../pre-compiles/InstaAccount.json';
import ConnectAuth from './../pre-compiles/ConnectAuth.json';
import ConnectBasic from './../pre-compiles/ConnectBasic.json';
import ConnectUniswapV2 from './../pre-compiles/ConnectUniswapV2.json';
import ConnectGelato from './../pre-compiles/ConnectGelato.json';
import PriceFeed from './../pre-compiles/PriceFeedMockETHUSD.json';
import ConditionStopLoss from './../pre-compiles/ConditionCompareAssetPriceForStopLoss.json';
import EthereumConnexion from './../Services/EthereumConnexion';
import AbiEncoder from './../Utils/AbiEncoder';
import InstaList from './../Services/InstaList';

// Contract Address.
const ConnectBasicAddress = "0x6a31c5982C5Bc5533432913cf06a66b6D3333a95";
const ConnectAuthAddress = "0xd1aFf9f2aCf800C876c409100D6F39AEa93Fc3D9";
const ConnectUniswapV2Address = "0x62EbfF47B2Ba3e47796efaE7C51676762dC961c0";
const GelatoCoreAddress = "0x1d681d76ce96E4d70a88A00EBbcfc1E47808d0b8";
const ConnectGelatoAddress = "0x37A7009d424951dd5D5F155fA588D9a03C455163";
const ProviderModuleDSAAddress = "0x0C25452d20cdFeEd2983fa9b9b9Cf4E81D6f2fE2";
const ConditionStopLossAddress = "0xEd9D452D1755160FeCd6492270Bb67F455b6b78E"; // Need to be filled after the deployement of Condition contract
const ExecutorAddress = "0xd70d5fb9582cc3b5b79bbfaecbb7310fd0e3b582"; // Gelato Mainnet executor.
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const PriceFeedMockETHUSDAddress = "0xB02aFF0C00a60AeB06A7b12c82214e08cCD5499f";
// Contract Address.

class DefiSmartAccount {

    dsa;
    static Instance;

    static GetInstance() {
        if (DefiSmartAccount.Instance === undefined) {
            DefiSmartAccount.Instance = new DefiSmartAccount();
        }
        return DefiSmartAccount.Instance;
    }

    constructor() {
        this.setDSA()
    }

    async setDSA() {
        if (EthereumConnexion.GetInstance().provider === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }

        let instaList = new InstaList();
        var dsaId = await instaList.getDSAId();

        if(Number(dsaId) === 0) {
            window.alert('Neddd to create an account.');
            return;
        }

        var dsaAddress = await instaList.getDSA();
        this.dsa = new ethers.Contract(dsaAddress, InstaAccount.abi, EthereumConnexion.GetInstance().signer);
    }

    async DSA() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        return this.dsa;
    }

    async giveAuthToGelatoCoreContract() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        var data = AbiEncoder.AbiEncodeWithSelector({
            abi: ConnectAuth.abi,
            functionname: "add",
            inputs: [GelatoCoreAddress],
        });
        let res = await this.dsa.cast([ConnectAuthAddress],
            [data],
            await EthereumConnexion.GetInstance().signer.getAddress());
        res.wait();
        let gelatoCoreisAuth = await this.dsa.isAuth(GelatoCoreAddress);
        if(!gelatoCoreisAuth) {
            console.error('Take&Stop: gelatoCore authentication right has not granted.')
        }
    }

    async gelatoCoreHasAuthPermission() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        return await this.dsa.isAuth(GelatoCoreAddress);
    }

    async setupGelato() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        var userAddress = await EthereumConnexion.GetInstance().signer.getAddress();
        const GAS_LIMIT = "700000";
        const GAS_PRICE_CEIL = ethers.utils.parseUnits("200", "gwei");

        var gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        var TASK_AUTOMATION_FUNDS = await gelatoCore.minExecProviderFunds(GAS_LIMIT, GAS_PRICE_CEIL);
        var data = AbiEncoder.AbiEncodeWithSelector({
            abi: ConnectGelato.abi,
            functionname: "multiProvide",
            inputs: [
                ExecutorAddress,
                [],
                [ProviderModuleDSAAddress],
                TASK_AUTOMATION_FUNDS,
                0,
                0,
            ],
        });

        await this.dsa.cast(
            [ConnectGelatoAddress],
            [data],
            userAddress,
            {
                value: TASK_AUTOMATION_FUNDS,
                gasLimit: 300000,
            }
        )
    }

    async submitTaskStopLoss(limit, amountToSell) {
        if (this.dsa === undefined) {
            await this.setDSA();
        }

        if (EthereumConnexion.GetInstance().provider === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }

        var conditionStopLoss = new ethers.Contract(ConditionStopLossAddress, ConditionStopLoss.abi, EthereumConnexion.GetInstance().signer);    
        
        var stopLossCondition = new GelatoCoreLib.Condition({
            inst: ConditionStopLossAddress,
            data: await conditionStopLoss.getConditionData(
                PriceFeedMockETHUSDAddress,
                 AbiEncoder.AbiEncodeWithSelector({
                    abi: PriceFeed.abi,
                    functionname: "getLatestPriceToken0", // Hardcoded just for the hackathon
                }),
                ethers.utils.parseUnits(String(parseFloat(limit)), 18)
            ),
        });

        // Create Actions
        var spells = [];

        var unitAmt = ethers.utils.parseUnits("1", 16); // Hardcoded just for the hackathon, should use CurrencyPair instead.
        let amtoSell = ethers.utils.parseUnits(String(parseFloat(amountToSell)), 18);
        console.log(amtoSell);
        console.log(unitAmt);
        if(unitAmt === undefined) {
            console.error("Take&Stop (2): Token pair not allowed");
        }

        var sellEthAction = new GelatoCoreLib.Action({
            addr: ConnectUniswapV2Address,
            data: AbiEncoder.AbiEncodeWithSelector({
                abi : ConnectUniswapV2.abi,
                functionname: "sell",
                inputs: [DAI, ETH, ethers.utils.parseUnits(String(parseFloat(amountToSell)), 18), unitAmt, 0, 0]
            }),
            operation: GelatoCoreLib.Operation.Delegatecall,
        })

        spells.push(sellEthAction);

        const GAS_LIMIT = "700000";
        const GAS_PRICE_CEIL = ethers.utils.parseUnits("200", "gwei");
        const stopLossIfEtherPriceTooLow = new GelatoCoreLib.Task({
            conditions: [stopLossCondition],
            actions: spells,
            selfProviderGasLimit: GAS_LIMIT,
            selfProviderGasPriceCeil: GAS_PRICE_CEIL,
        });

        const gelatoSelfProvider = new GelatoCoreLib.GelatoProvider({
            addr: this.dsa.address,
            module: ProviderModuleDSAAddress
        });

        // Submit Task to GelatoCore via our DSA

        const expiryDate = 0;
        
        await this.dsa.cast(
            [ConnectGelatoAddress],
            [
                AbiEncoder.AbiEncodeWithSelector({
                    abi: ConnectGelato.abi,
                    functionname: "submitTask",
                    inputs: [
                        gelatoSelfProvider,
                        stopLossIfEtherPriceTooLow,
                        expiryDate,
                    ],
                }),
            ],
            await EthereumConnexion.GetInstance().signer.getAddress(),
            {
                gasLimit: 200000,
            }
        )
    }

    async cancel() { // Withdraw funds.
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        // 1 Do multiUnprovide to withdraw fund from gelato.

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        let withdrawAmount = await gelatoCore.providerFunds(this.dsa.address);

        await this.dsa.cast(
            [ConnectGelatoAddress],
            [
                AbiEncoder.AbiEncodeWithSelector({
                    abi: ConnectGelato.abi,
                    functionname: "multiUnprovide",
                    inputs: [
                        withdrawAmount,
                        [],
                        [],
                        0,
                        0,
                    ],
                }),
            ],
            await EthereumConnexion.GetInstance().signer.getAddress(),
            {
                gasLimit: 300000,
            }
        );

        // 2 Use Connect Basic to retrieve fund from DeFi Smart Account
        withdrawAmount = await this.getBalance();
        await this.dsa.cast(
            [ConnectBasicAddress],
            [
                AbiEncoder.AbiEncodeWithSelector({
                    abi: ConnectGelato.abi,
                    functionname: "withdraw",
                    inputs: [
                        ETH,
                        withdrawAmount,
                        await EthereumConnexion.GetInstance().signer.getAddress(),
                        0,
                        0,
                    ],
                }),
            ],
            await EthereumConnexion.GetInstance().signer.getAddress(),
            {
                gasLimit: 300000,
            }
        );
    }

    async getBalance() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        return await EthereumConnexion.GetInstance().provider.getBalance(this.dsa.address);
    }
}

export default DefiSmartAccount;