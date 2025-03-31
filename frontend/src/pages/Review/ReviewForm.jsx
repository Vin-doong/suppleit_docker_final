import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import Header from "../../components/include/Header";
import { createReview, searchProductsFromDB } from "../../services/api";
import { FaStar } from "react-icons/fa"; // 별 아이콘 추가

const ReviewForm = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0); // 별점 상태 추가
  const memberId = localStorage.getItem('memberId');

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const findProducts = async (keyword) => {
    setSearchTerm(keyword);
    if (keyword.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      // searchProducts 대신 searchProductsFromDB 사용
      const res = await searchProductsFromDB(keyword);
      setSearchResults(res.data?.data || []);
    } catch (error) {
      console.error("제품 검색 오류:", error);
      setSearchResults([]);
    }
  };

  const selectProduct = (product) => {
    setSearchTerm(product.productName);
    setSelectedProduct(product);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("리뷰할 제품을 선택하세요!");
      return;
    }
    if (!content.trim()) {
      alert("리뷰 내용을 입력하세요!");
      return;
    }
    try {
      const reviewData = {
        title,
        memberId,
        prdId: selectedProduct.prdId,
        productName: selectedProduct.productName,
        content,
        rating
      };
      await createReview(reviewData);
      alert("리뷰가 성공적으로 등록되었습니다!");
      navigate("/reviews");
    } catch (error) {
      console.error("리뷰 등록 오류:", error);
      alert("리뷰 등록 중 오류가 발생했습니다.");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["link", "image"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  return (
    <>
      <Header />
      <div style={{ backgroundColor: "#c0ebe5", padding: "20px", minHeight: "100vh" }}>
        <Container style={{ marginTop: "50px" }}>
          <Card className="p-4 shadow-lg">
            <h2 className="mb-3 text-center" style={{ fontSize: "24px", fontWeight: "bold" }}>리뷰 작성</h2>
            <Form onSubmit={handleSubmit}>
              
              <Form.Group className="mb-3">
                <Form.Label>제목</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="리뷰 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>제품 검색</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="제품 이름을 검색하세요"
                  value={searchTerm || ""}
                  onChange={(e) => findProducts(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <ul className="list-group mt-2">
                    {searchResults.map((product) => (
                      <li
                        key={product.prdId}
                        className="list-group-item list-group-item-action"
                        onClick={() => selectProduct(product)}
                        style={{ cursor: "pointer" }}
                      >
                        {product.productName} ({product.companyName})
                      </li>
                    ))}
                  </ul>
                )}
              </Form.Group>

              {selectedProduct && (
                <div className="alert alert-info">
                  선택된 제품: <strong>{selectedProduct.productName} ({selectedProduct.companyName})</strong>
                </div>
              )}

              {/* ⭐ 별점 입력 UI */}
              <Form.Group className="mb-3">
                <Form.Label>별점 (1~5)</Form.Label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      size={30}
                      onClick={() => handleRatingChange(star)}
                      style={{
                        cursor: "pointer",
                        color: star <= rating ? "#FFD700" : "#e4e5e9",
                        transition: "color 0.2s"
                      }}
                    />
                  ))}
                  <span style={{ marginLeft: "10px", fontSize: "18px" }}>{rating} 점</span>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>리뷰 내용</Form.Label>
                <div style={{ border: "none", borderRadius: "5px", padding: "5px", minHeight: "300px" }}>
                  <ReactQuill
                    theme="snow"
                    value={content}
                    modules={modules}
                    onChange={setContent}
                    style={{ height: "250px" }}
                  />
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={() => navigate("/reviews")}>
                  취소
                </Button>
                <Button style={{ backgroundColor: "#2A9D8F", color: "white", border: "none" }} type="submit">
                  등록
                </Button>
              </div>
            </Form>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default ReviewForm;
