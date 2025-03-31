import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Table, Pagination } from "react-bootstrap";
import { getNotices } from '../../services/api';
import axios from 'axios'; // axios 직접 임포트
import "./NoticeBoard.css";
import Header from "../../components/include/Header";
import Footer from "../../components/include/Footer";

const NoticeBoard = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const itemsPerPage = 10;
  const apiBaseUrl = "/api";

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

  // 공지사항 데이터 로드
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        // 캐시 방지를 위한 타임스탬프 추가
        const timestamp = new Date().getTime();
        const response = await axios.get(`/api/notice?_=${timestamp}`);
        
        console.log("공지사항 API 응답:", response.data);
        setNotices(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error("공지사항 조회 중 오류:", error);
        setError(`공지사항을 불러오는 중 오류가 발생했습니다: ${error.message}`);
        setLoading(false);
      }
    };

    // 관리자 권한 확인
    const checkUserRole = () => {
      const userRole = localStorage.getItem("role");
      console.log("공지사항 페이지에서 확인한 사용자 역할:", userRole);
      setIsAdmin(userRole === "ADMIN");
    };

    fetchNotices();
    checkUserRole();
  }, []);

  // 로딩 및 에러 상태 처리
  if (loading) return (
    <>
      <Header />
      <div className="notice-container">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p className="mt-2">공지사항을 불러오는 중입니다...</p>
        </div>
      </div>
    </>
  );
  
  if (error) return (
    <>
      <Header />
      <div className="notice-container">
        <Card className="notice-card shadow-lg p-4">
          <div className="alert alert-danger">{error}</div>
          <div className="text-center mt-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              다시 시도하기
            </Button>
          </div>
        </Card>
      </div>
    </>
  );

  // 검색 및 페이지네이션 로직
  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastNotice = currentPage * itemsPerPage;
  const indexOfFirstNotice = indexOfLastNotice - itemsPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstNotice, indexOfLastNotice);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredNotices.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const moveInsert = () => {
    if (!isAdmin) {
      alert("공지사항 작성 권한이 없습니다. 관리자만 작성할 수 있습니다.");
      return;
    }
    navigate("/newnotice");
  };

  return (
    <>
      <Header />
      <div className="notice-container">
        <Card className="notice-card shadow-lg p-4">
          <Card.Body className="d-flex flex-column flex-grow-1">
            <h2 className="notice-title text-center mb-4" style={{ color: "#0d9488", fontWeight: "bold" }}>
              공지사항
            </h2>

            {/* 검색창 */}
            <div className="notice-search d-flex justify-content-center mb-4">
              <Form.Control
                type="text"
                placeholder="  검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "60%",
                  marginRight: "10px",
                  borderColor: "#0d9488",
                  borderRadius: "30px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}
              />
              <Button
                className="search-button"
                style={{
                  backgroundColor: "#0d9488",
                  borderColor: "#0d9488",
                  borderRadius: "30px",
                  padding: "0.5rem 2rem",
                  fontSize: "1rem",
                }}
              >
                검색
              </Button>
            </div>

            {/* 공지사항 테이블 */}
            <div className="notice-table-container">
              <Table striped bordered hover responsive className="notice-table text-center">
                <colgroup>
                  <col style={{ width: "10%" }} /> {/* 번호 */}
                  <col style={{ width: "50%" }} /> {/* 제목 (가장 넓게) */}
                  <col style={{ width: "12%" }} /> {/* 작성자 */}
                  <col style={{ width: "8%" }} /> {/* 조회수 */}
                  <col style={{ width: "20%" }} /> {/* 작성일 */}
                </colgroup>
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
                  {currentNotices.length > 0 ? (
                    currentNotices.map((notice, index) => (
                      <tr key={index}>
                        {/* 순차적 번호 표시 (내림차순) */}
                        <td>{filteredNotices.length - (indexOfFirstNotice + index)}</td>
                        <td 
                          onClick={() => navigate(`/notices/${notice.noticeId}`)} 
                          className="notice-title-link"
                          style={{ cursor: "pointer", color: "#0d9488" }}
                        >
                          {notice.title}
                        </td>
                        <td>{notice.authorName || "관리자"}</td>
                        <td>{notice.views || 0}</td>
                        <td>
                          {/* 작성일만 표시 (원복) */}
                          {formatDate(notice.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        {searchTerm ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            <div className="pagination-container d-flex justify-content-center">
              <Pagination>
                <Pagination.Prev
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                />
                {pageNumbers.map((number) => (
                  <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => currentPage < pageNumbers.length && handlePageChange(currentPage + 1)}
                />
              </Pagination>
            </div>

            {/* 글쓰기 버튼 - 관리자만 표시 */}
            {isAdmin ? (
              <div className="notice-button-container text-center">
                <Button
                  className="notice-write-button"
                  onClick={moveInsert}
                  style={{
                    backgroundColor: "#0d9488",
                    borderColor: "#0d9488",
                    borderRadius: "30px",
                    padding: "0.5rem 2rem",
                    fontSize: "1.1rem",
                  }}
                >
                  글쓰기
                </Button>
              </div>
            ) : (
              <div style={{textAlign: 'center', marginTop: '10px'}}>
                <small className="text-muted">관리자만 글쓰기가 가능합니다</small>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default NoticeBoard;