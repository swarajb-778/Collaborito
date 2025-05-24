# Collaborito – Mobile App Requirements

## Project Description
Collaborito is a mobile app that facilitates collaboration between users on projects and provides comprehensive workspace/eventspace booking capabilities. The app enables users to create projects, invite collaborators, communicate through real-time chat, manage tasks, book venues for events, and leverage AI capabilities for enhanced productivity.

The core functionality includes user authentication via LinkedIn OAuth, project management, real-time messaging, task management, file sharing, and a full-featured venue booking system. The app is enhanced with AI features powered by Claude 3.7, providing intelligent assistance such as chat summarization, task generation, writing assistance, and smart venue recommendations.

Built with Expo React Native and TypeScript, the app uses Supabase for backend services (authentication, database, storage, and serverless functions). The development follows a phased approach, starting from foundation setup and progressing through core features, AI enhancements, and final polishing before deployment to app stores.


before start Just make sure to make it super modern, add microanimations, and generate some mockup screenshots with SVGs and i want best animations you can use 21st.dev mcp server of reffer other docs like shadcn or tailwind css

## Phase 1: Project Foundation
- **Task 1**: Project Setup & Repository
  - Initialize a new Expo React Native project with TypeScript
  - Set up Git version control using git mcp server
  - Establish project structure (folders for components, navigation, etc.)
  - Configure required tools and continuous integration (GitHub Actions or Expo EAS workflows)

- **Task 2**: Supabase Backend Initialization
  - Create a new Supabase project
  - Configure Supabase URL and API keys in the app
  - Design initial database schema (users/auth, profiles, projects, project_members)
  - Enable Row Level Security (RLS) on tables with appropriate policies

- **Task 3**: Authentication (LinkedIn OAuth)
  - Implement LinkedIn OAuth using Supabase Auth
  - Register LinkedIn OAuth application and configure in Supabase
  - Integrate sign-in flow with Expo's deep linking
  - Handle post-login profile creation

- **Task 4**: Navigation & Base Screens
  - Set up React Navigation structure
  - Create placeholder screens for key sections
  - Implement global theme/style guide based on design
  - Configure splash screen and styled login screen

- **Task 5**: UX Design Alignment
  - Incorporate Figma design guidelines
  - Extract design tokens and component layouts
  - Set up reusable UI components following design system
  - Integrate assets from Figma (logos, icons)

## Phase 2: Core Feature Implementation
- **Task 1**: User Profile Screen & Editing
  - Develop Profile screen showing user information
  - Allow editing of profile fields
  - Implement profile picture upload
  - Update profiles table via Supabase when changes made

- **Task 2**: Project Creation & Listing
  - Build form for creating new projects
  - Implement home screen with list of user's projects
  - Add navigation to project details
  - Handle empty state and loading states

- **Task 3**: Project Details & Collaboration Hub
  - Create Project Detail screen showing project information
  - Display list of collaborators with avatars
  - Add navigation to sub-features (chat, tasks)
  - Implement permission checks for access control

- **Task 4**: Inviting Collaborators
  - Add "Invite" option on Project Detail screen
  - Implement functionality to add existing users to projects
  - Handle cases for non-registered users
  - Show pending invites and allow revoking

- **Task 5**: Real-time Project Chat (Discussion)
  - Build chat UI for project messages
  - Use Supabase Realtime for subscribing to new messages
  - Implement message sending functionality
  - Style messages with sender information and timestamps

- **Task 6**: Task Management (To-Do Lists)
  - Create task creation interface
  - Display list of tasks for each project
  - Implement task completion toggling
  - Add task assignment functionality (optional)

## Phase 3: Workspace & Event Space Booking System
- **Task 1**: Database Schema & Backend Setup
  - Design venues table with location, capacity, pricing, amenities, and contact information
  - Create venue_images table for storing multiple high-quality photos per venue
  - Implement bookings table with user_id, venue_id, booking dates, status, and payment info
  - Add booking_reviews table for user feedback and ratings system
  - Create venue_availability table for real-time availability tracking
  - Set up payment_transactions table for secure payment processing
  - Configure RLS policies for secure access to venue and booking data

- **Task 2**: Venue Discovery & Listing
  - Build venue browsing interface with modern card-based design
  - Implement location-based search with maps integration (Google Maps/Apple Maps)
  - Add advanced filtering by capacity, price range, amenities, venue type, and location
  - Create venue comparison feature for side-by-side analysis
  - Implement search functionality with autocomplete and suggestions
  - Add venue categorization (co-working spaces, event halls, meeting rooms, outdoor venues)

- **Task 3**: Venue Detail & Information Display
  - Design comprehensive venue detail pages with image galleries
  - Display venue features, amenities, and specifications
  - Show real-time availability calendar with pricing
  - Implement 360° virtual tour integration (optional)
  - Add venue contact information and directions
  - Display user reviews and ratings with photos
  - Include venue policies, cancellation terms, and booking rules

