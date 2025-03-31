import { useEffect, useState } from "react";
import { getProducts } from "../../services/api";
import { Link } from "react-router-dom";

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error("제품 목록을 불러오는 중 오류 발생:", error);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div>
      <h2>제품 목록</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <Link to={`/products/${product.id}`}>{product.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductList;