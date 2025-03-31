import requests
import pandas as pd
import json
import mysql.connector
import time
import urllib3
import certifi
import os
from urllib.parse import unquote
from datetime import datetime
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_KEY = "{Insert Your Key}"
API_URL = "http://apis.data.go.kr/1471000/HtfsInfoService03/getHtfsItem01"

# 진행 상태를 저장할 파일
PROGRESS_FILE = "crawling_progress.json"
# 데이터를 저장할 기본 파일명
BASE_FILENAME = "supplements"

def connect_to_database():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="abcd1234",
            database="supplements"
        )
        return conn
    except mysql.connector.Error as err:
        print(f"MySQL 연결 실패: {err}")
        return None

def fetch_data_from_api(page_no=1, num_of_rows=100):
    params = {
        "serviceKey": unquote(API_KEY),
        "pageNo": page_no,
        "numOfRows": num_of_rows,        
        "type": "json"
    }
    try:
        response = requests.get(API_URL, params=params, verify=False, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API 요청 오류 (페이지 {page_no}): {e}")
        return None

def get_total_count():
    # 첫 페이지를 요청하여 전체 데이터 수 확인
    first_page = fetch_data_from_api(page_no=1, num_of_rows=1)
    if first_page and "body" in first_page:
        total_count = first_page["body"].get("totalCount", 0)
        return total_count
    return 0

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "last_page": 0,
        "total_collected": 0,
        "last_batch": 0,
        "total_count": 0
    }

def save_progress(progress):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=4)

def parse_and_save_data(start_page=1, end_page=None, num_of_rows=100, batch_size=1000):
    # 진행 상태 로드
    progress = load_progress()
    
    # 시작 페이지 설정 (이전에 중단된 곳에서 시작)
    if progress["last_page"] > 0 and start_page <= progress["last_page"]:
        start_page = progress["last_page"] + 1
        print(f"이전 진행 상태에서 재시작합니다. 시작 페이지: {start_page}")
    
    # 전체 데이터 수 확인
    if progress["total_count"] == 0:
        total_count = get_total_count()
        progress["total_count"] = total_count
    else:
        total_count = progress["total_count"]
    
    print(f"총 데이터 수: {total_count}개")
    
    # 배치 번호 설정
    current_batch = progress["last_batch"] + 1
    
    # 전체 페이지 수 계산
    total_pages = (total_count + num_of_rows - 1) // num_of_rows
    
    if end_page is None or end_page > total_pages:
        end_page = total_pages
    
    print(f"처리할 페이지: {start_page} ~ {end_page} (총 {end_page - start_page + 1}페이지)")
    
    all_data = []
    total_collected = progress["total_collected"]
    api_calls = 0
    
    for page in range(start_page, end_page + 1):
        print(f"페이지 {page}/{end_page} 데이터 가져오는 중... (진행률: {((page - start_page) / (end_page - start_page + 1) * 100):.1f}%)")
        
        # API 호출 제한 확인 (하루 10,000회)
        api_calls += 1
        if api_calls >= 9900:  # 안전 마진 확보
            print(f"API 호출 제한에 근접했습니다 ({api_calls}회). 오늘의 작업을 중단합니다.")
            break
        
        data = fetch_data_from_api(page_no=page, num_of_rows=num_of_rows)
        
        if data and "body" in data and "items" in data["body"]:
            items = data["body"]["items"]
            page_data = []
            
            for item_wrapper in items:
                item = item_wrapper.get("item", {})
                page_data.append({
                    "제조사": item.get("ENTRPS", "정보 없음"),
                    "제품명": item.get("PRDUCT", "정보 없음"),
                    "신고번호": item.get("STTEMNT_NO", "정보 없음"),
                    "등록일": item.get("REGIST_DT", "정보 없음"),
                    "유통기한": item.get("DISTB_PD", "정보 없음"),
                    "기능성": item.get("MAIN_FNCTN", "정보 없음")
                })
            
            all_data.extend(page_data)
            total_collected += len(page_data)
            
            # 배치 크기에 도달하면 저장
            if len(all_data) >= batch_size:
                save_batch(all_data, current_batch)
                current_batch += 1
                all_data = []
            
            # 진행 상태 업데이트
            progress["last_page"] = page
            progress["total_collected"] = total_collected
            progress["last_batch"] = current_batch - 1
            save_progress(progress)
            
            # API 호출 간격 조절
            time.sleep(0.2)
        else:
            print(f"페이지 {page}에서 데이터를 가져오지 못했습니다.")
            time.sleep(1)  # 오류 발생 시 대기 시간 증가
    
    # 남은 데이터 저장
    if all_data:
        save_batch(all_data, current_batch)
    
    print(f"데이터 수집 완료! 총 {total_collected}개의 데이터를 수집했습니다.")
    
    # 모든 배치 파일을 합쳐서 최종 파일 생성
    if total_collected > 0:
        combine_batches(current_batch)

