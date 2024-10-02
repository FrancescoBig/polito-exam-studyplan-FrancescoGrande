'use strict';

const db = require('./db.js');
const crypto = require('crypto');


function getUser  (email, password)  {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM students WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) { 
          reject(err); 
        }
        else if (row === undefined) {
          resolve(false); 
        }
        else {
          const user = {id: row.id, username: row.email, name: row.name};
          
          crypto.scrypt(password, row.salt, 32, function(err, hashedPassword) {
            if (err) reject(err);
            if(!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword))
              resolve(false);
            else
              resolve(user);
          });
        }
      });
    });
  }
  
function getUserById  (id){
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM students WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) { 
          reject(err); 
        }
        else if (row === undefined) { 
          resolve({error: 'User not found!'}); 
        }
        else {
          const user = {id: row.id, username: row.email, name: row.name};
          resolve(user);
        }
      });
    });
  }

function retrieveCourses() {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM courses";
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const courses = rows.map((c) => ({ code: c.code, name: c.name, credits: c.credits, enrstudents: c.enrolledstudents, maxstudents: c.maxstudents, incompatible: c.incompatible, preparatory: c.preparatory }));
            resolve(courses);
        })
    })
}

function retrieveStudyPlan(student) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM courses", (err, coursesRows) => {
        if (err) {
            reject(err);
            return;
        }
        db.all("SELECT * FROM studyplan WHERE student=?", [student], (err,planRows) => {
          if (err) {
            reject(err);
            return;
          }
          const courses = coursesRows
            .filter(c=>planRows.map(c=>c.code).includes(c.code))
              .map((c) => 
                ({ 
                  code: c.code, 
                  name: c.name, 
                  credits: c.credits, 
                  enrstudents: c.enrolledstudents, 
                  maxstudents: c.maxstudents, 
                  incompatible: c.incompatible, 
                  preparatory: c.preparatory 
                }));
          resolve(courses);
        })       
    })
  })
}

function addCourseToPlan(code, student) {
  return new Promise((resolve,reject) => {
    let sql = "INSERT INTO studyplan (code,student) VALUES (?,?)"
    db.run(sql,[code,student], function (err) {
      if (err) {
          reject(err);
          return;
      }
      db.run(
        `UPDATE courses  
         SET enrolledstudents = (
          CASE
            WHEN enrolledstudents IS NULL 
              THEN 1 
            ELSE 
              enrolledstudents + 1
          END)
         WHERE code = ? `, [code], (err) => {
        if (err) {
          reject(err);
          return;
        }
        else
          resolve();
      });
     
    })
  })
}

function createPlan(plan,student) { 
  return new Promise(async (resolve, reject) => {

    const oldPlan = await retrieveStudyPlan(student);
    await deletePlan(student, oldPlan)
   
    Promise.all(plan
      .map((c) => addCourseToPlan(c.code,student)))
        .then(() => {
          resolve();
        });
  });
}

function updateCourse(code) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE courses  
            SET enrolledstudents = (
            CASE
              WHEN enrolledstudents = 1 
                THEN NULL 
              ELSE 
                enrolledstudents - 1
            END)
            WHERE code = ? `, [code], (err) => {
      if (err) {
        reject(err);
        return;
      }
      else
        resolve();
    }) 
  })
}

function deletePlan(student) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM studyplan WHERE student=?", [student], (err,planRows) => {
      if (err) {
        reject(err);
        return;
      }
      Promise.all(planRows
        .map((c) => updateCourse(c.code)))
          .then(() => {
            db.run("DELETE FROM studyplan WHERE student=?", [student], (err) => {
              if (err) {
                reject(err);
                return;
              }
              else 
                resolve();
            });
          });
    }) 
  })
}

module.exports = { getUser, getUserById, retrieveCourses, retrieveStudyPlan, createPlan, deletePlan };