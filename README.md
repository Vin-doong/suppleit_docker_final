# SuppleIt - 영양제 정보 및 복용 관리 서비스

## 프로젝트 소개
SuppleIt은 사용자에게 신뢰할 수 있는 영양제 정보를 제공하고, 개인 복용 일정을 관리할 수 있는 웹 서비스입니다. 영양제에 대한 정확한 정보 제공과 함께 사용자 맞춤형 복용 관리 기능을 통해 건강한 생활을 지원합니다.

## 주요 기능
- **영양제 정보 검색**: 다양한 영양제 정보를 검색하고 상세 정보 확인
- **복용 일정 관리**: 개인별 영양제 복용 일정 등록 및 관리
- **리뷰 시스템**: 사용자들의 실제 경험 기반 리뷰 작성 및 조회
- **즐겨찾기**: 자주 찾는 영양제 즐겨찾기 기능
- **소셜 로그인**: Google, Naver 로그인 지원

## 기술 스택
### Frontend
- React.js
- React Router
- Bootstrap
- Axios
- SweetAlert2

### Backend
- Spring Boot 3.4.3
- Spring Security
- JWT Authentication
- MyBatis
- Redis (토큰 블랙리스트 관리)

### Database
- MySQL 8.0

### Deployment
- Docker
- Nginx

## 설치 및 실행 방법

### 요구사항
- JDK 21
- Node.js
- MySQL
- Docker & Docker Compose (선택)

### 로컬 개발 환경 설정
1. 저장소 클론
```bash
git clone https://github.com/yourusername/suppleit.git
cd suppleit
```

2. 백엔드 실행
```bash
cd backend
./gradlew bootRun
```

3. 프론트엔드 실행
```bash
cd frontend
npm install
npm start
```

### Docker를 이용한 실행
```bash
docker-compose up -d
```

## API 문서
- API 문서는 `/api/docs` 에서 확인 가능합니다.

## 환경 변수 설정
프로젝트 실행을 위해 다음 환경 변수를 설정해야 합니다:

### Backend (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/suppleit
    username: root
    password: your_password
  
jwt:
  secret: your_jwt_secret_key
  expiration: 86400000

# 소셜 로그인 설정
spring.security.oauth2.client.registration.google.client-id: your_google_client_id
spring.security.oauth2.client.registration.google.client-secret: your_google_client_secret
spring.security.oauth2.client.registration.naver.client-id: your_naver_client_id
spring.security.oauth2.client.registration.naver.client-secret: your_naver_client_secret
```

## 프로젝트 구조
```
suppleit/
├── backend/             # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   └── build.gradle
├── frontend/            # React 프론트엔드
│   ├── public/
│   ├── src/
│   └── package.json
├── flask/               # 추천 시스템 서버
├── db/                  # 데이터베이스 스크립트
└── docker-compose.yml   # Docker 설정
```

## 기여 방법
1. 프로젝트 포크
2. 새 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 제출

## 라이선스
이 프로젝트는 Apache 2.0 라이선스를 따릅니다.

## 연락처
- Email: support@suppleit.com
- Website: https://suppleit.com
