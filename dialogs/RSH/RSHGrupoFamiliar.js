
const soap = require('soap')
var Rut = require('rutjs')
//var card = require('./../../cards/heroCard')

function RSHGrupoFamiliar(builder) {

    this.dialogId = 'ObtenerGrupoFamiliarRsh'
    this.dialog = [
        (session, args,next) => {
            const regex = /(0?[1-9]{1,2})(((\.\d{3}){2,}\-)|((\d{3}){2,}\-)|((\d{3}){2,}))([\dkK])/g;
            var groups = (new RegExp(regex)).exec(session.message.text)
            var RutValido = groups ? new Rut(groups[0]).validate() : false;

            session.send('¡Muy Bien! Ha empezado una consulta del grupo familiar en el servicio de RSH 😁');

            if ((!groups && !RutValido) || !groups) {
                builder.Prompts.ValidarRut(session, "¿Cuál es el rut que quiere consultar? 😇");
            } else {
                next({ response: groups[0] });
            }
        },
        (session, results) => {
            var rut = new Rut(results.response);
            var digitos = rut.rut;
            var verificador = rut.checkDigit;

            var args = { entradaRSH: { Rut: digitos, Dv: verificador, Periodo: '-1', UsSist: '1' } };

            session.send('Ha consultado el grupo familiar del rut: ' + rut.getNiceRut() + ' 📍');
            onWaitGif(session);

            soap.createClient(process.env.SOAP_RSH, function (err, client) {
                if (err) {
                    session.send('Con respecto a su consulta del grupo familiar en RSH, lo lamento, tuve un error al consultar el servicio información de Registro Social de Hogares 😢');
                    console.log(err)
                    session.beginDialog('MenuAyuda','MenuFinal'); 
                }
                else {
                    client['ObtenerRegistroSocialHogaresAsync'](args).then((result) => {
                        if (!result.ObtenerRegistroSocialHogaresResult.RESULTADO ||
                            !result.ObtenerRegistroSocialHogaresResult.RESPUESTA ||
                            !result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH) {
                            session.send('Con respecto a su consulta del grupo familiar en RSH, lo lamento, no pude obtener datos del servicio información de Registro Social de Hogares 😭')
                            session.beginDialog('MenuAyuda','MenuFinal'); 
                        }
                        else {
                            if (result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.Estado === 1) {

                                const objPersona = result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.RshMinvu.Personas
                                const rutCompleto = rut.getNiceRut()

                                var card = createHeroCard(session, rutCompleto, objPersona);
                                var msg = new builder.Message(session).addAttachment(card);
                                session.send(msg);
                                session.beginDialog('MenuAyuda','MenuFinal'); 
                            }
                            else if (result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.Estado === 2)
                            {
                                session.send('Con respecto a su consulta del grupo familiar en RSH, el rut ' + rut.getNiceRut() + ' no cuenta con información en Registro Social de Hogares 😱');
                                session.beginDialog('MenuAyuda','MenuFinal'); 
                            }
                            else
                            {
                                session.send('Con respecto a su consulta del grupo familiar en RSH, pero no reconozco la información que me entrega el servicio 😢');
                                session.beginDialog('MenuAyuda','MenuFinal'); 
                            }                                
                        }
                    }).catch((err) => {
                        console.log(err)
                        session.send('Con respecto a su consulta del grupo familiar en RSH, lo lamento, hubo un error al consultar el servicio de información de Registro Social de Hogares 😭');
                        session.beginDialog('MenuAyuda','MenuFinal'); 
                    });
                }
            })
            session.endDialog()
        }
    ]
    function createHeroCard(session, rutCompleto, objPersona) {

        var nombrecompleto = '';
        for (var i = 0; i < objPersona.Persona.length; i++) {
            nombrecompleto = `${nombrecompleto}
            `+ `\n ${i + 1}.- ${objPersona.Persona[i].Rut}-${objPersona.Persona[i].Dv}`+ ` ${objPersona.Persona[i].Nombres} ${objPersona.Persona[i].Ape1} ${objPersona.Persona[i].Ape2}`
        }

        //console.log(nombrecompleto);
        return new builder.HeroCard(session)
            .title('RSH.- Grupo Familiar')
            .subtitle('Rut: ' +rutCompleto)
            .text(nombrecompleto)
            .images([builder.CardImage.create(session, process.env.BANNER_GOB)]);
    }

    function onWaitGif(session) {
        var msg = new builder.Message(session).addAttachment(createAnimationCard(session));
        session.send(msg);
    }

    function createAnimationCard(session) {
        return new builder.AnimationCard(session)
            .title('Dinbot Trabajando 😁')
            .subtitle('Estoy buscando los datos que necesita, favor espere 😅')
            .text('Puedes realizar otras consultas mientras esperas, te enviaré la información cuando la encuentre 🤓')
            /*
            .media([{
                profile: 'gif',
                url: 'https://media0.giphy.com/media/mIZ9rPeMKefm0/giphy.gif'
            }])
            */
    }
}

exports.RSHGrupoFamiliar = RSHGrupoFamiliar;


