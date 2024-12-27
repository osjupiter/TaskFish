// NewTaskForm.tsx
import React, { useState } from 'react';

interface NewTaskFormProps {
    onAddTask: (title: string) => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ onAddTask }) => {
    const [newQuestTitle, setNewQuestTitle] = useState('');

    const handleNewQuestTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewQuestTitle(e.target.value);
    };

    const handleAddQuestEnter = async (e: React.KeyboardEvent) => {
         if (e.key === 'Enter' && newQuestTitle.trim() !== '') {
            onAddTask(newQuestTitle);
            setNewQuestTitle('');
        }
    };

    return (
        <div className="bg-gray-800 p-2 shadow-md flex items-center">
            <input
                type="text"
                placeholder="タスクを追加する"
                value={newQuestTitle}
                onChange={handleNewQuestTitleChange}
                onKeyDown={handleAddQuestEnter}
                //className="bg-gray-700 text-white p-2 rounded w-full focus:outline-none focus:ring focus:ring-blue-500"
                        className={`
                        mx-4
                        w-full
                    p-4 py-1 
                    bg-gradient-to-r from-gray-800/80 to-gray-700/80
                    backdrop-blur-sm
                    border border-gray-600/30
                    hover:border-blue-500/50 hover:from-gray-800/90 hover:to-gray-700/90
                    transition-all duration-300
                    shadow-lg shadow-black/5
                    `}
            />
        </div>
    );
};

export default NewTaskForm;