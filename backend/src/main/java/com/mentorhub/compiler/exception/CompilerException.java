package com.mentorhub.compiler.exception;

public class CompilerException extends RuntimeException {
    private final String status;
    private final int statusCode;

    public CompilerException(String message, String status, int statusCode) {
        super(message);
        this.status = status;
        this.statusCode = statusCode;
    }

    public String getStatus() { return status; }
    public int getStatusCode() { return statusCode; }
}
