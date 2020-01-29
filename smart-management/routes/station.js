const express = require('express');
const firebase = require('firebase');
const auth = require('./middleware/auth');
const Device = require('../models/devices');
const Client = require('../models/clients');
const Station = require('../models/station');
const Manager = require('../models/manager');
const User = require('../models/user');
const Sensor = require('../models/sensor');
const split = require('split-string');

const router = express.Router();

router.get('/signup', auth.isAuthenticated, auth.isManager, (req, res) => {
  res.render('manager/registerWorkStation', { title: 'Cadastro Estação de Trabalho', layout: 'layoutdashboardmanager' });
});

router.get('/', auth.isAuthenticated, auth.isManager, (req, res) => {
  res.render('manager/registerWorkStationHome', { title: 'Cadastro Estação de Trabalho', layout: 'layoutdashboardmanager' });
});

router.get('/list', auth.isAuthenticated, auth.isManager, (req, res) => {
  const idm = req.session.id_t;
  console.log("Logado: " + req.session._id);
  Station.getByManager(req.session._id).then((stations) => {
    console.log(stations);
    res.render('manager/registerWorkStationHome', { title: 'Lista de Estações de Trabalho', layout: 'layoutdashboardmanager', stations });
  }).catch((error) => {
    res.redirect('/error');
    console.log(error);
  });
});


router.get('/movimentation/:id', auth.isAuthenticated, auth.isManager, (req, res) => {
  Device.getById(req.params.id).then((device) => {
    Client.getById(device.client).then((client) => {
      console.log(client);
      res.render('admin/deviceMove', { title: 'Movimentação de Aparelhos', layout: 'layoutdashboardmanager', device, client });
    });
  });
});


router.get('/edit/:id', auth.isAuthenticated, auth.isManager, (req, res) => {
  Station.getById(req.params.id).then((station) => {
    console.log(station);
    User.getById(station.manager).then((manager) => {
      console.log(manager);
      res.render('manager/registerWorkStationEdit', { title: 'Edição da Estação de Trabalho', layout: 'layoutdashboardmanager', station, manager });
    });
  });
});

/* GET cadastroClientes page. */
router.get('/logUse/:id', auth.isAuthenticated, auth.isManager, (req, res) => {
  Station.getById(req.params.id).then((station) => {
    console.log(station);
    Sensor.getByCodestation(station.codeStation).then((log) => {
      console.log(log);
      console.log("log");
      User.getById(station.manager).then((manager) => {
        console.log(manager);
        res.render('manager/logUse', { title: 'Log de Uso', layout: 'layoutdashboardmanager', station, manager, log });

      });
    });
  });
});

router.post('/signup', function (req, res, next) {
  const ativa = req.body.station;
  var inTime = split(ativa.inputTime.inputHour, { separator: ':' });
  ativa.inputTime.inputHour = inTime[0];
  ativa.inputTime.inputMin = inTime[1];
  var outTime = split(ativa.outputTime.outputHour, { separator: ':' });
  ativa.outputTime.outputHour = outTime[0];
  ativa.outputTime.outputMin = outTime[1];
  ativa.id_m = req.session.id_t;
  ativa.manager = req.session._id;
  Station.create(ativa).then((id) => {
    res.redirect('/station/list');
    }).catch((error) => {

      console.log("Matrícula já esta sendo usada");
      console.log(error);
      res.redirect('/station/signup');
      req.flash('danger', 'JÁ EM USOOOOOOOOO');
  });
});

router.post('/delete/:id', (req, res) => {
  Station.delete(req.params.id).then((resolve) => {
    res.redirect('/station/list');
  }).catch((error) => {
    console.log(error);
    res.redirect('/error');
  });
});

router.post('/:id', (req, res) => {
  const station = req.body.station;
  var inTime = split(station.inputTime.inputHour, { separator: ':' });
  station.inputTime.inputHour = inTime[0];
  station.inputTime.inputMin = inTime[1];
  var outTime = split(station.outputTime.outputHour, { separator: ':' });
  station.outputTime.outputHour = outTime[0];
  station.outputTime.outputMin = outTime[1];
  console.log("____________________________________________");
  console.log(station);
  console.log("____________________________________________");

  const stationId = req.params.id;
  Station.getById(req.params.id).then((oldStation) => {
    //    Manager.removeStation(oldStation.manager, stationId).catch((error) => {
    //      console.log(error);
    //      res.redirect('/error');
    //    });
    delete oldStation;
    Manager.getByCodManager(station.codManager).then((manager) => {
      //station.manager = manager;
      console.log("mg:" + manager);
      // delete manager.codManager;
      Manager.addStation(manager, stationId).catch((error) => {
        console.log(error);
        res.redirect('/station/list');
      });
      Station.update(req.params.id, station).then(() => {
        res.redirect('/station/list');
      }).catch((error) => {
        console.log(error);
        res.redirect('/error');
      });
    });
  });
});

module.exports = router;
