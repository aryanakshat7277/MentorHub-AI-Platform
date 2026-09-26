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
public class ExecutionResultDto {
    private String planId;
    private boolean success;
    private String executingModel;
    private int executingModelTier;
    private String executingModelRole;
    private List<AgentActionDto> executedActions;
    private String completionMessage;
    private String spokenSummary;
}
