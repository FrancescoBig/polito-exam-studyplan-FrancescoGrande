import Course from './Course.js'

const APIURL = 'http://localhost:3001/api';

const logIn = async (credentials) => {
    const response = await fetch(APIURL + '/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    if(response.ok) {
      const user = await response.json();
      return user;
    }
    else {
      const errDetails = await response.text();
      throw errDetails;
    }
  }
  
  const getUserInfo = async () => {
    const response = await fetch(APIURL + '/sessions/current', {
      credentials: 'include',
    });
    const user = await response.json();
    if (response.ok) {
      return user;
    } else {
      throw user;  // an object with the error coming from the server
    }
  };
  
  const logOut = async() => {
    const response = await fetch(APIURL + '/sessions/current', {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok)
      return null;
  }

  async function retrieveCourses() {
    const url = APIURL + '/courses'
    try {
        const response = await fetch(url);
        if (response.ok) {
            // process the response
            const list = await response.json();
            const coursesList = list.map((c) => new Course(c.code, c.name, c.credits, c.enrstudents, c.maxstudents, c.incompatible, c.preparatory ));
            return coursesList;
        } else {
            // application error (404, 500, ...)
            const text = await response.text();
            throw new TypeError(text);
        }
    } catch (e) {
        // network error
        throw e;
    }
}

async function retrieveStudyPlan() {
  const url = APIURL + '/studyplan'
  try {
    const response = await fetch(url, {
      credentials: 'include',
    });
      if (response.ok) {
          // process the response
          const list = await response.json();
          const coursesList = list.map((c) => new Course(c.code, c.name, c.credits, c.enrstudents, c.maxstudents, c.incompatible, c.preparatory ));
          return coursesList;
      } else {
          // application error (404, 500, ...)
          const text = await response.text();
          throw new TypeError(text);
      }
  } catch (e) {
      // network error
      throw e;
  }
}

async function createPlan(plan) {
  const url = APIURL + '/plan';
  try {
      const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(plan),
          headers: {
              'Content-Type': 'application/json'
          }, 
          credentials: 'include'
      });
      if (response.ok) {
          return true;
      } else {
          const text = await response.text();
          throw new TypeError(text);
      }
  } catch (e) {
      throw e;
  }
}

async function deletePlan() {
  const url = APIURL + '/plan';
  try {
      const response = await fetch(url, {
          method: 'DELETE',
          credentials: 'include'
      });
      if (response.ok) {
          return true;
      } else {
          const text = await response.text();
          throw new TypeError(text);
      }
  } catch (err) {
      throw err;
  }
}

const API = { logIn, logOut, getUserInfo, retrieveCourses, retrieveStudyPlan, createPlan, deletePlan };
export default API;