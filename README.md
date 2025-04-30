### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up the database:
   \`\`\`bash
   npm run db:push
   \`\`\`
4. Start both the Next.js and Socket.io servers with a single command:
   \`\`\`bash
   npm run dev:all
   \`\`\`

Alternatively, you can start the servers separately:
   \`\`\`bash
   # In one terminal
   npm run dev
   
   # In another terminal
   npm run socket
