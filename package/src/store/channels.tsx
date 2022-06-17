import { useEffect, useMemo, useRef } from 'react';

import { atom, useAtom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import {
  ChannelAPIResponse,
  ChannelResponse,
  MessageResponse,
  ReadResponse,
  StreamChat,
} from 'stream-chat';

import {
  createInsertQuery,
  executeQueries,
  initializeDatabase,
  PreparedQueries,
  selectChannels,
  selectMessages,
} from './database';

import type { ChannelNew } from '../components/ChannelPreview/ChannelPreview';

type ChannelID = string;

export const baseAtom = atom<ChannelNew[]>([]);
const baseMessagesAtom = atom<MessageResponse[]>(selectMessages());

export const useChannelMessagesAtom = (cid: string) => {
  // TODO: This memo will cause issues if it isn't changed in the future,
  //       since it's matching on the cid
  const channelMessagesAtom = useMemo(
    () => atom((get) => get(baseMessagesAtom).filter((message) => message.cid === cid)),
    [cid],
  );

  return useAtom(channelMessagesAtom);
};

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
    // const channels = selectChannels();
    // const conv = channels.map((channelData) => {
    //   return {
    //     channel: channelData,
    //     members: [],
    //     messages: messages.filter((message) => message.cid === channelData.cid),
    //     pinned_messages: [],
    //     hidden: false,
    //     membership: null,
    //     read: [currentUser],
    //     watcher_count: 0,
    //     watchers: [],
    //     duration: '',
    //   };
    // });
    // setChannels(conv.map(convertChannelData as any));
  }, []);
};

const derivedAtom = atom<{ channels: ChannelNew[]; query: string }>(
  (get) => get(baseAtom),
  (get, set, update) => {
    const nextValue = typeof update === 'function' ? update(get(baseAtom)) : update;

    initializeDatabase();
    set(baseAtom, nextValue.channels);

    const channels = nextValue.channels;
    const channelIds = channels.map((channel) => channel.cid);
    const query = nextValue.query;

    // Update the database only if the query is provided.
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
  },
);

export const channelsAtom = splitAtom(derivedAtom, (item) => item.cid);

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
