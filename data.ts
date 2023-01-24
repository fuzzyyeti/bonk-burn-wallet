import { DynamoDBClient, GetItemCommand, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import {fromIni} from "@aws-sdk/credential-providers";
import BN from "bn.js";

const ddbClient = new DynamoDBClient({ region: 'us-east-1', credentials: fromIni({profile: 'burn_counter'})});

const incrementParams = (amount: BN) => {
  return {
    TableName: "BurnCounter",
    Key: {
        AppId: { S: "Test" },
    },
    UpdateExpression: "ADD BonkBurned :inc",
    ExpressionAttributeValues: {
        ":inc": { N: amount.toString()}
    }
}}

export const incrementBurned = async (burned: BN) => {
  try {
    const data = await ddbClient.send(new UpdateItemCommand(incrementParams(burned)));
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
  }
};


const readParams = {
  TableName: "BurnCounter", //TABLE_NAME
  Key: {
    AppId: { S: "Test" },
  },
  ProjectionExpression: "BonkBurned",
};

export const getBurned = async () => {
  try {
    const data = await ddbClient.send(new GetItemCommand(readParams));
    console.log("Success", data.Item);
    return data!.Item!.BonkBurned.N;

  } catch (err) {
    console.error(err);
    return null
  }
};

//incrementBurned(99)
//getBurned().then(b => console.log('burned', b))
