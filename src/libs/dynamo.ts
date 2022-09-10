import {DynamoDBClient, PutItemCommand} from '@aws-sdk/client-dynamodb'

type CreateUser = {
  id: string
  name: string
  screenName: string
}

export async function createCognitoUser({id, name, screenName}: CreateUser) {
  const usersTable = process.env.USERS_TABLE

  if (!usersTable) {
    throw new Error('No USERS_TABLE provided')
  }

  const region = process.env.REGION

  if (!region) {
    throw new Error('No REGION provided')
  }

  const dynamo = new DynamoDBClient({region: 'eu-central-1'})

  const Item = {
    id: {S: id},
    name: {S: name},
    screenName: {S: screenName},
    createdAt: {S: new Date().toJSON()},
    followersCount: {N: '0'},
    followingCount: {N: '0'},
    tweetsCount: {N: '0'},
    likesCounts: {N: '0'},
  }
  const putCommand = new PutItemCommand({
    TableName: usersTable,
    Item,
    ConditionExpression: 'attribute_not_exists(id)',
  })

  return dynamo.send(putCommand)
}
