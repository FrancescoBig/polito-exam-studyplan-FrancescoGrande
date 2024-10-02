'use strict'

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Dao = require('./Dao');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const PREFIX = '/api';

function isCompatible(code,courses,plan) {
  const constraint = courses.find(c=>c.code === code).incompatible;
  
  if(constraint !== null) {
     if(constraint.length > 7) {
        const splitted = constraint.split(/(\s+)/);
        let res;
  
        splitted.forEach(function(cd, index) {
        if (index % 2 === 0) {
           if(plan.some(c=>c.code === cd))
              res = true; 
        }   
     });
     return res;
     }
     else {
        if(plan.some(c=>c.code === constraint)) 
           return true;     
        else 
           return false;
     }  
  }
  else
     return false;  
}

function isFine(courses, plan) {

  let tempPlan = [];
  let res = true;
  const credits = plan.reduce((s,c)=>(s+c.credits),0)
  
  if(credits < 20 || (credits > 40 && credits < 60) || credits >80) {
    //Out of credits range
    res = false;
  }

  const prepCourses = courses.filter(c=>c.preparatory !== null).map(c=>c.code);
  if(plan.some(c=>prepCourses.includes(c.code))) {
    //Out of preparatory course
    const prep = plan.filter(c=>prepCourses.includes(c.code)).map(c=>c.preparatory);
    plan.some(c=>prep.includes(c.code)) ? res=true : res=false
  }

  plan.forEach(course => {
    if(courses.some(c=>c.code === course.code)){
      
      if(isCompatible(course.code,courses,tempPlan)) {
        //Incompatibility amoung courses
        res = false;
      }
      else if(tempPlan.some(c=>c.code === course.code)) {
        //Same course more times
        res = false;
      }
      else if(course.maxstudents!==null &&  course.enrstudents >= course.maxstudents) {
        //Max enrolled students for a course in your plan
        res = false;
      }
      else if(courses.find(c=>c.code === course.code).name.trim() !== course.name.trim()) {
        //Right code wrong name
        res = false;
      }
      else if(courses.find(c=>c.code === course.code).credits !== course.credits || 
              courses.find(c=>c.code === course.code).enrstudents !== course.enrstudents ||
              courses.find(c=>c.code === course.code).maxstudents !== course.maxstudents ||
              courses.find(c=>c.code === course.code).preparatory !== course.preparatory ||
              courses.find(c=>c.code === course.code).incompatible !== course.incompatible ) {
        //Right code wrong parameter
        res = false;
      }
      else {
        tempPlan.push(course);
      }
    }
    else {
      //Course not existing
      res = false;
    }
  });

  return res;
    
}


passport.use(new LocalStrategy(
  function(username, password, done) {
    Dao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });
        
      return done(null, user);
    })
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Dao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

const app = express();
const PORT = 3001;

app.use(morgan('dev'))
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated())
    return next();
  
  return res.status(401).json({ error: 'not authenticated'});
}

app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false 
}));

app.use(passport.initialize());
app.use(passport.session());

//Users APIs

//LOGIN
app.post(PREFIX+'/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json(info);
      }
      // success, perform the login
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from Dao.getUser()
        return res.json(req.user);
      });
  })(req, res, next);
});

// check whether the user is logged in or not
app.get(PREFIX+'/sessions/current', (req, res) => {  if(req.isAuthenticated()) {
  res.status(200).json(req.user);}
else
  res.status(401).json({error: 'Unauthenticated user!'});;
});

//LOGOUT
app.delete(PREFIX+'/sessions/current', (req, res) => {
  req.logout( ()=> { res.end(); } );
});

//Get all courses
app.get(PREFIX + '/courses', async (req, res) => {
  try {
    const courses = await Dao.retrieveCourses();
    return res.status(200).json(courses);
  }
  catch (error) {
    return res.status(500).json(error);
  }
});

//Get studyplan
app.get(PREFIX + '/studyplan', isLoggedIn, async (req, res) => {
  try {
    const courses = await Dao.retrieveStudyPlan(req.user.id);
    return res.status(200).json(courses);
  }
  catch (error) {
    return res.status(500).json(error);
  }
});

//Create study plan
app.post(PREFIX + '/plan', isLoggedIn, async (req, res) => {
 
  try {
      if(req.body.some(c=>c.code===undefined) || req.body.some(c=>c.name===undefined) || req.body.some(c=>c.enrstudents===undefined) || req.body.some(c=>c.maxstudents===undefined) || req.body.some(c=>c.credits===undefined) || req.body.some(c=>c.incompatible===undefined) || req.body.some(c=>c.preparatory===undefined)) {
        return res.status(422).json({error: `One or more courses have one or more undefined fields`})
      }
      if(req.body.some(c=>!isNaN(c.code)) || req.body.some(c=>!isNaN(c.name)) || req.body.some(c=>!isNaN(c.incompatible) && c.incompatible!==null) || req.body.some(c=>!isNaN(c.preparatory) && c.preparatory!==null)) {
        return res.status(422).json({error: `One or more courses have one or more fields which don't respect the type`})
      }
      if(req.body.some(c=>isNaN(c.credits)) || req.body.some(c=>isNaN(c.enrstudents) && c.enrstudents!==null) || req.body.some(c=>isNaN(c.maxstudents) && c.maxstudents!==null)) {
        return res.status(422).json({error: `One or more courses have one or more fields which don't respect the type`})
      }
      const fullCourses = await Dao.retrieveCourses().then(courses => courses.filter(c=> c.enrstudents >= c.maxstudents && c.enrstudents!==null && c.maxstudents!==null).map(c=>c.code));
      if(req.body.some(c=> fullCourses.includes(c.code))) {
        return res.status(422).json({error: `The course ${req.body.find(c=> fullCourses.includes(c.code)).name} has already the max number of enrolled students`})
      }
      const courses = await Dao.retrieveCourses();
      if(!isFine(courses,req.body)) {
        return res.status(422).json({error: `The study plan doesn't follow the rules`})
      }
      else {
        await Dao.createPlan(req.body,req.user.id)
        return res.status(201).end();
      }  
    }
  catch (error) {
    return res.status(500).json(error);
  }

});

//Delete study plan
app.delete(PREFIX + '/plan', isLoggedIn, async (req, res) => {
 
  try {
      await Dao.deletePlan(req.user.id)
      return res.status(204).end();
    }
  catch (error) {
    return res.status(500).json(error);
  }

});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));