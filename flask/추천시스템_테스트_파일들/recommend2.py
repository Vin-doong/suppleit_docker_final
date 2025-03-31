import os
import requests
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
import pickle
import re
from urllib.parse import unquote

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # JSON 응답에서 ASCII가 아닌 문자를 이스케이프하지 않음
CORS(app)

# CSV 파일 경로 수정
DATA_DIRS = {
    'efficacy': 'data/efficacy',  # 효능 관련 CSV 파일이 있는 디렉토리
    'nutrient': 'data/nutrient'   # 영양소 관련 CSV 파일이 있는 디렉토리
}

# 일관된 CSV 구조 정의
CSV_COLUMNS = ['제조사', '제품명', '신고번호', '등록일', '유통기한', '기능성']

# 베이스 카테고리 설정
BASE_CATEGORIES = {
    '비타민': {
        'file': 'data/nutrient/preprocessed_비타민.csv',
        'key_columns': ['기능성', '제품명'],
        'combined_column': '기능성_제품명',
        'default_term': '비타민',
        'popular_products': ["종합비타민", "멀티비타민"]
    }
}

# 동적으로 CSV 파일을 기반으로 카테고리 확장
def discover_categories():
    categories = BASE_CATEGORIES.copy()
    
    # 각 데이터 디렉토리에서 CSV 파일 검색
    for dir_type, dir_path in DATA_DIRS.items():
        if not os.path.exists(dir_path):
            print(f"디렉토리가 존재하지 않습니다: {dir_path}")
            continue
            
        for file_name in os.listdir(dir_path):
            if file_name.startswith('preprocessed_') and file_name.endswith('.csv'):
                # 파일 이름에서 카테고리 이름 추출 (preprocessed_비타민.csv -> 비타민)
                category_name = file_name.replace('preprocessed_', '').replace('.csv', '')
                full_path = os.path.join(dir_path, file_name)
                
                # 이미 등록된 카테고리가 아니면 추가
                if category_name not in categories:
                    categories[category_name] = {
                        'file': full_path,
                        'key_columns': ['기능성', '제품명'],  # 모든 CSV 파일이 동일한 구조
                        'combined_column': '기능성_제품명',
                        'default_term': category_name,
                        'popular_products': []  # 인기 제품은 없는 상태로 시작
                    }
                    print(f"새 카테고리 추가됨: {category_name}, 파일: {full_path}")
                else:
                    # 이미 있는 카테고리의 경우 파일 경로 업데이트
                    categories[category_name]['file'] = full_path
    
    return categories

# 카테고리별 데이터와 모델 저장
category_data = {}

# 데이터 로드 함수
def load_category_data(category):
    if category not in CATEGORIES:
        return False
    
    if category in category_data:
        return True
    
    config = CATEGORIES[category]
    file_path = config['file']
    
    try:
        # 데이터 로드
        df = pd.read_csv(file_path, encoding='utf-8')
        
        # 기본 컬럼 확인
        missing_columns = [col for col in config['key_columns'] if col not in df.columns]
        if missing_columns:
            print(f"경고: {file_path}에 필요한 컬럼이 없습니다: {missing_columns}")
            # 필요한 컬럼이 없으면 빈 컬럼 추가
            for col in missing_columns:
                df[col] = category
        
        # NaN 값이 있는 행 제거
        df = df.dropna(subset=config['key_columns'])
        
        if df.empty:
            raise ValueError(f"{file_path} 파일이 비어 있습니다.")
        
        # 결합 컬럼 생성
        df[config['combined_column']] = df[config['key_columns'][0]] + " " + df[config['key_columns'][1]]
        
        # TF-IDF 벡터화
        vectorizer_path = f"tfidf_vectorizer_{category}.pkl"
        if os.path.exists(vectorizer_path):
            with open(vectorizer_path, "rb") as f:
                tfidf = pickle.load(f)
                tfidf_matrix = tfidf.transform(df[config['combined_column']])
        else:
            tfidf = TfidfVectorizer()
            tfidf_matrix = tfidf.fit_transform(df[config['combined_column']])
            with open(vectorizer_path, "wb") as f:
                pickle.dump(tfidf, f)
        
        # 코사인 유사도 행렬 생성
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        # 카테고리 데이터 저장
        category_data[category] = {
            'df': df,
            'tfidf': tfidf,
            'tfidf_matrix': tfidf_matrix,
            'cosine_sim': cosine_sim
        }
        
        # 인기 제품이 없는 경우 가장 많이 등장하는 제품으로 설정
        #if not CATEGORIES[category]['popular_products']:
            # 제품명 중 상위 5개 추출
        #    top_products = df['제품명'].value_counts().head(5).index.tolist()
        #   CATEGORIES[category]['popular_products'] = top_products
        
        return True
    except Exception as e:
        print(f"{category} 카테고리 데이터 로드 오류: {e}")
        return False

# 검색어 전처리 함수 (특수문자 제거 및 공백 표준화)
def preprocess_query(query):
    # 괄호 안의 내용 제거
    query = re.sub(r'\([^)]*\)', '', query)
    # 특수문자 제거 (한글, 영문, 숫자, 공백만 남김)
    query = re.sub(r'[^가-힣a-zA-Z0-9\s]', '', query)
    # 여러 개 공백을 하나로 통일
    query = re.sub(r'\s+', ' ', query).strip()
    return query

