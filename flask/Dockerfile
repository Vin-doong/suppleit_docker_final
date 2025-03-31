FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 필요한 Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 데이터 디렉토리 확인
RUN mkdir -p ./recommend/data/efficacy ./recommend/data/nutrient

# 포트 설정
EXPOSE 5000

# 컨테이너 시작 시 실행할 명령어
CMD ["python", "recommend.py"]