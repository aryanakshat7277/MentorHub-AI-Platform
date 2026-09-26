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
public class ActionPlanDto {
    private String planId;
    private String userPrompt;
    private String taskSummary;
    private boolean requiresPermission;
    private String riskLevel; // LOW, NORMAL, ELEVATED
    private String assignedModel;
    private int assignedModelTier;
    private String modelRole;
    private String permissionPrompt;
    private List<AgentActionDto> actions;
    private String naturalResponse;
}
