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

# 데이터 로드 및 예외 처리
df = None
try:
    df = pd.read_csv('preprocessed_비타민.csv', encoding='utf-8')
    df = df.dropna(subset=['기능성', '제품명'])
    if df.empty:
        raise ValueError("CSV 파일이 비어 있습니다.")
    df['기능성_제품명'] = df['기능성'] + " " + df['제품명']
except Exception as e:
    print(f"데이터 로드 오류: {e}")

# TF-IDF 벡터화
tfidf, tfidf_matrix = None, None
if df is not None:
    try:
        if os.path.exists("tfidf_vectorizer.pkl"):
            with open("tfidf_vectorizer.pkl", "rb") as f:
                tfidf = pickle.load(f)
                tfidf_matrix = tfidf.transform(df['기능성_제품명'])
        else:
            tfidf = TfidfVectorizer()
            tfidf_matrix = tfidf.fit_transform(df['기능성_제품명'])
            with open("tfidf_vectorizer.pkl", "wb") as f:
                pickle.dump(tfidf, f)
    except Exception as e:
        print(f"TF-IDF 벡터화 오류: {e}")

# 코사인 유사도 행렬 생성
cosine_sim = None
if tfidf_matrix is not None:
    try:
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    except Exception as e:
        print(f"코사인 유사도 계산 오류: {e}")

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
def recommend(keyword, limit=9):
    if df is None or tfidf is None or tfidf_matrix is None:
        return []

    try:
        # 키워드 전처리
        processed_keyword = preprocess_query(keyword)
        
        # 기존 키워드에 "비타민" 포함 여부 확인하고, 없으면 추가
        if "비타민" not in processed_keyword.lower():
            search_keyword = f"비타민 {processed_keyword}"
        else:
            search_keyword = processed_keyword
        
        keyword_vec = tfidf.transform([search_keyword])
        sim_scores = cosine_similarity(keyword_vec, tfidf_matrix)[0]
        sorted_indices = sim_scores.argsort()[::-1]
        
        # 유사도 임계값 설정 (0.1 이상)
        threshold = 0.05
        
        recommended_products = set()
        result_indices = []
        
        # 키워드 타입에 따른 추천 전략 선택
        if "비타민" in processed_keyword.lower():
            # 비타민 키워드 포함 시 관련 제품만 선택
            vitamin_type = None
            
            # 비타민 타입 추출 (C, B, D 등)
            vitamin_match = re.search(r'비타민\s*([a-zA-Z]+)', processed_keyword)
            if vitamin_match:
                vitamin_type = vitamin_match.group(1).upper()
            
            for idx in sorted_indices:
                product_name = df['제품명'].iloc[idx]
                product_func = df['기능성'].iloc[idx]
                
                # 해당 비타민 타입과 관련된 제품만 선택
                if vitamin_type and (f"비타민 {vitamin_type}" in product_func or f"비타민{vitamin_type}" in product_func):
                    if product_name not in recommended_products and sim_scores[idx] > threshold:
                        recommended_products.add(product_name)
                        result_indices.append(idx)
                        if len(recommended_products) >= limit:
                            break
                
                # 타입이 없거나 충분한 결과가 없을 경우 일반 비타민 제품 추가
                if not vitamin_type or len(recommended_products) < limit:
                    if "비타민" in product_func and product_name not in recommended_products and sim_scores[idx] > threshold:
                        recommended_products.add(product_name)
                        result_indices.append(idx)
                        if len(recommended_products) >= limit:
                            break
        else:
            # 일반 키워드 검색 - 유사도가 높은 제품만 선택
            for idx in sorted_indices:
                if sim_scores[idx] > threshold:
                    product_name = df['제품명'].iloc[idx]
                    if product_name not in recommended_products:
                        recommended_products.add(product_name)
                        result_indices.append(idx)
                        if len(recommended_products) >= limit:
                            break
        
        # 충분한 결과가 없을 경우 키워드 관련 결과 추가
        if len(result_indices) < limit:
            keyword_terms = processed_keyword.split()
            for term in keyword_terms:
                if len(term) > 1:  # 의미 있는 단어만 처리
                    for idx in sorted_indices:
                        if idx not in result_indices:
                            product_name = df['제품명'].iloc[idx]
                            product_func = df['기능성'].iloc[idx]
                            if term in product_name or term in product_func:
                                if product_name not in recommended_products:
                                    recommended_products.add(product_name)
                                    result_indices.append(idx)
                                    if len(recommended_products) >= limit:
                                        break
        
        # 결과가 부족하면 인기 제품으로 채우기
        popular_products = ["비타민C 1000", "종합비타민", "멀티비타민", "비타민B 컴플렉스", "비타민D"]
        if len(result_indices) < limit:
            for product in popular_products:
                if len(recommended_products) >= limit:
                    break
                if product not in recommended_products:
                    recommended_products.add(product)
        
        # 최종 결과가 인덱스 기반이면 해당 제품명 반환, 아니면 직접 추가된 제품명 반환
        final_products = []
        for idx in result_indices:
            final_products.append(df['제품명'].iloc[idx])
        
        # 직접 추가된 제품 추가
        for product in recommended_products:
            if product not in final_products and len(final_products) < limit:
                final_products.append(product)
                
        return final_products[:limit]  # 요청된 개수만큼 반환
    except Exception as e:
        print(f"추천 시스템 오류: {e}")
        return []

# API 엔드포인트
@app.route('/recommend', methods=['GET'])
def get_recommendations():
    keyword = request.args.get('keyword', '').strip()
    keyword = unquote(keyword)  # URL 디코딩
    if not keyword:
        return jsonify({"error": "검색어를 입력하세요."}), 400
    
    recommendations = recommend(keyword)
    if not recommendations:
        return jsonify({"message": "추천 결과가 없습니다.", "keyword": keyword, "count": 0, "recommendations": []})
    
    return jsonify({
        "keyword": keyword,
        "count": len(recommendations),
        "recommendations": recommendations  # 리스트 형태로 제품명만 반환
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)