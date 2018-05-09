const soap = require('soap')
var Rut = require('rutjs')
const helper = require('../../extensions/helper');


function RCivilInfoGeneral(builder) {
    this.dialogId = 'RegistroCivilInfoGeneral'

    this.dialog = [(session, args, next) => {

        //regex para detectar rut entre texto
        const regex = /(0?[1-9]{1,2})(((\.\d{3}){2,}\-)|((\d{3}){2,}\-)|((\d{3}){2,}))([\dkK])/g;
        //obtiene los grupos reconocidos según el regex
        var groups = (new RegExp(regex)).exec(session.message.text)
        //en caso de obtener los grupos validos del regex en el texto se genera como rut para validar, en caso contrario no se encuentra rut.
        var RutValido = groups ? new Rut(groups[0]).validate() : false;

        session.send('¡Muy bien! Vamos a realizar una consulta en el Registro Civil 😁');

        if ((!groups && !RutValido) || !groups) {
            builder.Prompts.ValidarRut(session, "🤔... ¿Cuál rut vamos a consultar? 😈");
        } else {
            next({ response: groups[0] });
        }
    },
    (session, results) => {
        if (results === 'cancel')
        {
            session.endDialog('Has cancelado la consulta de información en Registro Civil 😭. ¡Vuelve Pronto!');            
            session.beginDialog('MenuAyuda','MenuFinal'); 
        }

        var rut = new Rut(results.response);
        var digitos = rut.rut;
        var verificador = rut.checkDigit;

        var args ={ _xml: '<ope_prt_regcivil_info_persona xmlns="http://minvu/ice/regcivil">'
                                               + '<Infopersona xmlns="http://info_persona.Schema_info_persona_conice">'
                                               + '  <Rut xmlns="">' + digitos + '</Rut>'
                                               + '  <Dv xmlns="">' + verificador + '</Dv>'
                                               + '  <Periodo xmlns="">0</Periodo>'
                                               + '  <Ussist xmlns="">0</Ussist>'
                                               + '</Infopersona>'
                                               + '</ope_prt_regcivil_info_persona>"' };



        session.send('Me pediste información del siguiente rut: ' + rut.getNiceRut() + ' 📍');
        onWaitGif(session);

        soap.createClient(process.env.SOAP_RCIVIL, function (err, client) {
            if (err) {
                session.send('¡Lo lamento! 😭, hubo un error al consultar el servicio de información de registro civil 😅');
                session.beginDialog('MenuAyuda','MenuFinal'); 
                console.log(err);
            }
            else {
                client['ope_prt_regcivil_info_personaAsync'](args).then((result) => {
                    console.log(result);
                    if (!result.ICE.RESULTADO ||
                        !result.ICE.minvuRutData ||
                        !result.ICE.minvuRutData.persona) {
                        session.send('¡Lo lamento! 😭, no pude obtener los datos del servicio de información de registro civil 😅')
                        session.beginDialog('MenuAyuda','MenuFinal'); 
                    }
                    else {
                        if (result.ICE.RESULTADO.ESTADO === 1){
                                const objRegistroCivil = result.ICE.minvuRutData
                                const rutCompleto = rut.getNiceRut()


                            var cards = getCardsAttachments(session, rutCompleto, objRegistroCivil);

                            // create reply with Carousel AttachmentLayout
                            var reply = new builder.Message(session)
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(cards);
                          
                                session.send(reply);
                                session.beginDialog('MenuAyuda','MenuFinal'); 
                            }
                        else if (result.ICE.RESULTADO.ESTADO === 0)
                        {
                            session.send('¡Pucha! no encontré información en Registro Civil para el rut consultado' + rut.getNiceRut() + ' 😢');                            
                            session.beginDialog('MenuAyuda','MenuFinal'); 
                        }
                        else
                        {
                            session.send('Intente consultar la información del Registro Civil, pero no reconozco la información que me entrega el servicio 😟');
                            session.beginDialog('MenuAyuda','MenuFinal');  
                        }

                    }
                }).catch((err) => {
                    console.log(err)
                    session.send('Intenté consultar la información del Registro Civil, pero hubo un error al consultar el servicio 😭');
                    session.beginDialog('MenuAyuda','MenuFinal'); 
                });
            }
        })
        session.endDialog()
    }]

function getCardsAttachments(session, rutCompleto, objRegistroCivil) {
    var array = new Array();
    array.push(createPersonaHeroCard(session, rutCompleto, objRegistroCivil.persona))
    if (objRegistroCivil.matrimonio)
        array.push(createMatrimonioHeroCard(session, rutCompleto,objRegistroCivil.matrimonio))    

    if (objRegistroCivil.hijo)
    {
        for(var i = 0; i < objRegistroCivil.hijo.length;i++)
        {
            array.push(createNucleoHeroCard(session, rutCompleto, objRegistroCivil.hijo[i]))
        }
    }
    return array
}


function createPersonaHeroCard(session, rutCompleto, objPersona) {
    var datosPersona = '';
    var FechaNacimiento = helper.getFormateaFecha(objPersona.fechaNaci);
    var FechaDefuncion = helper.getFormateaFecha(objPersona.fechaDefun);
    var FechaVencDiscapacidad = helper.getFormateaFecha(objPersona.discapacidad.fechaVenc);

    datosPersona = `${datosPersona} 
        `+ `\n **NOMBRE:** ${objPersona.nombres} ${objPersona.apPaterno} ${objPersona.apMaterno}
        `+ `\n **FECHA NACIMIENTO:** ${FechaNacimiento}
        `+ `\n **ESTADO CIVIL:** ${objPersona.estadoCivil}
        `+ `\n **FECHA DE DEFUNCIÓN:** ${FechaDefuncion}
        `+ `\n **ESTADO CIVIL:** ${objPersona.estadoCivil}
        `+ `\n **NACIONALIDAD:** ${objPersona.nacionalidad}
        `+ `\n **GÉNERO:** ${objPersona.sexo}
        `+ `

        `+ `**INFORMACIÓN DISCAPACIDAD**
        `+ `\n **MENTAL:** ${objPersona.discapacidad.mental}
        `+ `\n **SENSORIAL:** ${objPersona.discapacidad.sensorial}
        `+ `\n **FÍSICA:** ${objPersona.discapacidad.fisica}
        `+ `\n **FECHA DE VENCIMIENTO:** ${FechaVencDiscapacidad}`

    //console.log(datosPersona);
    return new builder.HeroCard(session)
        .title('Registro Civil - Datos Persona')
        .subtitle('Rut: ' + rutCompleto)
        .text(datosPersona)
        .images([
            builder.CardImage.create(session, process.env.BANNER_GOB)
        ]);
}

function createMatrimonioHeroCard(session,rutCompleto, objMatrimonio) {

    var datosConyuge = '';
    var rutConyuge = '';    

    for (var i = 0; i < objMatrimonio.length; i++) {
        var FechaNacimiento = helper.getFormateaFecha(objMatrimonio[i].conyuge[i].fechaNaci);
        var FechaDefuncion = helper.getFormateaFecha(objMatrimonio[i].conyuge[i].fechaDefun);
        var FechaVencDiscapacidad = helper.getFormateaFecha(objMatrimonio[i].conyuge[i].discapacidad.fechaVenc);

        datosConyuge = `${datosConyuge} 
        `+ `\n **NOMBRE:** ${objMatrimonio[i].conyuge[i].nombres} ${objMatrimonio[i].conyuge[i].apPaterno} ${objMatrimonio[i].conyuge[i].apMaterno}
        `+ `\n **FECHA DE NACIMIENTO:** ${FechaNacimiento}
        `+ `\n **ESTADO CIVIL:** ${objMatrimonio[i].conyuge[i].estadoCivil}
        `+ `\n **FECHA DE DEFUNCIÓN:** ${FechaDefuncion}
        `+ `\n **GÉNERO:** ${objMatrimonio[i].conyuge[i].sexo}
        `+ `\n **CAPITULACIÓN:** ${objMatrimonio[i].capitulacion}
        `+ `\n **FECHA INSCRIPCIÓN MATRIMONIO:** ${objMatrimonio[i].fechaInscripcionMatrimonio}
        `+ `
        
        `+ `**INFORMACIÓN DISCAPACIDAD**
        `+ `\n **MENTAL:** ${objMatrimonio[i].conyuge[i].discapacidad.mental}
        `+ `\n **SENSORIAL:** ${objMatrimonio[i].conyuge[i].discapacidad.sensorial}
        `+ `\n **FÍSICA:** ${objMatrimonio[i].conyuge[i].discapacidad.fisica}
        `+ `\n **FECHA DE VENCIMIENTO:** ${FechaVencDiscapacidad}`

        rutConyuge = `${objMatrimonio[i].conyuge[i].rut}`;
    }


    return new builder.HeroCard(session)
        .title('Registro Civil - Información Cónyuge')
        .subtitle('Rut: ' + rutCompleto)
        .text(datosConyuge)
        .images([
            builder.CardImage.create(session, process.env.BANNER_GOB)
        ]);
}

function createNucleoHeroCard(session, rutCompleto,objNucleo) {
    var datosNucleo = '';
    var FechaNacimiento = helper.getFormateaFecha(objNucleo.fechaNaci);
    var FechaDefuncion = helper.getFormateaFecha(objNucleo.fechaDefun);
    var FechaVencDiscapacidad = helper.getFormateaFecha(objNucleo.discapacidad.fechaVenc);

    datosNucleo = `${datosNucleo} 
        `+ `\n **NOMBRE:** ${objNucleo.nombres} ${objNucleo.apPaterno} ${objNucleo.apMaterno}
        `+ `\n **FECHA DE NACIMIENTO:** ${FechaNacimiento}
        `+ `\n **ESTADO CIVIL:** ${objNucleo.estadoCivil}
        `+ `\n **FECHA DE DEFUNCIÓN:** ${FechaDefuncion}
        `+ `\n **GÉNERO:** ${objNucleo.sexo}     
        `+ `

        `+ `**INFORMACIÓN DISCAPACIDAD**
        `+ `\n **MENTAL:** ${objNucleo.discapacidad.mental}
        `+ `\n **SENSORIAL:** ${objNucleo.discapacidad.sensorial}
        `+ `\n **FÍSICA:** ${objNucleo.discapacidad.fisica}
        `+ `\n **FECHA DE VENCIMIENTO:** ${FechaVencDiscapacidad}  
        `+ `


        `

console.log(datosNucleo);
return new builder.HeroCard(session)
    .title('Registro Civil - Núcleo Familiar')
    .subtitle('Rut: ' + rutCompleto)
    .text(datosNucleo)
    .images([
        builder.CardImage.create(session, process.env.BANNER_GOB)
    ]);
}

function onWaitGif(session) {
        var msg = new builder.Message(session).addAttachment(createAnimationCard(session));
        session.send(msg);
    }

    function createAnimationCard(session) {
        return new builder.AnimationCard(session)
            .title('Dinbot Trabajando 😁')
            .subtitle('Estoy buscando los datos que necesita, ¿Me esperarías un ratito? 😇')
            .text('Puedes realizar otras consultas mientras esperas, te enviaré la información cuando la encuentre 🤓')
            /*
            .media([{
                profile: 'gif',
                url: 'https://media3.giphy.com/media/l0MYudxO2MHJDTbVK/giphy.gif'                
            }])
            */
    }    
}
exports.RCivilInfoGeneral = RCivilInfoGeneral;