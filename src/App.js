import React from 'react';
import logo from './logo.svg';
import './App.css';
import MainPage from './Components/MainPage';
import StopLoss from './Components/StopLoss';
import DeFiSmartAccountCreation from './Components/DeFiSmartAccountCreation';
require('dotenv').config();

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connected : false,
      dsaExist : false,
    }

    this.isConnected = this.isConnected.bind(this);
    this.isDSAExist = this.isDSAExist.bind(this);
    this.postConnection = this.postConnection.bind(this);
    this.postDSACreation = this.postDSACreation.bind(this);
  }

  isDSAExist(isCreated) {
    this.setState({
      isDSAExist: isCreated
    })
    this.forceUpdate();
  }

  isConnected(){
    
  }

  postConnection() {
    this.setState({
      connected : true,
    })
  }

  postDSACreation() {

  }

  dsaCreationPage() {
    return (<DeFiSmartAccountCreation postDSACreation={this.postDSACreation} isDSAExist={this.isDSAExist}/>);
  }

  landingPage() {
    return(
      <MainPage postConnection={this.postConnection} isDSAExist={this.isDSAExist}/>
    );
  }

  dashboard() {
    return (<StopLoss/>);
  }

  render() {

    if(this.state.connected && this.state.isDSAExist) {
      return this.dashboard();
    }
    if(this.state.connected) {
      return this.dsaCreationPage();
    }

    return this.landingPage();
  }
}

export default App;
