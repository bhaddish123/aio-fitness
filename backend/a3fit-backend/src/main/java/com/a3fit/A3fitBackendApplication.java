package com.a3fit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class A3fitBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(A3fitBackendApplication.class, args);
	}

}
