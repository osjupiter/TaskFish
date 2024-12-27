// QuestManager.tsx
import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import QuestList from './QuestList';
import { Quest, PlayerState, NewQuest, UpdateQuest } from './types';
import { EditQuestModal } from './edit';
import NewTaskForm from './newtask';
import ScrollableContainer from './ScrollableContainer'; // ScrollableContainerをインポート
import useSound from 'use-sound';

const createLevelData = () => {
    const levelData = [];
    let requiredExperience = 20;
    for (let level = 1; level <= 100; level++) {
        levelData.push({ level, experienceToNextLevel: requiredExperience })
        requiredExperience = 20 + 100 * Math.pow(2, level);
    }
    return levelData;
};


const levelData = createLevelData();

const calculateLevelInfo = (experience: number): { level: number; experienceToNextLevel: number; currentLevelExperience: number } => {
    let currentLevelExperience = experience;

    for (let i = 0; i < levelData.length; i++) {
        const { level: currentLevel, experienceToNextLevel } = levelData[i]
        if (currentLevelExperience < experienceToNextLevel) {
            return { level: currentLevel, experienceToNextLevel, currentLevelExperience };
        }
        currentLevelExperience -= experienceToNextLevel;
    }
    return { level: 100, experienceToNextLevel: 0, currentLevelExperience: 0 };
};


