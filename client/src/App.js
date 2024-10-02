import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from './NavBar.js';
import { useState, useEffect } from 'react';
import { Row, Alert } from 'react-bootstrap';
import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom'
import API from './API';
import { LoginForm } from './AuthForm';
import CoursesTable from './CoursesTable';
import StudyPlanForm from './StudyPlanForm';

function App() {

  const [courses, setCourses] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [marked,setMarked] = useState([]);
  const [studyplan, setStudyplan] = useState([]);
  const [error,setError] = useState('');
  const [type,setType] = useState('');
  const [mode, setMode] = useState(0);


  useEffect(() => {
    const checkAuth = async () => {
      await API.getUserInfo(); // we have the user info here
      setLoggedIn(true);
    };

    const load = async () => {
      const list = await API.retrieveCourses(); //load from db
      setMarked(list.map(row => ({ code:row.code, credits:row.credits, enrstudents:row.enrstudents, maxstudents:row.maxstudents, preparatory:row.preparatory, red:false})));
      setCourses(list);
    }
    
    checkAuth();
    load();
      
  }, [refresh]);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setMessage({msg: `Welcome, ${user.name}!`, type: 'success'});
      setRefresh((refresh) => (!refresh));
    }catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setCourses([]);
    setMessage('');
    setStudyplan([]);
    setType([]);
    setRefresh((refresh) => (!refresh));
  };

  function findName(array,code) {
    if(code.length > 7) {
      const splitted = code.split(/(\s+)/);
      let noSplit = [];

      splitted.forEach(function(cd, index) {
        if (index % 2 === 0) {
          noSplit.push(array.find(c=>c.code === cd).name); 
        } else {
          noSplit.push(', ');
        }
     });
      return noSplit
    }
      
    else 
      return array.find(c=>c.code === code).name;
  }

  function isCompatible(code) {
    const constraint = courses.find(c=>c.code === code).incompatible;
    
    if(constraint !== null) {
       if(constraint.length > 7) {
          const splitted = constraint.split(/(\s+)/);
          let res;
    
          splitted.forEach(function(cd, index) {
          if (index % 2 === 0) {
             if(studyplan.some(c=>c.code === cd))
                res = true; 
          }   
       });
       return res;
       }
       else {
          if(studyplan.some(c=>c.code === constraint)) 
             return true;     
          else 
             return false;
       }  
    }
    else
       return false   
 }

  function addCourse(code) {
    if(courses.some(c=>c.code === code)){    
       if(isCompatible(code)) {
          if(courses.find(c=>c.code === code).incompatible.length < 8)
             setError({msg: `This course is incompatible with your course: ${courses.find(c=>c.code === courses.find(c=>c.code === code).incompatible).name}`, type: 'danger'});
          else 
             setError({msg: `This course is incompatible with one of these courses in your plan: ${findName(courses,courses.find(c=>c.code === code).incompatible)}`, type: 'danger'})      
       }
       else if(!studyplan.some(c=>c.code === courses.find(c=>c.code === code).preparatory) && courses.find(c=>c.code === code).preparatory !== null) {
          setError({msg: `This course has a preparatory course which should added first to your plane: ${courses.find(c=>c.code === courses.find(c=>c.code === code).preparatory).name}`, type: 'danger'});
       }
       else if(studyplan.some(c=>c.code === code)) {
          setError({msg: 'This course is already in your plan', type: 'danger'});
       }
       else if(courses.find(c=>c.code === code).maxstudents!==null &&  courses.find(c=>c.code === code).enrstudents >= courses.find(c=>c.code === code).maxstudents) {
          setError({msg: 'This course has already reached the max number of students', type: 'danger'});
       }
       else if((planCredits + courses.find(c=>c.code === code).credits) > 40 && type ==='part') {
          setError({msg: 'A part-time study plan should have a number of credits between 20 and 40', type: 'danger'});
       }
       else if((planCredits + courses.find(c=>c.code === code).credits) > 80 && type ==='full') {
          setError({msg: 'A full-time study plan should have a number of credits between 60 and 80', type: 'danger'});
       }
       else {
          const course = courses.find(c=>c.code === code);
          setStudyplan((oldPlan)=>[...oldPlan, course]);
          setMode(1);
       }
    }
    else {
       setError({msg: 'This course does not exist', type: 'danger'});
    }
 }

 useEffect(() => {
  const loadStudyPlan = async () => {
     const list = await API.retrieveStudyPlan(); //load from db
     if(list.length!==0) {
        list.reduce((s,c)=>(s+c.credits),0) <=40 ? setType('part') : setType('full') 
        setStudyplan(list);
     } 
     else {
       setStudyplan([]);
     }
  }
  if(loggedIn===true) {
     loadStudyPlan();
  }
}, [loggedIn]);

 const planCredits = studyplan.reduce((s,c)=>(s+c.credits),0);


  return <>
    <Row className="page-content container-fluid row p-0"> 
      <BrowserRouter>
        <Routes>
          <Route element={<NavBar handleLogout={handleLogout} loggedIn={loggedIn} />}>
            <Route index element={<Navigate replace to='/home' />} />
            <Route path='/login' element={loggedIn ? <Navigate replace to='/home' /> : <LoginForm login={handleLogin} message={message} setMessage={setMessage}/>} />
            <Route path='/home' element={
              <>
                {message && <Row>
                  <Alert variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
                </Row>}
                <Row className='row no-gutters'>
                  <Row className='col-md-6 no-gutters'>
                    <Row className='leftside'>
                      <CoursesTable id={"father"} title={'All courses'} courses={courses} loggedIn={loggedIn} findName={findName} marked={marked} addCourse={addCourse} type={type} setMode={setMode}/>
                    </Row>
                  </Row>
                  <Row className='col-md-6 no-gutters'>
                    <Row className='rightside'>
                      {loggedIn && <StudyPlanForm setRefresh={setRefresh} courses={courses} studyplan={studyplan} setStudyplan={setStudyplan} findName={findName} setMarked={setMarked} error={error} setError={setError} type={type} setType={setType} planCredits={planCredits} mode={mode} setMode={setMode} loggedIn={loggedIn}/>}
                    </Row>
                  </Row>
                </Row>
              </> 
            }/>
          </Route>
        </Routes>
      </BrowserRouter>
    </Row>
  </>

}

export default App;
