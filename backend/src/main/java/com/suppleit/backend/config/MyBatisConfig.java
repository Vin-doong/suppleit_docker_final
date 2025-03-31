package com.suppleit.backend.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.type.EnumTypeHandler;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

@Configuration
@MapperScan(basePackages = "com.suppleit.backend.mapper")  // ✅ Mapper 인터페이스 스캔
public class MyBatisConfig {

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dataSource);

        // ✅ MyBatis ENUM 자동 매핑 핸들러 추가
        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);  // ✅ snake_case → camelCase 자동 변환
        configuration.getTypeHandlerRegistry().register(com.suppleit.backend.constants.MemberRole.class, EnumTypeHandler.class);

        sqlSessionFactoryBean.setConfiguration(configuration);

        // ✅ Mapper XML 파일 로드 (resources/mapper/ 디렉토리에서 XML 찾기)
        sqlSessionFactoryBean.setMapperLocations(
            new PathMatchingResourcePatternResolver().getResources("classpath:mapper/*.xml")
        );

        return sqlSessionFactoryBean.getObject();
    }
}
