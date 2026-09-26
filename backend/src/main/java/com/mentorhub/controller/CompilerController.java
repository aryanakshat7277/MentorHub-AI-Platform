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
@RequestMapping({"/api/compiler", "/api/v1/compiler"})
public class CompilerController {

    private final CompilerService compilerService;
    private final com.mentorhub.compiler.service.CodeCopilotService copilotService;

    public CompilerController(CompilerService compilerService, com.mentorhub.compiler.service.CodeCopilotService copilotService) {
        this.compilerService = compilerService;
        this.copilotService = copilotService;
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

    @PostMapping("/autocomplete")
    public ResponseEntity<com.mentorhub.compiler.dto.CodeCompletionResponse> autocomplete(
            @RequestBody com.mentorhub.compiler.dto.CodeCompletionRequest request) {
        return ResponseEntity.ok(copilotService.completeCode(request));
    }

    @PostMapping("/autofix")
    public ResponseEntity<com.mentorhub.compiler.dto.CodeAutoFixResponse> autoFix(
            @RequestBody com.mentorhub.compiler.dto.CodeAutoFixRequest request) {
        return ResponseEntity.ok(copilotService.autoFixCode(request));
    }

    @PostMapping("/transpile")
    public ResponseEntity<com.mentorhub.compiler.dto.CodeTranspileResponse> transpile(
            @RequestBody com.mentorhub.compiler.dto.CodeTranspileRequest request) {
        return ResponseEntity.ok(copilotService.transpileCode(request));
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
