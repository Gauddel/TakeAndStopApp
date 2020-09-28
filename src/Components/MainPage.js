import React from 'react';
import EthereumConnexion from './../Services/EthereumConnexion';
import InstaList from './../Services/InstaList';
import DefiSmartAccount from './../Services/DefiSmartAccount';

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.connect = this.connect.bind(this);
    }

    connect() {
        EthereumConnexion.GetInstance().setup().then(async () =>{
            let dsExist = await (new InstaList()).isDSAExist();
            let dsa = new DefiSmartAccount();
            let ok =await dsa.gelatoCoreHasAuthPermission()
            this.props.isDSAExist(ok && dsExist);
            this.props.postConnection();
        });
    }

    render() {
        return (<div className="h-screen pb-14 bg-right bg-cover" >
        <div className="w-full container mx-auto p-6">
                
            <div className="w-full flex items-center justify-between">
                <a className="flex items-center text-indigo-400 no-underline hover:no-underline font-bold text-2xl lg:text-4xl"  href="#"> 
             <img className="w-48 mx-auto lg:mr-0 slide-in-bottom" src="./TakeAndStop.png"/>
          </a>
                
                <div className="flex w-1/2 justify-end content-center">		
                    <a className="inline-block text-blue-300 no-underline hover:text-indigo-800 hover:text-underline text-center h-10 p-2 md:h-auto md:p-4" data-tippy-content="@twitter_handle" href="#">
              <img onClick={() => this.connect()} className="mx-auto lg:mr-0 slide-in-bottom w-20" src="./metamask-fox.svg"/>
            </a>
                </div>
                
            </div>
    
        </div>
    
        <div className="container pt-24 md:pt-48 px-6 mx-auto flex flex-wrap flex-col md:flex-row items-center">
            <div className="flex flex-col w-full xl:w-5/12 justify-center lg:items-start overflow-y-hidden">
                <h1 className="my-4 text-3xl md:text-5xl text-purple-800 font-bold leading-tight text-center md:text-left slide-in-bottom-h1">Take&Stop take care of your DeFi position</h1>
                <p className="leading-normal text-base md:text-2xl mb-8 text-center md:text-left slide-in-bottom-subtitle">A decentralized and autonomous protocol working for you!</p>
            
                <p className="text-blue-400 font-bold pb-8 lg:pb-6 text-center md:text-left fade-in">Download metamask wallet:</p>
                <div className="flex w-full justify-center md:justify-start pb-24 lg:pb-0 fade-in">
                    <img src="./metamask-fox-wordmark-horizontal.svg" className="h-12 pr-4 bounce-top-icons"/>
                </div>
    
            </div>
            
            <div className="w-full xl:w-7/12 py-6 overflow-y-hidden">
                <img className="w-8/12 mx-auto lg:mr-0 slide-in-bottom" src="./devices.svg"/>
            </div>
            
            <div className="w-full pt-16 pb-6 text-sm text-center md:text-left fade-in">
                <a className="text-gray-500 no-underline hover:no-underline" href="#">&copy; Take&Stop 2020</a>
            </div>
            
        </div>
        
    
    </div>);
    }
}

export default MainPage;