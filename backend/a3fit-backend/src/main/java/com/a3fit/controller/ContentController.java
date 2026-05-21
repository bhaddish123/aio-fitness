package com.a3fit.controller;

import com.a3fit.model.SiteContent;
import com.a3fit.repository.SiteContentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class ContentController {

    private final SiteContentRepository contentRepository;

    public ContentController(SiteContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    /** GET /content — public, returns all content as { key: value } */
    @GetMapping("/content")
    public ResponseEntity<Map<String, String>> getAllContent() {
        Map<String, String> content = contentRepository.findAll()
                .stream()
                .collect(Collectors.toMap(SiteContent::getKey, SiteContent::getValue));
        return ResponseEntity.ok(content);
    }

    /** PUT /admin/content/{key} — admin only, body: { "value": "..." } */
    @PutMapping("/admin/content/{key}")
    public ResponseEntity<SiteContent> updateContent(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {

        String value = body.get("value");
        if (value == null) return ResponseEntity.badRequest().build();

        SiteContent item = contentRepository.findById(key)
                .orElse(new SiteContent(key, value));
        item.setValue(value);
        item.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(contentRepository.save(item));
    }

    /** DELETE /admin/content/{key} — admin only, removes a content entry */
    @DeleteMapping("/admin/content/{key}")
    public ResponseEntity<Void> deleteContent(@PathVariable String key) {
        contentRepository.findById(key).ifPresent(contentRepository::delete);
        return ResponseEntity.noContent().build();
    }
}
