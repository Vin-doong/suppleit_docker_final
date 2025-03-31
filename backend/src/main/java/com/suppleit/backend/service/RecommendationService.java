package com.suppleit.backend.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.suppleit.backend.dto.RecommendationResponse;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

  private final RestTemplate restTemplate;
  private final ExecutorService executorService = Executors.newFixedThreadPool(10);

  @Value("${flask.api.url}")
  private String flaskUrl;

  @Value("${naver.api.client-id}")
  private String clientId;

  @Value("${naver.api.client-secret}")
  private String clientSecret;

  private HttpHeaders createHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.set("X-Naver-Client-Id", clientId);
    headers.set("X-Naver-Client-Secret", clientSecret);
    return headers;
  }

  public List<String> getRecommendations(String keyword) {
    log.info("Fetching recommendations for keyword: {}", keyword);
    // 캐시 버스팅을 위한 타임스탬프 추가
    String timestamp = String.valueOf(System.currentTimeMillis());
    // Flask 서버의 recommend 엔드포인트로 요청
    URI uri = UriComponentsBuilder.fromUriString(flaskUrl + "/recommend")
        .queryParam("keyword", keyword)
        .queryParam("_", timestamp) // 캐시 버스팅 파라미터 추가
        .build()
        .encode() // 이 줄이 추가됨 - URI 인코딩 처리
        .toUri();
    try {
      log.debug("Calling Flask API with URI: {}", uri);
      ResponseEntity<RecommendationResponse> response = restTemplate.getForEntity(uri, RecommendationResponse.class);
      if (response.getBody() != null && response.getBody().getRecommendations() != null) {
        log.info("Received recommendations: {}", response.getBody().getRecommendations());
        return response.getBody().getRecommendations();
      } else {
        log.warn("No recommendations found for keyword: {}", keyword);
        return new ArrayList<>();
      }
    } catch (Exception e) {
      log.error("Error fetching recommendations from Flask API: {}", e.getMessage());
      return new ArrayList<>();
    }
  }

  @PreDestroy
  public void shutdown() {
    executorService.shutdown();
  }
}