const sql = require('mssql')
const util = require('util')
const axios = require('axios')


function DS49EstadoProyecto(builder) {
    this.dialogId = 'DS49EstadoProyecto'

    this.dialog = [(session, args, next) => {

       // session.send('¡Muy bien! Vamos a realizar una consulta para verificar estado de proyecto en DS49 😁');

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
            session.endDialog('Has cancelado la consulta del estado de proyecto DS49 😭. ¡Vuelve Pronto!');            
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

        new sql.ConnectionPool(process.env.DBRukanMigra)
        .connect().then(pool => {
            // Query
            //Obtiene el PA de consumo de Rukan
            return pool.request()
                .input('GRU_ID', sql.Int, codigo)
                .execute('RUKAN_MIGRA_USP_CON_DINBOT_ESTADO_PROYECTO_DS49')
        }).then(result => {
            //si encuentra resultado crea la tarjetas, en caso de no encontrar resultado entrega mensaje que no encuentra registros
            //console.log(result.recordsets)
            if (result.recordsets[0].length > 0) {
                item = result.recordsets[0]
                //Manda el proyecto encontrado para crearlo en tarjeta
                var card = createHeroCard(session, codigo, item)

                var reply = new builder.Message(session).addAttachment(card);

                session.send(`Con respecto a la consulta del estado de proyecto en DS49 del código: ${codigo} le puedo dar la siguiente información:`)
                session.send(reply)
                session.beginDialog('MenuAyuda','MenuFinal'); 
            }
            else
            {
                session.send('Con respecto a su consulta del estado de proyecto en DS49 del rut: No se encontraron registros')
                session.beginDialog('MenuAyuda','MenuFinal'); 
            }

            sql.close()
        }).catch(err => {
            session.send('Lo siento, hubo un error al consultar sobre el estado de proyecto en DS49 del rut: ' + codigo)

            console.log('error')
            console.dir(err)
            sql.close()            
            session.beginDialog('MenuAyuda','MenuFinal'); 
        });
    session.endDialog()
}]

function createHeroCard(session, codigoProyecto, objProyecto) {
    var detalleProyecto;
    var noAplica = 'N/A';
    var nombreProyecto = objProyecto[0].Nombre_Proyecto;

    detalleProyecto = `**CÓDIGO DE PROYECTO**: ${objProyecto[0].Codigo_Proyecto}`
        + `\n\n**NOMBRE PROYECTO**: ${objProyecto[0].Nombre_Proyecto}`
        + `\n\n**TIPOLOGÍA DE PROYECTO**: ${objProyecto[0].Tipo_Proyecto}`
        + `\n\n**ESTADO**: ${objProyecto[0].Estado_Proyecto}`   
        + `\n\n**N° VIVIENDAS**: ${objProyecto[0].Viviendas_Adscritas}` 
        + `\n\n**N° FAMILIAS ADSCRITAS**: ${objProyecto[0].Numero_Viviendas}`     
        + `\n\n**MONTO TOTAL SUBSIDIO**: ${objProyecto[0].Total_Subsidios}`   
        + `\n\n**MONTO TOTAL AHORROS + APORTES ADICIONALES**: ${objProyecto[0].Suma_Total_Ahorro_Aporte}`   

    return new builder.HeroCard(session)
        .title('Banco de Postulaciones DS49 - Estado de Proyecto')
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
exports.DS49EstadoProyecto = DS49EstadoProyecto;