from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="http://localhost:8000")  # Spring에서 접근 가능하도록 설정

# 간단한 추천 시스템 예제
recommendations = {
    "비타민 C": ["아스코르빈산", "레몬 추출물", "항산화제"],
    "비타민 D": ["콜레칼시페롤", "햇빛", "칼슘 흡수"],
    "오메가3": ["DHA", "EPA", "혈액순환 개선"]
}

@app.route('/recommend', methods=['GET'])
def recommend():
    keyword = request.args.get('keyword', '')  # React나 Spring에서 keyword 넘겨줌
    result = recommendations.get(keyword, ["추천 결과 없음"])
    return jsonify({"keyword": keyword, "recommendations": result})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
