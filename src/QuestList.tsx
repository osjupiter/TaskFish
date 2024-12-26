import React, { useState, useRef } from 'react';
import { Quest } from './types'; // types.ts からインポート

interface QuestListProps {
    activeQuests: Quest[];
    onCompleteQuest: (questId: string) => void;
    onEditQuest: (quest: Quest) => void;
    onReorderQuests: (updatedQuests: Quest[]) => void;
}

const QuestList: React.FC<QuestListProps> = ({ activeQuests, onCompleteQuest, onEditQuest, onReorderQuests }) => {
    const [draggedItem, setDraggedItem] = useState<Quest | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

    const handleDragStart = (event: React.DragEvent<HTMLElement>, quest: Quest) => {
        setDraggedItem(quest);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (event: React.DragEvent<HTMLElement>, quest: Quest) => {
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


    const handleDrop = (event: React.DragEvent<HTMLElement>, dropQuest: Quest) => {
    };

    return (
        <div className="space-y-4">
            {activeQuests.map((quest, index) => (
                <React.Fragment key={quest.id}>
                    <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, quest)}
                       onDragOver={(e) => handleDragOver(e, quest)}
                        onDrop={(e) => handleDrop(e, quest)}
                         onDragEnd={handleDragEnd}
                        className={`bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors flex items-center justify-between
                            ${draggedItem?.id === quest.id ? 'border-2 border-red-500' : ''}`}
                    >
                        <div>
                            <h3 className="font-bold text-lg">{quest.title}</h3>
                            <p className="text-gray-300 mt-1">{quest.description}</p>
                            <div className="mt-2 flex flex-wrap gap-4 text-gray-300">
                                <span>Rewards:</span>
                                <span>+{quest.reward_resources.gold} Gold</span>
                                <span>+{quest.reward_resources.experience} XP</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEditQuest(quest)}
                                className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onCompleteQuest(quest.id)}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                   {dragOverItemId === quest.id && (<hr className="border-b-2 border-green-500"/>)}
                </React.Fragment>
            ))}
        </div>
    );
};

export default QuestList;