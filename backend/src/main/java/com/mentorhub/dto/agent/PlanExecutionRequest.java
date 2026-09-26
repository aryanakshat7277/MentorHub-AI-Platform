package com.mentorhub.dto.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanExecutionRequest {
    private String planId;
    private boolean authorized;
    private List<AgentActionDto> actions;
    private String userPrompt;
}
