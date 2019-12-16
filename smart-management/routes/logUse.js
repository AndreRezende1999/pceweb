const express = require('express');
const firebase = require('firebase');
const Device = require('../models/devices');
const Client = require('../models/clients');
const Station = require('../models/station');
const Manager = require('../models/manager');
const Sensor = require('../models/sensor');

const router = express.Router();

/* GET cadastroClientes page. */
router.get('/', function(req, res, next){
  Sensor.findOneById(325698).then((data) =>{
    console.log(data);
  });
  res.render('manager/logUse', { title: 'Log de Uso', layout: 'layoutdashboardmanager' });
});

module.exports = router;
