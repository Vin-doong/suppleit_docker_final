import Footer from '../../components/include/Footer';
import Header from '../../components/include/Header';
import ProductGrid from '../Product/ProductGrid'; // 추가

const Home = () => {
  return (
   <>
   <Header/>
    <div className="flex flex-col bg-gray-50 font-['Noto_Sans_KR']">
      {/* Navbar */}

      {/* Search Section */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="flex items-center w-full mb-12">
          
        </div>
        {/* Product Grid 컴포넌트 사용 */}
        <ProductGrid />
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default Home;
