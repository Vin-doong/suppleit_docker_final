import os
from flask import Flask, request, jsonify
import pandas as pd 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Flask 앱 생성
app = Flask(__name__)

# CSV 파일 로드
df = pd.read_csv('추천시스템/preprocessed_비타민.csv')

# 결측값 제거
df = df.dropna(subset=['기능성', '제품명'])

# 기능성과 제품명을 결합하여 하나의 텍스트 컬럼 생성
df['기능성_제품명'] = df['기능성'] + " " + df['제품명']

# TF-IDF 벡터화
tfidf = TfidfVectorizer()
tfidf_matrix = tfidf.fit_transform(df['기능성_제품명'])

# 코사인 유사도 계산
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# 추천 함수 정의
def recommend(keyword, limit=9):
    """키워드 기반 제품 추천"""
    # 🔹 키워드를 TF-IDF로 변환
    keyword_vec = tfidf.transform([keyword])

    # 🔹 키워드와 모든 제품 간 코사인 유사도 계산
    sim_scores = cosine_similarity(keyword_vec, tfidf_matrix)[0]

    # 🔹 유사도가 높은 상위 limit개 제품 가져오기
    top_indices = sim_scores.argsort()[-limit:][::-1]

    return df[['제품명']].iloc[top_indices]

# 추천 엔드포인트 추가
@app.route('/recommend', methods=['GET'])
def get_recommendations():
    keyword = request.args.get('keyword', '')  # 쿼리 파라미터로 키워드 받기
    if not keyword:
        return jsonify({"error": "No keyword provided"}), 400
    
    recommendations = recommend(keyword)
    return jsonify({"keyword": keyword, "recommendations": recommendations['제품명'].tolist()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
