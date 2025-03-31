import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createNotice } from '../../services/api';
import Header from "../../components/include/Header";

const NoticeBoardInsert = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(""); // 파일 타입 추적을 위한 상태
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태 추적
  const [previewImage, setPreviewImage] = useState(null); // 이미지 미리보기
  
  // Quill 에디터 참조 추가
  const quillRef = useRef(null);

  useEffect(() => {
    const checkUserRole = () => {
      const userRole = localStorage.getItem("role");
      const isAdmin = userRole === "ADMIN";
      setIsAdmin(isAdmin);

      if (!isAdmin) {
        alert("공지사항 작성 권한이 없습니다. 관리자만 작성할 수 있습니다.");
        navigate("/notices");
      }
    };
    
    checkUserRole();
  }, [navigate]);

  // 일반 파일 첨부 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      // 이미지 파일인 경우 미리보기 생성
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewImage(null); // 이미지가 아닌 경우 미리보기 제거
      }
      
      console.log("선택된 파일 타입:", selectedFile.type);
    } else {
      setFile(null);
      setFileType("");
      setPreviewImage(null);
    }
  };

  // 파일 제거 핸들러
  const handleRemoveFile = () => {
    setFile(null);
    setFileType("");
    setPreviewImage(null);
  };
  
  // 이미지 업로드 핸들러 추가 - 에디터 내 이미지 삽입 기능
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
          alert('이미지 파일만 업로드할 수 있습니다.');
          return;
        }
        
        // 임시 URL 생성 (미리보기용)
        const reader = new FileReader();
        reader.onload = () => {
          // Quill 에디터에 이미지 삽입
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          
          // 현재 커서 위치에 이미지 삽입
          quill.insertEmbed(range.index, 'image', reader.result);
          
          // 커서를 이미지 다음으로 이동
          quill.setSelection(range.index + 1);
          
          // 에디터 내용 상태 업데이트
          setContent(quillRef.current.getEditor().root.innerHTML);
        };
        reader.readAsDataURL(file);
      }
    };
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요!");
      return;
    }

    if (isSubmitting) {
      return; // 중복 제출 방지
    }

    try {
      setIsSubmitting(true);
      
      // FormData 객체로 데이터 준비
      const noticeData = {
        title,
        content,
        file
      };

      const response = await createNotice(noticeData);
      
      alert("공지사항이 성공적으로 등록되었습니다.");
      
      // 성공 시 새로 생성된 공지사항 상세 페이지로 이동
      if (response.data && response.data.noticeId) {
        navigate(`/notices/${response.data.noticeId}`);
      } else {
        navigate("/notices"); // ID가 없으면 목록으로 이동
      }
    } catch (error) {
      console.error("공지사항 등록 중 오류:", error);
      alert("공지사항 등록 중 오류가 발생했습니다: " + 
            (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ReactQuill 모듈 설정 - 에디터 내 이미지 삽입 기능 추가
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['link', 'image'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload // 이미지 핸들러 연결
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  // 관리자가 아닌 경우 작성 페이지 렌더링 방지
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Header />
      <div style={{ backgroundColor: "#c0ebe5", padding: "20px", minHeight: "100vh" }}>
        <Container style={{ marginTop: "50px" }}>
          <Card className="p-4 shadow-lg">
            <h2 className="mb-3 text-center" style={{ fontSize: "24px", fontWeight: "bold" }}>공지사항 쓰기</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>제목</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="공지사항 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>내용</Form.Label>
                <div style={{ minHeight: "300px" }}>
                  <ReactQuill 
                    ref={quillRef} // Quill 에디터 참조 추가
                    theme="snow" 
                    value={content}  
                    modules={modules} 
                    formats={formats}
                    onChange={setContent} 
                    style={{ height: "250px" }}
                  />
                </div>
                <p className="text-muted mt-2">
                  <i className="fas fa-info-circle me-1"></i>
                  툴바의 이미지 아이콘을 클릭하여 본문에 이미지를 삽입할 수 있습니다.
                </p>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>파일 첨부 (이미지 또는 첨부파일)</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
                {file && (
                  <div className="mt-2 d-flex align-items-center">
                    <span className="text-muted me-2">
                      {fileType.startsWith('image/') 
                        ? `선택된 이미지: ${file.name}` 
                        : `선택된 파일: ${file.name}`}
                    </span>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      제거
                    </Button>
                  </div>
                )}
              </Form.Group>

              {/* 이미지 미리보기 */}
              {previewImage && (
                <Form.Group className="mb-3">
                  <Form.Label>이미지 미리보기</Form.Label>
                  <div>
                    <img 
                      src={previewImage} 
                      alt="이미지 미리보기" 
                      style={{ maxWidth: "300px", maxHeight: "200px" }} 
                      className="border rounded"
                    />
                  </div>
                </Form.Group>
              )}

              <div className="d-flex justify-content-end">
                <Button 
                  variant="secondary" 
                  className="me-2" 
                  onClick={() => navigate("/notices")}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button 
                  style={{ backgroundColor: "#2A9D8F", color: "white", border: "none" }} 
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </Button>
              </div>
            </Form>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default NoticeBoardInsert;