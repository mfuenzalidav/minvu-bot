var restify             = require('restify');
var builder             = require('botbuilder');
var botbuilder_azure    = require("botbuilder-azure");
const soap              = require('soap')
var Rut                 = require('rutjs')
var dinbot              = require('./extensions/dinbot')
//const dotenv            = require('dotenv').config({ path: '.env' });

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
   console.log('%s listening to %s', server.name, server.url); 
});
  
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

server.post('/api/messages', connector.listen());

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

var bot = new builder.UniversalBot(connector);
//Para uso propio de AZURE
bot.set('storage', tableStorage);

bot.use({
    botbuilder: function (session, next) {
         session.error = function (err) {
             console.log('--------------ERROR---------------')
             console.log(err)
         };
         next();         
    },
    receive: function (event, next) {
        //console.log('--------------receive---------------')
        //console.log(event)
        next();
    },
    send: function (event, next) {
        //console.log('--------------send---------------')
        //console.log(event)
        next();
    },
    
});

var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var recognizer = new builder.LuisRecognizer(LuisModelUrl);

dinbot.set(bot,builder,recognizer)
dinbot.setPrompts()
dinbot.setDialogs()

var intents = new builder.IntentDialog({ recognizers: [recognizer] })

.matches('Saludo', function(session){
    //session.beginDialog('Saludo');
    session.beginDialog('MenuAyuda','MenuInicio');
})
.matches('Ayuda', function(session){
    session.beginDialog('MenuAyuda','MenuInicio');
})
.matches('Cancelar', function(session){
    //session.beginDialog('Cancelar');
})
.matches('Despedida', function(session){
    session.beginDialog('Despedida');
})
.matches('RSH.ObtenerTramo', function(session, args){
    dinbot.beginDialog('ObtenerTramoRsh', session, args);
})
.matches('RSH.ObtenerGrupoFamiliar', function(session){    
    dinbot.beginDialog('ObtenerGrupoFamiliarRsh', session);
})
.matches('RegistroCivil.InformacionGeneral', function(session){
    dinbot.beginDialog('RegistroCivilInfoGeneral',session);
})
.matches('SPS.EstadoPago', function(session){
    dinbot.beginDialog('SPSEstadoPago',session);
})
.matches('Aranda.Incidente', function(session){
    dinbot.beginDialog('ArandaIncidente',session);
})
.matches('Aranda.Requerimiento', function(session){
    dinbot.beginDialog('ArandaRequerimiento',session);
})
.matches('Juegos.Ahorcado',function(session){
    dinbot.beginDialog('JuegosAhorcado',session);    
})
.matches('DS49.EstadoPostulacion',function(session){
    dinbot.beginDialog('DS49EstadoPostulacion',session);    
})
.matches('DS49.EstadoProyecto',function(session){
    dinbot.beginDialog('DS49EstadoProyecto',session);    
})
.onDefault((session) => {
    session.send('lo lamento, no entiendo lo que has dicho \'%s\'.', session.message.text);
});

bot.dialog('/', intents);  

bot.dialog('Saludo', [
    function (session, args, next) {
        session.endDialog('Encantado, soy DinBot 🤖. ¿en qué puedo ayudarle?')
    },
]);
/*
bot.dialog('Ayuda', [
    function (session, args, next) {
        session.endDialog('Ha consultado por ayuda, por ahora solo puedo obtener la información del Tramo y el Grupo Familiar en RSH.\n!Pronto tendré más opciones!.');
    },
]);*/
bot.dialog('Despedida', [
    function (session, args, next) {
        session.endConversation('Ha sido un placer ayudarle. ¡Que tenga un buen día! 👋👾',session.message.text);
    },
]);

bot.on('conversationUpdate', function (message) {
    /*
    if (message.membersAdded && message.membersAdded.length > 0) {
        // Say hello
        var isGroup = message.address.conversation.isGroup;
        var txt = isGroup ? "Hello everyone!" : "Hello...";
        var reply = new builder.Message()
                .address(message.address)
                .text(txt);
        bot.send(reply);
    } else if (message.membersRemoved) {
        // See if bot was removed
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                bot.send(reply);
                break;
            }
        }
    }*/
});