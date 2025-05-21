# Call Of Duty

Project for managing duties and soldiers. 
The project does basic operations like creating/deleting/changing new soldier/duty, schedule/cancel duty and more.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Routes](#api-routes)

## Installation

To install the project, you need to clone the repository:

```bash
git clone https://github.com/TamirOffen/CallOfDuty.git
```

After you clone the project, run npm install to get all the node modules

```bash
npm install
```

## Usage

To run the project follow the next steps :
    1. execute the command below to start the server
    ```
    npm run start
    ```
    2. use postman/browser to create http requests. All project routes are mentioned below:
       [Health routes](src/routes/health-routes.js)
       [Soldier routes](src/routes/soldier-routes.js)
       [Duty routes](src/routes/duty-routes.js)
       [Justice board routes](src/routes/justice-board-route.js)
    3. ctrl+c to stop the server

## Configuration

To configure the project, follow these steps:

**Environment Variables**: Set the following environment variables in your development or testing environment:
   - `SERVER_PORT` = 3000 --> the port that the app listens to
   - `DB_URI` = `mongodb://localhost:27017/` --> mongodb uri
   - `DB_NAME` = `callofdutydb` --> The database name

## API Routes

### Health Routes (`/health`)
- `GET /health` - Check server status
- `GET /health/db` - Check database connection status

### Soldier Routes (`/soldiers`)
- `POST /soldiers` - Create a new soldier
- `GET /soldiers/:id` - Get soldier by ID (7-digit format)
- `GET /soldiers` - Search soldiers by query parameters (name, rank, limitations)
- `PATCH /soldiers/:id` - Update soldier information
- `DELETE /soldiers/:id` - Delete a soldier
- `PUT /soldiers/:id/limitations` - Add limitations to a soldier

### Duty Routes (`/duties`)
- `POST /duties` - Create a new duty
- `GET /duties/:id` - Get duty by ID (24-character ObjectId)
- `GET /duties` - Search duties by query parameters (constraints, location, etc.)
- `PATCH /duties/:id` - Update duty information (cannot update scheduled duties)
- `DELETE /duties/:id` - Delete a duty (cannot delete scheduled duties)
- `PUT /duties/:id/constraints` - Add constraints to a duty

### Justice Board Routes (`/justice-board`)
- `GET /justice-board` - Get scores for all soldiers based on completed duties
- `GET /justice-board/:id` - Get individual soldier's score
