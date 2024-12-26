import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import QuestList from './QuestList';
import { Quest, PlayerState, NewQuest, UpdateQuest } from './types';
import { NewQuestForm, EditQuestModal } from './edit';

// AddQuestButton コンポーネント
interface AddQuestButtonProps {
    showForm: boolean;
    onToggleForm: () => void;
}

const AddQuestButton: React.FC<AddQuestButtonProps> = ({ showForm, onToggleForm }) => {
    return (
        <button
            onClick={onToggleForm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
            {showForm ? 'Add New Quest' : 'Add New Quest'}
        </button>
    );
};



const QuestManager = () => {
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    const [showEditModal, setShowEditModal] = useState(false);
    const [questToEdit, setQuestToEdit] = useState<Quest | null>(null);


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
                const from = new Date(state.start_at);
                const elapsedSeconds = (now - from.getTime()) / 1000;
                const updatedExperience = calculateExperience(state, elapsedSeconds);
                setPlayerState({ ...state, resources: { ...state.resources, experience: updatedExperience } });
                setLastUpdateTime(now);
            }
        };

        fetchPlayerState();
        const interval = setInterval(fetchPlayerState, 1000);
        return () => clearInterval(interval);
    }, [lastUpdateTime]);



    const handleAddQuest = async (newQuest: NewQuest) => {
        try {
            await invoke('add_quest', {
                title: newQuest.title,
                description: newQuest.description,
            });

        } catch (error) {
            console.error('Failed to add quest:', error);
        }
    };

    const handleToggleForm = () => {
        setShowForm(!showForm);
    }

    const handleCloseForm = () => {
        setShowForm(false);
    }

    const handleCompleteQuest = async (questId: string) => {
        try {
            await invoke('complete_quest', { questId });
        } catch (error) {
            console.error('Failed to complete quest:', error);
        }
    };

    const handleEditQuest = (quest: Quest) => {
        setQuestToEdit(quest);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setQuestToEdit(null)
    };

    const handleUpdateQuest = async (updatedQuest: UpdateQuest) => {
        try {
            await invoke('update_quest', { questId: updatedQuest.id, title: updatedQuest.title, description: updatedQuest.description });

        } catch (error) {
            console.error('Failed to update quest:', error);
        }
    };
    
     const handleReorderQuests = async (updatedQuests:Quest[]) => {
          if(!playerState) return;
            try {
                await invoke('reorder_quests', { questIds: updatedQuests.map(quest => quest.id) });
                setPlayerState({...playerState, active_quests: updatedQuests});
            } catch (error) {
                console.error('Failed to reorder quests:', error);
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                        <div className="text-yellow-500">💰</div>
                        <span>{playerState.resources.gold} Gold</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                        <div className="text-green-500">⚡</div>
                        <span>{playerState.resources.experience} Exp</span>
                    </div>
                </div>
            </div>

            {/* Quest Actions と Form */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-400">Active Quests</h2>
                <AddQuestButton showForm={showForm} onToggleForm={handleToggleForm} />
            </div>
            <NewQuestForm showForm={showForm} onClose={handleCloseForm} onAddQuest={handleAddQuest} />
            <EditQuestModal showEditModal={showEditModal} onCloseEditModal={handleCloseEditModal} onUpdateQuest={handleUpdateQuest} quest={questToEdit} />
            {/* Active Quests */}
            {playerState && (
                 <QuestList
                        activeQuests={playerState.active_quests}
                        onCompleteQuest={handleCompleteQuest}
                        onEditQuest={handleEditQuest}
                        onReorderQuests={handleReorderQuests}
                    />
            )}

            {/* Points Per Second Indicator */}
            <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full shadow-lg">
                +{playerState.points_per_second.toFixed(1)} points/s
            </div>
        </div>
    );
};

export default QuestManager;