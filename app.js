const express = require('express');
const axios = require('axios');
const https = require('https');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

mongoose.connect('mongodb+srv://ademashauenova:Xjrsg3ko8uEcm1od@cluster0.10jquxy.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (error) => console.error(error));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: { type: Boolean, default: false },
    role: { type: String, default: 'user' },
    createdDate: { type: Date, default: Date.now },
    updatedDate: Date,
    deletedDate: Date,
});

const programSchema = new mongoose.Schema({
  programNameEn: String,
  programNameLocalized: String,
  programDescriptionEn: String,
  programDescriptionLocalized: String,
  image1: String,
  image2: String,
  image3: String,
  createdDate: { type: Date, default: Date.now },
  updatedDate: Date,
  deletedDate: Date,
});

const Program = mongoose.model('Program', programSchema);
const User = mongoose.model('User', userSchema);

app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(session({ secret: 'secret-key', resave: true, saveUninitialized: true }));

app.set('view engine', 'ejs');

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    // User is authenticated
    return next();
  } else {
    // User is not authenticated, redirect to login page
    res.redirect('/');
  }
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isAdmin === true) {
    // User is an admin
    return next();
  } else {
    // User is not an admin, redirect or handle as needed
    res.status(403).send('Unauthorized');
  }
};

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// app.get('/admin', (req, res) => {
//   res.render('admin');
// });

// app.get('/main', (req, res) => {
//   if (req.session.user) {
//     res.render('main', { username: req.session.user.username });
//   } else {
//     res.redirect('/');
//   }
// });

// app.get('/admin/add', (req, res) => {
//   res.render('admin');
// });


