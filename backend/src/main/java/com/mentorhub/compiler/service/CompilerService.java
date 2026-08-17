package com.mentorhub.compiler.service;

import com.mentorhub.compiler.dto.CodeExecutionRequest;
import com.mentorhub.compiler.dto.CodeExecutionResponse;
import com.mentorhub.compiler.dto.RuntimeResponse;

import java.util.List;
import java.util.Map;

public interface CompilerService {
    List<RuntimeResponse> getRuntimes();
    CodeExecutionResponse executeCode(CodeExecutionRequest request, String clientIp);
    Map<String, Object> checkHealth();
}
