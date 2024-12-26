
//types.ts
export interface Quest {
    id: string,
    title: string,
    description: string,
    reward_points: number,
    reward_resources: {
        gold: number,
        experience: number,
    },
    completed: boolean,
    created_at: any,
}

export interface PlayerState {
    level: number,
    points_per_second: number,
    resources: {
        gold: number,
        experience: number,
    },
      start_at: any,
    active_quests: Quest[],
    completed_quests: Quest[],
}

export interface NewQuest {
    title: string,
    description: string,
}
export interface UpdateQuest {
    id:string,
    title:string,
    description: string,
}