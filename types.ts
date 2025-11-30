export enum SymbolType {
  BAR = 'BAR',
  SEVEN = 'SEVEN',
  STAR = 'STAR',
  WATERMELON = 'WATERMELON',
  BELL = 'BELL',
  PLUM = 'PLUM',
  ORANGE = 'ORANGE',
  APPLE = 'APPLE',
  LUCK = 'LUCK' // The chaos/wild symbol usually in the middle or corners
}

export interface GridCell {
  id: number;
  symbol: SymbolType;
  multiplier: number;
  isSmall?: boolean; // Small usually means lower payout or distinct visual
  isSpecial?: boolean; // For Red Bar / Blue Bar distinction
}

export interface BetState {
  [SymbolType.BAR]: number;
  [SymbolType.SEVEN]: number;
  [SymbolType.STAR]: number;
  [SymbolType.WATERMELON]: number;
  [SymbolType.BELL]: number;
  [SymbolType.PLUM]: number;
  [SymbolType.ORANGE]: number;
  [SymbolType.APPLE]: number;
}

export const INITIAL_BETS: BetState = {
  [SymbolType.BAR]: 0,
  [SymbolType.SEVEN]: 0,
  [SymbolType.STAR]: 0,
  [SymbolType.WATERMELON]: 0,
  [SymbolType.BELL]: 0,
  [SymbolType.PLUM]: 0,
  [SymbolType.ORANGE]: 0,
  [SymbolType.APPLE]: 0,
};