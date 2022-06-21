import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAtom } from 'jotai';

import { ChannelAvatar } from './ChannelAvatar';
import type { ChannelNew, ChannelPreviewProps } from './ChannelPreview';
import { ChannelPreviewMessage } from './ChannelPreviewMessage';
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { ChannelPreviewMutedStatus } from './ChannelPreviewMutedStatus';
import { ChannelPreviewStatus } from './ChannelPreviewStatus';
import { ChannelPreviewTitle } from './ChannelPreviewTitle';
import { ChannelPreviewUnreadCount } from './ChannelPreviewUnreadCount';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { storeMessage } from '../../store/database';
import { vw } from '../../utils/utils';
const maxWidth = vw(80) - 16 - 40;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  contentContainer: { flex: 1 },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  title: { fontSize: 14, fontWeight: '700' },
});

export const ChannelListItem = (props) => {
  const {
    channel,
    formatLatestMessageDate,
    maxUnreadCount,
    onSelect,
    Preview = ChannelPreviewMessenger,
    unread,
  } = props;
  const [channelAtom, setChannel] = useAtom(channel);
  const { client } = useChatContext();

  const latestMessagePreview = useLatestMessagePreview(channelAtom);
  console.log('re-rendering channel list item', channelAtom.id);
  useEffect(() => {
    client.on('message.new', (event) => {
      if (event.cid === channelAtom.cid) {
        setChannel({
          ...channelAtom,
          messages: [...channelAtom.messages, event.message],
        });
        storeMessage(event.message);
      }
    });
  }, []);

  return <Preview channel={channelAtom} latestMessagePreview={latestMessagePreview} />;
};
