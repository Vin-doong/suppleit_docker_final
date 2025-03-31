import axios from 'axios';

// 동적으로 API URL 결정하는 함수
const getApiBaseUrl = () => {
  // 브라우저 환경에서만 실행
  if (typeof window !== 'undefined') {
    // 환경 변수가 있으면 그대로 사용, 없으면 현재 호스트 기반으로 동적 생성
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }
    
    // 브라우저의 현재 URL에서 호스트 부분만 가져와서 사용
    const currentHost = window.location.hostname;
    return `http://${currentHost}:8000/api`;
  }
  
  // 기본값 (개발 환경)
  return '/api';
};

// API URL 결정
const apiUrl = '/api';
console.log('Using API URL:', apiUrl);

// axios 인스턴스 생성
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - 토큰이 있을 때만 Authorization 헤더 추가
api.interceptors.request.use(
  (config) => {
    // 모든 공지사항 GET 요청에 대해 인증 우회 처리 통일
    const isNoticeGetRequest = 
      config.url.startsWith('/notice') && config.method === 'get';
    
    if (isNoticeGetRequest) {
      // 공지사항 조회는 토큰이 없어도 가능하게 설정
      return config;
    }
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 인증 오류(401) 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 토큰이 필요 없는 공지사항 API에 대해서는 401 에러를 처리하지 않음
    if ((originalRequest.url.includes('/notice') && originalRequest.method === 'get') ||
        (originalRequest.url.startsWith('/notice/') && originalRequest.method === 'get')) {
      return Promise.reject(error);
    }
    
    // 401 오류이고 재시도하지 않은 경우 리프레시 토큰으로 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('리프레시 토큰이 없습니다');
        }
        
        // 리프레시 토큰으로 새 액세스 토큰 요청
        const response = await axios.post(`${apiUrl}/auth/refresh`, {
          refreshToken
        });
        
        // 새 액세스 토큰 저장
        localStorage.setItem('accessToken', response.data.accessToken);
        
        // 원래 요청의 헤더 업데이트
        originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
        
        // 원래 요청 재시도
        return axios(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃 처리
        // 단, 공지사항 조회처럼 인증이 필요없는 페이지는 로그인 페이지로 리다이렉트하지 않음
        if (!originalRequest.url.includes('/notice')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('role');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// 회원 인증 관련 API
export const login = async (email, password) => {
  return api.post("/auth/login", { email, password });
};

export const logout = async () => {
  return api.post("/auth/logout");
};

export const signup = async (userData) => {
  return api.post("/member/join", userData);
};

export const getMemberInfo = async () => {
  return api.get("/member/info");
};

export const updateMemberInfo = async (userData) => {
  return api.put("/member/update", userData);
};

// 비밀번호 찾기 API 호출 (이메일과 닉네임으로 임시 비밀번호 발급)
export const findPassword = async (email, nickname) => {
  return axios.post(`${apiUrl}/auth/find/password`, 
    { email, nickname },
    { headers: { 'Content-Type': 'application/json' } }
  );
};

// 비밀번호 변경 API 호출 (로그인 상태에서)
export const changePassword = async (oldPassword, newPassword) => {
  return api.post('/auth/change-password', {
    oldPassword,
    newPassword
  });
};

// 회원 탈퇴 API
export const deleteMember = async () => {
  return api.delete("/member/delete");
};

export const checkEmail = async (email) => {
  return api.get(`/member/validation/email/${email}`);
};

export const checkNickname = async (nickname) => {
  return api.get(`/member/validation/nickname/${nickname}`);
};

// 소셜 로그인 API
export const googleLogin = async (code) => {
  return api.post("/social/login/google", { code });
};

export const naverLogin = async (code, state) => {
  return api.post("/social/login/naver", { code, state });
};

// 공지사항 관련 API
export const getNotices = async () => {
  // 캐싱 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  return api.get(`${apiUrl}/notice?_=${timestamp}`); // 인증 없이 접근 가능하도록 api 대신 axios 사용
};

export const getNoticeById = async (id) => {
  // 캐싱 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  // api 인스턴스 대신 api.get 사용으로 통일
  return api.get(`/notice/${id}?_=${timestamp}`);
};

// 본문에서 Base64 이미지 추출 및 파일로 변환하는 함수
function extractBase64Images(htmlContent) {
  if (!htmlContent) return { content: htmlContent, extractedImages: [] };
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  const extractedImages = [];
  
  // 이미지가 없으면 원본 반환
  if (images.length === 0) {
    return { content: htmlContent, extractedImages: [] };
  }
  
  // 각 이미지를 처리
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    
    // base64 이미지인 경우만 처리
    if (src && src.startsWith('data:image/')) {
      // 이미지 유형과 데이터 추출
      const matches = src.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const imageType = matches[1];
        const base64Data = matches[2];
        const byteString = atob(base64Data);
        
        // ArrayBuffer 생성
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        // Blob 생성 후 File 객체로 변환
        const blob = new Blob([ab], { type: `image/${imageType}` });
        const fileName = `inline-image-${index + 1}.${imageType}`;
        const file = new File([blob], fileName, { type: `image/${imageType}` });
        
        extractedImages.push(file);
        
        // 이미지 src를 임시 플레이스홀더로 변경 (서버에서 실제 URL로 교체될 것)
        img.setAttribute('src', `{{IMAGE_PLACEHOLDER_${index}}}`);
      }
    }
  });
  
  // 변경된 HTML과 추출된 이미지 파일 반환
  return {
    content: doc.body.innerHTML,
    extractedImages
  };
}

