import React from 'react';
import InstaList from './../Services/InstaList';
import InstaIndex from './../Services/InstaIndex';
import DefiSmartAccount from './../Services/DefiSmartAccount';

class DeFiSmartAccountCreation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

        }

        this.createDeFiSmartAccount = this.createDeFiSmartAccount.bind(this);
        this.verifyDSACreation = this.verifyDSACreation.bind(this);
    }

    createDeFiSmartAccount() {
        var instaIndex = new InstaIndex();

        instaIndex.buildDeFiSmartAccount().then(async () => {
            // Give authorization to Gelato Core Contract.
            let dsa = new DefiSmartAccount();
            await dsa.giveAuthToGelatoCoreContract();
            // Set user as Gelato Provider and set the executor of futur task.
            await dsa.setupGelato();
            let success = await this.verifyDSACreation() && await dsa.gelatoCoreHasAuthPermission();
            if(!success) {
                window.alert('DeFi Smart Contract creation has been completed. Some issue appear during the creation process.')
            }
            this.props.isDSAExist(success);
        });
    }

    async verifyDSACreation() {
        var instaList = new InstaList();
        return await instaList.isDSAExist();
    }

    async tempAccountList() {
        var instaList = new InstaList();
        console.log('Account List', await instaList.getAccountList());
    }

    render() {
        return (<div className="h-screen flex items-center justify-center">
            <button onClick={() => this.createDeFiSmartAccount()} className="bg-gray-100 text-opacity-75  shadow-lg w-1/3 hover:bg-gray-100 text-blue font-light hover:font-bold py-3 px-3 border border-gray-400 hover:border-gray-600 rounded text-2xl">
                Create DeFi Smart Account
            </button>
        </div>);
    }
}

export default DeFiSmartAccountCreation;