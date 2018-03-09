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

        session.send('¡Muy bien! Vamos a realizar una consulta en el servicio de RSH 😁');
        
        if (!groups || !RutValido) {
            session.send(!RutValido ? 'El rut no es válido 😒' : 'Debes entregarme un rut para consultar 🙄')
            builder.Prompts.ValidarRut(session, "🤔... ¿Cuál rut vamos a consultar? 😈");

        }
         else {
            next({ response: groups[0] });
        }
    },
    (session, results) => {
        if (results === 'cancel')
        session.endDialog('Has cancelado la consulta del tramo en RSH 😭. ¡Vuelve Pronto!');

        var rut = new Rut(results.response);
        var digitos = rut.rut;
        var verificador = rut.checkDigit;    

        var args = { entradaRSH: { Rut: digitos, Dv: verificador, Periodo: '-1', UsSist: '1' } };

        session.send('Me pediste el siguiente rut: ' + rut.getNiceRut() + ' 📍');

        soap.createClient(process.env.SOAP_RSH, function (err, client) {
            if (err) {
                console.log('ERROR EN RSH TRAMO' + err)
                session.send('¡Lo lamento!, 😭, hubo un error al consultar el servicio de RSH 😅');

            }
            else {
                client['ObtenerRegistroSocialHogaresAsync'](args).then((result) => {
                    console.log(result)
                    if (!result.ObtenerRegistroSocialHogaresResult.RESULTADO ||
                        !result.ObtenerRegistroSocialHogaresResult.RESPUESTA ||
                        !result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH) {
                        session.send('¡Lo lamento!, 😭, no pude obtener datos del servicio de RSH 😅');
                    }
                    else {
                        if (result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.Estado === 1){
                            const objetoRsh = result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.RshMinvu                            
                            const rutCompleto = rut.getNiceRut()

                            var card = createHeroCard(session, rutCompleto, objetoRsh);
                            var msg = new builder.Message(session).addAttachment(card);
                            session.send(msg);

                        }
                        else if (result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.Estado === 2)
                            session.send('¡Pucha! el tramo del rut consultado' + rut.getNiceRut() + ' no tiene registros en RSH 😢');
                        else
                            session.send('Intente consultar el tramo en RSH pero no reconozco la información que me entrega 😟');
                    }
                }).catch((err) => {
                    console.log('ERROR EN RSH TRAMO' + err)

                    session.send('¡Lo lamento!, 😭, hubo un error al consultar el servicio de RSH 😅');
                });
            }
        })
        session.endDialog()
    }]

    function createHeroCard(session, rutCompleto, objetoRsh) {
        
        var datosPersona = '';
        datosPersona = `${datosPersona} 
        `+ `\n **NOMBRE:** ${objetoRsh.Nombres} ${objetoRsh.ApellidoPaterno} ${objetoRsh.ApellidoMaterno}
        `+ `\n **TRAMO:** ${objetoRsh.Tramo}`
        
        //console.log(datosPersona);
        return new builder.HeroCard(session)
            .title('RSH.- Tramo')
            .subtitle('Rut: ' +rutCompleto)
            .text(datosPersona)
            .images([builder.CardImage.create(session, process.env.BANNER_GOB)]);
    }

}
exports.RSHTramo = RSHTramo;