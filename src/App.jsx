import { useEffect, useState } from "react";
import "./App.css";
import { dmk } from "./dmk/init";
import { CloseAppCommand, GetAppAndVersionCommand, GetOsVersionCommand } from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import {
  ApduBuilder,
  ApduParser,
  CommandUtils,
} from "@ledgerhq/device-management-kit";

function App() {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);

  async function refreshAvailableDevices() {
    const subscription = dmk.listenToAvailableDevices().subscribe({
      next: (devices) => {
        // Filter out devices that are already connected
        const connectedIds = connectedDevices.map((cd) => cd.id);
        const filtered = devices.filter((d) => !connectedIds.includes(d.id));

        setAvailableDevices(filtered);
        console.log("Available devices (filtered):", filtered);
      },
      error: (error) => {
        console.error("Error:", error);
      },
    });

    // Stop listening after a short delay to avoid constant polling
    setTimeout(() => subscription.unsubscribe(), 500);
  }

  const sendApduGetVersion = async (sessionId) => {
    const getVersionApduArgs = {
      cla: 0xE0,
      ins: 0x01,   // your command ID
      p1: 0x00,
      p2: 0x00,
      data: new Uint8Array([])
    };
    

    const apdu = new ApduBuilder(getVersionApduArgs).build();

    // Send the APDU to the device
    const apduResponse = await dmk.sendApdu({ sessionId, apdu });

    console.log("apduResponse===",apduResponse)


    // Parse the result
    const parser = new ApduParser(apduResponse);

    // Check if the command was successful
    if (!CommandUtils.isSuccessResponse(apduResponse)) {
      throw new Error(
        `Unexpected status word: ${parser.encodeToHexaString(
          apduResponse.statusCode,
        )}`,
      );
    }
  }

  const closeApp = async (sessionId) => {
    // Create the command to close the current app
    const command = new CloseAppCommand();

    // Send the command
    const response = await dmk.sendCommand({ sessionId, command });
    console.log("closeApp response ===", response);
  }

  const defineEtherSigner = async (sessionId) => {
    // Initialize an Ethereum signer instance using default context module
    const signerEth = new SignerEthBuilder({
      dmk,
      sessionId,
      originToken: "origin-token",
    }).build();

    console.log("signerEth===", signerEth)
  }

  const getAppAndVersion = async (sessionId) => {
    const command = new GetAppAndVersionCommand();

    // Send the command and get the response
    const response = await dmk.sendCommand({ sessionId, command });

    console.log(response.data);
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

      // Remove from available list
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

      // Remove from connected devices
      setConnectedDevices((prev) => prev.filter((d) => d.sessionId !== sessionId));
    } catch (error) {
      console.error("Disconnection error:", error);
    }
  }

  useEffect(() => {
    refreshAvailableDevices();
  }, [connectedDevices])

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
                      <button
                        className="monitor-btn"
                        onClick={() => monitorDeviceState(device.sessionId)}
                      >
                        Monitor
                      </button>
                      <button
                        className="normal-btn"
                        onClick={() => getAppAndVersion(device.sessionId)}
                      >
                        Get App info
                      </button>
                      <button
                        className="normal-btn"
                        onClick={() => sendApduGetVersion(device.sessionId)}
                      >
                        sendApduGetVersion
                      </button>
                      <button
                        className="normal-btn"
                        onClick={() => defineEtherSigner(device.sessionId)}
                      >
                        defineEtherSigner
                      </button>
                      <button
                        className="normal-btn"
                        onClick={() => closeApp(device.sessionId)}
                      >
                        Close App
                      </button>
                      <button
                        className="disconnect-btn"
                        onClick={() => disconnectDevice(device.sessionId)}
                      >
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
