// src/pages/Search/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/include/Header';
import Footer from '../../components/include/Footer';
import { searchProducts } from '../../services/api';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState({});

  // URL에서 검색어 가져오기
  const query = new URLSearchParams(location.search).get('keyword');

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // 검색 결과 조회
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;

      setLoading(true);
      try {
        // 검색 API 호출 (services/api.js에서 정의한 함수 사용)
        const response = await searchProducts(query);

        if (response.data && response.data.success) {
          setSearchResults(response.data.data);
        } else {
          setSearchResults([]);
          setError(response.data?.message || '검색 결과가 없습니다.');
        }

        // 로그인 상태라면 즐겨찾기 목록도 조회
        if (isLoggedIn) {
          await fetchFavorites();
        }
      } catch (error) {
        console.error('검색 중 오류 발생:', error);
        setError('검색 결과를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, isLoggedIn]);

  // 즐겨찾기 목록 조회
  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.get('/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 즐겨찾기 정보를 객체로 변환 (빠른 조회를 위해)
      const favoriteObj = {};
      response.data.forEach(fav => {
        favoriteObj[fav.prdId] = true;
      });
      setFavorites(favoriteObj);
    } catch (error) {
      console.error('즐겨찾기 조회 중 오류 발생:', error);
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = async (product) => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 기능입니다.');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const isFavorite = favorites[product.prdId];

      if (isFavorite) {
        // 즐겨찾기 삭제
        await axios.delete(`/api/favorites/${product.prdId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // 즐겨찾기 추가
        await axios.post('/api/favorites', {
          prdId: product.prdId,
          productName: product.productName,
          companyName: product.companyName,
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      // 즐겨찾기 상태 업데이트
      setFavorites(prev => ({
        ...prev,
        [product.prdId]: !isFavorite
      }));
    } catch (error) {
      console.error('즐겨찾기 처리 중 오류 발생:', error);
      alert('즐겨찾기 처리 중 오류가 발생했습니다.');
    }
  };

  // 제품 상세 페이지로 이동
  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-center">
          "{query}" 검색 결과
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border text-teal-500" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-700">검색 결과가 없습니다.</p>
            <p className="text-gray-500 mt-2">다른 키워드로 검색해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((product) => (
              <div key={product.prdId} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h2 
                      className="text-xl font-semibold mb-2 text-teal-700 cursor-pointer hover:underline"
                      onClick={() => goToProductDetail(product.prdId)}
                    >
                      {product.productName}
                    </h2>
                    <button 
                      onClick={() => toggleFavorite(product)}
                      className={`text-2xl ${favorites[product.prdId] ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                      <i className={`fas fa-star ${isLoggedIn ? '' : 'opacity-50'}`}></i>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-2">제조사: {product.companyName}</p>
                  {product.mainFunction && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">주요기능:</span> {product.mainFunction}
                    </p>
                  )}
                  {product.expirationPeriod && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">유통기한:</span> {product.expirationPeriod}
                    </p>
                  )}
                  <button
                    onClick={() => goToProductDetail(product.prdId)}
                    className="mt-2 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors w-full"
                  >
                    상세 정보 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default SearchResults;