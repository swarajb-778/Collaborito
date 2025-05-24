# Collaborito

[![CI/CD Pipeline](https://github.com/swarajb-778/Collaborito/actions/workflows/ci.yml/badge.svg)](https://github.com/swarajb-778/Collaborito/actions/workflows/ci.yml)

An AI-powered community platform that helps entrepreneurs match with collaborators and book workspaces for their events - unlike inefficient networking communities.

## Project Overview

Collaborito is a mobile app that facilitates collaboration between users on projects and provides workspace booking for events. The app enables users to create projects, invite collaborators, communicate through real-time chat, manage tasks, book event spaces, and leverage AI capabilities for enhanced productivity.

The core functionality includes user authentication via LinkedIn OAuth, project management, real-time messaging, task management, file sharing, and comprehensive workspace/eventspace booking. The app is enhanced with AI features powered by Claude 3.7, providing intelligent assistance such as chat summarization, task generation, and writing assistance.

## Tech Stack

- **Frontend**: Expo React Native with TypeScript
- **Backend**: Supabase (Authentication, Database, Storage, Serverless Functions)
  - PostgreSQL database with structured schema for user profiles, interests, goals, skills, venues, and bookings
  - Storage buckets for profile images, project files, and venue images
  - Row-level security policies for data protection
  - Serverless functions for data validation, processing, and booking management
- **AI**: Claude 3.7 API

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI
- Supabase account
- LinkedIn Developer account (for OAuth)
- Claude API key (for AI features)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/collaborito.git
   cd collaborito
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy the environment variables
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your own configuration values:
   - Supabase URL and Anon Key
   - LinkedIn OAuth credentials
   - Claude API key

5. Start the development server
   ```bash
   npx expo start
   ```

## Project Structure

- `app/`: Main application code (Expo Router)
- `src/`
  - `components/`: Reusable UI components
  - `screens/`: Screen components
  - `navigation/`: Navigation configuration
  - `services/`: API and service integrations
  - `contexts/`: React Context providers
  - `hooks/`: Custom React hooks
  - `types/`: TypeScript interfaces and types

## Key Features

- User authentication with LinkedIn OAuth or email/password
- Complete user onboarding flow with profile setup:
  - Personal information collection
  - Interest selection
  - Goal setting (find co-founder, find collaborators, contribute skills, explore ideas)
  - Project details and skills matching
- Project creation and management
- Real-time chat for project discussions
- Task management and to-do lists
- **Workspace & Event Space Booking:**
  - Browse available venues by location and capacity
  - View detailed venue information with high-quality images
  - Check real-time availability and pricing
  - Compare venue features and amenities
  - Secure booking with integrated payment processing
  - Booking management and calendar integration
  - Venue reviews and ratings system
  - Special occasion and event planning support
- AI-powered assistance via Claude 3.7
- File sharing and collaboration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


#hello this is for testing purpose 