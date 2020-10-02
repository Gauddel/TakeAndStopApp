import React from 'react';
import InstaList from './../Services/InstaList';
import InstaIndex from './../Services/InstaIndex';
import DefiSmartAccount from './../Services/DefiSmartAccount';
import Button from './Button';

class DeFiSmartAccountCreation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dsaCreationBtnLabel : 'Create DeFi Smart Account',
            dsaCreationBtnClass : 'bg-gray-100 text-opacity-75 shadow-lg w-1/3 hover:bg-gray-100 text-blue font-light hover:font-bold py-3 px-3 border border-gray-400 hover:border-gray-600 rounded text-2xl',
            dsaCreationBtnIsExtraLarge : true,
            dsaCreationBtnIsWaitingReceipt : false,
            dsaCreationBtnIsTransactionValidated : false,
        }

        //this.createDeFiSmartAccount = this.createDeFiSmartAccount.bind(this);
        this.verifyDSACreation = this.verifyDSACreation.bind(this);
        this.condition = this.condition.bind(this);
        this.action = this.action.bind(this);
    }

    condition() {
        return true;
    }

    async action(callback) {
        var afterTX = async () => {
            this.setState({
                dsaCreationBtnIsWaitingReceipt : false,
                dsaCreationBtnIsTransactionValidated : true,
            }, callback);
            await this.sleep(2000);
            this.setState({
                dsaCreationBtnIsWaitingReceipt : false,
                dsaCreationBtnIsTransactionValidated : false,
            }, callback);
            let success = await this.verifyDSACreation();
            if(!success) {
                window.alert('DeFi Smart Contract creation has been completed. Some issue appear during the creation process.')
            }
            this.props.isDSAExist(success);
        }
        var instaIndex = new InstaIndex();
        instaIndex.buildDeFiSmartAccount().then(afterTX).catch(() => {
            this.setState({
                dsaCreationBtnIsWaitingReceipt : false,
                dsaCreationBtnIsTransactionValidated : false,
            }, callback);
        });
        await this.sleep(1000);
        this.setState({
            dsaCreationBtnIsWaitingReceipt : true
        }, callback);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // createDeFiSmartAccount() {
    //     var instaIndex = new InstaIndex();
    //     // let dsa = new DefiSmartAccount();

    //     instaIndex.buildDeFiSmartAccount().then(async () => {
    //     //dsa.setup().then(async () => {
    //         // Give authorization to Gelato Core Contract.
    //         // let dsa = new DefiSmartAccount();
    //         // await dsa.giveAuthToGelatoCoreContract();
    //         // Set user as Gelato Provider and set the executor of futur task.
    //         //await dsa.setupGelato();
    //         let success = await this.verifyDSACreation();
    //         if(!success) {
    //             window.alert('DeFi Smart Contract creation has been completed. Some issue appear during the creation process.')
    //         }
    //         this.props.isDSAExist(success);
    //     });
    // }

    async verifyDSACreation() {
        var instaList = new InstaList();
        return await instaList.isDSAExist();
    }

    // async tempAccountList() {
    //     var instaList = new InstaList();
    //     console.log('Account List', await instaList.getAccountList());
    // }

    render() {
        return (<div className="h-screen flex items-center justify-center">
            <Button label={this.state.dsaCreationBtnLabel} class={this.state.dsaCreationBtnClass} isExtraLarge={this.state.dsaCreationBtnIsExtraLarge} action={this.action} condition={this.condition} isTransactionValidated={this.state.dsaCreationBtnIsTransactionValidated} isWaitingReceipt={this.state.dsaCreationBtnIsWaitingReceipt}/>
            {/* <button onClick={() => this.createDeFiSmartAccount()} className="bg-gray-100 text-opacity-75  shadow-lg w-1/3 hover:bg-gray-100 text-blue font-light hover:font-bold py-3 px-3 border border-gray-400 hover:border-gray-600 rounded text-2xl">
                Create DeFi Smart Account
            </button> */}
        </div>);
    }
}

export default DeFiSmartAccountCreation;