const FishingComp: React.FC<{ onFishSuccess: () => void }> = ({ onFishSuccess }) => {
    const [disable, setDisable] = useState(false);
    const [isFishing, setIsFishing] = useState(false);
    const [isSuccessTime, setIsSuccessTime] = useState(false);
    const [cancelSuccess,setCancelSuccess ] = useState<number | null>(null);
    const [cancelFail, setCancelFail] = useState<number | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [playFish] = useSound("/fish.mp3", {
        volume: 1
    });
    const [playPaltu] = useSound("/paltu.mp3", {
        volume: 1
    });
    const [playDrop] = useSound("/drop.mp3", {
        volume: 1
    });

    // 釣り開始時の処理
    const handleStartFishing = () => {
        playFish()
        setIsFishing(true);
        const randomTime = Math.random() * 6000 + 2000; // 2-8秒のランダムな時間
        const successStartTime = randomTime;

        const timeoutId = setTimeout(() => {
            playDrop()
            setIsSuccessTime(true);
            const failTimer = setTimeout(() => {
                playPaltu()
                setResult("💩")
                resetState();
            }, 500)
            setCancelFail(failTimer)
        }, successStartTime);
        setCancelSuccess(timeoutId)
    };

    // 釣りの成功/失敗判定
    const handleFishingSuccess = () => {
        if (!isFishing) {
            handleStartFishing()
            return
        }
        if (isSuccessTime) {
            playPaltu()
            onFishSuccess();
            setResult("💎")
        } else {
            playPaltu()
            setResult("💩")
        }
        resetState();
    };

    const resetState = () => {
        setDisable(true)
        if (cancelFail !== null) clearTimeout(cancelFail)
        if (cancelSuccess !== null) clearTimeout(cancelSuccess)
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
    if (result !== null) {
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [questToEdit, setQuestToEdit] = useState<Quest | null>(null);
    const [experienceCache, setExperienceCache] = useState<number | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [playDone] = useSound("/done.mp3", {
        volume: 1
    });
    const [playUpgrade] = useSound("/upgrade.mp3", {
        volume: 1
    });

    const calculateExperience = (playerState: PlayerState, elapsedSeconds: number): number => {
        if (!playerState) return 0;
        let experienceGain = 0
        if (playerState.upgrade_times) {
            playerState.upgrade_times.forEach((upgradeTime) => {
                const upgradeElapsedSeconds = (elapsedSeconds - upgradeTime.from_seconds)
                experienceGain += upgradeElapsedSeconds * upgradeTime.power;
            });
        }
        return experienceGain;
    };
    const calcSpeed = () => {
        if (!playerState) return 0;
        let speed = 0
        if (playerState.upgrade_times) {
            playerState.upgrade_times.forEach((upgradeTime) => {
                speed += upgradeTime.power;
            });
        }
        return speed;
    }
    const getCurrentExperience = () => {
        if (!playerState) return 0;
        if (experienceCache !== null) return experienceCache;
        return 0
    }
    // 10msごとにエクスペリエンスのキャッシュを更新する、増加量は速度を採用する
    useEffect(() => {
        const updateExpCache = () => {
            if (!playerState) return;
            let currentExp = experienceCache ?? 0;
            currentExp += calcSpeed() * 10 / 1000;
            setExperienceCache(currentExp);
        }
        const interval = setInterval(updateExpCache, 10);
        return () => clearInterval(interval);
    })

    const fetchPlayerState = async () => {
        const state: PlayerState = await invoke('get_player_state');
        if (state) {
            const now = Date.now();
            const from = new Date(state.start_at);
            const elapsedSeconds = Math.floor((now - from.getTime()) / 1000);
            const updatedExperience = calculateExperience(state, elapsedSeconds);
            setPlayerState({ ...state, resources: { ...state.resources }, last_update: now });
            setExperienceCache(updatedExperience)
        }
    };

    useEffect(() => {
        fetchPlayerState();
        const interval = setInterval(fetchPlayerState, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAddQuest = async (newQuest: NewQuest) => {
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

    const handleCompleteQuest = async (questId: string) => {
        playDone()
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
        playUpgrade()
        try {
            await invoke('upgrade_points_per_second');
            await fetchPlayerState();
        } catch (error) {
            console.error('Failed to upgrade points per second', error);
        }

    }

    if (!playerState) return null;

    const expInfo = calculateLevelInfo(getCurrentExperience());
    const experienceProgress = (expInfo.currentLevelExperience) / expInfo.experienceToNextLevel * 100;

    const handleFishingSuccess = async () => {
        await invoke('success_fish');
        await fetchPlayerState();
    }

    const handleAddTask = async (title: string) => {
        await handleAddQuest({ title, description: "" });
    };

    return (
        <div className="p-0  bg-gray-900 min-h-screen text-white">

            {/* Quest Actions と Form */}
            <div className="bg-black p-2 h-14 shadow-md z-10 relative">
                <div className="flex justify-between items-center h-full">
                    <div className='flex gap-2'>
                        <h2 className="text-lg font-bold text-blue-400">🐟TaskFish</h2>
                        <button
                            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                        // onClick={() => handleCalendar()}  カレンダー未実装のためコメントアウト
                        >
                            Calendar
                        </button>
                        <button
                            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                        //  onClick={() => handleConfig()}  コンフィグ未実装のためコメントアウト
                        >
                            Config
                        </button>
                    </div>

                    <FishingComp onFishSuccess={handleFishingSuccess} />
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`
                        px-2 py-1 rounded hover:bg-gray-700 transition-colors text-sm
                        ${showCompleted ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'}
                      `}
                    >
                        {showCompleted ? 'Hide Done' : 'Show Done'}
                    </button>
                </div>
            </div>
            <EditQuestModal showEditModal={showEditModal} onCloseEditModal={handleCloseEditModal} onUpdateQuest={handleUpdateQuest} quest={questToEdit} />
            {/* Active Quests */}
            <ScrollableContainer>
                {playerState &&
   <div className="p-4  bg-gradient-to-b from-gray-900 to-gray-700" style={{ minHeight: 'calc(100vh - 15rem)' }}>
   <QuestList
      activeQuests={playerState.active_quests}
       completedQuests={playerState.completed_quests}
        showCompleted={showCompleted}
       onCompleteQuest={handleCompleteQuest}
       onEditQuest={handleEditQuest}
       onReorderQuests={handleReorderQuests}
   />
</div>
                }
            </ScrollableContainer>

            <NewTaskForm onAddTask={handleAddTask} />
            {/* 既存のPlayer Stats部分 */}
            <div className="h-32 bottom-1 left-4 right-4 bg-black  p-3 shadow-lg">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="text-lg font-bold text-blue-400">Level {expInfo.level} Adventurer</h2>
                    <div className="flex-1 max-w-md">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Experience</span>
                            <span className="text-sm">{Math.floor(experienceProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-purple-500 rounded-full h-2 "
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
                            <button onClick={handleUpgrade} className='bg-amber-400 text-black px-2 py-0.5 text-sm rounded flex items-center space-x-2 hover:bg-gray-600'>
                                <span>Upgrade🔨(Consume 200)</span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                        <div className="text-green-500">⚡</div>
                        <span>{expInfo.currentLevelExperience.toFixed(0)} / {expInfo.experienceToNextLevel} Exp( {calcSpeed()} points/s )</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestManager;