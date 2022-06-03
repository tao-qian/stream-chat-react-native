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

const createTableQuery = `CREATE TABLE IF NOT EXISTS channels(
	id TEXT PRIMARY KEY,
  cid TEXT NOT NULL,
	name TEXT DEFAULT ''
);`;

const createMembersQuery = `CREATE TABLE IF NOT EXISTS members(
	user_id TEXT,
  banned INTEGER DEFAULT 0,
	channel_role TEXT,
  invite_accepted_at TEXT,
  invite_rejected_at TEXT,
  invited INTEGER DEFAULT 0,
  is_moderator INTEGER DEFAULT 0,
  role TEXT,
  shadow_banned INTEGER DEFAULT 0,
  updated_at TEXT,
  FOREIGN KEY (user_id)
    REFERENCES users (user_id)
);`;

const createMessagesQuery = `CREATE TABLE IF NOT EXISTS messages(
  id TEXT PRIMARY KEY,
  text TEXT DEFAULT '',
  cid TEXT NOT NULL
);`;

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

export type DBData = [string] | [string, Array<any> | Array<Array<any>>];
type Queries = Array<string | DBData[]>;

const DB_NAME = 'stream-chat-react-native';
const DB_LOCATION = 'databases';
const DB_STATUS_ERROR = 1;

export const initializeDatabase = () => {
  return executeQueries([[createTableQuery], [createMessagesQuery]]);
};

export const createInsertQuery = (table: Table, rows: string[]) => {
  const fields = Object.keys(tables[table]);

  const questionMarks = Array(fields.length).fill('?').join(',');

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks})
  ON CONFLICT(id) DO UPDATE SET
    ${fields
      .filter((f) => f !== 'id')
      .map((f) => `${f}=excluded.${f}`)
      .join(',')};`,
    rows,
  ];
};

export const executeQueries = (queries: DBData[]) => {
  const db = sqlite.open(DB_NAME, DB_LOCATION);

  if (db.status === DB_STATUS_ERROR) {
    console.error('Database could not be opened!');
    throw new Error('fuck');
  }

  const res = sqlite.executeSqlBatch(DB_NAME, queries);

  if (res.status === 1) {
    console.error(`Query/queries failed. ${res.message}`);
  }

  sqlite.close(DB_NAME);
};

export const getChannels = (): ChannelResponse[] => {
  const db = sqlite.open(DB_NAME, DB_LOCATION);
  const { status, rows, message } = sqlite.executeSql(
    DB_NAME,
    `SELECT *
FROM channels;`,
    [],
  );

  if (status === 1) {
    console.error(`getting channels failed: ${message}`);
  }

  return rows ? rows._array : [];
};

export const getMessages = (): MessageResponseBase[] => {
  const db = sqlite.open(DB_NAME, DB_LOCATION);
  const { status, rows, message } = sqlite.executeSql(
    DB_NAME,
    `SELECT *
FROM messages;`,
    [],
  );

  if (status === 1) {
    console.error(`getting messages failed: ${message}`);
  }

  return rows ? rows._array : [];
};
