### Eudoxie Editor - Real-time Collaborative Document Editor

Eudoxie Editor is a powerful real-time collaborative document editing platform that enables multiple users to work on the same document simultaneously. This application provides a seamless editing experience with rich text formatting, version history, and user management features.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Future Improvements](#future-improvements)
- [Contributors](#contributors)
- [License](#license)

## Features

- **Real-time Collaboration**: Multiple users can edit documents simultaneously with changes reflected in real-time
- **Rich Text Editing**: Full-featured text editor with formatting options (bold, italic, headings, lists, etc.)
- **Document Management**: Create, edit, delete, and organize documents
- **Version History**: Track changes and revert to previous versions of documents
- **User Authentication**: Secure user authentication and authorization using Clerk
- **Document Sharing**: Share documents with other users and manage access permissions
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technologies

### Frontend

- **Next.js 15**: React framework for server-side rendering and static site generation
- **React 19**: JavaScript library for building user interfaces
- **TypeScript**: Typed JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI components
- **Lexical Editor**: Facebook's extensible text editor framework
- **Socket.io Client**: Real-time bidirectional event-based communication

### Backend

- **Next.js API Routes**: Server-side API endpoints
- **Socket.io Server**: WebSocket server for real-time communication
- **Clerk**: Authentication and user management
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **PostgreSQL**: Relational database for data storage
- **Neon**: Serverless PostgreSQL database service

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- PostgreSQL (v14.0 or higher) or a Neon account

## Installation

1. Clone the repository:

```shellscript
git clone https://github.com/pasternak-karmel/google-clone-.git
cd google-clone
```

2. Install dependencies:

```shellscript
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section)
4. Set up the database:

```shellscript
npm run db:push
```

5. Start the development servers:

```shellscript
npm run dev:all
```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```plaintext
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/eudoxie_editor

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Project Structure

```plaintext
eudoxie-editor/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── documents/          # Document pages
│   ├── profile/            # User profile page
│   ├── settings/           # Settings page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── ui/                 # UI components (shadcn/ui)
│   ├── editor/             # Editor components
│   └── ...                 # Other components
├── context/                # React context providers
├── db/                     # Database configuration
│   ├── migrations/         # Database migrations
│   ├── index.ts            # Database connection
│   └── schema.ts           # Database schema
├── lib/                    # Utility functions and shared code
│   ├── documents.ts        # Document-related functions
│   ├── users.ts            # User-related functions
│   └── utils.ts            # General utilities
├── nodes/                  # Custom Lexical editor nodes
├── public/                 # Static files
├── server.ts               # Socket.io server
├── middleware.ts           # Next.js middleware
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and scripts
```

## Usage

### Running the Application

For development:

```shellscript
# Run both Next.js and Socket.io servers
npm run dev:all

# Or run them separately
npm run dev        # Next.js server
npm run socket     # Socket.io server
```

For production:

```shellscript
npm run build
npm run start
```

### Database Management

```shellscript
# Push schema changes to the database
npm run db:push

# Open Drizzle Studio to manage database
npm run db:studio
```

## API Documentation

### Documents API

- `GET /api/documents` - Get all documents for the current user
- `POST /api/documents` - Create a new document
- `GET /api/documents/:id` - Get a specific document
- `PUT /api/documents/:id` - Update a document
- `DELETE /api/documents/:id` - Delete a document
- `POST /api/documents/:id/share` - Share a document with another user
- `GET /api/documents/:id/versions` - Get document version history
- `POST /api/documents/:id/versions` - Revert to a previous version

### Socket.io Events

- `join-document` - Join a document's collaboration session
- `leave-document` - Leave a document's collaboration session
- `document-change` - Send document changes to other users
- `user-joined` - Notifies when a user joins the document
- `user-left` - Notifies when a user leaves the document
- `active-users` - Provides a list of active users in the document

## Contributing

We welcome contributions to Eudoxie Editor! Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Coding Standards

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for any new features

## Future Improvements

- **Offline Support**: Enable editing documents offline with synchronization when back online
- **Comments and Annotations**: Allow users to add comments and annotations to documents
- **Advanced Permissions**: More granular access control (view, comment, edit)
- **Templates**: Pre-designed document templates for common use cases
- **File Attachments**: Support for attaching files to documents
- **Mobile App**: Native mobile applications for iOS and Android
- **AI-Powered Features**: Smart suggestions, grammar checking, and content generation
- **Export Options**: Export documents to various formats (PDF, DOCX, HTML)
- **Integrations**: Connect with other productivity tools and services

## Contributors

- **Karmel AVENON** - Lead Developer - [GitHub Profile](https://github.com/pasternak-karmel)
- **Eudoxie** - Project Organizer

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```plaintext
MIT License

Copyright (c) 2023 Eudoxie Editor Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
