import * as aws from '@pulumi/aws'
import {PostConfirmationConfirmSignUpTriggerEvent} from 'aws-lambda'
import {createCognitoUser} from '../libs/dynamo'
import {randomString} from '../libs/string'

/**
 * This lambda triggers when a user is confirmed (after enterering the confirmation code).
 * It will create a user entry in the DynamoDB table which maps to the cognito user.
 */
export const confirmUserSignupHandler: aws.lambda.Callback<
  PostConfirmationConfirmSignUpTriggerEvent,
  unknown
> = async (event, _, callback) => {
  console.log('event', JSON.stringify(event, null, 2))

  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const name = event.request.userAttributes['name']
    const suffix = randomString(8, randomString.alphaUpper, randomString.num)
    const screenName = `${name.replace(/^a-zA-Z0-9/g, '')}${suffix}`
    try {
      await createCognitoUser({id: event.userName, name, screenName})
    } catch (error) {
      console.log('error', error)
      callback(error)
    }
    callback(null, event)
  } else {
    callback(null, event)
  }
}
