import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, AlertCircle, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

interface LobbyProps {
    peerId: string;
    isHost: boolean;
    connections: any[];
    onHost: () => void;
    onJoin: (id: string) => boolean;
    onStart: () => void;
    onLeave?: () => void;
    onRemovePlayer?: (peerId: string) => void;
    gameName: string;
    minPlayers?: number;
    error?: string | null;
}

export const Lobby: React.FC<LobbyProps> = ({
    peerId,
    isHost,
    connections,
    onHost,
    onJoin,
    onStart,
    onLeave,
    onRemovePlayer,
    gameName,
    minPlayers = 2,
    error = null,
}) => {
    const { t } = useTranslation();
    const [joinId, setJoinId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

    // 防抖计时器
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // 防抖包装函数（300ms延迟）
    const debounce = (callback: () => void, delay: number = 300) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(callback, delay);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(peerId);
    };

    const handleHost = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setLocalError(null);
        debounce(() => {
            onHost();
            setIsProcessing(false);
        });
    };

    const handleJoin = () => {
        if (isProcessing || isJoining) return;

        // 验证输入
        if (!joinId || joinId.trim() === '') {
            setLocalError(t('lobby.enter_host_id'));
            return;
        }

        setIsJoining(true);
        setIsProcessing(true);
        setLocalError(null);
        debounce(() => {
            const success = onJoin(joinId);
            if (!success) {
                setLocalError(error || t('lobby.join_failed'));
                setIsJoining(false);
            } else {
                setJoinId('');
                // 加入成功后保持加载状态，直到游戏开始或离开
            }
            setIsProcessing(false);
        });
    };

    const handleStart = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setLocalError(null);
        debounce(() => {
            onStart();
            setIsProcessing(false);
        });
    };

    const handleLeave = () => {
        if (isProcessing || !onLeave) return;
        setIsProcessing(true);
        setIsJoining(false);
        setLocalError(null);
        debounce(() => {
            onLeave();
            setIsProcessing(false);
        });
    };

    const handleRemovePlayer = (peerId: string) => {
        if (!isHost || !onRemovePlayer) return;
        setRemovingPlayerId(peerId);
        setTimeout(() => {
            onRemovePlayer(peerId);
            setRemovingPlayerId(null);
        }, 300);
    };

    return (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <AnimatePresence mode="wait">
                {isJoining ? (
                    <motion.div
                        key="joining"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md"
                    >
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-blue-200/50 shadow-xl text-center space-y-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="flex justify-center"
                            >
                                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-500 shadow-lg" />
                            </motion.div>
                            <div className="space-y-2">
                                <p className="text-slate-800 text-lg font-semibold">{t('lobby.joining')}</p>
                                <p className="text-slate-500 text-sm">{t('lobby.coming_soon')}</p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={handleLeave}
                                disabled={isProcessing}
                            >
                                {t('lobby.leave')}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md"
                    >
                        <Card className="border-0 bg-white/70 backdrop-blur-md shadow-xl">
                            <CardHeader className="space-y-2 pb-4">
                                <div className="flex items-center gap-2 justify-center">
                                    <Zap className="text-blue-500" size={24} />
                                    <CardTitle className="text-center text-slate-800 text-2xl">{gameName}</CardTitle>
                                </div>
                                <p className="text-slate-500 text-center text-sm">{t('lobby.title')}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Error Display */}
                                <AnimatePresence>
                                    {(localError || error) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                                        >
                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                            <span>{localError || error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!isHost && connections.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button 
                                                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg"
                                                onClick={handleHost}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? t('common.loading', { defaultValue: 'Loading...' }) : t('lobby.create_game')}
                                            </Button>
                                        </motion.div>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-slate-300" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white/70 px-2 text-slate-500 font-semibold">{t('lobby.or_join')}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Input
                                                placeholder={t('lobby.enter_host_id')}
                                                value={joinId}
                                                onChange={(e) => setJoinId(e.target.value)}
                                                disabled={isProcessing}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !isProcessing) {
                                                        handleJoin();
                                                    }
                                                }}
                                                className="bg-white/50 border-slate-300 text-slate-800 placeholder-slate-400 rounded-lg"
                                            />
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex-1"
                                            >
                                                <Button 
                                                    onClick={handleJoin}
                                                    disabled={isProcessing || !joinId.trim()}
                                                    className="w-full h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg"
                                                >
                                                    {isProcessing ? t('common.loading', { defaultValue: 'Loading...' }) : t('lobby.join')}
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                                        >
                                            <p className="text-sm font-medium text-slate-700 mb-2">{t('lobby.your_id')}</p>
                                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                                <code className="text-xs text-blue-600 font-mono font-bold">{peerId}</code>
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(peerId);
                                                            // 可选：显示复制成功提示
                                                        }}
                                                        disabled={isProcessing}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Users size={16} className="text-blue-500" />
                                                {t('lobby.connected_players')}: <span className="text-blue-600 font-bold">{connections.length + 1}</span>
                                            </p>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-300"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />
                                                        <span className="text-slate-700 text-sm">{t('common.you')}</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-emerald-600">{isHost ? t('lobby.host') : t('lobby.client')}</span>
                                                </motion.div>
                                                {connections.map((conn, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.05 * (i + 1) }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                                            removingPlayerId === conn.peer
                                                                ? 'bg-red-50 border-red-300'
                                                                : 'bg-white border-blue-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full shadow-lg" />
                                                            <span className="text-slate-700 text-sm truncate">{t('lobby.player')} {i + 2}</span>
                                                            <span className="text-xs text-slate-500 truncate">({conn.peer.substring(0, 5)}...)</span>
                                                        </div>
                                                        {isHost && (
                                                            <motion.div
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.95 }}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                                                                    onClick={() => handleRemovePlayer(conn.peer)}
                                                                    disabled={removingPlayerId === conn.peer}
                                                                >
                                                                    ✕
                                                                </Button>
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {isHost && (
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Button
                                                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg"
                                                    onClick={handleStart}
                                                    disabled={connections.length + 1 < minPlayers || isProcessing}
                                                >
                                                    {isProcessing ? t('common.loading', { defaultValue: 'Loading...' }) : t('lobby.start_game')}
                                                </Button>
                                            </motion.div>
                                        )}

                                        {!isHost && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200"
                                            >
                                                <p className="text-sm text-slate-500 italic">{t('lobby.waiting_start')}</p>
                                            </motion.div>
                                        )}

                                        {onLeave && (
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-10 border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                                                    onClick={handleLeave}
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? t('common.loading', { defaultValue: 'Loading...' }) : t('lobby.leave')}
                                                </Button>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
