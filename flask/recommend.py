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
app.config['JSON_AS_ASCII'] = False
CORS(app)

# CSV 파일 경로 설정
DATA_DIRS = {
    'efficacy': './recommend/data/efficacy',
    'nutrient': './recommend/data/nutrient'
}

# 베이스 카테고리 설정
BASE_CATEGORIES = {
    '비타민': {
        'file': './recommend/data/nutrient/preprocessed_비타민.csv',
        'search_column': 'processed_text',  # processed_text 컬럼 사용
        'default_term': '비타민'
    }
}

# 카테고리별 데이터와 모델 저장
category_data = {}

# 동적으로 CSV 파일을 기반으로 카테고리 확장
def discover_categories():
    categories = BASE_CATEGORIES.copy()
    
    for dir_type, dir_path in DATA_DIRS.items():
        if not os.path.exists(dir_path):
            print(f"디렉토리가 존재하지 않습니다: {dir_path}")
            continue
            
        for file_name in os.listdir(dir_path):
            if file_name.startswith('preprocessed_') and file_name.endswith('.csv'):
                category_name = file_name.replace('preprocessed_', '').replace('.csv', '')
                full_path = os.path.join(dir_path, file_name)
                
                if category_name not in categories:
                    categories[category_name] = {
                        'file': full_path,
                        'search_column': 'processed_text',  # processed_text 컬럼 사용
                        'default_term': category_name
                    }
                    print(f"새 카테고리 추가됨: {category_name}, 파일: {full_path}")
                else:
                    categories[category_name]['file'] = full_path
    
    return categories

# 데이터 로드 함수
def load_category_data(category):
    if category not in CATEGORIES:
        return False
    
    if category in category_data:
        return True
    
    config = CATEGORIES[category]
    file_path = config['file']
    search_column = config['search_column']
    
    try:
        # 데이터 로드
        df = pd.read_csv(file_path, encoding='utf-8')
        
        # 필요한 컬럼 확인
        if search_column not in df.columns:
            print(f"경고: {file_path}에 필요한 컬럼이 없습니다: {search_column}")
            return False
        
        # NaN 값이 있는 행 제거
        df = df.dropna(subset=[search_column])
        
        if df.empty:
            raise ValueError(f"{file_path} 파일이 비어 있습니다.")
        
        # TF-IDF 벡터화
        vectorizer_path = f"./recommend/data/tfidf_vectorizer_{category}.pkl"
        if os.path.exists(vectorizer_path):
            with open(vectorizer_path, "rb") as f:
                tfidf = pickle.load(f)
                tfidf_matrix = tfidf.transform(df[search_column])
        else:
            tfidf = TfidfVectorizer()
            tfidf_matrix = tfidf.fit_transform(df[search_column])
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
    
    for category, config in CATEGORIES.items():
        if category.lower() in processed_keyword or config['default_term'].lower() in processed_keyword:
            return category
    
    return list(CATEGORIES.keys())[0]  # 첫 번째 카테고리 반환

# 추천 함수
def recommend(keyword, category=None, limit=5):
    if category is None or category not in CATEGORIES:
        category = guess_category(keyword)
    
    if category not in CATEGORIES:
        return []
    
    if category not in category_data:
        if not load_category_data(category):
            return []
    
    config = CATEGORIES[category]
    data = category_data[category]
    df = data['df']
    tfidf = data['tfidf']
    search_column = config['search_column']
    
    try:
        # 키워드 전처리
        processed_keyword = preprocess_query(keyword)
        
        # 키워드 벡터화 및 유사도 계산
        keyword_vec = tfidf.transform([processed_keyword])
        sim_scores = cosine_similarity(keyword_vec, data['tfidf_matrix'])[0]
        
        # 유사도와 인덱스를 함께 저장하여 정렬
        product_scores = [(i, sim_scores[i], df['제품명'].iloc[i]) for i in range(len(sim_scores))]
        
        # 유사도 기준으로 정렬
        product_scores.sort(key=lambda x: x[1], reverse=True)
        
        # 중복 제거하며 결과 수집
        final_products = []
        seen_products = set()
        
        # 일정 유사도 이상 제품만 추가
        threshold = 0.05  # 필요시 조정
        for idx, score, product_name in product_scores:
            if score > threshold and product_name not in seen_products:
                final_products.append(product_name)
                seen_products.add(product_name)
                if len(final_products) >= limit:
                    break
        
        return final_products
    except Exception as e:
        print(f"추천 시스템 오류: {e}")
        return []

# API 엔드포인트
@app.route('/recommend', methods=['GET'])
def get_recommendations():
    keyword = request.args.get('keyword', '').strip()
    category = request.args.get('category', '').strip()
    limit = int(request.args.get('limit', 6))
    
    keyword = unquote(keyword)  # URL 디코딩
    if not keyword:
        return jsonify({"error": "키워드가 잘못되었습니다."}), 400
    
    if not category:
        category = guess_category(keyword)
    
    recommendations = recommend(keyword, category, limit)
    
    if not recommendations:
        # 결과가 없는 경우 랜덤 추천
        all_products = []
        for cat in CATEGORIES:
            if cat in category_data and 'df' in category_data[cat]:
                cat_products = category_data[cat]['df']['제품명'].tolist()
                all_products.extend(cat_products)
        
        if all_products:
            import random
            recommendations = random.sample(all_products, min(limit, len(all_products)))
    
    return jsonify({
        "keyword": keyword,
        "category": category,
        "count": len(recommendations),
        "recommendations": recommendations
    })

# 모든 카테고리 이름 반환 API
@app.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({
        "count": len(CATEGORIES),
        "categories": list(CATEGORIES.keys())
    })

# 서버 시작 시 모든 CSV 파일 검색하여 카테고리 설정
CATEGORIES = discover_categories()

if __name__ == '__main__':
    print(f"사용 가능한 카테고리: {', '.join(CATEGORIES.keys())}")
    
    # 서버 시작 전에 일부 카테고리 데이터 미리 로드
    for category in list(CATEGORIES.keys())[:1]:
        load_category_data(category)
    
    app.run(host='0.0.0.0', port=5000)
