import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAtom } from 'jotai';
import { ChannelAvatar } from './ChannelAvatar';
import type { ChannelNew, ChannelPreviewProps } from './ChannelPreview';
import { ChannelPreviewMessage } from './ChannelPreviewMessage';
import { ChannelPreviewMutedStatus } from './ChannelPreviewMutedStatus';
import { ChannelPreviewStatus } from './ChannelPreviewStatus';
import { ChannelPreviewTitle } from './ChannelPreviewTitle';
import { ChannelPreviewUnreadCount } from './ChannelPreviewUnreadCount';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { vw } from '../../utils/utils';
import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

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
    PreviewAvatar = ChannelAvatar,
    PreviewMessage = ChannelPreviewMessage,
    PreviewStatus = ChannelPreviewStatus,
    PreviewTitle = ChannelPreviewTitle,
    PreviewUnreadCount = ChannelPreviewUnreadCount,
    PreviewMutedStatus = ChannelPreviewMutedStatus,
    unread,
  } = props;
  const messages = channel.messages;
  const {
    theme: {
      channelPreview: { container, contentContainer, row, title },
      colors: { border, white_snow },
    },
  } = useTheme();

  const displayName =
    useChannelPreviewDisplayName(
      channel,
      Math.floor(maxWidth / ((title.fontSize || styles.title.fontSize) / 2)),
    ) || 'Unnamed channel'; // TODO: remove, just for testing till members are available
  const latestMessagePreview = useLatestMessagePreview(channel);

  return (
    <TouchableOpacity
      onPress={() => {}}
      style={[
        styles.container,
        { backgroundColor: white_snow, borderBottomColor: border },
        container,
      ]}
      testID='channel-preview-button'
    >
      <PreviewAvatar channel={channel} />
      <View
        style={[styles.contentContainer, contentContainer]}
        testID={`channel-preview-content-${channel.id}`}
      >
        <View style={[styles.row, row]}>
          <PreviewTitle channel={channel} displayName={displayName} />
          <View style={[styles.statusContainer, row]}>
            <PreviewMutedStatus channel={channel} muted={'isChannelMuted'} />
            {/* <PreviewUnreadCount channel={channel} maxUnreadCount={maxUnreadCount} unread={unread} /> */}
          </View>
        </View>
        <View style={[styles.row, row]}>
          <PreviewMessage latestMessagePreview={latestMessagePreview} />
          {/* <PreviewStatus
            channel={channel}
            formatLatestMessageDate={formatLatestMessageDate}
            latestMessagePreview={latestMessagePreview}
          /> */}
        </View>
      </View>
    </TouchableOpacity>
  );
};