// 공지사항 생성 - FormData 처리 개선
export const createNotice = async (noticeData) => {
  try {
    console.log("공지사항 등록 시작", noticeData);
    
    const formData = new FormData();
    
    // Base64 이미지를 추출하여 파일로 변환
    const { content, extractedImages } = extractBase64Images(noticeData.content);
    
    // 업데이트된 컨텐츠 (이미지 플레이스홀더가 있는)
    noticeData.content = content;
    
    // notice 데이터를 JSON 문자열로 변환하여 Blob으로 추가
    const noticeJson = JSON.stringify({
      title: noticeData.title,
      content: noticeData.content
    });
    
    formData.append('notice', new Blob([noticeJson], { type: 'application/json' }));
    
    // 파일 처리
    if (noticeData.file) {
      // 이미지 파일인지 확인 - MIME 타입으로 판단
      if (noticeData.file.type.startsWith('image/')) {
        formData.append('image', noticeData.file);
        console.log("이미지 파일 업로드:", noticeData.file.name, noticeData.file.type);
      } else {
        formData.append('attachment', noticeData.file);
        console.log("일반 첨부파일 업로드:", noticeData.file.name, noticeData.file.type);
      }
    }
    
    // 본문 내 추출된 이미지들 처리
    if (extractedImages && extractedImages.length > 0) {
      extractedImages.forEach((imgFile, index) => {
        formData.append('contentImages', imgFile);
        console.log(`본문 이미지 ${index + 1} 업로드:`, imgFile.name);
      });
    }
    
    const response = await api.post("/notice", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log("공지사항 등록 성공:", response);
    return response;
  } catch (error) {
    console.error("공지사항 등록 실패:", error);
    throw error;
  }
};

// 공지사항 수정 - FormData 처리 개선
export const updateNotice = async (id, noticeData) => {
  try {
    console.log("공지사항 수정 시작", id, noticeData);
    
    const formData = new FormData();
    
    // Base64 이미지를 추출하여 파일로 변환
    const { content, extractedImages } = extractBase64Images(noticeData.content);
    
    // 업데이트된 컨텐츠 (이미지 플레이스홀더가 있는)
    noticeData.content = content;
    
    // notice 데이터를 JSON 문자열로 변환하여 Blob으로 추가
    const noticeJson = JSON.stringify({
      title: noticeData.title,
      content: noticeData.content,
      removeAttachment: noticeData.removeAttachment || false,
      removeImage: noticeData.removeImage || false
    });
    
    formData.append('notice', new Blob([noticeJson], { type: 'application/json' }));
    
    // 파일 처리
    if (noticeData.file) {
      // 이미지 파일인지 확인 - MIME 타입으로 판단
      if (noticeData.file.type.startsWith('image/')) {
        formData.append('image', noticeData.file);
        console.log("이미지 파일 업로드:", noticeData.file.name, noticeData.file.type);
      } else {
        formData.append('attachment', noticeData.file);
        console.log("일반 첨부파일 업로드:", noticeData.file.name, noticeData.file.type);
      }
    }
    
    // 본문 내 추출된 이미지들 처리
    if (extractedImages && extractedImages.length > 0) {
      extractedImages.forEach((imgFile, index) => {
        formData.append('contentImages', imgFile);
        console.log(`본문 이미지 ${index + 1} 업로드:`, imgFile.name);
      });
    }
    
    const response = await api.put(`/notice/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log("공지사항 수정 성공:", response);
    return response;
  } catch (error) {
    console.error("공지사항 수정 실패:", error);
    throw error;
  }
};

export const deleteNotice = async (id) => {
  return api.delete(`/notice/${id}`);
};

// 파일 다운로드 헬퍼 함수
export const getFileDownloadUrl = (noticeId, fileName) => {
  // fileName이 null이거나 undefined인 경우 처리
  if (!fileName) return '';
  return `${apiUrl}/notice/attachment/${noticeId}/${encodeURIComponent(fileName)}`;
};

export const getImageUrl = (imagePath) => {
  // imagePath가 null이거나 undefined인 경우 처리
  if (!imagePath) return '';
  return `${apiUrl}/notice/image/${imagePath}`;
};

// 제품 관련 API
export const getProducts = () => {
  // 캐싱 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  return axios.get(`${apiUrl}/products?_=${timestamp}`);
};

export const getRecommendations = (keyword) => {
  const encodedKeyword = encodeURIComponent(keyword);
  // 캐싱 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  return axios.get(`${apiUrl}/recommend?keyword=${encodedKeyword}&_=${timestamp}`);
};

//📛📛리뷰 관련 추가
// 리뷰 목록 조회
export const getReviews = async () => {
  return api.get("/reviews");
};

// 특정 리뷰 조회
export const getReviewById = async (reviewId) => {
  return api.get(`/reviews/${reviewId}`);
};

// 리뷰 작성
export const createReview = async (reviewData) => {
  return api.post("/reviews", reviewData, {
      headers: { "Content-Type": "application/json" }
    })
};

// 리뷰 수정
export const updateReview = async (reviewId, reviewData) => {
  return api.put(`/reviews/${reviewId}`, reviewData, {
    headers: { "Content-Type": "application/json" }
  });
};


// 리뷰 삭제
export const deleteReview = async (reviewId) => {
  return api.delete(`/reviews/${reviewId}`);
};

// 리뷰 좋아요 추가
export const likeReview = async (reviewId) => {
  return api.post(`/reviews/${reviewId}/like`);
};

// 리뷰 싫어요 추가
export const dislikeReview = async (reviewId) => {
  return api.post(`/reviews/${reviewId}/dislike`);
};

// 리뷰 조회수 증가
export const increaseReviewView = async (reviewId) => {
  return api.post(`/reviews/${reviewId}`);
};

// 제품 검색 API
export const searchProducts = (keyword) => {
  const encodedKeyword = encodeURIComponent(keyword);
  // 캐싱 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  return api.get(`/products/search?keyword=${encodedKeyword}&_=${timestamp}`);
};

// 제품 상세 조회 API
export const getProductById = (productId) => {
  return api.get(`/products/${productId}`);
};

// 사용자 계정 유형 확인 API (소셜 계정 여부)
export const checkAccountType = async () => {
  return api.get("/member/account-type");
};

// 건강기능식품 검색 API
export const searchHealthFoods = async (keyword, page = 1, limit = 10) => {
  return api.get(`/health-foods/search?keyword=${encodeURIComponent(keyword)}&pageNo=${page}&numOfRows=${limit}`);
};

// 건강기능식품 상세 조회 API
export const getHealthFoodDetail = async (reportNo) => {
  return api.get(`/health-foods/detail/${encodeURIComponent(reportNo)}`);
};

// 간편 검색 API
export const quickSearchHealthFoods = async (productName) => {
  return api.get(`/health-foods/quick-search?name=${encodeURIComponent(productName)}`);
};

// 제품 정보 조회 API (기존 함수를 확장)
export const getProductDetailWithHealth = async (productId) => {
  try {
    // 먼저 제품 기본 정보 조회
    const productResponse = await api.get(`/products/${productId}`);
    
    // 제품 정보에 신고번호가 있으면, 건강기능식품 API도 조회
    if (productResponse.data?.data?.registrationNo) {
      try {
        const healthResponse = await getHealthFoodDetail(productResponse.data.data.registrationNo);
        // 두 정보 병합
        return {
          ...productResponse.data,
          healthInfo: healthResponse.data?.data
        };
      } catch (healthError) {
        console.warn('건강기능식품 정보 조회 실패:', healthError);
        return productResponse.data;
      }
    }
    
    return productResponse.data;
  } catch (error) {
    console.error('제품 정보 조회 실패:', error);
    throw error;
  }
};

// 제품 DB 전용 검색 API (리뷰 등록/수정 시 사용)
export const searchProductsFromDB = (keyword) => {
  const encodedKeyword = encodeURIComponent(keyword);
  // 캐싱 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();
  return api.get(`/products/db-search?keyword=${encodedKeyword}&_=${timestamp}`);
};

// 스케줄 목록 조회
export const getSchedules = async () => {
  return api.get('/schedule');
};

// 특정 스케줄 조회
export const getScheduleById = async (scheduleId) => {
  return api.get(`/schedule/${scheduleId}`);
};

// 스케줄 생성
export const createSchedule = async (scheduleData) => {
  return api.post('/schedule', scheduleData);
};

// 스케줄 수정
export const updateSchedule = async (scheduleId, scheduleData) => {
  return api.put(`/schedule/${scheduleId}`, scheduleData);
};

// 스케줄 삭제
export const deleteSchedule = async (scheduleId) => {
  return api.delete(`/schedule/${scheduleId}`);
};

// 시간대별 스케줄 조회
export const getSchedulesByTime = async (intakeTime) => {
  return api.get(`/schedule/time/${intakeTime}`);
};

export default api;