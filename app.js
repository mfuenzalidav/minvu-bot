/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/


var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
const soap = require('soap')
var Rut = require('rutjs')
var dinbot = require('./extensions/dinbot')
require('dotenv').config()

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
//bot.set('storage', tableStorage);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
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
    session.beginDialog('ObtenergrupofamiliarRSH');
})
.matches('SPS.EstadoPago', function(session){
    dinbot.beginDialog('SPSEstadoPago',session);
})
.onDefault((session) => {
    session.send('lo lamento, no entiendo lo que has dicho \'%s\'.', session.message.text);
});

/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/

bot.dialog('/', intents);  

bot.dialog('Saludo', [
    function (session, args, next) {
        session.endDialog('Hola. ¿en qué puedo ayudarle?')
    },
]);

bot.dialog('Ayuda', [
    function (session, args, next) {
        session.endDialog('Ha consultado por ayuda, por ahora solo puedo obtener la información del tramo en RSH.\n!Pronto tendré más opciones!.');
    },
]);
/*
bot.dialog('Cancelar', [
    function (session, args, next) {
        session.endDialog('Ha solicitado cancelar la acción');
    },
]);
*/
bot.dialog('Despedida', [
    function (session, args, next) {
        session.endConversation('Hasta luego, !que tenga un buen día!',session.message.text);
    },
]);

bot.dialog('ObtenergrupofamiliarRSH', [
    function (session, args, next) {
        session.endDialog('Lo lamento, aún no puedo resolver esta solicitud. Consulta por ayuda para conocer mis opciones.');
    },
]);

/***
 * Genera un prompt para recibir un rut válido y retorna solo el rut
 * 
 */
