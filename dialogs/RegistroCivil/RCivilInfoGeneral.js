const soap = require('soap')
var Rut = require('rutjs')


function RCivilInfoGeneral(builder) {
    //this.builder = builder

    this.dialogId = 'RegistroCivilInfoGeneral'

    this.dialog = [(session, args, next) => {

        //regex para detectar rut entre texto
        const regex = /(0?[1-9]{1,2})(((\.\d{3}){2,}\-)|((\d{3}){2,}\-)|((\d{3}){2,}))([\dkK])/g;
        //obtiene los grupos reconocidos según el regex
        var groups = (new RegExp(regex)).exec(session.message.text)
        //en caso de obtener los grupos validos del regex en el texto se genera como rut para validar, en caso contrario no se encuentra rut.
        var RutValido = groups ? new Rut(groups[0]).validate() : false;

        session.send('Ha empezado una consulta de datos en el servicio de Registro Civil');

        if ((!groups && !RutValido) || !groups) {
            builder.Prompts.ValidarRut(session, "¿Cuál es el rut que quiere consultar?");
        } else {
            next({ response: groups[0] });
        }
    },
    (session, results) => {
        if (results === 'cancel')
            session.endDialog('Ha cancelado la consulta de datos en el Registro Civil');

        var rut = new Rut(results.response);
        var digitos = rut.rut;
        var verificador = rut.checkDigit;

        // var args = { entradaRCivil: { Rut: digitos, Dv: verificador, Periodo: '-1', UsSist: '1' } };
        var args = {
            _xml: '<ope_prt_regcivil_info_persona xmlns="http://minvu/ice/regcivil">'
                + '<Infopersona xmlns="http://info_persona.Schema_info_persona_conice">'
                + '  <Rut xmlns="">' + digitos + '</Rut>'
                + '  <Dv xmlns="">' + verificador + '</Dv>'
                + '  <Periodo xmlns="">0</Periodo>'
                + '  <Ussist xmlns="">0</Ussist>'
                + '</Infopersona>'
                + '</ope_prt_regcivil_info_persona>"'
        };


        session.send('Ha consultado los datos en Registro Civil del rut: ' + rut.getNiceRut());

        soap.createClient(process.env.SOAP_RCIVIL, function (err, client) {
            if (err) {
                session.send('Con respecto a su consulta de datos en Registro Civil, lo lamento, tuve un error al consultar el servicio de Registro Civil');
                console.log(err)
            }
            else {
                client['ope_prt_regcivil_info_personaAsync'](args).then((result) => {
                    console.log(result);
                    if (!result.ICE.RESULTADO ||
                        !result.ICE.minvuRutData ||
                        !result.ICE.minvuRutData.persona) {
                        session.send('Con respecto a su consulta de datos en Registro Civil, lo lamento, no pude obtener datos del servicio de Registro Civil')
                    }
                    else {
                        if (result.ICE.RESULTADO.ESTADO === 1) {
                            const objRegistroCivil = result.ICE.minvuRutData
                            const rutCompleto = rut.getNiceRut()
                            //console.log(objRegistroCivil);

                            var cards = getCardsAttachments(session, rutCompleto, objRegistroCivil);

                            // create reply with Carousel AttachmentLayout
                            var reply = new builder.Message(session)
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(cards);

                            session.send(reply);
                        }
                        else if (result.ICE.RESULTADO.ESTADO === 0)
                            session.send('Con respecto a su consulta de datos en Registro Civil, no encuentro resultados para el rut ' + rut.getNiceRut() + '.');
                        else
                            session.send('Con respecto a su consulta de datos en Registro Civil, no reconozco la información que me entregan');
                    }
                }).catch((err) => {
                    console.log(err)
                    session.send('Con respecto a su consulta de datos en Registro Civil, lo lamento, tuve un error al consultar el servicio de Registro Civil');
                });
            }
        })
        session.endDialog()
    }]

    function getCardsAttachments(session, rutCompleto, objRegistroCivil) {
        var array = new Array();
        array.push(createPersonaHeroCard(session, rutCompleto, objRegistroCivil.persona))
        if (objRegistroCivil.matrimonio)
            array.push(createMatrimonioHeroCard(session, objRegistroCivil.matrimonio))

            //console.log(array)

        return array
        //createNucleoHeroCard(session, rutCompleto, objRegistroCivil.hijo)

    }

    function createPersonaHeroCard(session, rutCompleto, objPersona) {

        /*
        var datosPersona = `Nombre: ${objPersona.nombres} ${objPersona.apPaterno} ${objPersona.apMaterno}` + `\n` +
        `Fecha de Nacimiento: ${objPersona.fechaNaci}` + `\n` +
        `Estado Civil: ${objPersona.estadoCivil}` + `\n` +
        `Fecha de Defunción: ${objPersona.fechaDefun}` + `\n` +
        `Estado Civil: ${objPersona.estadoCivil}` + `\n` +
        `Nacionalidad: ${objPersona.nacionalidad}` + `\n` +
        `Género: ${objPersona.sexo}`;
        */

        /*
        var datosPersona = `Nombre: ${objPersona.nombres} ${objPersona.apPaterno} ${objPersona.apMaterno}  \n
        Fecha de Nacimiento: ${objPersona.fechaNaci}  \n
        Estado Civil: ${objPersona.estadoCivil}  \n
        Fecha de Defunción: ${objPersona.fechaDefun}  \n
        Estado Civil: ${objPersona.estadoCivil}  \n
        Nacionalidad: ${objPersona.nacionalidad}  \n
        Género: ${objPersona.sexo} \n
        Información Discapacidad \n
        Mental: ${objPersona.discapacidad.mental} \n
        Sensorial: ${objPersona.discapacidad.sensorial}  \n
        Física: ${objPersona.discapacidad.fisica}  \n
        Fecha de Vencimiento: ${objPersona.discapacidad.fechaVenc}`;
        */

        var datosPersona = '';
        datosPersona = `${datosPersona} 
`+ `\n NOMBRE: ${objPersona.nombres} ${objPersona.apPaterno} ${objPersona.apMaterno}
`+ ` \n FECHA NACIMIENTO: ${objPersona.fechaNaci}
`+ `\n ESTADO CIVIL: ${objPersona.estadoCivil}
`+ `\n FECHA DE DEFUNCIÓN: ${objPersona.fechaDefun}
`+ `\n ESTADO CIVIL: ${objPersona.estadoCivil}
`+ `\n NACIONALIDAD: ${objPersona.nacionalidad}
`+ `\n GÉNERO: ${objPersona.sexo}
`+ `\n INFORMACIÓN DISCAPACIDAD
`+ `\n MENTAL: ${objPersona.discapacidad.mental}
`+ `\n SENSORIAL: ${objPersona.discapacidad.sensorial}
`+ `\n FÍSICA: ${objPersona.discapacidad.fisica}
`+ `\n FECHA DE VENCIMIENTO: ${objPersona.discapacidad.fechaVenc}`

        //console.log(datosPersona);
        return new builder.HeroCard(session)
            .title('Registro Civil - Datos Persona')
            .subtitle('Rut: ' + rutCompleto)
            .text(datosPersona)
            .images([
                builder.CardImage.create(session, process.env.BANNER_GOB, )
            ]);
    }

    function createMatrimonioHeroCard(session, objMatrimonio) {

        var datosConyuge = '';
        var rutConyuge = '';
        for (var i = 0; i < objMatrimonio.length; i++) {

            /*
            datosConyuge += `Nombre: ${objMatrimonio[i].conyuge[i].nombres} ${objMatrimonio[i].conyuge[i].apPaterno} ${objMatrimonio[i].conyuge[i].apMaterno}  \n
            Fecha de Nacimiento: ${objMatrimonio[i].conyuge[i].fechaNaci}  \n
            Estado Civil: ${objMatrimonio[i].conyuge[i].estadoCivil}  \n
            Fecha de Defunción: ${objMatrimonio[i].conyuge[i].fechaDefun}  \n
            Género: ${objMatrimonio[i].conyuge[i].sexo} \n
            Capitulación: ${objMatrimonio[i].capitulacion} \n
            Fecha Inscripción Matrimonio: ${objMatrimonio[i].fechaInscripcionMatrimonio} \n`                
            */

            datosConyuge = `${datosConyuge} 
            `+ `\n NOMBRE: ${objMatrimonio[i].conyuge[i].nombres} ${objMatrimonio[i].conyuge[i].apPaterno} ${objMatrimonio[i].conyuge[i].apMaterno}
            `+ `\n FECHA DE NACIMIENTO: ${objMatrimonio[i].conyuge[i].fechaNaci}
            `+ `\n ESTADO CIVIL: ${objMatrimonio[i].conyuge[i].estadoCivil}
            `+ `\n FECHA DE DEFUNCIÓN: ${objMatrimonio[i].conyuge[i].fechaDefun}
            `+ `\n GÉNERO: ${objMatrimonio[i].conyuge[i].sexo}
            `+ `\n CAPITULACIÓN: ${objMatrimonio[i].capitulacion}
            `+ `\n FECHA INSCRIPCIÓN MATRIMONIO: ${objMatrimonio[i].fechaInscripcionMatrimonio}`


            /*Información Discapacidad \n;                
            for (var j = 0; j < objMatrimonio[i].conyuge.length; j++) {
            `${datosConyuge} 
            `+ `Mental: ${objMatrimonio[i].conyuge[j].discapacidad.mental} \n
                Sensorial: ${objMatrimonio[i].conyuge[j].discapacidad.sensorial}  \n
                Física: ${objMatrimonio[i].conyuge[j].discapacidad.fisica}  \n
                Fecha de Vencimiento: ${objMatrimonio[i].conyuge[j].discapacidad.fechaVenc}`;
            }*/

            rutConyuge = `${objMatrimonio[i].conyuge[i].rut}`;
        }

        //console.log(datosConyuge);
        return new builder.HeroCard(session)
            .title('Registro Civil - Datos Cónyuge')
            .subtitle('Rut: ' + rutConyuge)
            .text(datosConyuge)
            .images([
                builder.CardImage.create(session, process.env.BANNER_GOB, )
            ]);
    }

    /*
    function createNucleoHeroCard(session, rutCompleto,objNucleo) {
    }
    */

}
exports.RCivilInfoGeneral = RCivilInfoGeneral;