# Videoactive Project

This repository contains two primary components:

1. **`videoactive-client`**: Front-end React application for Video Chat.
2. **`videoactive-server`**: ASP.NET Core backend server.

## Folder Structure

```
videoactive/
├── videoactive-client/  (Frontend React application)
├── videoactive-server/  (Backend ASP.NET Core application)
└── docker-compose.yml   (Docker compose file for local and EC2 deployment)
```

---

## videoactive-client

**Description**: Frontend React application for Video Chat.

### Setup Instructions

Create a `.env` file at the project root (`videoactive-client/.env`):

```
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_WEBSOCKET_URL=ws://localhost:5000
```

### Frontend Structure

- Main entry is at `page.js`.
- API interactions are managed through `services/api.js`.
- Backend API endpoints are located in:
  - `api/auth`
  - `api/user`

---

## videoactive-server

**Description**: Backend server built using ASP.NET Core MVC.

### Setup Notes

- **`Program.cs`** is configured for JWT and Google Authentication.
- **`appsettings.json`** contains the client ID and secret key (update with your own credentials).

### Controllers

- **`AuthController`** handles login logic from the frontend (avoid modification unless necessary).
- **`UserController`** manages:
  - **GET** user data.
  - **POST** user profile pictures and returns updated user data.

### Admin Account Setup

Admin accounts must be added directly to the database:

- Default password: `admin`
- Default password hash: `$2a$11$UfAB7f59DoThaBi21SXRd.guYyM66M5Ogot41JzGJBvj6UVKqo4j2`
- Set `IsDefaultPassword` to `true` to prompt admin to change password upon login.

---

## Deployment Flow

### Local Development

After changing your code locally:

```bash
docker-compose build

docker push kc012/videoactive-client:latest
docker push kc012/videoactive-server:latest
```

### EC2 Deployment

SSH into your EC2 instance, then:

```bash
cd ~/videoactive

docker-compose pull

docker-compose up -d

docker ps
```

Ensure Docker and Docker Compose are properly installed and configured on your EC2 instance.


### Database Command
dotnet ef migrations add InitialCreate
dotnet ef database update

