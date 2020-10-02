import React from 'react';

class Button extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            label : props.label,
            action : props.action,
            class : props.class,
            spanClass : '',
            svgClass : 'animate-spin h-5 w-5 mr-3 text-white',
            imgClass : 'w-6 h-6 bg-white place-self-center',
            isLarge : props.isLarge,
            isExtraLarge : props.isExtraLarge,
            // isLoading should be still in props
        }

        this.getClass = this.getClass.bind(this);
        this.action = this.action.bind(this);
        this.getSpan = this.getSpan.bind(this);
        this.getImage = this.getImage.bind(this);
    }

    getClass() {
        let divClass = this.props.class;
        if (this.props.isWaitingReceipt) {
            console.log('IS WAITING');
            if (this.state.isExtraLarge) {
                divClass = 'flex items-center justify-center w-1/3 bg-red-500 text-gray-100 font-semibold py-2 px-4 border border-gray-200 rounded text-2xl disable';
            }
            else if(this.state.isLarge) {
                divClass = 'flex items-center justify-center w-full bg-red-500 text-gray-100 font-semibold py-2 px-4 border border-gray-200 rounded text-lg disable';
            }
            else {
                divClass = 'flex items-center justify-center w-full bg-red-500 text-gray-100 font-semibold py-2 px-4 border border-gray-200 rounded text-sm disable';
            }
        }
        if(this.props.isTransactionValidated) {
            console.log('VALIDATED');
            if (this.state.isExtraLarge) {
                divClass = 'flex items-center justify-center w-1/3 bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-200 rounded text-2xl disable';
            }
            else if(this.state.isLarge) { 
                divClass =  'flex items-center justify-center w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-200 rounded text-lg disable'
            }
            else {
                divClass =  'flex items-center justify-center w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-200 rounded text-sm disable';
            }
        }
        this.setState({
            class : divClass
        });
    }

    getSpan() {
        if (this.props.isTransactionValidated || this.props.isWaitingReceipt) {
            return;
        }
        return <span className={this.state.spanClass}>{this.state.label}</span>;
    }

    getImage() {
        if (this.props.isTransactionValidated) {
            return (<img className={this.state.imgClass} src="./check.png" alt="transaction executed"/>);
        }
        return;
    }

    action() {
        this.actionAsync();
        // if (this.props.condition()) {
        //     this.props.action(this.getClass);
        // }
    }

    async actionAsync() {
        console.log('Condition : ', await this.props.condition());
        if (await this.props.condition()) {
            this.props.action(this.getClass);
        }
    }

    getSvg() {
        if (this.props.isWaitingReceipt) {
            return (<div className="flex items-center justify-center">
                <svg className={this.state.svgClass} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing
                </div>);
        }
        return;
    }

    render() {
        return (
            <button onClick={() => this.action()} className={this.state.class}>
                {this.getSvg()}
                {this.getImage()}
                {this.getSpan()}
            </button>);
    }
}

export default Button;