import type { ChannelResponse, MessageResponseBase } from 'stream-chat';

const resetDatabase = () => {
  deleteDatabase();
  initializeDatabase();
};

if (__DEV__) {
  const DevMenu = require('react-native-dev-menu');
  DevMenu.addItem('Reset Stream Offline DB', resetDatabase);
}

const deleteDatabase = () => {
  const { message, status } = sqlite.delete(DB_NAME, DB_LOCATION);
  if (status === DB_STATUS_ERROR) {
    throw new Error(`Error deleting DB: ${message}`);
  }

  return true;
};

const tables = {
  queryChannelsMap: {
    id: 'TEXT PRIMARY KEY',
    cids: 'TEXT',
  },
  channels: {
    id: 'TEXT PRIMARY KEY',
    cid: 'TEXT NOT NULL',
    name: "TEXT DEFAULT ''",
  },
  messages: {
    id: 'TEXT PRIMARY KEY',
    cid: 'TEXT NOT NULL',
    text: "TEXT DEFAULT ''",
  },
};

type Table = keyof typeof tables;

export type PreparedQueries = [string] | [string, Array<any> | Array<Array<any>>];

const DB_NAME = 'stream-chat-react-native';
const DB_LOCATION = 'databases';
const DB_STATUS_ERROR = 1;

export const initializeDatabase = () =>
  executeQueries([
    [createCreateTableQuery('queryChannelsMap')],
    [createCreateTableQuery('channels')],
    [createCreateTableQuery('messages')],
  ]);

export const createInsertQuery = (table: Table, rows: string[]) => {
  const fields = Object.keys(tables[table]);

  const questionMarks = Array(fields.length).fill('?').join(',');

  const conflictMatchersWithoutPK = fields
    .filter((f) => f !== 'id')
    .map((f) => `${f}=excluded.${f}`);

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks})
  ON CONFLICT(id) DO UPDATE SET
    ${conflictMatchersWithoutPK.join(',')};`,
    rows,
  ];
};

const createCreateTableQuery = (table: Table) => {
  const columnsWithDescriptors = Object.entries(tables[table]).map((entry) => {
    const [key, value] = entry;
    return `${key} ${value}`;
  });

  return `CREATE TABLE IF NOT EXISTS ${table}(
${columnsWithDescriptors.join(',\n')}
);`;
};

export const executeQueries = (queries: PreparedQueries[]) => {
  openDB();

  const res = sqlite.executeSqlBatch(DB_NAME, queries);

  if (res.status === 1) {
    console.error(`Query/queries failed. ${res.message}`);
  }

  closeDB();
};

const openDB = () => {
  const { message, status } = sqlite.open(DB_NAME, DB_LOCATION);
  if (status === DB_STATUS_ERROR) {
    console.error(`Error opening database ${DB_NAME}: ${message}`);
  }
};
const closeDB = () => {
  const { message, status } = sqlite.close(DB_NAME);
  if (status === DB_STATUS_ERROR) {
    console.error(`Error closing database ${DB_NAME}: ${message}`);
  }
};

export const selectChannels = (query: string): ChannelResponse[] => {
  const channelIds = getChannelIdsForQuery(query);
  const channels = getChannelsForChannelIds(channelIds);
  // sort the channels as per channel ids
  channels.sort((a, b) => channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid));

  const hydratedChannels = channels.map((c) => {
    const messages = getMessagesForChannelId(c.cid);

    return {
      ...c,
      messages,
    };
  });
  return hydratedChannels;
};

export const selectMessages = (): MessageResponseBase[] => select('messages', '*');

const getMessagesForChannelId = (channelId: string) => {
  openDB();
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM messages WHERE cid = ?`,
    [channelId],
  );

  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  return rows ? rows._array : [];
};

const getChannelsForChannelIds = (channelIds: string[]) => {
  openDB();
  const questionMarks = Array(channelIds.length).fill('?').join(',');
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM channels WHERE cid IN (${questionMarks})`,
    [...channelIds],
  );

  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  return rows ? rows._array : [];
};

const getChannelIdsForQuery = (query: string): string[] => {
  console.log(
    createCreateTableQuery('queryChannelsMap'),
    `SELECT cids FROM queryChannelsMap where id = ${query};`,
  );
  openDB();

  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM queryChannelsMap where id = ?`,
    [query],
  );

  if (status === 1) {
    console.error(`Querying for queryChannelsMap failed: ${message}`);
  }

  const results = rows ? rows._array : [];

  const channelIdsStr = results?.[0]?.cids;

  return JSON.parse(channelIdsStr) || [];
};

export const storeChannels = (query: string, channels: ChannelNew[]) => {
  // Update the database only if the query is provided.
  const channelIds = channels.map((channel) => channel.cid);
  if (query) {
    const queries: PreparedQueries[] = [];
    queries.push(createInsertQuery('queryChannelsMap', [query, JSON.stringify(channelIds)]));
    for (const channel of channels) {
      const { cid, id, messages, name } = channel;
      queries.push(createInsertQuery('channels', [id, cid, name || '']) as PreparedQueries);

      if (messages !== undefined) {
        const messagesToUpsert = messages.map((message: MessageResponse) =>
          createInsertQuery('messages', [message.id, cid || '', message.text || '']),
        );
        queries.push(...messagesToUpsert);
      }
    }
    executeQueries(queries);
    console.log({ channelsLength: queries.length });
  }
};

export const storeMessage = (message) => {
  const query = createInsertQuery('messages', [message.id, message.cid || '', message.text || '']);
  executeQueries([query]);
};

const select = (table: Table, fields = '*') => {
  console.log(createCreateTableQuery('channels'));
  openDB();

  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT ${fields}
FROM ${table};`,
  );

  if (status === 1) {
    console.error(`Querying for ${table} failed: ${message}`);
  }

  return rows ? rows._array : [];
};
