import React, { useState } from 'react';
import { Quest } from './types'; // types.ts からインポート

interface QuestListProps {
    activeQuests: Quest[];
    completedQuests?: Quest[];
    showCompleted: boolean;
    onCompleteQuest: (questId: string) => void;
    onEditQuest: (quest: Quest) => void;
    onReorderQuests: (updatedQuests: Quest[]) => void;
}

const QuestList: React.FC<QuestListProps> = ({ activeQuests, completedQuests = [], showCompleted, onCompleteQuest, onEditQuest, onReorderQuests }) => {
    const [draggedItem, setDraggedItem] = useState<Quest | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

    const handleDragStart = (event: React.DragEvent<HTMLElement>, quest: Quest) => {
        setDraggedItem(quest);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (_: React.DragEvent<HTMLElement>, quest: Quest) => {
        if (!draggedItem || draggedItem.id === quest.id) return;
        setDragOverItemId(quest.id);
        console.log('drag over');
    };

    const handleDragEnd = () => {
        console.log('drag end');

        if (!draggedItem || draggedItem.id === dragOverItemId) return;
        const updatedQuests = [...activeQuests];
        const dragIndex = updatedQuests.findIndex(quest => quest.id === draggedItem.id);
        const dropIndex = updatedQuests.findIndex(quest => quest.id === dragOverItemId);
        if (dragIndex === -1 || dropIndex === -1) return;
        const [removed] = updatedQuests.splice(dragIndex, 1);
        updatedQuests.splice(dropIndex + 1, 0, removed); // ドロップ先の次の位置に挿入
        onReorderQuests(updatedQuests);


        setDragOverItemId(null);
        setDraggedItem(null);
    };



    const combinedQuests = showCompleted ? [...activeQuests, ...completedQuests] : [...activeQuests];

    return (
        <div className="space-y-2">
            {combinedQuests.map((quest) => (
                <React.Fragment key={quest.id}>
                    <div
                        draggable={!quest.completed}
                          // === 変更箇所：過去クエストはクリックできないようにする ===
                        onClick={(e) => {
                            if (quest.completed) return;
                            if (e.target instanceof HTMLButtonElement) {
                                return;
                            }
                            onEditQuest(quest)
                        }}
                           // === 変更箇所終了 ===
                        onDragStart={(e) => !quest.completed && handleDragStart(e, quest)}
                        onDragOver={(e) => !quest.completed && handleDragOver(e, quest)}
                        onDragEnd={!quest.completed ? handleDragEnd:undefined}
                        className={`
                    p-4 py-1 rounded-xl
                    bg-gradient-to-r from-gray-800/80 to-gray-700/80
                    backdrop-blur-sm
                    border border-gray-600/30
                    hover:border-blue-500/50 hover:from-gray-800/90 hover:to-gray-700/90
                    transition-all duration-300
                    flex items-center justify-between
                    shadow-lg shadow-black/5
                     ${draggedItem?.id === quest.id ? 'border-2 border-red-500/50' : ''}
                   ${quest.completed ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
                    >
                        <div className="flex items-center flex-1">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <span>  🐟</span>
                                    <h3 className="font-bold text-lg bg-gradient-to-r from-white to-gray-100 text-transparent bg-clip-text">
                                        {quest.title}
                                    </h3>
                                    <p className="text-gray-300/90 text-sm">{quest.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6"> {/* 右側の要素をまとめる */}
                            <div className="text-sm flex items-center">
                                <span className="text-amber-300/90 flex items-center">
                                    <span className="mr-1">💰</span>
                                    {quest.reward_resources.gold}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                 {/* === 変更箇所：過去クエストはボタンを表示しない === */}
                                {!quest.completed && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // イベント伝播を停止
                                            onCompleteQuest(quest.id)
                                        }}
                                        className="px-3 py-1.5 bg-gradient-to-r from-green-600/90 to-green-500/90 
                            text-white rounded-lg hover:from-green-500/90 hover:to-green-400/90 
                            transition-all duration-300 shadow-lg shadow-green-900/20 text-sm"
                                    >
                                        Done
                                    </button>
                                )}
                                   {/* === 変更箇所終了 === */}
                            </div>
                        </div>
                    </div>
                    {dragOverItemId === quest.id && (
                        <hr className="border-b-2 border-green-500/50" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default QuestList;