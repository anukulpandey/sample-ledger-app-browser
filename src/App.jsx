import { useState } from "react";
import "./App.css";
import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";

function App() {
  const [availableDevices, setAvailableDevices] = useState([]);

  const dmk = new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .addTransport(webHidTransportFactory) // USB transport
    .addTransport(speculosTransportFactory("http://localhost:5050")) // Speculos transport
    .build();

  async function connectToDevice() {
    const subscription = dmk.listenToAvailableDevices().subscribe({
      next: (devices) => {
        setAvailableDevices(devices);
        console.log("Available devices:", devices);
      },
      error: (error) => {
        console.error("Error:", error);
      },
      complete: () => {
        console.log("Completed");
      },
    });

    setTimeout(() => subscription.unsubscribe(), 500);
  }

  return (
    <div className="container">
      <h2>Available Devices: {availableDevices.length}</h2>

      <table className="devices-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {availableDevices.length > 0 ? (
            availableDevices.map((device, index) => (
              <tr key={index}>
                <td>{device.name || "Unknown"}</td>
                <td>{device.type || "N/A"}</td>
                <td>{device.id || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No devices found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="actions">
        <h3>Actions</h3>
        <button onClick={connectToDevice}>Fetch Available Devices</button>
      </div>
    </div>
  );
}

export default App;
