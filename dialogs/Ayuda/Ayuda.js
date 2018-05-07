var builder             = require('botbuilder');

function Ayuda(builder) {
    this.dialogId = 'MenuAyuda'

    this.dialog = [(session, args, next) => {
        var entrada = args;

        if(entrada == 'MenuInicio')
        {
            session.send('¡Hola!, soy DinBot 🤖.');
            builder.Prompts.choice(session, '¿Quieres ver las opciones que tengo disponibles? o ¿Prefieres realizar una consulta directamente😎?',
            'Ver opciones|Realizar una consulta', { listStyle: builder.ListStyle.button }); 
        }
        else if(entrada == 'MenuFinal')
        {
            builder.Prompts.choice(session, '¿Te puedo ayudar en algo más?',
            'Sí|No', { listStyle: builder.ListStyle.button }); 
        }
    },
    function(session,results)
    {
        session.dialogData.preferencia = results.response.entity;
        switch(session.dialogData.preferencia)
        {
            case 'Ver opciones':
            {
                builder.Prompts.choice(session, '¡Excelente!, Existen las siguientes opciones de consulta ✌:',
                'RSH - Grupo Familiar|RSH - Tramo|Registro Civil|SPS - Estado de Pago|DS49 - Estado Postulación|Banco de Postulaciones - Estado Proyecto|Aranda - Consulta de Requerimiento|Aranda - Consulta de Incidente', 
                { listStyle: builder.ListStyle.button });    
                break;
            }
            case 'Realizar una consulta':
            {
                session.endDialog('No hay problema 😇, ¿Qué deseas consultar?');
                break;
            }
            case 'Sí':
            {
                builder.Prompts.choice(session, '¡Excelente!, Existen las siguientes opciones de consulta ✌:',
                'RSH - Grupo Familiar|RSH - Tramo|Registro Civil|SPS - Estado de Pago|DS49 - Estado Postulación|Banco de Postulaciones - Estado Proyecto|Aranda - Consulta de Requerimiento|Aranda - Consulta de Incidente', 
                { listStyle: builder.ListStyle.button }); 
                break;
            }
            case 'No':
            {
                session.endDialog('Ha sido un placer ayudarle. ¡Que tenga un buen día! 👋👾');
                break;
            }
        }
    },
    function(session,results)
    {
        session.dialogData.consulta = results.response.entity;
        switch(session.dialogData.consulta)
        {
            case 'RSH - Grupo Familiar':
            {
                session.beginDialog('ObtenerGrupoFamiliarRsh');
                break;
            }
            case 'RSH - Tramo':
            {
                session.beginDialog('ObtenerTramoRsh');
                break;
            }
            case 'Registro Civil':
            {
                session.beginDialog('RegistroCivilInfoGeneral');
                break;
            }
            case 'SPS - Estado de Pago':
            {
                session.beginDialog('SPSEstadoPago');
                break;
            }  
            case 'DS49 - Estado Postulación':
            {
                session.beginDialog('DS49EstadoPostulacion');
                break;
            } 
            case 'Banco de Postulaciones - Estado Proyecto':
            {
                session.beginDialog('DS49EstadoProyecto');
                break;
            }      
            case 'Aranda - Consulta de Requerimiento':
            {
                session.beginDialog('ArandaRequerimiento');
                break;
            }   
            case 'Aranda - Consulta de Incidente':
            {
                session.beginDialog('ArandaIncidente');
                break;
            }
        }
    }]
}
exports.Ayuda = Ayuda;