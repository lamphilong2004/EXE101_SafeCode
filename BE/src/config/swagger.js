import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SafeCode API Documentation",
      version: "1.0.0",
      description: "Tài liệu API chính thức cho SafeCode (Cryptosync) - Giao thức chuyển giao mã nguồn an toàn.",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Local Development Server",
      },
      {
        url: "https://exe101-safecode.onrender.com",
        description: "Production Server (Render)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Nhập token JWT nhận được từ API đăng nhập dưới dạng: Bearer <token>",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Quét các file router để tự động tạo documentation
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
