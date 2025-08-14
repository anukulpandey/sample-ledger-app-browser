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
  const [connectedDevices, setConnectedDevices] = useState([]);

  const dmk = new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .addTransport(webHidTransportFactory) // USB transport
    .addTransport(speculosTransportFactory("http://localhost:5050")) // Speculos transport
    .build();

  async function refreshAvailableDevices() {
    const subscription = dmk.listenToAvailableDevices().subscribe({
      next: (devices) => {
        setAvailableDevices(devices);
        console.log("Available devices:", devices);
      },
      error: (error) => {
        console.error("Error:", error);
      },
    });

    setTimeout(() => subscription.unsubscribe(), 500);
  }

  async function connectToDevice(device) {
    try {
      const sessionId = await dmk.connect({ device });
      console.log(`Connected! Session ID: ${sessionId}`);

      const connectedDevice = dmk.getConnectedDevice({ sessionId });
      console.log(`Device name: ${connectedDevice.name}`);
      console.log(`Device model: ${connectedDevice.modelId}`);

      setConnectedDevices((prev) => [...prev, connectedDevice]);
      setAvailableDevices((prev) => prev.filter((d) => d.id !== device.id));

      return sessionId;
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }

  return (
    <div className="container">
      <h2>Ledger Device Manager</h2>

      {/* Available Devices Table */}
      <div className="table-section">
        <div className="table-header">
          <h3>Available Devices ({availableDevices.length})</h3>
          <button onClick={refreshAvailableDevices}>Refresh</button>
        </div>
        <table className="devices-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {availableDevices.length > 0 ? (
              availableDevices.map((device, index) => (
                <tr key={`available-${index}`}>
                  <td>{device.name || "Unknown"}</td>
                  <td>{device.type || "N/A"}</td>
                  <td>{device.id || "N/A"}</td>
                  <td>
                    <button onClick={() => connectToDevice(device)}>
                      Connect
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No available devices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Connected Devices Table */}
      <div className="table-section">
        <div className="table-header">
          <h3>Connected Devices ({connectedDevices.length})</h3>
        </div>
        <table className="devices-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {connectedDevices.length > 0 ? (
              connectedDevices.map((device, index) => (
                <tr key={`connected-${index}`}>
                  <td>{device.name || "Unknown"}</td>
                  <td>{device.type || "N/A"}</td>
                  <td>{device.id || "N/A"}</td>
                  <td>Connected</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No connected devices</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