def save_batch(data, batch_num):
    if not data:
        return
    
    df = pd.DataFrame(data)
    filename_prefix = f"{BASE_FILENAME}_batch_{batch_num}"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    
    # CSV 저장
    csv_filename = f"{filename_prefix}_{timestamp}.csv"
    df.to_csv(csv_filename, index=False, encoding="utf-8-sig")
    
    # JSON 저장
    json_filename = f"{filename_prefix}_{timestamp}.json"
    df.to_json(json_filename, orient="records", force_ascii=False, indent=4)
    
    print(f"배치 {batch_num} 저장 완료: {len(df)}개 데이터 ({csv_filename}, {json_filename})")
    
    # 데이터베이스 저장
    save_to_database(df, batch_num)

def combine_batches(last_batch):
    all_data = []
    
    # 모든 배치 파일 검색
    batch_files = [f for f in os.listdir() if f.startswith(f"{BASE_FILENAME}_batch_") and f.endswith(".csv")]
    
    for file in batch_files:
        df = pd.read_csv(file, encoding="utf-8-sig")
        all_data.append(df)
    
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        
        # 중복 제거
        combined_df = combined_df.drop_duplicates(subset=["신고번호"])
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        
        # 최종 파일 저장
        combined_csv = f"{BASE_FILENAME}_combined_{timestamp}.csv"
        combined_json = f"{BASE_FILENAME}_combined_{timestamp}.json"
        
        combined_df.to_csv(combined_csv, index=False, encoding="utf-8-sig")
        combined_df.to_json(combined_json, orient="records", force_ascii=False, indent=4)
        
        print(f"모든 배치 파일 통합 완료: 총 {len(combined_df)}개 데이터 ({combined_csv}, {combined_json})")

def save_to_database(df, batch_num):
    conn = connect_to_database()
    if not conn:
        print("MySQL 연결 실패로 인해 데이터베이스 저장을 건너뜁니다.")
        return
    
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            제조사 VARCHAR(255),
            제품명 VARCHAR(255),
            신고번호 VARCHAR(50),
            등록일 VARCHAR(50),
            유통기한 VARCHAR(50),
            기능성 TEXT,
            batch_num INT
        )
    """)
    
    if df.empty:
        print("데이터프레임이 비어 있습니다. MySQL에 저장할 데이터가 없습니다.")
        return
    
    sql = """
        INSERT INTO supplements (제조사, 제품명, 신고번호, 등록일, 유통기한, 기능성, batch_num)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    values = [(row["제조사"], row["제품명"], row["신고번호"], row["등록일"], row["유통기한"], row["기능성"], batch_num) 
              for _, row in df.iterrows()]
    
    try:
        cursor.executemany(sql, values)
        conn.commit()
        print(f"배치 {batch_num} 데이터베이스 저장 완료: {len(df)}개 행")
    except mysql.connector.Error as err:
        print(f"데이터베이스 저장 실패: {err}")
    finally:
        conn.close()

if __name__ == "__main__":
    # 설정 값
    START_PAGE = 1            # 시작 페이지
    END_PAGE = None           # 끝 페이지 (None으로 설정하면 모든 페이지 처리)
    NUM_OF_ROWS = 100         # 페이지당 데이터 수
    BATCH_SIZE = 1000         # 배치당 데이터 수
    
    parse_and_save_data(START_PAGE, END_PAGE, NUM_OF_ROWS, BATCH_SIZE)
