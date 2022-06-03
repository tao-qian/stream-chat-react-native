import { useEffect, useState } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { ChannelNew } from '../ChannelPreview';

export const getChannelPreviewDisplayAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelNew,
  client: StreamChat<StreamChatGenerics>,
) => {
  const currentUserId = client?.user?.id;
  const channelId = channel?.id;
  const channelName = channel.name;
  const channelImage = channel?.image;

  if (channelImage) {
    return {
      id: channelId,
      image: channelImage,
      name: channelName,
    };
  } else if (currentUserId && false) {
    const members = []; //Object.values(channel.members);
    const otherMembers = members.filter((member) => member.user?.id !== currentUserId);

    if (otherMembers.length === 1) {
      return {
        id: otherMembers[0].user?.id,
        image: otherMembers[0].user?.image,
        name: channelName || otherMembers[0].user?.name,
      };
    }

    return {
      ids: otherMembers.slice(0, 4).map((member) => member.user?.id || ''),
      images: otherMembers.slice(0, 4).map((member) => member.user?.image || ''),
      names: otherMembers.slice(0, 4).map((member) => member.user?.name || ''),
    };
  }

  return {
    id: channelId,
    name: channelName,
  };
};

/**
 * Hook to set the display avatar for channel preview
 * @param {*} channel
 *
 * @returns {object} e.g., { image: 'http://dummyurl.com/test.png', name: 'Uhtred Bebbanburg' }
 */
export const useChannelPreviewDisplayAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelNew,
) => {
  const { client } = useChatContext<StreamChatGenerics>();

  const image = channel?.image;
  const name = channel?.name;
  const id = client?.user?.id;

  const [displayAvatar, setDisplayAvatar] = useState(
    getChannelPreviewDisplayAvatar(channel, client),
  );

  useEffect(() => {
    setDisplayAvatar(getChannelPreviewDisplayAvatar(channel, client));
  }, [id, image, name]);

  return displayAvatar;
};
