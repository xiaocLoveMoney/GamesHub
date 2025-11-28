import React from 'react';
import { motion } from 'motion/react';
import { Card, getCardColor, getCardDisplay } from '@/utils/cardUtils';

interface PlayingCardProps {
    card: Card;
    isFlipped: boolean;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
    card,
    isFlipped,
    onClick,
    className = '',
    style,
}) => {
    return (
        <div className={`relative perspective-1000 ${className}`} style={style} onClick={onClick}>
            <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front of card */}
                <div
                    className={`absolute inset-0 backface-hidden bg-white rounded-lg border-2 border-gray-200 shadow-md flex flex-col justify-between p-1.5 select-none ${getCardColor(card)}`}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="text-sm font-bold leading-none text-left">{card.rank}</div>
                    <div className="text-2xl self-center leading-none">{getCardDisplay(card).replace(card.rank, '')}</div>
                    <div className="text-sm font-bold leading-none text-right transform rotate-180">{card.rank}</div>
                </div>

                {/* Back of card */}
                <div
                    className="absolute inset-0 backface-hidden rounded-lg shadow-md bg-blue-600 border-2 border-white"
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)',
                    }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-white/30" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
