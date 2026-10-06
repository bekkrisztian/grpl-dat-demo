import { get, post, param, requestBody, HttpErrors } from "@loopback/rest";
// @ts-ignore
import { logInfo, logDebug, logWarn, logError } from "logger";

/**
 * Demo controller to showcase the logger module
 */
export class DemoLoggerController {
  constructor() {}

  /**
   * Simple health check endpoint with info logging
   */
  @get("/demo-logger/health", {
    responses: {
      "200": {
        description: "Health check response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string" },
                timestamp: { type: "string" },
              },
            },
          },
        },
      },
    },
  })
  async health(): Promise<{ status: string; timestamp: string }> {
    logInfo("Health check endpoint called");
    
    const response = {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
    
    logDebug("Health check response", response);
    
    return response;
  }

  /**
   * Echo endpoint that logs the message
   */
  @post("/demo-logger/echo", {
    responses: {
      "200": {
        description: "Echo response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string" },
                receivedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
  })
  async echo(
    @requestBody({
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["message"],
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    })
    body: { message: string }
  ): Promise<{ message: string; receivedAt: string }> {
    logInfo("Echo endpoint called", { message: body.message });
    
    if (!body.message || body.message.trim() === "") {
      logWarn("Empty message received in echo endpoint");
      throw new HttpErrors.BadRequest("Message cannot be empty");
    }
    
    const response = {
      message: body.message,
      receivedAt: new Date().toISOString(),
    };
    
    logDebug("Echo response", response);
    
    return response;
  }

  /**
   * Get user info by ID with logging
   */
  @get("/demo-logger/user/{id}", {
    responses: {
      "200": {
        description: "User information",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number("id") id: number
  ): Promise<{ id: number; name: string; email: string }> {
    logInfo("Get user endpoint called", { userId: id });
    
    if (id <= 0) {
      logError("Invalid user ID requested", { userId: id });
      throw new HttpErrors.BadRequest("User ID must be positive");
    }
    
    // Simulate user lookup
    const user = {
      id: id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
    };
    
    logDebug("User data retrieved", user);
    
    return user;
  }

  /**
   * Test error logging endpoint
   */
  @get("/demo-logger/test-error", {
    responses: {
      "500": {
        description: "Intentional error for testing",
      },
    },
  })
  async testError(): Promise<never> {
    logWarn("Test error endpoint called - this will throw an error");
    
    try {
      throw new Error("This is a test error");
    } catch (error) {
      logError("Test error caught and logged", error);
      throw new HttpErrors.InternalServerError("Test error thrown successfully");
    }
  }

  /**
   * Get logger statistics
   */
  @get("/demo-logger/stats", {
    responses: {
      "200": {
        description: "Logger module statistics",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                moduleName: { type: "string" },
                description: { type: "string" },
                availableFunctions: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  })
  async getStats(): Promise<{
    moduleName: string;
    description: string;
    availableFunctions: string[];
  }> {
    logInfo("Stats endpoint called");
    
    const stats = {
      moduleName: "logger",
      description: "Custom logging module for structured logging",
      availableFunctions: ["logInfo", "logDebug", "logWarn", "logError"],
    };
    
    logDebug("Returning logger stats", stats);
    
    return stats;
  }
}

