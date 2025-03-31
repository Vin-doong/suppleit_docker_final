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

# 카테고리 설정
CATEGORIES = {
    'vitamin': {
        'file': 'preprocessed_비타민.csv',
        'key_columns': ['기능성', '제품명'],
        'combined_column': '기능성_제품명',
        'default_term': '비타민',
        'popular_products': ["비타민C 1000", "종합비타민", "멀티비타민", "비타민B 컴플렉스", "비타민D"]
    },
    'protein': {
        'file': 'preprocessed_단백질.csv',
        'key_columns': ['효능', '제품명'],
        'combined_column': '효능_제품명',
        'default_term': '단백질',
        'popular_products': ["웨이프로틴", "아이솔레이트", "식물성단백질", "콜라겐", "카제인"]
    },
    'mineral': {
        'file': 'preprocessed_미네랄.csv',
        'key_columns': ['성분', '제품명'],
        'combined_column': '성분_제품명',
        'default_term': '미네랄',
        'popular_products': ["마그네슘", "아연", "칼슘", "철분", "셀레늄"]
    },
    # 더 많은 카테고리 추가 가능
}

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
        
        return True
    except Exception as e:
        print(f"{category} 카테고리 데이터 로드 오류: {e}")
        return False

# 모든 카테고리 데이터 미리 로드
for category in CATEGORIES:
    load_category_data(category)

# 검색어 전처리 함수 (특수문자 제거 및 공백 표준화)
def preprocess_query(query):
    # 괄호 안의 내용 제거
    query = re.sub(r'\([^)]*\)', '', query)
    # 특수문자 제거 (한글, 영문, 숫자, 공백만 남김)
    query = re.sub(r'[^가-힣a-zA-Z0-9\s]', '', query)
    # 여러 개 공백을 하나로 통일
    query = re.sub(r'\s+', ' ', query).strip()
    return query

# 추천 함수
def recommend(keyword, category='vitamin', limit=9):
    # 카테고리 데이터 로드 확인
    if category not in CATEGORIES or category not in category_data:
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
        
        # 기본 용어 포함 여부 확인하고 필요한 경우 추가
        default_term = config['default_term']
        if default_term.lower() not in processed_keyword.lower():
            search_keyword = f"{default_term} {processed_keyword}"
        else:
            search_keyword = processed_keyword
        
        # 벡터화 및 유사도 계산
        keyword_vec = tfidf.transform([search_keyword])
        sim_scores = cosine_similarity(keyword_vec, tfidf_matrix)[0]
        sorted_indices = sim_scores.argsort()[::-1]
        
        # 유사도 임계값 설정
        threshold = 0.05
        
        recommended_products = set()
        result_indices = []
        
        # 카테고리별 추천 전략
        combined_column = config['combined_column']
        name_column = config['key_columns'][1]  # 제품명
        attr_column = config['key_columns'][0]  # 기능성/효능/성분 등
        
        # 기본 용어 관련 특별 처리 (비타민 타입, 단백질 종류 등)
        special_term = None
        term_match = re.search(rf'{default_term}\s*([a-zA-Z0-9]+)', processed_keyword, re.IGNORECASE)
        if term_match:
            special_term = term_match.group(1).upper()
        
        for idx in sorted_indices:
            product_name = df[name_column].iloc[idx]
            product_attr = df[attr_column].iloc[idx]
            
            # 특별 용어가 있는 경우 (비타민 C, 단백질 A 등)
            if special_term and (f"{default_term} {special_term}" in product_attr or f"{default_term}{special_term}" in product_attr):
                if product_name not in recommended_products and sim_scores[idx] > threshold:
                    recommended_products.add(product_name)
                    result_indices.append(idx)
                    if len(recommended_products) >= limit:
                        break
            
            # 일반 추천 로직 (특별 용어가 없거나 결과가 부족한 경우)
            if special_term is None or len(recommended_products) < limit:
                if default_term.lower() in product_attr.lower() and product_name not in recommended_products and sim_scores[idx] > threshold:
                    recommended_products.add(product_name)
                    result_indices.append(idx)
                    if len(recommended_products) >= limit:
                        break
        
        # 일반 키워드 기반 추가 검색 (충분한 결과가 없을 경우)
        if len(result_indices) < limit:
            keyword_terms = processed_keyword.split()
            for term in keyword_terms:
                if len(term) > 1:  # 의미 있는 단어만 처리
                    for idx in sorted_indices:
                        if idx not in result_indices:
                            product_name = df[name_column].iloc[idx]
                            product_attr = df[attr_column].iloc[idx]
                            if term.lower() in product_name.lower() or term.lower() in product_attr.lower():
                                if product_name not in recommended_products:
                                    recommended_products.add(product_name)
                                    result_indices.append(idx)
                                    if len(recommended_products) >= limit:
                                        break
        
        # 인기 제품으로 부족한 결과 채우기
        popular_products = config.get('popular_products', [])
        if len(result_indices) < limit and popular_products:
            for product in popular_products:
                if len(recommended_products) >= limit:
                    break
                if product not in recommended_products:
                    recommended_products.add(product)
        
        # 최종 결과 구성
        final_products = []
        for idx in result_indices:
            final_products.append(df[name_column].iloc[idx])
        
        # 직접 추가된 제품명 추가
        for product in recommended_products:
            if product not in final_products and len(final_products) < limit:
                final_products.append(product)
        
        return final_products[:limit]
    except Exception as e:
        print(f"추천 시스템 오류: {e}")
        return []

# API 엔드포인트
@app.route('/recommend', methods=['GET'])
def get_recommendations():
    keyword = request.args.get('keyword', '').strip()
    category = request.args.get('category', 'vitamin').strip()  # 기본값은 vitamin
    
    keyword = unquote(keyword)  # URL 디코딩
    if not keyword:
        return jsonify({"error": "검색어를 입력하세요."}), 400
    
    recommendations = recommend(keyword, category)
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)