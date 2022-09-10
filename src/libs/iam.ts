export enum DBAction {
  BatchGet = 'dynamodb:BatchGetItem',
  Get = 'dynamodb:GetItem',
  Query = 'dynamodb:Query',
  Scan = 'dynamodb:Scan',
  BatchWrite = 'dynamodb:BatchWriteItem',
  Put = 'dynamodb:PutItem',
  Update = 'dynamodb:UpdateItem',
}
