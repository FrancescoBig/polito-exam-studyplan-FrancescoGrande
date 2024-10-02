import { Navbar, Container, Button } from 'react-bootstrap';
import './NavBar.css'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

function NavBar(props) {

  const navigate = useNavigate();
  const location = useLocation();

  return <>
    <Navbar bg="dark" expand="lg" variant="dark">
      <Container fluid>
        
     
        <Navbar.Brand onClick={() => navigate("/home")}><i class="bi bi-book order-sm-1"></i></Navbar.Brand>
        <Navbar.Brand id="home">Study Plan</Navbar.Brand>

        <div class="btn-lg order-md-4 order-sm-3">
         {props.loggedIn ? <Button id="log" onClick={() => props.handleLogout()}><i class="bi bi-person-circle" id="person" />LOGOUT</Button> : 
            location.pathname !== '/login' ? <Button id="log" onClick={() => navigate("/login")}><i class="bi bi-person-circle" id="person" />LOGIN</Button> : 
              <Button id="log" onClick={() => navigate("/home")}><i class="bi bi-house-fill" id="person" />HOME</Button> }
        </div>
      </Container>
    </Navbar>
    <Outlet />
  </>
}
export default NavBar;