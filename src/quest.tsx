import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';


interface Quest {
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

interface PlayerState {
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

interface NewQuest {
    title: string,
    description: string,
}
interface UpdateQuest {
    id:string,
    title:string,
    description: string,
}

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
            <div ref={modalRef} className="bg-gray-800 rounded-lg p-4 shadow-lg relative max-w-xl">
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

interface QuestItemProps {
  quest: Quest;
  index: number;
  onCompleteQuest: (questId: String) => void;
    onEditQuest: (quest: Quest) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, index, onCompleteQuest, onEditQuest }) => {
  return (
      <Draggable draggableId={quest.id} index={index}>
          {(provided) => (
              <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors flex items-center justify-between"
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
          )}
      </Draggable>
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
            id: quest.id,
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
              <div ref={modalRef} className="bg-gray-800 rounded-lg p-4 shadow-lg relative max-w-xl">
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
        const from=new Date(state.start_at);
        const elapsedSeconds = (now - from.getTime()) / 1000;
        const updatedExperience = calculateExperience(state, elapsedSeconds);
        setPlayerState({...state, resources: { ...state.resources, experience: updatedExperience }});
          setLastUpdateTime(now);
      }
    };

    fetchPlayerState();
    const interval = setInterval(fetchPlayerState, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);



  const handleAddQuest = async (newQuest:NewQuest) => {
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
    
    const handleCompleteQuest = async (questId: String) => {
        try{
            await invoke('complete_quest', {questId});
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
  
    const handleUpdateQuest = async (updatedQuest:UpdateQuest) => {
      try{
          await invoke('update_quest', {questId:updatedQuest.id, title:updatedQuest.title, description: updatedQuest.description});
          
      } catch (error){
            console.error('Failed to update quest:', error);
      }
    };

  const onDragEnd = async (result: DropResult) => {
      if (!result.destination) {
          return;
      }

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      if (sourceIndex === destinationIndex) {
          return;
      }
    
    if(playerState){
      const updatedQuests = Array.from(playerState.active_quests);
      const [removed] = updatedQuests.splice(sourceIndex, 1);
      updatedQuests.splice(destinationIndex, 0, removed);
       try {
                await invoke('reorder_quests', { questIds: updatedQuests.map(quest=>quest.id) });
            } catch (error) {
                console.error('Failed to reorder quests:', error);
            }
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
        <NewQuestForm showForm={showForm} onClose={handleCloseForm} onAddQuest={handleAddQuest}/>
        <EditQuestModal showEditModal={showEditModal} onCloseEditModal={handleCloseEditModal} onUpdateQuest={handleUpdateQuest} quest={questToEdit} />
      {/* Active Quests */}
       <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="active-quests">
              {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {playerState.active_quests.map((quest, index) => (
                        <QuestItem
                           key={quest.id}
                           quest={quest}
                           index={index}
                           onCompleteQuest={handleCompleteQuest}
                           onEditQuest={handleEditQuest}
                        />
                    ))}
                      {provided.placeholder}
                  </div>
              )}
          </Droppable>
      </DragDropContext>
     
      {/* Points Per Second Indicator */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full shadow-lg">
        +{playerState.points_per_second.toFixed(1)} points/s
      </div>
    </div>
  );
};

export default QuestManager;