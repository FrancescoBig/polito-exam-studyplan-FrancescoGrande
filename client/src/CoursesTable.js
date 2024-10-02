import 'bootstrap-icons/font/bootstrap-icons.css';
import { Accordion, Row, Col, Container } from "react-bootstrap";
import './CoursesTable.css'

function CoursesTable(props) {

  function activeMark(code) {

      if(props.marked.length === 0)
        return false
      else
        return props.marked.find(c=>c.code === code).red

  }

  return <Container>
  <Row>
    <Col>
       <h1 id={props.id+'-title'}>{props.title}</h1>
    </Col>
    {props.id==='child' && props.type==='part' &&  <Col md={{ span: 5, offset: 0 }}>
      <h1 id='range'>Part-time: credits range between 20 and 40</h1>
    </Col>}
    {props.id==='child' && props.type==='full' &&  <Col md={{ span: 5, offset: 0 }}>
      <h1 id='range'>Full-time: credits range between 60 and 80</h1>
     </Col>}
  </Row>
  {props.courses.length !== 0 && <Row id="head">
    <Col md={{ span: 1, offset: 1 }}><h1 className='hard'>Code</h1></Col>
    <Col md={{ span: 1, offset: 1 }}><h1 className='hard'>Name</h1></Col>
    <Col md={{ span: 1, offset: 3 }}><h1 className='hard'>Credits</h1></Col>
    <Col md={{ span: 1, offset: 0 }}><h1 className='hard'>Enrolled</h1></Col>
    <Col md={{ span: 1, offset: 0 }}><h1 className='hard'>Max</h1></Col>   
  </Row>}
    <Accordion defaultActiveKey="0" alwaysOpen id={props.id+"-acc"} className='col-md-12'>
      {props.courses
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
          .map(course => (
            <Row>
              <Col md={{ span: 11, offset: 0 }}>
                <Accordion.Item key={course.code} eventKey={props.courses.indexOf(course)}>
                <Accordion.Header>
                  <Container>
                    <Row>
                      <Col className={props.id==='child' ? 'c-name' : activeMark(course.code) ? 'f-name' : 'c-name'} md={{ span: 2, offset: 0 }}>
                        {course.code}
                      </Col>
                      <Col className={props.id==='child' ? 'c-name' : activeMark(course.code) ? 'f-name' : 'c-name'} md={{ span: 5, offset: 0 }}>
                      {course.name}
                      </Col>
                      <Col className={props.id==='child' ? 'c-name' : activeMark(course.code) ? 'f-name' : 'c-name'} md={{ span: 1, offset: 1 }}>
                        {course.credits}
                      </Col>
                      <Col className={props.id==='child' ? 'c-name' : activeMark(course.code) ? 'f-name' : 'c-name'} md={{ span: 1, offset: 0 }}>
                        {course.enrstudents === null ? 0 : course.enrstudents}
                      </Col>
                      <Col className={props.id==='child' ? 'c-name' : activeMark(course.code) ? 'f-name' : 'c-name'} md={{ span: 1, offset: 0 }}>
                        {course.maxstudents === null ? 'Any' : course.maxstudents}
                      </Col>
                    </Row>
                  </Container>   
                  </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col  md={{ span: 4, offset: 0 }}>
                      <h1 className='hard'>Incompatible Courses:</h1>
                    </Col>
                    <Col>
                      {course.incompatible === null ? 'No one' : props.id==='father' ? props.findName(props.courses,course.incompatible): props.findName(props.fullCourses,course.incompatible)}
                    </Col>
                  </Row>
                  <Row>
                    <Col md={{ span: 4, offset: 0 }}>
                      <h1 className='hard'>Preparatory Courses:</h1>
                    </Col>
                    <Col>
                      {course.preparatory === null ? 'No one' :  props.id==='father' ? props.findName(props.courses,course.preparatory) : props.findName(props.fullCourses,course.preparatory)}
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            </Col>
            {props.id==='father' &&  (props.type==='part' || props.type==='full') && <Col md={{ span: 1, offset: 0 }}>
              <button type='button' className="btn btn-outline-secondary bi bi-plus-circle action" onClick={()=>{props.addCourse(course.code)}}/>      
           </Col>}
           {props.id==='child' && <Col md={{ span: 1, offset: 0 }}>
              <button type='button' className="btn btn-outline-secondary bi bi-x-circle action" onClick={()=>{props.removeCourse(course.code)}}/>
            </Col>}        
          </Row>
          ))}
    </Accordion>
  </Container>

  }

export default CoursesTable;