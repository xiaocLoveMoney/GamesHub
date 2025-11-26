import { format, subDays, startOfDay, isSameDay } from 'date-fns';

const STORAGE_KEY = 'playtime_records';

export interface PlaytimeRecord {
    [date: string]: {
        [gameId: string]: number; // duration in seconds
    };
}

export interface DailyPlaytime {
    date: string;
    [gameId: string]: number | string;
}

export const playtimeService = {
    // Save playtime for a game
    savePlaytime: (gameId: string, durationSeconds: number) => {
        const records = playtimeService.getAllRecords();
        const today = format(new Date(), 'yyyy-MM-dd');

        if (!records[today]) {
            records[today] = {};
        }

        records[today][gameId] = (records[today][gameId] || 0) + durationSeconds;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    },

    // Get all records
    getAllRecords: (): PlaytimeRecord => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to parse playtime records', e);
            return {};
        }
    },

    // Get last 7 days data for charts
    getLast7DaysPlaytime: () => {
        const records = playtimeService.getAllRecords();
        const result: DailyPlaytime[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayData = records[dateStr] || {};

            result.push({
                date: format(date, 'MM-dd'),
                ...dayData
            });
        }
        return result;
    },

    // Get today's total playtime in minutes
    getTodayTotalPlaytime: (): number => {
        const records = playtimeService.getAllRecords();
        const today = format(new Date(), 'yyyy-MM-dd');
        const dayData = records[today] || {};

        const totalSeconds = Object.values(dayData).reduce((acc, curr) => acc + curr, 0);
        return Math.floor(totalSeconds / 60);
    },

    // Initialize mock data if empty
    initMockData: () => {
        if (localStorage.getItem(STORAGE_KEY)) return;

        const mockData: PlaytimeRecord = {};
        const games = ['tic-tac-toe', 'snake', 'tetris', '2048', 'minesweeper'];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            mockData[dateStr] = {};

            games.forEach(game => {
                // Random playtime between 0 and 60 minutes (in seconds)
                if (Math.random() > 0.3) {
                    mockData[dateStr][game] = Math.floor(Math.random() * 3600);
                }
            });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
    }
};
