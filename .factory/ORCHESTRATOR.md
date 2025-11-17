# Droid Orchestrator for nggk-tau-ini-apa

This project uses the Factory Droid Orchestrator system to manage specialist agents for development tasks.

## Quick Start

### For Users
To request a task using the orchestrator:
```
request: [describe your task]
```

The orchestrator will:
1. Analyze the task requirements
2. Select the best specialist droid(s)
3. Execute the task with parallel optimization
4. Return results with quality assurance

### For Developers
To understand how tasks are routed, see:
- `orchestrator-config.json` - Project configuration and specialist droid assignments
- `task-patterns.json` - Known task patterns and execution strategies
- `coordination-logic.md` - Detailed coordination principles and routing logic

## Project Tech Stack
- **Framework**: Express.js (ES Modules)
- **Database**: MySQL2
- **Authentication**: JWT + bcryptjs
- **File Handling**: Multer
- **Environment**: Dotenv

## Available Specialist Droids

- **backend-security-coder** - Security-focused backend development
- **database-optimizer** - Database performance and optimization
- **error-detective** - Error analysis and debugging
- **tdd-orchestrator** - Test-driven development coordination
- **devops-specialist** - Deployment and operations

## Task Patterns

The orchestrator recognizes these common task types:
- API Development
- Security Audit
- Database Optimization
- Authentication Implementation
- File Upload Handling
- Error Handling Improvement
- Test Suite Creation
- Performance Optimization

## Getting Help

To use the orchestrator for a specific task, describe what you want to accomplish, and the system will automatically select the appropriate specialist droids and execution strategy.
