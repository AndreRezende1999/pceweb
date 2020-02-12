const express = require("express");
const firebase = require("firebase");
const auth = require("./middleware/auth");
const Device = require("../models/devices");
const Client = require("../models/clients");
const Station = require("../models/station");
const Manager = require("../models/manager");
const Sensor = require("../models/sensor");

const router = express.Router();

router.get("/list", auth.isAuthenticated, auth.isADM, (req, res) => {
  Device.getAll()
    .then(devices => {
      res.render("admin/deviceList", {
        title: "Cadastro de Aparelho",
        layout: "layoutdashboard",
        devices
      });
    })
    .catch(error => {
      res.redirect("error");
      console.log(error);
    });
});
router.get("/move", auth.isAuthenticated, auth.isADM, (req, res) => {
  Device.getAll()
    .then(devices => {
      res.render("admin/deviceMoveHome", {
        title: "Movimentação de Aparelho",
        layout: "layoutdashboard",
        devices
      });
    })
    .catch(error => {
      res.redirect("error");
      console.log(error);
    });
});

router.get("/edit/:id", auth.isAuthenticated, auth.isADM, (req, res) => {
  Device.getById(req.params.id).then(device => {
    Client.getById(device.client).then(client => {
      console.log(client);
      res.render("admin/deviceMove", {
        title: "Edição de Perfil",
        layout: "layoutdashboard",
        device,
        client
      });
    });
  });
});

router.get(
  "/movimentation/:id",
  auth.isAuthenticated,
  auth.isADM,
  (req, res) => {
    Device.getById(req.params.id).then(device => {
      Client.getById(device.client).then(client => {
        console.log(client);
        res.render("admin/deviceRegistrationEdit", {
          title: "Cadastro de Aparelhos",
          layout: "layoutdashboard",
          device,
          client
        });
      });
    });
  }
);

router.get("/signup", auth.isAuthenticated, auth.isADM, (req, res) => {
  res.render("admin/deviceRegistration", {
    title: "Cadastro de Aparelho",
    layout: "layoutdashboard"
  });
});

router.post("/signup", auth.isAuthenticated, auth.isADM, (req, res) => {
  const ativa = req.body.device;
  Device.create(ativa)
    .then(id => {
      console.log("Aparelho criado com sucesso!");
      res.redirect("/device/list");
    })
    .catch(error => {
      console.log(error);
    });
});

router.post("/receiveData::idesp::data::idmac", (req, res) => {
  //Recebe os dados do ESP
  if (!(req.params.idesp && req.params.idmac && req.params.data)) {
    //Verifica se os dados estão corretos
    return res.send("Formato inválido");
  } else {
    //cria variaveis de data atual
    var data = new Date();
    var dia = data.getDay();
    var hour = data.getHours(); //Horário de verão
    var min = data.getMinutes();
    var date = data.getDate();
    var mes = data.getMonth();
    mes++;
    var ano = data.getUTCFullYear();
    const ativa = req.params; //cria objeto dos dados recebidos
    ativa.date = date + "/" + mes + 1 + "/" + ano; //seta string data
    Station.getCodestationByTimeAndIdesp(ativa.idesp, dia, hour, min)
      .then(station => {
        //busca qual funcionario está logado agora
        if (station.codeStation) {
          //verifica se encontrou algum funcionario
          ativa.codeStation = station.codeStation; //atribui codigo de funcionario a estação
          Sensor.create(ativa)
            .then(id => {
              //cria o dado no banco
              //Atualiza o status do usuario
              if (ativa.data == 0) {
                station.dataesp = "Em uso";
                Station.update(station._id, station)
                  .then(() => {})
                  .catch(error => {
                    console.log(error);
                  });
              } else if (ativa.data == 1) {
                station.dataesp = "Desligado";
                Station.update(station._id, station)
                  .then(() => {})
                  .catch(error => {
                    console.log(error);
                  });
              }
            })
            .catch(error => {
              console.log(error);
            });
        } else {
          console.log("Sem funcionarios neste horario!");
        }
      })
      .catch(error => {
        console.log(error);
      });
    return res.send("Recebido");
  }
});

router.post("/:id", auth.isAuthenticated, auth.isADM, (req, res) => {
  const device = req.body.device;
  const deviceId = req.params.id;
  Device.getById(req.params.id).then(oldDevice => {
    Client.removeDevice(oldDevice.client, deviceId).catch(error => {
      console.log(error);
      res.redirect("/error");
    });
    Client.getByCodClient(device.codClient).then(client => {
      device.client = client;
      delete device.codClient;
      Client.addDevice(client, deviceId).catch(error => {
        console.log(error);
        res.redirect("/error");
      });
      Device.update(req.params.id, device)
        .then(() => {
          res.redirect("/device/list");
        })
        .catch(error => {
          console.log(error);
          res.redirect("/error");
        });
    });
  });
});
router.post("/delete/:id", (req, res) => {
  Device.delete(req.params.id)
    .then(resolve => {
      res.redirect("/device/list");
    })
    .catch(error => {
      console.log(error);
      res.redirect("/error");
    });
});
module.exports = router;
