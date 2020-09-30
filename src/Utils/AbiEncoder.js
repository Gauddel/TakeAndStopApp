import ethers from 'ethers';

class AbiEncoder {
    static AbiEncodeWithSelector(args) {
        let iface = new ethers.utils.Interface(args.abi);
        return iface.encodeFunctionData(args.functionname, args.inputs)
    }
}

export default AbiEncoder;