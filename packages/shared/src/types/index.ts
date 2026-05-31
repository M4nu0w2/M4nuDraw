export interface AvatarConfig {
  bodyColor: string;
  eyes: string;
  mouth: string;
  hat: string;
  glasses: string;
  aura: string;
  outfit: string;
}

export interface User {
  id: string;
  username: string;
  score: number;
  avatar?: AvatarConfig;
}

export interface Room {
  id: string;
  players: User[];
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  ownerId?: string;
  currentDrawerId?: string;
  currentWord?: string;
  currentWordDisguised?: string;
  wordChosen?: boolean;
  timerType?: 'CHOOSE_WORD' | 'DRAWING';
  timeLeft?: number;
  maxTime?: number;
  correctGuesserIds?: string[];
  currentRound?: number;
  maxRounds?: number;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string, username: string, avatar?: AvatarConfig) => void;
  startGame: (maxRounds?: number) => void;
  selectWord: (word: string) => void;
  draw: (data: DrawData) => void;
  clearCanvas: () => void;
  bombCanvas: () => void;
  chatMessage: (message: string) => void;
  backToLobby: () => void;
  emojiReaction: (emoji: string) => void;
}

export interface RoundResult {
  userId: string;
  username: string;
  pointsEarned: number;
  isDrawer: boolean;
  hasGuessed: boolean;
}

export interface ServerToClientEvents {
  roomState: (room: Room) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  drawData: (data: DrawData) => void;
  drawHistory: (history: DrawData[]) => void;
  clearCanvas: () => void;
  bombCanvas: () => void;
  chatMessage: (userId: string, message: string) => void;
  gameStarted: () => void;
  turnStarted: (drawerId: string) => void;
  wordChoices: (words: string[]) => void;
  secretWord: (word: string) => void;
  correctGuess: (userId: string) => void;
  roundEnded: (word: string, results: RoundResult[]) => void;
  emojiReaction: (userId: string, emoji: string) => void;
}

export interface DrawData {
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  points: number[];
}
