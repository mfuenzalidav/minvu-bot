var Rut = require('rutjs')

var CustomPrompts = {
    setPrompts: function (bot, builder, recognizer) {
        setPromptRutValidador(bot,builder,recognizer)
    }
}
module.exports = CustomPrompts

function setPromptRutValidador(bot, builder, recognizer) {
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
    
}

