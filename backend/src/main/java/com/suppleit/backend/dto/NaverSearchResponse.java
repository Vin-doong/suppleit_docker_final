package com.suppleit.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class NaverSearchResponse {
  private List<ProductResponse> items; // 네이버 API가 반환하는 'items' 배열
}
