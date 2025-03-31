package com.suppleit.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecommendationResponse {
  private String keyword; // 검색한 키워드
  private int count; // 추천 개수
  private List<String> recommendations; // 추천된 제품 리스트
}
