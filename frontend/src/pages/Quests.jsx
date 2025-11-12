import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { TrophyIcon, FireIcon } from '@heroicons/react/24/solid';

export default function Quests() {
  const [quests, setQuests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, [filter]);

  const fetchQuests = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.difficulty = filter;
      
      const response = await api.get('/quests', { params });
      setQuests(response.data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-orange-100 text-orange-700',
    expert: 'bg-red-100 text-red-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quests</h1>
      </div>

      <div className="flex space-x-2">
        {['all', 'easy', 'medium', 'hard', 'expert'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-md capitalize ${
              filter === level
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading quests...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <Link
              key={quest.id}
              to={`/quests/${quest.id}`}
              className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden"
            >
              {quest.poi?.images?.[0] && (
                <img
                  src={quest.poi.images[0]}
                  alt={quest.title}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded capitalize ${difficultyColors[quest.difficulty]}`}>
                    {quest.difficulty}
                  </span>
                  <div className="flex items-center text-amber-600">
                    <TrophyIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-semibold">{quest.basePoints} pts</span>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{quest.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{quest.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{quest.poi?.name}</span>
                  <span className="flex items-center">
                    <FireIcon className="h-4 w-4 text-orange-500 mr-1" />
                    {quest.completionCount} completed
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && quests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No quests available yet.</p>
        </div>
      )}
    </div>
  );
}
