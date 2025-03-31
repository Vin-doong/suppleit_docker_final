package com.suppleit.backend.dto;

public class ProductResponse {
  private String title;
  private String link;
  private String image;
  private int price;
  private String category;
  private boolean isDummy;

  // 모든 필드를 포함하는 새 생성자
  public ProductResponse(String title, String link, String image, int price, String category, boolean isDummy) {
    this.title = title;
    this.link = link;
    this.image = image;
    this.price = price;
    this.category = category;
    this.isDummy = isDummy;
  }

  // 기존 생성자 - 카테고리만 포함 (isDummy는 기본값 false)
  public ProductResponse(String title, String link, String image, int price, String category) {
    this(title, link, image, price, category, false);
  }

  // 기존 생성자 - isDummy만 포함 (카테고리는 기본값 빈 문자열)
  public ProductResponse(String title, String link, String image, int price, boolean isDummy) {
    this(title, link, image, price, "", isDummy);
  }

  // Getter와 Setter 메소드는 그대로 유지
  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getLink() {
    return link;
  }

  public void setLink(String link) {
    this.link = link;
  }

  public String getImage() {
    return image;
  }

  public void setImage(String image) {
    this.image = image;
  }

  public int getPrice() {
    return price;
  }

  public void setPrice(int price) {
    this.price = price;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public boolean isDummy() {
    return isDummy;
  }

  public void setDummy(boolean dummy) {
    isDummy = dummy;
  }
}