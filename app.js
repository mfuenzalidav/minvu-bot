
var restify             = require('restify');
var builder             = require('botbuilder');
var botbuilder_azure    = require("botbuilder-azure");
const soap              = require('soap')
var Rut                 = require('rutjs')
var dinbot              = require('./extensions/dinbot')
const dotenv            = require('dotenv').config({ path: '.env' });

var server = restify.createServer();
server.listen(process.env.SERVER_PORT, () => {
   console.log('%s listening to %s', server.name, server.url); 
});
  
var connector = new builder.ChatConnector({
    appId: process.env.BOT_APP_ID,
    appPassword: process.env.BOT_APP_PASSWORD,
    openIdMetadata: process.env.BOT_OPEN_ID_METADATA 
});

server.post('/api/messages', connector.listen());

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

var bot = new builder.UniversalBot(connector);

var luisAppId = process.env.LUIS_APP_ID;
var luisAPIKey = process.env.LUIS_API_KEY;
var luisAPIHostName = process.env.LUIS_API_HOSTNAME;

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var recognizer = new builder.LuisRecognizer(LuisModelUrl);

dinbot.set(bot,builder,recognizer)
dinbot.setPrompts()
dinbot.setDialogs()

var intents = new builder.IntentDialog({ recognizers: [recognizer] })

.matches('Saludo', function(session){
    session.beginDialog('Saludo');
})
.matches('Ayuda', function(session){
    session.beginDialog('Ayuda');
})

/*
.matches('Cancelar', function(session){
    //session.beginDialog('Cancelar');
})
*/

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
    session.beginDialog('RegistroCivilInfoGeneral');
})
.matches('SPS.EstadoPago', function(session){
    dinbot.beginDialog('SPSEstadoPago',session);
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
bot.dialog('Ayuda', [
    function (session, args, next) {
        session.endDialog('Ha consultado por ayuda, por ahora solo puedo obtener la información del Tramo y el Grupo Familiar en RSH.\n!Pronto tendré más opciones!.');
    },
]);
bot.dialog('Despedida', [
    function (session, args, next) {
        session.endConversation('Ha sido un placer ayudarle. ¡Que tenga un buen día! 👋👾',session.message.text);
    },
]);