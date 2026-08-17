package com.mentorhub.compiler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentorhub.compiler.dto.CodeExecutionRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CompilerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/v1/compiler/runtimes should return supported runtimes list")
    public void testGetRuntimes() throws Exception {
        mockMvc.perform(get("/api/v1/compiler/runtimes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].language").exists());
    }

    @Test
    @DisplayName("GET /api/v1/compiler/health should return health status object")
    public void testCheckHealth() throws Exception {
        mockMvc.perform(get("/api/v1/compiler/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("piston"));
    }

    @Test
    @DisplayName("POST /api/v1/compiler/execute should execute Python code with stdout")
    public void testExecutePythonCode() throws Exception {
        CodeExecutionRequest request = new CodeExecutionRequest(
                "python",
                "3.10.0",
                "print('Hello Akshat')",
                ""
        );

        mockMvc.perform(post("/api/v1/compiler/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.stdout").value("Hello Akshat\n"));
    }

    @Test
    @DisplayName("POST /api/v1/compiler/execute should return error response when code is empty")
    public void testExecuteEmptyCode() throws Exception {
        CodeExecutionRequest request = new CodeExecutionRequest("python", "3.10.0", "", "");

        mockMvc.perform(post("/api/v1/compiler/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value("EMPTY_CODE"));
    }
}
