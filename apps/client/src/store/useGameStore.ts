import { create } from 'zustand';
import { Room, User } from '@skribbl/shared';

interface GameState {
  room: Room | null;
  me: User | null;
  setRoom: (room: Room) => void;
  setMe: (user: User) => void;
}

export const useGameStore = create<GameState>((set) => ({
  room: null,
  me: null,
  setRoom: (room) => set({ room }),
  setMe: (me) => set({ me }),
}));
