package com.team.retriever.svc.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("/")
public class Controller {

    @GetMapping
    public String getDefault() {
        return "HI there. This is the retriever app!";
    }

    @GetMapping("data")
    public String getData() {
        return "Thanks for reaching out and HI from retriever app!";
    }

}
