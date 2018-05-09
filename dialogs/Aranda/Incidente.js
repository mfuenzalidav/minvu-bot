const sql = require('mssql')
const axios = require('axios')
var util = require('util')
const helper = require('../../extensions/helper');

function ArandaIncidente(builder) {
    //this.builder = builder


    this.dialogId = 'ArandaIncidente'

    this.dialog = [(session, args, next) => {


        const regex = /(?:\d{1,})/g
        let m;
        let codigos = new Array();
        //obtiene los grupos reconocidos según el regex
        while ((m = regex.exec(session.message.text)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++
            }
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                //console.log(`Found match, group ${groupIndex}: ${match}`)
                codigos.push(match)
            });
        }

        if (codigos.length === 0) {
            builder.Prompts.NumerosIncidentes(session, "¿Cuál es el incidente que quieres consultar? 🤔");

        }
        else {
            next({ response: codigos });
        }


    },
    (session, results, next) => {

        if (results === 'cancel')
        {
            session.endDialog('Has cancelado la consulta de Incidente Aranda 😭.');
            session.beginDialog('MenuAyuda','MenuFinal')
        }
        else {
            var codigos = results.response;
            if (codigos.length > 1) {
                builder.Prompts.choice(session, "Me enviaste más de un número, ¿cuál quieres consultar? :O", codigos, { listStyle: builder.ListStyle.button });
                //builder.Prompts.choice(session, "Me enviaste más de un número, ¿quieres consultarlos todos? :O", "Sí|No", { listStyle: builder.ListStyle.button });
            }
            else {
                next({ response: codigos[0] })
            }
        }

    },
    (session, results, next) => {
        var codigo
        if (!util.isNullOrUndefined(results.response.entity))
            codigo = results.response.entity
        else
            codigo = results.response

        const url = process.env.DINBOT_API + `/Aranda/Incidente/${codigo}`;
        axios.get(url)
            .then(function (response) {
                if (response.status == 200) {
                    if(response.data){
                    var card = createHeroCard(session, codigo, response.data)

                    var reply = new builder.Message(session).addAttachment(card)
                    session.send('Esta la información del incidente:')
                    session.send(reply)
                    session.beginDialog('MenuAyuda','MenuFinal')      
                    }
                    else{
                        session.send('No existe el incidente')       
                        session.beginDialog('MenuAyuda','MenuFinal')                     
                    }
                }
                else
                {
                    session.send('No obtuve información al consultar el incidente')
                    session.beginDialog('MenuAyuda','MenuFinal')
                }
            })
            .catch(function (error) {
                console.log(error);
                session.send('Tuve un error al consultar el incidente, intenta nuevamente más tarde')
                session.beginDialog('MenuAyuda','MenuFinal')

            });

        session.endDialog()



    }]

    function createHeroCard(session, idIncidente, objIncidente) {      
        var Fecha_Creacion = helper.getFormateaFecha(objIncidente.Fecha_Creacion);
        var Fecha_Solucion_Proyectada = helper.getFormateaFecha(objIncidente.Fecha_Solucion_Proyectada);
        var Fecha_Solucion_Real = helper.getFormateaFecha(objIncidente.Fecha_Solucion_Real);

        var datosPersona = `**Codigo:** ${idIncidente}`
            + `\n\n **Categoria:** ${objIncidente.Categoria}`
            + `\n\n **Estado:** ${objIncidente.Estado}`
            + `\n\n **Autor:** ${objIncidente.Autor}`
            + `\n\n **Especialista:** ${objIncidente.Especialista}`
            + `\n\n **Fecha Creación:** ${Fecha_Creacion}`
            + `\n\n **Fecha Solución Proyectada:** ${Fecha_Solucion_Proyectada}`
            + `\n\n **Fecha Solución Real:** ${Fecha_Solucion_Real}`


        //console.log(datosPersona);
        return new builder.HeroCard(session)
            .title(`Incidente ${idIncidente}`)
            .text(datosPersona)
            .images([
                builder.CardImage.create(session, process.env.BANNER_GOB)
            ]);
    }

}

exports.ArandaIncidente = ArandaIncidente