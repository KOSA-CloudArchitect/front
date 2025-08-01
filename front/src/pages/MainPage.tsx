import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, BarChart3, Zap, Shield, Clock } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { SearchBar } from '../components/search/SearchBar';
import { Card, StatCard } from '../components/common/Card';
import { useIsAuthenticated } from '../stores/authStore';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
}

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState<SearchSuggestion[]>([
    { id: '1', text: '아이폰 15', type: 'popular' },
    { id: '2', text: '갤럭시 S24', type: 'popular' },
    { id: '3', text: '에어팟 프로', type: 'popular' },
    { id: '4', text: '맥북 에어', type: 'popular' },
    { id: '5', text: '다이슨 청소기', type: 'popular' }
  ]);

  // 최근 검색어 로드
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('최근 검색어 로드 실패:', error);
      }
    }
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      // 최근 검색어에 추가
      const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

      // 검색 페이지로 이동
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('검색 실패:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text);
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: '실시간 분석',
      description: '상품 리뷰를 실시간으로 분석하여 즉시 결과를 제공합니다.'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-green-600" />,
      title: '감정 분석',
      description: 'AI 기반 감정 분석으로 긍정, 부정, 중립 의견을 정확히 분류합니다.'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      title: '트렌드 분석',
      description: '시간별 리뷰 변화 추이를 분석하여 상품의 인기도 변화를 파악합니다.'
    },
    {
      icon: <Shield className="w-8 h-8 text-orange-600" />,
      title: '신뢰할 수 있는 결과',
      description: '대량의 리뷰 데이터를 종합 분석하여 객관적인 인사이트를 제공합니다.'
    }
  ];

  const stats = [
    { title: '분석된 상품', value: '12,847', trend: 'up' as const, trendValue: '+23%' },
    { title: '처리된 리뷰', value: '2.4M', trend: 'up' as const, trendValue: '+15%' },
    { title: '활성 사용자', value: '8,392', trend: 'up' as const, trendValue: '+8%' },
    { title: '평균 분석 시간', value: '2.3분', trend: 'down' as const, trendValue: '-12%' }
  ];

  return (
    <Layout>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              리뷰 분석의 새로운 기준
              <span className="block text-blue-600">KOSA</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI 기반 실시간 리뷰 분석으로 더 나은 구매 결정을 내리세요. 
              수천 개의 리뷰를 몇 분 만에 분석하여 핵심 인사이트를 제공합니다.
            </p>
          </div>

          {/* 검색 바 */}
          <div className="max-w-4xl mx-auto mb-12">
            <SearchBar
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              isLoading={isSearching}
              suggestions={popularSearches}
              recentSearches={recentSearches}
              className="mb-6"
            />
            
            {/* 인기 검색어 */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">인기 검색어</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularSearches.slice(0, 5).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => handleSearch(search.text)}
                    className="px-3 py-1 bg-white bg-opacity-80 text-gray-700 rounded-full text-sm hover:bg-opacity-100 transition-all duration-200 border border-gray-200"
                  >
                    {search.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="text-center">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                상품 검색하기
              </button>
            ) : (
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  무료로 시작하기
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  로그인
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              실시간 서비스 현황
            </h2>
            <p className="text-gray-600">
              KOSA가 제공하는 분석 서비스의 실시간 통계입니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                trendValue={stat.trendValue}
                icon={index === 0 ? <BarChart3 className="w-6 h-6" /> : 
                      index === 1 ? <Users className="w-6 h-6" /> :
                      index === 2 ? <TrendingUp className="w-6 h-6" /> :
                      <Clock className="w-6 h-6" />}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              왜 KOSA를 선택해야 할까요?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              최신 AI 기술과 빅데이터 분석을 통해 정확하고 신뢰할 수 있는 
              리뷰 분석 결과를 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center" hoverable>
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 시작하기 섹션 */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            몇 분 만에 수천 개의 리뷰를 분석하고 
            데이터 기반의 현명한 구매 결정을 내려보세요.
          </p>
          
          {!isAuthenticated && (
            <div className="space-x-4">
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                무료 회원가입
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-8 py-3 border border-blue-400 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                로그인
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MainPage;