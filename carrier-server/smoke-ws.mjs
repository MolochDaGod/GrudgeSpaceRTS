import WebSocket from "ws";

const url = process.argv[2] ?? "wss://carrier-production-4e12.up.railway.app/api/engagement";
const ws = new WebSocket(url);

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "join",
      roomId: "smoke-test",
      grudgeId: "smoke",
      displayName: "SmokeTest",
    }),
  );
});

ws.on("message", (data) => {
  console.log(data.toString());
  ws.close();
  process.exit(0);
});

ws.on("error", (err) => {
  console.error(err.message);
  process.exit(1);
});

setTimeout(() => process.exit(2), 10000);