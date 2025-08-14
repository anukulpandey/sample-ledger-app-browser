import { useState } from 'react'
import './App.css'
import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import {speculosTransportFactory} from "@ledgerhq/device-transport-kit-speculos";

function App() {
  const [availableDevices,setAvailableDevices] = useState([]);

  const dmk = new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .addTransport(webHidTransportFactory) // Transport is required! //this connects to the usb one
    .addTransport(speculosTransportFactory("http://localhost:5050"))
    .build();
  
  // lists available devices
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
    
    // Stop listening to available devices
    subscription.unsubscribe();
  }

  return (
    <>
    <div>
      Available Devices: {availableDevices.length}
    </div>
     <button onClick={async()=>await connectToDevice()}>Fetch Available Devices</button>
    </>
  )
}

export default App
