import { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

export interface MultiplayerState {
    peerId: string;
    connections: DataConnection[];
    isHost: boolean;
    isConnected: boolean;
    error: string | null;
    joinedRoomId?: string;
}

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: '',
        connections: [],
        isHost: false,
        isConnected: false,
        error: null,
        joinedRoomId: undefined,
    });

    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<DataConnection[]>([]);

    // Initialize Peer
    useEffect(() => {
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            setState((prev) => ({ ...prev, peerId: id, isConnected: true }));
        });

        peer.on('connection', (conn) => {
            handleConnection(conn);
        });

        peer.on('error', (err) => {
            setState((prev) => ({ ...prev, error: err.message }));
        });

        return () => {
            peer.destroy();
        };
    }, []);

    const handleConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            connectionsRef.current = [...connectionsRef.current, conn];
            setState((prev) => ({
                ...prev,
                connections: connectionsRef.current,
            }));
        });

        conn.on('data', (data) => {
            // Handle incoming data - to be consumed by game logic
            // We can expose an event listener or callback here
            window.dispatchEvent(new CustomEvent('multiplayer-data', { detail: { data, sender: conn.peer } }));
        });

        conn.on('close', () => {
            connectionsRef.current = connectionsRef.current.filter((c) => c.peer !== conn.peer);
            setState((prev) => ({
                ...prev,
                connections: connectionsRef.current,
            }));
        });
    };

    const hostGame = () => {
        setState((prev) => ({ ...prev, isHost: true, joinedRoomId: prev.peerId }));
    };

    const joinGame = (hostId: string) => {
        // 验证hostId不为空
        if (!hostId || hostId.trim() === '') {
            setState((prev) => ({ ...prev, error: 'Host ID cannot be empty' }));
            return false;
        }

        // 验证hostId有效性（不能为自己的ID）
        if (hostId === state.peerId) {
            setState((prev) => ({ ...prev, error: 'Cannot join your own room' }));
            return false;
        }

        // 验证是否已经加入过房间
        if (state.joinedRoomId) {
            setState((prev) => ({ ...prev, error: `Already joined room: ${state.joinedRoomId}. Leave first before joining another.` }));
            return false;
        }

        if (!peerRef.current) return false;

        try {
            const conn = peerRef.current.connect(hostId);
            handleConnection(conn);
            setState((prev) => ({ ...prev, isHost: false, joinedRoomId: hostId, error: null }));
            return true;
        } catch (err: any) {
            setState((prev) => ({ ...prev, error: err.message }));
            return false;
        }
    };

    const sendData = (data: any) => {
        connectionsRef.current.forEach((conn) => {
            if (conn.open) {
                conn.send(data);
            }
        });
    };

    const leaveGame = () => {
        connectionsRef.current.forEach((conn) => {
            conn.close();
        });
        connectionsRef.current = [];
        setState((prev) => ({
            ...prev,
            connections: [],
            isHost: false,
            joinedRoomId: undefined,
            error: null,
        }));
    };

    const removePlayer = (peerId: string) => {
        const conn = connectionsRef.current.find((c) => c.peer === peerId);
        if (conn) {
            // 向该玩家发送移除消息
            if (conn.open) {
                conn.send({ type: 'REMOVE_BY_HOST' });
            }
            // 关闭连接
            conn.close();
            connectionsRef.current = connectionsRef.current.filter((c) => c.peer !== peerId);
            setState((prev) => ({
                ...prev,
                connections: connectionsRef.current,
            }));
        }
    };

    return {
        ...state,
        hostGame,
        joinGame,
        sendData,
        leaveGame,
        removePlayer,
    };
};
