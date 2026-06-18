import swaggerJSDoc from "swagger-jsdoc";
import type { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FlowForge API",
      version: "1.0.0",
      description: "Enterprise project management and task tracking API",
      contact: {
        name: "FlowForge Team",
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || "http://localhost:5001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Tasks", description: "Task management endpoints" },
      { name: "Projects", description: "Project management endpoints" },
      { name: "Users", description: "User management endpoints" },
      { name: "Activities", description: "Activity logging endpoints" },
      { name: "Health", description: "Health check endpoints" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
