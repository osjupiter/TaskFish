
// edit.tsx

import { useEffect, useRef, useState } from "react";
import { NewQuest, Quest, UpdateQuest } from "./types";

// NewQuestForm コンポーネント (モーダルとして)
interface NewQuestFormProps {
    showForm: boolean;
    onClose: () => void;
    onAddQuest: (newQuest: NewQuest) => void;
}

const NewQuestForm: React.FC<NewQuestFormProps> = ({ showForm, onClose, onAddQuest }) => {
    const [newQuest, setNewQuest] = useState<NewQuest>({
        title: '',
        description: '',
    });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (showForm) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showForm, onClose]);

  const handleAddQuest = async (e: React.FormEvent) => {
        e.preventDefault();
        onAddQuest(newQuest);
        setNewQuest({
          title: '',
          description: '',
        });
      onClose()
    };


    if (!showForm) return null;

     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div ref={modalRef} className="bg-gray-800 rounded-lg p-4 shadow-lg relative w-3/4">
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

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
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
        </div>
    );
};



// EditQuestModal コンポーネント
interface EditQuestModalProps {
  showEditModal: boolean;
  onCloseEditModal: () => void;
  onUpdateQuest: (updatedQuest: UpdateQuest) => void;
  quest: Quest | null;
}
const EditQuestModal: React.FC<EditQuestModalProps> = ({showEditModal, onCloseEditModal, onUpdateQuest, quest})=>{
    const [updatedQuest, setUpdatedQuest] = useState<UpdateQuest>({
        id: "",
        title: '',
        description: '',
    });
    
  useEffect(()=>{
    if(quest){
       setUpdatedQuest({
            id: String(quest.id),
            title: quest.title,
            description: quest.description,
        })
    }
  }, [quest])
    
    const handleUpdateQuest = async (e:React.FormEvent) => {
        e.preventDefault();
       onUpdateQuest(updatedQuest);
        onCloseEditModal();
    };
  
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onCloseEditModal();
            }
        };

        if (showEditModal) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEditModal, onCloseEditModal]);

    if (!showEditModal || !quest) return null;
  
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div ref={modalRef} className="bg-gray-800 rounded-lg p-4 shadow-lg relative max-w-xl w-3/4">
                   <form onSubmit={handleUpdateQuest} className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium mb-1">Quest Title</label>
                           <input
                               type="text"
                               value={updatedQuest.title}
                               onChange={(e) => setUpdatedQuest({...updatedQuest, title: e.target.value})}
                               className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                               required
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-medium mb-1">Description</label>
                           <textarea
                               value={updatedQuest.description}
                               onChange={(e) => setUpdatedQuest({...updatedQuest, description: e.target.value})}
                               className="w-full bg-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                               required
                           />
                       </div>

                       <div className="flex justify-end gap-2">
                           <button
                               type="button"
                               onClick={onCloseEditModal}
                               className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                           >
                               Cancel
                           </button>
                           <button
                               type="submit"
                               className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                           >
                               Update Quest
                           </button>
                       </div>
                   </form>
              </div>
          </div>
      );
  
};
export { NewQuestForm, EditQuestModal };