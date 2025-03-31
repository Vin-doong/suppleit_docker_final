import os
import requests
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
import pickle

app = Flask(__name__)
CORS(app)

# 데이터 로드 및 예외 처리
df = None
try:
    df = pd.read_csv('preprocessed_비타민.csv')
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
        return pd.DataFrame()

    try:
        keyword_vec = tfidf.transform([keyword])
        sim_scores = cosine_similarity(keyword_vec, tfidf_matrix)[0]
        sorted_indices = sim_scores.argsort()[::-1]
        
        recommended_products = set()
        result_indices = []
        for idx in sorted_indices:
            product_name = df['제품명'].iloc[idx]
            if product_name not in recommended_products:
                recommended_products.add(product_name)
                result_indices.append(idx)
                if len(recommended_products) >= limit:
                    break

        return df[['제품명', '기능성']].iloc[result_indices]
    except Exception as e:
        print(f"추천 시스템 오류: {e}")
        return pd.DataFrame()

# API 엔드포인트
@app.route('/recommend', methods=['GET'])
def get_recommendations():
    keyword = request.args.get('keyword', '').strip()
    if not keyword:
        return jsonify({"error": "검색어를 입력하세요."}), 400
    
    recommendations = recommend(keyword)
    if recommendations.empty:
        return jsonify({"message": "추천 결과가 없습니다.", "keyword": keyword, "count": 0, "recommendations": []})
    
    return jsonify({
        "keyword": keyword,
        "count": len(recommendations),
        "recommendations": recommendations['제품명'].tolist()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)