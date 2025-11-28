import React, { useState, useEffect } from 'react';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNavigate } from 'react-router';
import { Lobby } from '@/components/lan/Lobby';
import { Button } from '@/components/ui/button';
import { createDeck, shuffleDeck, Card } from '@/utils/cardUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { PlayingCard } from '@/components/lan/PlayingCard';
import { useTranslation } from 'react-i18next';
import { Coins, Eye, EyeOff, Trophy, User } from 'lucide-react';

// ... (Keep existing interfaces and logic helpers)
type Phase = 'lobby' | 'betting' | 'ended';

interface PlayerState {
    id: string;
    hand: Card[];
    isFolded: boolean;
    isLost: boolean;
    hasLooked: boolean;
    chips: number;
    currentBet: number;
}

interface GameState {
    phase: Phase;
    players: PlayerState[];
    currentTurn: number;
    pot: number;
    currentBet: number;
    winner: string | null;
    round: number;
    roundWinner: string | null;
    playerChips: { [peerId: string]: number };
}

// Hand Ranking Logic (Same as before)
const HAND_TYPES = {
    LEOPARD: 6,
    STRAIGHT_FLUSH: 5,
    FLUSH: 4,
    STRAIGHT: 3,
    PAIR: 2,
    HIGH_CARD: 1,
};

const evaluateHand = (hand: Card[]) => {
    const sorted = [...hand].sort((a, b) => b.value - a.value);
    const v = sorted.map(c => c.value);
    const suits = sorted.map(c => c.suit);
    const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
    const isStraight = (v[0] === v[1] + 1 && v[1] === v[2] + 1) || (v[0] === 14 && v[1] === 3 && v[2] === 2);

    const isLeopard = v[0] === v[1] && v[1] === v[2];
    const isPair = v[0] === v[1] || v[1] === v[2];

    if (isLeopard) return { type: HAND_TYPES.LEOPARD, value: v[0] };
    if (isFlush && isStraight) return { type: HAND_TYPES.STRAIGHT_FLUSH, value: v[0] };
    if (isFlush) return { type: HAND_TYPES.FLUSH, value: v[0] };
    if (isStraight) return { type: HAND_TYPES.STRAIGHT, value: v[0] };
    if (isPair) {
        const pairValue = v[0] === v[1] ? v[0] : v[1];
        const kicker = v[0] === v[1] ? v[2] : v[0];
        return { type: HAND_TYPES.PAIR, value: pairValue * 100 + kicker };
    }
    return { type: HAND_TYPES.HIGH_CARD, value: v[0] * 10000 + v[1] * 100 + v[2] };
};

const compareHands = (h1: Card[], h2: Card[]) => {
    const e1 = evaluateHand(h1);
    const e2 = evaluateHand(h2);
    if (e1.type !== e2.type) return e1.type - e2.type;
    return e1.value - e2.value;
};

