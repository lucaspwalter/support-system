package com.lucaspwalter.support;

import com.lucaspwalter.support.repository.AgentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

@SpringBootApplication
public class SupportApplication {

    public static void main(String[] args) {
        SpringApplication.run(SupportApplication.class, args);
    }

    @Bean
    CommandLineRunner seedAgents(AgentRepository agentRepository, DataSource dataSource) {
        return args -> {
            if (agentRepository.count() == 0) {
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("db/seed/seed.sql"));
                populator.execute(dataSource);
            }
        };
    }
}
