# Jeewaka Medical Platform

Jeewaka Medical Platform is a comprehensive healthcare management system designed to connect patients, doctors, and hospitals through a unified digital platform. It provides appointment booking, AI-powered doctor search, patient management, and administrative tools for healthcare providers.

## Features

- **Landing Page**: Modern, informative landing page for first-time visitors.
- **User Authentication**: Secure sign-up and login for patients, doctors, and admins.
- **Patient Dashboard**: Book appointments, view history, and access AI-powered doctor search.
- **Doctor Dashboard**: Manage appointments, update profiles, and view patient details.
- **Admin Dashboard**: Oversee platform activity, manage users, and access analytics.
- **AI Search**: Natural language doctor search using Google Generative AI with fallback to traditional search.
- **Appointment Management**: Schedule, view, and manage appointments for all user roles.
- **Payment Integration**: Secure payment processing for medical services.
- **Mobile App**: Cross-platform mobile application for patients and doctors.

## Technology Stack

- **Frontend**: React, Vite, React Router, modern CSS
- **Backend**: Node.js, Express.js, MongoDB Atlas
- **AI Integration**: Google Generative AI (Gemini)
- **Mobile**: React Native (Expo)
- **Containerization**: Docker, Docker Compose

## Project Structure

- `frontend/` - Web client (React)
- `BackEnd/` - API server (Node.js/Express)
- `Mobile_App/` - Mobile app (React Native)
- `dump/` - Sample data and database dumps
- `docker-compose.yml` - Multi-service orchestration

## Getting Started

1. **Clone the repository**
   ```sh
   git clone https://github.com/Jeewaka-MediCare/Jeewaka-Medical-Platform.git
   cd Jeewaka-Medical-Platform
   ```
2. **Install dependencies**
   - Frontend: `cd frontend && npm install`
   - Backend: `cd BackEnd && npm install`
   - Mobile: `cd Mobile_App/Jeewaka && npm install`
3. **Environment setup**
   - Copy and configure environment variable files as needed 
4. **Run locally**
   - Using Docker Compose: `docker-compose up`
   - Or run each service individually with `npm run dev` or `npm start`

## Testing

- Backend: `cd BackEnd && node tests/test-runner.js`
- Frontend: `cd frontend && npm run test`
- Mobile: Use Expo Go or `npx expo start`

## Contributing

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Commit your changes with clear messages
4. Open a pull request for review

## License

This project is licensed under the MIT License.
