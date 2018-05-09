const sql = require('mssql')
var Rut = require('rutjs')
const util = require('util')
const helper = require('../../extensions/helper');

function SPSEstadoPago(builder) {
    this.dialogId = 'SPSEstadoPago'

    this.dialog = [(session, args, next) => {
        //regex para detectar rut entre texto
        const regex = /(0?[1-9]{1,2})(((\.\d{3}){2,}\-)|((\d{3}){2,}\-)|((\d{3}){2,}))([\dkK])/g;
        //obtiene los grupos reconocidos según el regex
        var groups = (new RegExp(regex)).exec(session.message.text)
        //en caso de obtener los grupos validos del regex en el texto se genera como rut para validar, en caso contrario no se encuentra rut.
        var RutValido = groups ? new Rut(groups[0]).validate() : false;

        session.send('Voy a consultar el estado de pago en los sistemas de Pago de Subsidio, por favor espere un poco');

        if ((!groups && !RutValido) || !groups) {
            builder.Prompts.ValidarRut(session, "¿Cuál es el rut que quiere consultar?");
        } else {
            next({ response: groups[0] })
        }
    },
    (session, results) => {
        if (results === 'cancel')
        {
            session.endDialog('Ha cancelado la consulta del estado de pago en los sistemas de Pago de Subsidio');
            session.beginDialog('MenuAyuda','MenuFinal');  
        }

        var rut = new Rut(results.response)
        var digitos = rut.rut
        var verificador = rut.checkDigit

        new sql.ConnectionPool(process.env.DBPagoSubsidios)
            .connect().then(pool => {
                // Query
                //Obtiene el PA de consumo de SPS
                return pool.request()
                    .input('RutBeneficiario', sql.Int, digitos)
                    .input('DigitoVerificador', sql.Char(1), verificador)
                    .execute('USP_CON_SPS_ESTADO_PAGO')
            }).then(result => {
                //si encuentra resultado crea las tarjetas, en caso de no encontrar resultado entrega mensaje que no encuentra registros
                if (result.recordsets[0].length > 0) {
                    var cards = new Array();
                    //Manda los beneficios encontrados para crearlos en tarjetas
                    for (var i = 0; i < result.recordsets[0].length; i++) {
                        item = result.recordsets[0][i]
                        //lo agrega a un array de tarjetas
                        cards.push(createHeroCard(session, rut.getNiceRut(), item))
                    }

                    //crea un carousel con las tarjetas antes creadas
                    var reply = new builder.Message(session)
                        .attachmentLayout(builder.AttachmentLayout.carousel)
                        .attachments(cards)

                    session.send(`Con respecto a la consulta del estado de pago del rut: ${rut.getNiceRut()} le puedo dar la siguiente información:`)
                    session.send(reply)
                    session.beginDialog('MenuAyuda','MenuFinal');  

                }
                else
                {
                    session.send(`Con respecto a su consulta del estado de pago del rut: ${rut.getNiceRut()}, no se encontraron registros`)
                    session.beginDialog('MenuAyuda','MenuFinal');  
                }

                sql.close()
            }).catch(err => {
                session.send('Lo siento, hubo un error al consultar sobre el estado de pago del rut: ' + rut.getNiceRut())
                console.log('error')
                session.beginDialog('MenuAyuda','MenuFinal');  
                console.dir(err)
                sql.close()
            });
        session.endDialog()
    }]

    function createHeroCard(session, rutCompleto, objPersona) {
        var detalleBeneficiario;
        var fechaUltimoPago = helper.getFormateaFecha(objPersona.FechaUltimoPago);

        detalleBeneficiario = `**NÚMERO CERTIFICADO**: ${(util.isNullOrUndefined(objPersona.NumeroCertificado) ? `Sin Registro` : objPersona.NumeroCertificado)}`
            + `\n\n**PROGRAMA ORIGEN**: ${(util.isNullOrUndefined(objPersona.ProgramaOrigen) ? `Sin Registro` : objPersona.ProgramaOrigen)}`
            + `\n\n**PROGRAMA APLICADO**: ${(util.isNullOrUndefined(objPersona.ProgramaAplicado) ? `Sin Registro` : objPersona.ProgramaAplicado)}`
            + `\n\n**MONTO UF OTORGADO**: ${(util.isNullOrUndefined(objPersona.MontoUFOtorgado) ? `Sin Registro` : objPersona.MontoUFOtorgado)}`
            + `\n\n**MONTO UF PAGADO**: ${(util.isNullOrUndefined(objPersona.MontoUFPagado) ? `Sin Registro` : objPersona.MontoUFPagado)}`
            + `\n\n**FECHA ÚLTIMO PAGO**: ${fechaUltimoPago}`

        return new builder.HeroCard(session)
            .title('SPS - Estado de Pago')
            .subtitle('Beneficiario: ' + rutCompleto)
            .text(detalleBeneficiario)
            .images([
                builder.CardImage.create(session, 'http://cdn.minvu.cl/NGM5.0/images/line-head-title.jpg')
            ])
    }

}



exports.SPSEstadoPago = SPSEstadoPago;