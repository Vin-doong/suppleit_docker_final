import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations } from '../../services/api';
import productDetails from './productDetails';

const ProductGrid = () => {
  const navigate = useNavigate();
  const [activeSet, setActiveSet] = useState(() => {
    const savedSet = sessionStorage.getItem('activeSet');
    return savedSet ? JSON.parse(savedSet) : 0;
  });
  
const productset1 = [
  { icon: 'pills', title: '비타민', description: '신체 기능 유지와 항산화 작용' },
  { icon: 'dumbbell', title: '단백질', description: '근육 형성과 회복에 도움' },
  { icon: 'bone', title: '칼슘', description: '뼈 건강과 골다공증 예방' },
  { icon: 'shield-alt', title: '아연', description: '면역력 강화와 상처 회복 촉진' },
  { icon: 'bacteria', title: '프로바이오틱스', description: '장 건강과 소화 개선' },
  { icon: 'medkit', title: '시스테인', description: '간 해독과 항산화 작용' },
  { icon: 'seedling', title: '엽산', description: '세포 생성과 혈액 건강 유지' },
  { icon: 'shield-virus', title: '셀렌', description: '항산화 작용과 면역력 강화' },
  { icon: 'heartbeat', title: '나이아신', description: '혈액순환과 피부 건강 개선' },
];

const productset2 = [
  { icon: 'bolt', title: '피로회복', description: '에너지 생성과 피로 개선' },
  { icon: 'bone', title: '골다공증', description: '뼈 건강과 칼슘 흡수 촉진' },
  { icon: 'tint', title: '피부', description: '보습 유지와 탄력 증진' },
  { icon: 'weight', title: '체지방', description: '지방 대사와 체중 조절' },
  { icon: 'heartbeat', title: '혈행', description: '혈액순환 개선과 혈압 조절' },
  { icon: 'dumbbell', title: '근육', description: '근육 형성과 회복 지원' },
  { icon: 'brain', title: '신경', description: '신경 안정과 스트레스 완화' },
  { icon: 'chart-line', title: '콜레스테롤', description: '콜레스테롤 수치 조절' },
  { icon: 'walking', title: '관절', description: '관절 건강과 염증 완화' },
];

  // 현재 활성화된 세트의 products 배열
  const products = activeSet === 0 ? productset1 : productset2;
  
  // 세트 전환 함수
  const toggleProductSet = () => {
    const newSet = activeSet === 0 ? 1 : 0;
    setActiveSet(newSet);
    sessionStorage.setItem('activeSet', JSON.stringify(newSet)); // 탭 상태 저장
  };

  const handleCategoryClick = async (keyword) => {
    try {
      // 1. 키워드 저장
      sessionStorage.setItem('selectedKeyword', keyword);
      // 2.상세 설명 저장
      sessionStorage.setItem('productDescription', productDetails[keyword] || '');      
      // 3. API 호출
      const response = await getRecommendations(keyword);      
      // 4. 결과 저장
      sessionStorage.setItem('recommendedProducts', JSON.stringify(response.data));      
      // 5. 페이지 이동
      navigate('/productdetail');
    } catch (error) {
      console.error("추천 제품을 불러오는 중 오류 발생:", error);
    }
  };
  return (
    <div className="mx-auto max-w-8xl">
      {/* 탭 UI */}
      <div className="flex justify-center mb-8">
        <div className="flex border-b border-gray-200 w-full">
          <button
            className={`py-2 px-6 text-center flex-1 ${
              activeSet === 0
                ? 'border-b-2 border-teal-500 font-medium text-teal-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
           onClick={() => { setActiveSet(0); sessionStorage.setItem('activeSet', JSON.stringify(0)); }}
          >
            영양소
          </button>
          <button
            className={`py-2 px-6 text-center flex-1 ${
              activeSet === 1
                ? 'border-b-2 border-teal-500 font-medium text-teal-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setActiveSet(1); sessionStorage.setItem('activeSet', JSON.stringify(1)); }}
          >
            건강기능
          </button>
        </div>
      </div>
    {/* 제품 그리드 */}
      <div className="grid grid-cols-3 gap-8 mb-12 mx-auto max-w-8xl">
        {products.map((product, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCategoryClick(product.title)}
          >
            <i className={`fas fa-${product.icon} text-3xl text-teal-500 mb-4`}></i>
            <h3 className="text-lg font-medium mb-2 text-gray-800">{product.title}</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;