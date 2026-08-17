package com.mentorhub.compiler.exception;

import com.mentorhub.compiler.dto.CodeExecutionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class CompilerExceptionHandler {

    @ExceptionHandler(CompilerException.class)
    public ResponseEntity<CodeExecutionResponse> handleCompilerException(CompilerException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode());
        if (status == null) status = HttpStatus.BAD_REQUEST;

        CodeExecutionResponse response = CodeExecutionResponse.error(
                ex.getStatus(),
                "unknown",
                "*",
                "",
                ex.getMessage(),
                "",
                1
        );
        return new ResponseEntity<>(response, status);
    }
}
