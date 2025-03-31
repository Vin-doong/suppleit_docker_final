import React, { useState, useEffect, useCallback,memo } from "react";
import "./ProductDetail.css";
import Footer from "../../components/include/Footer";
import Header from "../../components/include/Header";
import ReactMarkdown from 'react-markdown'; 


const removeHtmlTags = (str) => {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
};


const ProductDetail = () => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [productDescription, setProductDescription] = useState('');

  useEffect(() => {
    // sessionStorage에서 데이터 가져오기
    const keyword = sessionStorage.getItem('selectedKeyword');
    const products = sessionStorage.getItem('recommendedProducts');
    const description = sessionStorage.getItem('productDescription');
    
    if (keyword) {
      setSelectedKeyword(keyword);
    }
    if (description) {
      setProductDescription(description);
    }    
    if (products) {
      try {
        const parsedProducts = JSON.parse(products);
        setRecommendedProducts(parsedProducts);
      } catch (error) {
        console.error("제품 데이터 파싱 중 오류 발생:", error);
      }
    }
  }, []);

  // 디테일 토글 함수를 메모이제이션
  const toggleDetail = useCallback(() => {
    setShowDetail(prevState => !prevState);
  }, []);

  // 제품 링크 클릭 처리
  const handleProductClick = useCallback((product) => {
    if (!product.isDummy && product.link) {
      window.open(product.link, '_blank');
    }
  }, []);

  return (
    <div className="font-NotoSans bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col min-h-screen">
        {/* 타이틀 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-custom mb-6">
            {selectedKeyword ? `${selectedKeyword} 관련 제품` : "프리미엄 종합 비타민"}
          </h1>
          <p className="text-lg text-gray-900 max-w-3xl mx-auto mb-8">
            {selectedKeyword ? `${selectedKeyword}에 관련된 추천 제품입니다.` : "균형 잡힌 영양 섭취를 위한 고품질 종합 비타민입니다."}
          </p>
          <button
            className="btn-showmore"
            onClick={toggleDetail} 
          >
            더보기 <i className={`fas ${showDetail ? "fa-chevron-up" : "fa-chevron-down"} ml-2`}></i>
          </button>
        </div>

        {/* 상세 설명 - memo로 성능 최적화 */}
        <DetailContent 
          showDetail={showDetail}
          productDescription={productDescription}
        />

        {/* 추천 제품 */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">
            {selectedKeyword ? `${selectedKeyword} 추천 제품` : "추천 제품"}
          </h2>
          
          {/* API로 가져온 추천 제품이 있을 경우 표시 */}
          {recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-gray-900">
              {recommendedProducts.map((product, index) => (
                <ProductCard
                  key={index}
                  product={product}
                  onProductClick={handleProductClick}
                  removeHtmlTags={removeHtmlTags}
                />
              ))}
            </div>
          ) : (
            // 기본 추천 제품 표시 (기존 코드)
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-gray-900">
              {[
                { name: "비타민 B12", desc: "에너지 대사 촉진", price: "45,000원" },
                { name: "아연", desc: "면역력 강화", price: "52,000원" },
                // 나머지 기본 제품들...
              ].map((item, index) => (
                <div key={index} className="product-card">
                  <div className="p-4">
                    <h3 className="font-medium mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-900 mb-2">{item.desc}</p>
                    <p className="font-bold">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

// 디테일 컨텐츠 컴포넌트 분리
const DetailContent = React.memo(({ showDetail, productDescription }) => {
  return (
    <div
      className="detail-content"
      style={{
        maxHeight: showDetail ? "1000px" : "0px",
        opacity: showDetail ? "1" : "0",
        overflow: "hidden",
        transition: "max-height 0.3s ease-out, opacity 0.3s ease-out",
        backgroundColor: showDetail ? "white" : "transparent",
      }}
    >
      <div className="text-description">
        <ReactMarkdown>{productDescription}</ReactMarkdown>       
      </div>
    </div>
  );
});

// 상품 카드 컴포넌트 분리
const ProductCard = React.memo(({ product, onProductClick, removeHtmlTags }) => {
  return (
    <div 
      className="product-card cursor-pointer" 
      onClick={() => onProductClick(product)}
    >
      <div className="p-4">
        {product.image && (
          <div className="mb-3">
            <img
              src={product.image}
              alt={product.isDummy ? "추천 준비 중" : removeHtmlTags(product.title)}
              className="w-full h-32 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23f2f2f2%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22Arial%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3E%EC%9D%B4%EB%AF%B8%EC%A7%80%20%EC%97%86%EC%9D%8C%3C%2Ftext%3E%3C%2Fsvg%3E';
              }}
            />
          </div>
        )}
        <h3 className="font-medium mb-2">{removeHtmlTags(product.title)}</h3>
        {!product.isDummy && (
          <p className="font-bold">
            {product.price ? `${product.price.toLocaleString()}원` : "가격 정보 없음"}
          </p>
        )}
      </div>
    </div>
  );
});

export default ProductDetail;