package com.aiofitness.dto;

public record InquiryRequest(
        String packageName,
        String clientName,
        String clientEmail,
        String clientPhone,
        String goals,
        String questions
) {}
