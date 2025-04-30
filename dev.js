const { spawn } = require("child_process");
const path = require("path");

// Start Next.js dev server
const nextProcess = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
});

// Start Socket.io server
const socketProcess = spawn("npm", ["run", "socket"], {
  stdio: "inherit",
  shell: true,
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down servers...");
  nextProcess.kill("SIGINT");
  socketProcess.kill("SIGINT");
  process.exit(0);
});

console.log("Development servers started. Press Ctrl+C to stop.");
