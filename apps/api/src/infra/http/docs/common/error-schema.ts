export const errorSchema = (
  statusCode: number,
  message: string,
  error: string,
) => ({
  type: "object",
  properties: {
    statusCode: { type: "number", example: statusCode },
    message: { type: "string", example: message },
    error: { type: "string", example: error },
    timestamp: { type: "string", format: "date-time" },
    path: { type: "string", example: "/alerts" },
    requestId: { type: "string", format: "uuid" },
  },
});