# 키워드로 카테고리 추측 함수
def guess_category(keyword):
    processed_keyword = preprocess_query(keyword.lower())
    
    # 카테고리 매칭 시도
    for category, config in CATEGORIES.items():
        if category.lower() in processed_keyword or config['default_term'].lower() in processed_keyword:
            return category
    
    # 기본 카테고리
    return list(CATEGORIES.keys())[0]  # 첫 번째 카테고리 반환

# 추천 함수 - 유사도 임계값 낮추고 다양한 결과 반환하도록 수정
def recommend(keyword, category=None, limit=5):
    # 카테고리가 지정되지 않은 경우 키워드로 추측
    if category is None or category not in CATEGORIES:
        category = guess_category(keyword)
    
    # 카테고리 데이터 로드 확인
    if category not in CATEGORIES:
        return []
    
    # 해당 카테고리 데이터가 없으면 로드
    if category not in category_data:
        if not load_category_data(category):
            return []
    
    # 카테고리 설정 및 데이터 추출
    config = CATEGORIES[category]
    data = category_data[category]
    df = data['df']
    tfidf = data['tfidf']
    tfidf_matrix = data['tfidf_matrix']
    
    try:
        # 키워드 전처리
        processed_keyword = preprocess_query(keyword)
        
        # 기본 용어 추가
        default_term = config['default_term']
        search_keyword = f"{default_term} {processed_keyword}" if default_term.lower() not in processed_keyword.lower() else processed_keyword
        
        # 벡터화 및 유사도 계산
        keyword_vec = tfidf.transform([search_keyword])
        sim_scores = cosine_similarity(keyword_vec, tfidf_matrix)[0]
        
        # 결과 구성 (간소화된 버전)
        name_column = '제품명'
        attr_column = '기능성'
        
        # 유사도와 인덱스를 함께 저장하여 정렬
        product_scores = [(i, sim_scores[i], df[name_column].iloc[i]) for i in range(len(sim_scores))]
        
        # 유사도 기준으로 정렬
        product_scores.sort(key=lambda x: x[1], reverse=True)
        
        # 중복 제거하며 결과 수집
        final_products = []
        seen_products = set()
        
        # 일정 유사도 이상 제품만 추가
        threshold = 0.01  # 필요시 조정
        for idx, score, product_name in product_scores:
            if score > threshold and product_name not in seen_products:
                final_products.append(product_name)
                seen_products.add(product_name)
                if len(final_products) >= limit:
                    break
        
        # 결과가 충분하지 않으면 인기 제품으로 보충 (선택적)
       # if len(final_products) < limit:
        #    popular_products = config.get('popular_products', [])
          #  for product in popular_products:
           #     if product not in seen_products:
            #        final_products.append(product)
             #       seen_products.add(product)
              #      if len(final_products) >= limit:
               #         break
        
        return final_products
    except Exception as e:
        print(f"추천 시스템 오류: {e}")
        return []

# 모든 카테고리 이름 반환 API
@app.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({
        "count": len(CATEGORIES),
        "categories": list(CATEGORIES.keys())
    })

# API 엔드포인트
@app.route('/recommend', methods=['GET'])
def get_recommendations():
    keyword = request.args.get('keyword', '').strip()
    category = request.args.get('category', '').strip()  # 카테고리가 지정되지 않으면 자동 감지
    limit = int(request.args.get('limit', 6))
    
    keyword = unquote(keyword)  # URL 디코딩
    if not keyword:
        return jsonify({"error": "검색어를 입력하세요."}), 400
    
    # 카테고리가 비어있으면 키워드로 추측
    if not category:
        category = guess_category(keyword)
    
    recommendations = recommend(keyword, category, limit)
    if not recommendations:
        # 결과가 없는 경우 모든 CSV 파일에서 랜덤 추천
        all_products = []
        for cat in CATEGORIES:
            if cat in category_data and 'df' in category_data[cat]:
                cat_products = category_data[cat]['df']['제품명'].tolist()
                all_products.extend(cat_products)
        
        if all_products:
            import random
            recommendations = random.sample(all_products, min(limit, len(all_products)))
        
    if not recommendations:
        return jsonify({
            "message": "추천 결과가 없습니다.", 
            "keyword": keyword, 
            "category": category,
            "count": 0, 
            "recommendations": []
        })
    
    return jsonify({
        "keyword": keyword,
        "category": category,
        "count": len(recommendations),
        "recommendations": recommendations
    })

# 서버 시작 시 모든 CSV 파일 검색하여 카테고리 설정
CATEGORIES = discover_categories()

if __name__ == '__main__':
    # 모든 카테고리 정보 출력
    print(f"사용 가능한 카테고리: {', '.join(CATEGORIES.keys())}")
    
    #서버 시작 전에 일부 카테고리 데이터 미리 로드
    for category in list(CATEGORIES.keys())[:1]:  # 처음 2개 카테고리만 미리 로드
        load_category_data(category)
    
    app.run(debug=True, port=5000)