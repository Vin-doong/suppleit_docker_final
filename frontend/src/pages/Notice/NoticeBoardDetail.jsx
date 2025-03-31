import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Row, Col, Alert } from "react-bootstrap";
import { getNoticeById, deleteNotice } from '../../services/api';
import Header from "../../components/include/Header";
import axios from "axios";

const NoticeBoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const apiBaseUrl = "/api";

  useEffect(() => {
    // NoticeBoardDetail.jsx - fetchNotice 함수 수정
    const fetchNotice = async () => {
      try {
        setLoading(true);
        console.log("상세 조회 요청 ID:", id);
        
        const response = await getNoticeById(id);
        
        console.log("공지사항 상세 데이터:", response.data);
        
        // 응답 데이터 유효성 검사
        if (!response.data) {
          throw new Error("응답에 데이터가 없습니다");
        }
        
        // 원본 데이터 저장
        setNotice(response.data);
        setLoading(false);
      } catch (error) {
        console.error("공지사항 조회 중 오류:", error);
        // 더 자세한 오류 메시지 표시
        setError(`공지사항을 불러오는 중 오류가 발생했습니다: ${error.message}`);
        setLoading(false);
      }
    };

    const checkUserRole = () => {
      const userRole = localStorage.getItem("role");
      console.log("상세 페이지에서 확인한 사용자 역할:", userRole);
      setIsAdmin(userRole === "ADMIN");
    };

    if (id) {
      fetchNotice();
      checkUserRole();
    } else {
      setError("공지사항 ID가 없습니다.");
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) {
      try {
        setDeleteLoading(true);
        await deleteNotice(id);
        alert("공지사항이 성공적으로 삭제되었습니다.");
        navigate("/notices");
      } catch (error) {
        console.error("공지사항 삭제 중 오류:", error);
        alert("공지사항 삭제 중 오류가 발생했습니다.");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // 파일 다운로드 핸들러 - 직접 다운로드 링크 사용
  const handleFileDownload = () => {
    if (notice?.attachmentPath && notice?.attachmentName) {
      const downloadUrl = `${apiBaseUrl}/notice/attachment/${notice.noticeId}/${encodeURIComponent(notice.attachmentName)}`;
      // 링크 생성 및 클릭 시뮬레이션으로 다운로드
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = notice.attachmentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 이미지 다운로드 핸들러 - 직접 다운로드 링크 사용
  const handleImageDownload = () => {
    if (notice?.imagePath) {
      // 새로운 다운로드 엔드포인트 사용
      const downloadUrl = `${apiBaseUrl}/notice/image/download/${notice.imagePath}`;
      // 링크 생성 및 클릭 시뮬레이션으로 다운로드
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = "image.png"; // 기본 파일명
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 이미지 크게 보기 핸들러
  const handleImageView = () => {
    if (notice?.imagePath) {
      const imageUrl = `${apiBaseUrl}/notice/image/${notice.imagePath}`;
      window.open(imageUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container className="mt-5">
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p className="mt-2">공지사항을 불러오는 중입니다...</p>
          </div>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container className="mt-5">
          <Alert variant="danger">{error}</Alert>
          <div className="text-center mt-3">
            <Button variant="secondary" onClick={() => navigate("/notices")}>
              목록으로 돌아가기
            </Button>
          </div>
        </Container>
      </>
    );
  }

  if (!notice) {
    return (
      <>
        <Header />
        <Container className="mt-5">
          <Alert variant="warning">공지사항을 찾을 수 없습니다.</Alert>
          <div className="text-center mt-3">
            <Button variant="secondary" onClick={() => navigate("/notices")}>
              목록으로 돌아가기
            </Button>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container style={{ marginTop: "100px", maxWidth: "1100px" }}>
        <Card className="p-5 shadow-lg d-flex flex-column" style={{ height: "auto" }}>
          <h2 className="mb-4" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{notice.title}</h2>

          <p className="text-muted">
            <strong>작성자:</strong> {notice.authorName || "관리자"} | 
            <strong>조회수:</strong> {notice.views || 0} | 
            <strong>작성일:</strong> {
              notice.createdAt 
                ? new Date(notice.createdAt).toLocaleDateString() 
                : new Date().toLocaleDateString()
            }
            {notice.updatedAt && notice.createdAt !== notice.updatedAt && (
              <span> | <strong>수정일:</strong> {new Date(notice.updatedAt).toLocaleDateString()}</span>
            )}
          </p>
          <hr />

          {/* 내용 영역 */}
          <div 
            className="flex-grow-1 mb-4 fs-5" 
            style={{ overflowY: "auto", maxHeight: "450px" }} 
            dangerouslySetInnerHTML={{ __html: notice.content }} 
          />

          {/* 첨부파일 영역 */}
          {notice.attachmentPath && notice.attachmentName && (
            <div className="mt-4 p-3 border rounded bg-light">
              <div className="d-flex align-items-center">
                <strong className="me-2">첨부 파일:</strong>
                <span className="text-primary me-3">{notice.attachmentName}</span>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleFileDownload}
                >
                  다운로드
                </Button>
              </div>
            </div>
          )}

          {/* 이미지 영역 */}
          {notice.imagePath && (
            <div className="mt-4">
              <strong>첨부된 이미지:</strong>
              <div className="mt-2">
                <img 
                  src={`${apiBaseUrl}/notice/image/${notice.imagePath}`}
                  alt="첨부된 이미지" 
                  className="img-fluid border rounded"
                  style={{ maxWidth: "100%", maxHeight: "400px", cursor: "pointer" }}
                  onClick={handleImageView}
                />
                <div className="mt-2 d-flex">
                  <Button 
                    variant="outline-primary" 
                    className="me-2"
                    onClick={handleImageView}
                  >
                    <i className="fas fa-search-plus me-1"></i> 크게 보기
                  </Button>
                  <Button 
                    variant="outline-success"
                    onClick={handleImageDownload}
                  >
                    <i className="fas fa-download me-1"></i> 다운로드
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          <Row className="mt-4">
            <Col>
              <Button 
                variant="secondary" 
                onClick={() => navigate("/notices")}
              >
                목록으로 돌아가기
              </Button>
            </Col>
            {isAdmin && (
              <Col className="text-end">
                <Button 
                  variant="warning" 
                  className="me-2" 
                  onClick={() => navigate(`/notices/edit/${id}`)}
                  disabled={deleteLoading}
                >
                  수정
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "삭제 중..." : "삭제"}
                </Button>
              </Col>
            )}
          </Row>
        </Card>
      </Container>
    </>
  );
};

export default NoticeBoardDetail;