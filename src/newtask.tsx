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
                className="bg-gray-700 text-white p-2 rounded w-full focus:outline-none focus:ring focus:ring-blue-500"
            />
        </div>
    );
};

export default NewTaskForm;