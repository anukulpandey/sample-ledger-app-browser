import { useState } from "react";
import "./App.css";
import { dmk } from "./dmk/init";

function App() {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);

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

    // Stop listening after a short delay to avoid constant polling
    setTimeout(() => subscription.unsubscribe(), 500);
  }

  function monitorDeviceState(sessionId) {
    return dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: (state) => {
        console.log(`Device status: ${state.deviceStatus}`);

        if (state.deviceStatus === "LOCKED") {
          console.log("Device is locked - please enter your PIN");
        }

        if (state.batteryStatus) {
          console.log(`Battery level: ${state.batteryStatus.level}%`);
        }

        if (state.currentApp) {
          console.log(`Current app: ${state.currentApp.name}`);
          console.log(`App version: ${state.currentApp.version}`);
        }

        console.log(`Device model: ${state.deviceModelId}`);
      },
      error: (error) => {
        console.error("State monitoring error:", error);
      },
    });
  }

  async function connectToDevice(device) {
    try {
      console.log("Connecting to", device);
      const sessionId = await dmk.connect({ device });
      console.log(`Connected! Session ID: ${sessionId}`);

      const connectedDevice = dmk.getConnectedDevice({ sessionId });
      console.log(`Device name: ${connectedDevice.name}`);
      console.log(`Device model: ${connectedDevice.modelId}`);

      // Attach the sessionId so we can use it later for monitoring
      setConnectedDevices((prev) => [
        ...prev,
        { ...connectedDevice, sessionId }
      ]);

      setAvailableDevices((prev) => prev.filter((d) => d.id !== device.id));
      return sessionId;
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }

  async function disconnectDevice(sessionId) {
    try {
      await dmk.disconnect({ sessionId });
      console.log("Device disconnected successfully");
    } catch (error) {
      console.error("Disconnection error:", error);
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {connectedDevices.length > 0 ? (
              connectedDevices.map((device, index) => (
                <tr key={`connected-${index}`}>
                  <td>{device.name || "Unknown"}</td>
                  <td>{device.type || "N/A"}</td>
                  <td>{device.id || "N/A"}</td>
                  <td>
                    <div>
                    <button className="monitor-btn" onClick={() => monitorDeviceState(device.sessionId)}>
                      Monitor
                    </button>

                    <button className="disconnect-btn" onClick={() => disconnectDevice(device.sessionId)}>
                      Disconnect
                    </button>
                    </div>
                    
                  </td>
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
