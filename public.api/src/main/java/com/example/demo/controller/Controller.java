package com.example.demo.controller;

import com.example.demo.service.RetrieverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("/")
public class Controller {

    @Autowired
    RetrieverService retrieverService;

    @GetMapping("retriever")
    public String getDataFromRetriever() {
        return "Retriever says" + retrieverService.getFromExternalApi();
    }

    @GetMapping
    public String getData() {
        return "HI there! This is the API server";
    }
}