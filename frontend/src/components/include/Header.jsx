// src/components/include/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 로그인 상태 확인
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userRole = localStorage.getItem("role");
    
    setIsLoggedIn(!!(accessToken || refreshToken));
    setIsAdmin(userRole === "ADMIN");
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('memberId');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
  };
  
  // 검색 처리
  const handleSearch = (e) => {
    e.preventDefault();
    if(searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* 로고 */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/images/logo.png" className="h-8 w-auto" alt="SUPPLE IT Logo" />
              <span className="ml-2 text-xl font-bold text-gray-900">SUPPLE IT</span>
            </Link>
          </div>

          {/* 검색 바 */}
          <div className="flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="영양제 검색하기"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>

          {/* 네비게이션 메뉴 */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-teal-500 font-medium">홈</Link>
            <Link to="/notices" className="text-gray-700 hover:text-teal-500 font-medium">공지사항</Link>
            <Link to="/reviews" className="text-gray-700 hover:text-teal-500 font-medium">리뷰</Link>
            {/* 로그인한 사용자에게만 보이는 메뉴 */}
            {isLoggedIn && (
              <>
                <Link to="/schedule" className="text-gray-700 hover:text-teal-500 font-medium">일정</Link>
                <Link to="/favorites" className="text-gray-700 hover:text-teal-500 font-medium">즐겨찾기</Link>
              </>
            )}
          </div>

          {/* 로그인 / 로그아웃 버튼 */}
          <div className="flex items-center space-x-4 ml-4">
            {isAdmin && (
              <span className="px-3 py-1 bg-teal-100 text-teal-600 rounded-md font-medium">
                관리자
              </span>
            )}
            
            {isLoggedIn ? (
              <>
                <Link 
                  to="/profile" 
                  className="rounded-md px-4 py-2 text-teal-500 border border-teal-500 hover:bg-teal-500 hover:text-white transition-colors"
                >
                  회원정보
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="rounded-md px-4 py-2 text-teal-500 border border-teal-500 hover:bg-teal-500 hover:text-white transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="rounded-md px-4 py-2 text-teal-500 border border-teal-500 hover:bg-teal-500 hover:text-white transition-colors"
                >
                  로그인
                </button>
                <Link 
                  to="/signup" 
                  className="rounded-md px-4 py-2 bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;