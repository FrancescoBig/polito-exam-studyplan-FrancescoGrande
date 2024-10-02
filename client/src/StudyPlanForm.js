import './StudyPlanForm.css'
import { useEffect, useState } from "react";
import { Dropdown, DropdownButton, Form, Button, Alert, Row, Col, Container } from "react-bootstrap";
import CoursesTable from './CoursesTable';
import API from './API';


function StudyPlanForm(props) {

   const [message, setMessage] = useState('');

   function checkTable(props) {
      if(props.type==='full' || props.type==='part') {
         const prep = props.courses.filter(c=>c.preparatory !== null).map(c=>c.preparatory);
         
         props.setMarked((oldMarked)=>oldMarked.map(c=>c.preparatory === null ? {...c, red:false} : {...c, red:true}));
         props.setMarked((oldMarked)=>oldMarked.map(c=>c.maxstudents === null ? c : c.enrstudents >= c.maxstudents ? {...c, red:true} : c));
         
         props.studyplan.forEach(course => {
            if(course.incompatible !== null && course.incompatible.length < 8) {
               props.setMarked((oldMarked)=>oldMarked.map(c=>c.code===course.incompatible ? {...c, red:true} : c))
            }
            if(course.incompatible !== null && course.incompatible.length >= 8) {   
               const splitted = course.incompatible.split(/(\s+)/);
               splitted.forEach(function(cd, index) {
                  if (index % 2 === 0) {
                     props.setMarked((oldMarked)=>oldMarked.map(c=>c.code===cd ? {...c, red:true} : c))
                  }   
               });
            }
            if(prep.includes(course.code)) {
            props.setMarked((oldMarked)=>oldMarked.map(c=>c.code===props.courses.find(c=>c.preparatory===course.code).code ? {...c, red:false} : c));
            }
            props.setMarked((oldMarked)=>oldMarked.map(c=>c.code===course.code ? {...c, red:true} : c));
         })

         props.setMarked((oldMarked)=>oldMarked.map(c=>c.credits+props.planCredits > 40 && props.type === 'part' ? {...c, red:true} : c));
         props.setMarked((oldMarked)=>oldMarked.map(c=>c.credits+props.planCredits > 80 && props.type === 'full' ? {...c, red:true} : c));
      }
      else {
         props.setMarked((oldMarked)=>oldMarked.map(c=> ({...c, red:false} )));
      }
   }

   function removeCourse(code) {
      if(props.studyplan.some(c=>c.preparatory === props.courses.find(c=>c.code === code).code))
         props.setError({msg: `This course has a preparatory course which should removed first to your plane: ${props.courses.find(c=>c.preparatory === props.courses.find(c=>c.code === code).code).name}`, type: 'danger'});
      else {
         props.setStudyplan((oldPlan)=>(oldPlan.filter((c)=>(c.code!==code))))
         props.setMode(1);
      }    
   }

   

   useEffect(() => {
      checkTable(props);
       // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [props.studyplan.length,props.loggedIn,props.type]);


   const handleSubmit = async (event) => {
      event.preventDefault();
      await API.createPlan(props.studyplan);
      props.setMode(0);
      props.setRefresh((refresh) => (!refresh));
      const list = await API.retrieveStudyPlan();
      props.setStudyplan(list);
      setMessage({msg: `Study plan submitted correctly`, type: 'success'});
   }

   const handleDelete = async (event) => {
      event.preventDefault();
      await API.deletePlan();
      setMessage({msg: `Study plan deleted correctly`, type: 'success'});
      props.setStudyplan([]);
      props.setType('');
      props.setRefresh((refresh) => (!refresh));
   }

   const handleCancel = async (event) => {
      event.preventDefault();
      const list = await API.retrieveStudyPlan();
      if(list.length!==0) {
         list.reduce((s,c)=>(s+c.credits),0) <=40 ? props.setType('part') : props.setType('full') 
         props.setStudyplan(list);
         props.setMode(0);
      } 
      else {
        props.setStudyplan([]);
        props.setType('');
      }   
   }

  
 

   return  <Container>

   {props.type!=='full' && props.type!=='part' && 
   <>
   <h1 id="welcome">Hi, you still don't have a study plan, click on the button to create a new one</h1>
      <DropdownButton
         id="dropdown-button-1"
         variant="secondary"
         menuVariant="dark"
         title="Create a new Study Plan"
         className="mt-2"
      >
         <Dropdown.Item onClick={()=>{props.setType('full')}}>Full-time plan</Dropdown.Item>
         <Dropdown.Item onClick={()=>{props.setType('part')}}>Part-time plan</Dropdown.Item>

      </DropdownButton>
   </>
   }

   {(props.type==='full' || props.type==='part') && <>

      <CoursesTable id={"child"} title={'My courses'} courses={props.studyplan} fullCourses={props.courses} type={props.type} findName={props.findName} removeCourse={removeCourse}/>
      {props.studyplan.length===0 ? 

         <>
         <p id="desc">Empty</p>
         <Row>
            <Col align='right'>
            <Button id="buttc" type='button' variant="outline-danger" onClick={()=>props.setType('')} className="me-2" >Cancel</Button>
            </Col>
         </Row> 
         </>

         :

          <Form onSubmit={handleSubmit}>
         <Row>
            {props.planCredits!==0 && <Col md={{ span: 4, offset: 1 }}>
               <h1 id="credits">Total Credits: {props.planCredits}</h1>
            </Col>
            }
            <Col md={{ span: 4, offset: 8 }}>
{props.mode === 1 && <Button type='submit' variant='outline-success' disabled={(props.type==='part' && props.planCredits<20) || (props.type==='full' && props.planCredits<60)} className="me-2">Save</Button>}
{props.mode === 0 && <Button id="del" type='button' variant="outline-danger" onClick={handleDelete} className="me-2" >Delete</Button>}
{props.mode === 1 && <Button type='button' variant="outline-danger" onClick={handleCancel} className="me-2" >Cancel</Button>}
            </Col>
         </Row> 
      </Form>        
      }
   </> 
   }
   {message && <Row>
      <Col id="msg" md={{ span: 6, offset: 1 }} className='mt-3'>
         <Alert variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
      </Col>
   </Row> }
   {props.error && <Row className='mt-3'>
      <Alert id="err" variant={props.error.type} onClose={() => props.setError('')} dismissible>{props.error.msg}</Alert>
   </Row> }   

   </Container>
}

export default StudyPlanForm;