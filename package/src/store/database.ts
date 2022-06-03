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
  const { status, message } = sqlite.delete(DB_NAME, DB_LOCATION);
  if (status === DB_STATUS_ERROR) {
    throw new Error(`Error deleting DB: ${message}`);
  }

  return true;
};

const tables = {
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

export const initializeDatabase = () => {
  return executeQueries([
    [createCreateTableQuery('channels')],
    [createCreateTableQuery('messages')],
  ]);
};

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
  const { status, message } = sqlite.open(DB_NAME, DB_LOCATION);
  if (status === DB_STATUS_ERROR) {
    console.error(`Error opening database ${DB_NAME}: ${message}`);
  }
};
const closeDB = () => {
  const { status, message } = sqlite.close(DB_NAME);
  if (status === DB_STATUS_ERROR) {
    console.error(`Error closing database ${DB_NAME}: ${message}`);
  }
};

export const selectChannels = (): ChannelResponse[] => select('channels', '*');

export const selectMessages = (): MessageResponseBase[] => select('messages', '*');

const select = (table: Table, fields: string = '*') => {
  console.log(createCreateTableQuery('channels'));
  openDB();

  const { status, rows, message } = sqlite.executeSql(
    DB_NAME,
    `SELECT ${fields}
FROM ${table};`,
  );

  if (status === 1) {
    console.error(`Querying for ${table} failed: ${message}`);
  }

  return rows ? rows._array : [];
};
