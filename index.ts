import * as aws from '@pulumi/aws'
import * as fs from 'fs'
import * as path from 'path'
import * as pulumi from '@pulumi/pulumi'
import {DBAction} from './src/libs/iam'
import {confirmUserSignupHandler} from './src/functions/confirm-user-signup'

const stack = pulumi.getStack()
const config = new pulumi.Config()
const region = config.require('region')

const usersTable = new aws.dynamodb.Table('UsersTable', {
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'id',
  attributes: [
    {
      name: 'id',
      type: 'S',
    },
  ],
  tags: {
    Name: 'twitter-users-table',
    Environment: stack,
  },
})

const tweetsTable = new aws.dynamodb.Table('TweetsTable', {
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'id',
  attributes: [
    {
      name: 'id',
      type: 'S',
    },
    {
      name: 'creator',
      type: 'S',
    },
    {
      name: 'retweetOf',
      type: 'S',
    },
  ],
  globalSecondaryIndexes: [
    {
      name: 'byCreator',
      hashKey: 'creator',
      rangeKey: 'id',
      projectionType: 'ALL',
    },
    {
      name: 'retweetsByCreator',
      hashKey: 'creator',
      rangeKey: 'retweetOf',
      projectionType: 'ALL',
    },
  ],

  tags: {
    Name: 'twitter-tweets-table',
    Environment: stack,
  },
})

const confirmUserIamRole = new aws.iam.Role('confirm-user-signup-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [DBAction.Put],
        Resource: usersTable.arn,
      },
    ],
  }),
})

export const postConfirmationLambda = new aws.lambda.CallbackFunction(
  'post-confirmation-signup-lambda',
  {
    runtime: 'nodejs14.x',
    callback: confirmUserSignupHandler,
    role: confirmUserIamRole,
    environment: {
      variables: {
        USERS_TABLE: usersTable.name,
        REGION: region,
      },
    },
  }
)

const userPool = new aws.cognito.UserPool('user-pool', {
  autoVerifiedAttributes: ['email'],
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    requireUppercase: false,
  },
  usernameAttributes: ['email'],
  schemas: [
    {attributeDataType: 'String', name: 'name', required: false, mutable: true},
  ],
  lambdaConfig: {
    postConfirmation: postConfirmationLambda.arn,
  },
})

const userPoolClient = new aws.cognito.UserPoolClient('user-pool-web-client', {
  userPoolId: userPool.id,
  name: 'twitter-web-client',
  explicitAuthFlows: [
    'ALLOW_USER_SRP_AUTH',
    'ALLOW_USER_PASSWORD_AUTH',
    'ALLOW_REFRESH_TOKEN_AUTH',
  ],
  preventUserExistenceErrors: 'ENABLED',
})

/**
 * Add lambda invoke permissions to cognito
 */
new aws.lambda.Permission('post-confirmation-signup-lambda-permission', {
  action: 'lambda:InvokeFunction',
  function: postConfirmationLambda.name,
  principal: 'cognito-idp.amazonaws.com',
  sourceArn: userPool.arn,
})

const schema = fs.readFileSync(
  path.join(__dirname, 'schema.api.graphql'),
  'utf8'
)

const api = new aws.appsync.GraphQLApi('appsync-twitter-api', {
  authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  userPoolConfig: {
    awsRegion: 'eu-central-1',
    defaultAction: 'ALLOW',
    userPoolId: userPool.id,
  },
  schema,
})
