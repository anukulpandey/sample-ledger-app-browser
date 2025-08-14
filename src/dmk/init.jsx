import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";

export const dmk = new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .addTransport(webHidTransportFactory) // USB transport
    .addTransport(speculosTransportFactory("http://localhost:5050")) // Speculos transport
    .build();