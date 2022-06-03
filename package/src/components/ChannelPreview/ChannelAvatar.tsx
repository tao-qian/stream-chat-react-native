import React from 'react';

import type { ChannelNew, ChannelPreviewProps } from './ChannelPreview';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';
import type { Channel } from 'stream-chat';

export type ChannelAvatarProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = { channel: ChannelNew };

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelAvatarProps<StreamChatGenerics>,
) => {
  const { channel } = props;

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayPresence = useChannelPreviewDisplayPresence(channel);

  if (displayAvatar.images) {
    return (
      <GroupAvatar
        images={displayAvatar.images as string[]}
        names={displayAvatar.names}
        size={40}
      />
    );
  }

  return (
    <Avatar
      image={displayAvatar.image as string}
      name={displayAvatar.name}
      online={displayPresence}
      size={40}
    />
  );
};
