import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { BsStarFill } from "react-icons/bs"; // ⭐ 아이콘 추가
import { getReviewById, deleteReview, increaseReviewView } from "../../services/api"; 
import Header from "../../components/include/Header";

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        await increaseReviewView(id);
        const response = await getReviewById(id);
        setReview(response.data);
        setLoading(false);

        const currentUserEmail = localStorage.getItem("email")?.trim();
        const reviewAuthorEmail = response.data.authorEmail?.trim();

        if (reviewAuthorEmail?.toLowerCase() === currentUserEmail?.toLowerCase()) {
          setCanEdit(true);
          setCanDelete(true);
        }
      } catch (error) {
        setError("리뷰를 불러오는 중 문제가 발생했습니다.");
        setLoading(false);
      }
    };

    if (id) {
      fetchReview();
    } else {
      setError("리뷰 ID가 없습니다.");
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
      try {
        await deleteReview(id);
        alert("리뷰가 성공적으로 삭제되었습니다.");
        navigate("/reviews");
      } catch (error) {
        alert("리뷰 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // ⭐ 별점 렌더링 함수 (수평 정렬)
  const renderStars = (rating) => {
    return (
      <div className="d-flex align-items-center gap-1">
        {Array.from({ length: rating }, (_, i) => (
          <BsStarFill key={i} className="text-warning fs-4" />
        ))}
        <span className="fw-bold ms-2">({rating})</span>
      </div>
    );
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!review) return <div>리뷰를 찾을 수 없습니다.</div>;

  return (
    <>
      <Header />
      <Container style={{ marginTop: "100px", maxWidth: "1100px" }}>
        <Card className="p-5 shadow-lg d-flex flex-column">
          <h2 className="mb-2 fw-bold">{review.title}</h2>

          <div className="alert alert-info d-inline-block px-3 py-2">
            <strong>상품 : </strong> {review.productName || "상품 정보 없음"}
          </div>

          {/* ⭐ 별점 표시 */}
          {review.rating > 0 && renderStars(review.rating)}

          <p className="text-muted mt-2">
            <strong>작성자:</strong> {review.authorEmail || "알 수 없음"} |
            <strong> 작성일:</strong> {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "날짜 없음"}
          </p>
          <hr />

          <div className="mb-4 fs-5" style={{ overflowY: "auto", maxHeight: "450px" }} dangerouslySetInnerHTML={{ __html: review.content }} />

          <Row className="mt-4">
            <Col>
              <Button variant="secondary" onClick={() => navigate("/reviews")}>
                목록으로 돌아가기
              </Button>
            </Col>
            {canEdit && (
              <Col className="text-end">
                <Button variant="primary" className="me-2" onClick={() => navigate(`/reviews/edit/${id}`)}>
                  수정
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  삭제
                </Button>
              </Col>
            )}
          </Row>
        </Card>
      </Container>
    </>
  );
};

export default ReviewDetail;