export default function ZhaJinhua() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { peerId, isHost, connections, error, hostGame, joinGame, sendData, leaveGame, removePlayer } = useMultiplayer();
    const [gameState, setGameState] = useState<GameState>({
        phase: 'lobby',
        players: [],
        currentTurn: 0,
        pot: 0,
        currentBet: 10,
        winner: null,
        round: 1,
        roundWinner: null,
        playerChips: {},
    });
    
    const [compareTarget, setCompareTarget] = useState<number | null>(null);

    // ... (Keep existing useEffects and game logic methods: startGame, updateAndBroadcast, handleAction, processAction, getNextActivePlayer)
    // Re-implementing them briefly to ensure context is kept

    useEffect(() => {
        const handleData = (e: any) => {
            const { data } = e.detail;
            if (data.type === 'UPDATE_STATE') {
                setGameState(data.state);
            }
        };
        window.addEventListener('multiplayer-data', handleData);
        return () => window.removeEventListener('multiplayer-data', handleData);
    }, []);

    const startGame = () => {
        if (!isHost) return;
        const allPeerIds = [peerId, ...connections.map(c => c.peer)];
        
        // 初始化或获取现有的玩家金额
        let playerChips: { [key: string]: number } = {};
        if (gameState.playerChips && Object.keys(gameState.playerChips).length > 0) {
            playerChips = gameState.playerChips;
        } else {
            allPeerIds.forEach(id => {
                playerChips[id] = 800;
            });
        }
        
        // 检查是否有玩家没有金额了（游戏结束）
        const playersWithChips = allPeerIds.filter(id => playerChips[id] > 0);
        if (playersWithChips.length <= 1) {
            // 游戏结束，只剩一个玩家或没有玩家
            const winner = playersWithChips[0] || null;
            const newState: GameState = {
                phase: 'ended',
                players: [],
                currentTurn: 0,
                pot: 0,
                currentBet: 10,
                winner,
                round: gameState.round,
                roundWinner: null,
                playerChips,
            };
            updateAndBroadcast(newState);
            return;
        }
        
        startRound(playerChips);
    };
    
    const startRound = (playerChips: { [key: string]: number }) => {
        if (!isHost) return;
        const deck = shuffleDeck(createDeck(false));
        const allPeerIds = Object.keys(playerChips).filter(id => playerChips[id] > 0);

        const players: PlayerState[] = allPeerIds.map((id, i) => ({
            id,
            hand: deck.slice(i * 3, i * 3 + 3),
            isFolded: false,
            isLost: false,
            hasLooked: false,
            chips: playerChips[id],
            currentBet: 0,
        }));

        const newState: GameState = {
            phase: 'betting',
            players,
            currentTurn: 0,
            pot: 0,
            currentBet: 10,
            winner: null,
            round: gameState.round,
            roundWinner: null,
            playerChips,
        };
        updateAndBroadcast(newState);
    };

    const updateAndBroadcast = (newState: GameState) => {
        setGameState(newState);
        setCompareTarget(null);
        sendData({ type: 'UPDATE_STATE', state: newState });
    };

    const handleAction = (action: string, value?: number) => {
        if (isHost) {
            processAction(gameState.currentTurn, action, value);
        } else {
            sendData({ type: 'ACTION', action, value });
        }
    };

    useEffect(() => {
        if (!isHost) return;
        const handleRemoteAction = (e: any) => {
            const { data, sender } = e.detail;
            if (data.type === 'ACTION') {
                const idx = gameState.players.findIndex(p => p.id === sender);
                processAction(idx, data.action, data.value);
            }
        };
        window.addEventListener('multiplayer-data', handleRemoteAction);
        return () => window.removeEventListener('multiplayer-data', handleRemoteAction);
    }, [isHost, gameState]);

    const processAction = (pIdx: number, action: string, value?: number) => {
        if (gameState.phase !== 'betting' || gameState.currentTurn !== pIdx) return;

        let newState = { ...gameState };
        const player = newState.players[pIdx];

        if (action === 'fold') {
            player.isFolded = true;
        } else if (action === 'call') {
            const amount = Math.min(newState.currentBet, player.chips);
            player.chips -= amount;
            player.currentBet = amount;
            newState.pot += amount;
            // 如果玩家金额不足，自动弃牌
            if (player.chips <= 0 && amount < newState.currentBet) {
                player.isFolded = true;
            }
        } else if (action === 'raise') {
            const amount = Math.min(value || newState.currentBet * 2, player.chips);
            player.chips -= amount;
            player.currentBet = amount;
            newState.pot += amount;
            newState.currentBet = amount;
            // 如果玩家金额不足，自动弃牌
            if (player.chips <= 0) {
                player.isFolded = true;
            }
        } else if (action === 'look') {
            player.hasLooked = true;
            updateAndBroadcast(newState);
            return;
        } else if (action === 'compare') {
            // 比牌只支持两个玩家
            const compareIdx = value !== undefined ? value : getNextActivePlayer(pIdx, newState.players);
            const result = compareHands(player.hand, newState.players[compareIdx].hand);
            
            // 两个玩家都要支付底池
            const amount = Math.min(newState.currentBet * 2, player.chips);
            const otherAmount = Math.min(newState.currentBet * 2, newState.players[compareIdx].chips);
            
            player.chips -= amount;
            newState.players[compareIdx].chips -= otherAmount;
            newState.pot += amount + otherAmount;
            
            if (result > 0) {
                // 当前玩家赢
                newState.players[compareIdx].isLost = true;
                newState.players[compareIdx].isFolded = true;
            } else {
                // 对手赢
                player.isLost = true;
                player.isFolded = true;
            }
        }

        const activePlayers = newState.players.filter(p => !p.isFolded);
        if (activePlayers.length === 1) {
            // 本回合结束，更新玩家金额
            const roundWinnerId = activePlayers[0].id;
            newState.roundWinner = roundWinnerId;
            
            // 更新所有玩家的金额：赢家获得整个底池
            newState.players.forEach(p => {
                newState.playerChips[p.id] = p.chips;
            });
            newState.playerChips[roundWinnerId] += newState.pot;
            
            newState.phase = 'ended';
        } else {
            newState.currentTurn = getNextActivePlayer(pIdx, newState.players);
        }

        updateAndBroadcast(newState);
    };

    const getNextActivePlayer = (current: number, players: PlayerState[]) => {
        let next = (current + 1) % players.length;
        while (players[next].isFolded) {
            next = (next + 1) % players.length;
        }
        return next;
    };

    const myIndex = gameState.players.findIndex(p => p.id === peerId);
    const me = gameState.players[myIndex];
    const isMyTurn = gameState.currentTurn === myIndex;

    if (gameState.phase === 'lobby') {
        return (
            <Lobby
                peerId={peerId}
                isHost={isHost}
                connections={connections}
                onHost={hostGame}
                onJoin={joinGame}
                onStart={startGame}
                onLeave={leaveGame}
                onRemovePlayer={removePlayer}
                gameName={t('games.lan/zha-jinhua')}
                minPlayers={2}
                error={error}
            />
        );
    }

    return (
        <div className="flex flex-col w-full h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-md z-10 shrink-0 border-b border-slate-200">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="text-amber-500" size={28} />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t('games.lan/zha-jinhua')}</span>
                </h1>
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-full border border-amber-200">
                    <Coins className="text-amber-500" size={20} />
                    <span className="text-xl font-mono font-bold text-amber-600">${gameState.pot}</span>
                </div>
            </div>

            {/* Game Table */}
            <div className="flex-1 relative flex items-center justify-center perspective-1000 overflow-hidden">
                {/* Table Felt */}
                <div className="w-[95vw] max-w-[1000px] aspect-[2/1] max-h-[65vh] bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-[200px] border-[16px] border-emerald-800 relative shadow-2xl flex items-center justify-center transform scale-90 sm:scale-100">
                    <div className="absolute inset-4 border-2 border-white/10 rounded-[180px]" />

                    {/* Center Info */}
                    <div className="text-center opacity-60">
                        <div className="text-sm uppercase tracking-widest mb-1 text-white">{t('zha_jinhua.current_bet')}</div>
                        <div className="text-3xl font-bold text-amber-300">${gameState.currentBet}</div>
                    </div>

                    {/* Players */}
                    {gameState.players.map((p, i) => {
                        // Calculate position on ellipse
                        const total = gameState.players.length;
                        // Shift so index 0 (or myIndex) is at bottom
                        const offset = -Math.PI / 2; // Start at top? No, let's put me at bottom
                        // We want me to be at bottom center (90 deg or PI/2)
                        // Let's rotate so 'me' is always at PI/2
                        const relativeIndex = (i - myIndex + total) % total;

                        // Map relative index to angle: 0 -> PI/2 (Bottom), others distributed
                        // Actually, let's just distribute evenly starting from bottom
                        const angle = (relativeIndex / total) * 2 * Math.PI + Math.PI / 2;

                        // Ellipse radii
                        const rx = 42; // % of container width
                        const ry = 42; // % of container height

                        const x = Math.cos(angle) * rx;
                        const y = Math.sin(angle) * ry;

                        const isMe = p.id === peerId;
                        const isActive = gameState.currentTurn === i;

                        return (
                            <motion.div
                                key={p.id}
                                className={`absolute flex flex-col items-center w-24 sm:w-32`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: isActive ? 1.1 : 1,
                                    left: `${50 + x}%`,
                                    top: `${50 + y}%`,
                                    x: '-50%',
                                    y: '-50%',
                                    zIndex: isMe ? 50 : 10
                                }}
                                transition={{ type: 'spring', damping: 20 }}
                            >
                                {/* Avatar */}
                                <div className={`relative mb-1 sm:mb-2 ${p.isFolded ? 'opacity-50 grayscale' : ''}`}>
                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center bg-white/20 shadow-lg
                     ${isActive ? 'border-amber-300 shadow-amber-300/50' : 'border-white/40'}
                     ${p.isLost ? 'border-red-400' : ''}
                   `}>
                                        <User size={24} className="text-white/60 sm:hidden" />
                                        <User size={32} className="text-white/60 hidden sm:block" />
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-300 text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                            initial={{ y: 5, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                        >
                                            {t('zha_jinhua.thinking')}
                                        </motion.div>
                                    )}
                                    <div className="absolute -top-2 -right-2 bg-white/20 text-amber-200 text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-amber-300/50">
                                        ${p.chips}
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 bg-white/20 px-2 py-0.5 rounded text-white whitespace-nowrap overflow-hidden max-w-full text-ellipsis">
                                    {isMe ? t('common.you') : `Player ${i + 1}`}
                                </div>

                                {/* Cards */}
                                <div className="flex -space-x-6 sm:-space-x-8 h-16 sm:h-20 perspective-1000">
                                    {p.hand.map((c, ci) => {
                                        const shouldShow = (isMe && p.hasLooked) || gameState.phase === 'ended' || (p.isLost && p.hasLooked);

                                        return (
                                            <PlayingCard
                                                key={ci}
                                                card={c}
                                                isFlipped={!shouldShow}
                                                className="w-10 h-16 sm:w-14 sm:h-20 shadow-lg"
                                                style={{
                                                    transformOrigin: 'bottom center',
                                                    transform: `rotate(${(ci - 1) * 10}deg) translateY(${ci === 1 ? -4 : 0}px)`
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {p.isFolded && (
                                    <div className="absolute inset-0 flex items-center justify-center z-20">
                                        <span className={`text-white font-bold px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm rounded transform -rotate-12 border-2 border-white whitespace-nowrap ${
                                            p.isLost ? 'bg-orange-600/90' : 'bg-red-600/90'
                                        }`}>
                                            {p.isLost ? t('zha_jinhua.lost') : t('zha_jinhua.folded')}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white/60 backdrop-blur-md border-t border-slate-200 p-4 pb-8 safe-area-bottom shrink-0 z-20">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto flex-wrap">
                    {isMyTurn && !me.isFolded ? (
                        <>
                            <Button
                                onClick={() => handleAction('fold')}
                                variant="destructive"
                                className="h-12 sm:h-14 px-4 sm:px-8 rounded-2xl text-base sm:text-lg font-bold shadow-red-900/20 whitespace-nowrap"
                            >
                                {t('zha_jinhua.fold')}
                            </Button>

                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={() => handleAction('call')}
                                    className="h-12 sm:h-14 px-4 sm:px-8 rounded-2xl text-base sm:text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                                >
                                    {t('zha_jinhua.call')} ${gameState.currentBet}
                                </Button>
                            </div>

                            <Button
                                onClick={() => handleAction('raise')}
                                className="h-12 sm:h-14 px-4 sm:px-8 rounded-2xl text-base sm:text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap"
                            >
                                {t('zha_jinhua.raise')}
                            </Button>

                            {/* 比牌按钮/选择对手 */}
                            {compareTarget !== null ? (
                                <div className="flex gap-2 items-center">
                                    <span className="text-sm font-semibold text-slate-700">
                                        {t('zha_jinhua.compare_with')} {gameState.players[compareTarget].id === peerId ? t('common.you') : `玩家 ${compareTarget + 1}`}
                                    </span>
                                    <Button
                                        onClick={() => handleAction('compare', compareTarget)}
                                        className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl text-base sm:text-lg font-bold bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                                    >
                                        {t('zha_jinhua.confirm_compare')}
                                    </Button>
                                    <Button
                                        onClick={() => setCompareTarget(null)}
                                        variant="outline"
                                        className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl text-base sm:text-lg font-bold whitespace-nowrap"
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setCompareTarget(myIndex)}
                                    variant="secondary"
                                    className="h-12 sm:h-14 px-4 sm:px-8 rounded-2xl text-base sm:text-lg font-bold whitespace-nowrap"
                                >
                                    {t('zha_jinhua.compare')}
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="text-slate-500 italic">
                            {me.isFolded ? t('zha_jinhua.you_folded') : t('zha_jinhua.waiting_others')}
                        </div>
                    )}

                    {/* Look Card Button (Always available if not folded and not looked) */}
                    {!me?.hasLooked && !me?.isFolded && (
                        <Button
                            onClick={() => handleAction('look')}
                            variant="outline"
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 border-2 border-amber-400 hover:bg-amber-100 text-amber-600 ml-2 sm:ml-4 shrink-0"
                            title={t('zha_jinhua.look_cards')}
                        >
                            <Eye size={20} className="sm:hidden" />
                            <Eye size={24} className="hidden sm:block" />
                        </Button>
                    )}
                    {me?.hasLooked && !me?.isFolded && (
                        <div className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center text-amber-400 ml-2 sm:ml-4 shrink-0">
                            <EyeOff size={24} />
                        </div>
                    )}
                </div>

                {/* 比牌对手选择面板 */}
                {compareTarget !== null && myIndex !== -1 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 mb-3">{t('zha_jinhua.select_compare_target')}</p>
                        <div className="flex gap-2 flex-wrap">
                            {gameState.players.map((p, idx) => {
                                if (idx === myIndex || p.isFolded) return null;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setCompareTarget(idx)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                            compareTarget === idx
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                        }`}
                                    >
                                        {p.id === peerId ? t('common.you') : `玩家 ${idx + 1}`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Winner Overlay */}
            <AnimatePresence>
                {gameState.phase === 'ended' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="text-center p-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-3xl shadow-2xl border-4 border-amber-300 m-4 max-w-md max-h-[80vh] overflow-y-auto"
                        >
                            <Trophy size={64} className="mx-auto text-white mb-4 drop-shadow-md" />
                            <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-wider">
                                {gameState.roundWinner === peerId ? t('common.you_won') : t('common.winner')}
                            </h2>
                            <p className="text-amber-50 mb-8 font-bold text-xl">
                                {t('zha_jinhua.pot_won', { amount: gameState.pot })}
                            </p>
                            
                            {/* 玩家金额列表 */}
                            <div className="mb-8 bg-white/20 rounded-2xl p-4">
                                <h3 className="text-white font-bold mb-3 text-sm uppercase">{t('zha_jinhua.player_chips')}</h3>
                                <div className="space-y-2">
                                    {gameState.players.map((p, i) => (
                                        <div key={p.id} className="flex justify-between items-center text-white text-sm">
                                            <span>{p.id === peerId ? t('common.you') : `${t('common.player')} ${i + 1}`}</span>
                                            <span className="font-bold">${gameState.playerChips[p.id] || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* 检查是否游戏结束 */}
                            {Object.values(gameState.playerChips).filter(c => c > 0).length <= 1 ? (
                                <div className="space-y-3">
                                    <p className="text-white font-bold mb-4">{t('zha_jinhua.game_over')}！</p>
                                    <Button
                                        onClick={() => {
                                            leaveGame();
                                            navigate('/');
                                        }}
                                        className="w-full h-12 text-lg font-bold bg-white text-orange-600 hover:bg-gray-100"
                                    >
                                        {t('common.dashboard')}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => {
                                        startRound(gameState.playerChips);
                                    }}
                                    disabled={!isHost}
                                    className="w-full h-12 text-lg font-bold bg-white text-orange-600 hover:bg-gray-100"
                                >
                                    {isHost ? t('zha_jinhua.next_round') : t('common.waiting_host')}
                                </Button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
