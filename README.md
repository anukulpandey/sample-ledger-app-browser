# Ledger Sample App

- Connects to Speculos
- Connects to HID

To discover HID - `startDiscovering`

right now i am using 

```
dmk.listenToAvailableDevices();
```

This lists all devices which are available from dmk initialised like this

```
  const dmk = new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .addTransport(webHidTransportFactory) // USB transport
    .addTransport(speculosTransportFactory("http://localhost:40000")) // Speculos transport
    .build();
```

Run command for Speculor 

```
docker run --rm -it \
  -v /Users/anukul/Desktop/speculos:/app \
  -p 5050:5000 \
  ghcr.io/ledgerhq/speculos \
  --model nanox \
  --display headless \
  --api-port 5000 \
  /app/app.elf
```