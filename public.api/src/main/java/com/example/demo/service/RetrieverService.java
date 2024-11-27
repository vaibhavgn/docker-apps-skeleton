package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RetrieverService {

    @Value("${retriever.base-url}")
    public String RETRIEVER_URL;

    @Autowired
    private RestTemplate restTemplate;

    public String getFromExternalApi() {
        // Make a GET request to an external API
        String url = RETRIEVER_URL;
        System.out.println("Hitting URL" + url);
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        // Process the response
        if (response.getStatusCode().is2xxSuccessful()) {
            return response.getBody();
        } else {
            throw new RuntimeException("Failed to fetch data");
        }
    }
}
