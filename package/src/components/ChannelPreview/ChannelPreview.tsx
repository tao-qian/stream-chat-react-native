import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type {
  Channel,
  ChannelMemberResponse,
  ChannelResponse,
  ChannelState,
  Event,
  MessageResponse,
  ReadResponse,
} from 'stream-chat';

import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { atom, PrimitiveAtom, useAtom } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import { getChannelMessagesAtom, useChannelMessagesAtom } from '../../store/channels';

export type ChannelNew = ChannelResponse & {
  messages: MessageResponse[];
  members: ChannelMemberResponse[];
  unreadCount: PrimitiveAtom<number>;
  read: Record<string, ReadResponse>;
};

export type ChannelAtom = PrimitiveAtom<ChannelNew>;

export type ChannelPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<ChannelsContextValue<StreamChatGenerics>, 'Preview'> & {
    /**
     * The previewed channel
     */
    channel: PrimitiveAtom<ChannelNew>;
  };

const useChannelListeners = (channel: ChannelNew) => {
  const setUnread = useUpdateAtom(channel.unreadCount);

  // useEffect(() => {
  //   const intervalID = setInterval(() => {
  //     if (channel.name === 'Coders') {
  //       setUnread((unread) => unread + 1);
  //     }
  //   }, 1000);

  //   return () => clearInterval(intervalID);
  // }, []);
};

/**
 * This component manages state for the ChannelPreviewMessenger UI component and receives
 * all props from the ChannelListMessenger component.
 */
const ChannelPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { channel: channelAtom, client, Preview } = props;

  const [channel] = useAtom(channelAtom);
  const [messages] = useChannelMessagesAtom(channel.cid);

  useChannelListeners(channel);

  const [lastMessage, setLastMessage] = useState<MessageResponse>(messages[messages.length - 1]);

  const [forceUpdate, setForceUpdate] = useState(0);
  const unread = channel.unreadCount;

  const latestMessagePreview = useLatestMessagePreview(channel, forceUpdate);
  // console.log({ cid: channel.cid });

  // I don't think these are necessary anymore, we can make lastMessage an atom, and update that
  // from whereever
  //
  // const channelLastMessage = lastMessage;
  // const channelLastMessageString = `${channelLastMessage?.id}${channelLastMessage?.updated_at}`;

  // useEffect(() => {
  //   if (
  //     channelLastMessage &&
  //     (channelLastMessage.id !== lastMessage?.id ||
  //       channelLastMessage.updated_at !== lastMessage?.updated_at)
  //   ) {
  //     setLastMessage(channelLastMessage);
  //   }

  //   const newUnreadCount = 0; //channel.countUnread();

  //   if (newUnreadCount !== unread) {
  //     setUnread(newUnreadCount);
  //   }
  // }, [channelLastMessageString]);
  //

  // TODO: Figure out events
  // useEffect(() => {
  //   const handleEvent = (event: Event<StreamChatGenerics>) => {
  //     if (event.message) {
  //       setLastMessage(event.message);
  //     }

  //     if (event.type === 'message.new') {
  //       setUnread(channel.countUnread());
  //     }
  //   };

  //   // channel.on('message.new', handleEvent);
  //   // channel.on('message.updated', handleEvent);
  //   // channel.on('message.deleted', handleEvent);

  //   return () => {
  //     // channel.off('message.new', handleEvent);
  //     // channel.off('message.updated', handleEvent);
  //     // channel.off('message.deleted', handleEvent);
  //   };
  // }, []);
  // useEffect(() => {
  //   const handleReadEvent = (event: Event<StreamChatGenerics>) => {
  //     if (event.user?.id === client.userID) {
  //       setUnread(0);
  //     } else if (event.user?.id) {
  //       setForceUpdate((prev) => prev + 1);
  //     }
  //   };

  //   // channel.on('message.read', handleReadEvent);
  //   // return () => channel.off('message.read', handleReadEvent);
  // }, []);

  return <Preview channel={channel} latestMessagePreview={latestMessagePreview} unread={unread} />;
};

export type ChannelPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<ChannelPreviewPropsWithContext<StreamChatGenerics>, 'channel'>> &
  Pick<ChannelPreviewPropsWithContext<StreamChatGenerics>, 'channel'>;

export const ChannelPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewProps<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { Preview } = useChannelsContext<StreamChatGenerics>();

  return <ChannelPreviewWithContext {...{ client, Preview }} {...props} />;
};
