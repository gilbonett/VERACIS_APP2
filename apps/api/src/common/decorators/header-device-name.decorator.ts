import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";

export const HeaderDeviceName = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    const deviceName = request.headers["x-device-name"] as string | undefined;

    if (typeof deviceName !== "string" || !deviceName.trim()) {
      throw new BadRequestException("Device name is required");
    }

    return deviceName as string;
  },
);
