import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, MoreHorizontal, Edit3 } from 'lucide-react';

interface Card {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

interface List {
  id: string;
  title: string;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
  lists: List[];
}

function App() {
  const [board, setBoard] = useState<Board>({
    id: '1',
    title: 'Mi Tablero de Trabajo',
    lists: [
      {
        id: '1',
        title: 'Por Hacer',
        cards: []
      },
      {
        id: '2',
        title: 'En Progreso',
        cards: []
      },
      {
        id: '3',
        title: 'Completado',
        cards: []
      }
    ]
  });

  const [draggedCard, setDraggedCard] = useState<{ card: Card; sourceListId: string } | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const savedBoard = localStorage.getItem('trello-board');
    if (savedBoard) {
      const parsedBoard = JSON.parse(savedBoard);
      // Convert date strings back to Date objects
      parsedBoard.lists.forEach((list: List) => {
        list.cards.forEach((card: Card) => {
          card.createdAt = new Date(card.createdAt);
        });
      });
      setBoard(parsedBoard);
    }
  }, []);

  // Save to localStorage whenever board changes
  useEffect(() => {
    localStorage.setItem('trello-board', JSON.stringify(board));
  }, [board]);

  const addCard = (listId: string, title: string) => {
    const newCard: Card = {
      id: Date.now().toString(),
      title,
      createdAt: new Date()
    };

    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      )
    }));
  };

  const deleteCard = (listId: string, cardId: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
          : list
      )
    }));
  };

  const moveCard = (cardId: string, sourceListId: string, targetListId: string) => {
    if (sourceListId === targetListId) return;

    setBoard(prev => {
      const sourceList = prev.lists.find(list => list.id === sourceListId);
      const card = sourceList?.cards.find(c => c.id === cardId);
      
      if (!card) return prev;

      return {
        ...prev,
        lists: prev.lists.map(list => {
          if (list.id === sourceListId) {
            return { ...list, cards: list.cards.filter(c => c.id !== cardId) };
          }
          if (list.id === targetListId) {
            return { ...list, cards: [...list.cards, card] };
          }
          return list;
        })
      };
    });
  };

  const addList = () => {
    if (!newListTitle.trim()) return;

    const newList: List = {
      id: Date.now().toString(),
      title: newListTitle,
      cards: []
    };

    setBoard(prev => ({
      ...prev,
      lists: [...prev.lists, newList]
    }));

    setNewListTitle('');
    setIsAddingList(false);
  };

  const updateListTitle = (listId: string, newTitle: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId ? { ...list, title: newTitle } : list
      )
    }));
  };

  const deleteList = (listId: string) => {
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.filter(list => list.id !== listId)
    }));
  };

  const handleDragStart = (e: React.DragEvent, card: Card, listId: string) => {
    setDraggedCard({ card, sourceListId: listId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    if (draggedCard) {
      moveCard(draggedCard.card.id, draggedCard.sourceListId, targetListId);
      setDraggedCard(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">{board.title}</h1>
        </div>
      </header>

      {/* Board */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 overflow-x-auto pb-6">
            {/* Lists */}
            {board.lists.map(list => (
              <ListComponent
                key={list.id}
                list={list}
                onAddCard={addCard}
                onDeleteCard={deleteCard}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onUpdateTitle={updateListTitle}
                onDeleteList={deleteList}
                editingListId={editingListId}
                setEditingListId={setEditingListId}
                editingListTitle={editingListTitle}
                setEditingListTitle={setEditingListTitle}
              />
            ))}

            {/* Add List */}
            <div className="min-w-72 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              {isAddingList ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Ingresa el título de la lista..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && addList()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addList}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Agregar Lista
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle('');
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="w-full flex items-center gap-2 p-3 text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                >
                  <Plus size={20} />
                  Agregar nueva lista
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ListComponentProps {
  list: List;
  onAddCard: (listId: string, title: string) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  onDragStart: (e: React.DragEvent, card: Card, listId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, listId: string) => void;
  onUpdateTitle: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  editingListId: string | null;
  setEditingListId: (id: string | null) => void;
  editingListTitle: string;
  setEditingListTitle: (title: string) => void;
}

function ListComponent({
  list,
  onAddCard,
  onDeleteCard,
  onDragStart,
  onDragOver,
  onDrop,
  onUpdateTitle,
  onDeleteList,
  editingListId,
  setEditingListId,
  editingListTitle,
  setEditingListTitle
}: ListComponentProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showListMenu, setShowListMenu] = useState(false);

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    onAddCard(list.id, newCardTitle);
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const startEditingTitle = () => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
    setShowListMenu(false);
  };

  const saveTitle = () => {
    if (editingListTitle.trim()) {
      onUpdateTitle(list.id, editingListTitle);
    }
    setEditingListId(null);
  };

  const cancelEdit = () => {
    setEditingListId(null);
    setEditingListTitle('');
  };

  return (
    <div
      className="min-w-72 bg-gray-100 rounded-lg flex flex-col max-h-full"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, list.id)}
    >
      {/* List Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {editingListId === list.id ? (
            <input
              type="text"
              value={editingListTitle}
              onChange={(e) => setEditingListTitle(e.target.value)}
              className="flex-1 p-1 text-lg font-semibold bg-transparent border-2 border-blue-500 rounded focus:outline-none"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={saveTitle}
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-800 flex-1">{list.title}</h3>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowListMenu(!showListMenu)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showListMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-40">
                <button
                  onClick={startEditingTitle}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  Editar título
                </button>
                <button
                  onClick={() => {
                    onDeleteList(list.id);
                    setShowListMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
                >
                  <X size={14} />
                  Eliminar lista
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{list.cards.length} tarjetas</p>
      </div>

      {/* Cards */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {list.cards.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            listId={list.id}
            onDelete={onDeleteCard}
            onDragStart={onDragStart}
          />
        ))}

        {/* Add Card */}
        {isAddingCard ? (
          <div className="space-y-3">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Ingresa un título para esta tarjeta..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Agregar tarjeta
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-2 p-3 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            Agregar una tarjeta
          </button>
        )}
      </div>
    </div>
  );
}

interface CardComponentProps {
  card: Card;
  listId: string;
  onDelete: (listId: string, cardId: string) => void;
  onDragStart: (e: React.DragEvent, card: Card, listId: string) => void;
}

function CardComponent({ card, listId, onDelete, onDragStart }: CardComponentProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card, listId)}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-gray-800 font-medium leading-tight">{card.title}</h4>
          {card.description && (
            <p className="text-gray-600 text-sm mt-2">{card.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {card.createdAt.toLocaleDateString()}
          </p>
        </div>
        
        <div className="relative ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-32">
              <button
                onClick={() => {
                  onDelete(listId, card.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;