package com.mentorhub.dto.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentModelInfo {
    private int priority;
    private String name;
    private String agentCapability;
    private String toolCalling;
    private String speed;
    private String coding;
    private String multistepExecution;
    private String bestRole;
    private boolean active;
}
