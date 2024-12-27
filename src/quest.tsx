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


const FishingComp: React.FC<{ onFishSuccess: () => void}> = ({ onFishSuccess }) => {
    const [disable,setDisable] = useState(false);
    const [isFishing, setIsFishing] = useState(false);
    const [isSuccessTime, setIsSuccessTime] = useState(false);
    const [ cancelSuccess, setCancelSuccess] = useState<number|null>(null);
    const [ cancelFail,setCancelFail] = useState<number|null>(null);
    const [ result,setResult] = useState<string|null>(null);

    // 釣り開始時の処理
    const handleStartFishing = () => {
        setIsFishing(true);
        const randomTime = Math.random() * 6000 + 2000; // 2-8秒のランダムな時間
        const successStartTime = randomTime;

        const timeoutId = setTimeout(() => {
            setIsSuccessTime(true);
            const failTimer=setTimeout(() => {
                setResult("💩")
                resetState();
            }, 500)
            setCancelFail(failTimer)
        }, successStartTime);
        setCancelFail(timeoutId)
    };

    // 釣りの成功/失敗判定
    const handleFishingSuccess = () => {
        if (!isFishing) {
            handleStartFishing()
            return
        }
        if (isSuccessTime) {
            onFishSuccess();
            setResult("💎")
        } else{
            setResult("💩")
        }
        resetState();
    };

    const resetState = () => {
        setDisable(true)
        if(cancelFail!==null)clearTimeout(cancelFail)
        if(cancelSuccess!==null)clearTimeout(cancelSuccess)
        setIsSuccessTime(false);
        setTimeout(() => {
            setIsFishing(false);
            setDisable(false)
            setResult(null)
        }, 2000)
    }


    let label = <span>🎣</span>
    if (isFishing) {
        label = <span>🐟</span>
    }
    if(result!==null){
        label = <span>{result}</span>
    }
    let buttonstyle = {
        filter: isSuccessTime ? "brightness(1.5)" : "brightness(1)",
    }
    let buttonClass = isSuccessTime && isFishing ? "bg-amber-500" : ""
    return (
        <div className="">
            <button
                onClick={handleFishingSuccess}
                style={buttonstyle}
                className={buttonClass}
                disabled={disable}
            >
                {label}
            </button>
        </div>
    );
};



const QuestManager = () => {
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [questToEdit, setQuestToEdit] = useState<Quest | null>(null);


    const calculateExperience = (playerState: PlayerState, elapsedSeconds: number): number => {
        if (!playerState) return 0;
        let experienceGain = 0
        if (playerState.upgrade_times) {
            playerState.upgrade_times.forEach((upgradeTime) => {
                const upgradeElapsedSeconds = (elapsedSeconds - upgradeTime.from_seconds)
                experienceGain += upgradeElapsedSeconds * upgradeTime.power;
            });
        }
        return playerState.resources.experience + experienceGain;
    };

    const fetchPlayerState = async () => {
        const state: PlayerState = await invoke('get_player_state');
        if (state) {
            const now = Date.now();
            const from = new Date(state.start_at);
            const elapsedSeconds = Math.floor((now - from.getTime()) / 1000);
            const updatedExperience = calculateExperience(state, elapsedSeconds);
            setPlayerState({ ...state, resources: { ...state.resources, experience: updatedExperience }, last_update: now });
        }
    };

    useEffect(() => {
        fetchPlayerState();
        const interval = setInterval(fetchPlayerState, 1000);
        return () => clearInterval(interval);
    }, []);



    const handleAddQuest = async (newQuest: NewQuest) => {
        const tmp = playerState?.active_quests ?? [];
        tmp.push({ id: Math.random().toString(), title: newQuest.title, description: newQuest.description, reward_points: 0, reward_resources: { gold: 0, experience: 0 }, completed: false, created_at: new Date() });
        try {
            await invoke('add_quest', {
                title: newQuest.title,
                description: newQuest.description,
            });
            await fetchPlayerState();
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
            await fetchPlayerState();
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
            await fetchPlayerState();

        } catch (error) {
            console.error('Failed to update quest:', error);
        }
    };

    const handleReorderQuests = async (updatedQuests: Quest[]) => {
        console.log(updatedQuests);
        if (!playerState) return;
        try {
            await invoke('reorder_quests', { questIds: updatedQuests.map(quest => quest.id) });
            setPlayerState({ ...playerState, active_quests: updatedQuests });
        } catch (error) {
            console.error('Failed to reorder quests:', error);
        }
    };

    const handleUpgrade = async () => {
        if (!playerState) return
        try {
            await invoke('upgrade_points_per_second');
            await fetchPlayerState();
        } catch (error) {
            console.error('Failed to upgrade points per second', error);
        }

    }

    if (!playerState) return null;

    const experienceToNextLevel = 100;
    const experienceProgress = (playerState.resources.experience % experienceToNextLevel) / experienceToNextLevel * 100;

    const handleFishingSuccess = async () => {
        await invoke('success_fish');
        await fetchPlayerState();
    }

    return (
        <div className="p-0  bg-gray-900 min-h-screen text-white">

            {/* Quest Actions と Form */}
            <div className=" bg-black  p-4 h-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-400">Active Quests</h2>

                    <FishingComp onFishSuccess={handleFishingSuccess}  />
                    <AddQuestButton showForm={showForm} onToggleForm={handleToggleForm} />
                </div>
            </div>
            <NewQuestForm showForm={showForm} onClose={handleCloseForm} onAddQuest={handleAddQuest} />
            <EditQuestModal showEditModal={showEditModal} onCloseEditModal={handleCloseEditModal} onUpdateQuest={handleUpdateQuest} quest={questToEdit} />
            {/* Active Quests */}

            <div className=' p-4 overflow-auto [height:calc(100vh-15rem)] overflow-y-auto'>
                {playerState &&
                    <QuestList
                        activeQuests={playerState.active_quests}
                        onCompleteQuest={handleCompleteQuest}
                        onEditQuest={handleEditQuest}
                        onReorderQuests={handleReorderQuests}
                    />}
            </div>
            {/* 既存のPlayer Stats部分 */}
            <div className=" h-40 bottom-1 left-4 right-4 bg-black rounded-lg p-4 shadow-lg ">
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
                        {playerState.resources.gold >= 200 && (
                            <button className='bg-amber-400 text-black px-2 py-1 text-sm rounded flex items-center space-x-2 hover:bg-gray-600' onClick={handleUpgrade}>
                                <span>Upgrade🔨(Consume 200)</span>
                            </button>
                        )
                        }
                    </div>
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                        <div className="text-green-500">⚡</div>
                        <span>{playerState.resources.experience.toFixed(1)} Exp( {playerState?.points_per_second.toFixed(1)} points/s )</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestManager;