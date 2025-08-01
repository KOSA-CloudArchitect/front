import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  isLoading?: boolean;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = '상품명을 검색하세요 (예: 아이폰 15)',
  isLoading = false,
  suggestions = [],
  recentSearches = [],
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 최근 검색어와 제안을 합친 목록
  const allSuggestions: SearchSuggestion[] = [
    ...recentSearches.slice(0, 5).map((text, index) => ({
      id: `recent-${index}`,
      text,
      type: 'recent' as const
    })),
    ...suggestions.slice(0, 5)
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 || recentSearches.length > 0);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowSuggestions(query.length > 0 || recentSearches.length > 0);
  };

  const handleInputBlur = () => {
    // 약간의 지연을 두어 클릭 이벤트가 처리될 수 있도록 함
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }, 200);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSuggestionSelect?.(suggestion);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < allSuggestions.length) {
          const suggestion = allSuggestions[focusedIndex];
          handleSuggestionClick(suggestion);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const clearQuery = () => {
    setQuery('');
    setShowSuggestions(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-orange-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            placeholder={placeholder}
            disabled={isLoading}
          />
          
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </form>

      {/* 검색 제안 드롭다운 */}
      {showSuggestions && allSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {allSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                index === focusedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              {getSuggestionIcon(suggestion.type)}
              <span className="flex-1 text-gray-900">
                {suggestion.text}
              </span>
              {suggestion.type === 'recent' && (
                <span className="text-xs text-gray-500">최근 검색</span>
              )}
              {suggestion.type === 'popular' && (
                <span className="text-xs text-orange-500">인기 검색</span>
              )}
            </button>
          ))}
          
          {query && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => onSearch(query)}
                className="w-full px-2 py-2 text-left text-blue-600 hover:bg-blue-50 rounded flex items-center space-x-2 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>"{query}" 검색</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};