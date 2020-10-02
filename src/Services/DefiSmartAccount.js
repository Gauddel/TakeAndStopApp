import { ethers} from 'ethers';
import GelatoCoreLib from "@gelatonetwork/core";
import InstaAccount from './../pre-compiles/InstaAccount.json';
import InstaIndex from "../pre-compiles/InstaIndex.json";
import ConnectAuth from './../pre-compiles/ConnectAuth.json';
import IERC20 from './../pre-compiles/IERC20.json';
import ConnectBasic from './../pre-compiles/ConnectBasic.json';
import ConnectUniswapV2 from './../pre-compiles/ConnectUniswapV2.json';
import ConnectGelato from './../pre-compiles/ConnectGelato.json';
import PriceFeed from './../pre-compiles/PriceFeedMockETHUSD.json';
import ConditionStopLoss from './../pre-compiles/ConditionCompareAssetPriceForStopLoss.json';
import ConditionBalance from './../pre-compiles/ConditionBalance.json';
import EthereumConnexion from './../Services/EthereumConnexion';
import AbiEncoder from './../Utils/AbiEncoder';
import InstaList from './../Services/InstaList';

// Contract Address.
const InstaIndexAddress = "0x2971AdFa57b20E5a416aE5a708A8655A9c74f723";
const ConnectBasicAddress = "0x6a31c5982C5Bc5533432913cf06a66b6D3333a95";
const ConnectAuthAddress = "0xd1aFf9f2aCf800C876c409100D6F39AEa93Fc3D9";
const ConnectUniswapV2Address = "0x62EbfF47B2Ba3e47796efaE7C51676762dC961c0";
const GelatoCoreAddress = "0x1d681d76ce96E4d70a88A00EBbcfc1E47808d0b8";
const ConnectGelatoAddress = "0x37A7009d424951dd5D5F155fA588D9a03C455163";
const ProviderModuleDSAAddress = "0x0C25452d20cdFeEd2983fa9b9b9Cf4E81D6f2fE2";
const ConditionStopLossAddress = "0xEd9D452D1755160FeCd6492270Bb67F455b6b78E";
const ConditionBalanceAddress = "0xd69DB9852bAbf9e0bd73B8A090382573C7488154";
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

    async gelatoCoreHasAuthPermission() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        return await this.dsa.isAuth(GelatoCoreAddress);
    }

    async getTaskAutomationFunds() {
        const GAS_LIMIT = "700000";
        const GAS_PRICE_CEIL = ethers.utils.parseUnits("200", "gwei");

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        return await gelatoCore.minExecProviderFunds(GAS_LIMIT, GAS_PRICE_CEIL);
    }

    async provideFunds() { // And Give authorization to Gelato if not already given.
        if (this.dsa === undefined) {
            await this.setDSA();
        }

        let targets = [];
        let datas = [];
        let data;
        let target;
        let providers = [];
        let executor = ethers.constants.AddressZero;

        let userAddress = await EthereumConnexion.GetInstance().signer.getAddress();
        // const GAS_LIMIT = "700000";
        // const GAS_PRICE_CEIL = ethers.utils.parseUnits("200", "gwei");

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        // let TASK_AUTOMATION_FUNDS = await gelatoCore.minExecProviderFunds(GAS_LIMIT, GAS_PRICE_CEIL);
        let TASK_AUTOMATION_FUNDS = await this.getTaskAutomationFunds();

        // If Auth to Gelato has not been given add this task.
        if (!(await this.gelatoCoreHasAuthPermission())) { 
            data = AbiEncoder.AbiEncodeWithSelector({
                abi: ConnectAuth.abi,
                functionname: "add",
                inputs: [GelatoCoreAddress],
            });
            target = ConnectAuthAddress;
            targets.push(target);
            datas.push(data);
        }

        if(!(await gelatoCore.isModuleProvided(this.dsa.address, ProviderModuleDSAAddress))) {
            providers.push(ProviderModuleDSAAddress);
        }

        if(String(await gelatoCore.executorByProvider(this.dsa.address)) === ethers.constants.AddressZero) {
            executor = ExecutorAddress;
        }
        
        data = AbiEncoder.AbiEncodeWithSelector({
            abi: ConnectGelato.abi,
            functionname: "multiProvide",
            inputs: [
                executor,
                [],
                providers,
                TASK_AUTOMATION_FUNDS,
                0,
                0,
            ],
        });
        target = ConnectGelatoAddress;
        targets.push(target);
        datas.push(data);

        let res = await this.dsa.cast(
            targets,
            datas,
            userAddress,
            {
                value: TASK_AUTOMATION_FUNDS,
                gasLimit: 400000,
            }
        )
        return res.wait();
    }

    async submitTaskStopLoss(limit, amountToSell) {
        if (this.dsa === undefined) {
            await this.setDSA();
        }

        if (EthereumConnexion.GetInstance().provider === undefined) {
            await EthereumConnexion.GetInstance().setup();
        }

        var conditionStopLoss = new ethers.Contract(ConditionStopLossAddress, ConditionStopLoss.abi, EthereumConnexion.GetInstance().signer);   
        var conditionBalance = new ethers.Contract(ConditionBalanceAddress, ConditionBalance.abi, EthereumConnexion.GetInstance().signer);   
        
        let checkBalanceCondition = new GelatoCoreLib.Condition({
            inst: ConditionBalanceAddress,
            data: await conditionBalance.getConditionData(
                this.dsa.address,
                ETH,
                ethers.utils.parseUnits(String(parseFloat(amountToSell)), 18),
                true
            )
        });

        let stopLossCondition = new GelatoCoreLib.Condition({
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
            conditions: [checkBalanceCondition, stopLossCondition],
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
        
        let res = await this.dsa.cast(
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
                value: ethers.utils.parseUnits(String(parseFloat(amountToSell)), 18),
                gasLimit: 200000,
            }
        )
        return res.wait();
    }

    async cancel() { // Withdraw funds.
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        // 1 Do multiUnprovide to withdraw fund from gelato.

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        let withdrawAmount = await gelatoCore.providerFunds(this.dsa.address);
        let userAddress = await EthereumConnexion.GetInstance().signer.getAddress();

        let res = await this.dsa.cast(
            [ConnectGelatoAddress, ConnectBasicAddress],
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
                AbiEncoder.AbiEncodeWithSelector({
                    abi: ConnectBasic.abi,
                    functionname: "withdraw",
                    inputs: [
                        ETH,
                        ethers.constants.MaxUint256,
                        userAddress,
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

        return res.wait();
    }

    async retrieveDAI() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }

        let userAddress = await EthereumConnexion.GetInstance().signer.getAddress();

        let res = await this.dsa.cast(
            [ConnectBasicAddress],
            [
                AbiEncoder.AbiEncodeWithSelector({
                    abi: ConnectBasic.abi,
                    functionname: "withdraw",
                    inputs: [
                        DAI,
                        ethers.constants.MaxUint256,
                        userAddress,
                        0,
                        0,
                    ],
                })
            ],
            userAddress,
            {
                gasLimit: 300000,
            }
        );
        return res.wait();
    }

    async getBalance() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        return await EthereumConnexion.GetInstance().provider.getBalance(this.dsa.address);
    }

    async getProviderFunds() {
        if (this.dsa === undefined) {
            await this.setDSA();
        }

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);

        return await gelatoCore.providerFunds(this.dsa.address);
    }

    // Check if everything is ok

    async checkExecutorAndModule() {
        // Check executor.
        // Check isModuleProvided
        if (this.dsa === undefined) {
            await this.setDSA();
        }

        let gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);

        let moduleProvided = await gelatoCore.isModuleProvided(this.dsa.address, ProviderModuleDSAAddress);
        console.log('Module is provided', moduleProvided);

        let executorDefined = await gelatoCore.executorByProvider(this.dsa.address);
        console.log('Defined Executor', executorDefined);
    }
    
    async check(limit, amountToSell) {
        // Check both condition
        // Balance Check
        if (this.dsa === undefined) {
            await this.setDSA();
        }
        let conditionBalance = new ethers.Contract(ConditionBalanceAddress, ConditionBalance.abi, EthereumConnexion.GetInstance().signer);   
        
        let data = await conditionBalance.getConditionData(
                this.dsa.address,
                ETH,
                ethers.utils.parseUnits(String(parseFloat(amountToSell)), 18),
                true
            );
        let ok = await conditionBalance.ok(
            0,
            data,
            0
        )
        console.log('Balance is Ok ? :', ok)

        var conditionStopLoss = new ethers.Contract(ConditionStopLossAddress, ConditionStopLoss.abi, EthereumConnexion.GetInstance().signer);   
        data = await conditionStopLoss.getConditionData(
            PriceFeedMockETHUSDAddress,
             AbiEncoder.AbiEncodeWithSelector({
                abi: PriceFeed.abi,
                functionname: "getLatestPriceToken0", // Hardcoded just for the hackathon
            }),
            ethers.utils.parseUnits(String(parseFloat(limit)), 18)
        );
        ok = await conditionStopLoss.ok(
            0,
            data,
            0
        );
    }
}

export default DefiSmartAccount;