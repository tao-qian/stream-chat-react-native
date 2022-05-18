import { useRef } from 'react';
import { atom, useAtom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import type { Channel } from 'stream-chat';

const baseAtom = atom<Channel[]>([]);

const derivedAtom = atom<Channel[]>(
  (get) => get(baseAtom),
  (get, set, update) => {
    const nextValue = typeof update === 'function' ? update(get(baseAtom)) : update;

    set(
      baseAtom,
      nextValue.map((channelInstance: Channel) => ({ ...channelInstance })),
    );
    //store to database here
  },
);

const channelsAtom = splitAtom(derivedAtom, (item) => item.cid);

export const useDerivedAtom = () => {
  const atomRef = useRef(derivedAtom);

  return useAtom(atomRef.current);
};

export const useChannelsAtom = () => {
  const atomRef = useRef(channelsAtom);

  return useAtom(atomRef.current);
};
