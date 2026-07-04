import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { config } from '../src/config/config.js';
import { logger } from '../src/utils/logger.js';

const client = new DynamoDBClient({
  region: config.AWS_REGION,
  credentials: { accessKeyId: config.AWS_ACCESS_KEY_ID, secretAccessKey: config.AWS_SECRET_ACCESS_KEY },
  endpoint: config.DYNAMODB_ENDPOINT,
});

async function main(): Promise<void> {
  const existing = await client.send(new ListTablesCommand({}));
  if (existing.TableNames?.includes(config.DYNAMODB_TABLE_NAME)) {
    logger.info(`Table '${config.DYNAMODB_TABLE_NAME}' already exists.`);
    return;
  }

  await client.send(
    new CreateTableCommand({
      TableName: config.DYNAMODB_TABLE_NAME,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'customerId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'updatedAt', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'customerId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' },
            { AttributeName: 'updatedAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    })
  );

  logger.info(`Created table '${config.DYNAMODB_TABLE_NAME}' with GSI1 (customerId) and GSI2 (status).`);
}

main().catch((err) => {
  logger.error(err, 'local setup failed');
  process.exit(1);
});
