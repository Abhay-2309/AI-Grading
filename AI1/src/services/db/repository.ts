import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../../config/config.js';
import { StorageError, InvalidStateTransitionError, NotFoundError } from '../../utils/errors.js';
import {
  LEGAL_TRANSITIONS,
  type GradingRequestRecord,
  type RequestStatus,
} from './schema.js';

const client = new DynamoDBClient({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: config.DYNAMODB_ENDPOINT,
});

const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE = config.DYNAMODB_TABLE_NAME;

function pk(requestId: string): string {
  return `REQUEST#${requestId}`;
}

export class GradingRepository {
  async create(record: GradingRequestRecord): Promise<void> {
    try {
      await doc.send(
        new PutCommand({
          TableName: TABLE,
          Item: { PK: pk(record.requestId), SK: 'META', ...record },
          ConditionExpression: 'attribute_not_exists(PK)',
        })
      );
    } catch (err) {
      throw new StorageError('Failed to create grading request record.', {
        requestId: record.requestId,
        cause: String(err),
      });
    }
  }

  async get(requestId: string): Promise<GradingRequestRecord> {
    try {
      const res = await doc.send(
        new GetCommand({ TableName: TABLE, Key: { PK: pk(requestId), SK: 'META' } })
      );
      if (!res.Item) {
        throw new NotFoundError(`No grading request found for id '${requestId}'.`, { requestId });
      }
      const { PK, SK, ...rest } = res.Item as Record<string, unknown>;
      return rest as unknown as GradingRequestRecord;
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new StorageError('Failed to fetch grading request record.', {
        requestId,
        cause: String(err),
      });
    }
  }

  /** Merges arbitrary fields into the record without touching status. */
  async update(requestId: string, patch: Partial<GradingRequestRecord>): Promise<void> {
    const now = new Date().toISOString();
    const entries = Object.entries({ ...patch, updatedAt: now }).filter(([k]) => k !== 'requestId');

    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const setClauses = entries.map(([k, v], i) => {
      names[`#f${i}`] = k;
      values[`:v${i}`] = v;
      return `#f${i} = :v${i}`;
    });

    try {
      await doc.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: pk(requestId), SK: 'META' },
          UpdateExpression: `SET ${setClauses.join(', ')}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ConditionExpression: 'attribute_exists(PK)',
        })
      );
    } catch (err) {
      throw new StorageError('Failed to update grading request record.', {
        requestId,
        cause: String(err),
      });
    }
  }

  /**
   * Enforces legal state transitions via a DynamoDB conditional write, so
   * illegal transitions (e.g. COMPLETED -> ANALYZING) are impossible even
   * under concurrent requests or retried invocations.
   */
  async transitionStatus(
    requestId: string,
    from: RequestStatus,
    to: RequestStatus,
    extra?: Partial<GradingRequestRecord>,
    note?: string
  ): Promise<void> {
    const legal = LEGAL_TRANSITIONS[from];
    if (!legal.includes(to)) {
      throw new InvalidStateTransitionError(
        `Illegal state transition from '${from}' to '${to}'.`,
        { requestId, from, to }
      );
    }

    const now = new Date().toISOString();
    const historyEntry = { status: to, timestamp: now, ...(note ? { note } : {}) };

    const names: Record<string, string> = { '#status': 'status', '#history': 'statusHistory' };
    const values: Record<string, unknown> = {
      ':to': to,
      ':from': from,
      ':now': now,
      ':historyEntry': [historyEntry],
      ':emptyList': [],
    };
    const setClauses = [
      '#status = :to',
      'updatedAt = :now',
      '#history = list_append(if_not_exists(#history, :emptyList), :historyEntry)',
    ];

    if (extra) {
      for (const [i, [k, v]] of Object.entries(extra).entries()) {
        if (k === 'requestId' || k === 'status' || k === 'statusHistory') continue;
        names[`#e${i}`] = k;
        values[`:e${i}`] = v;
        setClauses.push(`#e${i} = :e${i}`);
      }
    }

    try {
      await doc.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: pk(requestId), SK: 'META' },
          UpdateExpression: `SET ${setClauses.join(', ')}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ConditionExpression: '#status = :from',
        })
      );
    } catch (err) {
      throw new InvalidStateTransitionError(
        `Failed to transition '${requestId}' from '${from}' to '${to}'. It may have already changed state.`,
        { requestId, from, to, cause: String(err) }
      );
    }
  }

  async findStuckAnalyzing(olderThanMs: number): Promise<GradingRequestRecord[]> {
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    try {
      const res = await doc.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: 'GSI2',
          KeyConditionExpression: '#status = :status AND updatedAt < :cutoff',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'ANALYZING', ':cutoff': cutoff },
        })
      );
      return (res.Items ?? []) as unknown as GradingRequestRecord[];
    } catch (err) {
      throw new StorageError('Failed to query stuck requests.', { cause: String(err) });
    }
  }
}

export const gradingRepository = new GradingRepository();