- **Task 4**: Booking Flow & Payment Integration
  - Create intuitive step-by-step booking process
  - Implement date/time selection with availability checking
  - Add guest count and special requirements input
  - Integrate secure payment processing (Stripe/PayPal/Apple Pay/Google Pay)
  - Build booking confirmation system with automated emails/notifications
  - Implement booking modification and cancellation features
  - Add booking protection and insurance options

- **Task 5**: Booking Management & Calendar
  - Create user booking dashboard with upcoming and past bookings
  - Implement calendar integration for scheduling
  - Add booking reminders and notifications
  - Build venue owner dashboard for managing bookings
  - Create booking analytics and reporting for venue owners
  - Implement group booking and recurring event features

- **Task 6**: Reviews & Community Features
  - Build venue review and rating system with photo uploads
  - Implement review moderation and reporting features
  - Add user-generated content guidelines
  - Create venue recommendation engine based on user preferences
  - Implement social sharing of events and venues
  - Add community forums for event planning discussions

- **Task 7**: Modern UI/UX Implementation
  - Design responsive layouts for various screen sizes
  - Implement smooth animations and micro-interactions
  - Add skeleton loading states and smooth transitions
  - Create intuitive navigation and user flows
  - Implement accessibility features and screen reader support
  - Add dark mode support for better user experience

## Phase 4: Enhanced Features & AI
- **Task 1**: AI Assistant Chatbot Integration
  - Create UI for AI chat interactions
  - Implement Supabase Edge Function for secure Claude API calls
  - Provide project context to AI for relevant responses
  - Display and handle AI responses in the app

- **Task 2**: AI-Powered Project Insights
  - Implement discussion summarization feature
  - Add task generation based on project context
  - Create writing assistance for descriptions
  - Design UI for displaying AI-generated insights

- **Task 3**: AI-Powered Venue Recommendations
  - Integrate Claude AI for intelligent venue suggestions
  - Implement event type analysis for venue matching
  - Add automated booking optimization based on preferences
  - Create smart pricing alerts and recommendations

- **Task 4**: Push Notifications & Alerts
  - Set up Expo Notifications for push permissions
  - Store device push tokens in Supabase
  - Implement server-side triggers for notifications
  - Configure deep links for notification routing
  - Add booking confirmations and reminders

- **Task 5**: File Sharing & Storage
  - Add file attachment functionality to projects/chats
  - Implement file upload to Supabase Storage
  - Store file metadata in database
  - Display files with appropriate previews and download options

- **Task 6**: Search & Discovery
  - Implement project search functionality
  - Add user/collaborator search feature
  - Create unified search experience (projects and venues)
  - Optimize search performance with proper indexing

## Phase 5: Final Polish & Deployment
- **Task 1**: UI/UX Polish and Consistency
  - Refine all UI elements to match design specifications
  - Add appropriate icons and images
  - Implement animations/transitions for improved UX
  - Ensure accessibility compliance

- **Task 2**: Performance Optimization
  - Identify and fix performance bottlenecks
  - Optimize network calls and data fetching
  - Implement caching strategies
  - Conduct security audit of app and backend

- **Task 3**: Beta Testing & QA
  - Conduct internal QA on all platforms
  - Release beta version to test group
  - Write unit tests for critical functions
  - Check for fail states and error handling

- **Task 4**: App Store Deployment (iOS & Android)
  - Configure app identifiers and metadata
  - Build release packages using Expo EAS
  - Create store listings with screenshots and descriptions
  - Ensure compliance with store policies
  - Submit for review on both platforms

- **Task 5**: Production Launch & Monitoring
  - Integrate analytics for usage tracking
  - Set up error monitoring
  - Monitor infrastructure (Supabase, API usage)
  - Collect and respond to user feedback

## Phase 6: Documentation & MCP/AI Notes
- **Task 1**: Developer Documentation
  - Create detailed README.md with project overview
  - Document setup instructions and architecture
  - Detail notable implementations and configuration
  - List environmental variables and their setup

- **Task 2**: User Guide & Help Documentation
  - Create in-app help section or external guide
  - Document key features with examples
  - Include AI usage disclaimers
  - List any system limitations

- **Task 3**: Claude AI Integration Notes
  - Document API integration details
  - Record prompt strategies and parameters
  - Document API key management
  - Note limitations and future upgrade paths

- **Task 4**: Figma MCP Usage Notes
  - Explain MCP setup and configuration
  - Document design token extraction process
  - Record lessons learned and best practices
  - Provide instructions for future design updates

## External Resources
- [React Native Documentation](https://reactnative.dev/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API Docs](https://docs.anthropic.com)
- [LinkedIn OAuth (Sign In with LinkedIn)](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Figma MCP (Model Context Protocol)](https://github.com/GLips/Figma-Context-MCP) 


note that you have to Implement a backend server