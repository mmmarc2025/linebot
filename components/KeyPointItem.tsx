
import React from 'react';
import { KeyPoint } from '../types';

interface Props {
  item: KeyPoint;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, field: 'title' | 'content', value: string) => void;
}

export const KeyPointItem: React.FC<Props> = ({ item, onDelete, onToggle, onUpdate }) => {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${item.active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex justify-between items-start mb-3">
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
          placeholder="標題 (例如：營業時間)"
          className="font-bold text-gray-800 bg-transparent border-none focus:ring-0 w-full text-lg"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(item.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${item.active ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'}`}
          >
            {item.active ? '啟用中' : '已停用'}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <textarea
        value={item.content}
        onChange={(e) => onUpdate(item.id, 'content', e.target.value)}
        placeholder="詳細回覆內容..."
        className="w-full h-24 p-2 text-sm text-gray-600 bg-white/50 border border-gray-100 rounded-lg focus:border-green-300 focus:ring-0 resize-none"
      />
    </div>
  );
};
