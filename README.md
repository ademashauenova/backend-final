
# Universities App Documentation

## Table of Contents
- Project Overview
- Installation
- NPM Packages
- API Usage
  - REST API
  - University Domains and Names Data List & API
  - University/College List and Rankings API
- Design Decisions

## Project Overview

The Universities App is a web application built using Express.js, Bootstrap, and jQuery. It provides information about research programs in different universities, top 10 universities in different countries accroding to uniRank.
## Installation

1. Clone the repository: `git clone https://github.com/ademashauenova/backend_final.git`
2. Navigate to the project folder: `cd backend_final`
3. Install dependencies: `npm install`
4. Run the server: `nodemon app.js`
5. Open your browser and visit `http://localhost:3000`

## npm packages/dependencies

- Express.js
- axios
- mongoose
- express-session
- bcrypt
- ejs
- node-fetch

## API Usage

### REST API endpoints
GET /api/programs: Retrieve a list of programs.  
POST /api/programs: Add a new program.  
PUT /api/programs/:id: Update an existing program.  
DELETE /api/programs/:id: Mark a program for deletion.  

### University Domains and Names Data List & API 
Parameters: university name
Response: A list of universities containing user input in their name.  

### University/College List and Rankings API 
Parameter: country code  
Response: Rnaking of universities of the input country code.    


## Design Decisions

### Navbar
The app features a responsive navigation bar fixed to the top, providing easy access to different sections: Weather, Book Bestsellers, and Rijksmuseum.

### Database Structure
Used MongoDB to store user data and their historical searches.

### Session Management
Implemented Express session for user authentication.

### Password Security
Used bcrypt to hash and store user passwords securely.

### Password Information
Admin Credentials:  
Username: adema  
Password: pass  
