package com.mentorhub.controller;

import com.mentorhub.compiler.dto.CodeExecutionRequest;
import com.mentorhub.compiler.dto.CodeExecutionResponse;
import com.mentorhub.compiler.dto.RuntimeResponse;
import com.mentorhub.compiler.service.CompilerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/compiler")
public class CompilerController {

    private final CompilerService compilerService;

    public CompilerController(CompilerService compilerService) {
        this.compilerService = compilerService;
    }

    @GetMapping("/runtimes")
    public ResponseEntity<List<RuntimeResponse>> getRuntimes() {
        return ResponseEntity.ok(compilerService.getRuntimes());
    }

    @PostMapping("/execute")
    public ResponseEntity<CodeExecutionResponse> executeCode(@RequestBody CodeExecutionRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        CodeExecutionResponse response = compilerService.executeCode(request, clientIp);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(compilerService.checkHealth());
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
