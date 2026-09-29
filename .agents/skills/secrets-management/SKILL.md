---
name: secrets-management
description: >-
  Use this skill to environment variables, credentials, keys, secret handling. Do not use for other responsibilities.
---

# Secrets Management

## Execution Guidelines
1. **No Hardcoding**: Never hardcode credentials, API keys, or secrets in source code.
2. **.env Files**: Manage environment variables strictly. Differentiate between Development, Test, and Production configurations.
3. **Logging**: Strictly prohibit the logging of sensitive values, passwords, or tokens in application logs.
