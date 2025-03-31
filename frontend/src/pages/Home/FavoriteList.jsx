// src/pages/Home/FavoriteList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/include/Header';
import Footer from '../../components/include/Footer';

const FavoriteList = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인 및 즐겨찾기 목록 조회
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      setIsLoggedIn(true);
      fetchFavorites();
    };
    
    checkAuth();
  }, [navigate]);

  // 즐겨찾기 목록 조회
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get('/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setFavorites(response.data);
      setLoading(false);
    } catch (error) {
      console.error('즐겨찾기 목록 조회 중 오류 발생:', error);
      setError('즐겨찾기 목록을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // 즐겨찾기 삭제
  const removeFavorite = async (prdId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      await axios.delete(`/api/favorites/${prdId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // 목록에서 삭제된 항목 제거
      setFavorites(prev => prev.filter(item => item.prdId !== prdId));
    } catch (error) {
      console.error('즐겨찾기 삭제 중 오류 발생:', error);
      alert('즐겨찾기 삭제 중 오류가 발생했습니다.');
    }
  };

  // 제품 상세 페이지로 이동
  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-center">즐겨찾기 목록</h1>
        
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
        ) : favorites.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-700">즐겨찾기한 제품이 없습니다.</p>
            <p className="text-gray-500 mt-2">제품 검색 후 즐겨찾기를 추가해보세요.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
            >
              제품 검색하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
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
                      onClick={() => removeFavorite(product.prdId)}
                      className="text-2xl text-yellow-500"
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-2">제조사: {product.companyName}</p>
                  {/* 추가 정보가 있는 경우에만 표시 */}
                  {product.mainFunction && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">주요기능:</span> {product.mainFunction}
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

export default FavoriteList;