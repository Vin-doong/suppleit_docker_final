DROP TABLE IF EXISTS member;

CREATE TABLE member (
  member_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '회원 고유 ID',
  email VARCHAR(200) NOT NULL UNIQUE COMMENT '로컬/소셜 로그인 이메일',
  password VARCHAR(200) NULL COMMENT '로컬 로그인은 필수, 소셜 로그인 사용자는 NULL',
  nickname VARCHAR(50) NULL COMMENT '닉네임',
  gender VARCHAR(10) NULL COMMENT '성별 (MALE/FEMALE, 소셜 로그인에 따라 NULL 허용)',
  birth DATE NULL COMMENT '생년월일 (소셜 로그인에 따라 NULL 허용)',
  member_role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '사용자 역할',
  social_type VARCHAR(20) NOT NULL DEFAULT 'NONE' COMMENT '소셜 로그인 유형',
  CONSTRAINT chk_member_role CHECK (member_role IN ('USER', 'ADMIN')),
  CONSTRAINT chk_social_type CHECK (social_type IN ('NONE', 'KAKAO', 'NAVER', 'GOOGLE'))
);

DROP TABLE IF EXISTS product;

CREATE TABLE product (
  prd_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(200) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  registration_no VARCHAR(200),
  expiration_period VARCHAR(100),
  srv_use TEXT,
  main_function TEXT,
  preservation TEXT,
  intake_hint TEXT,
  base_standard TEXT
);

DROP TABLE IF EXISTS favorite;

CREATE TABLE favorite (
  favorite_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  prd_id BIGINT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES member(member_id) ON DELETE CASCADE,
  FOREIGN KEY (prd_id) REFERENCES product(prd_id) ON DELETE CASCADE,
  UNIQUE KEY (member_id, prd_id)
);

DROP TABLE IF EXISTS schedule;

CREATE TABLE schedule (
  schedule_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  intake_start DATE NOT NULL COMMENT '복용 시작일',
  intake_distance INT NULL COMMENT '복용 기간(일 수)',
  intake_end DATE NULL COMMENT '복용 종료일',
  intake_time VARCHAR(20) NOT NULL COMMENT '복용 시간대 (아침/점심/저녁)',
  supplement_name VARCHAR(200) NOT NULL COMMENT '영양제 이름',
  memo TEXT NULL COMMENT '메모',
  member_id BIGINT NOT NULL COMMENT '회원 ID',
  FOREIGN KEY (member_id) REFERENCES member(member_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS notice;

CREATE TABLE notice (
  notice_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '공지사항 제목',
  content LONGTEXT NOT NULL COMMENT '공지사항 내용',
  member_id BIGINT NOT NULL COMMENT '작성자 ID',
  views INT DEFAULT 0 COMMENT '조회수',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  image_path VARCHAR(255) NULL COMMENT '이미지 파일 경로',
  attachment_path VARCHAR(255) NULL COMMENT '첨부파일 경로',
  attachment_name VARCHAR(255) NULL COMMENT '첨부파일 원본명',
  last_modified_by BIGINT NULL COMMENT '마지막 수정자 ID',
  FOREIGN KEY (member_id) REFERENCES member(member_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS review;

CREATE TABLE review (
  review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  prd_id BIGINT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,  
  content MEDIUMTEXT NOT NULL,
  rating INT NOT NULL,
  views INT DEFAULT 0,
  like_count INT DEFAULT 0,
  dislike_count INT DEFAULT 0,
  is_commentable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT check_rating CHECK (rating >= 1 AND rating <= 5)
);