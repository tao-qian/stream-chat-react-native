import { useEffect, useRef } from 'react';
import { atom, useAtom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import {
  ChannelAPIResponse,
  ChannelResponse,
  MessageResponse,
  ReadResponse,
  StreamChat,
} from 'stream-chat';
import type { ChannelNew } from '../components/ChannelPreview/ChannelPreview';
import {
  DBData,
  getChannels,
  createInsertQuery,
  initializeDatabase,
  executeQueries,
  getMessages,
} from './database';

type ChannelID = string;

const baseAtom = atom<ChannelNew[]>([]);
const baseMessagesAtom = atom<MessageResponse[]>(getMessages());

const derivedMessagesAtom = atom<MessageResponse[]>(
  (get) => get(baseMessagesAtom),
  (get, set, update) => {
    const nextValue = typeof update === 'function' ? update(get(baseAtom)) : update;
    set(derivedMessagesAtom, nextValue);
  },
);

export const useInitializeDatabaseValues = () => {
  const atomRef = useRef(derivedAtom);
  const messageAtomRef = useRef(derivedMessagesAtom);
  const [messages, setMessages] = useAtom(messageAtomRef.current);
  const [, setChannels] = useAtom(derivedAtom);
  const currentUser = { id: 'somebody' };

  useEffect(() => {
    const channels = getChannels();
    const conv = channels.map((channelData) => {
      return {
        channel: channelData,
        members: [],
        messages: messages.filter((message) => message.cid === channelData.cid),
        pinned_messages: [],
        hidden: false,
        membership: null,
        read: [currentUser],
        watcher_count: 0,
        watchers: [],
        duration: '',
      };
    });

    setChannels(conv.map(convertChannelData as any));
  }, []);
};

const derivedAtom = atom<ChannelNew[]>(
  (get) => get(baseAtom),
  (get, set, update) => {
    const nextValue = typeof update === 'function' ? update(get(baseAtom)) : update;

    initializeDatabase();
    set(baseAtom, nextValue);

    let queries: DBData[] = [];
    for (let channel of nextValue) {
      const { id, cid, name, messages } = channel;
      queries.push(createInsertQuery('channels', [id, cid, name || '']) as DBData);

      if (messages !== undefined) {
        const messagesToUpsert = messages.map((message: MessageResponse) => {
          return createInsertQuery('messages', [message.id, cid || '', message.text || '']);
        });
        queries.push(...messagesToUpsert);
      }
    }
    executeQueries(queries);
  },
);

const channelsAtom = splitAtom(derivedAtom, (item) => item.cid);

export const messagesAtom = atom<Record<ChannelID, MessageResponse>>({});

export const useMessagesAtom = (channelID: ChannelID) => {
  const channelMessagesAtom = atom((get) => get(messagesAtom)[channelID]);

  return channelMessagesAtom;
};

export const useDerivedAtom = () => {
  const atomRef = useRef(derivedAtom);

  return useAtom(atomRef.current);
};

export const useChannelsAtom = () => {
  const atomRef = useRef(channelsAtom);

  return useAtom(atomRef.current);
};

const clientAtom = atom<StreamChat>(StreamChat.getInstance('yjrt5yxw77ev'));

export const convertChannelData = (chan: ChannelAPIResponse) => {
  const unreadCountAtom = atom(0);

  const messagesAtom = chan.messages || [];

  const base = chan.channel ? chan.channel : chan;

  return {
    ...base,
    messages: messagesAtom,
    unreadCount: atom(
      (get) => get(unreadCountAtom),
      (get, set, update) => {
        const newValue = typeof update === 'function' ? update(get(unreadCountAtom)) : update;

        set(unreadCountAtom, newValue);
      },
    ), // TODO: Implement logic related to this, and make this readable

    read:
      chan.read?.reduce((acc: ReadResponse, current) => ({
        ...current,
        [acc.user.id]: acc,
      })) || [],

    members: chan.members || [],
    image: chan.channel?.image || '',
  };
};
