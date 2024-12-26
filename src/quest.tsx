import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";

interface Quest {
    id: String,
    title: String,
    description: String,
    reward_points: number,
    reward_resources: {
        gold: number,
        experience: number,
        energy: number,
    },
    completed: boolean,
    created_at: any,
}

interface PlayerState {
    level: number,
    points: number,
    points_per_second: number,
    resources: {
        gold: number,
        experience: number,
        energy: number,
    },
    active_quests: Quest[],
    completed_quests: Quest[],
    start_at: string
}

interface NewQuest {
    title: string,
    description: string,
    reward_points: number,
    reward_resources: {
        gold: number,
        experience: number,
        energy: number,
    }
}

const QuestManager = () => {
  const [playerState, setPlayerState] = useState<PlayerState|null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [newQuest, setNewQuest] = useState<NewQuest>({
    title: '',
    description: '',
    reward_points: 0,
    reward_resources: {
      gold: 0,
      experience: 0,
      energy: 0
    }
  });


  const calculateExperience = (playerState: PlayerState, elapsedSeconds: number): number => {
    if (!playerState) return 0;
    const experienceGain = playerState.points_per_second * elapsedSeconds;
    return playerState.resources.experience + experienceGain;
  };
  

  useEffect(() => {
    const fetchPlayerState = async () => {
        const state: PlayerState = await invoke('get_player_state');
      if (state) {
        const now = Date.now();
        const from=new Date(state.start_at);
        const elapsedSeconds = (now - from.getTime()) / 1000;
        const updatedExperience = calculateExperience(state, elapsedSeconds);
        setPlayerState({...state, resources: { ...state.resources, experience: updatedExperience }});
      }
    };

    fetchPlayerState();
    const interval = setInterval(fetchPlayerState, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke('add_quest', {
        title: newQuest.title,
        description: newQuest.description,
        rewardPoints: newQuest.reward_points,
        rewardResources: newQuest.reward_resources
      });
      setNewQuest({
        title: '',
        description: '',
        reward_points: 0,
        reward_resources: {
          gold: 0,
          experience: 0,
          energy: 0
        }
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add quest:', error);
    }
  };

  if (!playerState) return null;

  const experienceToNextLevel = 1000;
  const experienceProgress = (playerState.resources.experience % experienceToNextLevel) / experienceToNextLevel * 100;

  return (
    <div className="p-4 space-y-4 bg-gray-900 min-h-screen text-white">
      {/* 既存のPlayer Stats部分 */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-blue-400">Level {playerState.level} Adventurer</h2>
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Experience</span>
              <span className="text-sm">{Math.floor(experienceProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 rounded-full h-2 transition-all duration-300"
                style={{ width: `${experienceProgress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
            <div className="text-yellow-500">💰</div>
            <span>{playerState.resources.gold} Gold</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
            <div className="text-blue-500">⚔️</div>
            <span>{playerState.points} Points</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
            <div className="text-green-500">⚡</div>
            <span>{playerState.resources.energy} Energy</span>
          </div>
        </div>
      </div>

      {/* Quest Actions と Form */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-400">Active Quests</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Quest'}
        </button>
      </div>

      {/* New Quest Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <form onSubmit={handleAddQuest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quest Title</label>
              <input
                type="text"
                value={newQuest.title}
                onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
                className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newQuest.description}
                onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
                className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={newQuest.reward_points}
                  onChange={(e) => setNewQuest({...newQuest, reward_points: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gold</label>
                <input
                  type="number"
                  value={newQuest.reward_resources.gold}
                  onChange={(e) => setNewQuest({
                    ...newQuest,
                    reward_resources: {
                      ...newQuest.reward_resources,
                      gold: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <input
                  type="number"
                  value={newQuest.reward_resources.experience}
                  onChange={(e) => setNewQuest({
                    ...newQuest,
                    reward_resources: {
                      ...newQuest.reward_resources,
                      experience: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Energy</label>
                <input
                  type="number"
                  value={newQuest.reward_resources.energy}
                  onChange={(e) => setNewQuest({
                    ...newQuest,
                    reward_resources: {
                      ...newQuest.reward_resources,
                      energy: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Create Quest
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Quests */}
      <div className="space-y-4">
        {playerState.active_quests.map(quest => (
          <div 
            key={quest.id} 
            className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors"
          >
            <h3 className="font-bold text-lg">{quest.title}</h3>
            <p className="text-gray-300 mt-1">{quest.description}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-gray-300">
              <span>Rewards:</span>
              <span>+{quest.reward_points} Points</span>
              <span>+{quest.reward_resources.gold} Gold</span>
              <span>+{quest.reward_resources.experience} XP</span>
              <span>+{quest.reward_resources.energy} Energy</span>
            </div>
            <button
              onClick={() => invoke('complete_quest', { questId: quest.id })}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Complete Quest
            </button>
          </div>
        ))}
      </div>

      {/* Points Per Second Indicator */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full shadow-lg">
        +{playerState.points_per_second.toFixed(1)} points/s
      </div>
    </div>
  );
};

export default QuestManager;