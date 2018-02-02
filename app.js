/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/


var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
const soap = require('soap')
var Rut = require('rutjs')


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
bot.set('storage', tableStorage);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
.matches('Saludo', function(session){
    session.beginDialog('Saludo');
})
.matches('Ayuda', function(session){
    session.beginDialog('Ayuda');
})
.matches('Cancelar', function(session){
    session.beginDialog('Cancelar');
})
.matches('Despedida', function(session){
    session.beginDialog('Despedida');
})
.matches('RSH.ObtenerTramoRsh', function(session, args){
    session.beginDialog('ObtenerTramoRsh', args);
})
.matches('ObtenergrupofamiliarRSH', function(session){
    session.beginDialog('ObtenergrupofamiliarRSH');
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
        session.endDialog('has llegado hasta la intención [Saludo], lo que tú has dicho fue \'%s\'.', session.message.text)
    },
]);

bot.dialog('Ayuda', [
    function (session, args, next) {
        session.endDialog('has llegado hasta la intención [Ayuda], lo que tú has dicho fue  \'%s\'.', session.message.text);
    },
]);

bot.dialog('Cancelar', [
    function (session, args, next) {
        session.endDialog('has llegado hasta la intención [Cancelar], lo que tú has dicho fue \'%s\'.', session.message.text);
    },
]);

bot.dialog('Despedida', [
    function (session, args, next) {
        session.endDialog('Hasta luego, que tengas un buen día!',session.message.text);
    },
]);

bot.dialog('ObtenerTramoRsh', [
    function (session, args, next) {
        var RUT = builder.EntityRecognizer.findEntity(args.entities, 'RUT');
        //var _RUT = entites ? entites.entity : null;

        if (!RUT) {
            builder.Prompts.ValidarRut(session, "¿Cual es el rut que quiere consultar?");
        } else {
            next({ response: RUT.entity });
        }
        //session.endDialog('has llegado hasta la intención [Obtener  tramo en RSH], lo que tú has dicho fue  \'%s\'.', session.message.text);
    },
    (session, results) => {
        console.log('.-------------------->')
        console.log(results)
        var rut = new Rut(results.response);
        var digitos = rut.rut;
        var verificador = rut.checkDigit;
        //14353664 5
        var args = { entradaRSH: { Rut: digitos, Dv: verificador, Periodo: '-1', UsSist: '1' } };
    
    
        soap.createClient('http://wsminvuni.test.minvu.cl/WSICEMds/RegistroSocialHogares.svc?singleWsdl', function (err, client) {
            setTimeout(() => {
                if(err){
                    session.send('Error al consultar RSH');
                    console.log(err)
                }
                else{
                    client['ObtenerRegistroSocialHogares' + 'Async'](args).then((result) => {
                        var tramo = result.ObtenerRegistroSocialHogaresResult.RESPUESTA.salidaRSH.RshMinvu.Tramo;
                        session.send('El tramo del rut' + rut + ' es ' + tramo, session.message.text);
                    }).catch(() => {
                        session.send('Error en la consulta del tramo de RSH');
                    });
                }
            }, 5000);
    
    
        });
        session.endDialog()
    }
]);

bot.dialog('ObtenergrupofamiliarRSH', [
    function (session, args, next) {
        session.endDialog('has llegado hasta la intención [Obtener grupo familiar en RSH ], lo que tú has dicho fue \'%s\'.', session.message.text);
    },
]);








/***
 * Genera un prompt para recibir un rut válido y retorna solo el rut
 * 
 */
var prompt = new builder.Prompt({ defaultRetryPrompt: "Lo siento. No reconozco el rut. Intente nuevamente." })
    .onRecognize(function (context, callback) {
        // Call prompts recognizer
        recognizer.recognize(context, function (err, result) {
            if (result && result.intent !== 'Cancelar') {
                //regex para detectar rut entre texto
                const regex = /(0?[1-9]{1,2})(((\.\d{3}){2,}\-)|((\d{3}){2,}\-)|((\d{3}){2,}))([\dkK])/g;
                //obtiene los grupos reconocidos según el regex
                var groups = (new RegExp(regex)).exec(context.message.text)
                //en caso de obtener los grupos validos del regex en el texto se genera como rut para validar, en caso contrario no se encuentra rut.
                var RutValido = groups ? new Rut(groups[0]).validate() : false;

                if (RutValido) callback(null, 1, groups[0]);
                else callback(null, 0.0);
            }
            else {
                callback(null, 1, 'cancel');
            }
        });
    });
// Add your prompt as a dialog to your bot
bot.dialog('ValidarRut', prompt);

// Add function for calling your prompt from anywhere
builder.Prompts.ValidarRut = function (session, prompt, options) {
    var args = options || {};
    args.prompt = prompt || options.prompt;
    session.beginDialog('ValidarRut', args);
}