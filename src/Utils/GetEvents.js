import ethers from 'ethers';
import GelatoCoreLib from "@gelatonetwork/core";
import EthereumConnexion from './../Services/EthereumConnexion';

var abi = require('ethereumjs-abi');

const GelatoCoreAddress = "0x1d681d76ce96E4d70a88A00EBbcfc1E47808d0b8";
var searchFromBlock = 10368663; // Gelato Core creation block number. Replace with Condition Contract creation.
const StopLossConditionContractAddress = "";
const UniswapConnectorAddress = "0x62EbfF47B2Ba3e47796efaE7C51676762dC961c0";

class GetEvents {

    static validTask = [];
    static newValidTask = [];

    async getLimitOfValidTask() {
        var encoder = new ethers.utils.AbiCoder();
        GetEvents.newValidTask.forEach((t) => {
            var condition = t.condition;
            var data = condition.data;
            var decodedData = encoder.decode(["address", "bytes", "uint256"], data);
            console.log(decodedData);
        })
    }

    async getNotExpiredSubmittedTask(dsaAddress) {
        if(EthereumConnexion.GetInstance().provider == undefined) {
            await EthereumConnexion.GetInstance().setup();
        }
        // var gelatoCore = new ethers.Contract(GelatoCoreAddress, GelatoCoreLib.GelatoCore.abi, EthereumConnexion.GetInstance().provider);
        var iface = new ethers.utils.Interface(GelatoCoreLib.GelatoCore.abi);
        var topic = ethers.utils.id(
            "LogTaskSubmitted(uint256 indexed taskReceiptId, bytes32 indexed taskReceiptHash, TaskReceipt taskReceipt)"
        );

        /// TODO Remove for mock 
        searchFromBlock = await EthereumConnexion.GetInstance().provider.getBlockNumber();

        var filter = {
            address: GelatoCoreAddress,
            fromBlock: parseInt(searchFromBlock),
            topics: [topic]
        };

        try {
            var provider = EthereumConnexion.GetInstance().provider;
            const logs = await provider.getLogs(filter);
            logs.forEach(log => {
                if (log !== undefined) {
                  const parsedLog = iface.parseLog(log);
                  const taskReceiptId = parsedLog.values.taskReceiptId.toString();
                  const taskReceipt = parsedLog.values.taskReceipt;

                  var blocktimestamp = Math.floor(Date.now() / 1000); // To convert Solidity timestamp in seconds.
                  if(taskReceipt.expiryDate < blocktimestamp
                    && String(taskReceipt.userProxy) !== String(dsaAddress)) {
                      return;
                  }

                  var stopLossCondition;
                  var sellAction;

                  var stopLossTask = taskReceipt.tasks.find((t) => {
                      var task = GelatoCoreLib.Task(t);
                      var uniswapSellAction = task.actions.find((a) => {
                          var action = GelatoCoreLib.Action(a);
                          return String(action.addr) === UniswapConnectorAddress;
                      });

                      if(!uniswapSellAction) {
                          return false;
                      }
                      sellAction = GelatoCoreLib.Action(uniswapSellAction);
                      var slCondition = task.conditions.find((c) => {
                          var condition = GelatoCoreLib.Condition(c);
                          return String(condition.inst) === StopLossConditionContractAddress;
                      })

                      if(!slCondition) {
                          return false;
                      }
                      stopLossCondition = GelatoCoreLib.Condition(slCondition);
                      return true;
                  })

                  if(!stopLossTask) {
                      return;
                  }

                  GetEvents.newValidTask.push({
                      id: taskReceiptId,
                      receipt : GelatoCoreLib.TaskReceipt(taskReceipt),
                      condition : stopLossCondition,
                      action : sellAction
                  });
                }
        });
        } catch (err) {
            console.debug(err)
        }
    }
}

export default GetEvents;