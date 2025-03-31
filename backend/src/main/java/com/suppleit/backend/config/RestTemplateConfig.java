package com.suppleit.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1000); // 10초 연결 타임아웃
        factory.setReadTimeout(15000);   // 15초 읽기 타임아웃
        
        // BufferingClientHttpRequestFactory로 래핑하여 응답을 여러 번 읽을 수 있도록 함
        BufferingClientHttpRequestFactory bufferingFactory = new BufferingClientHttpRequestFactory(factory);
        
        return new RestTemplate(bufferingFactory);
    }
}