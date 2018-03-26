
var dialogs         = require('./dialogs')
var customprompts   = require('./prompts')
var util            = require('util');

var Dinbot = {
    set: function (bot, builder, recognizer) {
        this.bot = bot
        this.builder = builder
        this.recognizer = recognizer
    },
    setDialogs: function () {
        dialogs.getDialogs(this.builder, this.bot).forEach(element => {
            this.bot.dialog(element.dialogId, element.dialog)
        });
    },
    beginDialog: function (dialogId, session, args) {
        if (!util.isNullOrUndefined(this.bot.findDialog('*', dialogId)))
            session.beginDialog(dialogId, args)
        else
            session.send('Lo lamento, no puedo ayudarte con esta consulta.')
    },
    setPrompts: function(){
        customprompts.setPrompts(this.bot,this.builder,this.recognizer)
    }

}

module.exports = Dinbot;