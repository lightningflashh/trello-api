# Trello MERN Stack API

This repository contains the backend API for a Trello-style project management application built with Node.js and Express. It handles user authentication, board management, columns, cards, invitations, Cloudinary uploads, and Socket.IO real-time notifications.

## Features

- User registration with email verification
- Login, logout, refresh token flow, and JWT-based authorization
- Cookie-based authentication with secure session tokens
- Board creation, listing, details, update, and pagination/filtering
- Column creation, update, and deletion
- Card creation, update, comments, member management, and cover image upload
- Board invitations with accept/reject workflow
- Real-time invite notifications through Socket.IO
- MongoDB persistence using the native MongoDB Node.js driver
- Input validation with Joi
- File uploads through Multer and Cloudinary

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT (jsonwebtoken)
- Joi
- bcryptjs
- Cloudinary
- MailerSend
- Multer
- CORS
- cookie-parser
- dotenv
- Babel
- ESLint
- Nodemon

## Project Structure

```text
.
├── .babelrc
├── .env.example
├── .eslintrc.cjs
├── jsconfig.json
├── package.json
├── src/
│   ├── config/
│   │   ├── cors.js
│   │   ├── environment.js
│   │   └── mongodb.js
│   ├── controllers/
│   │   ├── boardController.js
│   │   ├── cardController.js
│   │   ├── columnController.js
│   │   ├── invitationController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorHandlingMiddleware.js
│   │   └── multerUploadMiddleware.js
│   ├── models/
│   │   ├── boardModel.js
│   │   ├── cardModel.js
│   │   ├── columnModel.js
│   │   ├── invitationModel.js
│   │   └── userModel.js
│   ├── providers/
│   │   ├── CloudinaryProvider.js
│   │   ├── JwtProvider.js
│   │   ├── MailerSendProvider.js
│   │   └── ResendProvider.js
│   ├── routes/
│   │   └── v1/
│   │       ├── boardRoute.js
│   │       ├── cardRoute.js
│   │       ├── columnRoute.js
│   │       ├── index.js
│   │       ├── invitationRoute.js
│   │       └── userRoute.js
│   ├── services/
│   │   ├── boardService.js
│   │   ├── cardService.js
│   │   ├── columnService.js
│   │   ├── invitationService.js
│   │   └── userService.js
│   ├── sockets/
│   │   └── inviteUserToBoardSocket.js
│   ├── utils/
│   │   ├── algorithms.js
│   │   ├── ApiError.js
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── sorts.js
│   │   └── validators.js
│   ├── validations/
│   │   ├── boardValidation.js
│   │   ├── cardValidation.js
│   │   ├── columnValidation.js
│   │   ├── invitationValidation.js
│   │   └── userValidation.js
│   ├── server.js
│   └── ...
└── .github/
    └── copilot-instructions.md
```

## API Endpoints

The app exposes the routes under `/v1`.

### Health Check

- `GET /v1/status`

### User Routes

- `POST /v1/users/register`
- `PUT /v1/users/verify`
- `POST /v1/users/login`
- `DELETE /v1/users/logout`
- `GET /v1/users/refresh_token`
- `PUT /v1/users/update`

### Board Routes

- `GET /v1/boards`
- `POST /v1/boards`
- `GET /v1/boards/:id`
- `PUT /v1/boards/:id`
- `PUT /v1/boards/supports/moving_card`

### Column Routes

- `POST /v1/columns`
- `PUT /v1/columns/:id`
- `DELETE /v1/columns/:id`

### Card Routes

- `POST /v1/cards`
- `PUT /v1/cards/:id`

### Invitation Routes

- `GET /v1/invitations`
- `POST /v1/invitations/board`
- `PUT /v1/invitations/board/:invitationId`

## Authentication and Authorization

Authentication is performed by validating the JWT access token from the request cookie. The middleware in `src/middlewares/authMiddleware.js` checks `accessToken`, verifies it with the configured secret, and attaches the decoded payload to the request before continuing.

The app also supports refresh tokens via `GET /v1/users/refresh_token` and issues new access tokens when the refresh token is valid.

## Database and Persistence

The project connects to MongoDB using the native driver configured in `src/config/mongodb.js`. Models under `src/models/` use collections such as:

- `boards`
- `columns`
- `cards`
- `users`
- `invitations`

## File Uploads and External Services

The application uses:

- `Multer` for multipart file uploads
- `Cloudinary` for storing uploaded images such as user avatars and card covers
- `MailerSend` to send email verification messages
- `Socket.IO` to broadcast board invitation events to clients

## Environment Variables

The project expects environment variables defined in `.env` (based on `.env.example`):

```env
MONGODB_URI=''
DATABASE_NAME=''
LOCAL_DEV_APP_HOST=''
LOCAL_DEV_APP_PORT=
AUTHOR=''
WEBSITE_DOMAIN_DEVELOPMENT=''
WEBSITE_DOMAIN_PRODUCTION=''
MAILER_SEND_API_KEY=''
ADMIN_SENDER_EMAIL=''
ADMIN_SENDER_NAME=''

ACCESS_TOKEN_SECRET_SIGNATURE=''
ACCESS_TOKEN_LIFE='1h'

REFRESH_TOKEN_SECRET_SIGNATURE=''
REFRESH_TOKEN_LIFE='14 days'

CLOUDINARY_CLOUD_NAME=''
CLOUDINARY_API_KEY=''
CLOUDINARY_API_SECRET=''
```

## Running the Project

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from `.env.example`:

```bash
copy .env.example .env
```

3. Fill in the required environment variables.

4. Start the application in development mode:

```bash
npm run dev
```

This starts the server with Babel and nodemon using the development configuration from `src/server.js`.

For production builds, the project includes:

```bash
npm run build
npm run production
```

## Notes

This project is a backend-focused API and does not include a frontend application in the repository. The application is designed around Trello-like board operations and team collaboration workflows, with MongoDB-backed persistence and JWT-based access control.
