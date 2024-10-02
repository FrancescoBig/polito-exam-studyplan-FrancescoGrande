import { useState } from 'react';
import { Button, Form, Row, Alert } from 'react-bootstrap';
import './AuthForm.css'



function LoginForm(props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        const credentials = { username, password };
        props.login(credentials);
    };

    return <>
        {props.message && <Row>
            <Alert variant={props.message.type} onClose={() => props.setMessage('')} dismissible>{props.message.msg}</Alert>
          </Row>}
        <Form onSubmit={handleSubmit} style={{ borderColor: 'grey', borderWidth: 2, padding: 30, marginTop: 30}}>
            <Form.Group className='mb-3' id="login-form">
                <Form.Label>Insert email</Form.Label>
                <Form.Control type='email' value={username} placeholder='email' onChange={(ev) => setUsername(ev.target.value)} required={true} />
            </Form.Group>

            <Form.Group className='mb-3' id="login-form">
                <Form.Label>Insert password</Form.Label>
                <Form.Control type='Password' value={password} placeholder='password' onChange={ev => setPassword(ev.target.value)} required={true} />
            </Form.Group>

            <p align='center'>
                <Button type="submit" class="btn login-button" variant="success" id="login">Login</Button>
            </p>
        </Form>
    </>
};


export { LoginForm };