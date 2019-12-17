const express = require('express');
const firebase = require('firebase');
const auth = require('./middleware/auth');
const Device = require('../models/devices');
const Client = require('../models/clients');
const Station = require('../models/station');
const Manager = require('../models/manager');
const User = require('../models/user');

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Login', layout: 'layout'});
});

/* GET dashboard page. */
router.get('/dashboard',auth.isAuthenticated,(req, res) => {
  console.log(req.session);
  res.render('dashboard', { title: 'Home' });
});


/* POST Login */
router.post('/login', (req, res) => {
  const user = req.body.user;
  firebase.auth().signInWithEmailAndPassword(user.email, user.password).then((userID) => {
    User.getByUid(userID.user.uid).then((currentLogged) => {
      // req.session.user.uid = currentLogged.user.uid;
      // req.session.email = currentLogged.user.email;
      const userR = {
        name: currentLogged.name,
        mid: currentLogged.mid,
        uid: currentLogged.uid,
        email: currentLogged.email,
        type: currentLogged.type
      };
      req.session.user = currentLogged;
      console.log(req.session.user);
      if(userR.type == "Gestor"){
        res.redirect('/logUse');
      }
      if(userR.type == "ClienteADM"){
        res.redirect('/manager/list');
      }
      if(userR.type == "ADM"){
        res.redirect('/client/list');
      }
    }).catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message
    });
  }).catch((error) => {
      switch (error.code) {
     case 'auth/wrong-password':
       req.flash('danger', 'Senha incorreta.');
       break;
     case 'auth/user-not-found':
       req.flash('danger', 'Email não cadastrado.');
       break;
     case 'auth/network-request-failed':
       req.flash('danger', 'Falha na internet. Verifique sua conexão de rede.');
       break;
     default:
       req.flash('danger', 'Erro indefinido.');
   }
   console.log(`Error Code: ${error.code}`);
   console.log(`Error Message: ${error.message}`);
   res.redirect('/');

  });
});


// GET /logout
router.get('/logout', (req, res, next) => {
  firebase.auth().signOut().then(() => {
      // delete req.session.fullName;
      // delete req.session.userId;
      delete req.session.user;
      res.redirect('/');
    }).catch((error) => {
      console.log(error);
      res.redirect('/error');
    });
  });

module.exports = router;
