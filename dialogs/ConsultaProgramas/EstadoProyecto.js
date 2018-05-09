const sql = require('mssql')
const util = require('util')
const axios = require('axios')


function EstadoProyecto(builder) {
    this.dialogId = 'EstadoProyecto'

    this.dialog = [(session, args, next) => {

        session.send('¡Muy bien! Vamos a realizar una consulta para verificar estado de proyecto 😁');

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
                codigos.push(match)
            });
        }

        if (codigos.length === 0) {
            builder.Prompts.NumerosIncidentes(session, "¿Cuál es el código de proyecto que quieres consultar? 🤔");

        }
        else {
            next({ response: codigos });
        }
    },
    (session, results,next) => {
        if (results === 'cancel')
        {
            session.endDialog('Has cancelado la consulta del estado de proyecto 😭. ¡Vuelve Pronto!');            
            session.beginDialog('MenuAyuda','MenuFinal'); 
        }
        else {
            var codigos = results.response;
            if (codigos.length > 1) {
                builder.Prompts.choice(session, "Me enviaste más de un código de proyecto, ¿cuál quieres consultar? :O", codigos, { listStyle: builder.ListStyle.button });
            }
            else {
                next({ response: codigos[0] })
            }
        }
    }, 
    (session, results, next)=> {
        var codigo
        if (!util.isNullOrUndefined(results.response.entity))
            codigo = results.response.entity
        else
            codigo = results.response

            const url = process.env.DINBOT_API + `/EstadoProyecto/EstadoProyecto/${codigo}`;
            axios.get(url)
                .then(function (response) {
                    if (response.status == 200) {
                        if(response.data.length > 0){
                            //si encuentra resultado crea las tarjetas, en caso de no encontrar resultado entrega mensaje que no encuentra registros            
                            var cards = new Array();
                            //Manda las postulaciones encontradas para crearlos en tarjetas
                            for (var i = 0; i < response.data.length; i++) {
                                var item = response.data[i]
                                //lo agrega a un array de tarjetas
                                cards.push(createHeroCard(session, codigo, item))
                            }
    
                            //crea un carousel con las tarjetas antes creadas
                            var reply = new builder.Message(session)
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(cards)
    
                                session.send(`Con respecto a la consulta del estado de proyecto para el código: ${codigo} le puedo dar la siguiente información:`)
                                session.send(reply)
                                session.beginDialog('MenuAyuda','MenuFinal');
                        }
                        else{
                            session.send(`Con respecto a su consulta del estado de proyecto para el código: ${codigo} No se encontraron registros`)
                            session.beginDialog('MenuAyuda','MenuFinal'); 
                        }
                    }
                    else
                    {
                        session.send(`Con respecto a su consulta del estado de proyecto para el código: ${codigo} No se encontraron registros`)
                session.beginDialog('MenuAyuda','MenuFinal'); 
                    }            
                })
                .catch(function (error) {
                    session.send('Lo siento, hubo un error al consultar sobre el estado de proyecto para el código: ' + codigo)

                    console.log('error')
                    console.dir(error)        
                    session.beginDialog('MenuAyuda','MenuFinal'); 
                });
    
    session.endDialog()
}]

function createHeroCard(session, codigoProyecto, objProyecto) {
    var detalleProyecto;
    var noAplica = 'N/A';
    var nombreProyecto = objProyecto.Nombre_Proyecto;

    detalleProyecto = `**CÓDIGO DE PROYECTO**: ${objProyecto.Codigo_Proyecto}`
        + `\n\n**NOMBRE PROYECTO**: ${objProyecto.Nombre_Proyecto}`
        + `\n\n**TIPOLOGÍA DE PROYECTO**: ${objProyecto.Tipo_Proyecto}`
        + `\n\n**ESTADO**: ${objProyecto.Estado_Proyecto}`   
        + `\n\n**N° VIVIENDAS**: ${objProyecto.Viviendas_Adscritas}` 
        + `\n\n**N° FAMILIAS ADSCRITAS**: ${objProyecto.Numero_Viviendas}`     
        + `\n\n**MONTO TOTAL SUBSIDIO**: ${objProyecto.Total_Subsidios}`   
        + `\n\n**MONTO TOTAL AHORROS + APORTES ADICIONALES**: ${objProyecto.Suma_Total_Ahorro_Aporte}`   

    return new builder.HeroCard(session)
        .title('Estado de Proyecto')
        .subtitle(codigoProyecto)        
        .text(detalleProyecto)
        .images([
            builder.CardImage.create(session, 'http://cdn.minvu.cl/NGM5.0/images/line-head-title.jpg')
        ])
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
exports.EstadoProyecto = EstadoProyecto;