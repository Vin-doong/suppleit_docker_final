import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Table, Pagination } from "react-bootstrap";
import { getReviews } from '../../services/api';
import "./ReviewBoard.css"
import Header from "../../components/include/Header";
import Footer from "../../components/include/Footer";

const ReviewBoard = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchBy, setSearchBy] = useState("title");
  const itemsPerPage = 10;

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 리뷰 데이터 로드
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getReviews();
        console.log("리뷰 API 응답:", response.data);
        setReviews(response.data);
        setLoading(false);
      } catch (error) {
        console.error("리뷰 조회 중 오류:", error);
        setError("리뷰를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    // 관리자 권한 확인
    const checkUserRole = () => {
      const userRole = localStorage.getItem("role");
      console.log("리뷰 페이지에서 확인한 사용자 역할:", userRole);
      setIsAdmin(userRole === "USER");
    };

    fetchReviews();
    checkUserRole();
  }, []);

  // 로딩 및 에러 상태 처리
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

 // 검색 기준 (title or productName)
    const filteredReviews = reviews.filter((review) =>
      searchBy === "title"
        ? review.title?.toLowerCase().includes(searchTerm.toLowerCase())
        : review.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    //페이징 처리
  const indexOfLastReview = currentPage * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredReviews.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const moveInsert = () => {
    navigate("/newreview");
  };

  return (
    <>
      <Header />
      <div className="review-container">
        <Card className="review-card shadow-lg p-4">
          <Card.Body className="d-flex flex-column flex-grow-1">
            <h2 className="review-title text-center mb-4" style={{ color: "#0d9488", fontWeight: "bold" }}>
              리뷰 게시판
            </h2>

            <div className="review-search d-flex justify-content-center mb-4">
            {/* 검색 옵션 */}
              <Form.Select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                style={{
                  width: "12%",
                  minWidth: "100px",
                  marginRight: "10px",
                  borderColor: "#0d9488",
                  borderRadius: "20px",
                  padding: "5px 10px",
                }}
              >
                <option value="title">제목</option>
                <option value="productName">상품명</option>
              </Form.Select>

              {/* 검색창 */}
              <Form.Control
                type="text"
                placeholder=" 검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && setCurrentPage(1)}
                style={{
                  width: "50%", 
                  borderColor: "#0d9488",
                  borderRadius: "30px",
                  padding: "10px 15px",
                }}
              />

              {/* 검색 버튼 */}
              <Button
                onClick={() => setCurrentPage(1)}
                style={{
                    width : "8%",
                  backgroundColor: "#0d9488",
                  borderColor: "#0d9488",
                  borderRadius: "30px",
                  padding: "5px 15px",
                  marginLeft: "10px",
                }}
              >
                검색
              </Button>
            </div>

            {/* 리뷰 테이블 */}
            <div className="review-table-container">
              <Table striped bordered hover responsive className="review-table text-center">
                <thead style={{ backgroundColor: "#0d9488", color: "white" }}>
                  <tr>
                    <th>번호</th>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>조회수</th>
                    <th>작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReviews.length > 0 ? (
                    currentReviews.map((review, index) => (
                      <tr key={index}>
                        <td>{filteredReviews.length - (indexOfFirstReview + index)}</td>
                        <td 
                          onClick={() => navigate(`/reviews/${review.reviewId}`)} 
                          className="review-title-link"
                          style={{ cursor: "pointer", color: "#0d9488" }}
                        >[{review.productName}]
                          {review.title}
                        </td>
                        <td>{review.authorEmail}</td>
                        <td>{review.views || 0}</td>
                        <td>{formatDate(review.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            <div className="pagination-container d-flex justify-content-center">
              <Pagination>
                <Pagination.Prev onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} />
                {pageNumbers.map((number) => (
                  <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                  </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => currentPage < pageNumbers.length && handlePageChange(currentPage + 1)} />
              </Pagination>
            </div>

            {/* 글쓰기 버튼 */}
            <div className="review-button-container text-center">
              <Button className="review-write-button" onClick={moveInsert} style={{ backgroundColor: "#0d9488", borderRadius: "30px" }}>
                글쓰기
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default ReviewBoard;