// REST API endpoints for CRUD operations on programs
app.get('/api/programs', async (req, res) => {
  try {
    const programs = await Program.find({ deletedDate: { $exists: false } });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/programs', async (req, res) => {
  try {
    console.log('Incoming Request Body:', req.body);
    const newProgram = req.body;
    const program = new Program(newProgram);
    await program.save();
    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/programs/:id', async (req, res) => {
  try {
    console.log('PUT request received:', req.params.id, req.body);
    req.body.updatedDate = new Date().toISOString();
    const updatedProgram = req.body;
    const program = await Program.findByIdAndUpdate(req.params.id, updatedProgram, { new: true });

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json(program);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/programs/:id', async (req, res) => {
  // try {
  //   await Program.findByIdAndDelete(req.params.id);
  //   res.status(204).end();
  // } catch (error) {
  //   res.status(500).json({ error: 'Internal Server Error' });
  // }
  try {
    const programId = req.params.id;

    // Update the program with deletion_date
    await Program.findByIdAndUpdate(programId, { $set: { deletedDate: new Date() } });

    res.json({ message: 'Program marked for deletion' });
} catch (error) {
    console.error('Error marking program for deletion:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

// app.post('/admin/add', async (req, res) => {
//   try {
//       // Process the form data and save the new program to the database
//       const newProgram = {
//           programNameEn: req.body.programNameEn,
//           programNameLocalized: req.body.programNameLocalized,
//           programDescriptionEn: req.body.programDescriptionEn,
//           programDescriptionLocalized: req.body.programDescriptionLocalized,
//           image1: req.body.image1,
//           image2: req.body.image2,
//           image3: req.body.image3,
//       };

//       // Save the newProgram to the Program collection
//       const program = new Program(newProgram);
//       await program.save();

//       res.redirect('/admin');
//   } catch (error) {
//       res.redirect('/admin');
//   }
// });

// app.get('/admin/edit/:id', async (req, res) => {
//   try {
//       const user = await User.findById(req.params.id);
//       res.render('admin', { editItem: user });
//   } catch (error) {
//       res.redirect('/admin');
//   }
// });


app.post('/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });

    if (existingUser) {
      // Username already exists
      res.status(409).send('Username already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hashedPassword, role: 'user' });
    await user.save();
    res.redirect('/');
  } catch (error) {
    res.redirect('/register');
  }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
  
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = user;
      
      if (user.isAdmin) {
        res.redirect('/admin');
      } else {
        res.redirect('/main');
      }
    } else {
      res.redirect('/');
    }
});

app.get('/main', isAuthenticated, async (req, res) => {
  let universities;
  // let searchInputName;
  // let searchInputCountry;
  try {
      // const programs = await Program.find({ deletedDate: { $exists: false } });
      const response = await fetch('http://localhost:3000/api/programs');
      const allPrograms = await response.json();
      const programs = allPrograms.filter(program => !program.deletedDate);

    //   searchInputName = req.query.name;
    //   searchInputCountry = req.query.country;

    // if (searchInputName || searchInputCountry) {
    //   const queryParams = new URLSearchParams();

    //   if (searchInputName) {
    //     queryParams.append('name', searchInputName);
    //   }

    //   if (searchInputCountry) {
    //     queryParams.append('country', searchInputCountry);
    //   }

    //   const queryString = queryParams.toString();
    //   const response = await fetch(`http://universities.hipolabs.com/search?${queryString}`);
    //   universities = await response.json();

    //   // Handle universities data as needed
    //   console.log('Search Results:', universities);
    // }
      

      const searchInput = req.query.search;
        if (searchInput) {
            const res = await fetch(`http://universities.hipolabs.com/search?name=${searchInput}`);
            universities = await res.json();

            // Handle universities data as needed
            console.log('Search Results:', universities);
        }
      
      res.render('main', { username: req.session.user.username, programs, universities, searchInput});
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});  


// app.get('/ranking', async (req, res) => {
//   try {
//       // Extract the country parameter from the query
//       const country = req.query.country;

//       // Make a request to the University/College List and Rankings API
//       const response = await axios.get('https://university-college-list-and-rankings.p.rapidapi.com/api/universities', {
//           params: { countryCode: country },
//           headers: {
//               'X-RapidAPI-Key': '5c7a827075mshf1bfb891d4ea18fp144cf4jsn6076c8e26339',
//               'X-RapidAPI-Host': 'university-college-list-and-rankings.p.rapidapi.com',
//           },
//       });

//       // Extract the relevant data from the response
//       const universities = response.data;

//       // Respond with the data
//       res.json(universities);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

const fetch = require('node-fetch');

// app.get('/ranking', async (req, res) => {
//   try {
//       const country = req.query.countryCode; // Empty string if countryCode is not provided
//       if (!country) {
//           res.status(400).json({ error: 'Country code is required' });
//           return;
//       }

//       const url = `https://university-college-list-and-rankings.p.rapidapi.com/api/universities?countryCode=${country}`;

//       const options = {
//           method: 'GET',
//           headers: {
//               'X-RapidAPI-Key': '5c7a827075mshf1bfb891d4ea18fp144cf4jsn6076c8e26339',
//               'X-RapidAPI-Host': 'university-college-list-and-rankings.p.rapidapi.com',
//           },
//       };

//       const response = await fetch(url, options);

//       if (!response.ok) {
//           console.error('Error:', response.status, response.statusText);
//           res.status(response.status).send(response.statusText);
//           return;
//       }

//       const result = await response.text();
//       console.log(result);
//       res.status(200).send(result);
//   } catch (error) {
//       console.error('Fetch Error:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.get('/ranking', async (req, res) => {
//   let universities;
//   try {
//       const searchInput = req.query.countryCode;
//         if (searchInput) {
//           const url = `https://university-college-list-and-rankings.p.rapidapi.com/api/universities?countryCode=${searchInput}`;

//                 const options = {
//                     method: 'GET',
//                     headers: {
//                         'X-RapidAPI-Key': '5c7a827075mshf1bfb891d4ea18fp144cf4jsn6076c8e26339',
//                         'X-RapidAPI-Host': 'university-college-list-and-rankings.p.rapidapi.com',
//                     },
//                 };
          
//             const response = await fetch(url, options);
//             universities = await response.json();

//             // Handle universities data as needed
//             console.log('Search Results:', universities);
//         }
      
//       res.render('ranking', { universities, searchInput});
//   } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//   }
// });  

app.get('/ranking', isAuthenticated, async (req, res) => {
  let universities;
  try {
    const searchInput = req.query.countryCode;
    if (searchInput) {
      const url = `https://university-college-list-and-rankings.p.rapidapi.com/api/universities?countryCode=${searchInput}`;

      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '5c7a827075mshf1bfb891d4ea18fp144cf4jsn6076c8e26339',
          'X-RapidAPI-Host': 'university-college-list-and-rankings.p.rapidapi.com',
        },
      };

      const response = await fetch(url, options);
      universities = await response.json();

      // Handle universities data as needed
      console.log('Search Results:', universities);

      // Extract and log location and names of the first 10 universities
      const first10Universities = universities.data.rankings;
      Object.keys(first10Universities).slice(0, 10).forEach(key => {
        const university = first10Universities[key];
        console.log(`${key}. ${university.name} - ${university.location}`);
      });
    }

    res.render('ranking', { username: req.session.user.username, universities, searchInput });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/admin',  isAdmin, async (req, res) => {
  try {
      // Fetch programs from the REST API
      const response = await fetch('http://localhost:3000/api/programs'); // Update the URL
      const programs = await response.json();

      // Render the admin EJS view and pass the programs data
      res.render('admin', { programs });
  } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.listen(3000, () => console.log('Server is running on http://localhost:3000'));