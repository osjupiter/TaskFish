
//types.ts
export interface Quest {
    id: string;
    title: string;
    description: string;
    reward_points: number;
    reward_resources: {
        gold: number;
        experience: number;
    };
    completed: boolean;
    created_at: any;
}

export interface PlayerState {
    level: number;
    points_per_second: number;
    resources: {
        gold: number;
    };
    start_at: any;
    last_update: any;
    upgrade_times: {from_seconds:number,power:number}[];
    active_quests: Quest[];
    completed_quests: Quest[];
}

export interface NewQuest {
    title: string;
    description: string;
}
export interface UpdateQuest {
    id: string;
    title: string;
    description: string;
}