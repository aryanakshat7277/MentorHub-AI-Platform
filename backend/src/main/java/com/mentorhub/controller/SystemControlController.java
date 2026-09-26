package com.mentorhub.controller;

import com.mentorhub.dto.agent.ActionPlanDto;
import com.mentorhub.dto.agent.AgentModelInfo;
import com.mentorhub.dto.agent.ExecutionResultDto;
import com.mentorhub.dto.agent.PlanExecutionRequest;
import com.mentorhub.service.SystemControlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
public class SystemControlController {

    private final SystemControlService systemControlService;

    public SystemControlController(SystemControlService systemControlService) {
        this.systemControlService = systemControlService;
    }

    /**
     * Get the 6-tier prioritized models table with capabilities and ratings
     */
    @GetMapping("/models")
    public ResponseEntity<List<AgentModelInfo>> getPrioritizedModels() {
        return ResponseEntity.ok(systemControlService.getPrioritizedModels());
    }

    /**
     * Plan a task: evaluates intent, checks if OS/browser control is requested,
     * builds action steps and requires user permission before any control execution.
     */
    @PostMapping("/plan")
    public ResponseEntity<ActionPlanDto> planTask(@RequestBody Map<String, String> request) {
        String prompt = request.getOrDefault("prompt", "");
        String screenContext = request.getOrDefault("screenContext", "");
        ActionPlanDto plan = systemControlService.planTask(prompt, screenContext);
        return ResponseEntity.ok(plan);
    }

    /**
     * Executes an authorized plan once the user explicitly grants permission in chat or live voice.
     */
    @PostMapping("/execute")
    public ResponseEntity<ExecutionResultDto> executePlan(@RequestBody PlanExecutionRequest request) {
        ExecutionResultDto result = systemControlService.executePlan(request);
        return ResponseEntity.ok(result);
    }
}
