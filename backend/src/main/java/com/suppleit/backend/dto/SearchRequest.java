package com.suppleit.backend.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SearchRequest {
  private List<String> products; // 제품 리스트

  public SearchRequest() {
  } // 기본 생성자

  public SearchRequest(List<String> products) { // 생성자
    this.products = products;
  }
}