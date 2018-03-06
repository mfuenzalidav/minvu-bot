const soap  = require('soap')
var Rut     = require('rutjs')


function RSHTramo(builder) {
    //this.builder = builder

    this.dialogId = 'ObtenerTramoRsh'

    this.dialog = [(session, args, next) => {

        //regex para detectar rut entre texto
        const regex = /(0?[1-9]{1,2})(((\.\d{3}){2,}\-)|((\d{3}){2,}\-)|((\d{3}){2,}))([\dkK])/g;
        //obtiene los grupos reconocidos según el regex
        var groups = (new RegExp(regex)).exec(session.message.text)
        //en caso de obtener los grupos validos del regex en el texto se genera como rut para validar, en caso contrario no se encuentra rut.
        var RutValido = groups ? new Rut(groups[0]).validate() : false;
        console.log(RutValido)
        session.send('Ha empezado una consulta del tramo en el servicio de RSH');

        if (!groups || !RutValido) {
            message.send(!RutValido ? 'El rut que quiere consultar esta inválido.' : 'Debe entregarme un rut para consultar.')
            builder.Prompts.ValidarRut(session, "¿Cuál es el rut que quiere consultar?");
        } else {
            next({ response: groups[0] });
        }
    },
    (session, results) => {
        if (results === 'cancel')
            session.endDialog('Ha cancelado la consulta del tramo en RSH');

        var rut = new Rut(results.response);
        var digitos = rut.rut;
        var verificador = rut.checkDigit;    

        var args = { entradaRSH: { Rut: digitos, Dv: verificador, Periodo: '-1', UsSist: '1' } };

        session.send('Ha consultado el tramo del rut: ' + rut.getNiceRut());

        soap.createClient('http://wsminvuni.test.minvu.cl/WSICEMds/RegistroSocialHogares.svc?singleWsdl', function (err, client) {
            if (err) {
                console.log('ERROR EN RSH TRAMO' + err)
                session.send('Con respecto a su consulta al tramo en RSH, lo lamento, tuve un error al consultar el servicio de RSH');
            }
            else {
                client['ObtenerRegistroSocialHogaresAsync'](args).then((result) => {
                    console.log(result)
                    if (!result.ObtenerRegistroSocialHogaresResult.RESULTADO ||
                        !result.ObtenerRegistroSocialHogaresResult.RESPUESTA ||
                        !result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH) {
                        session.send('Con respecto a su consulta al tramo en RSH, lo lamento, no pude obtener datos del servicio RSH')
                    }
                    else {
                        if (result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.Estado === 1){
                            const tramo = result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.RshMinvu.Tramo
                            session.send('Con respecto a su consulta al tramo en RSH, el tramo del rut ' + rut.getNiceRut() + ' es ' + tramo);
                        }
                        else if (result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.Estado === 2)
                            session.send('Con respecto a su consulta al tramo en RSH, el rut ' + rut.getNiceRut() + ' no tiene registros en RSH');
                        else
                            session.send('Con respecto a su consulta al tramo en RSH, no reconozco la información que me entregan');
                    }
                }).catch((err) => {
                    console.log('ERROR EN RSH TRAMO' + err)
                    session.send('Con respecto a su consulta al tramo en RSH, lo lamento, tuve un error en la consulta del tramo de RSH');
                });
            }
        })
        session.endDialog()
    }]

}
exports.RSHTramo = RSHTramo;