export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | 'black_joker' | 'red_joker';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number; // For comparison
    id: string;
}

const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const createDeck = (includeJokers = true): Card[] => {
    const deck: Card[] = [];

    SUITS.forEach(suit => {
        RANKS.forEach((rank, index) => {
            deck.push({
                suit,
                rank,
                value: index + 1, // 3 is lowest (1), 2 is highest (13)
                id: `${suit}-${rank}`
            });
        });
    });

    if (includeJokers) {
        deck.push({ suit: 'joker', rank: 'black_joker', value: 14, id: 'joker-black' });
        deck.push({ suit: 'joker', rank: 'red_joker', value: 15, id: 'joker-red' });
    }

    return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

export const sortHand = (hand: Card[]): Card[] => {
    return [...hand].sort((a, b) => b.value - a.value); // Descending order
};

export const getCardDisplay = (card: Card) => {
    if (card.suit === 'joker') {
        return card.rank === 'red_joker' ? 'Red Joker' : 'Black Joker';
    }
    const suitSymbols: Record<Suit, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
        joker: ''
    };
    return `${suitSymbols[card.suit]}${card.rank}`;
};

export const getCardColor = (card: Card) => {
    if (card.suit === 'hearts' || card.suit === 'diamonds' || card.rank === 'red_joker') {
        return 'text-red-500';
    }
    return 'text-black dark:text-white';
};
