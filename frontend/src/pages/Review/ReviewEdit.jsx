import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { BsStarFill } from "react-icons/bs"; // ⭐ 아이콘 추가
import Header from "../../components/include/Header";
import { getReviewById, updateReview, searchProductsFromDB } from "../../services/api";

const ReviewEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [prdId, setPrdId] = useState("");
  const [productName, setProductName] = useState("");
  const [productInput, setProductInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [rating, setRating] = useState(0); // ⭐ 별점 상태 추가

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await getReviewById(id);
        setReview(res.data);
        setTitle(res.data.title);
        setContent(res.data.content);
        setProductName(res.data.productName);
        setProductInput(res.data.productName);
        setPrdId(res.data.prdId);
        setRating(res.data.rating || 0); // ⭐ 기존 별점 가져오기
      } catch (error) {
        console.error("리뷰 불러오기 오류:", error);
        alert("리뷰 정보를 불러오는 중 오류가 발생했습니다.");
      }
    };
    fetchReview();
  }, [id]);

  // 제품 검색 함수
  const findProducts = async (query) => {
    setSearchTerm(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      // searchProducts 대신 searchProductsFromDB 사용
      const res = await searchProductsFromDB(query);
      setSearchResults(res.data?.data || []);
    } catch (error) {
      console.error("제품 검색 오류:", error);
    }
  };

  // 제품 선택 시 제품명 변경
  const selectProduct = (product) => {
    setPrdId(product.prdId);
    setProductName(product.productName);
    setProductInput(product.productName);
    setSearchTerm("");
    setSearchResults([]);
  };

  // ⭐ 별점 설정 함수
  const handleStarClick = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("리뷰 내용을 입력하세요!");
      return;
    }
    if (!productName.trim()) {
      alert("제품을 선택하세요!");
      return;
    }
    try {
      const updatedReview = { 
        title, 
        content, 
        productName, 
        prdId, 
        rating // ⭐ 별점 추가
      };
      await updateReview(id, updatedReview);

      alert("리뷰가 성공적으로 수정되었습니다!");
      navigate(`/reviews/${id}`);
    } catch (error) {
      console.error("리뷰 수정 오류:", error);
      alert("리뷰 수정 중 오류가 발생했습니다.");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  if (!review) return <p>로딩 중...</p>;

  return (
    <>
      <Header />
      <div style={{ backgroundColor: "#c0ebe5", padding: "20px", minHeight: "100vh" }}>
        <Container style={{ marginTop: "50px" }}>
          <Card className="p-4 shadow-lg">
            <h2 className="mb-3 text-center" style={{ fontSize: "24px", fontWeight: "bold" }}>리뷰 수정</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>제목</Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>제품 검색</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="제품 이름을 검색하세요"
                  value={productInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProductInput(value);
                    setProductName(value);
                    if (value.trim() === "") return;
                    findProducts(value);
                  }}
                />

                {/* 검색 결과 */}
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

              {/* ⭐ 별점 선택 */}
              <Form.Group className="mb-3">
                <Form.Label>별점</Form.Label>
                <div className="d-flex align-items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <BsStarFill
                      key={star}
                      className={`fs-3 ${star <= rating ? "text-warning" : "text-secondary"}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleStarClick(star)}
                    />
                  ))}
                  <span className="fw-bold ms-2">({rating})</span>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>리뷰 내용</Form.Label>
                <div style={{ border: "none", borderRadius: "5px", padding: "5px", minHeight: "300px" }}>
                  <ReactQuill theme="snow" value={content} modules={modules} onChange={setContent} style={{ height: "250px" }} />
                </div>
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={() => navigate(`/reviews/${id}`)}>
                  취소
                </Button>
                <Button style={{ backgroundColor: "#2A9D8F", color: "white", border: "none" }} type="submit">
                  수정 완료
                </Button>
              </div>
            </Form>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default ReviewEdit;
