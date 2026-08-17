package com.mentorhub.compiler.dto;

public class CodeExecutionResponse {
    private boolean success;
    private String status; // SUCCESS, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, RATE_LIMIT_EXCEEDED, NETWORK_ERROR, SERVICE_UNAVAILABLE
    private String language;
    private String version;
    private String stdout;
    private String stderr;
    private String compileOutput;
    private Integer exitCode;
    private String signal;
    private Long executionTime;

    public CodeExecutionResponse() {}

    public static CodeExecutionResponse ok(String language, String version, String stdout, String stderr, Integer exitCode, Long executionTime) {
        CodeExecutionResponse resp = new CodeExecutionResponse();
        resp.setSuccess(true);
        resp.setStatus("SUCCESS");
        resp.setLanguage(language);
        resp.setVersion(version);
        resp.setStdout(stdout != null ? stdout : "");
        resp.setStderr(stderr != null ? stderr : "");
        resp.setCompileOutput("");
        resp.setExitCode(exitCode != null ? exitCode : 0);
        resp.setExecutionTime(executionTime);
        return resp;
    }

    public static CodeExecutionResponse error(String status, String language, String version, String stdout, String stderr, String compileOutput, Integer exitCode) {
        CodeExecutionResponse resp = new CodeExecutionResponse();
        resp.setSuccess(false);
        resp.setStatus(status);
        resp.setLanguage(language);
        resp.setVersion(version);
        resp.setStdout(stdout != null ? stdout : "");
        resp.setStderr(stderr != null ? stderr : "");
        resp.setCompileOutput(compileOutput != null ? compileOutput : "");
        resp.setExitCode(exitCode != null ? exitCode : 1);
        return resp;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getStdout() { return stdout; }
    public void setStdout(String stdout) { this.stdout = stdout; }

    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }

    public String getCompileOutput() { return compileOutput; }
    public void setCompileOutput(String compileOutput) { this.compileOutput = compileOutput; }

    public Integer getExitCode() { return exitCode; }
    public void setExitCode(Integer exitCode) { this.exitCode = exitCode; }

    public String getSignal() { return signal; }
    public void setSignal(String signal) { this.signal = signal; }

    public Long getExecutionTime() { return executionTime; }
    public void setExecutionTime(Long executionTime) { this.executionTime = executionTime; }
}
