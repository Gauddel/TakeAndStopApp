import ethers from 'ethers';

class AbiEncoder {
    static AbiEncodeWithSelector(args) {
        console.log('Function Name',args.functionname);
        console.log('Inputs',args.inputs);
        let iface = new ethers.utils.Interface(args.abi);
        return iface.encodeFunctionData(args.functionname, args.inputs)
    }
}

export default AbiEncoder;